import React from 'react';
import { prisma } from '@/lib/db';
import { QRDisplay } from '@/components/ui/QRDisplay';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function DailyPassPage({ params }: Props) {
  const { token } = await params;

  const pass = await prisma.dailyPass.findUnique({
    where: { passToken: token },
    include: {
      school: true,
      student: {
        include: { classroom: true },
      },
      guardian: true,
    },
  });

  if (!pass) {
    return (
      <main className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title} style={{ color: '#f87171' }}>Pase no Encontrado</h1>
          <p className={styles.instructions}>
            El enlace de retiro temporal no es válido o ha expirado. Contacta al apoderado titular.
          </p>
        </div>
      </main>
    );
  }

  const isExpired = new Date() > pass.validForDate;

  return (
    <main className={styles.container}>
      <div className={`${styles.card} ${pass.isRevoked || isExpired ? styles.revokedCard : ''}`}>
        <header className={styles.header}>
          <span className={styles.schoolBadge}>{pass.school.name}</span>
          <h1 className={styles.title}>Pase de Retiro Escolar</h1>
        </header>

        {pass.isRevoked ? (
          <div className={styles.revokedBadge}>
            ⚠️ Este pase fue revocado por el apoderado titular.
          </div>
        ) : isExpired ? (
          <div className={styles.revokedBadge}>
            ⏳ Este pase expiró al término de la jornada escolar.
          </div>
        ) : pass.usedAt ? (
          <div className={styles.revokedBadge} style={{ color: '#4ade80', background: 'rgba(74, 222, 128, 0.15)' }}>
            ✅ Retiro completado exitosamente a las{' '}
            {new Date(pass.usedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs.
          </div>
        ) : (
          <>
            <div className={styles.studentBox}>
              <span className={styles.studentName}>{pass.student.fullName}</span>
              <span className={styles.studentGrade}>
                {pass.student.classroom.grade} {pass.student.classroom.section}
              </span>
            </div>

            <div className={styles.pickerBox}>
              Autorizado para:{' '}
              <span className={styles.pickerHighlight}>{pass.pickerName}</span>
              <br />
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Vínculo: {pass.relationship} · Delegado por {pass.guardian.fullName}
              </span>
            </div>

            <div className={styles.qrWrapper}>
              <QRDisplay
                value={`PICKME-PASS:${pass.passToken}:${pass.pinCode}`}
                size={180}
              />
            </div>

            <div className={styles.pinCard}>
              <span className={styles.pinLabel}>Código PIN para Dictar en Portón</span>
              <span className={styles.pinValue}>{pass.pinCode}</span>
            </div>

            <p className={styles.instructions}>
              Muestra este código QR al personal de portería o dicta el PIN de {pass.pinCode.length} dígitos a viva voz.
            </p>
          </>
        )}
      </div>

      <p className={styles.footerNotes}>
        Cadena de custodia digital oficial validada por <strong>PickMe</strong> para {pass.school.name}.
      </p>
    </main>
  );
}

