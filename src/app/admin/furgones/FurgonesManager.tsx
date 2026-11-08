'use client';

import React, { useState, useTransition } from 'react';
import { createTransportServiceAction, assignStudentToTransportAction } from '../cursos/transportActions';
import styles from './FurgonesManager.module.css';

export interface TransportStudentItem {
  id: string;
  fullName: string;
  classroomName: string;
}

export interface TransportItem {
  id: string;
  name: string;
  driverName: string;
  driverPhone: string;
  plateNumber: string | null;
  students: TransportStudentItem[];
}

interface FurgonesManagerProps {
  initialTransports: TransportItem[];
  unassignedStudents: TransportStudentItem[];
}

export function FurgonesManager({ initialTransports, unassignedStudents }: FurgonesManagerProps) {
  const [transports, setTransports] = useState<TransportItem[]>(initialTransports);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreateTransport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalError(null);
    const formData = new FormData(e.currentTarget);

    const name = formData.get('name') as string;
    const driverName = formData.get('driverName') as string;
    const driverPhone = formData.get('driverPhone') as string;
    const plateNumber = (formData.get('plateNumber') as string) || undefined;

    startTransition(async () => {
      const res = await createTransportServiceAction(name, driverName, driverPhone, plateNumber);
      if (res.success) {
        setIsModalOpen(false);
        window.location.reload();
      } else {
        setModalError(res.error || 'Error al registrar servicio');
      }
    });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerActions}>
        <div className={styles.titleArea}>
          <h2 className={styles.mainTitle}>Servicios de Transporte & Furgones</h2>
          <p className={styles.mainDesc}>
            Conductores escolares externos, asignación colectiva de alumnos y control de llegadas a portería. Base para tracking y GPS.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setModalError(null);
            setIsModalOpen(true);
          }}
          className={styles.btnPrimary}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Registrar Furgón / Transporte
        </button>
      </div>

      {transports.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <h3 style={{ margin: 0, color: '#ffffff' }}>No hay servicios de transporte registrados</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Registra furgones escolares para asociar alumnos y permitir que el chofer retire múltiples estudiantes en un solo pase.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {transports.map((t) => (
            <div key={t.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <h3 className={styles.furgonName}>{t.name}</h3>
                  {t.plateNumber && <span className={styles.furgonPlate}>{t.plateNumber}</span>}
                </div>
                <div className={styles.furgonIconWrapper}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
              </div>

              <div className={styles.driverInfo}>
                <div>
                  <strong>Chofer / Titular:</strong> {t.driverName}
                </div>
                <div>
                  <strong>WhatsApp:</strong>{' '}
                  <a
                    href={`https://wa.me/${t.driverPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#38bdf8', textDecoration: 'none' }}
                  >
                    {t.driverPhone} ↗
                  </a>
                </div>
              </div>

              <div className={styles.studentListSection}>
                <h4 className={styles.studentListTitle}>
                  Alumnos Asignados ({t.students.length})
                </h4>
                {t.students.length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                    Sin alumnos vinculados todavía.
                  </span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {t.students.map((st) => (
                      <span key={st.id} className={styles.studentBadge}>
                        {st.fullName} ({st.classroomName})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL: REGISTRAR FURGÓN ── */}
      {isModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Registrar Nuevo Furgón / Transporte</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div style={{ color: '#f87171', fontSize: '0.85rem' }}>{modalError}</div>
            )}

            <form onSubmit={handleCreateTransport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.field}>
                <label className={styles.label}>Nombre del Servicio o Furgón *</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="ej: Furgón Don Pedro / Tía Carmen"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Nombre del Conductor(a) *</label>
                <input
                  name="driverName"
                  type="text"
                  required
                  placeholder="ej: Pedro Morales"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>WhatsApp de Contacto *</label>
                <input
                  name="driverPhone"
                  type="tel"
                  required
                  placeholder="+56912345678"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Patente del Vehículo (Opcional)</label>
                <input
                  name="plateNumber"
                  type="text"
                  placeholder="ej: BZ-8429"
                  className={styles.input}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Crear Furgón'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

