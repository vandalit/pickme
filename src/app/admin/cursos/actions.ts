'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { resolveUserSchool } from '@/lib/userSchool';
import { assignNextAvailableAvatar } from '@/lib/avatarAssigner';
import { parseStudentsCSV, ParsedStudentRow } from '@/lib/csvImporter';
import { revalidatePath } from 'next/cache';

/**
 * Helper para extraer iniciales de un nombre completo.
 * Ej: "Vicente Toro Morales" -> "V.T."
 */
function extractInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A.A.';
  if (parts.length === 1) return `${parts[0].charAt(0).toUpperCase()}.`;
  return `${parts[0].charAt(0).toUpperCase()}.${parts[1].charAt(0).toUpperCase()}.`;
}

// ── 1. CREAR CURSO ─────────────────────────────────────────────────────────────
export async function createClassroomAction(
  grade: string,
  section: string
): Promise<{ success: boolean; error?: string; classroom?: any }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Sesión no autenticada.' };
  }

  const { school } = await resolveUserSchool(session.user.email);
  if (!school?.id) {
    return { success: false, error: 'Establecimiento educacional no encontrado.' };
  }

  const cleanGrade = grade.trim();
  const cleanSection = section.trim().toUpperCase();

  if (!cleanGrade || !cleanSection) {
    return { success: false, error: 'El grado y la sección son obligatorios.' };
  }

  try {
    const existing = await prisma.classroom.findUnique({
      where: {
        schoolId_grade_section: {
          schoolId: school.id,
          grade: cleanGrade,
          section: cleanSection,
        },
      },
    });

    if (existing) {
      return { success: false, error: `El curso "${cleanGrade} ${cleanSection}" ya existe en tu colegio.` };
    }

    const classroom = await prisma.classroom.create({
      data: {
        schoolId: school.id,
        grade: cleanGrade,
        section: cleanSection,
      },
    });

    revalidatePath('/admin/cursos');
    return { success: true, classroom };
  } catch (err: any) {
    console.error('[createClassroomAction] Error al crear curso:', err);
    return { success: false, error: 'Error interno al registrar el curso en la base de datos.' };
  }
}

// ── 2. CREAR ALUMNO INDIVIDUAL CON AVATAR ÚNICO ────────────────────────────────
export async function createStudentAction(data: {
  fullName: string;
  classroomId: string;
  guardianName: string;
  guardianPhone: string;
  pickerName?: string;
  pickerRelationship?: string;
  pickerPhone?: string;
  status?: 'ACTIVE' | 'ABSENT' | 'WITHDRAWN';
}): Promise<{ success: boolean; error?: string; student?: any }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Sesión no autenticada.' };
  }

  const { school } = await resolveUserSchool(session.user.email);
  if (!school?.id) {
    return { success: false, error: 'Establecimiento educacional no encontrado.' };
  }

  const cleanFullName = data.fullName.trim();
  const cleanGuardianName = data.guardianName.trim();
  const cleanGuardianPhone = data.guardianPhone.trim().replace(/\s+/g, '');

  if (!cleanFullName || !data.classroomId || !cleanGuardianName || !cleanGuardianPhone) {
    return { success: false, error: 'Nombre, curso y datos del apoderado titular son obligatorios.' };
  }

  try {
    // 1. Obtener los avatares ya utilizados en esta sala para garantizar cero colisiones
    const existingStudentsInClass = await prisma.student.findMany({
      where: { classroomId: data.classroomId },
      select: { animalId: true, colorId: true },
    });

    const assignedAvatar = assignNextAvailableAvatar(existingStudentsInClass);
    const initials = extractInitials(cleanFullName);

    // 2. Buscar o crear el apoderado titular
    let guardian = await prisma.guardian.findUnique({
      where: { whatsappNumber: cleanGuardianPhone },
    });

    if (!guardian) {
      guardian = await prisma.guardian.create({
        data: {
          fullName: cleanGuardianName,
          whatsappNumber: cleanGuardianPhone,
        },
      });
    }

    // 3. Crear el alumno con su avatar asignado
    const student = await prisma.student.create({
      data: {
        classroomId: data.classroomId,
        fullName: cleanFullName,
        initials,
        animalId: assignedAvatar.animalId,
        colorId: assignedAvatar.colorId,
        status: (data.status as any) || 'ACTIVE',
        guardians: {
          create: {
            guardianId: guardian.id,
            isPrimary: true,
          },
        },
      },
    });

    // 4. Si se especificó un retirador autorizado adicional (tío, transporte, etc.)
    if (data.pickerName && data.pickerName.trim()) {
      const cleanPickerName = data.pickerName.trim();
      const cleanRelationship = data.pickerRelationship?.trim() || 'Familiar Autorizado';
      const cleanPickerPhone = (data.pickerPhone || cleanGuardianPhone).trim().replace(/\s+/g, '');

      let picker = await prisma.picker.findUnique({
        where: { whatsappNumber: cleanPickerPhone },
      });

      if (!picker) {
        picker = await prisma.picker.create({
          data: {
            fullName: cleanPickerName,
            relationship: cleanRelationship,
            whatsappNumber: cleanPickerPhone,
          },
        });
      }

      await prisma.authorization.create({
        data: {
          studentId: student.id,
          pickerId: picker.id,
          guardianId: guardian.id,
          type: 'PERMANENT',
          status: 'ACTIVE',
        },
      });
    }

    revalidatePath('/admin/cursos');
    return { success: true, student };
  } catch (err: any) {
    console.error('[createStudentAction] Error al registrar alumno:', err);
    return { success: false, error: 'Error al registrar el alumno en la base de datos.' };
  }
}

