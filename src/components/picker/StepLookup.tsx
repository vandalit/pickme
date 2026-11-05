'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import styles from './StepLookup.module.css';

export interface StepLookupProps {
  initialSessionCode?: string;
  onSearch: (phone: string, sessionCode: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function StepLookup({
  initialSessionCode = '',
  onSearch,
  isLoading = false,
  error,
}: StepLookupProps) {
  const [phone, setPhone] = useState('+56981112233');
  const [sessionCode, setSessionCode] = useState(initialSessionCode || 'SAN-1024');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    onSearch(phone.trim(), sessionCode.trim());
  };

  const setDemoUser = (demoPhone: string) => {
    setPhone(demoPhone);
  };

  return (
    <div className={styles.card} role="region" aria-label="Identificación de persona autorizada">
      <div className={styles.header}>
        <h2 className={styles.title}>Retiro Escolar</h2>
        <p className={styles.subtitle}>
          Ingresa tu número celular registrado para identificarte como apoderado o persona autorizada.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldGroup}>
          <label htmlFor="phone" className={styles.label}>
            Número de WhatsApp / Celular
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="phone"
              type="tel"
              className={styles.input}
              placeholder="+56 9 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="sessionCode" className={styles.label}>
            Código de Portón / Sesión
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="sessionCode"
              type="text"
              className={styles.input}
              placeholder="Ej: SAN-1024"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        {error && <p className={styles.errorText} role="alert">{error}</p>}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
        >
          Verificar Autorización
        </Button>
      </form>

      <div className={styles.quickFillSection}>
        <span className={styles.quickFillLabel}>Demo — Cuentas rápidas de prueba:</span>
        <div className={styles.pillsRow}>
          <button
            type="button"
            className={styles.pillButton}
            onClick={() => setDemoUser('+56981112233')}
          >
            🧑 Tío Ignacio (+56981112233)
          </button>
          <button
            type="button"
            className={styles.pillButton}
            onClick={() => setDemoUser('+56984445566')}
          >
            🚐 Don Pedro Furgón (+56984445566)
          </button>
          <button
            type="button"
            className={styles.pillButton}
            onClick={() => setDemoUser('+56991112233')}
          >
            👩 Carolina Apoderada (+56991112233)
          </button>
        </div>
      </div>
    </div>
  );
}
