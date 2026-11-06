import React from 'react';
import styles from './TvFrame.module.css';

interface TvFrameProps {
  id?: string;
  children: React.ReactNode;
}

export function TvFrame({ id, children }: TvFrameProps) {
  return (
    <div id={id} className={styles.frameContainer}>
      <div className={styles.deviceHeader}>
        <span className={styles.deviceTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="20" height="15" x="2" y="3" rx="2" />
            <polyline points="17 21 12 18 7 21" />
          </svg>
          <span>Smart TV Mural · Patio Escolar</span>
        </span>
        <span className={styles.layerBadge}>Capa 0 · Público Pasivo</span>
      </div>

      <div className={styles.tvBezel}>
        <div className={styles.tvScreen}>
          {children}
        </div>
        <div className={styles.tvBottomBar}>
          <span className={styles.tvBrandLogo}>PickMe Display · 1080p · ~48–50"</span>
          <span className={styles.tvLed} title="Smart TV Conectada y en vivo" />
        </div>
      </div>
      <div className={styles.tvWallMount} />

      <div className={styles.deviceFootnote}>
        <span className={styles.footnoteHighlight}>Pantalla del patio:</span> Cada alumno aparece con su <strong>avatar anónimo</strong> (animal + color) cuando su retirador se anuncia — sin que el público general pueda asociar el avatar con un nombre real. TV mural recomendado: <strong>48–55"</strong> Full-HD.
      </div>
    </div>
  );
}

