'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './Keypad.module.css';

export interface KeypadProps {
  onComplete: (code: string) => void;
  length?: number;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export function Keypad({
  onComplete,
  length = 6,
  isLoading = false,
  error,
  className = '',
}: KeypadProps) {
  const [digits, setDigits] = useState<string[]>([]);
  const [isShaking, setIsShaking] = useState(false);

  // Trigger error shake when error prop changes
  useEffect(() => {
    if (error) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
  };

  const handlePress = useCallback(
    (val: string) => {
      if (isLoading) return;
      triggerHaptic();

      setDigits((prev) => {
        if (prev.length >= length) return prev;
        const next = [...prev, val];
        if (next.length === length) {
          onComplete(next.join(''));
        }
        return next;
      });
    },
    [isLoading, length, onComplete]
  );

  const handleDelete = useCallback(() => {
    if (isLoading) return;
    triggerHaptic();
    setDigits((prev) => prev.slice(0, -1));
  }, [isLoading]);

  const handleClear = useCallback(() => {
    if (isLoading) return;
    triggerHaptic();
    setDigits([]);
  }, [isLoading]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;
      if (/^[0-9]$/.test(e.key)) {
        handlePress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePress, handleDelete, handleClear, isLoading]);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div
      className={`${styles.keypadContainer} ${isShaking ? styles.shake : ''} ${className}`.trim()}
      role="group"
      aria-label="Teclado numérico de 6 dígitos"
    >
      <div className={styles.displayContainer}>
        <div className={styles.slotsWrapper} aria-live="polite">
          {Array.from({ length }).map((_, idx) => {
            const digit = digits[idx] || '';
            const isFilled = idx < digits.length;
            const isActive = idx === digits.length;
            return (
              <div
                key={idx}
                className={`${styles.slot} ${isFilled ? styles.filled : ''} ${
                  isActive ? styles.active : ''
                } ${error ? styles.hasError : ''}`}
                aria-label={`Dígito ${idx + 1}: ${digit ? 'ingresado' : 'vacío'}`}
              >
                {digit}
              </div>
            );
          })}
        </div>
        {error && <p className={styles.errorMessage} role="alert">{error}</p>}
      </div>

      <div className={styles.grid}>
        {keys.map((num) => (
          <button
            key={num}
            type="button"
            className={styles.keyButton}
            onClick={() => handlePress(num)}
            disabled={isLoading || digits.length >= length}
            aria-label={`Número ${num}`}
          >
            {num}
          </button>
        ))}

        <button
          type="button"
          className={`${styles.keyButton} ${styles.actionKey}`}
          onClick={handleClear}
          disabled={isLoading || digits.length === 0}
          aria-label="Borrar todo"
        >
          C
        </button>

        <button
          type="button"
          className={styles.keyButton}
          onClick={() => handlePress('0')}
          disabled={isLoading || digits.length >= length}
          aria-label="Número 0"
        >
          0
        </button>

        <button
          type="button"
          className={`${styles.keyButton} ${styles.actionKey}`}
          onClick={handleDelete}
          disabled={isLoading || digits.length === 0}
          aria-label="Borrar último dígito"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}

