'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './OnboardingCards.module.css';
import { setRoleAction } from './actions';

interface Props {
  userEmail: string;
}

export default function OnboardingCards({ userEmail }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<'admin' | 'staff' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelectAdmin() {
    setLoading('admin');
    setError(null);
    try {
      const result = await setRoleAction('SCHOOL_ADMIN');
      if (result.ok) {
        router.push('/admin/onboarding');
      } else {
        setError(result.error ?? 'Error al configurar rol de director.');
        setLoading(null);
      }
    } catch {
      setError('Error inesperado. Intenta nuevamente.');
      setLoading(null);
    }
  }

  async function handleSelectStaff() {
    setLoading('staff');
    setError(null);
    try {
      const result = await setRoleAction('STAFF');
      if (result.ok) {
        router.push('/staff/join');
      } else {
        setError(result.error ?? 'Error al configurar rol de portería.');
        setLoading(null);
      }
    } catch {
      setError('Error inesperado. Intenta nuevamente.');
      setLoading(null);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.cards}>
        {/* Card Director */}
        <button
          className={`${styles.card} ${styles.cardAdmin}`}
          onClick={handleSelectAdmin}
          disabled={loading !== null}
          aria-label="Soy Director o Administrador del colegio"
        >
          <div className={styles.cardIcon}>🏛️</div>
          <h2 className={styles.cardTitle}>Director / Admin</h2>
          <p className={styles.cardDesc}>
            Creo y administro el colegio. Gestiono cursos, alumnos, equipo de portería y sesiones de retiro.
          </p>
          {loading === 'admin' && <span className={styles.spinner} />}
        </button>

        {/* Card Staff */}
        <button
          className={`${styles.card} ${styles.cardStaff}`}
          onClick={handleSelectStaff}
          disabled={loading !== null}
          aria-label="Soy personal de portería o staff"
        >
          <div className={styles.cardIcon}>🚪</div>
          <h2 className={styles.cardTitle}>Portería / Staff</h2>
          <p className={styles.cardDesc}>
            Opero el sistema en el portón. Recibo el listado de alumnos, valido retiros y coordino salidas.
          </p>
          {loading === 'staff' && <span className={styles.spinner} />}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <p className={styles.hint}>
        Sesión iniciada como <strong>{userEmail}</strong>
      </p>
    </div>
  );
}

