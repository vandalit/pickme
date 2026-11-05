'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Keypad } from '@/components/ui/Keypad';
import { Button } from '@/components/ui/Button';
import { StaffEventItem } from './ValidationCard';
import { getAnimal, getColor, getPublicLabel, AnimalId, ColorId } from '@/lib/avatars';
import styles from './HandoverModal.module.css';

export interface HandoverModalProps {
  isOpen: boolean;
  event: StaffEventItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function HandoverModal({
  isOpen,
  event,
  onClose,
  onSuccess,
}: HandoverModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isSuccess, setIsSuccess] = useState(false);

  if (!event) return null;

  const { student, picker } = event;
  const animal = getAnimal((student.animalId || 'zorro') as AnimalId);
  const color = getColor((student.colorId || 'naranja') as ColorId);
  const publicLabel = getPublicLabel(animal.id, color.id);

  const avatarStyle = {
    '--card-color': color.hex,
    '--card-color-dim': `${color.hex}25`,
  } as React.CSSProperties;

  const handleCompleteCode = async (code: string) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const res = await fetch('/api/pickup/verificar-handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          enteredCode: code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Código incorrecto');
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Código incorrecto. Vuelve a intentar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setError(undefined);
    setIsSuccess(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={isSuccess ? undefined : 'Validación de Entrega en Portón'}
      maxWidth="sm"
    >
      {isSuccess ? (
        <div className={styles.successScreen} role="status">
          <span className={styles.successIcon} aria-hidden="true">
            ✓
          </span>
          <h3 className={styles.successTitle}>¡Traspaso Confirmado!</h3>
          <p className={styles.successDesc}>
            El alumno ha sido entregado legalmente a {picker?.fullName || 'la persona autorizada'}.
          </p>
        </div>
      ) : (
        <div className={styles.container}>
          <div className={styles.summaryCard} style={avatarStyle}>
            <div className={styles.avatar}>
              <span role="img" aria-label={animal.name}>
                {animal.emoji}
              </span>
            </div>
            <div className={styles.summaryInfo}>
              <span className={styles.studentName}>
                {student.fullName} ({student.initials})
              </span>
              <span className={styles.pickerName}>
                {publicLabel} · {student.classroomName}
              </span>
            </div>
          </div>

          <p className={styles.instruction}>
            Pídele a{' '}
            <span className={styles.highlightPicker}>
              {picker?.fullName || 'la persona que retira'}
            </span>{' '}
            el <strong>código de 6 dígitos</strong> que aparece en su pantalla:
          </p>

          <Keypad
            onComplete={handleCompleteCode}
            isLoading={isLoading}
            error={error}
          />
        </div>
      )}
    </Modal>
  );
}

