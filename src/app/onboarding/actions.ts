'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface SetRoleResult {
  ok: boolean;
  error?: string;
}

export async function setRoleAction(role: 'SCHOOL_ADMIN' | 'STAFF'): Promise<SetRoleResult> {
  const session = await auth();

  if (!session?.user?.email) {
    return { ok: false, error: 'No autenticado' };
  }

  const email = session.user.email.toLowerCase().trim();
  const name = session.user.name || (role === 'SCHOOL_ADMIN' ? 'Director(a)' : 'Personal de Portería');

  try {
    await prisma.user.upsert({
      where: { email },
      update: {
        role,
        // Si es STAFF sin escuela aún, su estado es PENDING
        status: role === 'STAFF' ? 'PENDING' : 'ACTIVE',
      },
      create: {
        email,
        name,
        role,
        status: role === 'STAFF' ? 'PENDING' : 'ACTIVE',
      },
    });

    revalidatePath('/onboarding');
    return { ok: true };
  } catch (err) {
    console.error('Error al configurar rol en onboarding:', err);
    return { ok: false, error: 'No se pudo guardar la selección de rol.' };
  }
}

