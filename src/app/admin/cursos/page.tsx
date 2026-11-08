import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { resolveUserSchool } from '@/lib/userSchool';
import { TableSkeleton } from '@/components/admin/TableSkeleton';
import { CursosManager, ClassroomItem, StudentItem } from './CursosManager';
import styles from '../page.module.css';

export const dynamic = 'force-dynamic';

async function CursosTableLoader({ schoolId, schoolName }: { schoolId: string; schoolName: string }) {
  let classroomsList: ClassroomItem[] = [];
  let studentsList: StudentItem[] = [];
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
          take: 1,
        },
      },
    });

    if (school) {
      if (school.sessions[0]) {
        activeSessionCode = school.sessions[0].sessionCode;
      }

      classroomsList = school.classrooms.map((c) => ({
        id: c.id,
        grade: c.grade,
        section: c.section,
        studentCount: c.students.length,
      }));

      school.classrooms.forEach((c) => {
        c.students.forEach((s) => {
          const primaryGuardian = s.guardians.find((g) => g.isPrimary)?.guardian || s.guardians[0]?.guardian;
          const permanentAuth = s.authorizations.find((a) => a.type === 'PERMANENT') || s.authorizations[0];
          const primaryPicker = permanentAuth?.picker;

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
            pickerName: primaryPicker?.fullName || '',
            pickerRelationship: primaryPicker?.relationship || '',
            pickerPhone: primaryPicker?.whatsappNumber || '',
            status: ((s as any).status as 'ACTIVE' | 'ABSENT' | 'WITHDRAWN') || 'ACTIVE',
          });
        });
      });
    }
  } catch (error) {
    console.warn('[CursosTableLoader] Error al consultar datos en BD:', error);
  }

  return (
    <CursosManager
      initialClassrooms={classroomsList}
      initialStudents={studentsList}
      schoolName={schoolName}
      activeSessionCode={activeSessionCode}
    />
  );
}

export default async function AdminCursosPage() {
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
        <h1 className={styles.sectionTitle}>Nómina & Matrículas</h1>
        <p className={styles.sectionDesc}>
          Registro maestro de alumnos matriculados, edición de datos, salones y apoderados titulares.
        </p>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <CursosTableLoader schoolId={resolvedSchool.id} schoolName={resolvedSchool.name} />
      </Suspense>
    </section>
  );
}
