import React from 'react';
import styles from './Badge.module.css';

export type BadgeStatus =
  | 'WAITING'
  | 'IN_PROCESS'
  | 'HANDOVER'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'ALERT'
  | 'waiting'
  | 'in_process'
  | 'picked_up'
  | 'alert';

export interface BadgeProps {
  status: BadgeStatus;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DEFAULT_LABELS: Record<string, string> = {
  WAITING: 'Esperando',
  waiting: 'Esperando',
  IN_PROCESS: 'En Portón',
  in_process: 'En Portón',
  HANDOVER: 'En Entrega',
  IN_TRANSIT: 'En Tránsito',
  ARRIVED: 'Entregado',
  picked_up: 'Entregado',
  ALERT: 'Alerta',
  alert: 'Alerta',
};

function getVariantClass(status: BadgeStatus): string {
  const normalized = status.toUpperCase();
  switch (normalized) {
    case 'IN_PROCESS':
      return styles.variant_in_process;
    case 'HANDOVER':
    case 'IN_TRANSIT':
    case 'ARRIVED':
    case 'PICKED_UP':
      return styles.variant_picked_up;
    case 'ALERT':
      return styles.variant_alert;
    case 'WAITING':
    default:
      return styles.variant_waiting;
  }
}

export function Badge({
  status,
  label,
  size = 'md',
  className = '',
}: BadgeProps) {
  const variantClass = getVariantClass(status);
  const sizeClass = styles[`size_${size}`] || styles.size_md;
  const displayLabel = label ?? DEFAULT_LABELS[status] ?? status;

  return (
    <span
      className={`${styles.badge} ${variantClass} ${sizeClass} ${className}`.trim()}
      role="status"
    >
      <span className={styles.dot} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}

