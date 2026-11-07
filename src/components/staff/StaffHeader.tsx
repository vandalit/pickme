'use client';

import React, { useState } from 'react';
import styles from './StaffHeader.module.css';

export type StaffFilterTab = 'IN_PROCESS' | 'WAITING' | 'COMPLETED' | 'ALL';

export interface StaffHeaderProps {
  staffName: string;
  schoolName: string;
  sessionCode: string;
  sessionId: string | null;
  defaultExitTime?: string | null;
  timezone?: string | null;
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
  onSignOut: () => Promise<void>;
}

export function StaffHeader({
  staffName,
  schoolName,
  sessionCode,
  sessionId,
  defaultExitTime,
  timezone,
  currentTab,
  onSelectTab,
  counts,
  onRefresh,
  isRefreshing = false,
  onSignOut,
}: StaffHeaderProps) {
  const [copied, setCopied] = useState(false);

  const boardUrl = sessionId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/board/${sessionId}`
    : null;

  const handleOpenBoard = () => {
    if (boardUrl) window.open(boardUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyBoard = async () => {
    if (!boardUrl) return;
    try {
      await navigator.clipboard.writeText(boardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para contextos sin clipboard API
      const input = document.createElement('input');
      input.value = boardUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasSession = Boolean(sessionId);

  return (
    <header className={styles.header} role="banner">
      <div className={styles.topRow}>
        <div className={styles.left}>
          <span className={styles.logoIcon} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </span>
          <div className={styles.staffMeta}>
            <div className={styles.staffName}>
              <span>{staffName}</span>
              <span className={styles.roleBadge}>Portón</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className={styles.schoolInfo}>{schoolName}</span>
              {defaultExitTime && (
                <span
                  style={{
                    fontSize: '0.725rem',
                    background: 'rgba(56, 189, 248, 0.1)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '4px',
                    padding: '1px 6px',
                  }}
                  title={`Horario de salida programado (${timezone || 'America/Santiago'})`}
                >
                  Salida: {defaultExitTime} hrs
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.right}>
          <div
            className={`${styles.sessionCodeBadge} ${!hasSession ? styles.sessionCodeInactive : ''}`}
            title={hasSession ? 'Código de la sesión activa' : 'Sin jornada abierta'}
          >
            <span className={`${styles.liveDot} ${!hasSession ? styles.liveDotOff : ''}`} aria-hidden="true" />
            <span>{sessionCode}</span>
          </div>

          {/* Botón Board TV */}
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.boardBtn}`}
            onClick={handleOpenBoard}
            disabled={!hasSession}
            title={hasSession ? `Abrir Smart TV Board (${sessionCode})` : 'No hay jornada activa'}
            aria-label="Sintonizar Smart TV Board"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span>Board TV</span>
          </button>

          {/* Botón copiar enlace */}
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`}
            onClick={handleCopyBoard}
            disabled={!hasSession}
            title={copied ? '¡Copiado!' : 'Copiar enlace del Board'}
            aria-label="Copiar enlace del Board TV"
          >
            {copied ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>

          {/* Botón refrescar */}
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.refreshBtn} ${isRefreshing ? styles.refreshBtnSpin : ''}`}
            onClick={onRefresh}
            aria-label="Actualizar llamados"
            title="Actualizar lista"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-6.5" />
            </svg>
          </button>

          {/* Cerrar sesión */}
          <form action={onSignOut}>
            <button
              type="submit"
              className={`${styles.actionBtn} ${styles.signOutBtn}`}
              title="Cerrar sesión de portón"
              aria-label="Cerrar sesión"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </form>
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
