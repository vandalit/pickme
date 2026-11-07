const { describe, it } = require('node:test');
const assert = require('node:assert');
const { assignNextAvailableAvatar } = require('../../dist/lib/avatarAssigner');
const { ANIMALS, COLORS } = require('../../dist/lib/avatars');

describe('Algoritmo de Asignación de Avatares (avatarAssigner)', () => {
  it('Debe asignar el primer avatar disponible (Cocodrilo Amarillo) si el curso está vacío', () => {
    const avatar = assignNextAvailableAvatar([]);
    assert.strictEqual(avatar.animalId, 'cocodrilo');
    assert.strictEqual(avatar.colorId, 'amarillo');
    assert.strictEqual(avatar.publicLabel, 'Cocodrilo Amarillo');
  });

  it('Debe saltar avatares ya utilizados y seleccionar el siguiente libre', () => {
    const existing = [
      { animalId: 'cocodrilo', colorId: 'amarillo' },
      { animalId: 'cocodrilo', colorId: 'azul' },
    ];
    const avatar = assignNextAvailableAvatar(existing);
    assert.strictEqual(avatar.animalId, 'cocodrilo');
    assert.strictEqual(avatar.colorId, 'verde');
    assert.strictEqual(avatar.publicLabel, 'Cocodrilo Verde');
  });

  it('Garantiza CERO COLISIONES en 200 asignaciones consecutivas en la misma sala', () => {
    const allocated = [];
    const maxCapacity = ANIMALS.length * COLORS.length; // 20 * 10 = 200
    assert.strictEqual(maxCapacity, 200);

    for (let i = 0; i < maxCapacity; i++) {
      const nextAvatar = assignNextAvailableAvatar(allocated);
      const key = `${nextAvatar.animalId}::${nextAvatar.colorId}`;
      assert.strictEqual(
        allocated.some(a => `${a.animalId}::${a.colorId}` === key),
        false,
        `Colisión detectada en la iteración ${i + 1} con clave ${key}`
      );
      allocated.push({ animalId: nextAvatar.animalId, colorId: nextAvatar.colorId });
    }

    const uniqueKeys = new Set(allocated.map(a => `${a.animalId}::${a.colorId}`));
    assert.strictEqual(uniqueKeys.size, 200, 'Deben existir exactamente 200 combinaciones únicas');
  });

  it('Debe retornar un fallback seguro si se excede la capacidad de 200 alumnos', () => {
    const all200 = [];
    for (const a of ANIMALS) {
      for (const c of COLORS) {
        all200.push({ animalId: a.id, colorId: c.id });
      }
    }
    const fallback = assignNextAvailableAvatar(all200);
    assert.strictEqual(fallback.animalId, ANIMALS[0].id);
    assert.strictEqual(fallback.colorId, COLORS[0].id);
  });
});

