import React from 'react';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/db';
import { resolveUserSchool } from '@/lib/userSchool';
import { AdminNav } from '@/components/admin/AdminNav';
import { StaffManager, StaffMember } from './StaffManager';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminStaffPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  const { needsOnboarding, school: resolvedSchool } = await resolveUserSchool(session.user.email);
  if (needsOnboarding || !resolvedSchool) {
    redirect('/admin/onboarding');
  }

  // Solo SCHOOL_ADMIN puede acceder
  const userRole = (session.user as any).role as string | undefined;
  if (userRole === 'STAFF') {
    redirect('/staff');
  }

  const userName = session.user.name || 'Director(a)';
  const schoolName = resolvedSchool.name;

  // Buscar sesión activa para el pill del nav
  const activeSession = await prisma.pickupSession.findFirst({
    where: { schoolId: resolvedSchool.id, status: 'OPEN' },
    orderBy: { createdAt: 'desc' },
  });

  // Listar staff del colegio
  const staffUsers = await prisma.user.findMany({
    where: { schoolId: resolvedSchool.id, role: 'STAFF' },
    orderBy: { createdAt: 'asc' },
  });

  const staffMembers: StaffMember[] = staffUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt.toISOString(),
  }));

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/auth/login' });
  }

  return (
    <div className={styles.container}>
      <AdminNav
        userName={userName}
        schoolName={schoolName}
        activeSessionCode={activeSession?.sessionCode ?? null}
        onSignOut={handleSignOut}
      />
      <main className={styles.main}>
        <StaffManager initialMembers={staffMembers} />
      </main>
    </div>
  );
}

