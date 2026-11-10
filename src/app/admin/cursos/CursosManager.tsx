'use client';

import React, { useState, useTransition } from 'react';
import {
  createClassroomAction,
  createStudentAction,
  updateStudentAction,
  deleteStudentAction,
  updateStudentStatusAction,
  batchUpdateAttendanceAction,
  importStudentsCsvAction,
} from './actions';
import { addLateArrivalToSessionAction, openDailySessionAction, closeDailySessionAction } from '@/app/admin/sessionActions';
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
  pickerName?: string;
  pickerRelationship?: string;
  pickerPhone?: string;
  status: 'ACTIVE' | 'ABSENT' | 'WITHDRAWN';
}

interface CreateStudentPayload {
  fullName: string;
  classroomId: string;
  guardianName: string;
  guardianPhone: string;
  pickerName?: string;
  pickerRelationship?: string;
  pickerPhone?: string;
  status: 'ABSENT';
}

interface UpdateStudentPayload {
  studentId: string;
  fullName: string;
  classroomId: string;
  guardianName: string;
  guardianPhone: string;
  pickerName?: string;
  pickerRelationship?: string;
  pickerPhone?: string;
}

interface CursosManagerProps {
  initialClassrooms: ClassroomItem[];
  initialStudents: StudentItem[];
  schoolName: string;
  activeSessionCode?: string | null;
}

