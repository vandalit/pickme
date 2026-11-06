'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import { BoardHeader } from '@/components/board/BoardHeader';
import { StudentGrid, BoardStudent } from '@/components/board/StudentGrid';
import { QRPanel } from '@/components/board/QRPanel';
import styles from './page.module.css';

interface BoardPageProps {
  params: Promise<{ sessionId: string }>;
}

const DEMO_FALLBACK_STUDENTS: BoardStudent[] = [
  { id: 'st-1', animalId: 'zorro', colorId: 'naranja', classroomName: '1°A', status: 'IN_PROCESS' },
  { id: 'st-2', animalId: 'delfin', colorId: 'celeste', classroomName: '1°A', status: 'IN_PROCESS' },
  { id: 'st-3', animalId: 'leon', colorId: 'amarillo', classroomName: '2°B', status: 'IN_PROCESS' },
  { id: 'st-4', animalId: 'osito', colorId: 'cafe', classroomName: '1°A', status: 'WAITING' },
  { id: 'st-5', animalId: 'pinguino', colorId: 'azul', classroomName: '1°B', status: 'WAITING' },
  { id: 'st-6', animalId: 'panda', colorId: 'lima', classroomName: 'Kínder A', status: 'WAITING' },
  { id: 'st-7', animalId: 'elefante', colorId: 'morado', classroomName: '2°A', status: 'WAITING' },
  { id: 'st-8', animalId: 'loro', colorId: 'verde', classroomName: '2°A', status: 'WAITING' },
];

export default function BoardPage({ params }: BoardPageProps) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;

  const [students, setStudents] = useState<BoardStudent[]>(DEMO_FALLBACK_STUDENTS);
  const [schoolName, setSchoolName] = useState('Colegio San Martín');
  const [sessionCode, setSessionCode] = useState(sessionId.slice(0, 8).toUpperCase());
  const [counts, setCounts] = useState({
    waiting: 0,
    inProcess: 0,
    completed: 0,
    total: 0,
  });

  const fetchBoardData = useCallback(async () => {
    try {
      const res = await fetch(`/api/board/${sessionId}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.success && Array.isArray(data.students)) {
        setStudents(data.students);
        setSchoolName(data.schoolName || 'Colegio');
        setSessionCode(data.sessionCode || sessionId);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch {
      // Si falla o está offline, mantiene los datos existentes sin romper la pantalla
    }
  }, [sessionId]);

  useEffect(() => {
    fetchBoardData();
    // Polling reactivo cada 3.5 segundos para la Smart TV de patio
    const interval = setInterval(fetchBoardData, 3500);
    return () => clearInterval(interval);
  }, [fetchBoardData]);

  // Si no llegaron counts de la API, calcular localmente
  const effectiveCounts = counts.total > 0 ? counts : {
    waiting: students.filter((s) => s.status === 'WAITING').length,
    inProcess: students.filter((s) => s.status === 'IN_PROCESS').length,
    completed: students.filter(
      (s) => s.status === 'HANDOVER' || s.status === 'IN_TRANSIT' || s.status === 'ARRIVED'
    ).length,
    total: students.length,
  };

  return (
    <div className={styles.boardContainer}>
      <BoardHeader
        schoolName={schoolName}
        sessionTitle={`Jornada de Salida — Código: ${sessionCode}`}
        counts={effectiveCounts}
      />

      <div className={styles.bodySection}>
        <StudentGrid students={students} />
        <QRPanel
          sessionId={sessionId}
          sessionCode={sessionCode}
        />
      </div>
    </div>
  );
}
