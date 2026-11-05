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

export default function StaffPage() {
  const [currentTab, setCurrentTab] = useState<StaffFilterTab>('IN_PROCESS');
  const [events, setEvents] = useState<StaffEventItem[]>([]);
  const [counts, setCounts] = useState({
    inProcess: 0,
    waiting: 0,
    completed: 0,
    total: 0,
  });
  const [schoolName, setSchoolName] = useState('Colegio San Martín');
  const [sessionCode, setSessionCode] = useState('SAN-1024');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<StaffEventItem | null>(null);

  // Cargar lista de portón desde la API
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/queue');
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events || []);
        setCounts(data.counts || { inProcess: 0, waiting: 0, completed: 0, total: 0 });
        if (data.session) {
          setSchoolName(data.session.schoolName);
          setSessionCode(data.session.sessionCode);
        }
      }
    } catch (err) {
      console.error('Error al cargar cola de portón:', err);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    // Polling reactivo cada 6 segundos
    const interval = setInterval(fetchQueue, 6000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchQueue();
    setIsRefreshing(false);
  };

  // Filtrado de eventos según la pestaña activa
  const filteredEvents = events.filter((evt) => {
    if (currentTab === 'IN_PROCESS') return evt.status === 'IN_PROCESS';
    if (currentTab === 'WAITING') return evt.status === 'WAITING';
    if (currentTab === 'COMPLETED')
      return evt.status === 'IN_TRANSIT' || evt.status === 'ARRIVED';
    return true; // 'ALL'
  });

  return (
    <div className={styles.container}>
      <StaffHeader
        staffName="Carlos Mendoza"
        schoolName={schoolName}
        sessionCode={sessionCode}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        counts={counts}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />

      <main className={styles.mainContent}>
        {filteredEvents.length === 0 ? (
          <div className={styles.emptyState} role="status">
            <span className={styles.emptyIcon} aria-hidden="true">
              {currentTab === 'IN_PROCESS'
                ? '⏳'
                : currentTab === 'COMPLETED'
                ? '📋'
                : '🏫'}
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
                ? 'Cuando un picker escanee el QR exterior o se anuncie en pickme.app/retirar, aparecerá aquí inmediatamente con alerta sonora y visual.'
                : 'Los llamados y entregas se actualizarán automáticamente en tiempo real.'}
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
    </div>
  );
}

