import { RARITIES } from '../data/items.js';
import { lighten } from '../data/dungeons.js';

// ============================================================
//  PERSONAJE JUGADOR: arte chibi original, distinto por clase.
//  Se dibuja a DOBLE resolución (más detalle) y se muestra a 0,5.
//
//  Capas (de atrás a delante):
//   off(detrás) · bota izq · bota dcha · cuerpo · adornos · off(delante)
//   · arma · cabeza · parpadeo · tocado
//  "adornos", "tocado", arma y escudo se dibujan en tonos claros y se
//  TIÑEN: con el color de la clase o, si llevas una pieza equipada de
//  rareza poco común o superior, con el color de esa rareza.
// ============================================================

export const RES = 2;                 // resolución de las texturas
const OUT = '#24170f';
const SKIN = '#ffdcc0';
const SKIN_SH = '#f0b596';
const HW = 64, HH = 80, CX = 32, CY = 54;   // lienzo de cabeza/tocado y centro de la cara
const BW = 48, BH = 36;                     // lienzo del cuerpo (centro 24,18)

/** Apariencia de cada clase: colores por defecto de las capas teñibles y armas. */
export const LOOKS = {
  base:     { eye: '#4a7bd1', trim: 0xe0b85a, hat: 0xd0d0d8, hatOnlyWithItem: true, weapon: 'w_sword', wAngle: 10 },
  assassin: { eye: '#35b874', trim: 0xc3ccd6, hat: 0x3a7d5c, weapon: 'w_dagger', wAngle: 25, off: 'w_dagger', offAngle: -150, offFlip: true },
  mage:     { eye: '#4b8dff', trim: 0xffcf4d, hat: 0x5560e0, weapon: 'w_staff', wAngle: 4, wOrigin: 0.72 },
  tank:     { eye: '#8a5a2b', trim: 0xc9d1e0, hat: 0xc9d1e0, weapon: 'w_sword', wAngle: 12, off: 'w_shield', offTint: 0x5a8be0, offFront: true },
  support:  { eye: '#d99a1a', trim: 0xffd34d, hat: 0xffe28a, weapon: 'w_sun', wAngle: 4, wOrigin: 0.72 },
};

const tintFor = (item, def) => (item && item.rarity !== 'common' ? lighten(RARITIES[item.rarity].hex, 0.2) : def);

/**
 * Lista de capas del personaje según su clase y equipo.
 * La usan tanto el sprite del juego (Player) como los retratos de la UI.
 * Coordenadas en píxeles "normales", relativas a los pies.
 */
export function characterLayers(state) {
  const cls = state.classId || 'base';
  const L = LOOKS[cls];
  const eq = state.equipment.slots;
  const wTint = eq.weapon && eq.weapon.rarity !== 'common' ? lighten(RARITIES[eq.weapon.rarity].hex, 0.25) : 0xffffff;
  const layers = [];
  const off = L.off && {
    name: 'off', key: L.off, x: L.offFront ? -15 : -15.5, y: L.offFront ? -16 : -12.5,
    oy: L.offFront ? 0.5 : 0.85, angle: L.offAngle || 0, flipX: !!L.offFlip,
    tint: L.off === 'w_shield' ? tintFor(eq.offhand, L.offTint) : wTint,
  };
  if (off && !L.offFront) layers.push(off);
  layers.push({ name: 'bootL', key: `${cls}_boot`, x: -5, y: -4 });
  layers.push({ name: 'bootR', key: `${cls}_boot`, x: 5, y: -4 });
  layers.push({ name: 'body', key: `${cls}_body`, x: 0, y: -19 });
  layers.push({ name: 'trim', key: `${cls}_trim`, x: 0, y: -19, tint: tintFor(eq.chest, L.trim) });
  if (off && L.offFront) layers.push(off);
  layers.push({ name: 'weapon', key: L.weapon, x: 15.5, y: -12, oy: L.wOrigin ?? 0.85, angle: L.wAngle, tint: wTint, baseAngle: L.wAngle });
  layers.push({ name: 'head', key: `${cls}_head`, x: 0, y: -60 });
  layers.push({ name: 'blink', key: 'face_blink', x: 0, y: -60, visible: false });
  layers.push({
    name: 'hat', key: `${cls}_hat`, x: 0, y: -60,
    tint: tintFor(eq.head, L.hat), visible: !L.hatOnlyWithItem || !!eq.head,
  });
  return layers;
}
export const PART_NAMES = ['off', 'bootL', 'bootR', 'body', 'trim', 'weapon', 'head', 'blink', 'hat'];

