'use client';

import React, { useState } from 'react';
import { StudentCard } from '@/components/board/StudentCard';
import { BoardHeader } from '@/components/board/BoardHeader';
import { QRDisplay } from '@/components/ui/QRDisplay';
import { StepHandoverDisplay } from '@/components/picker/StepHandoverDisplay';
import { Keypad } from '@/components/ui/Keypad';
import { Badge } from '@/components/ui/Badge';
import { WhatsAppMockup } from './WhatsAppMockup';
import styles from './SandboxSplitView.module.css';

export interface SandboxSplitViewProps {
  stage: 1 | 2 | 3 | 4;
  onAdvanceStage: (next: 1 | 2 | 3 | 4) => void;
}

export function SandboxSplitView({
  stage,
  onAdvanceStage,
}: SandboxSplitViewProps) {
  const [tabStaff, setTabStaff] = useState<'staff' | 'whatsapp'>('staff');

  // Simulated state for Zorro Naranja (Mateo González)
  // Stage 1: WAITING
  // Stage 2: IN_PROCESS (amber pulse)
  // Stage 3: IN_PROCESS with Handover Code generated
  // Stage 4: ARRIVED (green checkmark)
  const zorroStatus =
    stage === 1
      ? 'WAITING'
      : stage === 2 || stage === 3
      ? 'IN_PROCESS'
      : 'ARRIVED';

  return (
    <div className={styles.splitGrid}>
      {/* ── Columna 1: Smart TV (Layer 0) ── */}
      <div className={styles.viewColumn}>
        <div className={styles.columnHeader}>
          <span className={styles.columnTitle}>📺 Smart TV Portón</span>
          <span className={styles.layerTag}>Layer 0 — Anónimo</span>
        </div>

        <div className={styles.tvFrame}>
          <BoardHeader
            schoolName="Colegio San Martín"
            sessionTitle="Simulador Sandbox"
            counts={{
              waiting: stage === 1 ? 3 : 2,
              inProcess: stage === 2 || stage === 3 ? 1 : 0,
              completed: stage === 4 ? 1 : 0,
              total: 3,
            }}
          />

          <div className={styles.tvInner}>
            <div className={styles.tvGrid}>
              <StudentCard
                id="s-zorro"
                animalId="zorro"
                colorId="naranja"
                classroomName="1°A"
                status={zorroStatus}
              />
              <StudentCard
                id="s-delfin"
                animalId="delfin"
                colorId="celeste"
                classroomName="1°A"
                status="WAITING"
              />
              <StudentCard
                id="s-osito"
                animalId="osito"
                colorId="cafe"
                classroomName="1°A"
                status="WAITING"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem' }}>
              <QRDisplay value="https://pickme.app/retirar?session=SAN-1024" size={120} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Columna 2: Celular del Picker (/retirar) ── */}
      <div className={styles.viewColumn}>
        <div className={styles.columnHeader}>
          <span className={styles.columnTitle}>📱 Celular Picker</span>
          <span className={styles.layerTag}>Layer 1 — Sin App</span>
        </div>

        <div className={styles.mobileFrame}>
          <div className={styles.notch} />
          <div className={styles.mobileContent}>
            {stage === 1 && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <span style={{ fontSize: '2.5rem' }}>🚗</span>
                <h4 style={{ color: '#F2F2FF', margin: 0 }}>En camino al colegio</h4>
                <p style={{ fontSize: '0.85rem', color: '#8888AA' }}>
                  El apoderado o tío se traslada al colegio. Al llegar, escaneará el QR exterior.
                </p>
                <button
                  type="button"
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: '#6C63FF',
                    color: '#FFF',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => onAdvanceStage(2)}
                >
                  Escanear QR y Anunciar
                </button>
              </div>
            )}

            {stage >= 2 && (
              <StepHandoverDisplay
                handoverCode="849201"
                studentPublicLabel="Zorro Naranja"
                studentInitials="M.G."
                animalId="zorro"
                colorId="naranja"
                classroomName="1° Básico A"
                schoolName="Colegio San Martín"
                status={zorroStatus}
                onReset={() => onAdvanceStage(1)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Columna 3: Tablet de Portón (/staff) o WhatsApp Apoderado ── */}
      <div className={styles.viewColumn}>
        <div className={styles.columnHeader}>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              type="button"
              style={{
                background: tabStaff === 'staff' ? '#6C63FF' : 'transparent',
                color: '#FFF',
                border: 'none',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              onClick={() => setTabStaff('staff')}
            >
              Tablet Portón
            </button>
            <button
              type="button"
              style={{
                background: tabStaff === 'whatsapp' ? '#00A884' : 'transparent',
                color: '#FFF',
                border: 'none',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              onClick={() => setTabStaff('whatsapp')}
            >
              WhatsApp
            </button>
          </div>
          <span className={styles.layerTag}>
            {tabStaff === 'staff' ? 'Carlos (Staff)' : 'Carolina (Mamá)'}
          </span>
        </div>

        {tabStaff === 'staff' ? (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '1rem',
              background: 'rgba(21, 21, 31, 0.85)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#F2F2FF' }}>Mateo González</strong>
                <div style={{ fontSize: '0.75rem', color: '#8888AA' }}>1°A · Retira: Ignacio (Tío)</div>
              </div>
              <Badge status={zorroStatus as any} size="sm" />
            </div>

            {stage < 3 ? (
              <p style={{ fontSize: '0.85rem', color: '#8888AA', textAlign: 'center', padding: '1rem 0' }}>
                {stage === 1
                  ? 'Esperando que el picker anuncie su llegada en el portón...'
                  : 'Picker anunciado. Solicita el código de 6 dígitos que ve en su pantalla.'}
              </p>
            ) : stage === 3 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#8888AA', textAlign: 'center' }}>
                  Ingresa el código <strong>849201</strong>:
                </span>
                <Keypad onComplete={() => onAdvanceStage(4)} />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#6EE7B7', fontWeight: 700 }}>
                ✓ Traspaso Físico Completado
              </div>
            )}
          </div>
        ) : (
          <WhatsAppMockup
            studentName="Mateo González"
            studentPublicLabel="Zorro Naranja"
            pickerName="Ignacio Herrera (Tío)"
            isConfirmed={stage === 4}
            onConfirmArrival={() => onAdvanceStage(4)}
          />
        )}
      </div>
    </div>
  );
}