export function CursosManager({
  initialClassrooms,
  initialStudents,
  schoolName,
  activeSessionCode = null,
}: CursosManagerProps) {
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>(initialClassrooms);
  const [students, setStudents] = useState<StudentItem[]>(initialStudents);
  const [liveSessionCode, setLiveSessionCode] = useState<string | null>(activeSessionCode);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('ALL');
  const [selectedEnrollment, setSelectedEnrollment] = useState<'ALL' | 'ENROLLED' | 'WITHDRAWN'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modales
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [guardianConflict, setGuardianConflict] = useState<
    | { operation: 'create'; payload: CreateStudentPayload; existingName: string }
    | { operation: 'update'; payload: UpdateStudentPayload; existingName: string }
    | null
  >(null);

  // Estados de modales
  const [modalError, setModalError] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Filtrado de alumnos en nómina
  const filteredStudents = students.filter((s) => {
    if (selectedClassroomId !== 'ALL' && s.classroomId !== selectedClassroomId) {
      return false;
    }
    if (selectedEnrollment === 'ENROLLED' && s.status === 'WITHDRAWN') {
      return false;
    }
    if (selectedEnrollment === 'WITHDRAWN' && s.status !== 'WITHDRAWN') {
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

  const saveNewStudent = (payload: CreateStudentPayload, reuseExistingGuardian = false) => {
    startTransition(async () => {
      const res = await createStudentAction({ ...payload, reuseExistingGuardian });
      if (res.guardianConflict) {
        setGuardianConflict({ operation: 'create', payload, existingName: res.guardianConflict.existingName });
        return;
      }
      if (res.success && res.student) {
        const cls = classrooms.find((c) => c.id === payload.classroomId);
        const classroomName = cls ? `${cls.grade} ${cls.section}` : 'General';
        const guardianName = res.guardianName ?? payload.guardianName;

        const newStudent: StudentItem = {
          id: res.student.id,
          fullName: res.student.fullName,
          initials: res.student.initials,
          classroomId: res.student.classroomId,
          classroomName,
          animalId: res.student.animalId,
          colorId: res.student.colorId,
          guardianName,
          guardianPhone: payload.guardianPhone,
          pickerName: payload.pickerName || '',
          pickerRelationship: payload.pickerRelationship || '',
          pickerPhone: payload.pickerPhone || '',
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
        setGuardianConflict(null);
        setIsStudentModalOpen(false);
      } else {
        setModalError(res.error || 'Error al registrar alumno');
      }
    });
  };

  // Crear Alumno
  const handleCreateStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalError(null);
    const formData = new FormData(e.currentTarget);

    const payload: CreateStudentPayload = {
      fullName: formData.get('fullName') as string,
      classroomId: formData.get('classroomId') as string,
      guardianName: formData.get('guardianName') as string,
      guardianPhone: formData.get('guardianPhone') as string,
      pickerName: (formData.get('pickerName') as string) || undefined,
      pickerRelationship: (formData.get('pickerRelationship') as string) || undefined,
      pickerPhone: (formData.get('pickerPhone') as string) || undefined,
      status: 'ABSENT' as const, // Nace matriculado pero SIN ingreso hoy (custodia estricta)
    };

    saveNewStudent(payload);
  };

  // ── ACCIONES CRUD: EDICIÓN Y ELIMINACIÓN DE ALUMNO ──
  const handleOpenEditStudent = (student: StudentItem) => {
    setModalError(null);
    setEditingStudent(student);
    setIsEditStudentModalOpen(true);
  };

  const saveStudentChanges = (payload: UpdateStudentPayload, reuseExistingGuardian = false) => {
    startTransition(async () => {
      const res = await updateStudentAction({ ...payload, reuseExistingGuardian });
      if (res.guardianConflict) {
        setGuardianConflict({ operation: 'update', payload, existingName: res.guardianConflict.existingName });
        return;
      }
      if (res.success) {
        const studentBeingEdited = students.find((student) => student.id === payload.studentId);
        if (!studentBeingEdited) {
          setModalError('No se pudo actualizar la vista. Recarga la nómina e inténtalo nuevamente.');
          return;
        }
        const targetClass = classrooms.find((c) => c.id === payload.classroomId);
        const classroomName = targetClass ? `${targetClass.grade} ${targetClass.section}` : studentBeingEdited.classroomName;
        const wasClassChange = studentBeingEdited.classroomId !== payload.classroomId;

        setStudents((prev) =>
          prev.map((s) => {
            if (s.id !== studentBeingEdited.id) return s;
            const updatedInitials = payload.fullName
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() + '.')
              .join('') || s.initials;

            return {
              ...s,
              fullName: payload.fullName,
              initials: updatedInitials,
              classroomId: payload.classroomId,
              classroomName,
              guardianName: res.guardianName ?? payload.guardianName,
              guardianPhone: payload.guardianPhone,
              pickerName: payload.pickerName || '',
              pickerRelationship: payload.pickerRelationship || '',
              pickerPhone: payload.pickerPhone || '',
              authorizedPickers: payload.pickerName
                ? `${payload.pickerName} (${payload.pickerRelationship || 'Familiar Autorizado'})`
                : 'Solo apoderado titular',
            };
          })
        );

        if (wasClassChange) {
          setClassrooms((prev) =>
            prev.map((c) => {
              if (c.id === studentBeingEdited.classroomId) return { ...c, studentCount: Math.max(0, c.studentCount - 1) };
              if (c.id === payload.classroomId) return { ...c, studentCount: c.studentCount + 1 };
              return c;
            })
          );
        }

        setGuardianConflict(null);
        setIsEditStudentModalOpen(false);
        setEditingStudent(null);
      } else {
        setModalError(res.error || 'Error al actualizar el alumno.');
      }
    });
  };

  const handleUpdateStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingStudent) return;
    setModalError(null);
    const formData = new FormData(e.currentTarget);
    const payload: UpdateStudentPayload = {
      studentId: editingStudent.id,
      fullName: (formData.get('fullName') as string).trim(),
      classroomId: formData.get('classroomId') as string,
      guardianName: (formData.get('guardianName') as string).trim(),
      guardianPhone: (formData.get('guardianPhone') as string).trim(),
      pickerName: (formData.get('pickerName') as string)?.trim() || undefined,
      pickerRelationship: (formData.get('pickerRelationship') as string)?.trim() || undefined,
      pickerPhone: (formData.get('pickerPhone') as string)?.trim() || undefined,
    };
    saveStudentChanges(payload);
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${studentName} de la nómina?`);
    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteStudentAction(studentId);
      if (res.success) {
        const targetStudent = students.find((s) => s.id === studentId);
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
        if (targetStudent) {
          setClassrooms((prev) =>
            prev.map((c) =>
              c.id === targetStudent.classroomId ? { ...c, studentCount: Math.max(0, c.studentCount - 1) } : c
            )
          );
        }
      } else if (res.hasHistory) {
        const withdrawConfirm = window.confirm(
          `${res.error}\n\n¿Deseas marcar a ${studentName} como 'Retirado (Baja)' en lugar de eliminarlo?`
        );
        if (withdrawConfirm) {
          handleStatusChange(studentId, 'WITHDRAWN');
        }
      } else {
        alert(res.error || 'No se pudo eliminar el alumno.');
      }
    });
  };

  // Cambio de estado rápido en la fila (Lista viva y custodia)
  const handleStatusChange = (studentId: string, newStatus: 'ACTIVE' | 'ABSENT' | 'WITHDRAWN') => {
    const student = students.find((s) => s.id === studentId);
    const wasAbsent = student?.status === 'ABSENT';

    // Actualización optimista
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    );

    startTransition(async () => {
      const res = await updateStudentStatusAction(studentId, newStatus);
      if (!res.success) {
        alert(res.error || 'Error al actualizar estado');
        return;
      }

      // Si hay una jornada de salida abierta y el alumno se marca ACTIVE (Llegada tardía),
      // se incorpora automáticamente a la lista viva de portón
      if (liveSessionCode && wasAbsent && newStatus === 'ACTIVE') {
        await addLateArrivalToSessionAction(studentId);
      }
    });
  };

  const enrolledStudentsCount = students.filter((s) => s.status !== 'WITHDRAWN').length;
  const withdrawnStudentsCount = students.filter((s) => s.status === 'WITHDRAWN').length;

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
        setCsvFeedback(`Se importaron exitosamente ${res.importedCount} alumnos.`);
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

      {/* ── RESUMEN ADMINISTRATIVO DE NÓMINA ESCOLAR ── */}
      <div className={styles.attendanceBar} role="region" aria-label="Resumen de nómina escolar">
        <div className={styles.attendanceStats}>
          <span className={styles.statBadge}>
            <strong>{enrolledStudentsCount}</strong> Alumnos Matriculados
          </span>
          {withdrawnStudentsCount > 0 && (
            <span className={styles.statBadge}>
              <strong style={{ color: '#f87171' }}>{withdrawnStudentsCount}</strong> Bajas
            </span>
          )}
        </div>

        <div className={styles.attendanceActions}>
          <div className={styles.filterAttendanceGroup}>
            <button
              type="button"
              className={`${styles.filterAttendanceBtn} ${selectedEnrollment === 'ALL' ? styles.filterAttendanceBtnActive : ''}`}
              onClick={() => setSelectedEnrollment('ALL')}
            >
              Todos ({students.length})
            </button>
            <button
              type="button"
              className={`${styles.filterAttendanceBtn} ${selectedEnrollment === 'ENROLLED' ? styles.filterAttendanceBtnActive : ''}`}
              onClick={() => setSelectedEnrollment('ENROLLED')}
            >
              Matriculados ({enrolledStudentsCount})
            </button>
            {withdrawnStudentsCount > 0 && (
              <button
                type="button"
                className={`${styles.filterAttendanceBtn} ${selectedEnrollment === 'WITHDRAWN' ? styles.filterAttendanceBtnActive : ''}`}
                onClick={() => setSelectedEnrollment('WITHDRAWN')}
              >
                Bajas ({withdrawnStudentsCount})
              </button>
            )}
          </div>
        </div>
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
                  <th>Retiradores / Furgón</th>
                  <th>Matrícula (Estatuto)</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
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

                      {/* ── COLUMNA MATRÍCULA (SUTIL Y FRENTE A ACCIONES) ── */}
                      <td>
                        <select
                          value={s.status === 'WITHDRAWN' ? 'WITHDRAWN' : 'ENROLLED'}
                          disabled={isPending}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'WITHDRAWN') {
                              if (window.confirm(`¿Dar de baja a ${s.fullName} de la nómina del establecimiento?`)) {
                                handleStatusChange(s.id, 'WITHDRAWN');
                              }
                            } else {
                              handleStatusChange(s.id, 'ACTIVE');
                            }
                          }}
                          className={`${styles.statusSelect} ${
                            s.status === 'WITHDRAWN'
                              ? styles.statusWithdrawn
                              : styles.statusEnrolled
                          }`}
                          title="Estatuto del alumno en la institución (Matriculado regular o Dado de baja)"
                        >
                          <option value="ENROLLED">✓ Matriculado</option>
                          <option value="WITHDRAWN">✕ Retirado (Baja)</option>
                        </select>
                      </td>

                      {/* ── COLUMNA ACCIONES: EDITAR Y ELIMINAR (CRUD) ── */}
                      <td>
                        <div className={styles.rowActionsGroup}>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleOpenEditStudent(s)}
                            className={styles.editRowBtn}
                            title={`Editar datos de ${s.fullName}`}
                            aria-label={`Editar datos de ${s.fullName}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDeleteStudent(s.id, s.fullName)}
                            className={styles.deleteRowBtn}
                            title={`Eliminar a ${s.fullName} de la nómina`}
                            aria-label={`Eliminar a ${s.fullName} de la nómina`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
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

      {/* ── MODAL: EDITAR ALUMNO (CRUD EDICIÓN) ── */}
      {isEditStudentModalOpen && editingStudent && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modalEditStudentTitle">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 id="modalEditStudentTitle" className={styles.modalTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Editar Datos de Alumno
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => {
                  setIsEditStudentModalOpen(false);
                  setEditingStudent(null);
                }}
                aria-label="Cerrar modal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {modalError && <div className={styles.errorBox}>{modalError}</div>}

            <form onSubmit={handleUpdateStudent} className={styles.modalForm}>
              <div className={styles.field}>
                <label className={styles.label}>Nombre Completo del Alumno *</label>
                <input
                  name="fullName"
                  type="text"
                  required
                  defaultValue={editingStudent.fullName}
                  placeholder="ej: Tomás Ignacio Muñoz Gómez"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Curso Asignado *</label>
                <select name="classroomId" required defaultValue={editingStudent.classroomId} className={styles.select}>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.grade} {c.section}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Nombre Apoderado Titular *</label>
                <input
                  name="guardianName"
                  type="text"
                  required
                  defaultValue={editingStudent.guardianName}
                  placeholder="ej: Pamela Soto Herrera"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>WhatsApp Apoderado Titular *</label>
                <input
                  name="guardianPhone"
                  type="tel"
                  required
                  defaultValue={editingStudent.guardianPhone}
                  placeholder="+56912345678"
                  className={styles.input}
                />
              </div>

              <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                  Retirador Autorizado Recurrente (Opcional):
                </span>

                <div className={styles.field}>
                  <label className={styles.label}>Nombre Retirador Adicional</label>
                  <input
                    name="pickerName"
                    type="text"
                    defaultValue={editingStudent.pickerName || ''}
                    placeholder="ej: Roberto Muñoz (Tío)"
                    className={styles.input}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className={styles.field}>
                    <label className={styles.label}>Parentesco</label>
                    <input
                      name="pickerRelationship"
                      type="text"
                      defaultValue={editingStudent.pickerRelationship || ''}
                      placeholder="ej: Tío / Vecino / Chofer"
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>WhatsApp Retirador</label>
                    <input
                      name="pickerPhone"
                      type="tel"
                      defaultValue={editingStudent.pickerPhone || ''}
                      placeholder="+56987654321"
                      className={styles.input}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => {
                    setIsEditStudentModalOpen(false);
                    setEditingStudent(null);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {guardianConflict && (
        <div className={styles.modalOverlay} role="alertdialog" aria-modal="true" aria-labelledby="guardianConflictTitle">
          <div className={styles.modalCard} style={{ maxWidth: 480 }}>
            <div className={styles.modalHeader}>
              <h3 id="guardianConflictTitle" className={styles.modalTitle}>
                Número ya asociado a un apoderado
              </h3>
            </div>
            <p className={styles.modalDescription}>
              Este número ya está asociado en este colegio a <strong>{guardianConflict.existingName}</strong>.
              {guardianConflict.operation === 'create'
                ? ' Si continúas, el alumno se vinculará a ese mismo registro y se conservará ese nombre.'
                : ' Si continúas, se vinculará este alumno a ese registro y se conservarán sus datos actuales.'}
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setGuardianConflict(null)}
                disabled={isPending}
              >
                Volver y revisar
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={isPending}
                onClick={() => {
                  if (guardianConflict.operation === 'create') {
                    saveNewStudent(guardianConflict.payload, true);
                  } else {
                    saveStudentChanges(guardianConflict.payload, true);
                  }
                }}
              >
                {isPending ? 'Guardando...' : 'Vincular al apoderado existente'}
              </button>
            </div>
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
