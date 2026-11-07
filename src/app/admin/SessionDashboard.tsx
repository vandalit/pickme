'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import styles from './SessionDashboard.module.css';
import {
  openDailySessionAction,
  closeDailySessionAction,
} from './sessionActions';
import { ScheduleWidget } from './ScheduleWidget';

export interface DashboardRosterItem {
  id: string;
  studentId: string;
  studentName: string;
  initials: string;
  classroom: string;
  animalId: string;
  colorId: string;
  pickerName: string;
  relationship: string;
  status: 'WAITING' | 'IN_PROCESS' | 'IN_TRANSIT' | 'ARRIVED' | 'ALERT';
  handoverCode?: string | null;
  timeFormatted: string;
}

export interface SessionDashboardProps {
  isSessionOpen: boolean;
  activeSession: {
    id: string;
    sessionCode: string;
    startedAt: string | null;
  } | null;
  schoolSummary: {
    totalClassrooms: number;
    activeStudents: number;
    inactiveStudents: number;
  };
  funnelCounts: {
    waiting: number;
    inProcess: number;
    completed: number;
    alert: number;
  };
  roster: DashboardRosterItem[];
}

const COLOR_MAP: Record<string, string> = {
  rojo: '#ef4444',
  azul: '#3b82f6',
  verde: '#22c55e',
  amarillo: '#eab308',
  naranja: '#f97316',
  morado: '#a855f7',
  rosado: '#ec4899',
  celeste: '#06b6d4',
  cafe: '#854d0e',
  lima: '#84cc16',
};

