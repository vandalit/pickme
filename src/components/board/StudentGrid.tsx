import React from 'react';
import { StudentCard, PublicCustodyStatus } from './StudentCard';
import { AnimalId, ColorId } from '@/lib/avatars';
import styles from './StudentGrid.module.css';

export interface BoardStudent {
  id: string;
  animalId: AnimalId;
  colorId: ColorId;
  classroomName?: string;
  status: PublicCustodyStatus;
}

export interface StudentGridProps {
  students: BoardStudent[];
}

export function StudentGrid({ students }: StudentGridProps) {
  if (students.length === 0) {
    return (
      <div className={styles.emptyState} role="status">
        <span className={styles.emptyIcon} aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h1M14 10h1M9 14h1M14 14h1" />
          </svg>
        </span>
        <h2 className={styles.emptyTitle}>No hay alumnos en la sesión actual</h2>
        <p className={styles.emptySubtitle}>
          Los identificadores anónimos aparecerán aquí cuando la jornada de retiro esté activa.
        </p>
      </div>
    );
  }

  // Sort so IN_PROCESS is highlighted at the top, then WAITING, then ARRIVED/completed
  const statusPriority: Record<PublicCustodyStatus, number> = {
    IN_PROCESS: 1,
    ALERT: 2,
    WAITING: 3,
    HANDOVER: 4,
    IN_TRANSIT: 5,
    ARRIVED: 6,
  };

  const sorted = [...students].sort(
    (a, b) => statusPriority[a.status] - statusPriority[b.status]
  );

  return (
    <main
      className={styles.container}
      role="main"
      aria-label="Panel público de alumnos"
    >
      <div className={styles.grid}>
        {sorted.map((st, idx) => (
          <StudentCard
            key={st.id}
            id={st.id}
            animalId={st.animalId}
            colorId={st.colorId}
            classroomName={st.classroomName}
            status={st.status}
            index={idx}
          />
        ))}
      </div>
    </main>
  );
}

