// ============================================================
//  OBJETOS: rarezas, ranuras de equipo, generador de equipo
//  aleatorio y consumibles/materiales apilables.
// ============================================================

export const RARITIES = {
  common:    { name: 'Común',      color: '#e8e8e8', hex: 0xe8e8e8, mult: 1.0,  weight: 55 },
  uncommon:  { name: 'Poco común', color: '#1eff00', hex: 0x1eff00, mult: 1.35, weight: 28 },
  rare:      { name: 'Raro',       color: '#2e8bff', hex: 0x2e8bff, mult: 1.75, weight: 12 },
  epic:      { name: 'Épico',      color: '#b04dff', hex: 0xb04dff, mult: 2.3,  weight: 4 },
  legendary: { name: 'Legendario', color: '#ff8000', hex: 0xff8000, mult: 3.0,  weight: 1 },
};
export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

// mult = peso de presupuesto de estadísticas de la ranura. armor = si da armadura.
export const SLOTS = {
  head:      { name: 'Cabeza',    icon: '🪖', mult: 1.0,  armor: true },
  neck:      { name: 'Cuello',    icon: '📿', mult: 0.55, armor: false },
  shoulders: { name: 'Hombros',   icon: '🧣', mult: 0.75, armor: true },
  chest:     { name: 'Pecho',     icon: '🥋', mult: 1.0,  armor: true },
  hands:     { name: 'Manos',     icon: '🧤', mult: 0.7,  armor: true },
  legs:      { name: 'Piernas',   icon: '👖', mult: 0.9,  armor: true },
  feet:      { name: 'Pies',      icon: '🥾', mult: 0.7,  armor: true },
  ring:      { name: 'Anillo',    icon: '💍', mult: 0.55, armor: false },
  weapon:    { name: 'Arma',      icon: '🗡️', mult: 1.0,  armor: false },
  offhand:   { name: 'Mano izq.', icon: '🛡️', mult: 0.6,  armor: true },
};

export const STAT_NAMES = {
  stamina: 'Resistencia',
  strength: 'Poder',
  intellect: 'Magia',
  agility: 'Agilidad',
  armor: 'Armadura',
  weaponDmg: 'Daño de arma',
};

const BASE_NAMES = {
  head: ['Yelmo', 'Capucha', 'Casco', 'Diadema'],
  neck: ['Amuleto', 'Colgante', 'Talismán'],
  shoulders: ['Hombreras', 'Espaldares', 'Manto'],
  chest: ['Coraza', 'Túnica', 'Peto', 'Jubón'],
  hands: ['Guanteletes', 'Guantes', 'Manoplas'],
  legs: ['Grebas', 'Calzas', 'Pantalones'],
  feet: ['Botas', 'Sandalias', 'Escarpes'],
  ring: ['Anillo', 'Sortija', 'Sello'],
  weapon: ['Espada', 'Hacha', 'Bastón', 'Maza', 'Daga'],
  offhand: ['Escudo', 'Broquel', 'Orbe'],
};
const WEAPON_ICONS = { Espada: '🗡️', Hacha: '🪓', Bastón: '🪄', Maza: '🔨', Daga: '🔪', Orbe: '🔮' };

// El sufijo decide en qué estadísticas se reparte el presupuesto (estilo WoW clásico)
const SUFFIXES = [
  { name: 'del Oso',      stats: { stamina: 0.5, strength: 0.5 } },
  { name: 'del Águila',   stats: { stamina: 0.5, intellect: 0.5 } },
  { name: 'del Tigre',    stats: { strength: 0.5, agility: 0.5 } },
  { name: 'del Búho',     stats: { intellect: 0.7, stamina: 0.3 } },
  { name: 'del Mono',     stats: { agility: 0.6, stamina: 0.4 } },
  { name: 'del Gorila',   stats: { strength: 0.6, intellect: 0.4 } },
  { name: 'de la Ballena', stats: { stamina: 1.0 } },
];
const LEGENDARY_SUFFIXES = ['del Alba Carmesí', 'de la Tormenta Eterna', 'de Valtor el Eterno', 'del Primer Dragón'];

let uidCounter = 1;
export const uid = () => `it${Date.now().toString(36)}${(uidCounter++).toString(36)}`;
const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

