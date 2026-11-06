'use client';

import React, { useState } from 'react';
import styles from './AuditoriaTable.module.css';

export interface AuditRecord {
  id: string;
  sessionCode: string;
  timestamp: string;
  studentName: string;
  classroom: string;
  pickerName: string;
  staffName: string;
  handoverCode: string;
  status: string;
  hashSha256: string;
}

export interface AuditoriaTableProps {
  metrics: {
    totalEvents: number;
    completedHandover: number;
    inProcess: number;
    alerts: number;
    totalSessions: number;
  };
  logs: AuditRecord[];
}

export function AuditoriaTable({ metrics, logs }: AuditoriaTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROCESS' | 'ALERT'>('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesQuery =
      log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.classroom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.pickerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.sessionCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.handoverCode.includes(searchQuery);

    if (!matchesQuery) return false;

    if (statusFilter === 'COMPLETED') {
      return log.status === 'IN_TRANSIT' || log.status === 'ARRIVED';
    }
    if (statusFilter === 'IN_PROCESS') {
      return log.status === 'IN_PROCESS';
    }
    if (statusFilter === 'ALERT') {
      return log.status === 'ALERT';
    }

    return true;
  });

  return (
    <div className={styles.container}>
      {/* ── TARJETAS DE MÉTRICAS FORENSES ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
              <path d="M12 6v6l4 2" />
            </svg>
            Jornadas Escolares
          </span>
          <span className={styles.metricValue}>{metrics.totalSessions}</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            Eventos Totales
          </span>
          <span className={styles.metricValue}>{metrics.totalEvents}</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel} style={{ color: '#4ade80' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Traspasos Sellados
          </span>
          <span className={styles.metricValue} style={{ color: '#4ade80' }}>
            {metrics.completedHandover}
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel} style={{ color: metrics.alerts > 0 ? '#f87171' : '#94a3b8' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Alertas o Retardos
          </span>
          <span className={styles.metricValue} style={{ color: metrics.alerts > 0 ? '#f87171' : '#94a3b8' }}>
            {metrics.alerts}
          </span>
        </div>
      </div>

      {/* ── TABLA DE AUDITORÍA Y TRAZABILIDAD ── */}
      <div className={styles.tableCard}>
        <div className={styles.toolbar}>
          <div className={styles.searchInputWrapper}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar alumno, código, sesión, retirador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.filterTabs}>
            <button
              type="button"
              className={`${styles.filterBtn} ${statusFilter === 'ALL' ? styles.filterBtnActive : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Todos ({logs.length})
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${statusFilter === 'COMPLETED' ? styles.filterBtnActive : ''}`}
              onClick={() => setStatusFilter('COMPLETED')}
            >
              Entregados ({metrics.completedHandover})
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${statusFilter === 'IN_PROCESS' ? styles.filterBtnActive : ''}`}
              onClick={() => setStatusFilter('IN_PROCESS')}
            >
              En Proceso ({metrics.inProcess})
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${statusFilter === 'ALERT' ? styles.filterBtnActive : ''}`}
              onClick={() => setStatusFilter('ALERT')}
            >
              Alertas ({metrics.alerts})
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sello Temporal</th>
                <th>Sesión</th>
                <th>Alumno & Salón</th>
                <th>Retirador Autorizado</th>
                <th>Funcionario Portón</th>
                <th>Código Handover</th>
                <th>Estado</th>
                <th>Integridad Criptográfica</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>
                    No hay registros de auditoría que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums', fontSize: '0.8125rem' }}>
                      {log.timestamp}
                    </td>
                    <td>
                      <span className={styles.sessionCodePill}>{log.sessionCode}</span>
                    </td>
                    <td>
                      <div className={styles.studentMeta}>
                        <span className={styles.studentName}>{log.studentName}</span>
                        <span className={styles.studentClass}>{log.classroom}</span>
                      </div>
                    </td>
                    <td>{log.pickerName}</td>
                    <td>{log.staffName}</td>
                    <td>
                      <span className={styles.handoverCode}>{log.handoverCode}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color:
                            log.status === 'IN_TRANSIT' || log.status === 'ARRIVED'
                              ? '#4ade80'
                              : log.status === 'IN_PROCESS'
                              ? '#fbbf24'
                              : log.status === 'ALERT'
                              ? '#f87171'
                              : '#94a3b8',
                        }}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td>
                      <span className={styles.hashBadge} title={log.hashSha256}>
                        {log.hashSha256.slice(0, 18)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
