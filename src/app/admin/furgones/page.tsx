import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth, signOut } from '@/auth';
import { AdminNav } from '@/components/admin/AdminNav';
import { resolveUserSchool } from '@/lib/userSchool';
import { FurgonesManager, TransportItem, TransportStudentItem } from './FurgonesManager';
import styles from '../page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminFurgonesPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  const { needsOnboarding, school: resolvedSchool } = await resolveUserSchool(session.user.email);
  if (needsOnboarding || !resolvedSchool) {
    redirect('/onboarding');
  }

  const userName = session.user.name || 'Director(a)';
  let schoolName = resolvedSchool?.name || 'Mi Establecimiento';
  let activeSessionCode: string | null = null;

  let transportsList: TransportItem[] = [];
  let unassignedStudentsList: TransportStudentItem[] = [];

  try {
    if (resolvedSchool?.id) {
      const [transportsData, studentsData, openSession] = await Promise.all([
        prisma.transportService.findMany({
          where: { schoolId: resolvedSchool.id },
          include: {
            students: {
              include: {
                classroom: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        }),
        prisma.student.findMany({
          where: {
            classroom: { schoolId: resolvedSchool.id },
            status: { not: 'WITHDRAWN' },
            transportId: null,
          },
          include: {
            classroom: true,
          },
          orderBy: { fullName: 'asc' },
        }),
        prisma.pickupSession.findFirst({
          where: { schoolId: resolvedSchool.id, status: 'OPEN' },
          select: { sessionCode: true },
        }),
      ]);

      if (openSession) {
        activeSessionCode = openSession.sessionCode;
      }

      transportsList = transportsData.map((t) => ({
        id: t.id,
        name: t.name,
        driverName: t.driverName,
        driverPhone: t.driverPhone,
        plateNumber: t.plateNumber,
        students: t.students.map((s) => ({
          id: s.id,
          fullName: s.fullName,
          classroomName: `${s.classroom.grade} ${s.classroom.section}`,
        })),
      }));

      unassignedStudentsList = studentsData.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        classroomName: `${s.classroom.grade} ${s.classroom.section}`,
      }));
    }
  } catch (error) {
    console.warn('[AdminFurgones] Error al consultar datos en BD:', error);
  }

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/auth/login' });
  }

  return (
    <div className={styles.container}>
      <AdminNav
        userName={userName}
        userEmail={session.user.email}
        schoolName={schoolName}
        activeSessionCode={activeSessionCode}
        onSignOut={handleSignOut}
      />

      <main className={styles.main}>
        <section className={styles.sectionBlock}>
          <FurgonesManager
            initialTransports={transportsList}
            unassignedStudents={unassignedStudentsList}
          />
        </section>
      </main>
    </div>
  );
}
