import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth, signOut } from '@/auth';
import { AdminNav } from '@/components/admin/AdminNav';
import { resolveUserSchool } from '@/lib/userSchool';
import { SessionDashboard, DashboardRosterItem } from './SessionDashboard';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  // 1. Resolver el colegio asociado a la cuenta del usuario
  const { needsOnboarding, school: resolvedSchool } = await resolveUserSchool(session.user.email);
  if (needsOnboarding || !resolvedSchool) {
    redirect('/onboarding');
  }

  const userName = session.user.name || 'Director(a)';
  const schoolName = resolvedSchool.name;

  let isSessionOpen = false;
  let activeSessionData: {
    id: string;
    sessionCode: string;
    startedAt: string | null;
  } | null = null;

  let schoolSummary = {
    totalClassrooms: 0,
    activeStudents: 0,
    inactiveStudents: 0,
  };

  let funnelCounts = {
    waiting: 0,
    inProcess: 0,
    completed: 0,
    alert: 0,
  };

  let roster: DashboardRosterItem[] = [];

  try {
    // 2. Resumen de la escuela
    const [totalClassrooms, activeStudentsCount, inactiveStudentsCount] = await Promise.all([
      prisma.classroom.count({
        where: { schoolId: resolvedSchool.id },
      }),
      prisma.student.count({
        where: {
          classroom: { schoolId: resolvedSchool.id },
          status: 'ACTIVE',
        },
      }),
      prisma.student.count({
        where: {
          classroom: { schoolId: resolvedSchool.id },
          status: { in: ['ABSENT', 'WITHDRAWN'] },
        },
      }),
    ]);

    schoolSummary = {
      totalClassrooms,
      activeStudents: activeStudentsCount,
      inactiveStudents: inactiveStudentsCount,
    };

    // 3. Buscar sesión activa (status: OPEN)
    const activeSession = await prisma.pickupSession.findFirst({
      where: {
        schoolId: resolvedSchool.id,
        status: 'OPEN',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        events: {
          include: {
            student: {
              include: {
                classroom: true,
              },
            },
            picker: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (activeSession) {
      isSessionOpen = true;
      activeSessionData = {
        id: activeSession.id,
        sessionCode: activeSession.sessionCode,
        startedAt: activeSession.startedAt ? activeSession.startedAt.toISOString() : null,
      };

      const events = activeSession.events;

      funnelCounts = {
        waiting: events.filter((e) => e.status === 'WAITING').length,
        inProcess: events.filter((e) => e.status === 'IN_PROCESS').length,
        completed: events.filter((e) => e.status === 'IN_TRANSIT' || e.status === 'ARRIVED').length,
        alert: events.filter((e) => e.status === 'ALERT').length,
      };

      roster = events.map((e) => {
        const date = e.updatedAt || e.createdAt;
        const hours = date.getHours().toString().padStart(2, '0');
        const mins = date.getMinutes().toString().padStart(2, '0');

        return {
          id: e.id,
          studentId: e.student.id,
          studentName: e.student.fullName,
          initials: e.student.initials,
          classroom: `${e.student.classroom.grade} ${e.student.classroom.section}`,
          animalId: e.student.animalId,
          colorId: e.student.colorId,
          pickerName: e.picker?.fullName || 'Por confirmar',
          relationship: e.picker?.relationship || 'Apoderado Titular',
          status: e.status as DashboardRosterItem['status'],
          handoverCode: e.handoverCode,
          timeFormatted: `${hours}:${mins}`,
        };
      });
    }
  } catch (error) {
    console.warn('[Admin] Error consultando estado en base de datos:', error);
  }

  // Server Action: Cerrar sesión de usuario
  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/auth/login' });
  }

  return (
    <div className={styles.container}>
      <AdminNav
        userName={userName}
        schoolName={schoolName}
        activeSessionCode={activeSessionData?.sessionCode || 'En Pausa'}
        onSignOut={handleSignOut}
      />

      <main className={styles.main}>
        <SessionDashboard
          isSessionOpen={isSessionOpen}
          activeSession={activeSessionData}
          schoolSummary={schoolSummary}
          funnelCounts={funnelCounts}
          roster={roster}
        />
      </main>
    </div>
  );
}
