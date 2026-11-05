'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getAnimal, getColor, getPublicLabel, AnimalId, ColorId } from '@/lib/avatars';
import styles from './StepHandoverDisplay.module.css';

export interface StepHandoverDisplayProps {
  handoverCode: string;
  handoverExpiry?: string;
  studentPublicLabel: string;
  studentInitials?: string;
  animalId: string;
  colorId: string;
  classroomName: string;
  schoolName: string;
  status: 'IN_PROCESS' | 'HANDOVER' | 'IN_TRANSIT' | 'ARRIVED' | string;
  onRefreshStatus?: () => Promise<void>;
  onReset: () => void;
}

export function StepHandoverDisplay({
  handoverCode,
  handoverExpiry,
  studentPublicLabel,
  studentInitials,
  animalId,
  colorId,
  classroomName,
  schoolName,
  status,
  onRefreshStatus,
  onReset,
}: StepHandoverDisplayProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(600); // 10 min default
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (handoverExpiry) {
      const expiryMs = new Date(handoverExpiry).getTime();
      const initialSecs = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
      setSecondsLeft(initialSecs);
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handoverExpiry]);

  const handleRefresh = async () => {
    if (!onRefreshStatus) return;
    setIsRefreshing(true);
    try {
      await onRefreshStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  const isCompleted = status === 'IN_TRANSIT' || status === 'ARRIVED';

  const animal = getAnimal((animalId || 'zorro') as AnimalId);
  const color = getColor((colorId || 'naranja') as ColorId);
  const label = studentPublicLabel || getPublicLabel(animal.id, color.id);

  const heroStyle = {
    '--card-color': color.hex,
    '--card-color-dim': `${color.hex}22`,
    '--card-color-glow': `${color.hex}44`,
  } as React.CSSProperties;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (isCompleted) {
    return (
      <div
        className={`${styles.card} ${styles.successCard}`}
        role="alert"
        aria-label="Entrega completada"
      >
        <span className={styles.successIcon} aria-hidden="true">
          ✓
        </span>
        <h2 className={styles.successTitle}>¡Traspaso Físico Confirmado!</h2>
        <p className={styles.successDesc}>
          El personal de portón ha validado el código y entregado al alumno. La custodia ha quedado registrada de forma inmutable.
        </p>

        <div className={styles.studentHero} style={heroStyle}>
          <div className={styles.avatar}>
            <span role="img" aria-label={animal.name}>
              {animal.emoji}
            </span>
          </div>
          <span className={styles.studentLabel}>{label}</span>
          <span className={styles.studentMeta}>
            {classroomName} {studentInitials ? `(${studentInitials})` : ''}
          </span>
        </div>

        <Button variant="secondary" size="lg" fullWidth onClick={onReset}>
          Volver al inicio
        </Button>
      </div>
    );
  }

  return (
    <div
      className={styles.card}
      role="region"
      aria-label="Código de retiro para portón"
    >
      <div className={styles.statusRow}>
        <span className={styles.schoolLabel}>🏫 {schoolName}</span>
        <Badge status={status as any} size="sm" />
      </div>

      <div className={styles.studentHero} style={heroStyle}>
        <div className={styles.avatar}>
          <span role="img" aria-label={animal.name}>
            {animal.emoji}
          </span>
        </div>
        <span className={styles.studentLabel}>{label}</span>
        <span className={styles.studentMeta}>
          {classroomName} {studentInitials ? `(${studentInitials})` : ''}
        </span>
      </div>

      <div className={styles.codeBox} aria-label={`Código de entrega: ${handoverCode}`}>
        <span className={styles.codeInstruction}>Código de Entrega</span>
        <span className={styles.codeDigits}>{handoverCode}</span>
        <span className={styles.timer} aria-live="polite">
          ⏱️ Expira en {timerDisplay}
        </span>
      </div>

      <div className={styles.instructions}>
        <p>
          <strong>Muestra este código</strong> a la persona de portón para que verifique tu identidad y te entregue al alumno.
        </p>
      </div>

      <Button
        variant="secondary"
        size="md"
        fullWidth
        onClick={handleRefresh}
        isLoading={isRefreshing}
      >
        Actualizar estado de retiro
      </Button>
    </div>
  );
}

