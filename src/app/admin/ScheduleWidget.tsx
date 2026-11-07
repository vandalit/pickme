'use client';

import React, { useState, useEffect } from 'react';
import styles from './ScheduleWidget.module.css';

export function ScheduleWidget() {
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [savedTime, setSavedTime] = useState<string | null>(null);
  const [inputTime, setInputTime] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // Cargar configuración actual
  useEffect(() => {
    fetch('/api/admin/schedule')
      .then((r) => r.json())
      .then((data) => {
        const t = data.defaultExitTime ?? '';
        setSavedTime(t || null);
        setInputTime(t || '');
        setCurrentTime(t || '');
      })
      .catch(() => setMessage({ type: 'error', text: 'No se pudo cargar el horario.' }))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultExitTime: inputTime || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Error al guardar.' });
      } else {
        setSavedTime(data.defaultExitTime ?? null);
        setMessage({ type: 'ok', text: inputTime ? `Jornada se abrirá automáticamente a las ${inputTime}` : 'Apertura automática desactivada.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setInputTime('');
    setIsSaving(true);
    setMessage(null);
    try {
      await fetch('/api/admin/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultExitTime: null }),
      });
      setSavedTime(null);
      setMessage({ type: 'ok', text: 'Apertura automática desactivada.' });
    } catch {
      setMessage({ type: 'error', text: 'Error al desactivar.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className={styles.widget}>
      <div className={styles.widgetHeader}>
        <span className={styles.widgetIcon} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </span>
        <div>
          <h3 className={styles.widgetTitle}>Apertura automática de jornada</h3>
          <p className={styles.widgetDesc}>
            Cuando el reloj alcance esta hora, la jornada se abrirá con la nómina activa de alumnos.
          </p>
        </div>
      </div>

      <div className={styles.row}>
        <input
          type="time"
          className={styles.timeInput}
          value={inputTime}
          onChange={(e) => setInputTime(e.target.value)}
          disabled={isSaving}
          aria-label="Hora de salida automática"
        />
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={isSaving || inputTime === (savedTime ?? '')}
        >
          {isSaving ? 'Guardando...' : 'Guardar hora'}
        </button>
        {savedTime && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            disabled={isSaving}
            title="Desactivar apertura automática"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {savedTime && !message && (
        <p className={styles.activePill}>
          <span className={styles.activeDot} />
          Programado: jornada se abre a las <strong>{savedTime}</strong> cada día escolar
        </p>
      )}

      {message && (
        <p className={`${styles.feedback} ${message.type === 'error' ? styles.feedbackError : styles.feedbackOk}`} role="status">
          {message.text}
        </p>
      )}
    </div>
  );
}

