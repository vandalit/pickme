'use client';

import { useEffect } from 'react';
import type { Student, StudentStatus } from '@/lib/session';
import { getAnimal, getColor, getPublicLabel } from '@/lib/avatars';
import styles from './StudentModal.module.css';

interface StudentModalProps {
  student: Student | null;
  onClose: () => void;
  onStatusChange: (studentId: string, newStatus: StudentStatus) => void;
}

export function StudentModal({ student, onClose, onStatusChange }: StudentModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!student) return null;

  const animal = getAnimal(student.animalId);
  const color = getColor(student.colorId);
  const publicLabel = getPublicLabel(student.animalId, student.colorId);

  // Mock custody data for the demo
  const custodyMock = {
    guardian: 'Elena Martínez (Madre)',
    guardianPhone: '+54 9 11 ****-4521',
    picker: student.status === 'waiting' 
      ? 'Aún no anunciado' 
      : 'Martín Benítez (Transporte Escolar #12)',
    pickerDni: student.status === 'waiting' ? '—' : 'DNI terminado en 482',
    handoverCode: student.status === 'waiting' ? 'Pendiente' : 'K7-938',
    authStatus: 'Autorización verificada vía WhatsApp',
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        style={{ '--accent-color': color.hex } as React.CSSProperties}
      >
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar modal">
          ✕
        </button>

        {/* Header con Avatar */}
        <div className={styles.header}>
          <div 
            className={styles.avatarRing}
            style={{ 
              backgroundColor: `${color.hex}22`,
              borderColor: color.hex,
              boxShadow: `0 0 30px ${color.hex}44`
            }}
          >
            <span className={styles.emoji}>{animal.emoji}</span>
          </div>

          <div className={styles.titleInfo}>
            <span className={styles.gradeBadge}>{student.grade}</span>
            <h2 className={styles.publicName}>{publicLabel}</h2>
            <p className={styles.subtext}>Identificador público anónimo (Capa 0)</p>
          </div>
        </div>

        {/* Simulador de Estados (Demo) */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Simulador de Estado (Demo en vivo)</span>
          <div className={styles.statusButtons}>
            <button
              className={`${styles.statusBtn} ${styles.btnWaiting} ${student.status === 'waiting' ? styles.active : ''}`}
              onClick={() => onStatusChange(student.id, 'waiting')}
            >
              <span className={styles.btnDot} />
              ⏳ Esperando
            </button>

            <button
              className={`${styles.statusBtn} ${styles.btnProcess} ${student.status === 'in_process' ? styles.active : ''}`}
              onClick={() => onStatusChange(student.id, 'in_process')}
            >
              <span className={styles.btnDot} />
              🔄 En proceso
            </button>

            <button
              className={`${styles.statusBtn} ${styles.btnPicked} ${student.status === 'picked_up' ? styles.active : ''}`}
              onClick={() => onStatusChange(student.id, 'picked_up')}
            >
              <span className={styles.btnDot} />
              ✓ Retirado
            </button>
          </div>
        </div>

        {/* Capa de Custodia y Seguridad (Staff / Interna) */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Cadena de Custodia (Capa 1/2 Staff)</span>
          <div className={styles.custodyCard}>
            <div className={styles.custodyRow}>
              <span className={styles.rowTitle}>Apoderado titular:</span>
              <span className={styles.rowValue}>{custodyMock.guardian}</span>
            </div>
            <div className={styles.custodyRow}>
              <span className={styles.rowTitle}>Picker asignado:</span>
              <span className={styles.rowValue}>{custodyMock.picker}</span>
            </div>
            <div className={styles.custodyRow}>
              <span className={styles.rowTitle}>Handover Code:</span>
              <span className={`${styles.rowValue} ${styles.codeHighlight}`}>
                {custodyMock.handoverCode}
              </span>
            </div>
            <div className={styles.custodyRow}>
              <span className={styles.rowTitle}>Estado legal:</span>
              <span className={styles.rowValueOk}>{custodyMock.authStatus}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className={styles.footer}>
          <p className={styles.securityNote}>
            🔒 Los nombres y datos personales nunca se proyectan en el Smart TV. Solo son accesibles para el Staff autorizado en la entrega.
          </p>
        </div>
      </div>
    </div>
  );
}

