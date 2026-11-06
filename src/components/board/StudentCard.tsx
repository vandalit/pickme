import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { getAnimal, getColor, getPublicLabel, AnimalId, ColorId } from '@/lib/avatars';
import styles from './StudentCard.module.css';

export type PublicCustodyStatus =
  | 'WAITING'
  | 'IN_PROCESS'
  | 'HANDOVER'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'ALERT';

export interface StudentCardProps {
  id: string;
  animalId: AnimalId;
  colorId: ColorId;
  classroomName?: string;
  status: PublicCustodyStatus;
  index?: number;
}

export function StudentCard({
  animalId,
  colorId,
  classroomName,
  status,
  index = 0,
}: StudentCardProps) {
  const animal = getAnimal(animalId);
  const color = getColor(colorId);
  const publicLabel = getPublicLabel(animalId, colorId);

  // Status CSS helper
  let statusClass = styles.status_waiting;
  if (status === 'IN_PROCESS') {
    statusClass = styles.status_in_process;
  } else if (status === 'HANDOVER' || status === 'IN_TRANSIT' || status === 'ARRIVED') {
    statusClass = styles.status_picked_up;
  } else if (status === 'ALERT') {
    statusClass = styles.status_alert;
  }

  const isCompleted =
    status === 'HANDOVER' || status === 'IN_TRANSIT' || status === 'ARRIVED';

  // CSS custom variables for dynamic color injection
  const cardStyle = {
    '--card-color': color.hex,
    '--card-color-dim': `${color.hex}22`,
    '--card-color-glow': `${color.hex}33`,
    '--card-delay': `${Math.min(index * 25, 600)}ms`,
  } as React.CSSProperties;

  return (
    <article
      className={`${styles.card} ${statusClass}`}
      style={cardStyle}
      aria-label={`Alumno anónimo ${publicLabel}, estado ${status}`}
    >
      <div className={styles.glow} aria-hidden="true" />

      {classroomName && (
        <span className={styles.classroomTag} title={`Curso ${classroomName}`}>
          {classroomName}
        </span>
      )}

      <div className={styles.avatarWrapper}>
        <span className={styles.emoji} aria-label={animal.name}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        </span>
        {isCompleted && (
          <span className={styles.checkmark} aria-label="Retirado">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
      </div>

      <div className={styles.labelWrapper}>
        <span className={styles.publicName}>{publicLabel}</span>
      </div>

      <Badge status={status} size="sm" />
    </article>
  );
}
