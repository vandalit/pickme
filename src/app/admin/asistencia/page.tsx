import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth, signOut } from '@/auth';
import { AdminNav } from '@/components/admin/AdminNav';
import { resolveUserSchool } from '@/lib/userSchool';
import { AsistenciaManager, ClassroomItem, StudentAttendanceItem } from './AsistenciaManager';
import styles from '../page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminAsistenciaPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  // 1. Resolver el colegio asociado a la cuenta (usa caché en memoria para 0ms)
  const { needsOnboarding, school: resolvedSchool } = await resolveUserSchool(session.user.email);
  if (needsOnboarding || !resolvedSchool) {
    redirect('/onboarding');
  }

  const userName = session.user.name || 'Director(a)';
  let schoolName = resolvedSchool?.name || 'Mi Establecimiento';
  let activeSessionCode: string | null = null;

  let classroomsList: ClassroomItem[] = [];
  let studentsList: StudentAttendanceItem[] = [];

  try {
    if (resolvedSchool?.id) {
      const school = await prisma.school.findUnique({
        where: { id: resolvedSchool.id },
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
        schoolName = school.name;
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
    }
  } catch (error) {
    console.warn('[AdminAsistencia] Error al consultar datos en BD:', error);
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
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Asistencia Diaria & Salida Escolar</h1>
            <p className={styles.pageSubtitle}>
              Pase de lista diario por curso: confirma quién está presente en el colegio y apertura la jornada de salida hacia portería.
            </p>
          </div>
        </div>

        <AsistenciaManager
          initialClassrooms={classroomsList}
          initialStudents={studentsList}
          schoolName={schoolName}
          activeSessionCode={activeSessionCode}
        />
      </main>
    </div>
  );
}

