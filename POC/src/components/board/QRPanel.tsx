'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from './QRPanel.module.css';

interface QRPanelProps {
  sessionId: string;
  sessionCode: string;
}

const QR_REFRESH_MS = 5 * 60 * 1000; // 5 min

export function QRPanel({ sessionId, sessionCode }: QRPanelProps) {
  const [qrKey, setQrKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(QR_REFRESH_MS / 1000);

  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/retirar`
      : 'https://pickme.app/retirar';

  const qrUrl = `${baseUrl}?session=${sessionId}`;
  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    qrUrl
  )}&bgcolor=15151F&color=F2F2FF&margin=4&qzone=1&format=svg`;

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setQrKey((k) => k + 1);
      setSecondsLeft(QR_REFRESH_MS / 1000);
      setRefreshing(false);
    }, 500);
  }, []);

  // Countdown + auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          doRefresh();
          return QR_REFRESH_MS / 1000;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [doRefresh]);

  const progress = secondsLeft / (QR_REFRESH_MS / 1000);
  const circumference = 2 * Math.PI * 38;
  const dashoffset = circumference * (1 - progress);

  return (
    <aside className={styles.panel} aria-label="Panel QR de sesión">
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.liveDot} aria-hidden="true" />
          <span className={styles.liveLabel}>Sesión activa</span>
        </div>

        {/* QR Code */}
        <div className={styles.qrWrapper}>
          <svg
            className={styles.progressRing}
            viewBox="0 0 88 88"
            aria-hidden="true"
          >
            <circle
              className={styles.ringBg}
              cx="44"
              cy="44"
              r="38"
              fill="none"
              strokeWidth="3"
            />
            <circle
              className={styles.ringFg}
              cx="44"
              cy="44"
              r="38"
              fill="none"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
              transform="rotate(-90 44 44)"
            />
          </svg>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={qrKey}
            src={qrImgSrc}
            alt={`Código QR – sesión ${sessionCode}`}
            className={`${styles.qrImg} ${refreshing ? styles.refreshOut : styles.refreshIn}`}
            width={220}
            height={220}
          />
        </div>

        {/* Session code */}
        <div className={styles.codeWrapper} aria-label={`Código: ${sessionCode}`}>
          <span className={styles.codeLabel}>Código de sesión</span>
          <span className={styles.code}>{sessionCode}</span>
        </div>

        {/* URL hint */}
        <p className={styles.urlHint}>
          <span className={styles.urlDomain}>pickme.app</span>
          <span className={styles.urlPath}>/retirar</span>
        </p>

        {/* Countdown */}
        <div className={styles.countdown} aria-live="polite">
          <span>🔄</span>
          <span>
            Renueva en{' '}
            <strong>
              {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:
              {String(secondsLeft % 60).padStart(2, '0')}
            </strong>
          </span>
        </div>

        {/* Manual refresh */}
        <button
          className={styles.refreshBtn}
          onClick={doRefresh}
          aria-label="Renovar QR ahora"
        >
          Renovar QR
        </button>
      </div>
    </aside>
  );
}
