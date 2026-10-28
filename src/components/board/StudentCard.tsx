'use client';

import { useEffect, useState } from 'react';
import type { Student, StudentStatus } from '@/lib/session';
import { getAnimal, getColor } from '@/lib/avatars';
import styles from './StudentCard.module.css';

interface StudentCardProps {
  student: Student;
  index: number;
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

export function StudentCard({ student, index }: StudentCardProps) {
  const [mounted, setMounted] = useState(false);
  const [prevStatus, setPrevStatus] = useState<StudentStatus>(student.status);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // Stagger entrance animation
    const t = setTimeout(() => setMounted(true), index * 60);
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
  const status     = STATUS_CONFIG[student.status];

  return (
    <div
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
        '--card-delay': `${index * 60}ms`,
      } as React.CSSProperties}
      aria-label={`${animalData.emoji} ${status.label}`}
    >
      {/* Glow background */}
      <div className={styles.glow} aria-hidden="true" />

      {/* Animal emoji */}
      <div className={styles.emojiWrapper}>
        <span className={styles.emoji} role="img" aria-label={animalData.name}>
          {animalData.emoji}
        </span>
        {student.status === 'picked_up' && (
          <span className={styles.checkmark} aria-hidden="true">✓</span>
        )}
      </div>

      {/* Color dot */}
      <div
        className={styles.colorDot}
        style={{ background: colorData.hex }}
        aria-hidden="true"
      />

      {/* Status badge */}
      <div className={`${styles.statusBadge} ${status.className}`}>
        <span className={styles.statusDot} aria-hidden="true" />
        {status.label}
      </div>

      {/* Grade — only visible on hover/focus for accessibility, not public */}
      <div className={styles.grade} aria-hidden="true">{student.grade}</div>
    </div>
  );
}
