'use strict';
/* =========================================================================
   ARMAS QUE SE CONSIGUEN: forma + material + rareza. Las de rareza alta
   tienen materiales mágicos y brillan. Cada clase solo usa su tipo de arma.
   ========================================================================= */
const RARITY = [
  { id: 'comun', name: 'Común', color: '#a8a8a8', mult: 1, w: 58 },
  { id: 'poco', name: 'Poco común', color: '#4ee44e', mult: 1.3, w: 26 },
  { id: 'raro', name: 'Rara', color: '#3d9bff', mult: 1.7, w: 11 },
  { id: 'epico', name: 'Épica', color: '#b45cff', mult: 2.2, w: 4 },
  { id: 'legend', name: 'Legendaria', color: '#ff9a1f', mult: 3, w: 0.85 },
  { id: 'ultra', name: 'Ultralegendaria', color: '#ff3d6e', mult: 4, w: 0.15 },
];
/** Color de la estela según la rareza (la ultralegendaria cambia de color sin parar). */
const trailColor = (r, t = 0) => (r >= 5 ? `hsl(${(t * 140) % 360}, 100%, 62%)` : RARITY[r].color);
const ULTRA_TITLES = ['del Fin de los Tiempos', 'de la Estrella Caída', 'del Dios Dormido', 'del Primer Amanecer', 'del Vacío Eterno'];
const WEAPON_OF = { picaro: 'dagger', brujo: 'dagger', mago: 'staff', paladin: 'mace', guerrero: 'axe', cazador: 'bow' };
const MAIN_KINDS = { cazador: ['bow', 'rifle', 'crossbow'] };
const mainKinds = (cls) => MAIN_KINDS[cls] || [WEAPON_OF[cls]];
/* Clases a distancia: llevan además un arma secundaria cuerpo a cuerpo */
const SECONDARY = { cazador: ['sword', 'dagger'], mago: ['sword'], brujo: ['sword'] };
const SHAPES = {
  dagger: { recta: 'Daga', curva: 'Daga curva', llama: 'Daga ondulada', cristal: 'Estilete' },
  staff: { orbe: 'Bastón', cristal: 'Báculo de cristal', llama: 'Cetro llameante', luna: 'Báculo lunar' },
  mace: { bola: 'Maza', estrella: 'Lucero del alba', martillo: 'Martillo de guerra' },
  axe: { simple: 'Hacha', doble: 'Hacha doble', luna: 'Gran hacha' },
  bow: { recurvo: 'Arco recurvo', largo: 'Arco largo', corto: 'Arco corto' },
  rifle: { mecha: 'Fusil de mecha', largo: 'Fusil largo', trabuco: 'Trabuco' },
  crossbow: { ligera: 'Ballesta ligera', pesada: 'Ballesta pesada' },
  sword: { recta: 'Espada', ancha: 'Espada ancha', curva: 'Cimitarra' },
};
const MAT_BY_RARITY = [['acero', 'bronce'], ['acero', 'bronce', 'oro'], ['oro', 'cristal', 'veneno'], ['cristal', 'fuego', 'sombra', 'veneno'], ['fuego', 'sombra', 'cristal'], ['fuego', 'sombra', 'cristal']];
const LEGEND_NAMES = { dagger: ['Colmillo del Alba', 'Susurro Eterno'], staff: ['Vara de los Mil Soles', 'Báculo del Eclipse'], mace: ['Juicio Radiante', 'Martillo del Amanecer'], axe: ['Devoradora de Montañas', 'Furia del Norte'], bow: ['Susurro del Viento', 'Arco del Ocaso'], rifle: ['Trueno de Picoférreo', 'Rugido del Dragón'], crossbow: ['Aguijón Celeste', 'Ballesta del Juicio'], sword: ['Hoja del Amanecer', 'Filo de las Estrellas'] };
let wid = 1;
function rollRarity(bonus = 0) {
  let r = Math.random() * 100 - bonus;
  for (let i = RARITY.length - 1; i >= 0; i--) { const sum = RARITY.slice(i).reduce((a, b) => a + b.w, 0); if (r < sum) return i; }
  return 0;
}
/** Crea un arma para la clase cls, de nivel lvl y rareza r (índice). */
function makeWeapon(cls, lvl, r = rollRarity(), kindOverride) {
  const ks = mainKinds(cls), kind = kindOverride || ks[(Math.random() * ks.length) | 0];
  const shapes = Object.keys(SHAPES[kind]);
  const shape = r === 0 ? shapes[0] : shapes[(Math.random() * shapes.length) | 0];
  const mats = MAT_BY_RARITY[r], mat = mats[(Math.random() * mats.length) | 0];
  const R = RARITY[r];
  const name = r >= 5 ? `${SHAPES[kind][shape]} ${ULTRA_TITLES[(Math.random() * ULTRA_TITLES.length) | 0]}` : r === 4 ? LEGEND_NAMES[kind][(Math.random() * 2) | 0] : `${SHAPES[kind][shape]} ${MATS[mat].name}`;
  return { id: wid++, kind, shape, mat, glow: r >= 3, rarity: r, lvl, name, dmg: Math.round((3 + lvl * 1.6) * R.mult) };
}
function starterWeapon(cls) {
  const w = makeWeapon(cls, 1, 0); w.dmg = 2;
  if (cls === 'cazador') { Object.assign(w, makeWeapon(cls, 1, 0, 'bow')); w.dmg = 2; }
  w.name = { picaro: 'Daga de aprendiz', brujo: 'Daga ritual', mago: 'Bastón de roble', paladin: 'Maza de novicio', guerrero: 'Hacha de leñador', cazador: 'Arco de cazador' }[cls];
  return w;
}
/** Arma secundaria cuerpo a cuerpo para las clases a distancia. */
function makeSecondary(cls, lvl, r = rollRarity()) {
  const ks = SECONDARY[cls] || ['sword'], w = makeWeapon(cls, lvl, r, ks[(Math.random() * ks.length) | 0]);
  w.dmg = Math.max(1, Math.round(w.dmg * 0.85)); w.second = true;
  return w;
}
/** Icono del arma (canvas) para la bolsa. */
const iconCache = new Map();
function weaponIcon(w) {
  const key = `${w.kind}${w.shape}${w.mat}${w.glow}`;
  if (iconCache.has(key)) return iconCache.get(key);
  const c = document.createElement('canvas'); c.width = 96; c.height = 96;
  X = c.getContext('2d'); X.lineJoin = 'round'; X.lineCap = 'round';
  const h = { dagger: 34, staff: 90, mace: 38, axe: 50, bow: 84, rifle: 62, crossbow: 72, sword: 50 }[w.kind] || 50;
  const s = Math.min(2.8, 112 / h);
  X.translate(48, 50); X.rotate(0.72); X.scale(s, s); X.translate(w.kind === 'bow' ? -4 : 0, w.kind === 'bow' ? 0 : h / 2 - 4);
  weapon(w.kind, w);
  iconCache.set(key, c);
  return c;
}
