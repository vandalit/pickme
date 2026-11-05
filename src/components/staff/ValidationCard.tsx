'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getAnimal, getColor, getPublicLabel, AnimalId, ColorId } from '@/lib/avatars';
import styles from './ValidationCard.module.css';

export interface StaffEventItem {
  id: string;
  sessionId: string;
  status: 'WAITING' | 'IN_PROCESS' | 'IN_TRANSIT' | 'ARRIVED' | 'ALERT';
  pickerScannedAt?: string | null;
  staffConfirmedAt?: string | null;
  student: {
    id: string;
    fullName: string;
    initials: string;
    animalId: string;
    colorId: string;
    classroomName: string;
  };
  picker: {
    id: string;
    fullName: string;
    relationship: string;
    whatsappNumber: string;
  } | null;
  staffName?: string | null;
}

export interface ValidationCardProps {
  event: StaffEventItem;
  onValidate: (event: StaffEventItem) => void;
  onCallStudent?: (event: StaffEventItem) => void;
}

export function ValidationCard({
  event,
  onValidate,
  onCallStudent,
}: ValidationCardProps) {
  const { student, picker, status } = event;
  const animal = getAnimal((student.animalId || 'zorro') as AnimalId);
  const color = getColor((student.colorId || 'naranja') as ColorId);
  const publicLabel = getPublicLabel(animal.id, color.id);

  const isCompleted = status === 'IN_TRANSIT' || status === 'ARRIVED';
  const isInProcess = status === 'IN_PROCESS';

  const avatarStyle = {
    '--card-color': color.hex,
    '--card-color-dim': `${color.hex}25`,
    '--card-color-glow': `${color.hex}35`,
  } as React.CSSProperties;

  const cardStatusClass = isInProcess
    ? styles.status_in_process
    : isCompleted
    ? styles.status_completed
    : '';

  // Time format
  const formattedTime = event.pickerScannedAt
    ? new Date(event.pickerScannedAt).toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <article className={`${styles.card} ${cardStatusClass}`} style={avatarStyle}>
      <div className={styles.leftSection}>
        <div className={styles.avatar}>
          <span role="img" aria-label={animal.name}>
            {animal.emoji}
          </span>
        </div>

        <div className={styles.studentMeta}>
          <div className={styles.nameRow}>
            <span className={styles.studentName}>{student.fullName}</span>
            <span className={styles.initialsTag}>{student.initials}</span>
            <span className={styles.classroomTag}>({student.classroomName})</span>
          </div>

          <div className={styles.pickerRow}>
            <span>Código: <strong>{publicLabel}</strong></span>
            {picker && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  Retira:{' '}
                  <strong className={styles.pickerHighlight}>
                    {picker.fullName}
                  </strong>
                </span>
                {picker.relationship && <span>({picker.relationship})</span>}
              </>
            )}
          </div>

          {formattedTime && (
            <span className={styles.timeTag}>
              Llegó al portón a las {formattedTime}
            </span>
          )}
        </div>
      </div>

      <div className={styles.rightSection}>
        <Badge status={status} size="md" />

        {isInProcess && (
          <Button
            variant="primary"
            size="md"
            onClick={() => onValidate(event)}
            aria-label={`Validar entrega de ${student.fullName}`}
          >
            Validar Entrega (6 Dígitos)
          </Button>
        )}

        {status === 'WAITING' && onCallStudent && (
          <Button
            variant="secondary"
            size="md"
            onClick={() => onCallStudent(event)}
            aria-label={`Llamar a ${student.fullName} al portón`}
          >
            Llamar a Portón
          </Button>
        )}

        {isCompleted && (
          <div className={styles.completedCheck}>
            <span>✓</span>
            <span>Entregado</span>
          </div>
        )}
      </div>
    </article>
  );
}

