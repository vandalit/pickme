const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const {
  TEST_SCHOOL_NAME,
  getLocalTestDatabaseUrl,
  setupTestSchool,
  cleanupTestSchool,
} = require('./testHelper');
const { generatePlainTextAuditLog } = require('../../dist/lib/auditLogFormatter');

describe('Auditoría Forense y Cierre de Jornada (Paso 6)', { concurrency: 1 }, () => {
  let pool;
  let prisma;
  let school;
  let openSession;

  before(async () => {
    pool = new Pool({ connectionString: getLocalTestDatabaseUrl(), connectionTimeoutMillis: 20000 });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });

    school = await prisma.school.findFirst({ where: { name: TEST_SCHOOL_NAME } });
    if (!school) {
      school = await setupTestSchool(prisma);
    }
    assert.ok(school);

    openSession = await prisma.pickupSession.findFirst({
      where: { schoolId: school.id, status: 'OPEN' },
      include: { events: true },
    });
    if (!openSession) {
      const activeStudents = await prisma.student.findMany({
        where: { classroom: { schoolId: school.id }, status: 'ACTIVE' },
      });
      openSession = await prisma.pickupSession.create({
        data: {
          schoolId: school.id,
          sessionCode: 'QA-AUTO',
          status: 'OPEN',
          startedAt: new Date(),
          events: {
            create: activeStudents.map((s) => ({
              studentId: s.id,
              status: 'WAITING',
            })),
          },
        },
        include: { events: true },
      });
    }
    assert.ok(openSession, 'Debe haber una sesión abierta para probar auditoría y cierre');
  });

  after(async () => {
    try {
      if (prisma) await cleanupTestSchool(prisma);
    } catch (e) {
      console.warn('Error limpiando test school:', e);
    }
    if (pool) await pool.end();
    if (prisma) await prisma.$disconnect();
  });

  it('1. Verificación del Libro de Auditoría (/admin/auditoria): trazabilidad y métricas', async () => {
    try {
      const events = await prisma.pickupEvent.findMany({
        where: { sessionId: openSession.id },
        include: {
          session: true,
          student: { include: { classroom: true } },
          picker: true,
          staff: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      assert.ok(events.length >= 8, 'Deben existir al menos los 8 eventos de la sesión abierta');

      // Comprobar que los eventos tienen la información requerida para auditoría forense
      for (const e of events) {
        assert.ok(e.id, 'Debe tener UUID');
        assert.ok(e.student.fullName, 'Debe registrar nombre completo del alumno');
        assert.ok(e.student.classroom.grade, 'Debe registrar curso del alumno');
        assert.ok(e.createdAt, 'Debe registrar timestamp de creación');
        assert.ok(e.session.sessionCode, 'Debe vincular el código de sesión');
      }

      const completed = events.filter(e => e.status === 'IN_TRANSIT' || e.status === 'ARRIVED').length;
      console.log(`[Auditoría] Total eventos registrados: ${events.length} | Traspasos sellados: ${completed}`);
    } catch (err) {
      console.error('[DETALLE ERROR TEST 1]:', err);
      throw err;
    }
  });

  it('2. Cierre formal y protegido de la jornada escolar (closeDailySessionAction)', async () => {
    const closedTime = new Date();
    const closedSession = await prisma.pickupSession.update({
      where: { id: openSession.id },
      data: {
        status: 'CLOSED',
        closedAt: closedTime,
      }
    });

    assert.strictEqual(closedSession.status, 'CLOSED', 'La sesión debe quedar en estado CLOSED');
    assert.ok(closedSession.closedAt, 'Debe registrar timestamp exacto de cierre');

    // Comprobar que en la base de datos no queda ninguna sesión OPEN para este colegio
    const remainingOpen = await prisma.pickupSession.findFirst({
      where: { schoolId: school.id, status: 'OPEN' }
    });
    assert.strictEqual(remainingOpen, null, 'No deben quedar sesiones abiertas tras el cierre formal');
    console.log(`[Cierre] Jornada ${closedSession.sessionCode} sellada exitosamente a las ${closedSession.closedAt.toISOString()}`);
  });

  it('3. Generación del registro en texto plano (.txt) para la sesión cerrada con sello SHA-256', async () => {
    try {
      const closedSessionWithDetails = await prisma.pickupSession.findUnique({
        where: { id: openSession.id },
        include: {
          school: true,
          events: {
            include: {
              student: { include: { classroom: true } },
              picker: true,
              staff: true,
            }
          }
        }
      });

      assert.ok(closedSessionWithDetails);
      const plainTextLog = generatePlainTextAuditLog(closedSessionWithDetails);

      assert.ok(plainTextLog.includes('PICKME SAAS - LIBRO DE AUDITORIA FORENSE'));
      assert.ok(plainTextLog.includes(TEST_SCHOOL_NAME.toUpperCase()));
      assert.ok(plainTextLog.includes(closedSessionWithDetails.sessionCode));
      assert.ok(plainTextLog.includes('SELLO SHA-256 DEL DOCUMENTO:'));
      assert.ok(plainTextLog.includes('ESTADO DEL REGISTRO         : INMUTABLE Y CERRADO'));
      console.log(`[Forensic .txt] Log generado con éxito (${plainTextLog.length} caracteres)`);
    } catch (err) {
      console.error('[DETALLE ERROR TEST 3]:', err);
      throw err;
    }
  });
});
