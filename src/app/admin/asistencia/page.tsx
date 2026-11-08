import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { resolveUserSchool } from '@/lib/userSchool';
import { TableSkeleton } from '@/components/admin/TableSkeleton';
import { AsistenciaManager, ClassroomItem, StudentAttendanceItem } from './AsistenciaManager';
import styles from '../page.module.css';

export const dynamic = 'force-dynamic';

async function AsistenciaTableLoader({ schoolId, schoolName }: { schoolId: string; schoolName: string }) {
  let classroomsList: ClassroomItem[] = [];
  let studentsList: StudentAttendanceItem[] = [];
  let activeSessionCode: string | null = null;

  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        classrooms: {
          include: {
            students: {
              include: {
                guardians: { include: { guardian: true } },
                authorizations: { include: { picker: true } },
              },
            },
          },
          orderBy: [{ grade: 'asc' }, { section: 'asc' }],
        },
        sessions: {
          where: { status: 'OPEN' },
          include: {
            events: {
              select: {
                studentId: true,
                status: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (school) {
      const openSession = school.sessions[0];
      if (openSession) {
        activeSessionCode = openSession.sessionCode;
      }

      // Mapa de eventos de custodia viva hoy
      const liveEventsMap = new Map<string, any>();
      if (openSession?.events) {
        for (const ev of openSession.events) {
          liveEventsMap.set(ev.studentId, ev.status);
        }
      }

      // Mapear salones
      classroomsList = school.classrooms.map((c) => ({
        id: c.id,
        grade: c.grade,
        section: c.section,
        studentCount: c.students.filter((s) => s.status !== 'WITHDRAWN').length,
      }));

      // Mapear alumnos matriculados
      school.classrooms.forEach((c) => {
        c.students.forEach((s) => {
          const primaryGuardian = s.guardians.find((g) => g.isPrimary)?.guardian || s.guardians[0]?.guardian;
          const permanentAuth = s.authorizations.find((a) => a.type === 'PERMANENT') || s.authorizations[0];
          const primaryPicker = permanentAuth?.picker;

          const pickersText =
            s.authorizations
              .map((a) => `${a.picker.fullName} (${a.picker.relationship})`)
              .join(', ') || 'Solo apoderado titular';

          const liveCustody = liveEventsMap.get(s.id) || null;

          studentsList.push({
            id: s.id,
            fullName: s.fullName,
            initials: s.initials,
            classroomId: c.id,
            classroomName: `${c.grade} ${c.section}`,
            animalId: s.animalId,
            colorId: s.colorId,
            guardianName: primaryGuardian?.fullName || 'Por registrar',
            guardianPhone: primaryGuardian?.whatsappNumber || 'Sin número',
            authorizedPickers: pickersText,
            status: ((s as any).status as 'ACTIVE' | 'ABSENT' | 'WITHDRAWN') || 'ABSENT',
            custodyStatus: liveCustody,
          });
        });
      });
    }
  } catch (error) {
    console.warn('[AsistenciaTableLoader] Error al consultar datos en BD:', error);
  }

  return (
    <AsistenciaManager
      initialClassrooms={classroomsList}
      initialStudents={studentsList}
      schoolName={schoolName}
      activeSessionCode={activeSessionCode}
    />
  );
}

export default async function AdminAsistenciaPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  const { needsOnboarding, school: resolvedSchool } = await resolveUserSchool(session.user.email);
  if (needsOnboarding || !resolvedSchool) {
    redirect('/onboarding');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Asistencia Diaria & Salida Escolar</h1>
          <p className={styles.pageSubtitle}>
            Pase de lista diario por curso: confirma quién está presente en el colegio y apertura la jornada de salida hacia portería.
          </p>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <AsistenciaTableLoader schoolId={resolvedSchool.id} schoolName={resolvedSchool.name} />
      </Suspense>
    </div>
  );
}
