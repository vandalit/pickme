'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { resolveUserSchool } from '@/lib/userSchool';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

export interface TransportActionResult {
  success: boolean;
  error?: string;
}

/**
 * Registra un nuevo servicio de furgón / transporte escolar.
 */
export async function createTransportServiceAction(
  name: string,
  driverName: string,
  driverPhone: string,
  plateNumber?: string
): Promise<TransportActionResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'No autenticado.' };
  }

  const { school } = await resolveUserSchool(session.user.email);
  if (!school) {
    return { success: false, error: 'Establecimiento educacional no encontrado.' };
  }

  if (!name.trim() || !driverName.trim() || !driverPhone.trim()) {
    return { success: false, error: 'Nombre, chofer y teléfono son obligatorios.' };
  }

  const weeklyToken = randomUUID();
  const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

  await prisma.transportService.create({
    data: {
      schoolId: school.id,
      name: name.trim(),
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      plateNumber: plateNumber?.trim().toUpperCase() || null,
      weeklyToken,
      tokenExpiresAt,
    },
  });

  revalidatePath('/admin/cursos');
  return { success: true };
}

/**
 * Asigna un alumno a un furgón escolar (o lo remueve con transportId = null).
 */
export async function assignStudentToTransportAction(
  studentId: string,
  transportId: string | null
): Promise<TransportActionResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'No autenticado.' };
  }

  const { school } = await resolveUserSchool(session.user.email);
  if (!school) {
    return { success: false, error: 'Establecimiento educacional no encontrado.' };
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, classroom: { schoolId: school.id } },
  });

  if (!student) {
    return { success: false, error: 'Alumno no encontrado en este colegio.' };
  }

  await prisma.student.update({
    where: { id: student.id },
    data: { transportId },
  });

  revalidatePath('/admin/cursos');
  return { success: true };
}

/**
 * Habilita un Chofer de Reemplazo temporal para el día (sustituto de Don Pedro).
 */
export async function enableTempDriverAction(
  transportId: string,
  tempDriverName: string,
  tempDriverPhone: string
): Promise<TransportActionResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'No autenticado.' };
  }

  const { school } = await resolveUserSchool(session.user.email);
  if (!school) {
    return { success: false, error: 'Establecimiento educacional no encontrado.' };
  }

  const transport = await prisma.transportService.findFirst({
    where: { id: transportId, schoolId: school.id },
  });

  if (!transport) {
    return { success: false, error: 'Servicio de transporte no encontrado.' };
  }

  const tempToken = randomUUID();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  await prisma.transportService.update({
    where: { id: transport.id },
    data: {
      tempDriverName: tempDriverName.trim(),
      tempDriverPhone: tempDriverPhone.trim(),
      tempDriverToken: tempToken,
      tempDriverExpiresAt: endOfDay,
    },
  });

  revalidatePath('/admin/cursos');
  return { success: true };
}

