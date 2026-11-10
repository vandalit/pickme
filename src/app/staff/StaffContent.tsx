'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  StaffHeader,
  StaffFilterTab,
  ValidationCard,
  HandoverModal,
  StaffEventItem,
} from '@/components/staff';
import styles from './page.module.css';

interface StaffContentProps {
  staffName: string;
  schoolName: string;
  defaultExitTime?: string | null;
  timezone?: string | null;
  activeSessionCode: string | null;
  activeSessionId: string | null;
  onSignOut: () => Promise<void>;
}

export default function StaffContent({
  staffName,
  schoolName,
  defaultExitTime,
  timezone,
  activeSessionCode,
  activeSessionId,
  onSignOut,
}: StaffContentProps) {
  const [currentTab, setCurrentTab] = useState<StaffFilterTab>('ALL');
  const [events, setEvents] = useState<StaffEventItem[]>([]);
  const [counts, setCounts] = useState({
    inProcess: 0,
    waiting: 0,
    completed: 0,
    total: 0,
  });
  // Session code puede actualizarse si se abre jornada después de cargar
  const [sessionCode, setSessionCode] = useState(activeSessionCode);
  const [sessionId, setSessionId] = useState(activeSessionId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<StaffEventItem | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const url = sessionCode
        ? `/api/staff/queue?session=${encodeURIComponent(sessionCode)}`
        : '/api/staff/queue';

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events || []);
        setCounts(data.counts || { inProcess: 0, waiting: 0, completed: 0, total: 0 });
        if (data.session) {
          setSessionCode(data.session.sessionCode);
          setSessionId(data.session.id);
        }
      }
    } catch (err) {
      console.error('Error al cargar cola de portón:', err);
    }
  }, [sessionCode]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchQueue();
    setIsRefreshing(false);
  };

  const filteredEvents = events.filter((evt) => {
    if (currentTab === 'IN_PROCESS') return evt.status === 'IN_PROCESS';
    if (currentTab === 'WAITING') return evt.status === 'WAITING';
    if (currentTab === 'COMPLETED')
      return evt.status === 'IN_TRANSIT' || evt.status === 'ARRIVED';
    return true;
  });

  return (
    <>
      <StaffHeader
        staffName={staffName}
        schoolName={schoolName}
        sessionCode={sessionCode ?? 'Sin jornada'}
        sessionId={sessionId}
        defaultExitTime={defaultExitTime}
        timezone={timezone}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        counts={counts}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        onSignOut={onSignOut}
      />

      <main className={styles.mainContent}>
        {filteredEvents.length === 0 ? (
          <div className={styles.emptyState} role="status">
            <span className={styles.emptyIcon} aria-hidden="true">
              {currentTab === 'IN_PROCESS' ? (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              ) : currentTab === 'COMPLETED' ? (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h1M14 10h1M9 14h1M14 14h1" />
                </svg>
              )}
            </span>
            <h2 className={styles.emptyTitle}>
              {currentTab === 'IN_PROCESS'
                ? 'No hay apoderados anunciados en portón'
                : currentTab === 'COMPLETED'
                ? 'Aún no hay entregas completadas hoy'
                : 'No hay alumnos en esta vista'}
            </h2>
            <p className={styles.emptyDesc}>
              {currentTab === 'IN_PROCESS'
                ? 'Cuando un apoderado o picker anuncie su llegada desde su enlace móvil o QR, aparecerá aquí inmediatamente con su código de entrega.'
                : 'Los llamados y traspasos se actualizarán automáticamente en tiempo real.'}
            </p>
          </div>
        ) : (
          <div className={styles.queueList}>
            {filteredEvents.map((evt) => (
              <ValidationCard
                key={evt.id}
                event={evt}
                onValidate={(event) => setSelectedEvent(event)}
              />
            ))}
          </div>
        )}
      </main>

      <HandoverModal
        isOpen={Boolean(selectedEvent)}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onSuccess={() => {
          setSelectedEvent(null);
          fetchQueue();
        }}
      />
    </>
  );
}
