import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/db';
import StaffContent from './StaffContent';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const session = await auth();

  // Guard: requiere autenticación
  if (!session?.user?.email) {
    redirect('/auth/login?callbackUrl=/staff');
  }

  const email = session.user.email.toLowerCase().trim();

  // Resolver usuario real en BD
  const dbUser = await prisma.user.findUnique({
    where: { email },
    include: { school: true },
  });

  // Si no tiene escuela asignada, no puede operar
  if (!dbUser || !dbUser.school) {
    redirect('/auth/login?error=NoSchool');
  }

  // Buscar sesión activa del colegio
  const activeSession = await prisma.pickupSession.findFirst({
    where: {
      schoolId: dbUser.schoolId ?? undefined,
      status: 'OPEN',
    },
    orderBy: { createdAt: 'desc' },
  });

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/auth/login' });
  }

  return (
    <div className={styles.container}>
      <Suspense fallback={<div style={{ padding: '2rem', color: '#94a3b8' }}>Cargando consola de portón...</div>}>
        <StaffContent
          staffName={dbUser.name}
          schoolName={dbUser.school.name}
          defaultExitTime={dbUser.school.defaultExitTime}
          timezone={dbUser.school.timezone}
          activeSessionCode={activeSession?.sessionCode ?? null}
          activeSessionId={activeSession?.id ?? null}
          onSignOut={handleSignOut}
        />
      </Suspense>
    </div>
  );
}
