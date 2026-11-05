'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getAnimal, getColor, getPublicLabel, AnimalId, ColorId } from '@/lib/avatars';
import styles from './StepStudentSelect.module.css';

export interface AuthorizedStudent {
  id: string;
  fullName: string;
  initials: string;
  animalId: string;
  colorId: string;
  classroomName: string;
  status: any;
  eventId?: string | null;
  handoverCode?: string | null;
  handoverExpiry?: string | null;
}

export interface StepStudentSelectProps {
  pickerName: string;
  schoolName: string;
  students: AuthorizedStudent[];
  onSelectAndAnnounce: (student: AuthorizedStudent) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
}

export function StepStudentSelect({
  pickerName,
  schoolName,
  students,
  onSelectAndAnnounce,
  onBack,
  isLoading = false,
}: StepStudentSelectProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleAnnounce = () => {
    if (!selectedStudent) return;
    onSelectAndAnnounce(selectedStudent);
  };

  return (
    <div
      className={styles.card}
      role="region"
      aria-label="Selección de alumno a retirar"
    >
      <div className={styles.header}>
        <span className={styles.greeting}>Persona autorizada:</span>
        <h2 className={styles.pickerName}>{pickerName}</h2>
        <span className={styles.schoolBadge}>🏫 {schoolName}</span>
      </div>

      <div className={styles.list}>
        {students.map((st) => {
          const animal = getAnimal(st.animalId as AnimalId);
          const color = getColor(st.colorId as ColorId);
          const publicLabel = getPublicLabel(
            st.animalId as AnimalId,
            st.colorId as ColorId
          );
          const isSelected = st.id === selectedStudentId;

          const avatarStyle = {
            '--card-color': color.hex,
            '--card-color-dim': `${color.hex}25`,
          } as React.CSSProperties;

          return (
            <div
              key={st.id}
              className={`${styles.studentCard} ${isSelected ? styles.selected : ''}`}
              style={avatarStyle}
              onClick={() => setSelectedStudentId(st.id)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedStudentId(st.id);
                }
              }}
            >
              <div className={styles.avatar}>
                <span role="img" aria-label={animal.name}>
                  {animal.emoji}
                </span>
              </div>

              <div className={styles.studentInfo}>
                <span className={styles.studentName}>{st.fullName}</span>
                <div className={styles.studentMeta}>
                  <span className={styles.classroomTag}>{st.classroomName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{publicLabel}</span>
                </div>
              </div>

              <Badge status={st.status} size="sm" />
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleAnnounce}
          isLoading={isLoading}
          disabled={!selectedStudent}
        >
          Anunciar Llegada en Portón
        </Button>

        <Button variant="ghost" size="md" fullWidth onClick={onBack}>
          Cambiar número o usuario
        </Button>
      </div>
    </div>
  );
}

