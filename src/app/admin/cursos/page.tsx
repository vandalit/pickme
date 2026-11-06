import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth, signOut } from '@/auth';
import { AdminNav } from '@/components/admin/AdminNav';
import { resolveUserSchool } from '@/lib/userSchool';
import { CursosManager, ClassroomItem, StudentItem } from './CursosManager';
import styles from '../page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminCursosPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  // 1. Resolver el colegio asociado a la cuenta
  const { needsOnboarding, school: resolvedSchool } = await resolveUserSchool(session.user.email);
  if (needsOnboarding) {
    redirect('/admin/onboarding');
  }

  const userName = session.user.name || 'Director(a)';
  let schoolName = resolvedSchool?.name || 'Colegio San Martín';
  let activeSessionCode = 'SAN-1024';

  let classroomsList: ClassroomItem[] = [];
  let studentsList: StudentItem[] = [];

  try {
    const school = await prisma.school.findFirst({
      where: resolvedSchool?.id ? { id: resolvedSchool.id } : undefined,
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
          take: 1,
        },
      },
    });

    if (school) {
      schoolName = school.name;
      if (school.sessions[0]) {
        activeSessionCode = school.sessions[0].sessionCode;
      }

      // Mapear salones
      classroomsList = school.classrooms.map((c) => ({
        id: c.id,
        grade: c.grade,
        section: c.section,
        studentCount: c.students.length,
      }));

      // Mapear alumnos
      school.classrooms.forEach((c) => {
        c.students.forEach((s) => {
          const primaryGuardian = s.guardians[0]?.guardian;
          const pickersText =
            s.authorizations
              .map((a) => `${a.picker.fullName} (${a.picker.relationship})`)
              .join(', ') || 'Solo apoderado titular';

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
            status: ((s as any).status as 'ACTIVE' | 'ABSENT' | 'WITHDRAWN') || 'ACTIVE',
          });
        });
      });
    }
  } catch (error) {
    console.warn('[AdminCursos] Error al consultar datos en BD:', error);
  }

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/auth/login' });
  }

  return (
    <div className={styles.container}>
      <AdminNav
        userName={userName}
        schoolName={schoolName}
        activeSessionCode={activeSessionCode}
        onSignOut={handleSignOut}
      />

      <main className={styles.main}>
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h1 className={styles.sectionTitle}>Nómina Institucional de Alumnos y Cursos</h1>
            <p className={styles.sectionDesc}>
              Gobernanza completa de salones, avatares anónimos automáticos sin colisiones, apoderados y gestión de asistencia.
            </p>
          </div>

          <CursosManager
            initialClassrooms={classroomsList}
            initialStudents={studentsList}
            schoolName={schoolName}
          />
        </section>
      </main>
    </div>
  );
}