// ---------------------------------------------------------------- utilidades
function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w * RES; c.height = h * RES;
  const x = c.getContext('2d');
  x.scale(RES, RES);
  x.lineJoin = 'round'; x.lineCap = 'round';
  return [c, x];
}
function ell(x, cx, cy, rx, ry, fill, lw = 2.2) {
  x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { x.fillStyle = fill; x.fill(); }
  if (lw) { x.lineWidth = lw; x.strokeStyle = OUT; x.stroke(); }
}
function shape(x, draw, fill, lw = 2.2) {
  x.beginPath(); draw(x); x.closePath();
  if (fill) { x.fillStyle = fill; x.fill(); }
  if (lw) { x.lineWidth = lw; x.strokeStyle = OUT; x.stroke(); }
}
function poly(x, pts, fill, lw = 2.2) {
  shape(x, (c) => { c.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) c.lineTo(p[0], p[1]); }, fill, lw);
}
function rrect(x, rx, ry, w, h, r, fill, lw = 2.2) {
  shape(x, (c) => c.roundRect(rx, ry, w, h, r), fill, lw);
}
function line(x, pts, color, lw) {
  x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) x.lineTo(p[0], p[1]);
  x.lineWidth = lw; x.strokeStyle = color; x.stroke();
}
/** Línea gruesa con contorno (correas, bandas...). */
function strap(x, pts, color, w = 3) {
  line(x, pts, OUT, w + 2.2);
  line(x, pts, color, w);
}
function shine(x, cx, cy, r, a0, a1, alpha = 0.35, lw = 2) {
  x.beginPath(); x.arc(cx, cy, r, a0, a1); x.lineWidth = lw; x.strokeStyle = `rgba(255,255,255,${alpha})`; x.stroke();
}
function register(scene, key, canvas) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}

// ---------------------------------------------------------------- cara común
function face(x, eye) {
  ell(x, CX - 17.5, CY + 2, 3.4, 4.6, SKIN);           // orejas
  ell(x, CX + 17.5, CY + 2, 3.4, 4.6, SKIN);
  ell(x, CX, CY, 17.5, 16, SKIN, 2.5);                // cara
  x.save(); x.beginPath(); x.ellipse(CX, CY, 17.5, 16, 0, 0, Math.PI * 2); x.clip();
  ell(x, CX, CY + 15, 16, 5, SKIN_SH, 0);             // sombra del cuello
  x.restore();
  for (const s of [-1, 1]) {
    const ex = CX + s * 7.5, ey = CY + 3;
    ell(x, ex, ey, 4.3, 5.3, '#ffffff', 1.4);
    ell(x, ex, ey + 0.7, 3.2, 4.1, eye, 0);
    ell(x, ex, ey + 1.6, 3.2, 2.4, 'rgba(0,0,0,0.18)', 0);
    ell(x, ex, ey + 1, 1.6, 2.4, '#1b1430', 0);
    ell(x, ex - 1.3, ey - 1.4, 1.3, 1.5, '#ffffff', 0);
    ell(x, ex + 1.4, ey + 2.2, 0.6, 0.6, '#ffffff', 0);
    x.beginPath(); x.ellipse(ex, ey, 4.7, 5.6, 0, Math.PI * 1.08, Math.PI * 1.92);
    x.lineWidth = 2.2; x.strokeStyle = OUT; x.stroke();    // pestañas
  }
  line(x, [[CX - 11, CY - 5.2], [CX - 4.5, CY - 3.6]], OUT, 1.9);   // cejas decididas
  line(x, [[CX + 11, CY - 5.2], [CX + 4.5, CY - 3.6]], OUT, 1.9);
  ell(x, CX - 12, CY + 8.5, 3, 1.6, 'rgba(255,110,110,0.4)', 0);
  ell(x, CX + 12, CY + 8.5, 3, 1.6, 'rgba(255,110,110,0.4)', 0);
  line(x, [[CX - 0.6, CY + 6], [CX + 0.4, CY + 7]], SKIN_SH, 1.4);   // nariz
  x.beginPath(); x.arc(CX, CY + 8.8, 2.4, 0.2 * Math.PI, 0.8 * Math.PI); x.lineWidth = 1.7; x.strokeStyle = OUT; x.stroke();
}

function blink(scene) {
  const [c, x] = mk(HW, HH);
  for (const s of [-1, 1]) {
    const ex = CX + s * 7.5, ey = CY + 3;
    ell(x, ex, ey, 4.9, 5.8, SKIN, 0);
    x.beginPath(); x.arc(ex, ey - 1, 4, 0.15 * Math.PI, 0.85 * Math.PI); x.lineWidth = 2; x.strokeStyle = OUT; x.stroke();
  }
  register(scene, 'face_blink', c);
}

