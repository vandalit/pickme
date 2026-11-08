'use client';

import React, { useState, useTransition } from 'react';
import { updateStudentStatusAction, batchUpdateAttendanceAction } from '../cursos/actions';
import {
  openDailySessionAction,
  closeDailySessionAction,
  addLateArrivalToSessionAction,
} from '@/app/admin/sessionActions';
import { getColor } from '@/lib/avatars';
import styles from './AsistenciaManager.module.css';

export interface ClassroomItem {
  id: string;
  grade: string;
  section: string;
  studentCount: number;
}

export interface StudentAttendanceItem {
  id: string;
  fullName: string;
  initials: string;
  classroomId: string;
  classroomName: string;
  animalId: string;
  colorId: string;
  guardianName: string;
  guardianPhone: string;
  authorizedPickers: string;
  status: 'ACTIVE' | 'ABSENT' | 'WITHDRAWN';
  custodyStatus?: 'WAITING' | 'IN_PROCESS' | 'IN_TRANSIT' | 'ARRIVED' | 'ALERT' | null;
}

interface AsistenciaManagerProps {
  initialClassrooms: ClassroomItem[];
  initialStudents: StudentAttendanceItem[];
  schoolName: string;
  activeSessionCode?: string | null;
}

export function AsistenciaManager({
  initialClassrooms,
  initialStudents,
  schoolName,
  activeSessionCode = null,
}: AsistenciaManagerProps) {
  const [classrooms] = useState<ClassroomItem[]>(initialClassrooms);
  const [students, setStudents] = useState<StudentAttendanceItem[]>(initialStudents);
  const [liveSessionCode, setLiveSessionCode] = useState<string | null>(activeSessionCode);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ABSENT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isPending, startTransition] = useTransition();

  // Filtrar solo los alumnos matriculados (excluye alumnos dados de baja)
  const activeRoster = students.filter((s) => s.status !== 'WITHDRAWN');

  const filteredStudents = activeRoster.filter((s) => {
    if (selectedClassroomId !== 'ALL' && s.classroomId !== selectedClassroomId) {
      return false;
    }
    if (statusFilter === 'ACTIVE' && s.status !== 'ACTIVE') {
      return false;
    }
    if (statusFilter === 'ABSENT' && s.status !== 'ABSENT') {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.fullName.toLowerCase().includes(q);
      const matchInitials = s.initials.toLowerCase().includes(q);
      const matchGuardian = s.guardianName.toLowerCase().includes(q);
      const matchAvatar = `${s.animalId} ${s.colorId}`.toLowerCase().includes(q);
      if (!matchName && !matchInitials && !matchGuardian && !matchAvatar) {
        return false;
      }
    }
    return true;
  });

  const presentCount = activeRoster.filter((s) => s.status === 'ACTIVE').length;
  const absentCount = activeRoster.filter((s) => s.status === 'ABSENT').length;

  // Toggle rápido de 1 clic para marcar ingreso a clases
  const handleToggleAttendance = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    // Si el alumno ya fue entregado hoy, no se puede revertir a ausente sin cerrar custodia
    if (student.custodyStatus === 'IN_TRANSIT' || student.custodyStatus === 'ARRIVED') {
      alert(`No se puede modificar la asistencia: ${student.fullName} ya fue entregado físicamente hoy en portería.`);
      return;
    }

    const newStatus: 'ACTIVE' | 'ABSENT' = student.status === 'ACTIVE' ? 'ABSENT' : 'ACTIVE';
    const wasAbsent = student.status === 'ABSENT';

    // Actualización optimista inmediata
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    );

    startTransition(async () => {
      const res = await updateStudentStatusAction(studentId, newStatus);
      if (!res.success) {
        alert(res.error || 'Error al actualizar asistencia');
        // Revertir
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, status: student.status } : s))
        );
        return;
      }

      // Si hay una jornada de salida abierta y el alumno se marca presente (Llegada tardía),
      // se incorpora automáticamente a la lista viva de portón
      if (liveSessionCode && wasAbsent && newStatus === 'ACTIVE') {
        await addLateArrivalToSessionAction(studentId);
      }
    });
  };

  // Marcar todos los alumnos visibles como presentes
  const handleBatchMarkAllPresent = () => {
    const targetStudents = filteredStudents.filter((s) => s.status !== 'ACTIVE');
    if (targetStudents.length === 0) return;
    const targetIds = targetStudents.map((s) => s.id);

    setStudents((prev) =>
      prev.map((s) => (targetIds.includes(s.id) ? { ...s, status: 'ACTIVE' } : s))
    );

    startTransition(async () => {
      await batchUpdateAttendanceAction(targetIds, 'ACTIVE');
      if (liveSessionCode) {
        for (const sid of targetIds) {
          await addLateArrivalToSessionAction(sid);
        }
      }
    });
  };

  // Enviar a salida / Apertura de Jornada con los alumnos presentes
  const handleSendToDeparture = () => {
    if (presentCount === 0) {
      alert('No hay alumnos marcados como presentes hoy para abrir la salida.');
      return;
    }

    startTransition(async () => {
      if (!liveSessionCode) {
        const res = await openDailySessionAction();
        if (res.success && res.sessionCode) {
          setLiveSessionCode(res.sessionCode);
          alert(`¡Jornada de salida aperturada (${res.sessionCode})! Los ${presentCount} alumnos presentes fueron transferidos a la cola de portería.`);
        } else {
          alert(res.error || 'No se pudo iniciar la jornada de salida.');
        }
      } else {
        const activeIds = students.filter((s) => s.status === 'ACTIVE').map((s) => s.id);
        for (const sid of activeIds) {
          await addLateArrivalToSessionAction(sid);
        }
        alert(`Lista viva sincronizada: ${presentCount} alumnos presentes convocados en portón.`);
      }
    });
  };

  // Revocar Pase / Detener Salida
  const handleRevokeDeparturePass = () => {
    if (!liveSessionCode) return;
    const confirmRevoke = window.confirm(
      '¿Deseas revocar el pase de salida y suspender temporalmente las entregas en portón?\n\nEl personal de portería verá inmediatamente la sesión cerrada.'
    );
    if (!confirmRevoke) return;

    startTransition(async () => {
      const res = await closeDailySessionAction();
      if (res.success) {
        setLiveSessionCode(null);
        alert('Jornada de salida detenida. El portón ha sido cerrado.');
      } else {
        alert(res.error || 'No se pudo detener la jornada.');
      }
    });
  };

  return (
    <div className={styles.managerWrapper}>
      {/* ── BARRA DE BÚSQUEDA ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchArea}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por alumno, iniciales, apoderado o avatar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* ── SELECTOR DE SALONES / CURSOS ── */}
      <div className={styles.classroomsRow} role="tablist" aria-label="Cursos del establecimiento">
        <div
          role="tab"
          aria-selected={selectedClassroomId === 'ALL'}
          tabIndex={0}
          className={`${styles.classCard} ${selectedClassroomId === 'ALL' ? styles.classCardActive : ''}`}
          onClick={() => setSelectedClassroomId('ALL')}
        >
          <span className={styles.classCardTitle}>Todos los Cursos</span>
          <span className={styles.classCardCount}>{activeRoster.length} matriculados</span>
        </div>

        {classrooms.map((c) => (
          <div
            key={c.id}
            role="tab"
            aria-selected={selectedClassroomId === c.id}
            tabIndex={0}
            className={`${styles.classCard} ${selectedClassroomId === c.id ? styles.classCardActive : ''}`}
            onClick={() => setSelectedClassroomId(c.id)}
          >
            <span className={styles.classCardTitle}>{c.grade} {c.section}</span>
            <span className={styles.classCardCount}>
              {activeRoster.filter((s) => s.classroomId === c.id).length} alumnos
            </span>
          </div>
        ))}
      </div>

      {/* ── BARRA OPERATIVA DE ASISTENCIA Y CONVOCATORIA ── */}
      <div className={styles.attendanceBar} role="region" aria-label="Control de asistencia y salida">
        <div className={styles.attendanceStats}>
          <span className={`${styles.statBadge} ${styles.statBadgeActive}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <strong>{presentCount}</strong> Presentes hoy (En custodia)
          </span>

          <span className={`${styles.statBadge} ${styles.statBadgeAbsent}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <strong>{absentCount}</strong> Sin ingreso hoy
          </span>
        </div>

        <div className={styles.attendanceActions}>
          <div className={styles.filterAttendanceGroup}>
            <button
              type="button"
              className={`${styles.filterAttendanceBtn} ${statusFilter === 'ALL' ? styles.filterAttendanceBtnActive : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Todos ({activeRoster.length})
            </button>
            <button
              type="button"
              className={`${styles.filterAttendanceBtn} ${statusFilter === 'ACTIVE' ? styles.filterAttendanceBtnActive : ''}`}
              onClick={() => setStatusFilter('ACTIVE')}
            >
              Solo Presentes ({presentCount})
            </button>
            <button
              type="button"
              className={`${styles.filterAttendanceBtn} ${statusFilter === 'ABSENT' ? styles.filterAttendanceBtnActive : ''}`}
              onClick={() => setStatusFilter('ABSENT')}
            >
              Solo Sin Ingreso ({absentCount})
            </button>
          </div>

          <button
            type="button"
            className={styles.btnBatch}
            onClick={handleBatchMarkAllPresent}
            disabled={isPending || absentCount === 0}
            title="Marcar todos los alumnos visibles como presentes hoy"
          >
            Marcar Todos Presentes
          </button>

          <button
            type="button"
            className={styles.btnSendLive}
            onClick={handleSendToDeparture}
            disabled={isPending}
            title={
              liveSessionCode
                ? 'Sincronizar cambios recientes de alumnos presentes con la cola activa en portón'
                : 'Aperturar la jornada escolar y transferir formalmente la nómina viva al personal de portería para que puedan validar retiros'
            }
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            <span>{liveSessionCode ? 'Sincronizar con Portón' : 'Aperturar Salida (Send)'}</span>
            {liveSessionCode && (
              <span className={styles.liveSessionBadge}>
                <span className={styles.livePulseDot} />
                {liveSessionCode}
              </span>
            )}
          </button>

          {liveSessionCode && (
            <button
              type="button"
              className={styles.btnRevokePass}
              onClick={handleRevokeDeparturePass}
              disabled={isPending}
              title="Revocar el pase de salida y suspender temporalmente las entregas en portería"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              <span>Revocar Pase / Detener</span>
            </button>
          )}
        </div>
      </div>

      {/* ── TABLA DE ASISTENCIA Y CUSTODIA VIVA ── */}
      <div className={styles.tableContainer}>
        {filteredStudents.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 style={{ margin: 0, color: '#ffffff' }}>No hay alumnos en este filtro</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
              Selecciona otro curso o borra el término de búsqueda.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Avatar Anónimo (Capa 0)</th>
                  <th>Alumno / Identidad (Capa 2)</th>
                  <th>Curso</th>
                  <th>Apoderado Titular</th>
                  <th>Retiradores / Furgón</th>
                  <th>Asistencia Hoy (Custodia)</th>
                  <th>Pase Rápido</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => {
                  const color = getColor(s.colorId as any);
                  const isDelivered = s.custodyStatus === 'IN_TRANSIT' || s.custodyStatus === 'ARRIVED';
                  const isInProcess = s.custodyStatus === 'IN_PROCESS';

                  return (
                    <tr key={s.id}>
                      <td>
                        <span
                          className={styles.avatarBadge}
                          style={{ borderColor: `${color.hex}60`, color: '#ffffff' }}
                        >
                          <span className={styles.avatarDot} style={{ background: color.hex, color: color.hex }} />
                          <span>{s.animalId} {s.colorId}</span>
                        </span>
                      </td>

                      <td>
                        <div>
                          <div className={styles.studentMetaName}>{s.fullName}</div>
                          <div className={styles.studentInitialsBadge}>Iniciales portón: {s.initials}</div>
                        </div>
                      </td>

                      <td style={{ fontWeight: 600 }}>{s.classroomName}</td>

                      <td>
                        <div>
                          <span style={{ fontWeight: 600, color: '#ffffff' }}>{s.guardianName}</span>
                          <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                            <a
                              href={`https://wa.me/${s.guardianPhone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'inherit', textDecoration: 'none' }}
                            >
                              {s.guardianPhone} ↗
                            </a>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ color: '#c7d2fe', fontSize: '0.825rem' }}>
                          {s.authorizedPickers}
                        </span>
                      </td>

                      {/* ── COLUMNA ASISTENCIA & CUSTODIA VIVA ── */}
                      <td>
                        {isDelivered ? (
                          <div className={`${styles.attendanceToggleBtn} ${styles.attendanceToggleDelivered}`}>
                            <span className={styles.toggleDot} />
                            <span className={styles.toggleLabel}>✓ Entregado a Apoderado</span>
                          </div>
                        ) : isInProcess ? (
                          <div className={`${styles.attendanceToggleBtn} ${styles.attendanceToggleInProcess}`}>
                            <span className={styles.toggleDot} />
                            <span className={styles.toggleLabel}>En Portón / Validando</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleToggleAttendance(s.id)}
                            className={`${styles.attendanceToggleBtn} ${
                              s.status === 'ACTIVE'
                                ? styles.attendanceToggleActive
                                : styles.attendanceToggleAbsent
                            }`}
                            title={
                              s.status === 'ACTIVE'
                                ? '🟢 Ingreso registrado (Presente en sala). Clic para marcar ausente.'
                                : '⚪ Sin ingreso hoy. Clic para registrar llegada a clases.'
                            }
                            aria-label={`Asistencia de ${s.fullName}: ${
                              s.status === 'ACTIVE' ? 'Presente en sala' : 'Sin ingreso'
                            }`}
                          >
                            <span className={styles.toggleDot} />
                            <span className={styles.toggleLabel}>
                              {s.status === 'ACTIVE' ? '✓ En Colegio (Presente)' : 'Sin ingreso (Ausente)'}
                            </span>
                          </button>
                        )}
                      </td>

                      {/* ── COLUMNA PASE RÁPIDO ── */}
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            style={{
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              background: 'rgba(56, 189, 248, 0.1)',
                              color: '#38bdf8',
                              fontSize: '0.725rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              const name = prompt(`Generar Pase de Emergencia para ${s.fullName}\n\nIngresa el nombre de quien retira hoy (ej: Carmen Silva):`);
                              if (!name?.trim()) return;
                              const rel = prompt(`Parentesco o relación de ${name} con el alumno (ej: Vecina, Tía):`) || 'Familiar / Autorizado';
                              
                              import('@/app/pase/actions').then(async (m) => {
                                const res = await m.createDailyPassAction(s.id, s.guardianPhone, name, rel);
                                if (res.success && res.passUrl) {
                                  const fullUrl = `${window.location.origin}${res.passUrl}`;
                                  navigator.clipboard.writeText(fullUrl);
                                  alert(`¡Pase Diario Creado!\n\nPIN para portón: ${res.pinCode}\nEnlace copiado al portapapeles:\n${fullUrl}\n\nCompártelo por WhatsApp al retirador temporal.`);
                                } else {
                                  alert(res.error || 'No se pudo crear el pase');
                                }
                              });
                            }}
                            title="Generar pase temporal de 1 día para un retirador de urgencia o tercero"
                          >
                            + Pase Emergencia
                          </button>

                          {liveSessionCode && !isDelivered && (
                            <button
                              type="button"
                              style={{
                                border: '1px solid rgba(74, 222, 128, 0.35)',
                                background: 'rgba(74, 222, 128, 0.1)',
                                color: '#4ade80',
                                fontSize: '0.725rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                              onClick={() => {
                                const confirmBypass = window.confirm(
                                  `⚠️ CONFIRMACIÓN DE CUSTODIA POR DIRECCIÓN:\n\n¿Confirmas que has entregado personalmente a ${s.fullName} y asumes la responsabilidad como Dirección sin pasar por portería?\n\nEl alumno quedará registrado como ENTREGADO y su animalito desaparecerá tras el cooldown en el monitor.`
                                );
                                if (!confirmBypass) return;
                                const reason = prompt('Motivo del retiro asistido por Dirección (opcional):') || 'Entrega directa en Dirección / Rezagado';

                                import('../cursos/actions').then(async (m) => {
                                  const res = await m.adminBypassDeliverStudentAction(s.id, reason);
                                  if (res.success) {
                                    alert(`Custodia cerrada: ${s.fullName} ha sido marcado como entregado.`);
                                    setStudents((prev) =>
                                      prev.map((item) =>
                                        item.id === s.id ? { ...item, custodyStatus: 'IN_TRANSIT' } : item
                                      )
                                    );
                                  } else {
                                    alert(res.error || 'No se pudo registrar la entrega.');
                                  }
                                });
                              }}
                              title="Bypass de Dirección: Marcar entregado directamente sin PIN de portón (Responsabilidad asumida por Admin)"
                            >
                              ✓ Entregar (Bypass)
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

