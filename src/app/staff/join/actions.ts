'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

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

  await prisma.invitation.create({
    data: {
      schoolId,
      email,
      role: 'STAFF',
      token,
      expiresAt,
    },
  });

  // Asegurar que el usuario tenga status PENDING en este momento
  await prisma.user.upsert({
    where: { email },
    update: {
      role: 'STAFF',
      status: 'PENDING',
    },
    create: {
      email,
      name: session.user.name || email.split('@')[0],
      role: 'STAFF',
      status: 'PENDING',
    },
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

  // Activar y vincular al usuario
  await prisma.user.upsert({
    where: { email },
    update: {
      schoolId: invite.schoolId,
      role: invite.role,
      status: 'ACTIVE',
    },
    create: {
      email,
      name: session.user.name || email.split('@')[0],
      schoolId: invite.schoolId,
      role: invite.role,
      status: 'ACTIVE',
    },
  });

  // Marcar invitación como aceptada
  await prisma.invitation.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  revalidatePath('/staff');
  return { success: true, redirectTo: '/staff' };
}

