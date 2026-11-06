import React from 'react';
import styles from './PcFrame.module.css';

interface PcFrameProps {
  id?: string;
  children: React.ReactNode;
}

export function PcFrame({ id, children }: PcFrameProps) {
  return (
    <div id={id} className={styles.frameContainer}>
      <div className={styles.deviceHeader}>
        <span className={styles.deviceTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="20" height="14" x="2" y="3" rx="2" />
            <line x1="8" x2="16" y1="21" y2="21" />
            <line x1="12" x2="12" y1="17" y2="21" />
          </svg>
          <span>Consola PC Dirección · Sofía</span>
        </span>
        <span className={styles.layerBadge}>Capa 2 · Auditoría Total</span>
      </div>

      <div className={styles.monitorChassis}>
        <div className={styles.monitorTopBezel}>
          <span className={styles.cameraDot} />
        </div>

        <div className={styles.monitorScreen}>
          {children}
        </div>

        <div className={styles.monitorChin}>
          <span className={styles.monitorLogo}>PickMe Workstation</span>
        </div>
      </div>
      <div className={styles.monitorNeck} />
      <div className={styles.monitorStandBase} />

      <div className={styles.deviceFootnote}>
        <span className={styles.footnoteHighlight}>Panel de la dirección:</span> La dirección ve en su pantalla el estado de cada alumno en tiempo real. Cada entrega queda registrada con nombre completo, retirador, auxiliar responsable y hora exacta — un historial inmutable y consultable.
      </div>
    </div>
  );
}

