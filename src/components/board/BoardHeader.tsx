'use client';

import React, { useState, useEffect } from 'react';
import styles from './BoardHeader.module.css';

export interface BoardHeaderCounts {
  waiting: number;
  inProcess: number;
  completed: number;
  total: number;
}

export interface BoardHeaderProps {
  schoolName: string;
  sessionTitle?: string;
  counts: BoardHeaderCounts;
}

export function BoardHeader({
  schoolName,
  sessionTitle = 'Salida de Alumnos',
  counts,
}: BoardHeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('es-CL', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className={styles.header} role="banner">
      <div className={styles.leftSection}>
        <div className={styles.logo} aria-label="PickMe Smart Board">
          <span className={styles.logoIcon} aria-hidden="true">
            🎯
          </span>
          <span className={styles.logoText}>
            Pick<span className={styles.logoAccent}>Me</span>
          </span>
        </div>

        <div className={styles.schoolInfo}>
          <span className={styles.schoolName}>{schoolName}</span>
          <div className={styles.dateRow}>
            <span>{sessionTitle}</span>
            {currentDate && (
              <>
                <span aria-hidden="true">·</span>
                <span style={{ textTransform: 'capitalize' }}>{currentDate}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.clockSection} aria-label={`Hora actual: ${currentTime}`}>
        <span className={styles.liveIndicator} aria-hidden="true" />
        <span className={styles.clockText}>{currentTime || '--:--:--'}</span>
      </div>

      <div
        className={styles.stats}
        role="region"
        aria-label="Resumen de retiro en tiempo real"
        aria-live="polite"
      >
        <div className={`${styles.pill} ${styles.pillWaiting}`}>
          <span className={styles.pillDot} aria-hidden="true" />
          <span className={styles.pillCount}>{counts.waiting}</span>
          <span className={styles.pillLabel}>esperando</span>
        </div>

        <div className={`${styles.pill} ${styles.pillProcess}`}>
          <span className={styles.pillDot} aria-hidden="true" />
          <span className={styles.pillCount}>{counts.inProcess}</span>
          <span className={styles.pillLabel}>en portón</span>
        </div>

        <div className={`${styles.pill} ${styles.pillDone}`}>
          <span className={styles.pillDot} aria-hidden="true" />
          <span className={styles.pillCount}>{counts.completed}</span>
          <span className={styles.pillLabel}>retirados</span>
        </div>

        <div className={`${styles.pill} ${styles.pillTotal}`}>
          <span className={styles.pillCount}>{counts.total}</span>
          <span className={styles.pillLabel}>total</span>
        </div>
      </div>
    </header>
  );
}
