'use client';

import { useEffect, useMemo, useState } from 'react';
import { BoardHeader } from '@/components/board/BoardHeader';
import { StudentCard } from '@/components/board/StudentCard';
import { StudentModal } from '@/components/board/StudentModal';
import { QRPanel } from '@/components/board/QRPanel';
import { MOCK_SESSION } from '@/lib/session';
import type { Student, StudentStatus } from '@/lib/session';
import { getAnimal, getColor } from '@/lib/avatars';
import styles from './page.module.css';

interface BoardPageProps {
  params: Promise<{ sessionId: string }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const [sessionId, setSessionId] = useState<string>('');
  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  // --- Clock ---
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // --- Interactive Students State (for live demo updates) ---
  const [students, setStudents] = useState<Student[]>(MOCK_SESSION.students);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // --- Filter states ---
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Handle student status change from modal or demo control
  const handleStatusChange = (studentId: string, newStatus: StudentStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    );
  };

  // Simulate a random status progression for testing
  const handleRandomSimulation = () => {
    const waitingOrProcessing = students.filter((s) => s.status !== 'picked_up');
    if (waitingOrProcessing.length === 0) return;
    const target = waitingOrProcessing[Math.floor(Math.random() * waitingOrProcessing.length)];
    const nextStatus: StudentStatus = target.status === 'waiting' ? 'in_process' : 'picked_up';
    handleStatusChange(target.id, nextStatus);
  };

  // Currently selected student object
  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  // Available unique grades
  const availableGrades = useMemo(() => {
    const set = new Set(students.map((s) => s.grade));
    return Array.from(set).sort();
  }, [students]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Grade filter
      if (gradeFilter !== 'ALL' && student.grade !== gradeFilter) return false;

      // Status filter
      if (statusFilter !== 'ALL' && student.status !== statusFilter) return false;

      // Search query (matches animal or color name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const animal = getAnimal(student.animalId);
        const color = getColor(student.colorId);
        const matchAnimal = animal.name.toLowerCase().includes(q);
        const matchColor = color.name.toLowerCase().includes(q);
        const matchGrade = student.grade.toLowerCase().includes(q);
        if (!matchAnimal && !matchColor && !matchGrade) return false;
      }

      return true;
    });
  }, [students, gradeFilter, statusFilter, searchQuery]);

  // Group filtered students by classroom
  const classrooms = useMemo(() => {
    const map = new Map<string, Student[]>();
    for (const student of filteredStudents) {
      const group = map.get(student.grade) ?? [];
      group.push(student);
      map.set(student.grade, group);
    }
    return map;
  }, [filteredStudents]);

  // Global status counts
  const globalCounts = useMemo((): Record<StudentStatus, number> => {
    const c = { waiting: 0, in_process: 0, picked_up: 0 };
    for (const s of students) c[s.status]++;
    return c;
  }, [students]);

  const session = useMemo(
    () => ({
      ...MOCK_SESSION,
      id: sessionId || MOCK_SESSION.id,
      students,
    }),
    [sessionId, students]
  );

  return (
    <div className={styles.page}>
      {/* Background ambient lighting */}
      <div className={styles.ambient} aria-hidden="true">
        <div className={styles.ambientBlob} />
        <div className={styles.ambientBlob} />
        <div className={styles.ambientBlob} />
      </div>

      {/* Board Header */}
      <BoardHeader session={session} counts={globalCounts} />

      {/* Body */}
      <div className={styles.body}>
        <main className={styles.mainContent} role="main">
          {/* Controls & Filter Bar */}
          <div className={styles.filterBar}>
            {/* Curso Filters */}
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Cursos:</span>
              <div className={styles.pillsList}>
                <button
                  className={`${styles.filterPill} ${gradeFilter === 'ALL' ? styles.filterPillActive : ''}`}
                  onClick={() => setGradeFilter('ALL')}
                >
                  Todos <span className={styles.pillBadge}>{students.length}</span>
                </button>
                {availableGrades.map((grade) => {
                  const count = students.filter((s) => s.grade === grade).length;
                  return (
                    <button
                      key={grade}
                      className={`${styles.filterPill} ${gradeFilter === grade ? styles.filterPillActive : ''}`}
                      onClick={() => setGradeFilter(grade)}
                    >
                      {grade} <span className={styles.pillBadge}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estado Filters */}
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Estado:</span>
              <div className={styles.pillsList}>
                <button
                  className={`${styles.filterPill} ${statusFilter === 'ALL' ? styles.filterPillActive : ''}`}
                  onClick={() => setStatusFilter('ALL')}
                >
                  Todos
                </button>
                <button
                  className={`${styles.filterPill} ${styles.pillWaiting} ${statusFilter === 'waiting' ? styles.filterPillActive : ''}`}
                  onClick={() => setStatusFilter('waiting')}
                >
                  ⏳ Esperando ({globalCounts.waiting})
                </button>
                <button
                  className={`${styles.filterPill} ${styles.pillProcess} ${statusFilter === 'in_process' ? styles.filterPillActive : ''}`}
                  onClick={() => setStatusFilter('in_process')}
                >
                  🔄 En proceso ({globalCounts.in_process})
                </button>
                <button
                  className={`${styles.filterPill} ${styles.pillDone} ${statusFilter === 'picked_up' ? styles.filterPillActive : ''}`}
                  onClick={() => setStatusFilter('picked_up')}
                >
                  ✓ Retirados ({globalCounts.picked_up})
                </button>
              </div>
            </div>

            {/* Search input & Random Simulation CTA */}
            <div className={styles.extraControls}>
              <div className={styles.searchWrapper}>
                <span className={styles.searchIcon} aria-hidden="true">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar animal, color..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  aria-label="Buscar alumnos"
                />
                {searchQuery && (
                  <button 
                    className={styles.clearSearch} 
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                className={styles.simBtn}
                onClick={handleRandomSimulation}
                title="Avanza de estado a un alumno al azar para probar animaciones"
              >
                ⚡ Simular cambio
              </button>
            </div>
          </div>

          {/* Grid Area */}
          <div className={styles.gridArea}>
            {filteredStudents.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🔍</span>
                <p className={styles.emptyTitle}>No se encontraron alumnos con los filtros seleccionados</p>
                <button
                  className={styles.resetFiltersBtn}
                  onClick={() => {
                    setGradeFilter('ALL');
                    setStatusFilter('ALL');
                    setSearchQuery('');
                  }}
                >
                  Restablecer filtros
                </button>
              </div>
            ) : gradeFilter !== 'ALL' ? (
              /* Single grade view: cards fill space seamlessly */
              <div className={styles.singleGradeGrid}>
                {filteredStudents.map((student, idx) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    index={idx}
                    onClick={() => setSelectedStudentId(student.id)}
                  />
                ))}
              </div>
            ) : (
              /* All grades grouped with distinct course banners */
              Array.from(classrooms.entries()).map(([grade, gradeStudents]) => (
                <section key={grade} className={styles.classroomSection} aria-label={`Salón ${grade}`}>
                  <div className={styles.classroomHeader}>
                    <div className={styles.classroomTitle}>
                      <span className={styles.gradeTag}>{grade}</span>
                      <span className={styles.studentCount}>
                        {gradeStudents.length} {gradeStudents.length === 1 ? 'alumno' : 'alumnos'}
                      </span>
                    </div>
                    <div className={styles.classroomDivider} />
                  </div>

                  <div className={styles.studentGrid}>
                    {gradeStudents.map((student, idx) => (
                      <StudentCard
                        key={student.id}
                        student={student}
                        index={idx}
                        onClick={() => setSelectedStudentId(student.id)}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </main>

        {/* QR panel */}
        <QRPanel sessionId={session.id} sessionCode={session.sessionCode} />
      </div>

      {/* Clock floating bottom/top */}
      {time && (
        <div className={styles.clockOverlay} aria-hidden="true">
          {time}
        </div>
      )}

      {/* Detail / Demo Modal on Card Click */}
      <StudentModal
        student={selectedStudent}
        onClose={() => setSelectedStudentId(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
