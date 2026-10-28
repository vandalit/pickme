'use client';

import type { Session, StudentStatus } from '@/lib/session';
import styles from './BoardHeader.module.css';

interface BoardHeaderProps {
  session: Session;
  counts: Record<StudentStatus, number>;
}

export function BoardHeader({ session, counts }: BoardHeaderProps) {
  const total = counts.waiting + counts.in_process + counts.picked_up;

  return (
    <header className={styles.header} role="banner">
      {/* Logo */}
      <div className={styles.logo} aria-label="PickMe">
        <span className={styles.logoIcon} aria-hidden="true">🎯</span>
        <span className={styles.logoText}>Pick<span className={styles.logoAccent}>Me</span></span>
      </div>

      {/* School + session info */}
      <div className={styles.info}>
        <span className={styles.school}>{session.school}</span>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <span className={styles.metaIcon} aria-hidden="true">📅</span>
            {session.date}
          </span>
          <span className={styles.metaDivider} aria-hidden="true">·</span>
          <span className={styles.metaItem}>
            <span className={styles.metaIcon} aria-hidden="true">🕐</span>
            Salida {session.time}
          </span>
        </div>
      </div>

      {/* Stats pills */}
      <div className={styles.stats} role="region" aria-label="Estadísticas de retiro">
        <div className={`${styles.pill} ${styles.pillWaiting}`}>
          <span className={styles.pillDot} aria-hidden="true" />
          <span className={styles.pillCount}>{counts.waiting}</span>
          <span className={styles.pillLabel}>esperando</span>
        </div>
        <div className={`${styles.pill} ${styles.pillProcess}`}>
          <span className={styles.pillDot} aria-hidden="true" />
          <span className={styles.pillCount}>{counts.in_process}</span>
          <span className={styles.pillLabel}>en proceso</span>
        </div>
        <div className={`${styles.pill} ${styles.pillDone}`}>
          <span className={styles.pillDot} aria-hidden="true" />
          <span className={styles.pillCount}>{counts.picked_up}</span>
          <span className={styles.pillLabel}>retirados</span>
        </div>
        <div className={`${styles.pill} ${styles.pillTotal}`}>
          <span className={styles.pillCount}>{total}</span>
          <span className={styles.pillLabel}>total</span>
        </div>
      </div>
    </header>
  );
}
