import React from 'react';
import styles from './MobileFrame.module.css';

interface MobileFrameProps {
  id?: string;
  children: React.ReactNode;
}

export function MobileFrame({ id, children }: MobileFrameProps) {
  return (
    <div id={id} className={styles.frameContainer}>
      <div className={styles.deviceHeader}>
        <span className={styles.deviceTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
            <path d="M12 18h.01" />
          </svg>
          <span>Celular del Picker · Web Móvil</span>
        </span>
        <span className={styles.layerBadge}>Capa 1 · Sin Descarga</span>
      </div>

      <div className={styles.mobileChassis}>
        <div className={styles.notchBar}>
          <div className={styles.dynamicIsland}>
            <span className={styles.cameraLens} />
          </div>
        </div>

        <div className={styles.mobileScreen}>
          {children}
        </div>

        <div className={styles.homeIndicatorBar}>
          <div className={styles.homeIndicator} />
        </div>
      </div>

      <div className={styles.deviceFootnote}>
        <span className={styles.footnoteHighlight}>Celular del retirador:</span> Escanea el QR en la entrada con su cámara — sin app — y recibe un <strong>código de un solo uso</strong> (válido 10 min) que entrega al auxiliar para confirmar la entrega.
      </div>
    </div>
  );
}

