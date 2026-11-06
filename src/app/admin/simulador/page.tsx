'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  SimulatorControls,
  SandboxSplitView,
} from '@/components/admin/SandboxSimulator';
import styles from './page.module.css';

export default function SimulatorPage() {
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);

  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <div className={styles.left}>
          <div className={styles.logoBadge} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className={styles.brand}>
            <span className={styles.brandName}>PickMe Sandbox Simulator</span>
            <span className={styles.schoolTitle}>
              Colegio San Martín · Cuenta de Sofía Valenzuela (Directora)
            </span>
          </div>
        </div>

        <div className={styles.navLinks}>
          <Link href="/admin" className={styles.backLink}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Panel Admin
          </Link>
          <Link href="/board/SAN-1024" className={styles.backLink} target="_blank">
            Board TV ↗
          </Link>
          <Link href="/staff" className={styles.backLink} target="_blank">
            Portón Staff ↗
          </Link>
          <Link href="/retirar?session=SAN-1024" className={styles.backLink} target="_blank">
            Móvil Picker ↗
          </Link>
        </div>
      </header>

      <SimulatorControls
        currentStage={stage}
        onAdvanceToStage={(nextStage) => setStage(nextStage)}
        onReset={() => setStage(1)}
      />

      <SandboxSplitView
        stage={stage}
        onAdvanceStage={(nextStage) => setStage(nextStage)}
      />
    </div>
  );
}

