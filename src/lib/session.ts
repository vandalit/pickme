import type { AnimalId, ColorId } from './avatars';

export type StudentStatus = 'waiting' | 'in_process' | 'picked_up';

export interface Student {
  id: string;
  animalId: AnimalId;
  colorId: ColorId;
  status: StudentStatus;
  grade: string;
}

export interface Session {
  id: string;
  date: string;
  time: string;
  school: string;
  sessionCode: string;
  isActive: boolean;
  students: Student[];
}

// Mock session — will be replaced by DB + API in next iteration
export const MOCK_SESSION: Session = {
  id: 'session-demo-001',
  date: 'Martes 28 Oct',
  time: '14:30',
  school: 'Escuela Primaria San Martín',
  sessionCode: 'K7-4X2',
  isActive: true,
  students: [
    { id: 's1',  animalId: 'cocodrilo', colorId: 'amarillo', status: 'waiting',    grade: '1°A' },
    { id: 's2',  animalId: 'osito',     colorId: 'azul',     status: 'in_process', grade: '1°A' },
    { id: 's3',  animalId: 'pinguino',  colorId: 'verde',    status: 'waiting',    grade: '1°A' },
    { id: 's4',  animalId: 'zorro',     colorId: 'rojo',     status: 'picked_up',  grade: '1°A' },
    { id: 's5',  animalId: 'leon',      colorId: 'naranja',  status: 'waiting',    grade: '1°A' },
    { id: 's6',  animalId: 'delfin',    colorId: 'celeste',  status: 'waiting',    grade: '2°B' },
    { id: 's7',  animalId: 'elefante',  colorId: 'morado',   status: 'waiting',    grade: '2°B' },
    { id: 's8',  animalId: 'loro',      colorId: 'cafe',     status: 'picked_up',  grade: '2°B' },
    { id: 's9',  animalId: 'ballena',   colorId: 'azul',     status: 'waiting',    grade: '2°B' },
    { id: 's10', animalId: 'buho',      colorId: 'verde',    status: 'waiting',    grade: '2°B' },
    { id: 's11', animalId: 'panda',     colorId: 'rojo',     status: 'waiting',    grade: '3°C' },
    { id: 's12', animalId: 'tigre',     colorId: 'naranja',  status: 'in_process', grade: '3°C' },
    { id: 's13', animalId: 'jirafa',    colorId: 'amarillo', status: 'picked_up',  grade: '3°C' },
    { id: 's14', animalId: 'koala',     colorId: 'lima',     status: 'waiting',    grade: '3°C' },
    { id: 's15', animalId: 'pulpo',     colorId: 'morado',   status: 'waiting',    grade: '3°C' },
    { id: 's16', animalId: 'unicornio', colorId: 'rosado',   status: 'waiting',    grade: '4°D' },
    { id: 's17', animalId: 'dragon',    colorId: 'lima',     status: 'waiting',    grade: '4°D' },
    { id: 's18', animalId: 'cangrejo',  colorId: 'rojo',     status: 'waiting',    grade: '4°D' },
    { id: 's19', animalId: 'mariposa',  colorId: 'celeste',  status: 'picked_up',  grade: '4°D' },
    { id: 's20', animalId: 'erizo',     colorId: 'cafe',     status: 'waiting',    grade: '4°D' },
  ],
};
