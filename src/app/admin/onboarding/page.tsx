import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { resolveUserSchool } from '@/lib/userSchool';
import { OnboardingForm } from './OnboardingForm';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  // Si el usuario ya tiene un colegio asignado, no requiere onboarding
  const { needsOnboarding } = await resolveUserSchool(session.user.email);
  if (!needsOnboarding) {
    redirect('/admin');
  }

  const initialAdminName = session.user.name || 'Director(a)';
  const userEmail = session.user.email;

  return (
    <main className={styles.container}>
      <div className={styles.backgroundGlow} />

      <div className={styles.card}>
        <header className={styles.header}>
          <div className={styles.iconBadge}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>

          <span className={styles.pretitle}>Paso Inicial · Configuración Institucional</span>
          <h1 className={styles.title}>Da de alta tu Colegio</h1>
          <p className={styles.subtitle}>
            Para comenzar a operar las salidas escolares con avatares anónimos y custodia digital verificada, ingresa los datos de tu establecimiento.
          </p>
        </header>

        <OnboardingForm
          initialAdminName={initialAdminName}
          userEmail={userEmail}
        />

        <div className={styles.footerNotes}>
          <p>
            Al registrar tu establecimiento, serás asignado como <strong>Administrador Escolar (Director)</strong> con acceso a nóminas, turnos y auditoría forense.
          </p>
        </div>
      </div>
    </main>
  );
}

