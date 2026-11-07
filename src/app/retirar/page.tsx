'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  StepLookup,
  StepStudentSelect,
  StepHandoverDisplay,
  AuthorizedStudent,
} from '@/components/picker';
import styles from './page.module.css';

function RetirarContent() {
  const searchParams = useSearchParams();
  const initialSession = searchParams.get('session') || '';

  const [step, setStep] = useState<'lookup' | 'select' | 'handover'>('lookup');
  const [phone, setPhone] = useState('');
  const [sessionCode, setSessionCode] = useState(initialSession);
  const [pickerName, setPickerName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [students, setStudents] = useState<AuthorizedStudent[]>([]);
  const [activeStudent, setActiveStudent] = useState<AuthorizedStudent | null>(null);

  const [handoverData, setHandoverData] = useState<{
    code: string;
    expiry?: string;
    status: string;
    publicLabel: string;
    studentInitials?: string;
    classroomName: string;
    animalId: string;
    colorId: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // 1. Buscar autorizaciones por teléfono
  const handleLookup = async (lookupPhone: string, lookupSession: string) => {
    setIsLoading(true);
    setError(undefined);
    try {
      const res = await fetch(
        `/api/pickup/lookup?phone=${encodeURIComponent(lookupPhone)}&session=${encodeURIComponent(lookupSession)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No fue posible validar tu número.');
      }

      setPhone(lookupPhone);
      setSessionCode(data.sessionCode);
      setPickerName(data.pickerName);
      setSchoolName(data.schoolName);
      setStudents(data.students);

      // Si tiene alumnos con handover activo, ir directo al display
      const activeHandover = data.students.find(
        (s: AuthorizedStudent) => s.handoverCode && s.status === 'IN_PROCESS'
      );

      if (activeHandover) {
        setActiveStudent(activeHandover);
        setHandoverData({
          code: activeHandover.handoverCode!,
          expiry: activeHandover.handoverExpiry || undefined,
          status: activeHandover.status,
          publicLabel: '',
          studentInitials: activeHandover.initials,
          classroomName: activeHandover.classroomName,
          animalId: activeHandover.animalId,
          colorId: activeHandover.colorId,
        });
        setStep('handover');
      } else if (data.students.length === 1) {
        // Si tiene un único alumno, avanzamos a la selección
        setStep('select');
      } else {
        setStep('select');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Anunciar llegada y solicitar entrega (Genera Handover Code)
  const handleAnnounce = async (student: AuthorizedStudent) => {
    setIsLoading(true);
    setError(undefined);
    try {
      const res = await fetch('/api/pickup/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          sessionId: sessionCode,
          pickerPhone: phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No fue posible anunciar tu llegada.');
      }

      setActiveStudent(student);
      setHandoverData({
        code: data.handoverCode,
        expiry: data.handoverExpiry,
        status: data.status,
        publicLabel: data.studentPublicLabel,
        studentInitials: data.studentInitials,
        classroomName: data.classroom,
        animalId: student.animalId,
        colorId: student.colorId,
      });

      setStep('handover');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Refrescar estado para verificar si el personal ingresó el código
  const handleRefreshStatus = async () => {
    if (!phone || !sessionCode) return;
    try {
      const res = await fetch(
        `/api/pickup/lookup?phone=${encodeURIComponent(phone)}&session=${encodeURIComponent(sessionCode)}`
      );
      const data = await res.json();
      if (res.ok && activeStudent) {
        const updated = data.students.find(
          (s: AuthorizedStudent) => s.id === activeStudent.id
        );
        if (updated) {
          setHandoverData((prev) =>
            prev ? { ...prev, status: updated.status } : null
          );
        }
      }
    } catch (e) {
      console.error('Error al actualizar estado:', e);
    }
  };

  // Polling automático mientras el código esté activo (detecta validación de portón al instante)
  useEffect(() => {
    if (step !== 'handover' || !handoverData) return;
    if (handoverData.status === 'IN_TRANSIT' || handoverData.status === 'ARRIVED') return;

    const interval = setInterval(() => {
      handleRefreshStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [step, handoverData?.status, phone, sessionCode, activeStudent]);

  return (
    <main className={styles.container}>
      <header className={styles.topBar}>
        <span className={styles.logoIcon} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </span>
        <span className={styles.logoText}>
          Pick<span className={styles.logoAccent}>Me</span>
        </span>
      </header>

      {step === 'lookup' && (
        <StepLookup
          initialSessionCode={sessionCode}
          onSearch={handleLookup}
          isLoading={isLoading}
          error={error}
        />
      )}

      {step === 'select' && (
        <StepStudentSelect
          pickerName={pickerName}
          schoolName={schoolName}
          students={students}
          onSelectAndAnnounce={handleAnnounce}
          onBack={() => setStep('lookup')}
          isLoading={isLoading}
        />
      )}

      {step === 'handover' && handoverData && (
        <StepHandoverDisplay
          handoverCode={handoverData.code}
          handoverExpiry={handoverData.expiry}
          studentPublicLabel={handoverData.publicLabel}
          studentInitials={handoverData.studentInitials}
          animalId={handoverData.animalId}
          colorId={handoverData.colorId}
          classroomName={handoverData.classroomName}
          schoolName={schoolName}
          status={handoverData.status}
          onRefreshStatus={handleRefreshStatus}
          onReset={() => {
            setStep('lookup');
            setHandoverData(null);
          }}
        />
      )}

      <footer className={styles.footer}>
        PickMe — Cadena de Custodia Digital Escolar
      </footer>
    </main>
  );
}

export default function RetirarPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>}>
      <RetirarContent />
    </Suspense>
  );
}

