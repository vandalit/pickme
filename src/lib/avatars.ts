// Animal + Color public code system for PickMe
// Each student in a classroom gets a unique Animal+Color combination

export const ANIMALS = [
  { id: 'cocodrilo', name: 'Cocodrilo', emoji: '🐊' },
  { id: 'osito',     name: 'Osito',     emoji: '🐻' },
  { id: 'pinguino',  name: 'Pingüino',  emoji: '🐧' },
  { id: 'zorro',     name: 'Zorro',     emoji: '🦊' },
  { id: 'leon',      name: 'León',      emoji: '🦁' },
  { id: 'delfin',    name: 'Delfín',    emoji: '🐬' },
  { id: 'elefante',  name: 'Elefante',  emoji: '🐘' },
  { id: 'loro',      name: 'Loro',      emoji: '🦜' },
  { id: 'ballena',   name: 'Ballena',   emoji: '🐳' },
  { id: 'buho',      name: 'Búho',      emoji: '🦉' },
  { id: 'panda',     name: 'Panda',     emoji: '🐼' },
  { id: 'tigre',     name: 'Tigre',     emoji: '🐯' },
  { id: 'jirafa',    name: 'Jirafa',    emoji: '🦒' },
  { id: 'koala',     name: 'Koala',     emoji: '🐨' },
  { id: 'pulpo',     name: 'Pulpo',     emoji: '🐙' },
  { id: 'unicornio', name: 'Unicornio', emoji: '🦄' },
  { id: 'dragon',    name: 'Dragón',    emoji: '🐲' },
  { id: 'cangrejo',  name: 'Cangrejo',  emoji: '🦀' },
  { id: 'mariposa',  name: 'Mariposa',  emoji: '🦋' },
  { id: 'erizo',     name: 'Erizo',     emoji: '🦔' },
] as const;

export const COLORS = [
  { id: 'amarillo', name: 'Amarillo', hex: '#FBBF24' },
  { id: 'azul',     name: 'Azul',     hex: '#3B82F6' },
  { id: 'verde',    name: 'Verde',    hex: '#10B981' },
  { id: 'rojo',     name: 'Rojo',     hex: '#EF4444' },
  { id: 'naranja',  name: 'Naranja',  hex: '#F97316' },
  { id: 'morado',   name: 'Morado',   hex: '#8B5CF6' },
  { id: 'rosado',   name: 'Rosado',   hex: '#EC4899' },
  { id: 'celeste',  name: 'Celeste',  hex: '#06B6D4' },
  { id: 'lima',     name: 'Lima',     hex: '#84CC16' },
  { id: 'cafe',     name: 'Café',     hex: '#D97706' },
] as const;

export type AnimalId = typeof ANIMALS[number]['id'];
export type ColorId  = typeof COLORS[number]['id'];

export function getAnimal(id: AnimalId) {
  return ANIMALS.find(a => a.id === id)!;
}

export function getColor(id: ColorId) {
  return COLORS.find(c => c.id === id)!;
}

export function getPublicLabel(animalId: AnimalId, colorId: ColorId): string {
  const animal = getAnimal(animalId);
  const color  = getColor(colorId);
  return `${animal.name} ${color.name}`;
}
