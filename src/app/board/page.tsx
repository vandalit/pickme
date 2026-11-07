'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function BoardLandingPage() {
  const router = useRouter();
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinCode.trim().toUpperCase();
    if (!clean || clean.length < 3) {
      setError('Por favor ingresa un código de sesión válido (ej: CP-5355).');
      return;
    }
    setError(null);
    router.push(`/board/${encodeURIComponent(clean)}`);
  };

  return (
    <main className={styles.container}>
      <div className={styles.backgroundGlow} aria-hidden="true" />

      <div className={styles.card}>
        <header className={styles.header}>
          <div className={styles.logoBadge} aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>

          <span className={styles.pretitle}>Pantalla de Patio Escolar</span>
          <h1 className={styles.title}>Sintonizar Smart TV</h1>
          <p className={styles.subtitle}>
            Ingresa el código alfanumérico generado por Dirección para proyectar la salida en tiempo real.
          </p>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <label htmlFor="pinCode" className={styles.label}>
              Código de Sesión del Colegio
            </label>
            <input
              id="pinCode"
              type="text"
              autoFocus
              required
              placeholder="ej: CP-5355"
              value={pinCode}
              onChange={(e) => {
                setPinCode(e.target.value);
                if (error) setError(null);
              }}
              className={styles.pinInput}
              autoComplete="off"
              maxLength={12}
            />
          </div>

          {error && (
            <p style={{ color: '#f87171', fontSize: '0.875rem', margin: '-0.5rem 0 0 0', fontWeight: 600 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!pinCode.trim()}
          >
            <span>Conectar Pantalla</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </form>

        <footer className={styles.footerNotes}>
          <p>
            ¿No conoces el código de hoy? Solicítalo al equipo directivo en el{' '}
            <Link href="/auth/login" className={styles.footerLink}>
              Panel Institucional
            </Link>.
          </p>
        </footer>
      </div>
    </main>
  );
}
