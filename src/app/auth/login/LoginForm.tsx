'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import styles from './page.module.css';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor completa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        if (res.error === 'CredentialsSignin') {
          setErrorMsg('Credenciales no válidas. Si es tu primera vez, ingresa cualquier contraseña para crear tu cuenta.');
        } else {
          setErrorMsg(`Error de acceso (${res.error}). Inténtalo nuevamente.`);
        }
        setIsLoading(false);
      } else {
        // Redirigir limpiamente
        window.location.href = res?.url || callbackUrl;
      }
    } catch (err: any) {
      console.error('[LoginForm] Error en signIn:', err);
      setErrorMsg('Error de conexión con el servicio de autenticación.');
      setIsLoading(false);
    }
  };

  const setPresetUser = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setErrorMsg(null);
  };

  return (
    <div>
      {/* Botones de prueba rápida (1-clic) */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setPresetUser('sofia@sanmartin.edu', 'demo123')}
          style={{
            padding: '0.65rem 0.85rem',
            background: 'rgba(74, 222, 128, 0.08)',
            border: '1px dashed rgba(74, 222, 128, 0.4)',
            borderRadius: '6px',
            color: '#4ade80',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>Directora Sofía (Colegio San Martín)</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Rellenar datos ⚡</span>
        </button>

        <button
          type="button"
          onClick={() => setPresetUser('director@colegionuevo.cl', 'admin123')}
          style={{
            padding: '0.65rem 0.85rem',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px dashed rgba(56, 189, 248, 0.4)',
            borderRadius: '6px',
            color: '#38bdf8',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>Nuevo Director (Probar Onboarding)</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Rellenar datos ⚡</span>
        </button>
      </div>

      {errorMsg && (
        <div
          role="alert"
          style={{
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            fontSize: '0.875rem',
            lineHeight: 1.45,
          }}
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Correo Electrónico Institucional
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="ej: sofia@sanmartin.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            disabled={isLoading}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isLoading}
        >
          <span>{isLoading ? 'Iniciando sesión...' : 'Ingresar a Consola Escolar'}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
}
