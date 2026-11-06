import React from 'react';
import styles from './TabletFrame.module.css';

interface TabletFrameProps {
  id?: string;
  children: React.ReactNode;
}

export function TabletFrame({ id, children }: TabletFrameProps) {
  return (
    <div id={id} className={styles.frameContainer}>
      <div className={styles.deviceHeader}>
        <span className={styles.deviceTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M12 21h.01" />
          </svg>
          <span>Tablet Portón · Auxiliar Carlos</span>
        </span>
        <span className={styles.layerBadge}>Capa 1 · Operativo Staff</span>
      </div>

      <div className={styles.tabletChassis}>
        <div className={styles.tabletTopBezel}>
          <span className={styles.webcamDot} />
        </div>

        <div className={styles.tabletScreen}>
          {children}
        </div>
      </div>

      <div className={styles.deviceFootnote}>
        <span className={styles.footnoteHighlight}>Propósito Capa 1 (Staff):</span> Consola táctil de portería. Exhibe la cola en vivo de llamados con iniciales del menor y nombre del retirador autorizado, permitiendo digitar el código en el <strong>Keypad de 64px</strong> para sellar la entrega física.
      </div>
    </div>
  );
}

