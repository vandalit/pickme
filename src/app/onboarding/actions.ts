'use server';

import { auth, unstable_update } from '@/auth';
import { prisma } from '@/lib/db';

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
        onboardingRole: role,
      },
      create: {
        email,
        name,
        onboardingRole: role,
      },
    });
    await unstable_update({});
    return { ok: true };
  } catch (err) {
    console.error('Error al configurar rol en onboarding:', err);
    return { ok: false, error: 'No se pudo guardar la selección de rol.' };
  }
}
