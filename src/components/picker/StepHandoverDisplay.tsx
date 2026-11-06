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

  const whatsappShareText = encodeURIComponent(
    `Hola, acabo de anunciar el retiro de ${label} (${classroomName}) en ${schoolName}. Código de entrega para portón: ${handoverCode}. Vigencia: 10 minutos.`
  );
  const whatsappShareUrl = `https://wa.me/?text=${whatsappShareText}`;

  if (isCompleted) {
    return (
      <div
        className={`${styles.card} ${styles.successCard}`}
        role="alert"
        aria-label="Entrega completada"
      >
        <span className={styles.successIcon} aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <h2 className={styles.successTitle}>¡Traspaso Físico Confirmado!</h2>
        <p className={styles.successDesc}>
          El personal de portón ha validado el código y entregado al alumno. La custodia ha quedado registrada de forma inmutable en el libro de auditoría.
        </p>

        <div className={styles.studentHero} style={heroStyle}>
          <div className={styles.avatar}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z" />
              <path d="M19 11v2a7 7 0 0 1-14 0v-2" />
            </svg>
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
        <span className={styles.schoolLabel}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h1M14 10h1M9 14h1M14 14h1" />
          </svg>
          <span>{schoolName}</span>
        </span>
        <Badge status={status as any} size="sm" />
      </div>

      <div className={styles.studentHero} style={heroStyle}>
        <div className={styles.avatar}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v8M8 12h8" />
          </svg>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Expira en {timerDisplay}</span>
        </span>
      </div>

      <div className={styles.instructions}>
        <p>
          <strong>Muestra este código</strong> a la persona de portón para que verifique tu identidad y te entregue al alumno.
        </p>
      </div>

      {/* WhatsApp Direct Deep-Link ($0 Costo) */}
      <a
        href={whatsappShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.whatsappBtn}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        <span>Compartir por WhatsApp (wa.me)</span>
      </a>

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
