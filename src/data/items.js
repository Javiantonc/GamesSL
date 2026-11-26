// Objetos: equipo con rareza y atributos, consumibles y objetos de misión.
export const RARITY = [
  { id: 'comun', name: 'Común', color: '#e6e6e6', mult: 1 },
  { id: 'pococomun', name: 'Poco común', color: '#4bd34b', mult: 1.25 },
  { id: 'raro', name: 'Raro', color: '#3f8fff', mult: 1.55 },
  { id: 'epico', name: 'Épico', color: '#b45cff', mult: 1.9 },
  { id: 'legendario', name: 'Legendario', color: '#ff9a2b', mult: 2.4 },
];
export const SLOTS = {
  arma: { name: 'Arma', icon: '⚔️' },
  cabeza: { name: 'Cabeza', icon: '⛑️' },
  pecho: { name: 'Pecho', icon: '🦺' },
  piernas: { name: 'Piernas', icon: '👖' },
  botas: { name: 'Botas', icon: '🥾' },
  abalorio: { name: 'Abalorio', icon: '💍' },
};
const BASES = {
  arma: { tanque: ['Espada larga', 'Hacha de guerra', 'Espada bastarda'], asesino: ['Daga curva', 'Estilete', 'Cuchilla gemela'], mago: ['Bastón de roble', 'Vara rúnica', 'Bastón astral'], support: ['Maza bendita', 'Cetro solar', 'Martillo de luz'] },
  cabeza: ['Capucha', 'Yelmo', 'Diadema', 'Sombrero', 'Casco'],
  pecho: ['Túnica', 'Coraza', 'Jubón', 'Cota de malla', 'Chaleco'],
  piernas: ['Grebas', 'Calzas', 'Pantalones', 'Faldar'],
  botas: ['Botas', 'Sandalias', 'Escarpes', 'Botines'],
  abalorio: ['Anillo', 'Amuleto', 'Colgante', 'Talismán'],
};
const SUFFIX = {
  poder: ['del Oso', 'de la Fuerza', 'del Toro'],
  agilidad: ['del Halcón', 'del Viento', 'del Zorro'],
  magia: ['del Búho', 'de las Estrellas', 'del Arcano'],
  resistencia: ['de la Tortuga', 'de la Montaña', 'del Roble'],
};
const MAIN_ATTR = { tanque: ['poder', 'resistencia'], asesino: ['agilidad', 'poder'], mago: ['magia', 'resistencia'], support: ['magia', 'resistencia'] };

let uid = 1;
const pick = (a) => a[(Math.random() * a.length) | 0];

export function rollRarity(minR = 0, luck = 0) {
  const r = Math.random() - luck;
  let k = r < 0.01 ? 4 : r < 0.05 ? 3 : r < 0.18 ? 2 : r < 0.45 ? 1 : 0;
  return Math.max(minR, k);
}

/** Genera una pieza de equipo para la clase cls. */
export function makeItem(level, rarity, cls, slot = pick(Object.keys(SLOTS))) {
  const R = RARITY[rarity];
  const main = Math.random() < 0.75 ? MAIN_ATTR[cls][0] : MAIN_ATTR[cls][1];
  const base = slot === 'arma' ? pick(BASES.arma[cls]) : pick(BASES[slot]);
  const budget = (2 + level * 0.9) * R.mult * (slot === 'arma' ? 1.3 : slot === 'pecho' ? 1.1 : 0.85);
  const stats = { [main]: Math.max(1, Math.round(budget * 0.7)) };
  const second = MAIN_ATTR[cls].find((a) => a !== main) || 'resistencia';
  if (rarity >= 1) stats[second] = (stats[second] || 0) + Math.max(1, Math.round(budget * 0.35));
  if (rarity >= 3) stats.agilidad = (stats.agilidad || 0) + Math.round(budget * 0.25);
  const item = {
    uid: uid++, type: 'equip', slot, level, rarity, cls,
    name: `${base} ${pick(SUFFIX[main])}`,
    stats, armor: slot === 'arma' || slot === 'abalorio' ? 0 : Math.round((3 + level * 1.6) * R.mult * (slot === 'pecho' ? 1.4 : 1)),
    forge: 0,
  };
  if (slot === 'arma') item.dmg = Math.round((4 + level * 2.2) * R.mult);
  item.value = Math.round((3 + level * 2) * R.mult * R.mult);
  return item;
}

export const CONSUMABLES = {
  pocion: { name: 'Poción de vida', icon: '🧪', desc: 'Recupera un 40% de la vida.', price: 8, color: '#ff5a5a' },
  eter: { name: 'Poción de maná', icon: '🔷', desc: 'Recupera un 50% del maná (o energía/furia).', price: 8, color: '#5aa0ff' },
  piedra: { name: 'Piedra de hogar', icon: '🏠', desc: 'Te devuelve al pueblo de Albor.', price: 0, color: '#ffd84a' },
};
export const QUEST_ITEMS = {
  piel: { name: 'Piel de jabalí', icon: '🟫' },
  hueso: { name: 'Fragmento de hueso', icon: '🦴' },
  nucleo: { name: 'Núcleo de gólem', icon: '🔶' },
};

export function itemPower(it) {
  if (!it) return 0;
  const f = 1 + (it.forge || 0) * 0.12;
  return Object.values(it.stats).reduce((a, b) => a + b, 0) * f + (it.dmg || 0) * f + (it.armor || 0) * 0.3;
}
export function forgeCost(it) { return Math.round((10 + it.level * 4) * Math.pow(1.45, it.forge || 0)); }
export const FORGE_MAX = 10;
export function sellPrice(it) { return Math.max(1, Math.round((it.value || 2) * (1 + (it.forge || 0) * 0.3))); }
