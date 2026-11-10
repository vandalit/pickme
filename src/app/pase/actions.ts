'use server';

import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

export interface DailyPassResult {
  success: boolean;
  passUrl?: string;
  pinCode?: string;
  error?: string;
}

/**
 * Genera un Pase Diario de Emergencia (ej: Carmen Silva retirando hoy).
 * Permite al apoderado delegar a un tercero por el día con código PIN configurable.
 */
export async function createDailyPassAction(
  studentId: string,
  guardianPhone: string,
  pickerName: string,
  relationship: string
): Promise<DailyPassResult> {
  const cleanPhone = guardianPhone.trim().replace(/[\s-]/g, '');
  if (cleanPhone.replace(/\D/g, '').length < 8) {
    return { success: false, error: 'Ingresa un número telefónico válido.' };
  }

  // 1. Resolve the student first so guardian lookup is scoped to that school.
  const student = await prisma.student.findFirst({
    where: { id: studentId },
    include: { classroom: { select: { schoolId: true } } },
  });
  if (!student) {
    return { success: false, error: 'No se encontró el alumno indicado.' };
  }
  const schoolId = student.classroom.schoolId;

  // Exact match wins; suffix matching is only a fallback for formatted legacy numbers.
  let guardian = await prisma.guardian.findUnique({
    where: { schoolId_whatsappNumber: { schoolId, whatsappNumber: cleanPhone } },
  });
  if (!guardian) {
    const matches = await prisma.guardian.findMany({
      where: {
        schoolId,
        whatsappNumber: { contains: cleanPhone.slice(-8) },
      },
      take: 2,
    });
    if (matches.length > 1) {
      return { success: false, error: 'Hay más de un apoderado con un número coincidente. Usa el número completo.' };
    }
    guardian = matches[0] ?? null;
  }
  if (!guardian) {
    return { success: false, error: 'No se encontró un apoderado titular con este número en el colegio del alumno.' };
  }

  // 2. Verify the guardian is linked to this student.
  const link = await prisma.studentGuardian.findFirst({
    where: { studentId, guardianId: guardian.id },
    include: {
      student: {
        include: {
          classroom: {
            include: { school: true },
          },
        },
      },
    },
  });

  if (!link) {
    return { success: false, error: 'No tienes permisos de tutor legal sobre este alumno.' };
  }

  const school = link.student.classroom.school;
  const pinLength = school.pinLength || 3;

  // Generar PIN según longitud configurada por el colegio (2, 3 o 6 dígitos)
  const minPin = Math.pow(10, pinLength - 1);
  const maxPin = Math.pow(10, pinLength) - 1;
  const pinCode = Math.floor(minPin + Math.random() * (maxPin - minPin + 1)).toString();

  const passToken = randomUUID();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  await prisma.dailyPass.create({
    data: {
      schoolId: school.id,
      studentId,
      guardianId: guardian.id,
      pickerName: pickerName.trim(),
      relationship: relationship.trim(),
      passToken,
      pinCode,
      validForDate: endOfDay,
    },
  });

  const passUrl = `/pase/${passToken}`;
  revalidatePath('/staff');
  return { success: true, passUrl, pinCode };
}

/**
 * Revoca un Pase Diario en tiempo real (Arrepentimiento o cambio de planes del apoderado).
 */
export async function revokeDailyPassAction(passToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const pass = await prisma.dailyPass.findUnique({
      where: { passToken },
    });

    if (!pass) {
      return { success: false, error: 'Pase no encontrado.' };
    }

    await prisma.dailyPass.update({
      where: { id: pass.id },
      data: { isRevoked: true },
    });

    revalidatePath('/staff');
    revalidatePath(`/pase/${passToken}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'No se pudo revocar el pase.' };
  }
}
