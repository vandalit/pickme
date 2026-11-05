'use client';

import React, { use, useState, useEffect } from 'react';
import { BoardHeader } from '@/components/board/BoardHeader';
import { StudentGrid, BoardStudent } from '@/components/board/StudentGrid';
import { QRPanel } from '@/components/board/QRPanel';
import styles from './page.module.css';

interface BoardPageProps {
  params: Promise<{ sessionId: string }>;
}

// Initial demonstration list (Animal + Color only, Layer 0 Anonymous)
const DEMO_STUDENTS: BoardStudent[] = [
  { id: 'st-1', animalId: 'zorro', colorId: 'naranja', classroomName: '1°A', status: 'IN_PROCESS' },
  { id: 'st-2', animalId: 'delfin', colorId: 'celeste', classroomName: '1°A', status: 'IN_PROCESS' },
  { id: 'st-3', animalId: 'leon', colorId: 'amarillo', classroomName: '2°B', status: 'IN_PROCESS' },
  { id: 'st-4', animalId: 'osito', colorId: 'cafe', classroomName: '1°A', status: 'WAITING' },
  { id: 'st-5', animalId: 'pinguino', colorId: 'azul', classroomName: '1°B', status: 'WAITING' },
  { id: 'st-6', animalId: 'panda', colorId: 'lima', classroomName: 'Kínder A', status: 'WAITING' },
  { id: 'st-7', animalId: 'elefante', colorId: 'morado', classroomName: '2°A', status: 'WAITING' },
  { id: 'st-8', animalId: 'loro', colorId: 'verde', classroomName: '2°A', status: 'WAITING' },
  { id: 'st-9', animalId: 'buho', colorId: 'cafe', classroomName: 'Kínder B', status: 'WAITING' },
  { id: 'st-10', animalId: 'tigre', colorId: 'naranja', classroomName: '1°B', status: 'WAITING' },
  { id: 'st-11', animalId: 'jirafa', colorId: 'amarillo', classroomName: '2°B', status: 'WAITING' },
  { id: 'st-12', animalId: 'koala', colorId: 'celeste', classroomName: '1°A', status: 'WAITING' },
  { id: 'st-13', animalId: 'pulpo', colorId: 'morado', classroomName: '2°B', status: 'WAITING' },
  { id: 'st-14', animalId: 'cocodrilo', colorId: 'verde', classroomName: 'Kínder A', status: 'HANDOVER' },
  { id: 'st-15', animalId: 'mariposa', colorId: 'rosado', classroomName: '1°B', status: 'ARRIVED' },
  { id: 'st-16', animalId: 'erizo', colorId: 'azul', classroomName: '2°A', status: 'ARRIVED' },
];

export default function BoardPage({ params }: BoardPageProps) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;

  const [students] = useState<BoardStudent[]>(DEMO_STUDENTS);

  // Compute stats
  const waiting = students.filter((s) => s.status === 'WAITING').length;
  const inProcess = students.filter((s) => s.status === 'IN_PROCESS').length;
  const completed = students.filter(
    (s) => s.status === 'HANDOVER' || s.status === 'IN_TRANSIT' || s.status === 'ARRIVED'
  ).length;
  const total = students.length;

  return (
    <div className={styles.boardContainer}>
      <BoardHeader
        schoolName="Colegio San Martín"
        sessionTitle="Jornada Tarde — Salida Regular"
        counts={{ waiting, inProcess, completed, total }}
      />

      <div className={styles.bodySection}>
        <StudentGrid students={students} />
        <QRPanel
          sessionId={sessionId}
          sessionCode={sessionId.slice(0, 8).toUpperCase()}
        />
      </div>
    </div>
  );
}
