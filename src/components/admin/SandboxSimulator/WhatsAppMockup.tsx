'use client';

import React, { useState } from 'react';
import styles from './WhatsAppMockup.module.css';

export interface WhatsAppMockupProps {
  studentName: string;
  studentPublicLabel: string;
  pickerName: string;
  timeString?: string;
  custodyCode?: string;
  onConfirmArrival?: () => void;
  isConfirmed?: boolean;
}

export function WhatsAppMockup({
  studentName = 'Mateo González',
  studentPublicLabel = 'Zorro Naranja',
  pickerName = 'Ignacio Herrera (Tío)',
  timeString = '16:35',
  custodyCode = 'SAN-849201',
  onConfirmArrival,
  isConfirmed = false,
}: WhatsAppMockupProps) {
  const [confirmedLocal, setConfirmedLocal] = useState(isConfirmed);

  const handleConfirm = () => {
    if (confirmedLocal) return;
    setConfirmedLocal(true);
    if (onConfirmArrival) {
      onConfirmArrival();
    }
  };

  return (
    <div
      className={styles.phoneFrame}
      role="region"
      aria-label="Simulación de WhatsApp Apoderado"
    >
      <div className={styles.header}>
        <div className={styles.senderInfo}>
          <div className={styles.avatar}>🎯</div>
          <div className={styles.details}>
            <span className={styles.senderName}>
              PickMe Colegio <span className={styles.verifiedBadge}>✓</span>
            </span>
            <span className={styles.statusText}>Cuenta de servicio verificada</span>
          </div>
        </div>
      </div>

      <div className={styles.canvas}>
        <div className={styles.datePill}>Hoy</div>

        <div className={styles.messageBubble}>
          <div className={styles.messageHeader}>
            <span>🏫</span>
            <span>Aviso de Salida Escolar</span>
          </div>

          <p className={styles.messageBody}>
            Hola Carolina, te informamos que <strong>{studentName}</strong> (
            <em>{studentPublicLabel}</em>) ha sido retirado en portón por{' '}
            <strong>{pickerName}</strong>.
          </p>

          <span className={styles.custodyId}>Custodia #{custodyCode}</span>

          <button
            type="button"
            className={`${styles.confirmBtn} ${
              confirmedLocal ? styles.confirmed : ''
            }`}
            onClick={handleConfirm}
          >
            {confirmedLocal ? '✓ Llegada confirmada a las 16:48' : '¿Llegó a casa? Confirmar aquí ✓'}
          </button>

          <div className={styles.metaRow}>
            <span>{timeString}</span>
            <span className={styles.checkmarks}>✓✓</span>
          </div>
        </div>
      </div>
    </div>
  );
}

