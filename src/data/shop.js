// ============================================================
//  TIENDA (app de la tablet). Todo se paga con oro 🪙.
//   - Forja: mejora las piezas equipadas (+1 … +15)
//   - Poderes: mejoras permanentes + pergaminos de puntos
//   - Consumibles: pociones y comida
//   - Vender: convierte objetos en oro
// ============================================================
import { RARITIES } from './items.js';

export const START_GOLD = 50;

// ---------- Forja ----------
export const FORGE_MAX = 15;
export const FORGE_STEP = 0.12;            // +12% a todas las estadísticas de la pieza por nivel
export function forgeCost(item) {
  const up = item.upgrade || 0;
  return Math.round(15 * (item.ilvl + 4) * RARITIES[item.rarity].mult * Math.pow(1.28, up));
}

// ---------- Poderes permanentes ----------
// Cada nivel aplica `per` al bono indicado. Coste = base × growth^nivel
export const POWERS = {
  might:     { name: 'Fuerza Bruta', icon: '💥', desc: '+4% de daño',            bonus: 'dmgMult',    per: 0.04,  max: 25, base: 60, growth: 1.3 },
  vitality:  { name: 'Vitalidad',    icon: '❤️', desc: '+5% de vida máxima',     bonus: 'maxHpMult',  per: 0.05,  max: 25, base: 60, growth: 1.3 },
  arcana:    { name: 'Arcano',       icon: '🔮', desc: '+5% de maná máximo',     bonus: 'maxManaMult', per: 0.05, max: 25, base: 50, growth: 1.3 },
  precision: { name: 'Precisión',    icon: '🎯', desc: '+1% de crítico',         bonus: 'critAdd',    per: 1,     max: 20, base: 80, growth: 1.32 },
  bulwark:   { name: 'Baluarte',     icon: '🛡️', desc: '+1,5% reducción de daño', bonus: 'drAdd',     per: 0.015, max: 20, base: 80, growth: 1.32 },
  swiftness: { name: 'Celeridad',    icon: '👟', desc: '+2% de velocidad',       bonus: 'speedMult',  per: 0.02,  max: 15, base: 70, growth: 1.35 },
  wisdom:    { name: 'Sabiduría',    icon: '📚', desc: '+5% de experiencia',     bonus: 'xpMult',     per: 0.05,  max: 20, base: 90, growth: 1.3 },
};
export const powerCost = (p, lvl) => Math.round(p.base * Math.pow(p.growth, lvl));

/** Convierte los niveles de poderes comprados en un objeto de bonos para computeStats. */
export function powersToBonus(powers) {
  const b = {};
  for (const [id, lvl] of Object.entries(powers)) {
    const p = POWERS[id];
    if (!p || !lvl) continue;
    b[p.bonus] = p.bonus.endsWith('Add') ? p.per * lvl : 1 + p.per * lvl;
  }
  return b;
}

// Pergaminos: compran puntos extra (precio creciente según cuántos llevas)
export const SCROLLS = {
  skill: { name: 'Pergamino de Habilidad', icon: '📜', desc: '+1 punto de habilidad', base: 150, growth: 1.25 },
  attr:  { name: 'Tomo de Atributos',      icon: '📘', desc: '+3 puntos de atributo', base: 120, growth: 1.22 },
};

// ---------- Consumibles a la venta ----------
export const SHOP_STOCK = [
  { id: 'potion_hp', price: 25 },
  { id: 'potion_mana', price: 25 },
  { id: 'meat', price: 8 },
  { id: 'berries', price: 4 },
];

// ---------- Precio de venta ----------
export function sellPrice(item) {
  if (item.type === 'equipment') {
    return Math.max(2, Math.round((item.ilvl + 2) * 2 * RARITIES[item.rarity].mult * (1 + (item.upgrade || 0) * 0.3)));
  }
  const unit = item.id === 'frost_crystal' ? 40 : item.id === 'fur' ? 15 : item.type === 'potion' ? 8 : item.type === 'food' ? 2 : 1;
  return unit * (item.qty || 1);
}

/** Oro que suelta un monstruo. */
export function goldDrop(level, elite, boss) {
  const base = 2 + level * 1.6;
  return Math.round(base * (0.7 + Math.random() * 0.6) * (boss ? 25 : elite ? 3 : 1));
}
