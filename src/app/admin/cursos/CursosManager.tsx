'use client';

import React, { useState, useTransition } from 'react';
import {
  createClassroomAction,
  createStudentAction,
  updateStudentStatusAction,
  importStudentsCsvAction,
} from './actions';
import { CSV_TEMPLATE_EXAMPLE } from '@/lib/csvImporter';
import { getAnimal, getColor } from '@/lib/avatars';
import styles from './CursosManager.module.css';

export interface ClassroomItem {
  id: string;
  grade: string;
  section: string;
  studentCount: number;
}

export interface StudentItem {
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
}

interface CursosManagerProps {
  initialClassrooms: ClassroomItem[];
  initialStudents: StudentItem[];
  schoolName: string;
}

export function CursosManager({
  initialClassrooms,
  initialStudents,
  schoolName,
}: CursosManagerProps) {
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>(initialClassrooms);
  const [students, setStudents] = useState<StudentItem[]>(initialStudents);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modales
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Estados de modales
  const [modalError, setModalError] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Filtrado de alumnos
  const filteredStudents = students.filter((s) => {
    if (selectedClassroomId !== 'ALL' && s.classroomId !== selectedClassroomId) {
      return false;
    }
    if (selectedStatus !== 'ALL' && s.status !== selectedStatus) {
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

  // Descargar plantilla CSV
  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE_EXAMPLE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_alumnos_pickme.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Crear Curso
  const handleCreateCourse = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalError(null);
    const formData = new FormData(e.currentTarget);
    const grade = formData.get('grade') as string;
    const section = formData.get('section') as string;

    startTransition(async () => {
      const res = await createClassroomAction(grade, section);
      if (res.success && res.classroom) {
        setClassrooms((prev) => [
          ...prev,
          {
            id: res.classroom.id,
            grade: res.classroom.grade,
            section: res.classroom.section,
            studentCount: 0,
          },
        ]);
        setIsCourseModalOpen(false);
      } else {
        setModalError(res.error || 'Error al crear curso');
      }
    });
  };

  // Crear Alumno
  const handleCreateStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalError(null);
    const formData = new FormData(e.currentTarget);

    const payload = {
      fullName: formData.get('fullName') as string,
      classroomId: formData.get('classroomId') as string,
      guardianName: formData.get('guardianName') as string,
      guardianPhone: formData.get('guardianPhone') as string,
      pickerName: (formData.get('pickerName') as string) || undefined,
      pickerRelationship: (formData.get('pickerRelationship') as string) || undefined,
      pickerPhone: (formData.get('pickerPhone') as string) || undefined,
      status: (formData.get('status') as any) || 'ACTIVE',
    };

    startTransition(async () => {
      const res = await createStudentAction(payload);
      if (res.success && res.student) {
        const cls = classrooms.find((c) => c.id === payload.classroomId);
        const classroomName = cls ? `${cls.grade} ${cls.section}` : 'General';

        const newStudent: StudentItem = {
          id: res.student.id,
          fullName: res.student.fullName,
          initials: res.student.initials,
          classroomId: res.student.classroomId,
          classroomName,
          animalId: res.student.animalId,
          colorId: res.student.colorId,
          guardianName: payload.guardianName,
          guardianPhone: payload.guardianPhone,
          authorizedPickers: payload.pickerName
            ? `${payload.pickerName} (${payload.pickerRelationship || 'Autorizado'})`
            : 'Solo apoderado titular',
          status: payload.status,
        };

        setStudents((prev) => [newStudent, ...prev]);
        setClassrooms((prev) =>
          prev.map((c) =>
            c.id === payload.classroomId ? { ...c, studentCount: c.studentCount + 1 } : c
          )
        );
        setIsStudentModalOpen(false);
      } else {
        setModalError(res.error || 'Error al registrar alumno');
      }
    });
  };

  // Cambio de estado rápido en la fila
  const handleStatusChange = (studentId: string, newStatus: 'ACTIVE' | 'ABSENT' | 'WITHDRAWN') => {
    // Actualización optimista
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    );

    startTransition(async () => {
      const res = await updateStudentStatusAction(studentId, newStatus);
      if (!res.success) {
        alert(res.error || 'Error al actualizar estado');
      }
    });
  };

  // Importar CSV
  const handleImportCsv = () => {
    if (!csvText.trim()) {
      setModalError('Por favor pega o carga el contenido del archivo CSV.');
      return;
    }
    setModalError(null);
    setCsvFeedback(null);

    startTransition(async () => {
      const res = await importStudentsCsvAction(csvText);
      if (res.success) {
        setCsvFeedback(`✓ Se importaron exitosamente ${res.importedCount} alumnos.`);
        setTimeout(() => {
          setIsCsvModalOpen(false);
          setCsvText('');
          setCsvFeedback(null);
          // Recargar página para refrescar nómina completa desde BD
          window.location.reload();
        }, 1200);
      } else {
        setModalError(
          res.errors.length > 0
            ? res.errors.slice(0, 4).join('\n')
            : 'Error al procesar el archivo CSV.'
        );
      }
    });
  };

  return (
    <div className={styles.managerWrapper}>
      {/* ── BARRA DE HERRAMIENTAS ── */}
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

        <div className={styles.actionButtons}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => {
              setModalError(null);
              setIsCourseModalOpen(true);
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Curso
          </button>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => {
              setModalError(null);
              setIsStudentModalOpen(true);
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            Añadir Alumno
          </button>

          <button
            type="button"
            className={styles.btnCsv}
            onClick={() => {
              setModalError(null);
              setCsvFeedback(null);
              setIsCsvModalOpen(true);
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Importar Excel / CSV
          </button>
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
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedClassroomId('ALL');
            }
          }}
        >
          <span className={styles.classCardTitle}>Todos los Cursos</span>
          <span className={styles.classCardCount}>{students.length} alumnos totales</span>
        </div>

        {classrooms.map((c) => (
          <div
            key={c.id}
            role="tab"
            aria-selected={selectedClassroomId === c.id}
            tabIndex={0}
            className={`${styles.classCard} ${selectedClassroomId === c.id ? styles.classCardActive : ''}`}
            onClick={() => setSelectedClassroomId(c.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedClassroomId(c.id);
              }
            }}
          >
            <span className={styles.classCardTitle}>{c.grade} {c.section}</span>
            <span className={styles.classCardCount}>
              {students.filter((s) => s.classroomId === c.id).length} alumnos
            </span>
          </div>
        ))}
      </div>

      {/* ── TABLA DE NÓMINA ── */}
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
            <h3 style={{ margin: 0, color: '#ffffff' }}>No se encontraron alumnos</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
              Añade un alumno manualmente o utiliza el importador de planillas Excel/CSV.
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
                  <th>Retiradores Autorizados</th>
                  <th>Estado Jornada</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => {
                  const color = getColor(s.colorId as any);
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

                      <td>
                        <select
                          value={s.status}
                          disabled={isPending}
                          onChange={(e) =>
                            handleStatusChange(s.id, e.target.value as 'ACTIVE' | 'ABSENT' | 'WITHDRAWN')
                          }
                          className={`${styles.statusSelect} ${
                            s.status === 'ACTIVE'
                              ? styles.statusActive
                              : s.status === 'ABSENT'
                              ? styles.statusAbsent
                              : styles.statusWithdrawn
                          }`}
                        >
                          <option value="ACTIVE">Activo</option>
                          <option value="ABSENT">Ausente hoy</option>
                          <option value="WITHDRAWN">Retirado</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: CREAR CURSO ── */}
      {isCourseModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modalCourseTitle">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 id="modalCourseTitle" className={styles.modalTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                Nuevo Curso o Sala
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsCourseModalOpen(false)}
                aria-label="Cerrar modal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {modalError && <div className={styles.errorBox}>{modalError}</div>}

            <form onSubmit={handleCreateCourse} className={styles.modalForm}>
              <div className={styles.field}>
                <label className={styles.label}>Nivel o Grado</label>
                <input
                  name="grade"
                  type="text"
                  required
                  placeholder="ej: 1° Básico, Kinder, Sala Cuna"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Sección o Letra</label>
                <input
                  name="section"
                  type="text"
                  required
                  maxLength={4}
                  placeholder="ej: A, B, Mañana"
                  className={styles.input}
                />
              </div>

              <div className={styles.noticeBox}>
                Cada curso cuenta con un espacio independiente de hasta <strong>200 combinaciones únicas</strong> de avatares anónimos sin colisiones.
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsCourseModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Crear Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: AÑADIR ALUMNO ── */}
      {isStudentModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modalStudentTitle">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 id="modalStudentTitle" className={styles.modalTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                </svg>
                Registrar Alumno y Apoderado
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsStudentModalOpen(false)}
                aria-label="Cerrar modal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {modalError && <div className={styles.errorBox}>{modalError}</div>}

            <form onSubmit={handleCreateStudent} className={styles.modalForm}>
              <div className={styles.field}>
                <label className={styles.label}>Nombre Completo del Alumno</label>
                <input
                  name="fullName"
                  type="text"
                  required
                  placeholder="ej: Tomás Ignacio Muñoz Gómez"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Curso Asignado</label>
                <select name="classroomId" required className={styles.select}>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.grade} {c.section}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Nombre Apoderado Titular</label>
                <input
                  name="guardianName"
                  type="text"
                  required
                  placeholder="ej: Pamela Soto Herrera"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>WhatsApp Apoderado Titular</label>
                <input
                  name="guardianPhone"
                  type="tel"
                  required
                  placeholder="ej: +56912345678"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Retirador Autorizado Adicional (Opcional)</label>
                <input
                  name="pickerName"
                  type="text"
                  placeholder="ej: Mario Soto (Tío) o Transporte Don Pedro"
                  className={styles.input}
                />
              </div>

              <div className={styles.noticeBox}>
                El sistema asignará automáticamente el siguiente <strong>avatar anónimo libre</strong> para este curso, garantizando que no se repita con ningún compañero.
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsStudentModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isPending}>
                  {isPending ? 'Asignando Avatar...' : 'Guardar Alumno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: IMPORTAR EXCEL / CSV ── */}
      {isCsvModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modalCsvTitle">
          <div className={styles.modalCard} style={{ maxWidth: 640 }}>
            <div className={styles.modalHeader}>
              <h3 id="modalCsvTitle" className={styles.modalTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Importación Masiva de Planillas
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsCsvModalOpen(false)}
                aria-label="Cerrar modal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {modalError && <div className={styles.errorBox} style={{ whiteSpace: 'pre-line' }}>{modalError}</div>}
            {csvFeedback && <div className={styles.noticeBox} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' }}>{csvFeedback}</div>}

            <div className={styles.modalForm}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={styles.label}>Pega el contenido CSV o carga tu archivo:</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className={styles.btnSecondary}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Descargar Plantilla Oficial (.csv)
                </button>
              </div>

              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`nombre_completo,curso,apoderado_nombre,apoderado_whatsapp,retirador_nombre,retirador_parentesco,estado\nVicente Toro Morales,1° Básico A,Carolina Herrera,+56991112233,Ignacio Herrera,Tío,ACTIVO\n...`}
                className={styles.textarea}
                rows={8}
              />

              <div className={styles.noticeBox}>
                Soporta listas de hasta <strong>60 alumnos por curso</strong>. Los cursos nuevos serán creados automáticamente si no existen, asignando a cada alumno su avatar anónimo único.
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsCsvModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleImportCsv}
                  disabled={isPending || !csvText.trim()}
                >
                  {isPending ? 'Procesando Planilla...' : 'Procesar e Importar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

