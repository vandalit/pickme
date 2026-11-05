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
          <span className={styles.logoIcon} aria-hidden="true">
            🎯
          </span>
          <div className={styles.brand}>
            <span className={styles.brandName}>PickMe Sandbox Simulator</span>
            <span className={styles.schoolTitle}>
              Colegio San Martín · Cuenta de Sofía Valenzuela (Directora)
            </span>
          </div>
        </div>

        <div className={styles.navLinks}>
          <Link href="/admin" className={styles.backLink}>
            ← Panel Admin
          </Link>
          <Link href="/board/SAN-1024" className={styles.backLink} target="_blank">
            📺 Ver TV en Vivo ↗
          </Link>
          <Link href="/staff" className={styles.backLink} target="_blank">
            📋 Tablet Portón ↗
          </Link>
          <Link href="/retirar?session=SAN-1024" className={styles.backLink} target="_blank">
            📱 Móvil Picker ↗
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

