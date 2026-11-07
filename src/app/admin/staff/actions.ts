'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { resolveUserSchool } from '@/lib/userSchool';
import { revalidatePath } from 'next/cache';

export interface StaffActionResult {
  success: boolean;
  error?: string;
}

/**
 * Registra un nuevo miembro de staff asociado al colegio del director autenticado.
 * Si el email ya existe en BD con otra escuela, retorna error.
 */
export async function createStaffMemberAction(
  name: string,
  email: string
): Promise<StaffActionResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'No tienes una sesión de usuario activa.' };
  }

  const callerRole = (session.user as any).role as string | undefined;
  if (callerRole !== 'SCHOOL_ADMIN') {
    return { success: false, error: 'Solo un Director puede registrar personal de portón.' };
  }

  const { school, needsOnboarding } = await resolveUserSchool(session.user.email);
  if (needsOnboarding || !school) {
    return { success: false, error: 'No se encontró el colegio asociado a tu cuenta.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !name.trim()) {
    return { success: false, error: 'Nombre y correo son obligatorios.' };
  }

  // Verificar que no exista ya con ese email
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    if (existing.schoolId !== school.id) {
      return { success: false, error: 'Ese correo ya está registrado en otra institución.' };
    }
    if (existing.role === 'STAFF') {
      return { success: false, error: 'Ese correo ya está registrado como personal de portón.' };
    }
    return { success: false, error: 'Ese correo ya existe con otro rol en tu institución.' };
  }

  await prisma.user.create({
    data: {
      schoolId: school.id,
      email: normalizedEmail,
      name: name.trim(),
      role: 'STAFF',
    },
  });

  revalidatePath('/admin/staff');
  return { success: true };
}

/**
 * Elimina un miembro de staff del colegio del director autenticado.
 * Solo elimina si pertenece al mismo colegio y tiene role STAFF.
 */
export async function deleteStaffMemberAction(userId: string): Promise<StaffActionResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'No tienes una sesión de usuario activa.' };
  }

  const callerRole = (session.user as any).role as string | undefined;
  if (callerRole !== 'SCHOOL_ADMIN') {
    return { success: false, error: 'Solo un Director puede eliminar personal de portón.' };
  }

  const { school } = await resolveUserSchool(session.user.email);
  if (!school) {
    return { success: false, error: 'No se encontró el colegio asociado a tu cuenta.' };
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, schoolId: school.id, role: 'STAFF' },
  });

  if (!target) {
    return { success: false, error: 'No se encontró ese miembro en tu equipo.' };
  }

  await prisma.user.delete({ where: { id: target.id } });

  revalidatePath('/admin/staff');
  return { success: true };
}