// ---------------------------------------------------------------- pelo por clase
const HAIR = {
  base: {
    color: '#7a4524',
    back: (x, h) => ell(x, CX, CY - 3, 21, 19.5, h),
    front: (x, h) => {
      poly(x, [[CX - 13, CY - 14], [CX - 10, CY - 28], [CX - 3, CY - 18]], h);
      poly(x, [[CX - 3, CY - 18], [CX + 3, CY - 31], [CX + 8, CY - 18]], h);
      poly(x, [[CX + 6, CY - 17], [CX + 16, CY - 25], [CX + 15, CY - 11]], h);
      shape(x, (c) => {
        c.moveTo(CX - 19, CY + 3); c.quadraticCurveTo(CX - 21, CY - 20, CX, CY - 20); c.quadraticCurveTo(CX + 21, CY - 20, CX + 19, CY + 3);
        c.lineTo(CX + 15, CY - 5); c.lineTo(CX + 11, CY - 1); c.lineTo(CX + 8, CY - 8); c.lineTo(CX + 3, CY - 3); c.lineTo(CX, CY - 9);
        c.lineTo(CX - 4, CY - 3); c.lineTo(CX - 8, CY - 8); c.lineTo(CX - 12, CY - 1); c.lineTo(CX - 15, CY - 5);
      }, h);
      shine(x, CX - 3, CY - 8, 10, Math.PI * 1.15, Math.PI * 1.5);
    },
  },
  assassin: {
    color: '#a2412a',
    back: (x, h) => ell(x, CX, CY - 2, 20, 19, h),
    front: (x, h) => shape(x, (c) => {
      c.moveTo(CX - 19, CY + 7); c.quadraticCurveTo(CX - 21, CY - 20, CX, CY - 20); c.quadraticCurveTo(CX + 21, CY - 20, CX + 19, CY + 7);
      c.lineTo(CX + 14, CY - 2); c.lineTo(CX + 9, CY + 1); c.lineTo(CX + 6, CY - 7); c.lineTo(CX + 1, CY - 1);
      c.lineTo(CX - 3, CY - 8); c.lineTo(CX - 7, CY - 1); c.lineTo(CX - 11, CY - 6); c.lineTo(CX - 15, CY + 1);
    }, h),
  },
  mage: {
    color: '#dfe3f5',
    back: (x, h) => shape(x, (c) => {
      c.moveTo(CX - 20, CY + 20); c.quadraticCurveTo(CX - 24, CY - 22, CX, CY - 21); c.quadraticCurveTo(CX + 24, CY - 22, CX + 20, CY + 20);
      c.quadraticCurveTo(CX + 15, CY + 25, CX + 12, CY + 14); c.lineTo(CX - 12, CY + 14); c.quadraticCurveTo(CX - 15, CY + 25, CX - 20, CY + 20);
    }, h),
    front: (x, h) => {
      shape(x, (c) => {
        c.moveTo(CX - 19, CY + 3); c.quadraticCurveTo(CX - 20, CY - 19, CX, CY - 19); c.quadraticCurveTo(CX + 20, CY - 19, CX + 19, CY + 5);
        c.quadraticCurveTo(CX + 10, CY - 5, CX - 2, CY - 7); c.quadraticCurveTo(CX - 12, CY - 6, CX - 19, CY + 3);
      }, h);
      shine(x, CX + 4, CY - 9, 9, Math.PI * 1.2, Math.PI * 1.6, 0.6);
    },
  },
  tank: {
    color: '#3a2a20',
    back: (x, h) => ell(x, CX, CY - 4, 19, 17, h),
    front: (x, h) => shape(x, (c) => {
      c.moveTo(CX - 17, CY - 2); c.quadraticCurveTo(CX, CY - 22, CX + 17, CY - 2); c.lineTo(CX + 9, CY - 7); c.lineTo(CX, CY - 5); c.lineTo(CX - 9, CY - 7);
    }, h),
  },
  support: {
    color: '#ffd36b',
    back: (x, h) => {
      ell(x, CX, CY - 3, 21, 19.5, h);
      for (const [bx, by] of [[CX - 19, CY + 8], [CX - 20, CY + 15], [CX - 19, CY + 22]]) ell(x, bx, by, 4.6, 4, h);
      ell(x, CX - 18.5, CY + 27, 2.4, 2, '#5aa8e6', 1.6);
    },
    front: (x, h) => {
      shape(x, (c) => {
        c.moveTo(CX - 19, CY + 4); c.quadraticCurveTo(CX - 21, CY - 20, CX, CY - 20); c.quadraticCurveTo(CX + 21, CY - 20, CX + 19, CY + 4);
        c.quadraticCurveTo(CX + 12, CY - 10, CX + 1, CY - 9); c.quadraticCurveTo(CX, CY - 5, CX - 1, CY - 9); c.quadraticCurveTo(CX - 12, CY - 10, CX - 19, CY + 4);
      }, h);
      shine(x, CX - 6, CY - 7, 10, Math.PI * 1.15, Math.PI * 1.45, 0.5);
    },
  },
};

function heads(scene) {
  for (const [cls, hair] of Object.entries(HAIR)) {
    const [c, x] = mk(HW, HH);
    hair.back(x, hair.color);
    face(x, LOOKS[cls].eye);
    hair.front(x, hair.color);
    register(scene, `${cls}_head`, c);
  }
}

