import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth, signOut } from '@/auth';
import { AdminNav } from '@/components/admin/AdminNav';
import { resolveUserSchool } from '@/lib/userSchool';
import { revalidatePath } from 'next/cache';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  // 1. Resolver el colegio asociado a la cuenta del usuario
  const { needsOnboarding, school: resolvedSchool } = await resolveUserSchool(session.user.email);
  if (needsOnboarding) {
    redirect('/admin/onboarding');
  }

  const userName = session.user.name || 'Director(a)';
  let schoolName = resolvedSchool?.name || 'Colegio San Martín';
  let activeSessionCode = 'SAN-1024';
  let isSessionOpen = true;

  // Embudo en vivo
  let waitingCount = 3;
  let inProcessCount = 1;
  let completedCount = 2;
  let alertCount = 0;

  // Lista de eventos/alumnos en vivo
  type RosterItem = {
    id: string;
    studentName: string;
    classroom: string;
    animalId: string;
    colorId: string;
    pickerName: string;
    relationship: string;
    status: 'WAITING' | 'IN_PROCESS' | 'IN_TRANSIT' | 'ARRIVED' | 'ALERT';
    timeFormatted: string;
  };

  let activeRoster: RosterItem[] = [
    {
      id: 'e1',
      studentName: 'Vicente Toro Morales',
      classroom: '1° Básico A',
      animalId: 'cocodrilo',
      colorId: 'amarillo',
      pickerName: 'Ignacio Herrera',
      relationship: 'Tío',
      status: 'IN_PROCESS',
      timeFormatted: '14:32',
    },
    {
      id: 'e2',
      studentName: 'Matías Silva Gómez',
      classroom: '1° Básico A',
      animalId: 'lobo',
      colorId: 'azul',
      pickerName: 'Carolina Herrera',
      relationship: 'Mamá Titular',
      status: 'WAITING',
      timeFormatted: '14:30',
    },
    {
      id: 'e3',
      studentName: 'Sofía Morales Paz',
      classroom: '1° Básico A',
      animalId: 'panda',
      colorId: 'verde',
      pickerName: 'Don Pedro Transporte',
      relationship: 'Furgón Escolar',
      status: 'WAITING',
      timeFormatted: '14:30',
    },
    {
      id: 'e4',
      studentName: 'Lucas Castro Ruiz',
      classroom: '2° Básico B',
      animalId: 'zorro',
      colorId: 'naranja',
      pickerName: 'Ignacio Herrera',
      relationship: 'Tío',
      status: 'ARRIVED',
      timeFormatted: '14:25',
    },
    {
      id: 'e5',
      studentName: 'Valentina Soto Miranda',
      classroom: '2° Básico B',
      animalId: 'delfín',
      colorId: 'celeste',
      pickerName: 'Don Pedro Transporte',
      relationship: 'Furgón Escolar',
      status: 'IN_TRANSIT',
      timeFormatted: '14:28',
    },
    {
      id: 'e6',
      studentName: 'Camila Rojas Benítez',
      classroom: '2° Básico B',
      animalId: 'león',
      colorId: 'rojo',
      pickerName: 'Carolina Herrera',
      relationship: 'Mamá Titular',
      status: 'WAITING',
      timeFormatted: '14:30',
    },
  ];

  try {
    const school = await prisma.school.findFirst({
      where: resolvedSchool?.id ? { id: resolvedSchool.id } : undefined,
      include: {
        sessions: {
          where: { status: 'OPEN' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            events: {
              include: {
                student: { include: { classroom: true } },
                picker: true,
              },
            },
          },
        },
      },
    });

    if (school) {
      schoolName = school.name;
      const currentSession = school.sessions[0];
      if (currentSession) {
        activeSessionCode = currentSession.sessionCode;
        isSessionOpen = currentSession.status === 'OPEN';

        if (currentSession.events.length > 0) {
          waitingCount = currentSession.events.filter((e) => e.status === 'WAITING').length;
          inProcessCount = currentSession.events.filter((e) => e.status === 'IN_PROCESS').length;
          completedCount = currentSession.events.filter(
            (e) => e.status === 'IN_TRANSIT' || e.status === 'ARRIVED'
          ).length;
          alertCount = currentSession.events.filter((e) => e.status === 'ALERT').length;

          activeRoster = currentSession.events.map((e) => {
            const date = e.updatedAt || e.createdAt;
            const hours = date.getHours().toString().padStart(2, '0');
            const mins = date.getMinutes().toString().padStart(2, '0');

            return {
              id: e.id,
              studentName: e.student.fullName,
              classroom: `${e.student.classroom.grade} ${e.student.classroom.section}`,
              animalId: e.student.animalId,
              colorId: e.student.colorId,
              pickerName: e.picker?.fullName || 'Por confirmar',
              relationship: e.picker?.relationship || 'Apoderado',
              status: e.status as RosterItem['status'],
              timeFormatted: `${hours}:${mins}`,
            };
          });
        }
      }
    }
  } catch (error) {
    console.warn('[Admin] Cargando con datos resilientes de respaldo:', error);
  }

  // Server Action: Simular llegada de picker (Test de conexión)
  async function simularArriboAction() {
    'use server';
    try {
      // Buscar el primer alumno en espera y pasarlo a IN_PROCESS
      const waitingEvent = await prisma.pickupEvent.findFirst({
        where: { status: 'WAITING' },
      });
      if (waitingEvent) {
        await prisma.pickupEvent.update({
          where: { id: waitingEvent.id },
          data: {
            status: 'IN_PROCESS',
            handoverCode: '582914',
            pickerScannedAt: new Date(),
          },
        });
      }
    } catch {
      // Si corre offline ignora el fallo
    }
    revalidatePath('/admin');
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
        activeSessionCode={activeSessionCode}
        onSignOut={handleSignOut}
      />

      <main className={styles.main}>
        {/* ── BARRA DE CONTROL DE JORNADA ── */}
        <section className={styles.controlBar} aria-label="Control de Jornada">
          <div className={styles.controlInfo}>
            <div className={styles.controlTitleArea}>
              <h1 className={styles.controlTitle}>Jornada de Salida — {activeSessionCode}</h1>
              {isSessionOpen && (
                <span className={styles.liveBadge}>
                  <span className={styles.liveDot} />
                  En Curso (14:30 hrs)
                </span>
              )}
            </div>
            <p className={styles.controlSubtitle}>
              Sede Central · Puerta Principal · 6 Alumnos Convocados
            </p>
          </div>

          <div className={styles.controlActions}>
            <form action={simularArriboAction}>
              <button
                type="submit"
                className={styles.simularBtn}
                title="Prueba la reacción inmediata de Smart TV y Portón simulando el arribo de un apoderado"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <span>Test de Conexión (Simular Arribo)</span>
              </button>
            </form>

            <button
              type="button"
              className={styles.closeSessionBtn}
              title="Cierra formalmente las rejas y genera el acta de custodia del día"
            >
              <span>Cerrar Jornada Escolar</span>
            </button>
          </div>
        </section>

        {/* ── LAUNCHPAD DE PANTALLAS (DESPACHO MULTI-DISPOSITIVO) ── */}
        <section className={styles.sectionBlock} aria-label="Centro de Despacho">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Centro de Despacho (Launchpad de Pantallas)</h2>
            <p className={styles.sectionDesc}>
              Abre o distribuye las terminales de salida según el rol y la ubicación física en el colegio.
            </p>
          </div>

          <div className={styles.launchpadGrid}>
            {/* Terminal 1: Smart TV Patio */}
            <article className={styles.launchCard}>
              <div className={styles.launchCardTop}>
                <div className={`${styles.launchIconWrapper} ${styles.launchIconTv}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <div className={styles.launchCardMeta}>
                  <span className={styles.launchCardBadge}>Capa 0 · Patio Escolar</span>
                  <h3 className={styles.launchCardTitle}>Smart TV Mural</h3>
                  <p className={styles.launchCardDesc}>
                    Proyección anónima en pantalla gigante. Llama a los alumnos por Animal + Color.
                  </p>
                </div>
              </div>
              <div className={styles.launchCardActions}>
                <Link
                  href={`/board/${activeSessionCode}`}
                  target="_blank"
                  className={styles.launchPrimaryBtn}
                >
                  <span>Lanzar en Pantalla Completa ↗</span>
                </Link>
              </div>
            </article>

            {/* Terminal 2: Consola Portón Staff */}
            <article className={styles.launchCard}>
              <div className={styles.launchCardTop}>
                <div className={`${styles.launchIconWrapper} ${styles.launchIconStaff}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <line x1="8" y1="7" x2="16" y2="7" />
                    <line x1="8" y1="11" x2="16" y2="11" />
                  </svg>
                </div>
                <div className={styles.launchCardMeta}>
                  <span className={styles.launchCardBadge}>Capa 1 · Personal Portería</span>
                  <h3 className={styles.launchCardTitle}>Tablet Portón (Carlos)</h3>
                  <p className={styles.launchCardDesc}>
                    Cola viva de entrega con teclado táctil de 64px para digitar el Handover Code.
                  </p>
                </div>
              </div>
              <div className={styles.launchCardActions}>
                <Link
                  href="/staff"
                  target="_blank"
                  className={styles.launchPrimaryBtn}
                >
                  <span>Abrir Consola Portón ↗</span>
                </Link>
              </div>
            </article>

            {/* Terminal 3: Afiche QR Pickers */}
            <article className={styles.launchCard}>
              <div className={styles.launchCardTop}>
                <div className={`${styles.launchIconWrapper} ${styles.launchIconPicker}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <path d="M12 18h.01" />
                  </svg>
                </div>
                <div className={styles.launchCardMeta}>
                  <span className={styles.launchCardBadge}>Capa 1 · Apoderados & Pickers</span>
                  <h3 className={styles.launchCardTitle}>Punto de Llegada Móvil</h3>
                  <p className={styles.launchCardDesc}>
                    Enlace directo que escanean los apoderados en portería sin descargar apps.
                  </p>
                </div>
              </div>
              <div className={styles.launchCardActions}>
                <Link
                  href={`/retirar?session=${activeSessionCode}`}
                  target="_blank"
                  className={styles.launchPrimaryBtn}
                >
                  <span>Simular Retiro Picker ↗</span>
                </Link>
              </div>
            </article>
          </div>
        </section>

        {/* ── EMBUDO DE SALIDA EN VIVO ── */}
        <section className={styles.sectionBlock} aria-label="Métricas en Tiempo Real">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Embudo Operativo de Salida</h2>
            <p className={styles.sectionDesc}>
              Distribución en vivo de los alumnos convocados para la sesión de hoy.
            </p>
          </div>

          <div className={styles.funnelGrid}>
            <div className={styles.funnelCard}>
              <span className={styles.funnelLabel}>
                <span style={{ color: '#38bdf8' }}>●</span> En Aula / Esperando
              </span>
              <span className={styles.funnelValue} style={{ color: '#38bdf8' }}>
                {waitingCount}
              </span>
            </div>

            <div className={styles.funnelCard}>
              <span className={styles.funnelLabel}>
                <span style={{ color: '#fbbf24' }}>●</span> En Portón / Traspaso
              </span>
              <span className={styles.funnelValue} style={{ color: '#fbbf24' }}>
                {inProcessCount}
              </span>
            </div>

            <div className={styles.funnelCard}>
              <span className={styles.funnelLabel}>
                <span style={{ color: '#4ade80' }}>●</span> Retirados con Éxito
              </span>
              <span className={styles.funnelValue} style={{ color: '#4ade80' }}>
                {completedCount}
              </span>
            </div>

            <div className={styles.funnelCard}>
              <span className={styles.funnelLabel}>
                <span style={{ color: '#f87171' }}>●</span> Alertas / Retardos
              </span>
              <span className={styles.funnelValue} style={{ color: '#f87171' }}>
                {alertCount}
              </span>
            </div>
          </div>
        </section>

        {/* ── MONITOR EN VIVO DE ALUMNOS (CAPA 2) ── */}
        <section className={styles.sectionBlock} aria-label="Monitor de Alumnos">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Monitor en Tiempo Real (Nivel de Auditoría Capa 2)</h2>
            <p className={styles.sectionDesc}>
              Visibilidad total de identidades: nombres completos, identificador anónimo de patio y estado de custodia.
            </p>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Identificador Patio (Capa 0)</th>
                    <th>Alumno (Capa 2)</th>
                    <th>Curso</th>
                    <th>Retirador Convocado</th>
                    <th>Estado de Custodia</th>
                    <th>Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRoster.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className={styles.animalBadge}>
                          <span>🐾</span>
                          <span>{item.animalId} {item.colorId}</span>
                        </span>
                      </td>
                      <td>
                        <div className={styles.studentNameArea}>
                          <span className={styles.studentFullName}>{item.studentName}</span>
                        </div>
                      </td>
                      <td>{item.classroom}</td>
                      <td>
                        <div className={styles.pickerCell}>
                          <span className={styles.pickerName}>{item.pickerName}</span>
                          <span className={styles.pickerRelation}>{item.relationship}</span>
                        </div>
                      </td>
                      <td>
                        {item.status === 'WAITING' && (
                          <span className={styles.statusWaiting}>
                            <span>●</span> En Aula
                          </span>
                        )}
                        {item.status === 'IN_PROCESS' && (
                          <span className={styles.statusInProcess}>
                            <span>●</span> En Portón
                          </span>
                        )}
                        {(item.status === 'IN_TRANSIT' || item.status === 'ARRIVED') && (
                          <span className={styles.statusInTransit}>
                            <span>✓</span> Entregado
                          </span>
                        )}
                      </td>
                      <td style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                        {item.timeFormatted} hrs
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
