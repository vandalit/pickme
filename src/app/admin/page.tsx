import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Consultar datos reales de PostgreSQL
  const school = await prisma.school.findFirst();
  const totalStudents = await prisma.student.count();
  const totalClassrooms = await prisma.classroom.count();
  const activeSession = await prisma.pickupSession.findFirst({
    where: { status: 'OPEN' },
    orderBy: { createdAt: 'desc' },
    include: {
      events: true,
    },
  });

  const inProcessCount =
    activeSession?.events.filter((e) => e.status === 'IN_PROCESS').length || 0;
  const completedCount =
    activeSession?.events.filter(
      (e) => e.status === 'IN_TRANSIT' || e.status === 'ARRIVED'
    ).length || 0;

  return (
    <div className={styles.container}>
      {/* ── Top Header ── */}
      <header className={styles.header}>
        <div className={styles.userArea}>
          <div className={styles.avatar}>S</div>
          <div className={styles.meta}>
            <span className={styles.name}>Sofía Valenzuela</span>
            <span className={styles.institution}>
              Directora · {school?.name || 'Colegio San Martín'}
            </span>
          </div>
        </div>

        <div className={styles.statusPill}>
          <span className={styles.dot} />
          <span>
            {activeSession
              ? `Sesión Activa: ${activeSession.sessionCode}`
              : 'Sin sesión abierta'}
          </span>
        </div>
      </header>

      {/* ── Highlight Banner: Sandbox Simulator ── */}
      <section className={styles.sandboxBanner} aria-label="Simulador de Validación">
        <div className={styles.sandboxInfo}>
          <span className={styles.sandboxBadge}>Criterio CA-5 · Onboarding</span>
          <h2 className={styles.sandboxTitle}>
            Sandbox Simulator: Valida el ciclo escolar en 3 minutos
          </h2>
          <p className={styles.sandboxDesc}>
            Prueba cómo interactúa el Smart TV del portón con el celular del picker y la tablet de Carlos sin afectar los registros de los alumnos. Simula llegadas, rotación de QR y traspasos con código de 6 dígitos.
          </p>
        </div>

        <Link
          href="/admin/simulador"
          style={{
            padding: '0.85rem 1.5rem',
            borderRadius: '0.75rem',
            background: 'var(--color-brand)',
            color: '#FFFFFF',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(108, 99, 255, 0.4)',
          }}
        >
          Iniciar Simulador Interactivo ➔
        </Link>
      </section>

      {/* ── Metrics Grid ── */}
      <section className={styles.metricsGrid} aria-label="Métricas del día">
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Alumnos Registrados</span>
          <span className={styles.metricValue}>{totalStudents}</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Cursos Activos</span>
          <span className={styles.metricValue}>{totalClassrooms}</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>En Portón Ahora</span>
          <span className={styles.metricValue} style={{ color: '#FCD34D' }}>
            {inProcessCount}
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Retiros Completados</span>
          <span className={styles.metricValue} style={{ color: '#6EE7B7' }}>
            {completedCount}
          </span>
        </div>
      </section>

      {/* ── Navigation Hub ── */}
      <h3 className={styles.sectionTitle}>Puntos de Contacto y Vistas Operativas</h3>
      <section className={styles.navGrid}>
        <Link
          href="/board/SAN-1024"
          target="_blank"
          className={styles.navCard}
        >
          <span className={styles.navCardIcon}>📺</span>
          <span className={styles.navCardTitle}>Smart TV Portón (Layer 0) ↗</span>
          <span className={styles.navCardDesc}>
            Pantalla pasiva con códigos anónimos Animal + Color y código QR visible para apoderados.
          </span>
        </Link>

        <Link
          href="/staff"
          target="_blank"
          className={styles.navCard}
        >
          <span className={styles.navCardIcon}>📋</span>
          <span className={styles.navCardTitle}>Portal de Portón Staff (Layer 1) ↗</span>
          <span className={styles.navCardDesc}>
            Tablet para el auxiliar con cola de llamados y validación con teclado táctil de 6 dígitos.
          </span>
        </Link>

        <Link
          href="/retirar?session=SAN-1024"
          target="_blank"
          className={styles.navCard}
        >
          <span className={styles.navCardIcon}>📱</span>
          <span className={styles.navCardTitle}>Móvil del Picker (/retirar) ↗</span>
          <span className={styles.navCardDesc}>
            Experiencia web sin descarga de app para que apoderados y choferes anuncien su llegada.
          </span>
        </Link>
      </section>
    </div>
  );
}