// ---------------------------------------------------------------- tocados (teñibles)
const L1 = '#ececf0', L2 = '#cfd0d8', L3 = '#ffffff';
function hats(scene) {
  let c, x;

  // Aventurero: yelmo sencillo (solo si llevas algo en la cabeza)
  [c, x] = mk(HW, HH);
  shape(x, (k) => { k.moveTo(CX - 21, CY - 3); k.quadraticCurveTo(CX - 21, CY - 26, CX, CY - 26); k.quadraticCurveTo(CX + 21, CY - 26, CX + 21, CY - 3); }, L1);
  rrect(x, CX - 22, CY - 7, 44, 6, 3, L2);
  ell(x, CX, CY - 16, 3.5, 3.5, L3, 1.8);
  shine(x, CX - 4, CY - 10, 13, Math.PI * 1.15, Math.PI * 1.45, 0.6, 2.5);
  register(scene, 'base_hat', c);

  // Asesino: capucha con la cara descubierta
  [c, x] = mk(HW, HH);
  const hood = (k) => {
    k.moveTo(CX - 25, CY + 17); k.bezierCurveTo(CX - 31, CY - 20, CX - 14, CY - 31, CX + 2, CY - 30);
    k.quadraticCurveTo(CX + 15, CY - 33, CX + 25, CY - 40); k.quadraticCurveTo(CX + 20, CY - 27, CX + 26, CY - 14);
    k.bezierCurveTo(CX + 29, CY, CX + 27, CY + 12, CX + 25, CY + 17); k.quadraticCurveTo(CX, CY + 25, CX - 25, CY + 17);
  };
  shape(x, hood, L1, 0);
  x.globalCompositeOperation = 'destination-out';
  ell(x, CX, CY + 3, 17.8, 15.5, '#000', 0);
  x.globalCompositeOperation = 'source-over';
  shape(x, hood, null, 2.5);
  x.beginPath(); x.ellipse(CX, CY + 3, 17.8, 15.5, 0, 0, Math.PI * 2); x.lineWidth = 5; x.strokeStyle = 'rgba(0,0,0,0.22)'; x.stroke();
  x.lineWidth = 2.2; x.strokeStyle = OUT; x.stroke();
  line(x, [[CX - 21, CY - 10], [CX - 17, CY - 20]], 'rgba(0,0,0,0.18)', 1.8);
  line(x, [[CX + 20, CY - 14], [CX + 14, CY - 24]], 'rgba(0,0,0,0.18)', 1.8);
  shine(x, CX - 4, CY - 2, 26, Math.PI * 1.18, Math.PI * 1.4, 0.45, 2.5);
  register(scene, 'assassin_hat', c);

  // Mago: sombrero puntiagudo con estrella
  [c, x] = mk(HW, HH);
  ell(x, CX, CY - 13, 29, 6.5, L1);
  shape(x, (k) => {
    k.moveTo(CX - 16, CY - 14); k.quadraticCurveTo(CX - 10, CY - 34, CX + 2, CY - 45);
    k.quadraticCurveTo(CX + 10, CY - 52, CX + 23, CY - 51); k.quadraticCurveTo(CX + 10, CY - 43, CX + 9, CY - 31);
    k.quadraticCurveTo(CX + 12, CY - 21, CX + 16, CY - 14);
  }, L1);
  rrect(x, CX - 16, CY - 20, 32, 6, 2, L2);
  const star = (sx, sy, r) => {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; pts.push([sx + Math.cos(a) * rr, sy + Math.sin(a) * rr]); }
    poly(x, pts, L3, 1.5);
  };
  star(CX - 2, CY - 31, 4.5);
  ell(x, CX + 23, CY - 51, 2.5, 2.5, L3, 1.5);
  shine(x, CX + 12, CY - 22, 22, Math.PI * 1.1, Math.PI * 1.3, 0.45, 2.5);
  register(scene, 'mage_hat', c);

  // Tanque: yelmo abierto con carrilleras, nasal y penacho
  [c, x] = mk(HW, HH);
  shape(x, (k) => { k.moveTo(CX - 2, CY - 23); k.quadraticCurveTo(CX + 10, CY - 41, CX + 28, CY - 31); k.quadraticCurveTo(CX + 15, CY - 30, CX + 7, CY - 20); }, L2);
  line(x, [[CX + 4, CY - 27], [CX + 20, CY - 32]], 'rgba(0,0,0,0.2)', 1.4);
  ell(x, CX, CY - 4, 22, 21, L1, 0);
  rrect(x, CX - 22, CY - 4, 10, 21, 4, L1, 0);
  rrect(x, CX + 12, CY - 4, 10, 21, 4, L1, 0);
  x.globalCompositeOperation = 'destination-out';
  ell(x, CX, CY + 5, 14.5, 13, '#000', 0);
  x.globalCompositeOperation = 'source-over';
  // contornos
  x.save();
  x.beginPath(); x.ellipse(CX, CY - 4, 22, 21, 0, Math.PI, Math.PI * 2); x.lineWidth = 2.5; x.strokeStyle = OUT; x.stroke();
  x.beginPath(); x.roundRect(CX - 22, CY - 4, 10, 21, 4); x.roundRect(CX + 12, CY - 4, 10, 21, 4); x.stroke();
  x.beginPath(); x.ellipse(CX, CY + 5, 14.5, 13, 0, 0, Math.PI * 2); x.lineWidth = 4; x.strokeStyle = 'rgba(0,0,0,0.25)'; x.stroke();
  x.lineWidth = 2.2; x.strokeStyle = OUT; x.stroke();
  x.restore();
  rrect(x, CX - 1.8, CY - 13, 3.6, 13, 1.6, L2, 1.8);
  line(x, [[CX, CY - 24], [CX, CY - 14]], 'rgba(0,0,0,0.25)', 1.6);
  for (const [rx, ry] of [[CX - 17, CY - 2], [CX - 17, CY + 10], [CX + 17, CY - 2], [CX + 17, CY + 10], [CX - 10, CY - 18], [CX + 10, CY - 18]]) ell(x, rx, ry, 1.4, 1.4, L3, 1);
  shine(x, CX - 3, CY - 5, 18, Math.PI * 1.15, Math.PI * 1.42, 0.6, 3);
  register(scene, 'tank_hat', c);

  // Support: diadema con gema y alas
  [c, x] = mk(HW, HH);
  for (const s of [-1, 1]) {
    poly(x, [[CX + s * 15, CY - 9], [CX + s * 26, CY - 17], [CX + s * 24, CY - 11], [CX + s * 27, CY - 9], [CX + s * 17, CY - 5]], L1, 1.8);
  }
  x.beginPath(); x.ellipse(CX, CY - 3, 19, 12, 0, Math.PI * 1.04, Math.PI * 1.96); x.lineWidth = 5; x.strokeStyle = OUT; x.stroke();
  x.lineWidth = 2.8; x.strokeStyle = L1; x.stroke();
  poly(x, [[CX, CY - 22], [CX + 4.5, CY - 16], [CX, CY - 10], [CX - 4.5, CY - 16]], L3, 1.8);
  ell(x, CX - 1, CY - 17.5, 1.2, 1.6, 'rgba(255,255,255,0.9)', 0);
  register(scene, 'support_hat', c);
}

