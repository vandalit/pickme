import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { resolveUserSchool } from '@/lib/userSchool';
import { TableSkeleton } from '@/components/admin/TableSkeleton';
import { StaffManager, StaffMember, PendingInvitation } from './StaffManager';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

async function StaffTableLoader({ schoolId }: { schoolId: string }) {
  let staffMembers: StaffMember[] = [];
  let invitations: PendingInvitation[] = [];

  try {
    const [staffUsers, pendingInvites] = await Promise.all([
      prisma.schoolMembership.findMany({
        where: { schoolId, role: 'STAFF', status: 'ACTIVE' },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.invitation.findMany({
        where: { schoolId, acceptedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    staffMembers = staffUsers.map(({ user, createdAt }) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: createdAt.toISOString(),
    }));

    invitations = pendingInvites.map((i) => ({
      id: i.id,
      email: i.email,
      token: i.token,
      createdAt: i.createdAt.toISOString(),
      expiresAt: i.expiresAt.toISOString(),
    }));
  } catch (err) {
    console.warn('[StaffTableLoader] Error al consultar staff:', err);
  }

  return <StaffManager initialMembers={staffMembers} initialInvitations={invitations} />;
}

export default async function AdminStaffPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  const { needsOnboarding, school: resolvedSchool } = await resolveUserSchool(session.user.email);
  if (needsOnboarding || !resolvedSchool) {
    redirect('/onboarding');
  }

  // Solo SCHOOL_ADMIN puede acceder
  const userRole = session.user.role;
  if (userRole === 'STAFF') {
    redirect('/staff');
  }

  return (
    <Suspense fallback={<TableSkeleton />}>
      <StaffTableLoader schoolId={resolvedSchool.id} />
    </Suspense>
  );
}