// ── 3. ACTUALIZAR ESTADO DEL ALUMNO (ACTIVO / AUSENTE HOY / RETIRADO) ──────────
export async function updateStudentStatusAction(
  studentId: string,
  newStatus: 'ACTIVE' | 'ABSENT' | 'WITHDRAWN'
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Sesión no autenticada.' };
  }

  try {
    await prisma.student.update({
      where: { id: studentId },
      data: { status: newStatus as any },
    });

    revalidatePath('/admin/cursos');
    return { success: true };
  } catch (err: any) {
    console.error('[updateStudentStatusAction] Error al actualizar estado:', err);
    return { success: false, error: 'No se pudo actualizar el estado del alumno.' };
  }
}

// ── 3B. ACTUALIZACIÓN MASIVA DE ASISTENCIA DIARIA ──────────────────────────────
export async function batchUpdateAttendanceAction(
  studentIds: string[],
  newStatus: 'ACTIVE' | 'ABSENT'
): Promise<{ success: boolean; count?: number; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Sesión no autenticada.' };
  }

  try {
    const res = await prisma.student.updateMany({
      where: { id: { in: studentIds } },
      data: { status: newStatus as any },
    });
    revalidatePath('/admin/cursos');
    revalidatePath('/admin');
    return { success: true, count: res.count };
  } catch (err: any) {
    console.error('[batchUpdateAttendanceAction] Error al actualizar asistencia en lote:', err);
    return { success: false, error: 'Error al actualizar asistencia masiva.' };
  }
}

// ── 4. IMPORTACIÓN MASIVA VIA CSV/EXCEL ─────────────────────────────────────────
export async function importStudentsCsvAction(
  csvContent: string
): Promise<{ success: boolean; importedCount: number; errors: string[] }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, importedCount: 0, errors: ['Sesión no autenticada.'] };
  }

  const { school } = await resolveUserSchool(session.user.email);
  if (!school?.id) {
    return { success: false, importedCount: 0, errors: ['Establecimiento educacional no encontrado.'] };
  }

  const parseResult = parseStudentsCSV(csvContent);
  if (parseResult.validRows.length === 0) {
    return {
      success: false,
      importedCount: 0,
      errors: parseResult.errors.length > 0 ? parseResult.errors : ['No se encontraron filas válidas para importar.'],
    };
  }

  let importedCount = 0;
  const executionErrors: string[] = [...parseResult.errors];

  for (const row of parseResult.validRows) {
    try {
      // 1. Separar Grado y Sección (ej: "1° Básico A" -> grade: "1° Básico", section: "A")
      const parts = row.gradeSection.trim().split(/\s+/);
      const section = parts.pop()?.toUpperCase() || 'A';
      const grade = parts.join(' ') || '1° Básico';

      // 2. Buscar o crear el curso en el colegio
      let classroom = await prisma.classroom.findUnique({
        where: {
          schoolId_grade_section: {
            schoolId: school.id,
            grade,
            section,
          },
        },
      });

      if (!classroom) {
        classroom = await prisma.classroom.create({
          data: {
            schoolId: school.id,
            grade,
            section,
          },
        });
      }

      // 3. Crear el alumno reutilizando la lógica sin colisiones
      const res = await createStudentAction({
        fullName: row.fullName,
        classroomId: classroom.id,
        guardianName: row.guardianName,
        guardianPhone: row.guardianPhone,
        pickerName: row.pickerName,
        pickerRelationship: row.pickerRelationship,
        status: row.status,
      });

      if (res.success) {
        importedCount++;
      } else {
        executionErrors.push(`Alumno "${row.fullName}": ${res.error}`);
      }
    } catch (err: any) {
      executionErrors.push(`Fila "${row.fullName}": ${err.message || 'Error inesperado'}`);
    }
  }

  revalidatePath('/admin/cursos');
  return {
    success: importedCount > 0,
    importedCount,
    errors: executionErrors,
  };
}

