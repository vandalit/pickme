import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { resolveUserSchool } from '@/lib/userSchool';
import { TableSkeleton } from '@/components/admin/TableSkeleton';
import { FurgonesManager, TransportItem, TransportStudentItem } from './FurgonesManager';
import styles from '../page.module.css';

export const dynamic = 'force-dynamic';

async function FurgonesTableLoader({ schoolId }: { schoolId: string }) {
  let transportsList: TransportItem[] = [];
  let unassignedStudentsList: TransportStudentItem[] = [];

  try {
    const [transportsData, studentsData] = await Promise.all([
      prisma.transportService.findMany({
        where: { schoolId },
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
          classroom: { schoolId },
          status: { not: 'WITHDRAWN' },
          transportId: null,
        },
        include: {
          classroom: true,
        },
        orderBy: { fullName: 'asc' },
      }),
    ]);

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
  } catch (error) {
    console.warn('[FurgonesTableLoader] Error al consultar transportes en BD:', error);
  }

  return (
    <FurgonesManager
      initialTransports={transportsList}
      unassignedStudents={unassignedStudentsList}
    />
  );
}

export default async function AdminFurgonesPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  const { needsOnboarding, school: resolvedSchool } = await resolveUserSchool(session.user.email);
  if (needsOnboarding || !resolvedSchool) {
    redirect('/onboarding');
  }

  return (
    <section className={styles.sectionBlock}>
      <div className={styles.sectionHeader}>
        <h1 className={styles.sectionTitle}>Transportes Escolares & Furgones</h1>
        <p className={styles.sectionDesc}>
          Gestión de servicios de transporte externo, choferes autorizados y nóminas de alumnos asignados por furgón.
        </p>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <FurgonesTableLoader schoolId={resolvedSchool.id} />
      </Suspense>
    </section>
  );
}
