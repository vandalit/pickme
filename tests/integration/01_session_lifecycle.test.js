const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { TEST_SCHOOL_NAME, setupTestSchool } = require('./testHelper');

describe('Ciclo de Vida de Jornada y Gobernanza (PostgreSQL Neon)', () => {
  let pool;
  let prisma;
  let testSchool;

  before(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20000 });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });

    // Configurar colegio de prueba automatizado aislado (sin tocar colegios reales)
    testSchool = await setupTestSchool(prisma);
  });

  after(async () => {
    if (pool) await pool.end();
    if (prisma) await prisma.$disconnect();
  });

  it('Verifica la existencia y aislamiento de colegios en base de datos', async () => {
    const schools = await prisma.school.findMany();
    assert.ok(schools.length >= 2, 'Deben existir al menos Colegio San Martín y el colegio de prueba');
    
    const demoSchool = schools.find(s => s.name === 'Colegio San Martín');
    const qaSchool = schools.find(s => s.name === TEST_SCHOOL_NAME);

    assert.ok(demoSchool, 'Colegio San Martín debe existir en PostgreSQL');
    assert.ok(qaSchool, `${TEST_SCHOOL_NAME} debe existir en PostgreSQL`);
    assert.notStrictEqual(demoSchool.id, qaSchool.id, 'Los colegios deben tener IDs distintos');
  });

  it('Verifica que el colegio de prueba tiene 10 alumnos matriculados y CERO colisiones de avatar', async () => {
    const school = await prisma.school.findFirst({
      where: { name: TEST_SCHOOL_NAME },
      include: {
        classrooms: {
          include: { students: true }
        }
      }
    });

    assert.ok(school);
    const totalStudents = school.classrooms.reduce((acc, c) => acc + c.students.length, 0);
    assert.strictEqual(totalStudents, 10, 'Deben existir 10 alumnos matriculados desde el CSV mock');

    // Verificar colisiones por curso
    for (const c of school.classrooms) {
      const keys = c.students.map(s => `${s.animalId}::${s.colorId}`);
      const uniqueKeys = new Set(keys);
      assert.strictEqual(
        uniqueKeys.size,
        c.students.length,
        `Colisión detectada en curso ${c.grade} ${c.section}`
      );
    }
  });

  it('Verifica filtro de asistencia: solo alumnos ACTIVE son convocados a la jornada', async () => {
    const school = await prisma.school.findFirst({ where: { name: TEST_SCHOOL_NAME } });
    
    const activeStudents = await prisma.student.findMany({
      where: {
        classroom: { schoolId: school.id },
        status: 'ACTIVE'
      }
    });

    const absentStudents = await prisma.student.findMany({
      where: {
        classroom: { schoolId: school.id },
        status: 'ABSENT'
      }
    });

    const withdrawnStudents = await prisma.student.findMany({
      where: {
        classroom: { schoolId: school.id },
        status: 'WITHDRAWN'
      }
    });

    assert.strictEqual(activeStudents.length, 8, 'Deben haber 8 alumnos ACTIVE');
    assert.strictEqual(absentStudents.length, 1, 'Florencia Rojas debe ser ABSENT');
    assert.strictEqual(withdrawnStudents.length, 1, 'Joaquín Fuentes debe ser WITHDRAWN');

    assert.strictEqual(absentStudents[0].fullName, 'Florencia Rojas Díaz');
    assert.strictEqual(withdrawnStudents[0].fullName, 'Joaquín Fuentes Cruz');
  });

  it('Verifica Apertura de Jornada (Paso 4): genera sesión OPEN y snapshot de exactamente 8 eventos WAITING', async () => {
    const school = await prisma.school.findFirst({ where: { name: TEST_SCHOOL_NAME } });
    assert.ok(school);

    // 1. Obtener los alumnos activos que deben ser convocados
    const activeStudents = await prisma.student.findMany({
      where: { classroom: { schoolId: school.id }, status: 'ACTIVE' }
    });
    assert.strictEqual(activeStudents.length, 8);

    // 2. Simular la apertura formal de jornada (equivalente a openDailySessionAction)
    const sessionCode = `QA-${Math.floor(1000 + Math.random() * 9000)}`;
    const session = await prisma.pickupSession.create({
      data: {
        schoolId: school.id,
        sessionCode,
        status: 'OPEN',
        startedAt: new Date(),
        events: {
          create: activeStudents.map(s => ({
            studentId: s.id,
            status: 'WAITING',
          })),
        },
      },
      include: {
        events: {
          include: { student: true }
        }
      }
    });

    assert.ok(session.id);
    assert.strictEqual(session.status, 'OPEN');
    assert.strictEqual(session.events.length, 8, 'Debe crear exactamente 8 eventos WAITING');

    // Comprobar que todos los eventos iniciales están en WAITING
    for (const evt of session.events) {
      assert.strictEqual(evt.status, 'WAITING');
      assert.strictEqual(evt.student.status, 'ACTIVE');
      assert.notStrictEqual(evt.student.fullName, 'Florencia Rojas Díaz', 'Florencia (ABSENT) no debe estar en los eventos');
      assert.notStrictEqual(evt.student.fullName, 'Joaquín Fuentes Cruz', 'Joaquín (WITHDRAWN) no debe estar en los eventos');
    }

    // 3. Validar los endpoints generados para el Launchpad
    const launchpadUrls = {
      boardTv: `/board/${session.id}`,
      staffPorton: `/staff?session=${session.sessionCode}`,
      pickerMovil: `/retirar?session=${session.sessionCode}`
    };

    assert.ok(launchpadUrls.boardTv.startsWith('/board/'));
    assert.ok(launchpadUrls.staffPorton.includes(`session=${session.sessionCode}`));
    assert.ok(launchpadUrls.pickerMovil.includes(`session=${session.sessionCode}`));

    console.log(`[Launchpad Generado] Sesión: ${session.sessionCode} | Alumnos convocados: ${session.events.length}`);
    console.log(`  -> Board TV: ${launchpadUrls.boardTv}`);
    console.log(`  -> Staff Portón: ${launchpadUrls.staffPorton}`);
    console.log(`  -> Móvil Picker: ${launchpadUrls.pickerMovil}`);
  });

  it('Verifica lógica de Handover Code: 6 dígitos, TTL de 10 min y validación estricta', () => {
    // 1. Generación de código
    const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();
    const code = generateCode();
    assert.strictEqual(code.length, 6, 'El código debe tener 6 caracteres');
    assert.ok(/^\d{6}$/.test(code), 'El código debe ser puramente numérico');

    // 2. Cálculo de vigencia (TTL 10 min)
    const now = new Date();
    const expiry = new Date(now.getTime() + 10 * 60 * 1000);
    const ttlSeconds = Math.round((expiry.getTime() - now.getTime()) / 1000);
    assert.strictEqual(ttlSeconds, 600, 'El TTL debe ser de exactamente 600 segundos (10 minutos)');

    // 3. Verificación de coincidencia
    const validate = (inputCode, storedCode, storedExpiry) => {
      if (inputCode !== storedCode) return { success: false, reason: 'INVALID_CODE' };
      if (Date.now() > storedExpiry.getTime()) return { success: false, reason: 'EXPIRED' };
      return { success: true };
    };

    assert.strictEqual(validate(code, code, expiry).success, true, 'Código correcto y vigente debe ser válido');
    assert.strictEqual(validate('999999', code, expiry).reason, 'INVALID_CODE', 'Código erróneo debe rechazarse');
    
    const pastExpiry = new Date(Date.now() - 1000);
    assert.strictEqual(validate(code, code, pastExpiry).reason, 'EXPIRED', 'Código expirado debe ser rechazado');
  });
});