// ---------------------------------------------------------------- cuerpos
function hands(x, l, r, color = SKIN) { ell(x, l[0], l[1], 4.2, 4.2, color); ell(x, r[0], r[1], 4.2, 4.2, color); }

function bodies(scene) {
  let c, x, t, tx;
  // ---- Aventurero
  [c, x] = mk(BW, BH);
  rrect(x, 5, 8, 7, 15, 3.5, '#3c74d6'); rrect(x, 36, 8, 7, 15, 3.5, '#3c74d6');
  hands(x, [8.5, 25], [39.5, 25]);
  rrect(x, 11, 5, 26, 27, 9, '#4a8af0');
  rrect(x, 26, 7, 9, 22, 6, 'rgba(0,0,0,0.12)', 0);
  poly(x, [[18, 5], [24, 13], [30, 5]], '#f4f4f4', 2);
  rrect(x, 11, 22, 26, 5, 2, '#6b4423');
  register(scene, 'base_body', c);
  [t, tx] = mk(BW, BH);
  rrect(tx, 21, 21.5, 6, 6, 1.5, L3, 2);
  line(tx, [[18, 6], [24, 13], [30, 6]], L1, 1.6);
  register(scene, 'base_trim', t);

  // ---- Asesino: chaleco de cuero, bufanda y correas cruzadas
  [c, x] = mk(BW, BH);
  poly(x, [[15, 7], [5, 16], [9, 20], [18, 11]], '#d8453a');                 // cola de la bufanda
  rrect(x, 5, 8, 7, 14, 3.5, '#2f5a44'); rrect(x, 36, 8, 7, 14, 3.5, '#2f5a44');
  line(x, [[5.5, 17], [11.5, 17]], 'rgba(0,0,0,0.3)', 1.4); line(x, [[36.5, 17], [42.5, 17]], 'rgba(0,0,0,0.3)', 1.4);
  hands(x, [8.5, 24.5], [39.5, 24.5], '#3a2a20');
  ell(x, 8.5, 26.5, 2.6, 1.6, SKIN, 0); ell(x, 39.5, 26.5, 2.6, 1.6, SKIN, 0);
  rrect(x, 11, 5, 26, 27, 8, '#3e6e52');
  shape(x, (k) => { k.moveTo(11.5, 9); k.lineTo(20, 7); k.lineTo(21.5, 31); k.lineTo(13, 31); k.quadraticCurveTo(11, 20, 11.5, 9); }, '#5a3d2b');
  shape(x, (k) => { k.moveTo(36.5, 9); k.lineTo(28, 7); k.lineTo(26.5, 31); k.lineTo(35, 31); k.quadraticCurveTo(37, 20, 36.5, 9); }, '#5a3d2b');
  rrect(x, 11, 23, 26, 5, 2, '#33261c');
  rrect(x, 29, 24, 6, 6.5, 1.5, '#7a5235', 1.8);
  ell(x, 24, 6, 10.5, 4.6, '#e04f42');
  ell(x, 29, 9, 3, 3, '#c43c31', 1.8);
  register(scene, 'assassin_body', c);
  [t, tx] = mk(BW, BH);
  strap(tx, [[14, 9], [33, 26]], L1, 2.6);
  strap(tx, [[34, 9], [15, 26]], L2, 2.6);
  ell(tx, 24, 17.5, 2.6, 2.6, L3, 1.6);
  rrect(tx, 21.5, 23.5, 5, 4.5, 1.2, L3, 1.6);
  register(scene, 'assassin_trim', t);

  // ---- Mago: túnica larga con mangas anchas
  [c, x] = mk(BW, BH);
  poly(x, [[14, 8], [3, 24], [11, 28], [17, 14]], '#3346b0');
  poly(x, [[34, 8], [45, 24], [37, 28], [31, 14]], '#3346b0');
  hands(x, [7, 26.5], [41, 26.5]);
  shape(x, (k) => { k.moveTo(14, 5); k.lineTo(34, 5); k.quadraticCurveTo(38, 20, 42, 34); k.lineTo(6, 34); k.quadraticCurveTo(10, 20, 14, 5); }, '#3b52c8');
  shape(x, (k) => { k.moveTo(27, 9); k.lineTo(33, 9); k.quadraticCurveTo(36, 22, 39, 33); k.lineTo(30, 33); }, 'rgba(0,0,0,0.15)', 0);
  rrect(x, 13, 19, 22, 4, 2, '#262c6e', 1.8);
  register(scene, 'mage_body', c);
  [t, tx] = mk(BW, BH);
  poly(tx, [[16, 5], [24, 12], [32, 5], [29, 4], [24, 8.5], [19, 4]], L1, 1.8);
  rrect(tx, 22.5, 12, 3, 19, 1.5, L1, 1.6);
  shape(tx, (k) => { k.moveTo(6.5, 31); k.lineTo(41.5, 31); k.lineTo(42, 34); k.lineTo(6, 34); }, L1, 1.8);
  ell(tx, 24, 21, 2.6, 2.6, L3, 1.6);
  register(scene, 'mage_trim', t);

  // ---- Tanque: armadura de placas con tabardo
  [c, x] = mk(BW, BH);
  rrect(x, 3.5, 10, 8.5, 14, 4, '#7f889c'); rrect(x, 36, 10, 8.5, 14, 4, '#7f889c');
  hands(x, [8, 25.5], [40, 25.5], '#9aa3b5');
  rrect(x, 10, 6, 28, 25, 7, '#a3acbf');
  x.save(); x.beginPath(); x.roundRect(10, 6, 28, 25, 7); x.clip();
  line(x, [[12, 15], [36, 15]], 'rgba(0,0,0,0.2)', 1.4); line(x, [[12, 20], [36, 20]], 'rgba(0,0,0,0.2)', 1.4);
  x.restore();
  poly(x, [[19, 11], [29, 11], [28, 34], [24, 31.5], [20, 34]], '#c8433a', 2);
  rrect(x, 10, 22, 28, 4.5, 2, '#5b3a1f', 1.8);
  shine(x, 18, 18, 9, Math.PI * 1.1, Math.PI * 1.45, 0.45, 2);
  register(scene, 'tank_body', c);
  [t, tx] = mk(BW, BH);
  ell(tx, 9, 10, 8.5, 6.5, L1); ell(tx, 39, 10, 8.5, 6.5, L1);
  line(tx, [[3, 11.5], [15, 11.5]], 'rgba(0,0,0,0.2)', 1.4); line(tx, [[33, 11.5], [45, 11.5]], 'rgba(0,0,0,0.2)', 1.4);
  for (const [rx, ry] of [[5, 8], [13, 8], [35, 8], [43, 8]]) ell(tx, rx, ry, 1.2, 1.2, L3, 0.9);
  rrect(tx, 21.5, 21.5, 5, 5.5, 1.2, L3, 1.6);
  register(scene, 'tank_trim', t);

  // ---- Support: túnica blanca con capa
  [c, x] = mk(BW, BH);
  shape(x, (k) => { k.moveTo(12, 6); k.lineTo(36, 6); k.lineTo(45, 34); k.lineTo(3, 34); }, '#5aa8e6');
  rrect(x, 5, 8, 7, 15, 3.5, '#f3eee2'); rrect(x, 36, 8, 7, 15, 3.5, '#f3eee2');
  hands(x, [8.5, 25], [39.5, 25]);
  shape(x, (k) => { k.moveTo(14, 5); k.lineTo(34, 5); k.quadraticCurveTo(37, 20, 40, 34); k.lineTo(8, 34); k.quadraticCurveTo(11, 20, 14, 5); }, '#f8f4ea');
  shape(x, (k) => { k.moveTo(27, 9); k.lineTo(33, 9); k.quadraticCurveTo(35, 22, 37, 33); k.lineTo(30, 33); }, 'rgba(120,100,60,0.12)', 0);
  rrect(x, 13, 19, 22, 4, 2, '#5aa8e6', 1.8);
  register(scene, 'support_body', c);
  [t, tx] = mk(BW, BH);
  poly(tx, [[16, 5], [24, 11], [32, 5], [29, 4], [24, 8], [19, 4]], L1, 1.8);
  rrect(tx, 22.5, 12, 3, 19, 1.5, L1, 1.6);
  shape(tx, (k) => { k.moveTo(8.5, 31); k.lineTo(39.5, 31); k.lineTo(40, 34); k.lineTo(8, 34); }, L1, 1.8);
  ell(tx, 24, 14.5, 3.2, 3.2, L3, 1.6);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; line(tx, [[24 + Math.cos(a) * 4.5, 14.5 + Math.sin(a) * 4.5], [24 + Math.cos(a) * 6, 14.5 + Math.sin(a) * 6]], L3, 1.2); }
  register(scene, 'support_trim', t);
}

