import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/db';
import { resolveUserSchool } from '@/lib/userSchool';
import StaffContent from './StaffContent';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const session = await auth();

  // Guard: requiere autenticación
  if (!session?.user?.email) {
    redirect('/auth/login?callbackUrl=/staff');
  }

  const { school, membership, user } = await resolveUserSchool(session.user.email);
  if (!user || !school || !membership || membership.status !== 'ACTIVE') {
    redirect('/auth/login?error=NoSchool');
  }
  if (membership.role !== 'STAFF' && membership.role !== 'SCHOOL_ADMIN') {
    redirect('/admin');
  }

  // Buscar sesión activa del colegio
  const activeSession = await prisma.pickupSession.findFirst({
    where: {
      schoolId: school.id,
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
          staffName={user.name}
          schoolName={school.name}
          defaultExitTime={school.defaultExitTime}
          timezone={school.timezone}
          activeSessionCode={activeSession?.sessionCode ?? null}
          activeSessionId={activeSession?.id ?? null}
          onSignOut={handleSignOut}
        />
      </Suspense>
      <a href="/workspaces" style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 10 }}>
        Cambiar colegio
      </a>
    </div>
  );
}
