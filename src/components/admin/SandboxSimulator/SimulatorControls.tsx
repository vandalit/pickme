'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import styles from './SimulatorControls.module.css';

export interface SimulatorControlsProps {
  currentStage: 1 | 2 | 3 | 4;
  onAdvanceToStage: (stage: 1 | 2 | 3 | 4) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function SimulatorControls({
  currentStage,
  onAdvanceToStage,
  onReset,
  isLoading = false,
}: SimulatorControlsProps) {
  const steps = [
    { num: 1, label: '1. Alumnos en espera' },
    { num: 2, label: '2. Retirador llega al portón' },
    { num: 3, label: '3. Verificación del código' },
    { num: 4, label: '4. Entrega confirmada' },
  ];

  return (
    <div
      className={styles.controlsCard}
      role="region"
      aria-label="Panel de control del simulador de colegio"
    >
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <div className={styles.title}>
            <span>Simulador Interactivo de Colegio</span>
            <span className={styles.badgeSandbox}>Sandbox Sofía</span>
          </div>
          <p className={styles.subtitle}>
            Recorre paso a paso una salida escolar completa: desde que el retirador llega hasta que el alumno es entregado y registrado.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={onReset}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reiniciar Simulación
        </Button>
      </div>

      <div className={styles.stepper}>
        {steps.map((st) => {
          const isActive = currentStage === st.num;
          const isDone = currentStage > st.num;
          return (
            <button
              type="button"
              key={st.num}
              onClick={() => onAdvanceToStage(st.num as 1 | 2 | 3 | 4)}
              className={`${styles.stepItem} ${isActive ? styles.active : ''} ${
                isDone ? styles.completed : ''
              }`}
            >
              <span className={styles.stepNumber}>
                {isDone ? '✓ Completado' : `Fase 0${st.num}`}
              </span>
              <span className={styles.stepLabel}>{st.label}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.buttonsRow}>
        <Button
          variant={currentStage === 1 ? 'primary' : 'secondary'}
          size="md"
          onClick={() => onAdvanceToStage(2)}
          disabled={currentStage >= 2}
          isLoading={isLoading && currentStage === 1}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
          1. Simular llegada del retirador
        </Button>

        <Button
          variant={currentStage === 2 ? 'primary' : 'secondary'}
          size="md"
          onClick={() => onAdvanceToStage(3)}
          disabled={currentStage !== 2}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
            <path d="M12 18h.01" />
          </svg>
          2. Mostrar código de verificación
        </Button>

        <Button
          variant={currentStage === 3 ? 'primary' : 'secondary'}
          size="md"
          onClick={() => onAdvanceToStage(4)}
          disabled={currentStage !== 3}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m21 2-2 2m-1.5 1.5L16 7m-4-1a6 6 0 1 0 7 7l3.5-3.5a1.5 1.5 0 0 0 0-2.12l-1.38-1.38a1.5 1.5 0 0 0-2.12 0l-1.5 1.5" />
          </svg>
          3. Confirmar entrega
        </Button>
      </div>
    </div>
  );
}