// ---------------------------------------------------------------- botas
function boots(scene) {
  const make = (key, draw) => { const [c, x] = mk(12, 12); draw(x); register(scene, key, c); };
  make('base_boot', (x) => { ell(x, 6, 6.5, 5, 4.5, '#5b3a1f'); shine(x, 5, 6, 3, Math.PI * 1.1, Math.PI * 1.5, 0.3, 1.2); });
  make('assassin_boot', (x) => { ell(x, 6, 6.5, 5, 4.5, '#2a211b'); line(x, [[2.5, 5], [9.5, 5]], '#6b5240', 1.2); });
  make('mage_boot', (x) => { ell(x, 6, 7.5, 4.6, 3.6, '#4a3a9a'); });
  make('tank_boot', (x) => { rrect(x, 1, 2.5, 10, 8.5, 3, '#9aa3b5'); line(x, [[2, 6.5], [10, 6.5]], 'rgba(0,0,0,0.25)', 1.2); });
  make('support_boot', (x) => { ell(x, 6, 7.5, 4.6, 3.6, '#fff3d6'); line(x, [[3, 6], [9, 6]], '#d4a017', 1.4); });
}

// ---------------------------------------------------------------- armas (teñibles)
function weapons(scene) {
  let c, x;
  // Espada
  [c, x] = mk(16, 42);
  poly(x, [[8, 1], [12, 6], [11, 29], [5, 29], [4, 6]], '#f0f4f8', 2);
  line(x, [[8, 6], [8, 27]], 'rgba(0,0,0,0.15)', 1.2);
  rrect(x, 1, 28, 14, 4, 2, '#d9d9d9', 2);
  rrect(x, 6, 32, 4, 7, 2, '#a0a0a0', 1.8);
  ell(x, 8, 40, 2.3, 1.8, '#dddddd', 1.4);
  register(scene, 'w_sword', c);

  // Daga
  [c, x] = mk(12, 28);
  poly(x, [[6, 1], [9, 6], [8, 17], [4, 17], [3, 6]], '#f0f4f8', 1.8);
  line(x, [[6, 5], [6, 16]], 'rgba(0,0,0,0.15)', 1);
  rrect(x, 1, 16.5, 10, 3, 1.5, '#d0d0d0', 1.6);
  rrect(x, 4.5, 19.5, 3, 6, 1.5, '#909090', 1.4);
  ell(x, 6, 26, 1.9, 1.6, '#dddddd', 1.2);
  register(scene, 'w_dagger', c);

  // Bastón de mago con orbe
  [c, x] = mk(16, 60);
  rrect(x, 6.5, 13, 3, 45, 1.5, '#e2d6c2', 1.8);
  line(x, [[6.5, 30], [9.5, 30]], 'rgba(0,0,0,0.25)', 1.2); line(x, [[6.5, 40], [9.5, 40]], 'rgba(0,0,0,0.25)', 1.2);
  line(x, [[8, 14], [2.5, 6]], OUT, 3.4); line(x, [[8, 14], [2.5, 6]], '#e2d6c2', 1.6);
  line(x, [[8, 14], [13.5, 6]], OUT, 3.4); line(x, [[8, 14], [13.5, 6]], '#e2d6c2', 1.6);
  ell(x, 8, 7.5, 5.5, 5.5, '#ffffff', 1.8);
  ell(x, 6.5, 6, 2, 2, 'rgba(255,255,255,0.9)', 0);
  register(scene, 'w_staff', c);

  // Báculo solar (support)
  [c, x] = mk(18, 60);
  rrect(x, 7.5, 14, 3, 44, 1.5, '#f2e6c4', 1.8);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    poly(x, [[9 + Math.cos(a) * 5, 8 + Math.sin(a) * 5], [9 + Math.cos(a + 0.2) * 8.5, 8 + Math.sin(a + 0.2) * 8.5], [9 + Math.cos(a + 0.4) * 5, 8 + Math.sin(a + 0.4) * 5]], '#ffffff', 1.2);
  }
  ell(x, 9, 8, 5, 5, '#ffffff', 1.8);
  ell(x, 7.7, 6.8, 1.6, 1.6, 'rgba(255,240,180,0.9)', 0);
  register(scene, 'w_sun', c);

  // Escudo de cometa
  [c, x] = mk(28, 34);
  shape(x, (k) => { k.moveTo(14, 1.5); k.lineTo(26, 5); k.quadraticCurveTo(26, 22, 14, 32.5); k.quadraticCurveTo(2, 22, 2, 5); }, '#e8ecf4', 2.4);
  shape(x, (k) => { k.moveTo(14, 5); k.lineTo(22.5, 7.5); k.quadraticCurveTo(22.5, 20, 14, 28); k.quadraticCurveTo(5.5, 20, 5.5, 7.5); }, null, 1.4);
  poly(x, [[14, 9], [18, 15], [14, 23], [10, 15]], '#c4c8d4', 1.6);
  shine(x, 12, 14, 9, Math.PI * 1.1, Math.PI * 1.45, 0.6, 2);
  register(scene, 'w_shield', c);
}

