import React from 'react';
import styles from './TvFrame.module.css';

interface TvFrameProps {
  children: React.ReactNode;
}

export function TvFrame({ children }: TvFrameProps) {
  return (
    <div className={styles.frameContainer}>
      <div className={styles.deviceHeader}>
        <span className={styles.deviceTitle}>
          <span>📺</span>
          <span>Smart TV Mural · Patio Escolar</span>
        </span>
        <span className={styles.layerBadge}>Capa 0 · Público Pasivo</span>
      </div>

      <div className={styles.tvBezel}>
        <div className={styles.tvScreen}>
          {children}
        </div>
        <div className={styles.tvBottomBar}>
          <span className={styles.tvBrandLogo}>PickMe Display 1080p</span>
          <span className={styles.tvLed} title="Smart TV Conectada y en vivo" />
        </div>
      </div>
      <div className={styles.tvWallMount} />

      <div className={styles.deviceFootnote}>
        <span className={styles.footnoteHighlight}>Propósito Capa 0:</span> Proyección pasiva visible a distancia en el patio. Identifica a cada alumno únicamente por su par <strong>Animal + Color</strong> sin exponer jamás nombres completos, fotos ni cursos a terceros.
      </div>
    </div>
  );
}
