'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BoardHeader } from '@/components/board/BoardHeader';
import { StudentGrid, BoardStudent } from '@/components/board/StudentGrid';
import { QRPanel } from '@/components/board/QRPanel';
import styles from './page.module.css';

interface BoardPageProps {
  params: Promise<{ sessionId: string }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;

  const [students, setStudents] = useState<BoardStudent[]>([]);
  const [schoolName, setSchoolName] = useState<string>('Colegio');
  const [sessionCode, setSessionCode] = useState<string>(sessionId.slice(0, 8).toUpperCase());
  const [sessionStatus, setSessionStatus] = useState<'LOADING' | 'OPEN' | 'CLOSED' | 'NOT_FOUND'>('LOADING');
  const [closedAtFormatted, setClosedAtFormatted] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [counts, setCounts] = useState({
    waiting: 0,
    inProcess: 0,
    completed: 0,
    total: 0,
  });

  const fetchBoardData = useCallback(async () => {
    try {
      const res = await fetch(`/api/board/${encodeURIComponent(sessionId)}`);
      
      if (res.status === 404) {
        setSessionStatus('NOT_FOUND');
        setIsOffline(false);
        return;
      }

      if (!res.ok) {
        setIsOffline(true);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
        setSchoolName(data.schoolName || 'Colegio');
        setSessionCode(data.sessionCode || sessionId);
        setSessionStatus(data.status || 'OPEN');
        if (data.closedAt) {
          const d = new Date(data.closedAt);
          setClosedAtFormatted(`${d.toLocaleDateString([], { day: '2-digit', month: '2-digit' })} a las ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hrs`);
        }
        if (data.counts) {
          setCounts(data.counts);
        }
        setIsOffline(false);
      }
    } catch {
      // Tolerar micro-cortes de red sin romper la pantalla de la Smart TV
      setIsOffline(true);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchBoardData();
    // Polling reactivo cada 3.5 segundos para la Smart TV de patio
    const interval = setInterval(fetchBoardData, 3500);
    return () => clearInterval(interval);
  }, [fetchBoardData]);

  const effectiveCounts = counts.total > 0 ? counts : {
    waiting: students.filter((s) => s.status === 'WAITING').length,
    inProcess: students.filter((s) => s.status === 'IN_PROCESS').length,
    completed: students.filter(
      (s) => s.status === 'HANDOVER' || s.status === 'IN_TRANSIT' || s.status === 'ARRIVED'
    ).length,
    total: students.length,
  };

  // ── CASO BORDE 1: CARGANDO INICIAL ──
  if (sessionStatus === 'LOADING') {
    return (
      <main className={styles.stateScreen} role="status">
        <div className={styles.stateCard}>
          <div className={styles.stateIconBadge}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h1 className={styles.stateTitle}>Sintonizando Pantalla de Patio</h1>
          <p className={styles.stateSubtitle}>
            Conectando terminal con el servidor escolar... Código: <strong>{sessionId}</strong>
          </p>
        </div>
      </main>
    );
  }

  // ── CASO BORDE 2: SESIÓN NO ENCONTRADA (404) ──
  if (sessionStatus === 'NOT_FOUND') {
    return (
      <main className={styles.stateScreen} role="alert">
        <div className={styles.stateCard}>
          <div className={`${styles.stateIconBadge} ${styles.iconDanger}`}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className={styles.stateTitle}>Sesión no Encontrada</h1>
          <p className={styles.stateSubtitle}>
            El código <strong>{sessionId}</strong> no corresponde a ninguna jornada escolar activa.
            Verifica el código con la Dirección del establecimiento.
          </p>
          <Link href="/board" className={styles.actionBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Ingresar otro Código</span>
          </Link>
        </div>
      </main>
    );
  }

  // ── CASO BORDE 3: JORNADA FINALIZADA / CERRADA (CLOSED) ──
  if (sessionStatus === 'CLOSED') {
    return (
      <main className={styles.stateScreen} role="status">
        <div className={styles.stateCard}>
          <div className={`${styles.stateIconBadge} ${styles.iconSuccess}`}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className={styles.stateTitle}>Jornada de Salida Finalizada</h1>
          <p className={styles.stateSubtitle}>
            Todos los retiros de <strong>{schoolName}</strong> han concluido formalmente.
            Esta pantalla se reactivará automáticamente cuando comience la próxima jornada de salida.
          </p>
          {closedAtFormatted && (
            <div className={styles.stateTimestamp}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Cierre oficial: {closedAtFormatted}</span>
            </div>
          )}
          <Link href="/board" className={`${styles.actionBtn} ${styles.actionBtnOutline}`}>
            <span>Desconectar Pantalla</span>
          </Link>
        </div>
      </main>
    );
  }

  const allCompleted = effectiveCounts.total > 0 && effectiveCounts.waiting === 0 && effectiveCounts.inProcess === 0;

  // ── CASO REGULAR: JORNADA ABIERTA (OPEN) ──
  return (
    <div className={styles.boardContainer}>
      {/* Alerta de reconexión WiFi no intrusiva */}
      {isOffline && (
        <div className={styles.offlinePill} role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 16.71a4 4 0 0 1 2.58 0" />
          </svg>
          <span>Reconectando señal...</span>
        </div>
      )}

      {/* Banner de 100% retirados */}
      {allCompleted && (
        <aside className={styles.allDoneBanner} role="status">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>Todos los alumnos convocados han sido retirados exitosamente. En espera del cierre formal de Dirección.</span>
        </aside>
      )}

      <BoardHeader
        schoolName={schoolName}
        sessionTitle={`Jornada de Salida — Código: ${sessionCode}`}
        counts={effectiveCounts}
      />

      <div className={styles.bodySection}>
        <StudentGrid students={students} />
        <QRPanel
          sessionId={sessionId}
          sessionCode={sessionCode}
        />
      </div>
    </div>
  );
}
