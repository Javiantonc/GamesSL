import { ATTR_PER_POINT } from '../data/classes.js';
import { powersToBonus } from '../data/shop.js';

/**
 * Estadísticas = base por nivel + puntos asignados + equipo, × modificadores
 * de clase, + bonos de clase y de efectos temporales (buffs).
 * Mantener esta función PURA facilita balancear y testear.
 */
export function baseStatsForLevel(level) {
  return {
    stamina: 8 + level * 2,
    strength: 6 + level * 2,
    intellect: 6 + level * 2,
    agility: 4 + level,
    armor: 0,
    weaponDmg: 0,
  };
}

export function computeStats(level, equipment, { allocated = {}, cls = null, buffs = [], powers = {} } = {}) {
  const s = baseStatsForLevel(level);
  for (const [k, v] of Object.entries(allocated)) s[k] += v * ATTR_PER_POINT;
  for (const [k, v] of Object.entries(equipment.totals())) s[k] = (s[k] || 0) + v;
  if (cls) for (const [k, m] of Object.entries(cls.mods)) s[k] = Math.round(s[k] * m);

  // Bonos combinados (clase + buffs activos)
  const b = { critAdd: 0, drAdd: 0, dmgMult: 1, speedMult: 1, regenMult: 1, healMult: 1,
    spellPowerMult: 1, maxManaMult: 1, armorMult: 1, armorAdd: 0, manaRegenMult: 1, maxHpMult: 1, xpMult: 1 };
  for (const src of [cls?.bonus, powersToBonus(powers), ...buffs]) {
    if (!src) continue;
    for (const [k, v] of Object.entries(src)) {
      if (!(k in b)) continue;
      if (k.endsWith('Add')) b[k] += v; else b[k] *= v;
    }
  }

  s.armor = Math.round(s.armor * b.armorMult + b.armorAdd);
  s.maxHp = Math.round((40 + s.stamina * 10) * b.maxHpMult);
  s.maxMana = Math.round((30 + s.intellect * 8) * b.maxManaMult);
  s.attackPower = Math.round(s.strength * 1.2 + s.agility * 0.5);
  s.spellPower = Math.round(s.intellect * 1.1 * b.spellPowerMult);
  s.crit = +(5 + s.agility * 0.15 + b.critAdd).toFixed(1);
  s.damageReduction = +Math.min(0.85, s.armor / (s.armor + 80 + level * 15) + b.drAdd).toFixed(3);
  s.manaRegen = +((1.5 + s.intellect * 0.06) * b.manaRegenMult).toFixed(2);
  s.damageMult = b.dmgMult;
  s.healMult = b.healMult;
  s.speedMult = b.speedMult;
  s.regenMult = b.regenMult;
  s.xpMult = b.xpMult;
  s.ilvl = equipment.averageItemLevel();
  return s;
}

// Etiquetas que muestra la hoja de personaje (clave -> [nombre, formateador])
export const DISPLAY_STATS = [
  ['maxHp', 'Vida máxima', (v) => v],
  ['maxMana', 'Maná máximo', (v) => v],
  ['strength', 'Poder', (v) => v],
  ['stamina', 'Resistencia', (v) => v],
  ['agility', 'Agilidad', (v) => v],
  ['intellect', 'Magia', (v) => v],
  ['armor', 'Armadura', (v) => v],
  ['weaponDmg', 'Daño de arma', (v) => v],
  ['attackPower', 'Poder de ataque', (v) => v],
  ['spellPower', 'Poder hechizos', (v) => v],
  ['crit', 'Prob. de crítico', (v) => `${v}%`],
  ['damageReduction', 'Reducción daño', (v) => `${(v * 100).toFixed(1)}%`],
  ['ilvl', 'Nivel obj. medio', (v) => v],
];