/** Genera todas las texturas del personaje jugador. */
export function generateCharacterTextures(scene) {
  heads(scene);
  blink(scene);
  hats(scene);
  bodies(scene);
  boots(scene);
  weapons(scene);
}

/**
 * Dibuja el personaje (o solo la cabeza) en un <canvas> de la UI,
 * con exactamente las mismas capas y tintes que el sprite del juego.
 */
export function drawCharacter(scene, state, canvas, { headOnly = false, scale = 1 } = {}) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const layers = characterLayers(state).filter((l) => l.visible !== false && (!headOnly || l.name === 'head' || l.name === 'hat'));
  const tinted = (src, hex) => {
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = `#${hex.toString(16).padStart(6, '0')}`; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(src, 0, 0);
    return c;
  };
  ctx.save();
  if (headOnly) ctx.translate(canvas.width / 2, canvas.height / 2 + 6 * scale);
  else ctx.translate(canvas.width / 2, canvas.height - 6);
  ctx.scale(scale, scale);
  const yOff = headOnly ? 46 : 0;           // centra la cara en el retrato
  for (const l of layers) {
    const src = scene.textures.get(l.key).getSourceImage();
    const img = l.tint != null && l.tint !== 0xffffff ? tinted(src, l.tint) : src;
    const w = src.width / RES, h = src.height / RES;
    ctx.save();
    ctx.translate(l.x, l.y + yOff);
    if (l.angle) ctx.rotate((l.angle * Math.PI) / 180);
    if (l.flipX) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h * (l.oy ?? 0.5), w, h);
    ctx.restore();
  }
  ctx.restore();
}

