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

export interface ClosedSessionLog {
  id: string;
  sessionCode: string;
  closedAt: string;
  startedAt: string;
  totalEvents: number;
  completedCount: number;
  plainText: string;
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
  closedSessionLogs?: ClosedSessionLog[];
}

export function AuditoriaTable({ metrics, logs, closedSessionLogs = [] }: AuditoriaTableProps) {
  const [viewMode, setViewMode] = useState<'PLAIN_TEXT' | 'LIVE_TABLE'>('PLAIN_TEXT');
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    closedSessionLogs[0]?.id || ''
  );
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROCESS' | 'ALERT'>('ALL');

  const selectedClosedSession =
    closedSessionLogs.find((s) => s.id === selectedSessionId) || closedSessionLogs[0];

  const handleCopyText = () => {
    if (!selectedClosedSession?.plainText) return;
    navigator.clipboard.writeText(selectedClosedSession.plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadText = () => {
    if (!selectedClosedSession?.plainText) return;
    const blob = new Blob([selectedClosedSession.plainText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = selectedClosedSession.closedAt.slice(0, 10);
    link.download = `bitacora-forense-${selectedClosedSession.sessionCode}-${dateStr}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

      {/* ── SELECTOR DE VISTA: TEXTO PLANO VS TABLA EN VIVO ── */}
      <div className={styles.viewSelectorRow} role="tablist" aria-label="Formatos de auditoría">
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'PLAIN_TEXT'}
          className={`${styles.viewTabBtn} ${viewMode === 'PLAIN_TEXT' ? styles.viewTabBtnActive : ''}`}
          onClick={() => setViewMode('PLAIN_TEXT')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>Registro Histórico Texto Plano (.txt)</span>
          {closedSessionLogs.length > 0 && (
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({closedSessionLogs.length})</span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'LIVE_TABLE'}
          className={`${styles.viewTabBtn} ${viewMode === 'LIVE_TABLE' ? styles.viewTabBtnActive : ''}`}
          onClick={() => setViewMode('LIVE_TABLE')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span>Explorador de Eventos Individuales</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({logs.length})</span>
        </button>
      </div>

      {/* ── MODO 1: REGISTRO HISTÓRICO TEXTO PLANO ── */}
      {viewMode === 'PLAIN_TEXT' && (
        <div className={styles.logPanelCard}>
          {closedSessionLogs.length === 0 ? (
            <div className={styles.plainTextEmpty}>
              <div style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>Aún no hay jornadas cerradas archivadas</h3>
              <p className={styles.emptySubtitle}>
                Cuando finalice y se selle formalmente una jornada escolar desde la consola de Dirección,
                su bitácora completa en texto plano quedará guardada de forma inmutable aquí con
                timestamps exactos y firma SHA-256 para verificación ministerial y legal.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.logPanelHeader}>
                <div className={styles.sessionSelectorWrapper}>
                  <label htmlFor="sessionSelect" className={styles.sessionSelectLabel}>
                    Jornada Archivada:
                  </label>
                  <select
                    id="sessionSelect"
                    className={styles.sessionSelect}
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                  >
                    {closedSessionLogs.map((s) => {
                      const d = new Date(s.closedAt);
                      const dateStr = d.toLocaleDateString([], {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      });
                      const timeStr = d.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <option key={s.id} value={s.id}>
                          {s.sessionCode} — {dateStr} {timeStr} ({s.completedCount}/{s.totalEvents} retiros)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className={styles.logActions}>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={handleCopyText}
                    title="Copiar texto plano al portapapeles"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                    onClick={handleDownloadText}
                    title="Descargar archivo .txt inmutable"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Descargar .txt</span>
                  </button>
                </div>
              </div>

              {selectedClosedSession && (
                <pre className={styles.plainTextPre} tabIndex={0} aria-label="Contenido de bitácora en texto plano">
                  {selectedClosedSession.plainText}
                </pre>
              )}
            </>
          )}
        </div>
      )}

      {/* ── MODO 2: TABLA DE EVENTOS INDIVIDUALES ── */}
      {viewMode === 'LIVE_TABLE' && (
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
      )}
    </div>
  );
}
