import { generateItem, createStack } from '../data/items.js';

/**
 * Tabla de botín. Función pura: dado un monstruo, devuelve los objetos que suelta.
 *  - Equipo aleatorio equipable (22%; élites siempre, mínimo Raro)
 *  - Materiales propios del monstruo
 *  - Pociones ocasionales
 */
export function rollLoot(def, level, elite, rng = Math.random, opts = {}) {
  const out = [];
  if (opts.boss) {
    // Jefe de mazmorra: 3 piezas, la primera con rareza mínima garantizada por el color de la mazmorra
    out.push(generateItem(level + 1, rng, { minRarity: opts.bossRarity || 'rare' }));
    out.push(generateItem(level, rng, { minRarity: opts.minRarity || 'uncommon' }));
    out.push(generateItem(level, rng, { minRarity: opts.minRarity || 'uncommon' }));
    out.push(createStack('potion_hp', 2));
    return out;
  }
  if (opts.minRarity) {
    // Monstruo de mazmorra: más probabilidad de equipo y rareza mínima según el color
    if (rng() < (elite ? 1 : 0.55)) out.push(generateItem(level, rng, { minRarity: opts.minRarity }));
  } else if (elite) {
    out.push(generateItem(level + 1, rng, { minRarity: 'rare' }));
    if (rng() < 0.5) out.push(generateItem(level, rng, { minRarity: 'uncommon' }));
  } else if (rng() < 0.22) {
    out.push(generateItem(level, rng));
  }
  for (const id of def.loot) {
    if (rng() < 0.5) out.push(createStack(id, 1 + Math.floor(rng() * 2)));
  }
  if (rng() < 0.1) out.push(createStack(rng() < 0.6 ? 'potion_hp' : 'potion_mana', 1));
  return out;
}
