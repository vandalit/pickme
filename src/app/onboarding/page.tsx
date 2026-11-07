import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import styles from './page.module.css';
import OnboardingCards from './OnboardingCards';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const session = await auth();

  // Guard: requiere autenticación
  if (!session?.user?.email) {
    redirect('/auth/login?callbackUrl=/onboarding');
  }

  const email = session.user.email.toLowerCase().trim();

  // Si ya tiene escuela vinculada, redirigir a su panel
  const dbUser = await prisma.user.findUnique({
    where: { email },
    include: { school: true },
  });

  if (dbUser?.schoolId) {
    // Redirigir según rol
    if (dbUser.role === 'SCHOOL_ADMIN') redirect('/admin');
    if (dbUser.role === 'STAFF') redirect('/staff');
  }

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div className={styles.logo}>🏫</div>
        <h1 className={styles.title}>Bienvenido a PickMe</h1>
        <p className={styles.subtitle}>
          Para comenzar, cuéntanos cuál es tu rol en el sistema.
        </p>
      </div>

      <OnboardingCards userEmail={email} />
    </main>
  );
}

