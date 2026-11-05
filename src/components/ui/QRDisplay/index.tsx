'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import styles from './QRDisplay.module.css';

export interface QRDisplayProps {
  value: string;
  size?: number;
  showProgressRing?: boolean;
  progress?: number; // 0 to 1
  className?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
}

export function QRDisplay({
  value,
  size = 220,
  showProgressRing = false,
  progress = 1,
  className = '',
  level = 'M',
}: QRDisplayProps) {
  // SVG circular progress calculation
  const ringRadius = (size + 24) / 2;
  const strokeWidth = 3;
  const normalizedRadius = ringRadius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.max(0, Math.min(1, progress))) * circumference;

  return (
    <div className={`${styles.wrapper} ${className}`.trim()} aria-label="Código QR">
      {showProgressRing && (
        <svg
          className={styles.progressRing}
          viewBox={`0 0 ${ringRadius * 2} ${ringRadius * 2}`}
          aria-hidden="true"
        >
          <circle
            className={styles.ringBg}
            strokeWidth={strokeWidth}
            fill="transparent"
            r={normalizedRadius}
            cx={ringRadius}
            cy={ringRadius}
          />
          <circle
            className={styles.ringFg}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={ringRadius}
            cy={ringRadius}
            transform={`rotate(-90 ${ringRadius} ${ringRadius})`}
          />
        </svg>
      )}

      <div className={styles.qrContainer}>
        <QRCodeSVG
          value={value}
          size={size}
          bgColor="#15151F"
          fgColor="#F2F2FF"
          level={level}
          marginSize={2}
        />
      </div>
    </div>
  );
}

