import React from 'react';
import styles from './PcFrame.module.css';

interface PcFrameProps {
  children: React.ReactNode;
}

export function PcFrame({ children }: PcFrameProps) {
  return (
    <div className={styles.frameContainer}>
      <div className={styles.deviceHeader}>
        <span className={styles.deviceTitle}>
          <span>💻</span>
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
        <span className={styles.footnoteHighlight}>Propósito Capa 2 (Dirección):</span> Registro forense completo en vivo. Conecta la identidad completa del menor con su historial de eventos, funcionario responsable y sello criptográfico de entrega.
      </div>
    </div>
  );
}
