'use client';

import { useEffect, useState } from 'react';
import type { Student, StudentStatus } from '@/lib/session';
import { getAnimal, getColor, getPublicLabel } from '@/lib/avatars';
import styles from './StudentCard.module.css';

interface StudentCardProps {
  student: Student;
  index: number;
  onClick?: () => void;
}

const STATUS_CONFIG: Record<StudentStatus, {
  label: string;
  className: string;
  icon: string;
}> = {
  waiting:    { label: 'Esperando',  className: styles.statusWaiting,   icon: '⏳' },
  in_process: { label: 'En proceso', className: styles.statusInProcess,  icon: '🔄' },
  picked_up:  { label: 'Retirado',   className: styles.statusPickedUp,   icon: '✓' },
};

export function StudentCard({ student, index, onClick }: StudentCardProps) {
  const [mounted, setMounted] = useState(false);
  const [prevStatus, setPrevStatus] = useState<StudentStatus>(student.status);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // Stagger entrance animation
    const t = setTimeout(() => setMounted(true), index * 40);
    return () => clearTimeout(t);
  }, [index]);

  useEffect(() => {
    if (student.status !== prevStatus) {
      const animId = setTimeout(() => setAnimating(true), 0);
      const resetId = setTimeout(() => {
        setPrevStatus(student.status);
        setAnimating(false);
      }, 400);
      return () => {
        clearTimeout(animId);
        clearTimeout(resetId);
      };
    }
  }, [student.status, prevStatus]);

  const animalData = getAnimal(student.animalId as never);
  const colorData  = getColor(student.colorId as never);
  const publicLabel = getPublicLabel(student.animalId as never, student.colorId as never);
  const status     = STATUS_CONFIG[student.status];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`
        ${styles.card}
        ${styles[`status_${student.status}`]}
        ${mounted ? styles.visible : ''}
        ${animating ? styles.animating : ''}
      `}
      style={{
        '--card-color': colorData.hex,
        '--card-color-dim': `${colorData.hex}22`,
        '--card-color-glow': `${colorData.hex}40`,
        '--card-delay': `${index * 40}ms`,
      } as React.CSSProperties}
      aria-label={`${publicLabel} - ${student.grade} - ${status.label}. Clic para ver detalles y gestionar.`}
    >
      {/* Glow background */}
      <div className={styles.glow} aria-hidden="true" />

      {/* Grade badge */}
      <span className={styles.gradeBadge}>{student.grade}</span>

      {/* Animal emoji */}
      <div className={styles.emojiWrapper}>
        <span className={styles.emoji} role="img" aria-label={animalData.name}>
          {animalData.emoji}
        </span>
        {student.status === 'picked_up' && (
          <span className={styles.checkmark} aria-hidden="true">✓</span>
        )}
      </div>

      {/* Public anonymous name (e.g. Cocodrilo Amarillo) */}
      <div className={styles.labelWrapper}>
        <span className={styles.publicName}>{publicLabel}</span>
      </div>

      {/* Status badge */}
      <div className={`${styles.statusBadge} ${status.className}`}>
        <span className={styles.statusDot} aria-hidden="true" />
        {status.label}
      </div>
    </div>
  );
}
