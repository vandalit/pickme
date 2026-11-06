/**
 * Utilidades para la importación masiva de nóminas escolares vía CSV/Excel en PickMe.
 */

export interface ParsedStudentRow {
  fullName: string;
  gradeSection: string; // ej: "1° Básico A"
  guardianName: string;
  guardianPhone: string;
  pickerName?: string;
  pickerRelationship?: string;
  status: 'ACTIVE' | 'ABSENT' | 'WITHDRAWN';
}

export interface CSVParseResult {
  validRows: ParsedStudentRow[];
  errors: string[];
}

export const CSV_TEMPLATE_HEADER = 'nombre_completo,curso,apoderado_nombre,apoderado_whatsapp,retirador_nombre,retirador_parentesco,estado';

export const CSV_TEMPLATE_EXAMPLE = `${CSV_TEMPLATE_HEADER}
Vicente Toro Morales,1° Básico A,Carolina Herrera,+56991112233,Ignacio Herrera,Tío,ACTIVO
Matías Silva Gómez,1° Básico A,Carolina Herrera,+56991112233,Carolina Herrera,Mamá Titular,ACTIVO
Sofía Morales Paz,1° Básico A,Carolina Herrera,+56991112233,Don Pedro Transporte,Furgón Escolar,ACTIVO
Lucas Castro Ruiz,2° Básico B,Pedro Castro,+56988887766,Ignacio Herrera,Tío,ACTIVO
Valentina Soto Miranda,2° Básico B,María Miranda,+56977776655,Don Pedro Transporte,Furgón Escolar,AUSENTE`;

/**
 * Parsea el contenido de un archivo CSV de nómina escolar y valida sus campos obligatorios.
 */
export function parseStudentsCSV(csvText: string): CSVParseResult {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const validRows: ParsedStudentRow[] = [];
  const errors: string[] = [];

  if (lines.length <= 1) {
    return { validRows: [], errors: ['El archivo CSV está vacío o solo contiene la cabecera.'] };
  }

  // Omitir cabecera
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Manejo de comas considerando comillas
    const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));

    if (cols.length < 4) {
      errors.push(`Línea ${i + 1}: Faltan columnas obligatorias (mínimo nombre, curso, apoderado, teléfono).`);
      continue;
    }

    const [
      fullName,
      gradeSection,
      guardianName,
      guardianPhone,
      pickerName = '',
      pickerRelationship = 'Familiar Autorizado',
      rawStatus = 'ACTIVO',
    ] = cols;

    if (!fullName || !gradeSection || !guardianName || !guardianPhone) {
      errors.push(`Línea ${i + 1}: Campos obligatorios vacíos para "${fullName || 'sin nombre'}".`);
      continue;
    }

    let status: 'ACTIVE' | 'ABSENT' | 'WITHDRAWN' = 'ACTIVE';
    const statusUpper = rawStatus.toUpperCase();
    if (statusUpper.includes('AUSEN') || statusUpper === 'ABSENT') {
      status = 'ABSENT';
    } else if (statusUpper.includes('RETIR') || statusUpper === 'WITHDRAWN') {
      status = 'WITHDRAWN';
    }

    validRows.push({
      fullName,
      gradeSection,
      guardianName,
      guardianPhone,
      pickerName: pickerName || undefined,
      pickerRelationship: pickerRelationship || undefined,
      status,
    });
  }

  return { validRows, errors };
}

