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
    { num: 1, label: '1. Espera en Patio' },
    { num: 2, label: '2. Picker en Portón' },
    { num: 3, label: '3. Handover Keypad' },
    { num: 4, label: '4. Custodia Sellada' },
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
            Prueba en tiempo real cómo interactúan el Smart TV, el celular del apoderado y la tablet del portón.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={onReset}>
          🔄 Reiniciar Simulación
        </Button>
      </div>

      <div className={styles.stepper}>
        {steps.map((st) => {
          const isActive = currentStage === st.num;
          const isDone = currentStage > st.num;
          return (
            <div
              key={st.num}
              className={`${styles.stepItem} ${isActive ? styles.active : ''} ${
                isDone ? styles.completed : ''
              }`}
            >
              <span className={styles.stepNumber}>
                {isDone ? '✓ Completado' : `Fase 0${st.num}`}
              </span>
              <span className={styles.stepLabel}>{st.label}</span>
            </div>
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
          🚗 1. Simular Llegada de Picker (Zorro Naranja)
        </Button>

        <Button
          variant={currentStage === 2 ? 'primary' : 'secondary'}
          size="md"
          onClick={() => onAdvanceToStage(3)}
          disabled={currentStage !== 2}
        >
          📱 2. Exhibir Handover Code (849201)
        </Button>

        <Button
          variant={currentStage === 3 ? 'primary' : 'secondary'}
          size="md"
          onClick={() => onAdvanceToStage(4)}
          disabled={currentStage !== 3}
        >
          🔑 3. Ingresar Código y Traspaso
        </Button>
      </div>
    </div>
  );
}

