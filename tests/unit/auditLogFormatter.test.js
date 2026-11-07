const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { generatePlainTextAuditLog } = require('../../dist/lib/auditLogFormatter.js');

describe('Generador de Log Forense en Texto Plano (auditLogFormatter)', () => {
  test('Debe generar un log forense completo con cabecera, eventos y sello SHA-256', () => {
    const mockSession = {
      id: 'sess-12345',
      sessionCode: 'CSM-1024',
      status: 'CLOSED',
      createdAt: '2026-11-07T12:00:00.000Z',
      startedAt: '2026-11-07T12:00:00.000Z',
      closedAt: '2026-11-07T13:00:00.000Z',
      school: {
        name: 'Colegio San Martín',
        address: 'Av. Libertador 1234',
      },
      events: [
        {
          id: 'ev-1',
          status: 'ARRIVED',
          handoverCode: '492817',
          createdAt: '2026-11-07T12:05:00.000Z',
          updatedAt: '2026-11-07T12:15:00.000Z',
          student: {
            fullName: 'Vicente Toro Morales',
            classroom: { grade: '1° Básico', section: 'A' },
          },
          picker: {
            fullName: 'Rodrigo Toro',
            relationship: 'Padre',
            whatsappNumber: '+56911112222',
          },
          staff: {
            name: 'Inspector General',
            email: 'inspector@sanmartin.edu',
          },
        },
      ],
    };

    const logText = generatePlainTextAuditLog(mockSession);

    assert.ok(logText.includes('PICKME SAAS - LIBRO DE AUDITORIA FORENSE'));
    assert.ok(logText.includes('COLEGIO SAN MARTÍN'));
    assert.ok(logText.includes('CSM-1024'));
    assert.ok(logText.includes('Duración Operativa      : 60 minutos'));
    assert.ok(logText.includes('Vicente Toro Morales (1° Básico A)'));
    assert.ok(logText.includes('Rodrigo Toro [Padre - +56911112222]'));
    assert.ok(logText.includes('Código OTP  : 492-817 | Estado: ARRIVED'));
    assert.ok(logText.includes('SELLO SHA-256 DEL DOCUMENTO:'));
    assert.ok(logText.includes('INMUTABLE Y CERRADO'));
  });

  test('Debe manejar jornadas vacías o sin eventos sin romperse', () => {
    const emptySession = {
      id: 'sess-empty',
      sessionCode: 'CP-0000',
      status: 'CLOSED',
      createdAt: '2026-11-07T14:00:00.000Z',
      startedAt: '2026-11-07T14:00:00.000Z',
      closedAt: '2026-11-07T14:10:00.000Z',
      school: {
        name: 'Colegio Vacío',
      },
      events: [],
    };

    const logText = generatePlainTextAuditLog(emptySession);
    assert.ok(logText.includes('COLEGIO VACÍO'));
    assert.ok(logText.includes('No se registraron eventos de retiro'));
    assert.ok(logText.includes('SELLO SHA-256 DEL DOCUMENTO:'));
  });
});

