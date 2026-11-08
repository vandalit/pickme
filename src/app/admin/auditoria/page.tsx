import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { resolveUserSchool } from '@/lib/userSchool';
import { TableSkeleton } from '@/components/admin/TableSkeleton';
import { generatePlainTextAuditLog } from '@/lib/auditLogFormatter';
import { AuditoriaTable, AuditRecord, ClosedSessionLog } from './AuditoriaTable';
import styles from '../page.module.css';

export const dynamic = 'force-dynamic';

async function AuditoriaTableLoader({ schoolId }: { schoolId: string }) {
  let metrics = {
    totalSessions: 0,
    totalEvents: 0,
    completedHandover: 0,
    inProcess: 0,
    alerts: 0,
  };

  let auditLogs: AuditRecord[] = [];
  let closedSessionLogs: ClosedSessionLog[] = [];

  try {
    const [totalSessions, openSession, events, closedSessionsRaw] = await Promise.all([
      prisma.pickupSession.count({
        where: { schoolId },
      }),
      prisma.pickupSession.findFirst({
        where: { schoolId, status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pickupEvent.findMany({
        where: { session: { schoolId } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          session: true,
          student: { include: { classroom: true } },
          picker: true,
          staff: true,
        },
      }),
      prisma.pickupSession.findMany({
        where: { schoolId, status: 'CLOSED' },
        orderBy: { closedAt: 'desc' },
        take: 20,
        include: {
          events: {
            include: {
              student: { include: { classroom: true } },
              picker: true,
              staff: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    if (closedSessionsRaw.length > 0) {
      closedSessionLogs = closedSessionsRaw.map((s) => ({
        id: s.id,
        sessionCode: s.sessionCode,
        startedAt: s.startedAt ? s.startedAt.toISOString() : s.createdAt.toISOString(),
        closedAt: s.closedAt ? s.closedAt.toISOString() : s.createdAt.toISOString(),
        totalEvents: s.events.length,
        completedCount: s.events.filter(
          (e) => e.status === 'IN_TRANSIT' || e.status === 'ARRIVED' || (e.status as string) === 'HANDOVER'
        ).length,
        plainText: generatePlainTextAuditLog(s as any),
      }));
    }

    if (events.length > 0) {
      const completedCount = events.filter(
        (e) => e.status === 'IN_TRANSIT' || e.status === 'ARRIVED'
      ).length;
      const inProcessCount = events.filter((e) => e.status === 'IN_PROCESS').length;
      const alertCount = events.filter((e) => e.status === 'ALERT').length;

      metrics = {
        totalSessions,
        totalEvents: events.length,
        completedHandover: completedCount,
        inProcess: inProcessCount,
        alerts: alertCount,
      };

      auditLogs = events.map((e) => {
        const timeStr =
          (e.updatedAt || e.createdAt).toISOString().replace('T', ' ').substring(0, 19) +
          ' UTC';

        const codeFormatted = e.handoverCode
          ? e.handoverCode.length === 6
            ? `${e.handoverCode.slice(0, 3)}-${e.handoverCode.slice(3)}`
            : e.handoverCode
          : 'Pendiente';

        return {
          id: e.id,
          sessionCode: e.session.sessionCode,
          timestamp: timeStr,
          studentName: e.student.fullName,
          classroom: `${e.student.classroom.grade} ${e.student.classroom.section}`,
          pickerName: e.picker
            ? `${e.picker.fullName} (${e.picker.relationship})`
            : 'Por anunciar',
          staffName: e.staff?.name || 'Personal Portón',
          handoverCode: codeFormatted,
          status: e.status,
          hashSha256: `sha256-${e.id.replace(/-/g, '').slice(0, 16)}...`,
        };
      });
    }
  } catch (error) {
    console.warn('[AuditoriaTableLoader] Usando logs de respaldo:', error);
  }

  return (
    <AuditoriaTable
      metrics={metrics}
      logs={auditLogs}
      closedSessionLogs={closedSessionLogs}
    />
  );
}

export default async function AdminAuditoriaPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  const { needsOnboarding, school: resolvedSchool } = await resolveUserSchool(session.user.email);
  if (needsOnboarding || !resolvedSchool) {
    redirect('/onboarding');
  }

  return (
    <section className={styles.sectionBlock}>
      <div className={styles.sectionHeader}>
        <h1 className={styles.sectionTitle}>Libro de Auditoría Forense y Cadena de Custodia</h1>
        <p className={styles.sectionDesc}>
          Bitácora cronológica inmutable respaldada en PostgreSQL con trazabilidad completa de
          traspasos físicos, códigos verificados e integridad de custodia.
        </p>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <AuditoriaTableLoader schoolId={resolvedSchool.id} />
      </Suspense>
    </section>
  );
}
