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
  reuseExistingGuardian?: boolean;
  pickerName?: string;
  pickerRelationship?: string;
  pickerPhone?: string;
  status?: 'ACTIVE' | 'ABSENT' | 'WITHDRAWN';
}): Promise<{
  success: boolean;
  error?: string;
  student?: any;
  guardianName?: string;
  guardianConflict?: { existingName: string };
}> {
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
    const classroom = await prisma.classroom.findFirst({
      where: { id: data.classroomId, schoolId: school.id },
      select: { id: true },
    });
    if (!classroom) {
      return { success: false, error: 'El curso no pertenece a tu establecimiento.' };
    }

    const matchingGuardian = await prisma.guardian.findUnique({
      where: {
        schoolId_whatsappNumber: {
          schoolId: school.id,
          whatsappNumber: cleanGuardianPhone,
        },
      },
    });
    if (matchingGuardian && !data.reuseExistingGuardian) {
      return {
        success: false,
        guardianConflict: { existingName: matchingGuardian.fullName },
      };
    }

    // 1. Obtener los avatares ya utilizados en esta sala para garantizar cero colisiones
    const existingStudentsInClass = await prisma.student.findMany({
      where: { classroomId: data.classroomId },
      select: { animalId: true, colorId: true },
    });

    const assignedAvatar = assignNextAvailableAvatar(existingStudentsInClass);
    const initials = extractInitials(cleanFullName);

    // 2. Buscar o crear el apoderado titular
    const guardian = matchingGuardian ?? await prisma.guardian.create({
      data: {
        schoolId: school.id,
        fullName: cleanGuardianName,
        whatsappNumber: cleanGuardianPhone,
      },
    });

    // 3. Crear el alumno con su avatar asignado
    const student = await prisma.student.create({
      data: {
        classroomId: data.classroomId,
        fullName: cleanFullName,
        initials,
        animalId: assignedAvatar.animalId,
        colorId: assignedAvatar.colorId,
        status: (data.status as any) || 'ABSENT',
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
        where: {
          schoolId_whatsappNumber: {
            schoolId: school.id,
            whatsappNumber: cleanPickerPhone,
          },
        },
      });

      if (!picker) {
        picker = await prisma.picker.create({
          data: {
            schoolId: school.id,
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
    return { success: true, student, guardianName: guardian.fullName };
  } catch (err: any) {
    console.error('[createStudentAction] Error al registrar alumno:', err);
    return { success: false, error: 'Error al registrar el alumno en la base de datos.' };
  }
}

// ── 2.B ACTUALIZAR DATOS DE ALUMNO Y APODERADOS (CRUD EDICIÓN) ─────────────────
export async function updateStudentAction(data: {
  studentId: string;
  fullName: string;
  classroomId: string;
  guardianName: string;
  guardianPhone: string;
  reuseExistingGuardian?: boolean;
  pickerName?: string;
  pickerRelationship?: string;
  pickerPhone?: string;
}): Promise<{
  success: boolean;
  error?: string;
  guardianName?: string;
  guardianConflict?: { existingName: string };
}> {
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

  if (!data.studentId || !cleanFullName || !data.classroomId || !cleanGuardianName || !cleanGuardianPhone) {
    return { success: false, error: 'Todos los campos obligatorios deben ser completados.' };
  }

  try {
    const existingStudent = await prisma.student.findFirst({
      where: {
        id: data.studentId,
        classroom: { schoolId: school.id },
      },
      include: {
        guardians: { where: { isPrimary: true }, include: { guardian: true } },
        authorizations: { where: { type: 'PERMANENT' }, include: { picker: true } },
      },
    });

    if (!existingStudent) {
      return { success: false, error: 'Alumno no encontrado en este establecimiento.' };
    }

    const targetClassroom = await prisma.classroom.findFirst({
      where: { id: data.classroomId, schoolId: school.id },
      select: { id: true },
    });
    if (!targetClassroom) {
      return { success: false, error: 'El curso no pertenece a tu establecimiento.' };
    }

    const currentGuardian = existingStudent.guardians[0]?.guardian;
    const matchingGuardian = await prisma.guardian.findUnique({
      where: {
        schoolId_whatsappNumber: {
          schoolId: school.id,
          whatsappNumber: cleanGuardianPhone,
        },
      },
    });
    const isCurrentGuardian = currentGuardian?.id === matchingGuardian?.id;
    if (matchingGuardian && !isCurrentGuardian && !data.reuseExistingGuardian) {
      return {
        success: false,
        guardianConflict: { existingName: matchingGuardian.fullName },
      };
    }

    // Si cambia de curso, verificar avatar en el nuevo curso para evitar colisiones
    let animalId = existingStudent.animalId;
    let colorId = existingStudent.colorId;

    if (existingStudent.classroomId !== data.classroomId) {
      const collision = await prisma.student.findFirst({
        where: {
          classroomId: data.classroomId,
          animalId,
          colorId,
          id: { not: data.studentId },
        },
      });

      if (collision) {
        const existingInNewClass = await prisma.student.findMany({
          where: { classroomId: data.classroomId },
          select: { animalId: true, colorId: true },
        });
        const newAvatar = assignNextAvailableAvatar(existingInNewClass);
        animalId = newAvatar.animalId;
        colorId = newAvatar.colorId;
      }
    }

    const initials = extractInitials(cleanFullName);

    // 1. Actualizar o asociar apoderado titular
    let primaryGuardianRecord = currentGuardian;
    if (primaryGuardianRecord) {
      if (isCurrentGuardian) {
        await prisma.guardian.update({
          where: { id: primaryGuardianRecord.id },
          data: { fullName: cleanGuardianName },
        });
      } else {
        const newGuardian = matchingGuardian ?? await prisma.guardian.create({
          data: {
            schoolId: school.id,
            fullName: cleanGuardianName,
            whatsappNumber: cleanGuardianPhone,
          },
        });

        await prisma.studentGuardian.deleteMany({
          where: { studentId: data.studentId, isPrimary: true },
        });
        await prisma.studentGuardian.create({
          data: {
            studentId: data.studentId,
            guardianId: newGuardian.id,
            isPrimary: true,
          },
        });
        primaryGuardianRecord = newGuardian;
      }
    } else {
      const newGuardian = matchingGuardian ?? await prisma.guardian.create({
        data: {
          schoolId: school.id,
          fullName: cleanGuardianName,
          whatsappNumber: cleanGuardianPhone,
        },
      });
      await prisma.studentGuardian.create({
        data: {
          studentId: data.studentId,
          guardianId: newGuardian.id,
          isPrimary: true,
        },
      });
      primaryGuardianRecord = newGuardian;
    }

    // 2. Actualizar datos del estudiante
    await prisma.student.update({
      where: { id: data.studentId },
      data: {
        fullName: cleanFullName,
        initials,
        classroomId: data.classroomId,
        animalId,
        colorId,
      },
    });

    // 3. Retirador recurrente (Picker)
    const cleanPickerName = data.pickerName?.trim();
    const cleanPickerPhone = data.pickerPhone?.trim().replace(/\s+/g, '');
    const cleanPickerRel = data.pickerRelationship?.trim() || 'Familiar Autorizado';
    const existingPermanentAuth = existingStudent.authorizations.find((a) => a.type === 'PERMANENT');

    if (cleanPickerName && (cleanPickerPhone || cleanGuardianPhone)) {
      const pickerTargetPhone = cleanPickerPhone || cleanGuardianPhone;
      let picker = await prisma.picker.findUnique({
        where: {
          schoolId_whatsappNumber: {
            schoolId: school.id,
            whatsappNumber: pickerTargetPhone,
          },
        },
      });

      if (!picker) {
        picker = await prisma.picker.create({
          data: {
            schoolId: school.id,
            fullName: cleanPickerName,
            relationship: cleanPickerRel,
            whatsappNumber: pickerTargetPhone,
          },
        });
      } else {
        await prisma.picker.update({
          where: { id: picker.id, schoolId: school.id },
          data: {
            fullName: cleanPickerName,
            relationship: cleanPickerRel,
          },
        });
      }

      if (existingPermanentAuth) {
        await prisma.authorization.update({
          where: { id: existingPermanentAuth.id },
          data: {
            pickerId: picker.id,
            guardianId: primaryGuardianRecord.id,
            status: 'ACTIVE',
          },
        });
      } else {
        await prisma.authorization.create({
          data: {
            studentId: data.studentId,
            pickerId: picker.id,
            guardianId: primaryGuardianRecord.id,
            type: 'PERMANENT',
            status: 'ACTIVE',
          },
        });
      }
    } else if (!cleanPickerName && existingPermanentAuth) {
      await prisma.authorization.delete({
        where: { id: existingPermanentAuth.id },
      });
    }

    revalidatePath('/admin/cursos');
    return { success: true, guardianName: primaryGuardianRecord.fullName };
  } catch (err: any) {
    console.error('[updateStudentAction] Error al actualizar alumno:', err);
    return { success: false, error: err.message || 'Error al actualizar el alumno en la base de datos.' };
  }
}

// ── 2.C ELIMINAR ALUMNO (CRUD ELIMINACIÓN) ──────────────────────────────────────
export async function deleteStudentAction(
  studentId: string
): Promise<{ success: boolean; error?: string; hasHistory?: boolean }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Sesión no autenticada.' };
  }

  const { school } = await resolveUserSchool(session.user.email);
  if (!school?.id) {
    return { success: false, error: 'Establecimiento educacional no encontrado.' };
  }

  try {
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        classroom: { schoolId: school.id },
      },
      include: {
        events: { select: { id: true } },
      },
    });

    if (!student) {
      return { success: false, error: 'Alumno no encontrado en este establecimiento.' };
    }

    // Proteger trazabilidad forense: no se eliminan físicamente alumnos con historial
    if (student.events && student.events.length > 0) {
      return {
        success: false,
        hasHistory: true,
        error: `El alumno cuenta con ${student.events.length} registro(s) de custodia en la bitácora escolar. Por trazabilidad legal y auditoría, no se puede eliminar físicamente; en su lugar, cámbialo a 'Retirado (Baja)'.`,
      };
    }

    await prisma.student.delete({
      where: { id: studentId },
    });

    revalidatePath('/admin/cursos');
    return { success: true };
  } catch (err: any) {
    console.error('[deleteStudentAction] Error al eliminar alumno:', err);
    return { success: false, error: 'Error al eliminar el alumno de la base de datos.' };
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

  const { school } = await resolveUserSchool(session.user.email);
  if (!school?.id) {
    return { success: false, error: 'Establecimiento educacional no encontrado.' };
  }

  try {
    // Validar aislamiento multi-tenant: el alumno debe pertenecer a este colegio
    const targetStudent = await prisma.student.findFirst({
      where: {
        id: studentId,
        classroom: { schoolId: school.id },
      },
    });

    if (!targetStudent) {
      return { success: false, error: 'Alumno no encontrado en tu establecimiento.' };
    }

    await prisma.student.update({
      where: { id: targetStudent.id },
      data: { status: newStatus as any },
    });

    revalidatePath('/admin/cursos');
    return { success: true };
  } catch (err: any) {
    console.error('[updateStudentStatusAction] Error al actualizar estado:', err);
    return { success: false, error: 'No se pudo actualizar el estado del alumno.' };
  }
}