export function SessionDashboard({
  isSessionOpen,
  activeSession,
  schoolSummary,
  funnelCounts,
  roster,
}: SessionDashboardProps) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [dismissalTime, setDismissalTime] = useState('13:30');
  const [copiedLinkKey, setCopiedLinkKey] = useState<string | null>(null);

  // Filtros de tabla
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WAITING' | 'IN_PROCESS' | 'COMPLETED'>('ALL');

  const handleStartSession = () => {
    setActionError(null);
    startTransition(async () => {
      const res = await openDailySessionAction();
      if (!res.success && res.error) {
        setActionError(res.error);
      } else {
        setShowOpenModal(false);
      }
    });
  };

  const handleConfirmClose = () => {
    if (!activeSession) return;
    setActionError(null);
    startTransition(async () => {
      const res = await closeDailySessionAction(activeSession.id);
      if (!res.success && res.error) {
        setActionError(res.error);
      } else {
        setShowCloseModal(false);
      }
    });
  };

  const handleCopy = (key: string, urlPath: string) => {
    if (typeof window === 'undefined') return;
    const fullUrl = `${window.location.origin}${urlPath}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLinkKey(key);
    setTimeout(() => setCopiedLinkKey(null), 2500);
  };

  // Filtrado de la lista en vivo
  const filteredRoster = roster.filter((item) => {
    const matchesSearch =
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.classroom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pickerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.animalId.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'WAITING') return item.status === 'WAITING';
    if (statusFilter === 'IN_PROCESS') return item.status === 'IN_PROCESS';
    if (statusFilter === 'COMPLETED')
      return item.status === 'IN_TRANSIT' || item.status === 'ARRIVED';

    return true;
  });

  return (
    <div className={styles.container}>
      {actionError && (
        <div className={styles.errorMessage} role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{actionError}</span>
        </div>
      )}

      {/* ── CASO A: JORNADA CERRADA / FUERA DE HORARIO ── */}
      {!isSessionOpen && (
        <section className={styles.closedCard} aria-label="Jornada Fuera de Horario">
          <div className={styles.closedIconBadge}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h2 className={styles.closedTitle}>Jornada Escolar Cerrada</h2>
          <p className={styles.closedDesc}>
            Las terminales de salida están en reposo. Al iniciar la jornada, se convocarán automáticamente
            a los alumnos activos y se sincronizarán el Smart TV de patio y la consola de portería.
          </p>

          <div className={styles.schoolMetricsRow}>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>{schoolSummary.totalClassrooms}</span>
              <span className={styles.metricLbl}>Cursos</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal}>{schoolSummary.activeStudents}</span>
              <span className={styles.metricLbl}>Alumnos Activos</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricVal} style={{ color: '#94a3b8' }}>
                {schoolSummary.inactiveStudents}
              </span>
              <span className={styles.metricLbl}>Ausentes / Inactivos</span>
            </div>
          </div>

          {schoolSummary.activeStudents === 0 && (
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '8px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                margin: '0.75rem 0',
                textAlign: 'left',
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: '#e2e8f0', fontSize: '0.9rem' }}>
                  Tu colegio aún no tiene alumnos matriculados
                </p>
                <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                  Para iniciar una jornada de salida, primero debes crear tus cursos o importar la nómina escolar.
                </p>
              </div>
              <Link
                href="/admin/cursos"
                style={{
                  background: 'var(--color-brand, #6366f1)',
                  color: '#ffffff',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Ir a Nómina & Cursos →
              </Link>
            </div>
          )}

          <button
            type="button"
            className={styles.startBtn}
            onClick={() => setShowOpenModal(true)}
            disabled={isPending || schoolSummary.activeStudents === 0}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>{isPending ? 'Iniciando Jornada...' : 'Configurar e Iniciar Jornada de Salida'}</span>
          </button>

          {/* Configuración de apertura automática */}
          <ScheduleWidget />
        </section>
      )}

      {/* ── CASO B: JORNADA ABIERTA / EN CURSO ── */}
      {isSessionOpen && activeSession && (
        <>
          {/* Barra Superior de Control */}
          <section className={styles.controlBar} aria-label="Control de Jornada en Vivo">
            <div className={styles.controlInfo}>
              <div className={styles.titleRow}>
                <h1 className={styles.sessionTitle}>Jornada de Salida</h1>
                <span className={styles.codePill}>{activeSession.sessionCode}</span>
                <span className={styles.liveBadge}>
                  <span className={styles.liveDot} />
                  En Curso
                </span>
              </div>
              <p className={styles.controlSubtitle}>
                {roster.length} Alumnos Convocados · Inicio registrado a las{' '}
                {activeSession.startedAt
                  ? new Date(activeSession.startedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '--:--'}
              </p>
            </div>

            <div className={styles.controlActions}>
              <button
                type="button"
                className={styles.closeSessionBtn}
                onClick={() => setShowCloseModal(true)}
                disabled={isPending}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 9h6v6H9z" />
                </svg>
                <span>Finalizar y Cerrar Jornada</span>
              </button>
            </div>
          </section>

          {/* Launchpad de Pantallas (Despacho Multi-Dispositivo) */}
          <section className={styles.sectionBlock} aria-label="Centro de Despacho">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Centro de Despacho (Launchpad de Pantallas)</h2>
              <p className={styles.sectionDesc}>
                Distribuye o abre en vivo las terminales de salida según el rol y la ubicación física en el colegio.
              </p>
            </div>

            <div className={styles.launchpadGrid}>
              {/* Terminal 1: Smart TV Mural */}
              <article className={styles.launchCard}>
                <div className={styles.launchCardTop}>
                  <div className={`${styles.launchIconWrapper} ${styles.iconTv}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <div className={styles.launchMeta}>
                    <span className={styles.launchBadge}>Capa 0 · Patio Escolar</span>
                    <h3 className={styles.launchCardTitle}>Smart TV Mural</h3>
                    <p className={styles.launchCardDesc}>
                      Proyección anónima en pantalla gigante. Llama a los alumnos por Animal + Color.
                    </p>
                  </div>
                </div>
                <div className={styles.launchActions}>
                  <Link
                    href={`/board/${activeSession.sessionCode}`}
                    target="_blank"
                    className={styles.openLinkBtn}
                  >
                    <span>Lanzar Pantalla Completa ↗</span>
                  </Link>
                  <button
                    type="button"
                    className={styles.copyUrlBtn}
                    onClick={() => handleCopy('tv', `/board/${activeSession.sessionCode}`)}
                  >
                    {copiedLinkKey === 'tv' ? '¡Copiado!' : 'Copiar URL'}
                  </button>
                </div>
              </article>

              {/* Terminal 2: Tablet Portón Staff */}
              <article className={styles.launchCard}>
                <div className={styles.launchCardTop}>
                  <div className={`${styles.launchIconWrapper} ${styles.iconStaff}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="4" y="2" width="16" height="20" rx="2" />
                      <line x1="8" y1="7" x2="16" y2="7" />
                      <line x1="8" y1="11" x2="16" y2="11" />
                    </svg>
                  </div>
                  <div className={styles.launchMeta}>
                    <span className={styles.launchBadge}>Capa 1 · Personal Portería</span>
                    <h3 className={styles.launchCardTitle}>Tablet Portón (Staff)</h3>
                    <p className={styles.launchCardDesc}>
                      Cola viva de entrega con teclado numérico para validar el Handover Code de 6 dígitos.
                    </p>
                  </div>
                </div>
                <div className={styles.launchActions}>
                  <Link
                    href={`/staff?session=${activeSession.sessionCode}`}
                    target="_blank"
                    className={styles.openLinkBtn}
                  >
                    <span>Abrir Consola Portón ↗</span>
                  </Link>
                  <button
                    type="button"
                    className={styles.copyUrlBtn}
                    onClick={() => handleCopy('staff', `/staff?session=${activeSession.sessionCode}`)}
                  >
                    {copiedLinkKey === 'staff' ? '¡Copiado!' : 'Copiar URL'}
                  </button>
                </div>
              </article>

              {/* Terminal 3: Afiche QR / Anuncio Picker */}
              <article className={styles.launchCard}>
                <div className={styles.launchCardTop}>
                  <div className={`${styles.launchIconWrapper} ${styles.iconPicker}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                      <path d="M12 18h.01" />
                    </svg>
                  </div>
                  <div className={styles.launchMeta}>
                    <span className={styles.launchBadge}>Capa 1 · Apoderados & Pickers</span>
                    <h3 className={styles.launchCardTitle}>Punto de Llegada Móvil</h3>
                    <p className={styles.launchCardDesc}>
                      Enlace que escanean los apoderados en portería para identificarse sin descargar apps.
                    </p>
                  </div>
                </div>
                <div className={styles.launchActions}>
                  <Link
                    href={`/retirar?session=${activeSession.sessionCode}`}
                    target="_blank"
                    className={styles.openLinkBtn}
                  >
                    <span>Simular Retiro Picker ↗</span>
                  </Link>
                  <button
                    type="button"
                    className={styles.copyUrlBtn}
                    onClick={() => handleCopy('picker', `/retirar?session=${activeSession.sessionCode}`)}
                  >
                    {copiedLinkKey === 'picker' ? '¡Copiado!' : 'Copiar URL'}
                  </button>
                </div>
              </article>
            </div>
          </section>

          {/* Embudo de Salida en Vivo */}
          <section className={styles.sectionBlock} aria-label="Métricas en Tiempo Real">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Embudo Operativo de Salida</h2>
              <p className={styles.sectionDesc}>
                Distribución en tiempo real de los alumnos convocados para la sesión de hoy.
              </p>
            </div>

            <div className={styles.funnelGrid}>
              <div className={styles.funnelCard}>
                <span className={styles.funnelLabel}>
                  <span style={{ color: '#38bdf8' }}>●</span> En Aula / Esperando
                </span>
                <span className={styles.funnelValue} style={{ color: '#38bdf8' }}>
                  {funnelCounts.waiting}
                </span>
              </div>

              <div className={styles.funnelCard}>
                <span className={styles.funnelLabel}>
                  <span style={{ color: '#fbbf24' }}>●</span> En Portón / Traspaso
                </span>
                <span className={styles.funnelValue} style={{ color: '#fbbf24' }}>
                  {funnelCounts.inProcess}
                </span>
              </div>

              <div className={styles.funnelCard}>
                <span className={styles.funnelLabel}>
                  <span style={{ color: '#4ade80' }}>●</span> Retirados con Éxito
                </span>
                <span className={styles.funnelValue} style={{ color: '#4ade80' }}>
                  {funnelCounts.completed}
                </span>
              </div>

              <div className={styles.funnelCard}>
                <span className={styles.funnelLabel}>
                  <span style={{ color: '#f87171' }}>●</span> Alertas / Retardos
                </span>
                <span className={styles.funnelValue} style={{ color: '#f87171' }}>
                  {funnelCounts.alert}
                </span>
              </div>
            </div>
          </section>

          {/* Monitor en Vivo de Custodia (Nivel Capa 2 Admin) */}
          <section className={styles.sectionBlock} aria-label="Monitor de Alumnos">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Monitor en Tiempo Real (Nivel de Auditoría Capa 2)</h2>
              <p className={styles.sectionDesc}>
                Supervisión directa de identidades, identificadores anónimos y estado de entrega de cada alumno.
              </p>
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableToolbar}>
                <div className={styles.searchInputWrapper}>
                  <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Buscar alumno, curso, avatar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className={styles.filterTabs}>
                  <button
                    type="button"
                    className={`${styles.filterTabBtn} ${statusFilter === 'ALL' ? styles.filterTabBtnActive : ''}`}
                    onClick={() => setStatusFilter('ALL')}
                  >
                    Todos ({roster.length})
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterTabBtn} ${statusFilter === 'WAITING' ? styles.filterTabBtnActive : ''}`}
                    onClick={() => setStatusFilter('WAITING')}
                  >
                    En Aula ({funnelCounts.waiting})
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterTabBtn} ${statusFilter === 'IN_PROCESS' ? styles.filterTabBtnActive : ''}`}
                    onClick={() => setStatusFilter('IN_PROCESS')}
                  >
                    En Portón ({funnelCounts.inProcess})
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterTabBtn} ${statusFilter === 'COMPLETED' ? styles.filterTabBtnActive : ''}`}
                    onClick={() => setStatusFilter('COMPLETED')}
                  >
                    Entregados ({funnelCounts.completed})
                  </button>
                </div>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Identificador Patio (Capa 0)</th>
                      <th>Alumno (Capa 2)</th>
                      <th>Curso</th>
                      <th>Retirador Convocado</th>
                      <th>Estado de Custodia</th>
                      <th>Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoster.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={styles.emptyRoster}>
                          No hay alumnos que coincidan con el filtro seleccionado.
                        </td>
                      </tr>
                    ) : (
                      filteredRoster.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <span className={styles.avatarPill}>
                              <span
                                className={styles.avatarDot}
                                style={{ backgroundColor: COLOR_MAP[item.colorId] || '#94a3b8' }}
                              />
                              <span>
                                {item.animalId} {item.colorId}
                              </span>
                            </span>
                          </td>
                          <td>
                            <div className={styles.studentMeta}>
                              <span className={styles.studentName}>{item.studentName}</span>
                              <span className={styles.studentInitials}>{item.initials}</span>
                            </div>
                          </td>
                          <td>
                            <span className={styles.classroomText}>{item.classroom}</span>
                          </td>
                          <td>
                            <div className={styles.pickerMeta}>
                              <span className={styles.pickerName}>{item.pickerName}</span>
                              <span className={styles.pickerRelation}>{item.relationship}</span>
                            </div>
                          </td>
                          <td>
                            {item.status === 'WAITING' && (
                              <span className={styles.statusWaiting}>
                                <span>●</span> En Aula
                              </span>
                            )}
                            {item.status === 'IN_PROCESS' && (
                              <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <span className={styles.statusInProcess}>
                                  <span>●</span> En Portón
                                </span>
                                {item.handoverCode && (
                                  <span className={styles.handoverCodeBadge}>
                                    {item.handoverCode}
                                  </span>
                                )}
                              </div>
                            )}
                            {(item.status === 'IN_TRANSIT' || item.status === 'ARRIVED') && (
                              <span className={styles.statusDone}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Entregado</span>
                              </span>
                            )}
                            {item.status === 'ALERT' && (
                              <span className={styles.statusInProcess} style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.25)' }}>
                                <span>!</span> Alerta
                              </span>
                            )}
                          </td>
                          <td className={styles.timeCol}>{item.timeFormatted} hrs</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── MODAL DE PREPARACIÓN Y APERTURA DE JORNADA ── */}
      {showOpenModal && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h3 className={styles.modalTitle}>Preparar Jornada de Salida</h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Confirmación de Asistencia Diaria y Convocatoria
                </span>
              </div>
            </div>

            <div style={{ margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                style={{
                  background: 'rgba(74, 222, 128, 0.08)',
                  border: '1px solid rgba(74, 222, 128, 0.25)',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div style={{ color: '#4ade80' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.875rem' }}>
                    {schoolSummary.activeStudents} Alumnos Presentes Convocados
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#86efac' }}>
                    Se proyectarán en el Smart TV de patio y estarán disponibles en el portón.
                  </div>
                </div>
              </div>

              {schoolSummary.inactiveStudents > 0 && (
                <div
                  style={{
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ color: '#fbbf24' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.875rem' }}>
                      {schoolSummary.inactiveStudents} Alumnos Ausentes (Custodia no asumida)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#fde68a' }}>
                      No se proyectarán en TV ni se generarán alertas de retiro para ellos hoy.
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
                <label htmlFor="modalDismissalTime" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>
                  Horario Estimado de Salida:
                </label>
                <input
                  id="modalDismissalTime"
                  type="time"
                  value={dismissalTime}
                  onChange={(e) => setDismissalTime(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    maxWidth: '160px',
                  }}
                />
              </div>

              <div style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '0.25rem' }}>
                ¿Deseas modificar las inasistencias antes de iniciar?{' '}
                <Link href="/admin/cursos" style={{ color: '#818cf8', textDecoration: 'underline' }}>
                  Revisar nómina en Cursos
                </Link>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={() => setShowOpenModal(false)}
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmCloseBtn}
                style={{ background: 'var(--color-brand, #6366f1)', borderColor: 'var(--color-brand, #6366f1)' }}
                onClick={handleStartSession}
                disabled={isPending || schoolSummary.activeStudents === 0}
              >
                {isPending ? 'Iniciando...' : 'Confirmar y Abrir Jornada'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMACIÓN DE CIERRE ── */}
      {showCloseModal && activeSession && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h3 className={styles.modalTitle}>¿Cerrar Jornada Escolar?</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Sesión activa: {activeSession.sessionCode}
                </span>
              </div>
            </div>

            <p className={styles.modalDesc}>
              Al cerrar la jornada, se cerrarán formalmente los accesos en portería, el Smart TV finalizará la
              proyección y todos los registros quedarán archivados e inmutables en la bitácora de auditoría.
            </p>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={() => setShowCloseModal(false)}
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmCloseBtn}
                onClick={handleConfirmClose}
                disabled={isPending}
              >
                {isPending ? 'Cerrando...' : 'Confirmar y Cerrar Jornada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