// ============================================================
//  ALDEANOS (NPCs del pueblo de Albor): mismo estilo chibi que
//  el héroe, pero en una sola textura por NPC. Lienzo 64x104,
//  pies en la parte inferior. Se muestran a escala 1/RES.
// ============================================================
const NW = 64, NH = 118;
function villagerItem(x, kind) {
  const wood = '#8a5a32';
  if (kind === 'staff') { strap(x, [[53, 100], [53, 30]], wood, 3); ell(x, 53, 27, 5.5, 5.5, '#8fe6ff'); ell(x, 51.5, 25.5, 1.8, 1.8, '#ffffff', 0); }
  else if (kind === 'spear') { strap(x, [[53, 100], [53, 22]], wood, 2.6); poly(x, [[53, 8], [57.5, 22], [48.5, 22]], '#d6dce6'); }
  else if (kind === 'hammer') { strap(x, [[52, 86], [52, 62]], wood, 3); rrect(x, 44, 55, 16, 9, 2, '#8e95a3'); }
  else if (kind === 'bag') { ell(x, 53, 86, 7.5, 8, '#c9a46a'); line(x, [[49, 79], [57, 79]], OUT, 1.6); }
  else if (kind === 'mug') { rrect(x, 47, 74, 10, 12, 2, '#d9a95a'); ell(x, 52, 74.5, 5, 2, '#fff8e0', 1.2); shape(x, (k) => { k.arc(58, 80, 3.5, -1.4, 1.4); }, null, 1.8); }
  else if (kind === 'bow') { x.beginPath(); x.arc(46, 70, 22, -1.0, 1.0); x.lineWidth = 4.5; x.strokeStyle = OUT; x.stroke(); x.lineWidth = 2.5; x.strokeStyle = wood; x.stroke(); line(x, [[57.8, 52], [57.8, 88]], '#f4efe0', 1); }
  else if (kind === 'map') { rrect(x, 44, 72, 16, 12, 2, '#f1e3c0'); line(x, [[47, 76], [56, 80]], '#c0392b', 1.4); }
}
function villager(scene, key, L) {
  const [c, x] = mk(NW, NH);
  x.translate(0, 14);                                          // margen para sombreros altos
  const top = L.top, trim = L.trim;
  if (L.cape) poly(x, [[18, 58], [46, 58], [52, 96], [12, 96]], L.cape);
  // piernas / botas
  if (!L.robe) { rrect(x, 21, 82, 9, 14, 3, '#4a3e36'); rrect(x, 34, 82, 9, 14, 3, '#4a3e36'); }
  ell(x, 25, 98, 7, 4.5, '#3a2a20'); ell(x, 39, 98, 7, 4.5, '#3a2a20');
  // cuerpo
  if (L.robe) poly(x, [[19, 56], [45, 56], [50, 96], [14, 96]], top);
  else poly(x, [[19, 56], [45, 56], [47, 86], [17, 86]], top);
  if (L.apron) rrect(x, 24, 64, 16, L.robe ? 28 : 21, 3, L.apron, 1.8);
  rrect(x, 18, 71, 28, 5, 2, trim, 1.8);                       // cinturón
  poly(x, [[25, 56], [39, 56], [32, 63]], trim, 1.6);         // cuello
  // brazos y manos
  ell(x, 14.5, 68, 5.5, 10, top); ell(x, 49.5, 68, 5.5, 10, top);
  ell(x, 14, 79, 4.4, 4.4, L.skin); ell(x, 50, 79, 4.4, 4.4, L.skin);
  villagerItem(x, L.item);
  // cabeza (la cara común está en CY=54: la subimos 14 px)
  x.save(); x.translate(0, -14);
  if (L.hat === 'hood') ell(x, CX, CY - 1, 22.5, 21.5, L.hatColor);
  else ell(x, CX, CY - 3, 20, 19, L.hair);                     // pelo de atrás
  face(x, '#5a3a22');
  if (L.hat !== 'hood' && L.hat !== 'helm') shape(x, (k) => k.ellipse(CX, CY - 7, 18.8, 11.5, 0, Math.PI, 0), L.hair, 2.2);   // flequillo
  if (L.beard) shape(x, (k) => { k.moveTo(CX - 12, CY + 9); k.quadraticCurveTo(CX, CY + 30, CX + 12, CY + 9); k.quadraticCurveTo(CX, CY + 15, CX - 12, CY + 9); }, L.beard, 2);
  if (L.hat === 'helm') {
    shape(x, (k) => k.ellipse(CX, CY - 4, 20, 17, 0, Math.PI, 0), L.hatColor, 2.4);
    rrect(x, CX - 20, CY - 7, 40, 6, 2, '#e0b85a', 2);
    ell(x, CX, CY - 25, 4, 7, '#d23b3b', 2);
  } else if (L.hat === 'wizard') {
    poly(x, [[CX - 19, CY - 9], [CX + 19, CY - 9], [CX + 6, CY - 50]], L.hatColor, 2.4);
    ell(x, CX, CY - 9, 25, 5.5, L.hatColor, 2.4);
    ell(x, CX + 3, CY - 24, 3, 3, '#ffd34d', 1.4);
  } else if (L.hat === 'cap') {
    shape(x, (k) => k.ellipse(CX, CY - 8, 19, 12, 0, Math.PI, 0), L.hatColor, 2.2);
    ell(x, CX + 9, CY - 8, 12, 3.4, L.hatColor, 2);
  } else if (L.hat === 'hood') {
    shape(x, (k) => k.ellipse(CX, CY - 8, 19.5, 12, 0, Math.PI, 0), L.hatColor, 2.2);
  } else if (L.hat === 'bun') {
    ell(x, CX, CY - 22, 7.5, 6.5, L.hair, 2.2);
  }
  x.restore();
  register(scene, key, c);
}
/** Genera una textura por NPC: npc_<id>. */
export function generateVillagerTextures(scene, npcs) {
  for (const [id, n] of Object.entries(npcs)) villager(scene, `npc_${id}`, n.look);
}
