import { ANIMALS, COLORS, AnimalId, ColorId } from './avatars';

export interface AssignedAvatar {
  animalId: AnimalId;
  colorId: ColorId;
  publicLabel: string;
}

/**
 * Genera y asigna el siguiente avatar anónimo disponible para un curso,
 * garantizando cero colisiones (nunca habrá dos alumnos con el mismo animal+color en la misma sala).
 * Capacidad máxima por sala: 200 combinaciones únicas (20 animales × 10 colores).
 */
export function assignNextAvailableAvatar(
  existingAvatars: Array<{ animalId: string; colorId: string }>
): AssignedAvatar {
  const usedKeys = new Set(
    existingAvatars.map((a) => `${a.animalId.toLowerCase()}::${a.colorId.toLowerCase()}`)
  );

  // Iterar por todos los animales y colores hasta hallar el primer par disponible
  for (const animal of ANIMALS) {
    for (const color of COLORS) {
      const key = `${animal.id}::${color.id}`;
      if (!usedKeys.has(key)) {
        return {
          animalId: animal.id,
          colorId: color.id,
          publicLabel: `${animal.name} ${color.name}`,
        };
      }
    }
  }

  // Fallback de contingencia si un curso excede 200 alumnos
  const fallbackAnimal = ANIMALS[0].id;
  const fallbackColor = COLORS[0].id;
  return {
    animalId: fallbackAnimal,
    colorId: fallbackColor,
    publicLabel: `${ANIMALS[0].name} ${COLORS[0].name}`,
  };
}

