'use client';

import React from 'react';
import { QRDisplay } from '@/components/ui/QRDisplay';
import styles from './QRPanel.module.css';

export interface QRPanelProps {
  sessionId: string;
  sessionCode: string;
  baseUrl?: string;
}

export function QRPanel({
  sessionId,
  sessionCode,
  baseUrl,
}: QRPanelProps) {
  const origin =
    baseUrl ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'https://pickme.app');

  const targetParam = sessionCode || sessionId;
  const checkinUrl = `${origin}/retirar?session=${encodeURIComponent(targetParam)}`;

  return (
    <aside
      className={styles.panel}
      role="complementary"
      aria-label="Acceso móvil para retiro"
    >
      <div className={styles.liveBadge} role="status">
        <span className={styles.liveDot} aria-hidden="true" />
        <span>Sesión Activa</span>
      </div>

      <QRDisplay
        value={checkinUrl}
        size={190}
        showProgressRing
        progress={1}
      />

      <div className={styles.instruction}>
        <h3 className={styles.instructionTitle}>¿Vienes a retirar?</h3>
        <p className={styles.instructionDesc}>
          Escanea el código QR con tu celular para anunciarte sin filas.
        </p>
      </div>

      <div className={styles.codeCard}>
        <span className={styles.codeLabel}>Código de Portón</span>
        <span className={styles.codeValue}>{sessionCode}</span>
      </div>

      <p className={styles.urlFootnote}>
        O ingresa en <span className={styles.urlHighlight}>pickme.app/retirar</span>
      </p>
    </aside>
  );
}
