'use server';

import { auth, unstable_update } from '@/auth';
import { ACTIVE_SCHOOL_COOKIE } from '@/lib/userSchool';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function selectWorkspaceAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const schoolId = String(formData.get('schoolId') || '');
  if (!schoolId) {
    throw new Error('Debes seleccionar un colegio.');
  }

  const membership = await prisma.schoolMembership.findFirst({
    where: {
      userId: session.user.id,
      schoolId,
      status: 'ACTIVE',
    },
    select: { role: true },
  });

  if (!membership) {
    throw new Error('No tienes una membresía activa en ese colegio.');
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SCHOOL_COOKIE, schoolId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.VERCEL === '1',
    path: '/',
  });

  await unstable_update({});
  redirect(membership.role === 'STAFF' ? '/staff' : '/admin');
}