/** Tira una rareza ponderada. minRarity permite garantizar un mínimo (élites). */
export function rollRarity(rng = Math.random, minRarity = 'common') {
  const pool = RARITY_ORDER.slice(RARITY_ORDER.indexOf(minRarity));
  const total = pool.reduce((s, r) => s + RARITIES[r].weight, 0);
  let roll = rng() * total;
  for (const r of pool) {
    roll -= RARITIES[r].weight;
    if (roll <= 0) return r;
  }
  return pool[0];
}

/**
 * Genera una pieza de equipo aleatoria.
 * @param {number} ilvl  nivel de objeto (normalmente = nivel del monstruo)
 */
export function generateItem(ilvl, rng = Math.random, opts = {}) {
  const slot = opts.slot || pick(Object.keys(SLOTS), rng);
  const rarity = opts.rarity || rollRarity(rng, opts.minRarity);
  const R = RARITIES[rarity];
  const S = SLOTS[slot];
  const base = pick(BASE_NAMES[slot], rng);
  const suffix = pick(SUFFIXES, rng);

  const budget = Math.max(1, Math.round((3 + ilvl * 1.5) * S.mult * R.mult));
  const stats = {};
  for (const [k, w] of Object.entries(suffix.stats)) stats[k] = Math.max(1, Math.round(budget * w));
  if (S.armor) stats.armor = Math.round((ilvl * 3 + 5) * S.mult * (0.8 + R.mult * 0.4));
  if (slot === 'weapon') stats.weaponDmg = Math.round((2 + ilvl * 1.2) * R.mult);

  const name = rarity === 'legendary' ? `${base} ${pick(LEGENDARY_SUFFIXES, rng)}` : `${base} ${suffix.name}`;
  return {
    uid: uid(),
    id: `gear_${slot}`,
    type: 'equipment',
    name,
    slot,
    rarity,
    ilvl,
    reqLevel: Math.min(80, Math.max(1, ilvl - 2)),   // el Bosque Invernal da ilvl > 80 equipable a nivel 80
    icon: WEAPON_ICONS[base] || S.icon,
    stats,
    maxStack: 1,
    qty: 1,
  };
}

export function starterWeapon() {
  return {
    uid: uid(), id: 'starter_sword', type: 'equipment', name: 'Espada de entrenamiento',
    slot: 'weapon', rarity: 'common', ilvl: 1, reqLevel: 1, icon: '🗡️',
    stats: { strength: 1, weaponDmg: 3 }, maxStack: 1, qty: 1,
  };
}

// ---------- Consumibles y materiales (apilables) ----------
export const CONSUMABLES = {
  meat:        { name: 'Carne de lobo',      icon: '🍖', type: 'food',     hunger: 35, heal: 15, maxStack: 20, desc: 'Restaura 35 de hambre y 15 de vida.' },
  berries:     { name: 'Bayas silvestres',   icon: '🍓', type: 'food',     hunger: 15, heal: 5,  maxStack: 20, desc: 'Restaura 15 de hambre.' },
  potion_hp:   { name: 'Poción de sanación', icon: '🧪', type: 'potion',   healPct: 0.4, maxStack: 10, rarity: 'uncommon', desc: 'Restaura el 40% de tu vida.' },
  potion_mana: { name: 'Poción de maná',     icon: '💧', type: 'potion',   manaPct: 0.5, maxStack: 10, rarity: 'uncommon', desc: 'Restaura el 50% de tu maná.' },
  wood:        { name: 'Madera',             icon: '🪵', type: 'material', maxStack: 50, desc: 'Material de construcción y artesanía.' },
  gel:         { name: 'Gelatina de limo',   icon: '🟢', type: 'material', maxStack: 50, desc: 'Pegajosa. Útil para alquimia.' },
  bone:        { name: 'Hueso antiguo',      icon: '🦴', type: 'material', maxStack: 50, desc: 'Cruje un poco.' },
  cloth:       { name: 'Tela de lino',       icon: '🧶', type: 'material', maxStack: 50, desc: 'Sirve para sastrería.' },
  fur:         { name: 'Piel de oso polar',  icon: '🐾', type: 'material', maxStack: 50, desc: 'Gruesa y cálida. Muy valiosa.' },
  frost_crystal: { name: 'Cristal de escarcha', icon: '🧊', type: 'material', maxStack: 50, rarity: 'rare', desc: 'Frío al tacto. Solo se encuentra en el Bosque Invernal.' },
};

export function createStack(id, qty = 1) {
  const d = CONSUMABLES[id];
  return { uid: uid(), id, ...d, rarity: d.rarity || 'common', qty };
}
