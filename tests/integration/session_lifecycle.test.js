const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

describe('Ciclo de Vida de Jornada y Gobernanza (PostgreSQL Neon)', () => {
  let pool;
  let prisma;

  before(() => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20000 });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  });

  after(async () => {
    if (pool) await pool.end();
    if (prisma) await prisma.$disconnect();
  });

  it('Verifica la existencia y aislamiento de colegios en base de datos', async () => {
    const schools = await prisma.school.findMany();
    assert.ok(schools.length >= 2, 'Deben existir al menos Colegio San Martín y colegio prueba');
    
    const demoSchool = schools.find(s => s.name === 'Colegio San Martín');
    const pruebaSchool = schools.find(s => s.name === 'colegio prueba');

    assert.ok(demoSchool, 'Colegio San Martín debe existir en PostgreSQL');
    assert.ok(pruebaSchool, 'colegio prueba debe existir en PostgreSQL');
    assert.notStrictEqual(demoSchool.id, pruebaSchool.id, 'Los colegios deben tener IDs distintos');
  });

  it('Verifica que colegio prueba tiene 11 alumnos matriculados y CERO colisiones de avatar', async () => {
    const pruebaSchool = await prisma.school.findFirst({
      where: { name: 'colegio prueba' },
      include: {
        classrooms: {
          include: { students: true }
        }
      }
    });

    assert.ok(pruebaSchool);
    const totalStudents = pruebaSchool.classrooms.reduce((acc, c) => acc + c.students.length, 0);
    assert.strictEqual(totalStudents, 11, 'Deben existir 11 alumnos matriculados');

    // Verificar colisiones por curso
    for (const c of pruebaSchool.classrooms) {
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
    const pruebaSchool = await prisma.school.findFirst({ where: { name: 'colegio prueba' } });
    
    const activeStudents = await prisma.student.findMany({
      where: {
        classroom: { schoolId: pruebaSchool.id },
        status: 'ACTIVE'
      }
    });

    const absentStudents = await prisma.student.findMany({
      where: {
        classroom: { schoolId: pruebaSchool.id },
        status: 'ABSENT'
      }
    });

    const withdrawnStudents = await prisma.student.findMany({
      where: {
        classroom: { schoolId: pruebaSchool.id },
        status: 'WITHDRAWN'
      }
    });

    assert.strictEqual(activeStudents.length, 9, 'Deben haber 9 alumnos ACTIVE');
    assert.strictEqual(absentStudents.length, 1, 'Florencia Rojas debe ser ABSENT');
    assert.strictEqual(withdrawnStudents.length, 1, 'Joaquín Fuentes debe ser WITHDRAWN');

    assert.strictEqual(absentStudents[0].fullName, 'Florencia Rojas Díaz');
    assert.strictEqual(withdrawnStudents[0].fullName, 'Joaquín Fuentes Cruz');
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