// ── 3C. BYPASS DE EMERGENCIA POR DIRECCIÓN / ADMIN (CUSTODIA ASUMIDA POR ADMIN) ─────
/**
 * Permite a Dirección marcar a un alumno como entregado directamente sin PIN ni staff de portón
 * (ej: caso de alumno rezagado/abandonado que se entrega en oficina o con tutor presente).
 */
export async function adminBypassDeliverStudentAction(
  studentId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Sesión no autenticada.' };
  }

  const callerRole = session.user.role;
  if (callerRole !== 'SCHOOL_ADMIN') {
    return { success: false, error: 'Solo Dirección puede ejecutar un bypass manual de custodia.' };
  }

  const { school, user } = await resolveUserSchool(session.user.email);
  if (!school?.id || !user?.id) {
    return { success: false, error: 'Establecimiento no encontrado.' };
  }

  try {
    // 1. Buscar sesión activa abierta
    const activeSession = await prisma.pickupSession.findFirst({
      where: { schoolId: school.id, status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeSession) {
      return { success: false, error: 'No hay ninguna jornada activa abierta.' };
    }

    // 2. Buscar o crear el evento de entrega del alumno
    let event = await prisma.pickupEvent.findFirst({
      where: { sessionId: activeSession.id, studentId },
    });

    const now = new Date();
    const deliveryNote = reason?.trim()
      ? `Bypass Manual de Dirección: ${reason.trim()} (Asumido por ${user.name || user.email})`
      : `Bypass Manual de Dirección: Retiro asistido por Dirección (Asumido por ${user.name || user.email})`;

    if (event) {
      await prisma.pickupEvent.update({
        where: { id: event.id },
        data: {
          status: 'IN_TRANSIT',
          staffConfirmedAt: now,
          staffId: user.id, // Queda sellado con el ID del Director
          notes: deliveryNote,
        },
      });
    } else {
      await prisma.pickupEvent.create({
        data: {
          sessionId: activeSession.id,
          studentId,
          status: 'IN_TRANSIT',
          staffConfirmedAt: now,
          staffId: user.id,
          notes: deliveryNote,
        },
      });
    }

    revalidatePath('/admin');
    revalidatePath('/admin/cursos');
    revalidatePath('/staff');
    revalidatePath(`/board/${activeSession.sessionCode}`);

    return { success: true };
  } catch (err: any) {
    console.error('[adminBypassDeliverStudentAction] Error:', err);
    return { success: false, error: 'Error interno al registrar entrega por Dirección.' };
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

  const { school } = await resolveUserSchool(session.user.email);
  if (!school?.id) {
    return { success: false, error: 'Establecimiento educacional no encontrado.' };
  }

  try {
    // Aislamiento multi-tenant: filtrar solo los IDs que pertenezcan a las aulas del colegio
    const validStudents = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        classroom: { schoolId: school.id },
      },
      select: { id: true },
    });

    const validIds = validStudents.map((s) => s.id);
    if (validIds.length === 0) {
      return { success: false, error: 'Ningún alumno seleccionado pertenece a tu institución.' };
    }

    const res = await prisma.student.updateMany({
      where: { id: { in: validIds } },
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
      } else if (res.guardianConflict) {
        executionErrors.push(
          `Alumno "${row.fullName}": el WhatsApp del apoderado ya está registrado en este colegio; revisa y confirma la asociación desde el formulario individual.`
        );
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
