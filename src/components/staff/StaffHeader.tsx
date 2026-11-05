'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import styles from './StaffHeader.module.css';

export type StaffFilterTab = 'IN_PROCESS' | 'WAITING' | 'COMPLETED' | 'ALL';

export interface StaffHeaderProps {
  staffName: string;
  schoolName: string;
  sessionCode: string;
  currentTab: StaffFilterTab;
  onSelectTab: (tab: StaffFilterTab) => void;
  counts: {
    inProcess: number;
    waiting: number;
    completed: number;
    total: number;
  };
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
}

export function StaffHeader({
  staffName,
  schoolName,
  sessionCode,
  currentTab,
  onSelectTab,
  counts,
  onRefresh,
  isRefreshing = false,
}: StaffHeaderProps) {
  return (
    <header className={styles.header} role="banner">
      <div className={styles.topRow}>
        <div className={styles.left}>
          <span className={styles.logoIcon} aria-hidden="true">
            🎯
          </span>
          <div className={styles.staffMeta}>
            <div className={styles.staffName}>
              <span>{staffName}</span>
              <span className={styles.roleBadge}>Portón</span>
            </div>
            <span className={styles.schoolInfo}>{schoolName}</span>
          </div>
        </div>

        <div className={styles.right}>
          <div
            className={styles.sessionCodeBadge}
            title="Código de la sesión activa"
          >
            <span className={styles.liveDot} aria-hidden="true" />
            <span>{sessionCode}</span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            isLoading={isRefreshing}
            aria-label="Actualizar llamados"
          >
            Actualizar
          </Button>
        </div>
      </div>

      <nav
        className={styles.tabsRow}
        role="tablist"
        aria-label="Filtro de llamados de portón"
      >
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'IN_PROCESS'}
          className={`${styles.tab} ${currentTab === 'IN_PROCESS' ? styles.active : ''}`}
          onClick={() => onSelectTab('IN_PROCESS')}
        >
          <span>En Portón</span>
          <span className={styles.tabPill}>{counts.inProcess}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'WAITING'}
          className={`${styles.tab} ${currentTab === 'WAITING' ? styles.active : ''}`}
          onClick={() => onSelectTab('WAITING')}
        >
          <span>En Espera</span>
          <span className={styles.tabPill}>{counts.waiting}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'COMPLETED'}
          className={`${styles.tab} ${currentTab === 'COMPLETED' ? styles.active : ''}`}
          onClick={() => onSelectTab('COMPLETED')}
        >
          <span>Entregados</span>
          <span className={styles.tabPill}>{counts.completed}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'ALL'}
          className={`${styles.tab} ${currentTab === 'ALL' ? styles.active : ''}`}
          onClick={() => onSelectTab('ALL')}
        >
          <span>Todos</span>
          <span className={styles.tabPill}>{counts.total}</span>
        </button>
      </nav>
    </header>
  );
}
