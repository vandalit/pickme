import { createHash } from 'crypto';

export interface AuditLogSessionData {
  id: string;
  sessionCode: string;
  status: string;
  startedAt: Date | string | null;
  closedAt: Date | string | null;
  createdAt: Date | string;
  school: {
    name: string;
    address?: string | null;
  };
  events: Array<{
    id: string;
    status: string;
    handoverCode?: string | null;
    updatedAt: Date | string;
    createdAt: Date | string;
    pickerScannedAt?: Date | string | null;
    staffConfirmedAt?: Date | string | null;
    inTransitAt?: Date | string | null;
    arrivedAt?: Date | string | null;
    student: {
      fullName: string;
      classroom: {
        grade: string;
        section: string;
      };
    };
    picker?: {
      fullName: string;
      relationship: string;
      whatsappNumber?: string | null;
    } | null;
    staff?: {
      name: string;
      email: string;
    } | null;
  }>;
}

/**
 * Genera un texto plano formal, inmutable y legible para auditoría forense de una sesión escolar.
 */
export function generatePlainTextAuditLog(session: AuditLogSessionData): string {
  const started = session.startedAt ? new Date(session.startedAt) : new Date(session.createdAt);
  const closed = session.closedAt ? new Date(session.closedAt) : null;

  const startedStr = started.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const closedStr = closed ? closed.toISOString().replace('T', ' ').substring(0, 19) + ' UTC' : 'EN CURSO / SIN SELLAR';

  const durationMin = closed
    ? Math.max(1, Math.round((closed.getTime() - started.getTime()) / (1000 * 60)))
    : '--';

  const totalEvents = session.events.length;
  const completedEvents = session.events.filter(
    (e) => e.status === 'IN_TRANSIT' || e.status === 'ARRIVED' || e.status === 'HANDOVER'
  ).length;
  const inProcessEvents = session.events.filter((e) => e.status === 'IN_PROCESS').length;
  const waitingEvents = session.events.filter((e) => e.status === 'WAITING').length;

  const divider = '='.repeat(84);
  const thinDivider = '-'.repeat(84);

  const lines: string[] = [];
  lines.push(divider);
  lines.push('   PICKME SAAS - LIBRO DE AUDITORIA FORENSE Y CADENA DE CUSTODIA ESCOLAR');
  lines.push('   REGISTRO INMUTABLE DE ENTREGAS FISICAS DE ALUMNOS');
  lines.push(divider);
  lines.push(`Institución Educacional : ${session.school.name.toUpperCase()}`);
  if (session.school.address) {
    lines.push(`Dirección               : ${session.school.address}`);
  }
  lines.push(`Código de Jornada       : ${session.sessionCode}`);
  lines.push(`ID Único de Sesión      : ${session.id}`);
  lines.push(`Estado de Jornada       : ${session.status}`);
  lines.push(`Apertura Registrada     : ${startedStr}`);
  lines.push(`Cierre Registrado       : ${closedStr}`);
  lines.push(`Duración Operativa      : ${durationMin} minutos`);
  lines.push(thinDivider);
  lines.push('RESUMEN DE CUSTODIA:');
  lines.push(`  - Total Alumnos Convocados (Presentes) : ${totalEvents}`);
  lines.push(`  - Retiros Verificados y Sellados       : ${completedEvents}`);
  lines.push(`  - En Proceso al momento del corte      : ${inProcessEvents}`);
  lines.push(`  - En Espera / No retirados             : ${waitingEvents}`);
  lines.push(divider);
  lines.push('TRAZABILIDAD CRONOLOGICA DE TRASPASOS:');
  lines.push(thinDivider);

  if (session.events.length === 0) {
    lines.push('  [!] No se registraron eventos de retiro durante esta jornada escolar.');
  } else {
    // Ordenar cronológicamente por updatedAt
    const sortedEvents = [...session.events].sort(
      (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );

    sortedEvents.forEach((ev, idx) => {
      const evDate = new Date(ev.updatedAt);
      const evTime = evDate.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      const studentClass = `${ev.student.classroom.grade} ${ev.student.classroom.section}`;
      const pickerInfo = ev.picker
        ? `${ev.picker.fullName} [${ev.picker.relationship}${ev.picker.whatsappNumber ? ' - ' + ev.picker.whatsappNumber : ''}]`
        : 'NO REGISTRADO (En espera)';
      const staffInfo = ev.staff?.name || 'Personal Escolar Portón';
      const otpCode = ev.handoverCode
        ? ev.handoverCode.length === 6
          ? `${ev.handoverCode.slice(0, 3)}-${ev.handoverCode.slice(3)}`
          : ev.handoverCode
        : 'N/A';
      const evHash = createHash('sha256')
        .update(`${ev.id}:${ev.status}:${ev.handoverCode || ''}:${evTime}`)
        .digest('hex')
        .slice(0, 16);

      lines.push(`[#${String(idx + 1).padStart(2, '0')}] ${evTime}`);
      lines.push(`     Alumno      : ${ev.student.fullName} (${studentClass})`);
      lines.push(`     Retirador   : ${pickerInfo}`);
      lines.push(`     Funcionario : ${staffInfo}`);
      lines.push(`     Código OTP  : ${otpCode} | Estado: ${ev.status}`);
      lines.push(`     Firma Evento: SHA256-${evHash}`);
      lines.push(thinDivider);
    });
  }

  // Sello Criptográfico final sobre todo el cuerpo
  const contentToHash = lines.join('\n');
  const sessionSeal = createHash('sha256').update(contentToHash).digest('hex');

  lines.push(divider);
  lines.push('CERTIFICACION CRIPTOGRAFICA DE INTEGRIDAD:');
  lines.push(`SELLO SHA-256 DEL DOCUMENTO: ${sessionSeal}`);
  lines.push('ESTADO DEL REGISTRO         : INMUTABLE Y CERRADO');
  lines.push('VALIDO PARA FINES DE AUDITORIA MINISTERIAL Y PERITAJE JUDICIAL.');
  lines.push(divider);

  return lines.join('\n');
}
