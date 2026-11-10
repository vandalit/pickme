'use server';

import { auth, unstable_update } from '@/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ACTIVE_SCHOOL_COOKIE } from '@/lib/userSchool';
import { cookies } from 'next/headers';

export interface OnboardingState {
  error?: string;
  success?: boolean;
}

export async function completeOnboardingAction(
  _prevState: OnboardingState | null,
  formData: FormData
): Promise<OnboardingState> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  const schoolName = (formData.get('schoolName') as string | null)?.trim();
  const address = (formData.get('address') as string | null)?.trim() || null;
  const emergencyPhone = (formData.get('emergencyPhone') as string | null)?.trim() || null;
  const adminName = (formData.get('adminName') as string | null)?.trim() || session.user.name || 'Director(a)';

  if (!schoolName || schoolName.length < 3) {
    return {
      error: 'El nombre del establecimiento debe tener al menos 3 caracteres.',
    };
  }

  const normalizedEmail = session.user.email.toLowerCase().trim();

  try {
    // 1. Crear el nuevo colegio con sus dos cursos base iniciales por diseño
    const newSchool = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email: normalizedEmail },
        include: { memberships: { where: { status: 'ACTIVE' } } },
      });
      if (!user) throw new Error('Authenticated user not found in the database.');
      const canCreateSchool =
        user.memberships.some((membership) => ['SCHOOL_ADMIN', 'SUPERADMIN'].includes(membership.role)) ||
        (!user.memberships.length && user.onboardingRole === 'SCHOOL_ADMIN');
      if (!canCreateSchool) {
        throw new Error('Only a school administrator can create another school.');
      }

      const school = await tx.school.create({
        data: {
          name: schoolName,
          address,
          emergencyPhone,
          qrRefreshSecs: 300,
          classrooms: {
            create: [
              { grade: '1° Básico', section: 'A' },
              { grade: '2° Básico', section: 'A' },
            ],
          },
        },
      });

      const membership = await tx.schoolMembership.create({
        data: {
          userId: user.id,
          schoolId: school.id,
          role: 'SCHOOL_ADMIN',
          status: 'ACTIVE',
          periods: { create: { role: 'SCHOOL_ADMIN' } },
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { name: adminName, onboardingRole: null },
      });

      return { ...school, membership };
    });

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_SCHOOL_COOKIE, newSchool.id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.VERCEL === '1',
      path: '/',
    });
    await unstable_update({});

    revalidatePath('/admin');
    revalidatePath('/admin/cursos');
  } catch (error: any) {
    console.error('[completeOnboardingAction] Error al guardar colegio en BD:', error);
    return {
      error: 'No se pudo registrar el colegio en la base de datos. Por favor reintenta en unos instantes.',
    };
  }

  // Redirigir a la gestión de cursos con el nuevo colegio configurado
  redirect('/admin/cursos?onboarded=1');
}
