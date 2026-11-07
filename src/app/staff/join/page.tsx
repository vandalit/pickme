import React from 'react';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/db';
import styles from './page.module.css';
import JoinClientContent from './JoinClientContent';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{
    token?: string;
    pending?: string;
  }>;
}

export default async function StaffJoinPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/auth/login?callbackUrl=/staff/join');
  }

  const { token, pending } = await searchParams;
  const email = session.user.email.toLowerCase().trim();

  // Si el usuario ya está activo y vinculado a un colegio, va directo a /staff
  const dbUser = await prisma.user.findUnique({
    where: { email },
    include: { school: true },
  });

  if (dbUser?.schoolId && dbUser.status === 'ACTIVE') {
    redirect('/staff');
  }

  // Si trae token, verificar validez preliminar
  let tokenInvite = null;
  if (token) {
    const invite = await prisma.invitation.findUnique({
      where: { token },
      include: { school: true },
    });
    if (invite && !invite.acceptedAt && new Date() <= invite.expiresAt) {
      tokenInvite = {
        token: invite.token,
        schoolName: invite.school.name,
      };
    }
  }

  // Listar todos los colegios y marcar si ya envió solicitud a alguno
  const allSchools = await prisma.school.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, address: true },
  });

  const pendingRequests = await prisma.invitation.findMany({
    where: {
      email,
      acceptedAt: null,
    },
    select: { schoolId: true },
  });

  const pendingSchoolIds = new Set(pendingRequests.map((r) => r.schoolId));

  const schoolsData = allSchools.map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    hasPendingRequest: pendingSchoolIds.has(s.id),
  }));

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/auth/login' });
  }

  return (
    <main className={styles.main}>
      <JoinClientContent
        userEmail={email}
        schools={schoolsData}
        tokenInvite={tokenInvite}
        isPendingNotice={pending === '1'}
      />
      <div className={styles.footer} style={{ maxWidth: '600px', width: '100%' }}>
        <span>Conectado como {email}</span>
        <form action={handleSignOut}>
          <button type="submit" className={styles.signOutLink}>
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}

