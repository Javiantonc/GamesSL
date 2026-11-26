'use strict';
/* =========================================================================
   ARMAS QUE SE CONSIGUEN: forma + material + rareza. Las de rareza alta
   tienen materiales mágicos y brillan. Cada clase solo usa su tipo de arma.
   ========================================================================= */
const RARITY = [
  { id: 'comun', name: 'Común', color: '#e8e2d0', mult: 1, w: 58 },
  { id: 'poco', name: 'Poco común', color: '#7ad85a', mult: 1.3, w: 26 },
  { id: 'raro', name: 'Rara', color: '#5aa0ff', mult: 1.7, w: 11 },
  { id: 'epico', name: 'Épica', color: '#c070ff', mult: 2.2, w: 4 },
  { id: 'legend', name: 'Legendaria', color: '#ffa53a', mult: 3, w: 1 },
];
const WEAPON_OF = { picaro: 'dagger', brujo: 'dagger', mago: 'staff', paladin: 'mace', guerrero: 'axe' };
const SHAPES = {
  dagger: { recta: 'Daga', curva: 'Daga curva', llama: 'Daga ondulada', cristal: 'Estilete' },
  staff: { orbe: 'Bastón', cristal: 'Báculo de cristal', llama: 'Cetro llameante', luna: 'Báculo lunar' },
  mace: { bola: 'Maza', estrella: 'Lucero del alba', martillo: 'Martillo de guerra' },
  axe: { simple: 'Hacha', doble: 'Hacha doble', luna: 'Gran hacha' },
};
const MAT_BY_RARITY = [['acero', 'bronce'], ['acero', 'bronce', 'oro'], ['oro', 'cristal', 'veneno'], ['cristal', 'fuego', 'sombra', 'veneno'], ['fuego', 'sombra', 'cristal']];
const LEGEND_NAMES = { dagger: ['Colmillo del Alba', 'Susurro Eterno'], staff: ['Vara de los Mil Soles', 'Báculo del Eclipse'], mace: ['Juicio Radiante', 'Martillo del Amanecer'], axe: ['Devoradora de Montañas', 'Furia del Norte'] };
let wid = 1;
function rollRarity(bonus = 0) {
  let r = Math.random() * 100 - bonus;
  for (let i = RARITY.length - 1; i >= 0; i--) { const sum = RARITY.slice(i).reduce((a, b) => a + b.w, 0); if (r < sum) return i; }
  return 0;
}
/** Crea un arma para la clase cls, de nivel lvl y rareza r (índice). */
function makeWeapon(cls, lvl, r = rollRarity()) {
  const kind = WEAPON_OF[cls];
  const shapes = Object.keys(SHAPES[kind]);
  const shape = r === 0 ? shapes[0] : shapes[(Math.random() * shapes.length) | 0];
  const mats = MAT_BY_RARITY[r], mat = mats[(Math.random() * mats.length) | 0];
  const R = RARITY[r];
  const name = r === 4 ? LEGEND_NAMES[kind][(Math.random() * 2) | 0] : `${SHAPES[kind][shape]} ${MATS[mat].name}`;
  return { id: wid++, kind, shape, mat, glow: r >= 3, rarity: r, lvl, name, dmg: Math.round((3 + lvl * 1.6) * R.mult) };
}
function starterWeapon(cls) {
  const w = makeWeapon(cls, 1, 0); w.dmg = 2;
  w.name = { picaro: 'Daga de aprendiz', brujo: 'Daga ritual', mago: 'Bastón de roble', paladin: 'Maza de novicio', guerrero: 'Hacha de leñador' }[cls];
  return w;
}
/** Icono del arma (canvas) para la bolsa. */
const iconCache = new Map();
function weaponIcon(w) {
  const key = `${w.kind}${w.shape}${w.mat}${w.glow}`;
  if (iconCache.has(key)) return iconCache.get(key);
  const c = document.createElement('canvas'); c.width = 96; c.height = 96;
  X = c.getContext('2d'); X.lineJoin = 'round'; X.lineCap = 'round';
  const h = { dagger: 34, staff: 90, mace: 38, axe: 50 }[w.kind] || 50;
  const s = Math.min(2.8, 112 / h);
  X.translate(48, 50); X.rotate(0.72); X.scale(s, s); X.translate(0, h / 2 - 4);
  weapon(w.kind, w);
  iconCache.set(key, c);
  return c;
}
