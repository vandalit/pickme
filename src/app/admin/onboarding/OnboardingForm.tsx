'use client';

import React, { useActionState } from 'react';
import { completeOnboardingAction, OnboardingState } from './actions';
import styles from './page.module.css';

interface OnboardingFormProps {
  initialAdminName: string;
  userEmail: string;
}

export function OnboardingForm({ initialAdminName, userEmail }: OnboardingFormProps) {
  const [state, formAction, isPending] = useActionState<OnboardingState, FormData>(
    completeOnboardingAction,
    {}
  );

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && (
        <div className={styles.errorBanner} role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="schoolName" className={styles.label}>
          Nombre del Establecimiento Educacional
          <span className={styles.labelRequired}>*</span>
        </label>
        <input
          id="schoolName"
          name="schoolName"
          type="text"
          required
          autoFocus
          placeholder="ej: Colegio Bicentenario Los Andes"
          className={styles.input}
          disabled={isPending}
        />
        <span className={styles.helpText}>
          Nombre público que se proyectará en la Smart TV del patio y en el portal del apoderado.
        </span>
      </div>

      <div className={styles.field}>
        <label htmlFor="address" className={styles.label}>
          Comuna o Dirección del Establecimiento
        </label>
        <input
          id="address"
          name="address"
          type="text"
          placeholder="ej: Av. Libertador Bernardo O'Higgins 1500, Santiago"
          className={styles.input}
          disabled={isPending}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="emergencyPhone" className={styles.label}>
          Teléfono de Contacto / Portería
        </label>
        <input
          id="emergencyPhone"
          name="emergencyPhone"
          type="tel"
          placeholder="ej: +56 9 8765 4321"
          className={styles.input}
          disabled={isPending}
        />
        <span className={styles.helpText}>
          Utilizado como línea de coordinación directa ante contingencias o retardo de pickers.
        </span>
      </div>

      <div className={styles.field}>
        <label htmlFor="adminName" className={styles.label}>
          Nombre del Director(a) o Administrador(a) Responsable
        </label>
        <input
          id="adminName"
          name="adminName"
          type="text"
          defaultValue={initialAdminName}
          className={styles.input}
          disabled={isPending}
        />
        <span className={styles.helpText}>
          Cuenta autenticada: <strong>{userEmail}</strong>
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button type="submit" className={styles.submitBtn} disabled={isPending}>
          {isPending ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span>Configurando establecimiento...</span>
            </>
          ) : (
            <>
              <span>Crear Colegio y Comenzar</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>

        <a
          href="/onboarding"
          style={{
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#94a3b8',
            textDecoration: 'none',
            padding: '0.5rem',
            transition: 'color 0.15s',
          }}
        >
          ← ¿Te equivocaste de rol? Volver a selección (Soy Staff / Portería)
        </a>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
}

