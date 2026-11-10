import { cookies } from 'next/headers';
import { prisma } from './db';

export const ACTIVE_SCHOOL_COOKIE = 'pickme_active_school';

export interface UserSchoolResolution {
  needsOnboarding: boolean;
  needsWorkspaceSelection: boolean;
  school: {
    id: string;
    name: string;
    address: string | null;
    emergencyPhone: string | null;
    defaultExitTime: string | null;
    timezone: string;
  } | null;
  membership: {
    id: string;
    role: string;
    status: string;
  } | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: string | null;
  } | null;
}

export async function resolveUserSchool(email?: string | null): Promise<UserSchoolResolution> {
  if (!email) {
    return {
      needsOnboarding: true,
      needsWorkspaceSelection: false,
      school: null,
      membership: null,
      user: null,
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const [userRecord, pendingInvitation, cookieStore] = await Promise.all([
    prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: {
          where: { status: { in: ['ACTIVE', 'PENDING', 'SUSPENDED'] } },
          include: { school: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.invitation.findFirst({
      where: {
        email: normalizedEmail,
        acceptedAt: null,
        expiresAt: { gte: new Date() },
      },
      select: { role: true, schoolId: true },
      orderBy: { createdAt: 'desc' },
    }),
    cookies(),
  ]);

  if (!userRecord) {
    return {
      needsOnboarding: true,
      needsWorkspaceSelection: false,
      school: null,
      membership: null,
      user: null,
    };
  }

  const memberships = userRecord.memberships.filter((item) => item.status === 'ACTIVE');
  const pendingMembership = userRecord.memberships.find((item) => item.status === 'PENDING');
  const suspendedMembership = userRecord.memberships.find((item) => item.status === 'SUSPENDED');
  const selectedSchoolId = cookieStore.get(ACTIVE_SCHOOL_COOKIE)?.value;
  const membership =
    memberships.find((item) => item.schoolId === selectedSchoolId) ||
    (memberships.length === 1 ? memberships[0] : null);

  const user = {
    id: userRecord.id,
    email: userRecord.email,
    name: userRecord.name,
    role: membership?.role || userRecord.onboardingRole,
  };

  if (membership) {
    return {
      needsOnboarding: false,
      needsWorkspaceSelection: false,
      school: {
        id: membership.school.id,
        name: membership.school.name,
        address: membership.school.address,
        emergencyPhone: membership.school.emergencyPhone,
        defaultExitTime: membership.school.defaultExitTime,
        timezone: membership.school.timezone,
      },
      membership: {
        id: membership.id,
        role: membership.role,
        status: membership.status,
      },
      user,
    };
  }

  if (memberships.length > 1) {
    return {
      needsOnboarding: false,
      needsWorkspaceSelection: true,
      school: null,
      membership: null,
      user,
    };
  }

  if (pendingMembership || pendingInvitation) {
    return {
      needsOnboarding: true,
      needsWorkspaceSelection: false,
      school: null,
      membership: null,
      user: {
        ...user,
        role: pendingMembership?.role || pendingInvitation?.role || user.role,
      },
    };
  }

  if (suspendedMembership) {
    return {
      needsOnboarding: false,
      needsWorkspaceSelection: false,
      school: null,
      membership: {
        id: suspendedMembership.id,
        role: suspendedMembership.role,
        status: suspendedMembership.status,
      },
      user: {
        ...user,
        role: suspendedMembership.role,
      },
    };
  }

  return {
    needsOnboarding: true,
    needsWorkspaceSelection: false,
    school: null,
    membership: null,
    user,
  };
}
