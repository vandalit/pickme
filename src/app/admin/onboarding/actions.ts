'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

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
    // 1. Crear el nuevo colegio
    const newSchool = await prisma.school.create({
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

    // 2. Asociar al usuario autenticado como SCHOOL_ADMIN de este colegio
    await prisma.user.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        name: adminName,
        role: 'SCHOOL_ADMIN',
        schoolId: newSchool.id,
      },
      update: {
        name: adminName,
        role: 'SCHOOL_ADMIN',
        schoolId: newSchool.id,
      },
    });

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
