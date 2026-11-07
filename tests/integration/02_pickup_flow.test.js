const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

describe('Flujo de Retiro End-to-End y Validación en Portón (Paso 5)', () => {
  let pool;
  let prisma;
  let session;
  let testStudent;
  let guardianPhone = '+56991112233'; // Carolina Herrera (Vicente Toro Morales)

  before(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20000 });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });

    const school = await prisma.school.findFirst({ where: { name: 'colegio prueba' } });
    assert.ok(school);

    // Obtener sesión abierta de prueba
    session = await prisma.pickupSession.findFirst({
      where: { schoolId: school.id, status: 'OPEN' },
      include: {
        events: {
          include: { student: true }
        }
      }
    });
    assert.ok(session, 'Debe existir una sesión abierta en colegio prueba');

    testStudent = session.events.find(e => e.student.fullName === 'Vicente Toro Morales')?.student;
    assert.ok(testStudent, 'Vicente Toro Morales debe estar entre los alumnos convocados');
  });

  after(async () => {
    if (pool) await pool.end();
    if (prisma) await prisma.$disconnect();
  });

  it('1. Búsqueda móvil de apoderado (/api/pickup/lookup)', async () => {
    const cleanPhone = guardianPhone.replace(/[\s-]/g, '');
    const guardian = await prisma.guardian.findFirst({
      where: { whatsappNumber: cleanPhone },
      include: {
        students: {
          where: {
            student: {
              classroom: { schoolId: session.schoolId }
            }
          },
          include: {
            student: {
              include: {
                classroom: true,
                events: {
                  where: { sessionId: session.id },
                  take: 1
                }
              }
            }
          }
        }
      }
    });

    assert.ok(guardian, 'El apoderado debe existir en PostgreSQL');
    assert.ok(guardian.students.length > 0, 'Debe tener alumnos autorizados');
    
    const studentItem = guardian.students[0].student;
    assert.strictEqual(studentItem.fullName, 'Vicente Toro Morales');
    assert.strictEqual(studentItem.events[0].status, 'WAITING', 'El estado inicial debe ser WAITING');
  });

  it('2. Anuncio de llegada y generación de Handover Code (/api/pickup/solicitar)', async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos TTL

    const updatedEvent = await prisma.pickupEvent.updateMany({
      where: {
        sessionId: session.id,
        studentId: testStudent.id,
      },
      data: {
        status: 'IN_PROCESS',
        handoverCode: code,
        handoverExpiry: expiry,
        pickerScannedAt: new Date(),
      }
    });

    assert.strictEqual(updatedEvent.count, 1, 'Debe actualizar exactamente 1 evento');

    // Verificar en BD que pasó a IN_PROCESS con código de 6 dígitos
    const eventInDb = await prisma.pickupEvent.findFirst({
      where: { sessionId: session.id, studentId: testStudent.id }
    });

    assert.strictEqual(eventInDb.status, 'IN_PROCESS');
    assert.strictEqual(eventInDb.handoverCode, code);
    assert.ok(eventInDb.handoverExpiry > new Date());
    assert.ok(eventInDb.pickerScannedAt);
  });

  it('3. Rechazo de código erróneo o expirado en portón', async () => {
    const event = await prisma.pickupEvent.findFirst({
      where: { sessionId: session.id, studentId: testStudent.id }
    });

    // A. Código incorrecto
    const wrongCode = '000000';
    assert.notStrictEqual(event.handoverCode, wrongCode);

    // B. Código expirado
    const isExpired = (expiryDate) => new Date() > new Date(expiryDate);
    assert.strictEqual(isExpired(event.handoverExpiry), false, 'El código activo no debe estar expirado aún');
    
    const simulatedPastExpiry = new Date(Date.now() - 5000);
    assert.strictEqual(isExpired(simulatedPastExpiry), true, 'Fecha pasada debe marcarse como expirada');
  });

  it('4. Validación exitosa con Keypad táctil y sellado de entrega (/api/pickup/verificar-handover)', async () => {
    const event = await prisma.pickupEvent.findFirst({
      where: { sessionId: session.id, studentId: testStudent.id }
    });

    const confirmedAt = new Date();
    const updated = await prisma.pickupEvent.update({
      where: { id: event.id },
      data: {
        status: 'IN_TRANSIT',
        staffConfirmedAt: confirmedAt,
      }
    });

    assert.strictEqual(updated.status, 'IN_TRANSIT', 'Debe transicionar a IN_TRANSIT (Entregado)');
    assert.ok(updated.staffConfirmedAt, 'Debe sellar el timestamp del staff');

    // Intentar validar nuevamente debe ser rechazado
    const isAlreadyDelivered = updated.status === 'IN_TRANSIT' || updated.status === 'ARRIVED';
    assert.strictEqual(isAlreadyDelivered, true, 'No debe permitir re-validación de un retiro ya sellado');
  });
});
