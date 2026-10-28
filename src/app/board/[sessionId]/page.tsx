'use client';

import { useEffect, useMemo, useState } from 'react';
import { BoardHeader } from '@/components/board/BoardHeader';
import { StudentCard } from '@/components/board/StudentCard';
import { QRPanel } from '@/components/board/QRPanel';
import { MOCK_SESSION } from '@/lib/session';
import type { StudentStatus } from '@/lib/session';
import styles from './page.module.css';

interface BoardPageProps {
  params: Promise<{ sessionId: string }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  // Unwrap params (Next.js 15+ async params)
  const [sessionId, setSessionId] = useState<string>('');
  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  // --- Live clock ---
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

  // --- Session data (mock until Pusher + DB are wired) ---
  // TODO: replace with usePusher hook that receives real-time updates
  const session = { ...MOCK_SESSION, id: sessionId || MOCK_SESSION.id };

  // --- Group students by classroom ---
  const classrooms = useMemo(() => {
    const map = new Map<string, typeof session.students>();
    for (const student of session.students) {
      const group = map.get(student.grade) ?? [];
      group.push(student);
      map.set(student.grade, group);
    }
    return map;
  }, [session.students]);

  // --- Status counts for header pills ---
  const counts = useMemo((): Record<StudentStatus, number> => {
    const c = { waiting: 0, in_process: 0, picked_up: 0 };
    for (const s of session.students) c[s.status]++;
    return c;
  }, [session.students]);

  if (!session.isActive) {
    return (
      <div className={styles.page}>
        <div className={styles.ambient}>
          <div className={styles.ambientBlob} />
          <div className={styles.ambientBlob} />
          <div className={styles.ambientBlob} />
        </div>
        <div className={styles.standby}>
          <span className={styles.standbyIcon}>🎯</span>
          <h1 className={styles.standbyTitle}>PickMe</h1>
          <p className={styles.standbySubtitle}>
            No hay una sesión de retiro activa en este momento.
            El tablero se actualizará automáticamente cuando el staff abra una sesión.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Ambient background blobs */}
      <div className={styles.ambient} aria-hidden="true">
        <div className={styles.ambientBlob} />
        <div className={styles.ambientBlob} />
        <div className={styles.ambientBlob} />
      </div>

      {/* Header */}
      <BoardHeader session={session} counts={counts} />

      {/* Live clock overlay */}
      {time && (
        <div className={styles.clock} aria-hidden="true">
          {time}
        </div>
      )}

      {/* Body: grid + QR */}
      <div className={styles.body}>
        {/* Student grid grouped by classroom */}
        <main className={styles.gridArea} role="main" aria-label="Alumnos en sesión de retiro">
          {Array.from(classrooms.entries()).map(([grade, students]) => (
            <section key={grade} className={styles.classroomSection} aria-label={`Salón ${grade}`}>
              <h2 className={styles.classroomLabel}>{grade}</h2>
              <div className={styles.studentGrid}>
                {students.map((student, idx) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    index={idx}
                  />
                ))}
              </div>
            </section>
          ))}
        </main>

        {/* QR panel */}
        <QRPanel sessionId={session.id} sessionCode={session.sessionCode} />
      </div>
    </div>
  );
}

