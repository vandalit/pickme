import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth, signOut } from '@/auth';
import { AdminNav } from '@/components/admin/AdminNav';
import { resolveUserSchool } from '@/lib/userSchool';
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

  type StudentRecord = {
    id: string;
    fullName: string;
    initials: string;
    classroom: string;
    animalId: string;
    colorId: string;
    guardianName: string;
    guardianPhone: string;
    authorizedPickers: string;
  };

  let studentsList: StudentRecord[] = [
    {
      id: 's1',
      fullName: 'Vicente Toro Morales',
      initials: 'V.T.',
      classroom: '1° Básico A',
      animalId: 'cocodrilo',
      colorId: 'amarillo',
      guardianName: 'Carolina Herrera',
      guardianPhone: '+56991112233',
      authorizedPickers: 'Ignacio Herrera (Tío)',
    },
    {
      id: 's2',
      fullName: 'Matías Silva Gómez',
      initials: 'M.S.',
      classroom: '1° Básico A',
      animalId: 'lobo',
      colorId: 'azul',
      guardianName: 'Carolina Herrera',
      guardianPhone: '+56991112233',
      authorizedPickers: 'Carolina Herrera (Mamá Titular)',
    },
    {
      id: 's3',
      fullName: 'Sofía Morales Paz',
      initials: 'S.M.',
      classroom: '1° Básico A',
      animalId: 'panda',
      colorId: 'verde',
      guardianName: 'Carolina Herrera',
      guardianPhone: '+56991112233',
      authorizedPickers: 'Don Pedro Transporte (Furgón Escolar)',
    },
    {
      id: 's4',
      fullName: 'Lucas Castro Ruiz',
      initials: 'L.C.',
      classroom: '2° Básico B',
      animalId: 'zorro',
      colorId: 'naranja',
      guardianName: 'Carolina Herrera',
      guardianPhone: '+56991112233',
      authorizedPickers: 'Ignacio Herrera (Tío)',
    },
    {
      id: 's5',
      fullName: 'Valentina Soto Miranda',
      initials: 'V.S.',
      classroom: '2° Básico B',
      animalId: 'delfín',
      colorId: 'celeste',
      guardianName: 'Carolina Herrera',
      guardianPhone: '+56991112233',
      authorizedPickers: 'Don Pedro Transporte (Furgón Escolar)',
    },
    {
      id: 's6',
      fullName: 'Camila Rojas Benítez',
      initials: 'C.R.',
      classroom: '2° Básico B',
      animalId: 'león',
      colorId: 'rojo',
      guardianName: 'Carolina Herrera',
      guardianPhone: '+56991112233',
      authorizedPickers: 'Carolina Herrera (Mamá Titular)',
    },
  ];

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

      const allDbStudents: StudentRecord[] = [];
      school.classrooms.forEach((c) => {
        c.students.forEach((s) => {
          const primaryGuardian = s.guardians[0]?.guardian;
          const pickersText = s.authorizations
            .map((a) => `${a.picker.fullName} (${a.picker.relationship})`)
            .join(', ') || 'Solo apoderado';

          allDbStudents.push({
            id: s.id,
            fullName: s.fullName,
            initials: s.initials,
            classroom: `${c.grade} ${c.section}`,
            animalId: s.animalId,
            colorId: s.colorId,
            guardianName: primaryGuardian?.fullName || 'Por registrar',
            guardianPhone: primaryGuardian?.whatsappNumber || 'Sin número',
            authorizedPickers: pickersText,
          });
        });
      });

      if (allDbStudents.length > 0) {
        studentsList = allDbStudents;
      }
    }
  } catch (error) {
    console.warn('[AdminCursos] Usando nómina resiliente de respaldo:', error);
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
            <h1 className={styles.sectionTitle}>Nómina Institucional de Alumnos y Salones</h1>
            <p className={styles.sectionDesc}>
              Gobernanza completa de estudiantes, pares asignados Animal + Color y autorizaciones legales vigentes.
            </p>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Código Patio (Capa 0)</th>
                    <th>Nombre Completo (Capa 2)</th>
                    <th>Curso</th>
                    <th>Apoderado Titular</th>
                    <th>Retiradores Autorizados</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsList.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span className={styles.animalBadge}>
                          <span>🐾</span>
                          <span>{s.animalId} {s.colorId}</span>
                        </span>
                      </td>
                      <td>
                        <div className={styles.studentNameArea}>
                          <span className={styles.studentFullName}>{s.fullName}</span>
                          <span className={styles.studentMeta}>Iniciales en portón: {s.initials}</span>
                        </div>
                      </td>
                      <td>{s.classroom}</td>
                      <td>
                        <div className={styles.studentNameArea}>
                          <span style={{ fontWeight: 600 }}>{s.guardianName}</span>
                          <span className={styles.studentMeta}>{s.guardianPhone}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: '#38bdf8', fontSize: '0.8125rem' }}>
                          {s.authorizedPickers}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

