import React from 'react';
import type { Metadata } from 'next';
import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/db';
import { resolveUserSchool } from '@/lib/userSchool';
import { AdminNav } from '@/components/admin/AdminNav';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'PickMe — Administración Escolar',
  description: 'Panel de supervisión, nómina de alumnos y auditoría de custodia escolar',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Si no hay sesión, dejamos que la página maneje la redirección o el layout no bloquea
  if (!session?.user?.email) {
    return <>{children}</>;
  }

  // Resolver colegio con memoria caché ultra-rápida (0ms tras cold start)
  const { needsOnboarding, school } = await resolveUserSchool(session.user.email);
  if (needsOnboarding || !school) {
    // Si necesita onboarding, no montamos el AdminNav para no interferir con el onboarding card
    return <>{children}</>;
  }

  // Consultar sesión activa de forma ultra-ligera (solo sessionCode)
  let activeSessionCode: string | null = null;
  try {
    const activeSession = await prisma.pickupSession.findFirst({
      where: { schoolId: school.id, status: 'OPEN' },
      select: { sessionCode: true },
    });
    if (activeSession) {
      activeSessionCode = activeSession.sessionCode;
    }
  } catch (err) {
    console.warn('[AdminLayout] Advertencia al consultar sesión activa:', err);
  }

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/auth/login' });
  }

  return (
    <div className={styles.container}>
      <AdminNav
        userName={session.user.name || 'Director(a)'}
        userEmail={session.user.email}
        schoolName={school.name}
        activeSessionCode={activeSessionCode}
        onSignOut={handleSignOut}
      />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
