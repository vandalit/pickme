'use server';

import { auth, unstable_update } from '@/auth';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { ACTIVE_SCHOOL_COOKIE } from '@/lib/userSchool';

export interface JoinActionResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

/**
 * Staff solicita unirse a un colegio seleccionado de la lista.
 * Crea una invitación pendiente de aprobación por el colegio.
 */
export async function requestJoinSchoolAction(schoolId: string): Promise<JoinActionResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'No autenticado.' };
  }

  const email = session.user.email.toLowerCase().trim();

  // Verificar que el colegio existe
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) {
    return { success: false, error: 'El colegio seleccionado no existe.' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: 'No se encontró tu identidad de usuario. Vuelve a iniciar sesión.' };
  }

  const existingMembership = await prisma.schoolMembership.findUnique({
    where: { userId_schoolId: { userId: user.id, schoolId } },
  });
  if (existingMembership?.status === 'ACTIVE') {
    return { success: false, error: 'Ya perteneces a este colegio.' };
  }

  // Verificar si ya tiene una invitación para este colegio
  const existingInvite = await prisma.invitation.findFirst({
    where: {
      email,
      schoolId,
      acceptedAt: null,
    },
  });

  if (existingInvite) {
    return { success: true, error: 'Ya tienes una solicitud pendiente para este colegio.' };
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días para solicitudes

  await prisma.$transaction(async (tx) => {
    await tx.schoolMembership.upsert({
      where: { userId_schoolId: { userId: user.id, schoolId } },
      update: { role: 'STAFF', status: 'PENDING' },
      create: {
        userId: user.id,
        schoolId,
        role: 'STAFF',
        status: 'PENDING',
      },
    });
    await tx.invitation.create({
      data: {
        schoolId,
        email,
        role: 'STAFF',
        token,
        expiresAt,
      },
    });
  });

  revalidatePath('/staff/join');
  return { success: true };
}

/**
 * Acepta una invitación mediante token directo (/staff/join?token=xxxx)
 */
export async function acceptTokenInvitationAction(token: string): Promise<JoinActionResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Debes iniciar sesión para aceptar la invitación.' };
  }

  const email = session.user.email.toLowerCase().trim();

  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { school: true },
  });

  if (!invite) {
    return { success: false, error: 'El enlace de invitación no es válido o ya no existe.' };
  }

  if (invite.acceptedAt) {
    return { success: true, redirectTo: '/staff' };
  }

  if (new Date() > invite.expiresAt) {
    return { success: false, error: 'La invitación ha expirado. Solicita un nuevo enlace al director.' };
  }

  // Si la invitación fue dirigida a un correo específico y no coincide
  if (invite.email && invite.email !== email) {
    return {
      success: false,
      error: `Esta invitación fue enviada a ${invite.email}, pero iniciaste sesión como ${email}.`,
    };
  }

  const authenticatedName = session.user?.name || email.split('@')[0];

  // Activar y vincular al usuario
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: authenticatedName,
        onboardingRole: invite.role,
      },
    });

    const existingMembership = await tx.schoolMembership.findUnique({
      where: {
        userId_schoolId: { userId: user.id, schoolId: invite.schoolId },
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
        userId_schoolId: { userId: user.id, schoolId: invite.schoolId },
      },
      update: { role: invite.role, status: 'ACTIVE' },
      create: {
        userId: user.id,
        schoolId: invite.schoolId,
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
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SCHOOL_COOKIE, invite.schoolId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.VERCEL === '1',
    path: '/',
  });
  await unstable_update({});

  revalidatePath('/staff');
  return { success: true, redirectTo: '/staff' };
}
