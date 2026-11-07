const { describe, it } = require('node:test');
const assert = require('node:assert');
const { parseStudentsCSV, CSV_TEMPLATE_HEADER } = require('../../dist/lib/csvImporter');

describe('Parser de Nómina Escolar CSV (csvImporter)', () => {
  it('Debe rechazar archivos vacíos o con solo cabecera', () => {
    const emptyResult = parseStudentsCSV('');
    assert.strictEqual(emptyResult.validRows.length, 0);
    assert.ok(emptyResult.errors.length > 0);

    const headerOnlyResult = parseStudentsCSV(CSV_TEMPLATE_HEADER);
    assert.strictEqual(headerOnlyResult.validRows.length, 0);
    assert.ok(headerOnlyResult.errors.length > 0);
  });

  it('Debe parsear correctamente filas válidas con apoderado y retirador', () => {
    const csv = `${CSV_TEMPLATE_HEADER}
Vicente Toro Morales,1° Básico A,Carolina Herrera,+56991112233,Ignacio Herrera,Tío,ACTIVO`;
    const result = parseStudentsCSV(csv);
    assert.strictEqual(result.errors.length, 0);
    assert.strictEqual(result.validRows.length, 1);

    const row = result.validRows[0];
    assert.strictEqual(row.fullName, 'Vicente Toro Morales');
    assert.strictEqual(row.gradeSection, '1° Básico A');
    assert.strictEqual(row.guardianName, 'Carolina Herrera');
    assert.strictEqual(row.guardianPhone, '+56991112233');
    assert.strictEqual(row.pickerName, 'Ignacio Herrera');
    assert.strictEqual(row.pickerRelationship, 'Tío');
    assert.strictEqual(row.status, 'ACTIVE');
  });

  it('Debe normalizar estados en español (ACTIVO -> ACTIVE, AUSENTE -> ABSENT, RETIRADO -> WITHDRAWN)', () => {
    const csv = `${CSV_TEMPLATE_HEADER}
Alumno Uno,1°A,Apo Uno,+569111,Ret Uno,Tío,ACTIVO
Alumno Dos,1°A,Apo Dos,+569222,Ret Dos,Tía,AUSENTE HOY
Alumno Tres,1°A,Apo Tres,+569333,Ret Tres,Abuelo,RETIRADO DE LA ESCUELA`;
    const result = parseStudentsCSV(csv);
    assert.strictEqual(result.validRows.length, 3);
    assert.strictEqual(result.validRows[0].status, 'ACTIVE');
    assert.strictEqual(result.validRows[1].status, 'ABSENT');
    assert.strictEqual(result.validRows[2].status, 'WITHDRAWN');
  });

  it('Debe tolerar comillas en campos y espacios residuales', () => {
    const csv = `${CSV_TEMPLATE_HEADER}
"Matías Silva Gómez" , "2° Básico B" , "Marcela Gómez" , "+56992223344" , "Pedro Chofer" , "Transporte" , "ACTIVO"`;
    const result = parseStudentsCSV(csv);
    assert.strictEqual(result.validRows.length, 1);
    assert.strictEqual(result.validRows[0].fullName, 'Matías Silva Gómez');
    assert.strictEqual(result.validRows[0].gradeSection, '2° Básico B');
    assert.strictEqual(result.validRows[0].guardianPhone, '+56992223344');
  });

  it('Debe reportar error cuando faltan columnas obligatorias', () => {
    const csv = `${CSV_TEMPLATE_HEADER}
Alumno Incompleto,1°A`;
    const result = parseStudentsCSV(csv);
    assert.strictEqual(result.validRows.length, 0);
    assert.strictEqual(result.errors.length, 1);
  });
});
