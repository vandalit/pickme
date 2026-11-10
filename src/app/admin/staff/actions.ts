'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { resolveUserSchool } from '@/lib/userSchool';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export interface StaffActionResult {
  success: boolean;
  error?: string;
}

export interface InvitationActionResult {
  success: boolean;
  token?: string;
  inviteUrl?: string;
  error?: string;
}

/**
 * Genera una invitación con token para un miembro de staff.
 */
export async function createStaffInvitationAction(
  email: string
): Promise<InvitationActionResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'No tienes una sesión activa.' };
  }

  const callerRole = session.user.role;
  if (callerRole !== 'SCHOOL_ADMIN') {
    return { success: false, error: 'Solo un Director puede emitir invitaciones.' };
  }

  const { school } = await resolveUserSchool(session.user.email);
  if (!school) {
    return { success: false, error: 'No se encontró el colegio asociado.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { success: false, error: 'El correo electrónico es obligatorio.' };
  }

  // Verificar si ya es usuario activo
  const existingMembership = await prisma.schoolMembership.findFirst({
    where: {
      schoolId: school.id,
      status: 'ACTIVE',
      user: { email: normalizedEmail },
    },
  });
  if (existingMembership) {
    return { success: false, error: 'Este usuario ya es miembro activo del colegio.' };
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 horas

  await prisma.invitation.create({
    data: {
      schoolId: school.id,
      email: normalizedEmail,
      role: 'STAFF',
      token,
      expiresAt,
    },
  });

  revalidatePath('/admin/staff');
  return {
    success: true,
    token,
    inviteUrl: `/staff/join?token=${token}`,
  };
}

/**
 * Acepta una solicitud de invitación pendiente (por ejemplo originada desde staff/join).
 */
export async function acceptInvitationAction(invitationId: string): Promise<StaffActionResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'No tienes una sesión activa.' };
  }

  const callerRole = session.user.role;
  if (callerRole !== 'SCHOOL_ADMIN') {
    return { success: false, error: 'Solo un Director puede aprobar solicitudes.' };
  }

  const { school } = await resolveUserSchool(session.user.email);
  if (!school) {
    return { success: false, error: 'No se encontró el colegio asociado.' };
  }

  const invite = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invite || invite.schoolId !== school.id) {
    return { success: false, error: 'Invitación no encontrada.' };
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email: invite.email },
      update: {},
      create: {
        email: invite.email,
        name: invite.email.split('@')[0],
        onboardingRole: invite.role,
      },
    });

    const existingMembership = await tx.schoolMembership.findUnique({
      where: {
        userId_schoolId: { userId: user.id, schoolId: school.id },
      },
    });
    if (
      existingMembership?.status === 'ACTIVE' &&
      existingMembership.role !== invite.role
    ) {
      await tx.membershipPeriod.updateMany({
        where: { membershipId: existingMembership.id, endedAt: null },
        data: { endedAt: new Date() },
      });
    }

    const membership = await tx.schoolMembership.upsert({
      where: {
        userId_schoolId: { userId: user.id, schoolId: school.id },
      },
      update: { role: invite.role, status: 'ACTIVE' },
      create: {
        userId: user.id,
        schoolId: school.id,
        role: invite.role,
        status: 'ACTIVE',
      },
    });

    const openPeriod = await tx.membershipPeriod.findFirst({
      where: { membershipId: membership.id, endedAt: null },
    });
    if (!openPeriod) {
      await tx.membershipPeriod.create({
        data: { membershipId: membership.id, role: membership.role },
      });
    }

    await tx.invitation.update({
      where: { id: invitationId },
      data: { acceptedAt: new Date() },
    });
  });

  revalidatePath('/admin/staff');
  return { success: true };
}

/**
 * Rechaza o elimina una invitación pendiente.
 */
export async function rejectInvitationAction(invitationId: string): Promise<StaffActionResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'No tienes una sesión activa.' };
  }

  const callerRole = session.user.role;
  if (callerRole !== 'SCHOOL_ADMIN') {
    return { success: false, error: 'Solo un Director puede rechazar solicitudes.' };
  }

  const { school } = await resolveUserSchool(session.user.email);
  if (!school) {
    return { success: false, error: 'No se encontró el colegio asociado.' };
  }

  const invite = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invite || invite.schoolId !== school.id) {
    return { success: false, error: 'Invitación no encontrada.' };
  }

  await prisma.invitation.delete({
    where: { id: invitationId },
  });

  revalidatePath('/admin/staff');
  return { success: true };
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

  const callerRole = session.user.role;
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

  const activated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: {
        email: normalizedEmail,
        name: name.trim(),
        onboardingRole: 'STAFF',
      },
    });

    const existing = await tx.schoolMembership.findUnique({
      where: {
        userId_schoolId: { userId: user.id, schoolId: school.id },
      },
    });
    if (existing?.status === 'ACTIVE') {
      return false;
    }

    const membership = await tx.schoolMembership.upsert({
      where: {
        userId_schoolId: { userId: user.id, schoolId: school.id },
      },
      update: { role: 'STAFF', status: 'ACTIVE' },
      create: {
        userId: user.id,
        schoolId: school.id,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    });

    const openPeriod = await tx.membershipPeriod.findFirst({
      where: { membershipId: membership.id, endedAt: null },
    });
    if (!openPeriod) {
      await tx.membershipPeriod.create({
        data: { membershipId: membership.id, role: membership.role },
      });
    }
    return true;
  });

  if (!activated) {
    return { success: false, error: 'Ese correo ya está registrado como miembro activo en tu institución.' };
  }

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

  const callerRole = session.user.role;
  if (callerRole !== 'SCHOOL_ADMIN') {
    return { success: false, error: 'Solo un Director puede eliminar personal de portón.' };
  }

  const { school } = await resolveUserSchool(session.user.email);
  if (!school) {
    return { success: false, error: 'No se encontró el colegio asociado a tu cuenta.' };
  }

  const target = await prisma.schoolMembership.findFirst({
    where: { userId, schoolId: school.id, role: 'STAFF', status: 'ACTIVE' },
  });

  if (!target) {
    return { success: false, error: 'No se encontró ese miembro en tu equipo.' };
  }

  await prisma.$transaction([
    prisma.membershipPeriod.updateMany({
      where: { membershipId: target.id, endedAt: null },
      data: { endedAt: new Date() },
    }),
    prisma.schoolMembership.update({
      where: { id: target.id },
      data: { status: 'SUSPENDED' },
    }),
  ]);

  revalidatePath('/admin/staff');
  return { success: true };
}
