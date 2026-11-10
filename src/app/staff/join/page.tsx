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
    add?: string;
  }>;
}

export default async function StaffJoinPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/auth/login?callbackUrl=/staff/join');
  }

  const { token, pending, add } = await searchParams;
  const email = session.user.email.toLowerCase().trim();

  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!dbUser) redirect('/auth/login');

  const activeMembership = await prisma.schoolMembership.findFirst({
    where: { userId: dbUser.id, status: 'ACTIVE' },
  });
  if (activeMembership && !token && add !== '1') redirect('/workspaces');

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

  // AUTO-DETECCIÓN: Si no trae token en URL, buscar si hay una invitación pendiente para su email
  if (!tokenInvite) {
    const emailInvite = await prisma.invitation.findFirst({
      where: {
        email,
        acceptedAt: null,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: { school: true },
    });

    if (emailInvite) {
      tokenInvite = {
        token: emailInvite.token,
        schoolName: emailInvite.school.name,
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
  const activeSchoolIds = new Set(
    (
      await prisma.schoolMembership.findMany({
        where: { userId: dbUser.id, status: 'ACTIVE' },
        select: { schoolId: true },
      })
    ).map((membership) => membership.schoolId)
  );

  const schoolsData = allSchools.map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    hasPendingRequest: pendingSchoolIds.has(s.id),
    isMember: activeSchoolIds.has(s.id),
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
