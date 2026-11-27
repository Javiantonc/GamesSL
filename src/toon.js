'use strict';
/* =========================================================================
   PERSONAJES CHIBI DIBUJADOS (arte original de Mini Realms)
   Contorno oscuro grueso · colores terrosos · sombra de un tono (cel)
   · ojos grandes con brillo · caras expresivas.
   Unidades de diseño: el personaje mide ~92; pies en (0,0), hacia arriba y<0.
   Se dibuja a RES× en un lienzo de 100x112 unidades.
   ========================================================================= */
const OUT = '#2a2220';
const TRES = 2;
const TW = 124, TH = 140, FX = 62, FY = 134;

function hex2rgb(h) { if (h[0] === 'r') return h.match(/\d+/g).slice(0, 3).map(Number); const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function tone(h, k) {
  const [r, g2, b] = hex2rgb(h);
  const f = (v) => Math.max(0, Math.min(255, Math.round(k >= 1 ? v + (255 - v) * (k - 1) : v * k)));
  return `rgb(${f(r)},${f(g2)},${f(b)})`;
}
const dk = (h) => tone(h, 0.74);
const lt = (h) => tone(h, 1.25);

/* --------------------------------------------------------- utilidades */
let X; // contexto actual
function path(fn) { X.beginPath(); fn(X); }
/** Forma con sombra de un tono (abajo-derecha) y contorno. */
function toon(fn, base, { sx = -3, sy = -2.5, lw = 2.4, shade = true, line = true } = {}) {
  X.save();
  path(fn); X.fillStyle = shade ? dk(base) : base; X.fill();
  if (shade) { X.clip(); X.translate(sx, sy); path(fn); X.fillStyle = base; X.fill(); }
  X.restore();
  if (line) { path(fn); X.lineWidth = lw; X.strokeStyle = OUT; X.lineJoin = 'round'; X.stroke(); }
}
const E = (cx, cy, rx, ry, r = 0) => (k) => k.ellipse(cx, cy, rx, ry, r, 0, Math.PI * 2);
const RR = (x, y, w, h, r) => (k) => k.roundRect(x, y, w, h, r);
const PL = (pts) => (k) => { k.moveTo(...pts[0]); for (const p of pts.slice(1)) k.lineTo(...p); k.closePath(); };
function stroke(pts, color, lw) { X.beginPath(); X.moveTo(...pts[0]); for (const p of pts.slice(1)) X.lineTo(...p); X.strokeStyle = color; X.lineWidth = lw; X.lineCap = 'round'; X.stroke(); }
function dot(x, y, r, c) { X.beginPath(); X.arc(x, y, r, 0, Math.PI * 2); X.fillStyle = c; X.fill(); }

/* ------------------------------------------------------------- datos */
const SKINS = ['#ffe0c6', '#f3c9a2', '#e0a77c', '#b9805a', '#7e5236'];
const HAIRS = ['#3a2a24', '#6b4226', '#b5652e', '#e6c068', '#d9d6cc', '#a8342a', '#3d5a8a', '#4f6b3a'];
const EYES = ['#2a2220', '#3d5a8a', '#3f7a4a', '#6b4226', '#7a3a8a'];
const OUTFITS = ['#3d5a8a', '#a8452f', '#5f7a3a', '#6b4a7a', '#c9a24a', '#3f7a7a', '#7a5236', '#6e6e78'];
const STYLES = { corto: 'Corto', largo: 'Largo', coleta: 'Coleta', pincho: 'De punta', mono: 'Moño', rapado: 'Rapado' };
const FACES = { alegre: '😄 Alegre', decidido: '😠 Decidido', enfadado: '😡 Enfadado', serio: '😐 Serio' };

const CLASSES = {
  picaro: {
    name: 'Pícaro', icon: '🗡️', weapon: 'dagger', wear: 'leather', hat: 'hooddown', color: '#5f7a3a',
    desc: 'Rápido y escurridizo. Ataca con su <b>daga</b> y envenena a sus enemigos.',
    basic: { name: 'Cuchillada', icon: '🗡️', kind: 'melee', dmg: 9, cd: 0.45, range: 46 },
    power: { name: 'Puñalada venenosa', icon: '🧪', kind: 'poison', dmg: 12, dot: 5, ticks: 4, cd: 6, range: 46, color: '#8ae06a' },
  },
  mago: {
    name: 'Mago', icon: '🔮', weapon: 'staff', wear: 'robe', hat: 'wizard', color: '#3d5a8a',
    desc: 'Domina la magia arcana con su <b>bastón</b>. Ataca a distancia, pero es frágil.',
    basic: { name: 'Chispa arcana', icon: '✨', kind: 'bolt', dmg: 7, cd: 0.6, range: 260, color: '#9ad8ff', speed: 420 },
    power: { name: 'Bola de fuego', icon: '🔥', kind: 'bolt', dmg: 26, cd: 5, range: 300, color: '#ff8a2a', speed: 320, big: true },
  },
  paladin: {
    name: 'Paladín', icon: '🛡️', weapon: 'mace', wear: 'plate', hat: 'helm', color: '#c9a24a',
    desc: 'Caballero sagrado con armadura y <b>maza</b>. Resiste mucho y se cura con la luz.',
    basic: { name: 'Golpe de maza', icon: '🔨', kind: 'melee', dmg: 10, cd: 0.7, range: 46 },
    power: { name: 'Luz sagrada', icon: '✨', kind: 'holy', dmg: 10, heal: 0.4, cd: 8, radius: 80, color: '#ffe98a' },
  },
  guerrero: {
    name: 'Guerrero', icon: '🪓', weapon: 'axe', wear: 'mail', hat: 'coif', color: '#a8452f',
    desc: 'Fuerza bruta con un <b>hacha</b> enorme. Golpea a todos los que le rodean.',
    basic: { name: 'Tajo', icon: '🪓', kind: 'melee', dmg: 12, cd: 0.75, range: 50 },
    power: { name: 'Torbellino', icon: '🌀', kind: 'whirl', dmg: 16, cd: 6, radius: 76, color: '#ffffff' },
  },
  cazador: {
    name: 'Cazador', icon: '🏹', weapon: 'bow', wear: 'leather', hat: 'hooddown', color: '#6a7a3a',
    desc: 'Experto con el <b>arco</b>, el <b>fusil</b> y la <b>ballesta</b>. Ataca desde muy lejos y, si se le acercan, saca su <b>espada</b> o daga.',
    basic: { name: 'Disparo', icon: '🏹', kind: 'bolt', dmg: 8, cd: 0.6, range: 300, color: '#e8dcc0', speed: 520 },
    power: { name: 'Disparo arcano', icon: '✴️', kind: 'bolt', dmg: 22, cd: 5, range: 320, color: '#9ad8ff', speed: 480, big: true },
  },
  brujo: {
    name: 'Brujo', icon: '💀', weapon: 'dagger', wear: 'darkrobe', hat: 'hood', color: '#6b4a7a',
    desc: 'Usa magia oscura y una <b>daga</b> ritual. Su sombra consume poco a poco al enemigo.',
    basic: { name: 'Corte ritual', icon: '🗡️', kind: 'melee', dmg: 8, cd: 0.5, range: 46 },
    power: { name: 'Descarga de sombras', icon: '🟣', kind: 'bolt', dmg: 14, dot: 4, ticks: 4, cd: 5, range: 280, color: '#b04dff', speed: 300, big: true },
  },
};

/* ---------------------------------------------------------------- armas
   Cada arma: { kind, shape, mat } · kind: dagger/staff/mace/axe/…
   shape: forma de la hoja o cabeza · mat: material (color y brillo).
   Se dibujan apuntando hacia arriba con el puño en (0,0).            */
const MATS = {
  acero:     { name: 'de acero',     m: '#c9ced6', a: '#d9a93a', g: '#d94a3a' },
  bronce:    { name: 'de bronce',    m: '#c98a4a', a: '#7a5236', g: '#3f7a4a' },
  oro:       { name: 'dorada',       m: '#e6c060', a: '#a8452f', g: '#3d8ad8' },
  cristal:   { name: 'de cristal',   m: '#8ad0f0', a: '#3d5a8a', g: '#e8f8ff', glow: '#8ad0f0' },
  fuego:     { name: 'ígnea',        m: '#ff9a3a', a: '#7a2a20', g: '#ffe46a', glow: '#ff8a3a' },
  veneno:    { name: 'venenosa',     m: '#8ad05a', a: '#3a4a2a', g: '#d0ff8a', glow: '#8ae06a' },
  sombra:    { name: 'sombría',      m: '#6a5a8a', a: '#2a2230', g: '#c58bff', glow: '#a86aff' },
};
function weapon(kind, v = {}) {
  const M = MATS[v.mat] || MATS.acero, m = M.m, acc = M.a, gem = M.g;
  const wood = '#8a5a34', shape = v.shape || '';
  if (M.glow && v.glow) { X.save(); X.shadowColor = M.glow; X.shadowBlur = 10; }
  switch (kind) {
    case 'dagger': {
      if (shape === 'curva') toon((k) => { k.moveTo(-3, -6); k.quadraticCurveTo(-5, -20, 4, -32); k.quadraticCurveTo(2, -18, 3.5, -6); k.closePath(); }, m, { sx: -1.5, sy: 0 });
      else if (shape === 'llama') toon((k) => { k.moveTo(-3.4, -6); k.lineTo(-4.5, -12); k.lineTo(-2, -15); k.lineTo(-4, -21); k.lineTo(-1, -25); k.lineTo(0, -32); k.lineTo(2, -25); k.lineTo(4.5, -20); k.lineTo(2.5, -15); k.lineTo(4.5, -11); k.lineTo(3.4, -6); k.closePath(); }, m, { sx: -1.5, sy: 0 });
      else if (shape === 'cristal') toon(PL([[-3.6, -6], [-4.6, -18], [0, -33], [4.6, -18], [3.6, -6]]), m, { sx: -2, sy: 0 });
      else toon(PL([[-3.2, -6], [3.2, -6], [2.6, -24], [0, -30], [-2.6, -24]]), m, { sx: -1.6, sy: 0 });
      stroke([[0, -8], [0.6, -24]], '#ffffff99', 1);
      toon(shape === 'curva' ? PL([[-7, -8], [7, -6.5], [6, -4], [-6, -4.5]]) : RR(-6.5, -7.5, 13, 3.6, 1.8), acc, { shade: false });
      toon(RR(-1.8, -4, 3.6, 8, 1.5), '#4a3424', { shade: false });
      dot(0, 5, 2.4, gem); X.lineWidth = 1.6; X.strokeStyle = OUT; X.stroke();
      break;
    }
    case 'staff': {
      toon(RR(-2.2, -58, 4.4, 72, 2), shape === 'luna' ? '#5a4a6a' : wood, { sx: -1.4, sy: 0 });
      for (const y of [-20, 2]) stroke([[-2, y], [2, y + 2]], OUT, 1.2);
      if (shape === 'cristal') { toon(PL([[0, -88], [6, -70], [3, -58], [-3, -58], [-6, -70]]), m, { sx: -2, sy: 0 }); toon(PL([[-6, -60], [6, -60], [4, -56], [-4, -56]]), acc, { shade: false }); }
      else if (shape === 'llama') { toon((k) => { k.moveTo(-6, -60); k.quadraticCurveTo(-10, -74, -2, -84); k.quadraticCurveTo(-2, -76, 2, -74); k.quadraticCurveTo(4, -86, 8, -78); k.quadraticCurveTo(10, -66, 6, -60); k.closePath(); }, m, { sx: -2, sy: 0 }); dot(0, -68, 3, '#fff1a0'); }
      else if (shape === 'luna') { toon((k) => { k.moveTo(-10, -60); k.quadraticCurveTo(-14, -84, 6, -86); k.quadraticCurveTo(-6, -78, -4, -62); k.closePath(); }, acc === '#2a2230' ? '#c9ced6' : m, { sx: -1.5, sy: 0 }); toon(E(4, -70, 4.6, 5), gem, { sx: -1, sy: -1 }); }
      else { toon(PL([[-6, -58], [-2, -54], [2, -54], [6, -58], [3, -61], [-3, -61]]), acc === '#d9a93a' ? '#d9a93a' : acc, { shade: false }); dot(0, -66, 8, 'rgba(255,255,255,0.18)'); toon(E(0, -66, 5.6, 6.2), M.glow || '#7ad0f0', { sx: -1.5, sy: -1.5 }); dot(-1.8, -68, 1.8, '#ffffff'); }
      break;
    }
    case 'mace': {
      toon(RR(-2, -16, 4, 30, 2), wood, { sx: -1.2, sy: 0 });
      toon(RR(-2.6, 6, 5.2, 8, 2), '#4a3424', { shade: false });
      if (shape === 'estrella') { for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; toon(PL([[Math.cos(a) * 5, -24 + Math.sin(a) * 5], [Math.cos(a) * 12, -24 + Math.sin(a) * 12], [Math.cos(a + 0.4) * 5, -24 + Math.sin(a + 0.4) * 5]]), m, { shade: false, lw: 1.6 }); } toon(E(0, -24, 7.5, 7.5), m, { sx: -2, sy: -2 }); }
      else if (shape === 'martillo') { toon(RR(-11, -32, 22, 13, 3), m, { sx: -2, sy: -1.5 }); stroke([[-11, -26], [11, -26]], acc, 2); }
      else { for (const a of [-1, 1]) toon(PL([[0, -30], [a * 9, -25], [a * 9, -16], [0, -13]]), m, { sx: a * -1.5, sy: 0 }); toon(E(0, -22, 5.5, 8.5), tone(m, 0.8), { sx: -1.5, sy: -1 }); }
      toon(RR(-5, -15, 10, 3, 1.5), acc, { shade: false });
      dot(-1.5, -26, 1.4, '#ffffffaa');
      if (v.mat && v.mat !== 'acero' && v.mat !== 'bronce') dot(0, -24, 2.2, gem);
      break;
    }
    case 'axe': {
      toon(RR(-2.2, -40, 4.4, 54, 2), wood, { sx: -1.4, sy: 0 });
      toon(RR(-2.8, 6, 5.6, 8, 2), '#4a3424', { shade: false });
      const blade = (s) => toon((k) => { k.moveTo(s * 2, -40); k.quadraticCurveTo(s * 18, -46, s * 20, -34); k.quadraticCurveTo(s * 22, -24, s * 20, -14); k.quadraticCurveTo(s * 16, -22, s * 2, -24); k.closePath(); }, m, { sx: -2 * s, sy: 0 });
      if (shape === 'luna') toon((k) => { k.moveTo(2, -44); k.quadraticCurveTo(28, -52, 26, -28); k.quadraticCurveTo(26, -8, 8, -4); k.quadraticCurveTo(18, -20, 2, -20); k.closePath(); }, m, { sx: -2, sy: 0 });
      else blade(1);
      if (shape === 'doble') blade(-1); else toon(PL([[-2, -38], [-9, -34], [-2, -29]]), tone(m, 0.8), { shade: false });
      stroke([[19, -36], [19.5, -16]], '#ffffffaa', 1.4);
      toon(RR(-3.2, -44, 6.4, 5, 2), acc, { shade: false });
      if (v.mat && v.mat !== 'acero' && v.mat !== 'bronce') dot(0, -31, 2.2, gem);
      break;
    }
    case 'spear':
      toon(RR(-1.8, -60, 3.6, 74, 1.6), wood, { sx: -1, sy: 0 });
      toon(PL([[0, -78], [5, -64], [0, -58], [-5, -64]]), m, { sx: -1.5, sy: 0 });
      break;
    case 'hammer':
      toon(RR(-2, -22, 4, 34, 2), wood, { sx: -1.2, sy: 0 });
      toon(RR(-9, -30, 18, 10, 2), '#7e8794', { sx: -1.5, sy: -1 });
      break;
    case 'bow': {
      const L = shape === 'corto' ? 26 : shape === 'largo' ? 40 : 34, bw = shape === 'recurvo' ? 10 : 14;
      X.beginPath(); X.moveTo(0, -L);
      if (shape === 'recurvo') { X.bezierCurveTo(-4, -L + 6, bw + 6, -L * 0.5, bw, 0); X.bezierCurveTo(bw + 6, L * 0.5, -4, L - 6, 0, L); }
      else X.quadraticCurveTo(bw * 1.4, 0, 0, L);
      X.lineWidth = 6.4; X.strokeStyle = OUT; X.stroke(); X.lineWidth = 3.6; X.strokeStyle = v.mat && v.mat !== 'acero' && v.mat !== 'bronce' ? m : wood; X.stroke();
      stroke([[0, -L + 1], [0, L - 1]], '#e8dcc0', 1.1);
      toon(RR(2, -5, 5, 10, 2), acc, { shade: false, lw: 1.6 });
      for (const y of [-L, L]) dot(0, y, 2, gem);
      break;
    }
    case 'rifle':
      toon(PL([[-3, 10], [3, 10], [4, 0], [2.5, -4], [-2.5, -4], [-4, 0]]), wood, { sx: -1, sy: 0, lw: 2 });   // culata
      toon(RR(-2.4, -40, 4.8, 38, 1.5), m, { sx: -1, sy: 0, lw: 2 });                                         // cañón
      toon(RR(-3.2, -24, 6.4, 22, 2), wood, { sx: -1, sy: 0, lw: 2 });
      toon(RR(-3.6, -42, 7.2, 4, 1), acc, { shade: false, lw: 1.6 });
      if (shape === 'trabuco') toon(PL([[-5, -40], [5, -40], [3.2, -34], [-3.2, -34]]), m, { shade: false, lw: 1.6 });
      stroke([[2.5, -6], [5.5, -2]], OUT, 1.8);
      if (shape === 'largo') toon(RR(-1.6, -50, 3.2, 10, 1), m, { shade: false, lw: 1.6 });
      break;
    case 'crossbow':
      toon(RR(-3.4, -34, 6.8, 44, 2), wood, { sx: -1, sy: 0, lw: 2 });
      stroke([[-16, -27], [0, -14], [16, -27]], '#e8dcc0', 1.2);
      X.beginPath(); X.moveTo(-19, -24); X.quadraticCurveTo(0, -40, 19, -24); X.lineWidth = 6.4; X.strokeStyle = OUT; X.stroke(); X.lineWidth = 3.6; X.strokeStyle = m; X.stroke();
      stroke([[0, -12], [0, -42]], OUT, 3.4); stroke([[0, -12], [0, -42]], '#c8a070', 1.6);
      toon(PL([[-2.4, -40], [2.4, -40], [0, -47]]), '#c9ced6', { shade: false, lw: 1.4 });
      stroke([[3, 0], [6, 4]], OUT, 1.8);
      if (shape === 'pesada') toon(RR(-5, -10, 10, 7, 2), acc, { shade: false, lw: 1.6 });
      break;
    case 'mug':
      toon(RR(-5, -10, 10, 12, 2), '#b58a4a', { sx: -1.5, sy: 0 });
      toon(E(0, -10, 5, 2.4), '#fff4dc', { shade: false });
      break;
    case 'map':
      toon(RR(-8, -8, 16, 11, 2), '#efdcb0', { sx: -1.5, sy: 0 });
      stroke([[-4, -4], [3, -1]], '#a8452f', 1.4);
      break;
    case 'sword':
      if (shape === 'curva') toon((k) => { k.moveTo(-3, -6); k.quadraticCurveTo(-8, -26, 2, -44); k.quadraticCurveTo(3, -26, 4, -6); k.closePath(); }, m, { sx: -1.6, sy: 0 });
      else if (shape === 'ancha') toon(PL([[-5, -6], [5, -6], [4.4, -38], [0, -46], [-4.4, -38]]), m, { sx: -1.6, sy: 0 });
      else toon(PL([[-3.6, -6], [3.6, -6], [3.2, -38], [0, -44], [-3.2, -38]]), m, { sx: -1.6, sy: 0 });
      stroke([[0, -8], [0, -36]], dk(m), 1);
      toon(RR(-8, -8, 16, 4, 2), acc, { shade: false }); toon(RR(-1.8, -4, 3.6, 9, 1.5), '#4a3424', { shade: false }); dot(0, -6, 1.4, gem);
      break;
  }
  if (M.glow && v.glow) X.restore();
}
const WSCALE = { dagger: 1.45, mace: 1.35, axe: 1.2, staff: 1.05, spear: 1, hammer: 1.2, bow: 1.1, mug: 1.1, map: 1.1, sword: 1.2, rifle: 1.15, crossbow: 1.1 };
/** w: string (tipo) u objeto arma { kind, shape, mat, glow } */
function drawWeapon(w, x, y, ang) {
  if (!w) return;
  const o = typeof w === 'string' ? { kind: w } : w;
  const k = WSCALE[o.kind] || 1;
  X.save(); X.translate(x, y); X.rotate(ang); X.scale(k, k); weapon(o.kind, o); X.restore();
}
/* ------------------------------------------------------------ ropa */
function wearColors(L) {
  const W = wearColors0(L);
  if (L.pantsC) W.pants = L.pantsC; if (L.bootsC) W.boots = L.bootsC; if (L.gloveC) W.glove = L.gloveC; if (L.beltC) W.belt = L.beltC; if (L.bodyC && !W.robe) W.body = L.bodyC;
  return W;
}
function wearColors0(L) {
  const o = L.outfit;
  switch (L.wear) {
    case 'leather': return { body: '#7a5236', sleeve: '#6b4630', under: o, pants: '#4e4436', boots: '#5a3a22', glove: '#5a3a22', belt: '#4a2f1c' };
    case 'robe': return { body: o, sleeve: o, under: o, pants: dk(o), boots: '#5a3a22', glove: '#6b4630', belt: '#6b4630', robe: true, trim: '#c9a24a' };
    case 'plate': return { body: '#a9b0ba', sleeve: '#a9b0ba', under: o, pants: '#5d6470', boots: '#7e8794', glove: '#5a3a22', belt: '#5a3a22', trim: '#c9a24a', plate: true };
    case 'mail': return { body: '#8f959e', sleeve: '#6b4630', under: o, pants: '#4e4436', boots: '#5a3a22', glove: '#5a3a22', belt: '#4a2f1c', mail: true };
    case 'darkrobe': return { body: '#3a3440', sleeve: '#3a3440', under: o, pants: '#2a2630', boots: '#3a2a24', glove: '#2a2630', belt: '#5a3a22', robe: true, trim: o };
    default: return { body: o, sleeve: o, under: o, pants: '#5a4a3a', boots: '#5a3a22', glove: L.skin, belt: '#5a3a22' };
  }
}

/* ======================================================== personaje */
const toonCache = new Map();
/**
 * L: { gender, skin, hair, style, eye, outfit, wear, hat, hatC, weapon, face, beard, apron }
 * dir: 0 frente · 1 espalda · 2 perfil (derecha) · f: 0-3 paso · pose: '' | 'atk'
 */
function toonSprite(L, dir = 0, f = 0, pose = '') {
  const key = JSON.stringify(L) + dir + f + pose;
  if (toonCache.has(key)) return toonCache.get(key);
  const c = document.createElement('canvas');
  c.width = TW * TRES; c.height = TH * TRES;
  X = c.getContext('2d');
  X.scale(TRES, TRES); X.translate(FX, FY);
  X.lineJoin = 'round'; X.lineCap = 'round';
  if (dir === 1) drawBack(L, f, pose); else if (dir === 2) drawSide(L, f, pose); else drawFront(L, f, pose);
  toonCache.set(key, c);
  return c;
}
const girlOf = (L) => L.gender === 'chica';
const bobOf = (f) => (f === 1 || f === 3 ? -1.5 : 0);

/* ---------------------------------------------------------- de frente */
function drawFront(L, f, pose) {
  const W = wearColors(L), girl = girlOf(L), atk = pose === 'atk';
  const lift = [0, 3, 0, -3][f], bob = bobOf(f);
  const hy = -64 + bob;                      // centro de la cabeza
  // capa / pelo largo / capucha por detrás
  if (L.cape) { toon(PL([[-15, -46 + bob], [15, -46 + bob], [23, -7], [-23, -7]]), L.cape, { sx: 2, sy: 0 }); if ((L.capeR || 0) >= 2) stroke([[-22.5, -9], [22.5, -9]], TRIMC[L.capeR], 2.2); }
  if (L.wear === 'plate') toon(PL([[-15, -44 + bob], [15, -44 + bob], [20, -6], [-20, -6]]), L.outfit, { sx: 2, sy: 0 });
  if (hasHood(L)) toon(E(0, hy + 2, 25, 24), hoodColor(L), { shade: false });
  if (!hidesHair(L) && L.style === 'largo') toon((k) => { k.moveTo(-20, hy - 6); k.quadraticCurveTo(-24, hy + 26, -16, hy + 32); k.lineTo(16, hy + 32); k.quadraticCurveTo(24, hy + 26, 20, hy - 6); k.closePath(); }, dk(L.hair), { shade: false });
  if (!hidesHair(L) && L.style === 'coleta') { toon((k) => { k.moveTo(14, hy - 8); k.quadraticCurveTo(30, hy, 24, hy + 24); k.quadraticCurveTo(18, hy + 10, 12, hy + 2); k.closePath(); }, L.hair); }
  // piernas
  if (!W.robe) {
    toon(RR(-11, -20 + bob - Math.max(0, lift), 9, 15, 3), W.pants);
    toon(RR(2, -20 + bob - Math.max(0, -lift), 9, 15, 3), W.pants);
  }
  toon(E(-7, -4.5 - Math.max(0, lift), 7, 5), W.boots);
  toon(E(7, -4.5 - Math.max(0, -lift), 7, 5), W.boots);
  if ((L.feetR || 0) >= 2) for (const [x, l] of [[-7, Math.max(0, lift)], [7, Math.max(0, -lift)]]) stroke([[x - 6, -7.5 - l], [x + 6, -7.5 - l]], TRIMC[L.feetR], 1.8);
  // cuerpo
  torsoFront(L, W, bob, girl);
  // brazo izquierdo (pantalla)
  const sw = lift * 0.6;
  armFront(-1, W, bob, sw, false);
  if (L.offhand) { const oy = -27 + bob + sw; drawWeapon(L.offhand, -20, oy, atk ? -1.2 : -0.28); toon(E(-20, oy + 1, 5, 4.8), W.glove); }
  // brazo derecho con el arma (el puño va por encima del mango)
  if (atk) { armFront(1, W, bob, 0, true, true); drawWeapon(L.weapon, 22, -32 + bob, 2.3); toon(E(22, -31 + bob, 5, 4.8), W.glove); }
  else { armFront(1, W, bob, -sw, false, true); const hy2 = -27 + bob - sw; drawWeapon(L.weapon, 20, hy2, wk(L) === 'staff' || wk(L) === 'spear' ? 0.06 : 0.28); toon(E(20, hy2 + 1, 5, 4.8), W.glove); }
  if (L.shoulderC) for (const s of [-1, 1]) { toon(E(s * 15, -42 + bob, 8.5, 6), L.shoulderC, { sx: -1.5, sy: -1.5 }); stroke([[s * 9, -40 + bob], [s * 21, -40 + bob]], dk(L.shoulderC), 1.6); shoulderDeco(L, s * 15, -42 + bob, s); }
  if ((L.handR || 0) >= 2) for (const [x, y] of [[-20, -27 + bob + sw], [atk ? 22 : 20, atk ? -32 + bob : -27 + bob - sw]]) stroke([[x - 5, y - 3], [x + 5, y - 3]], TRIMC[L.handR], 1.8);
  // cabeza
  headFront(L, hy, girl);
}
function torsoFront(L, W, bob, girl) {
  const t = -46 + bob, b = -18 + bob;
  const waist = girl ? 13 : 14.5;
  if (W.robe) {
    toon((k) => { k.moveTo(-15, t + 2); k.quadraticCurveTo(-16, t - 1, -11, t - 2); k.lineTo(11, t - 2); k.quadraticCurveTo(16, t - 1, 15, t + 2); k.lineTo(21, -6); k.quadraticCurveTo(0, -1, -21, -6); k.closePath(); }, W.body);
    stroke([[-6, b + 4], [-8, -7]], dk(W.body), 1.4); stroke([[6, b + 4], [8, -7]], dk(W.body), 1.4);
    stroke([[-20, -7], [0, -2.5], [20, -7]], W.trim, 2.2);
    if (L.wear === 'darkrobe') { stroke([[-3, t + 2], [-3, -4]], W.trim, 2); stroke([[3, t + 2], [3, -4]], W.trim, 2); }
  } else {
    toon((k) => { k.moveTo(-14, t + 2); k.quadraticCurveTo(-15, t - 1, -10, t - 2); k.lineTo(10, t - 2); k.quadraticCurveTo(15, t - 1, 14, t + 2); k.lineTo(waist, b); k.lineTo(15, b + 6); k.lineTo(-15, b + 6); k.lineTo(-waist, b); k.closePath(); }, W.body);
    if (W.mail) { X.save(); path((k) => k.rect(-14, t, 28, b - t + 6)); X.clip(); for (let y = t + 3; y < b + 6; y += 3.2) for (let x = -14 + ((y | 0) % 2) * 1.6; x < 14; x += 3.2) dot(x, y, 0.8, '#6b7079'); X.restore(); toon(PL([[-12, t], [12, t], [9, t + 6], [-9, t + 6]]), '#a9895a', { shade: false }); }
    if (L.wear === 'leather') { toon(PL([[-5, t - 1], [5, t - 1], [3, b + 2], [-3, b + 2]]), W.under, { shade: false, lw: 1.8 }); for (let y = t + 4; y < b; y += 4) stroke([[-2.5, y], [2.5, y + 2]], '#e8d0a0', 1); }
    if (W.plate) { toon(PL([[-6, t + 3], [6, t + 3], [6, -6], [0, -3], [-6, -6]]), L.outfit, { lw: 2 }); stroke([[0, t + 8], [0, t + 16]], W.trim, 2); stroke([[-3.5, t + 11], [3.5, t + 11]], W.trim, 2); }
    if (L.apron) toon(RR(-8, t + 6, 16, b - t + 6, 3), L.apron, { lw: 2 });
  }
  if (L.hat === 'hooddown') { toon(E(0, t + 1, 17, 6.5), dk(L.outfit), { shade: false }); toon(PL([[-12, t + 3], [12, t + 3], [0, t + 12]]), L.outfit, { lw: 2 }); }
  chestDeco(L, W, t, b);
  // cinturón
  toon(RR(-15, b - 1, 30, 5.5, 2), W.belt, { shade: false, lw: 2 });
  toon(RR(-3.5, b - 1.8, 7, 7, 1.5), '#c9a24a', { shade: false, lw: 1.8 });
  if (L.wear === 'leather') { toon(RR(8, b + 2, 6, 7, 2), '#6b4630', { lw: 1.6 }); }
  // hombreras
  if (W.plate) for (const s of [-1, 1]) toon(E(s * 15, t + 3, 8, 6), '#b8bfc8', { sx: s > 0 ? -2 : 2, sy: -1.5 });
  if (W.plate) for (const s of [-1, 1]) stroke([[s * 9, t + 6], [s * 21, t + 5]], W.trim, 1.6);
  if (L.wear === 'mail') for (const s of [-1, 1]) toon(E(s * 14, t + 2, 7, 4.5), '#a9895a', { shade: false });
}
function armFront(s, W, bob, sw, atk, noGlove) {
  // brazo un poco doblado: hombro -> codo -> puño
  const sx = s * 14.5, sy = -42 + bob;
  const hx = atk ? s * 22 : s * 20, hy = atk ? -32 + bob : -27 + bob + sw;
  const ex = s * 19, ey = -35 + bob + sw * 0.5;
  toon((k) => { k.moveTo(sx - 4.5 * s, sy - 1); k.quadraticCurveTo(ex + 4 * s, ey - 4, hx + 4 * s, hy); k.lineTo(hx - 4 * s, hy + 1); k.quadraticCurveTo(ex - 3 * s, ey + 2, sx - 3 * s, sy + 6); k.closePath(); }, W.sleeve, { sx: -1.5, sy: 0 });
  if (!noGlove) toon(E(hx, hy + 1, 5, 4.8), W.glove);
}
const TRIMC = [null, '#d8dce4', '#e8c060', '#e8c060', '#ffc040'];
const GEMC = [null, null, '#5aa0ff', '#c070ff', '#ffa53a'];
/** Adornos que dependen de la calidad de cada pieza (rareza 0-4). */
function chestDeco(L, W, t, b) {
  const r = L.chestR || 0; if (!r) return;
  const tc = TRIMC[r];
  stroke([[-10, t - 1.5], [-4, t + 4], [0, t + 6], [4, t + 4], [10, t - 1.5]], OUT, 4.4); stroke([[-10, t - 1.5], [-4, t + 4], [0, t + 6], [4, t + 4], [10, t - 1.5]], tc, 2.2);
  if (r >= 2) { stroke([[0, t + 6], [0, b - 1]], OUT, 4.2); stroke([[0, t + 6], [0, b - 1]], tc, 2); stroke([[-13, b - 3], [13, b - 3]], tc, 1.6); }
  if (r >= 3) { toon(PL([[0, t + 6], [4, t + 11], [0, t + 16], [-4, t + 11]]), GEMC[r], { shade: false, lw: 1.8 }); dot(-1, t + 9.5, 1.2, '#fff'); }
}
function shoulderDeco(L, x, y, s) {
  const r = L.shR || 0; if (r < 2) return;
  X.beginPath(); X.ellipse(x, y, 8.5, 6, 0, Math.PI * 1.05, Math.PI * 1.95); X.strokeStyle = TRIMC[r]; X.lineWidth = 1.8; X.stroke();
  if (r >= 3) for (const k of [-4, 1, 6]) toon(PL([[x + k * s - 2, y - 4], [x + k * s + 1 * s, y - 11 - (k === 1 ? 2 : 0)], [x + k * s + 2, y - 4]]), '#e8e4f0', { shade: false, lw: 1.6 });
  if (r >= 2) dot(x, y - 1, 1.8, GEMC[r] || TRIMC[r]);
}
function helmDeco(L, hy, side) {
  const r = L.helmR || 0; if (r < 2) return;
  const s = side ? 3 : 0;
  if (L.hat === 'helm' || L.hat === 'coif') {
    const pc = r >= 4 ? '#ffb040' : r >= 3 ? '#c070ff' : '#d9402e';
    toon((k) => { k.moveTo(-3 + s, hy - 22); k.quadraticCurveTo(side ? -14 : 2, hy - 44, side ? -16 : 14, hy - 40); k.quadraticCurveTo(side ? -6 : 8, hy - 32, 3 + s, hy - 22); k.closePath(); }, pc, { sx: -1.5, sy: 0, lw: 2 });
    if (r >= 3 && !side) for (const q of [-1, 1]) toon((k) => { k.moveTo(q * 15, hy - 14); k.quadraticCurveTo(q * 28, hy - 22, q * 26, hy - 36); k.quadraticCurveTo(q * 22, hy - 24, q * 12, hy - 20); k.closePath(); }, '#efe8d8', { sx: -1, sy: 0, lw: 2 });
  } else if (L.hat === 'hood' || L.hat === 'wizard') {
    const y = L.hat === 'wizard' ? hy - 18 : hy - 13;
    toon(PL([[s, y - 5], [s + 4, y], [s, y + 5], [s - 4, y]]), GEMC[r] || TRIMC[r], { shade: false, lw: 1.8 }); dot(s - 1, y - 1.5, 1.1, '#fff');
  }
}
/* ---------------------------------------------------------------- barbas */
const BEARDS = { ninguna: 'Sin barba', sombra: 'Sombra', perilla: 'Perilla', bigote: 'Bigote', candado: 'Candado', patillas: 'Patillas', completa: 'Completa', larga: 'Larga', vikinga: 'Vikinga' };
function moustache(c, hy, x0 = 0) {
  toon((k) => { k.moveTo(x0, hy + 9.5); k.quadraticCurveTo(x0 - 5, hy + 7.5, x0 - 10, hy + 12.5); k.quadraticCurveTo(x0 - 5, hy + 11.5, x0, hy + 11.8); k.quadraticCurveTo(x0 + 5, hy + 11.5, x0 + 10, hy + 12.5); k.quadraticCurveTo(x0 + 5, hy + 7.5, x0, hy + 9.5); k.closePath(); }, c, { shade: false, lw: 1.8 });
}
function fullBeard(c, hy, len = 28, point = false) {
  toon((k) => { k.moveTo(-14, hy + 4); k.quadraticCurveTo(-13, hy + len - 4, 0, hy + len + (point ? 6 : 0)); k.quadraticCurveTo(13, hy + len - 4, 14, hy + 4); k.quadraticCurveTo(8, hy + 10, 4, hy + 9); k.quadraticCurveTo(0, hy + 7, -4, hy + 9); k.quadraticCurveTo(-8, hy + 10, -14, hy + 4); k.closePath(); }, c, { sx: -2, sy: -1.5 });
  if (len > 30) for (const x of [-6, 0, 6]) stroke([[x, hy + 20], [x * 0.7, hy + len - 4]], dk(c), 1.4);
}
function beardFront(L, hy) {
  const c = L.beard, t = L.beardT || 'completa';
  if (t === 'sombra') { X.save(); path((k) => { k.moveTo(-17, hy - 2); k.quadraticCurveTo(-18, hy + 16, 0, hy + 18); k.quadraticCurveTo(18, hy + 16, 17, hy - 2); k.closePath(); }); X.clip(); X.globalAlpha = 0.32; X.fillStyle = c; X.fillRect(-18, hy + 6, 36, 14); X.globalAlpha = 1; for (let i = 0; i < 26; i++) dot(-12 + (i * 37) % 24, hy + 8 + ((i * 13) % 9), 0.6, dk(c)); X.restore(); return; }
  if (t === 'patillas') { for (const s of [-1, 1]) toon(PL([[s * 17, hy - 6], [s * 13, hy - 6], [s * 12, hy + 10], [s * 16.5, hy + 8]]), c, { shade: false, lw: 1.8 }); return; }
  if (t === 'perilla' || t === 'candado') toon((k) => { k.moveTo(-5.5, hy + 17.5); k.quadraticCurveTo(0, hy + 16, 5.5, hy + 17.5); k.quadraticCurveTo(4, hy + 26, 0, hy + 28); k.quadraticCurveTo(-4, hy + 26, -5.5, hy + 17.5); k.closePath(); }, c, { sx: -1, sy: -1, lw: 1.8 });
  if (t === 'candado') for (const s of [-1, 1]) stroke([[s * 9.5, hy + 12.5], [s * 6, hy + 18]], c, 2.6);
  if (t === 'bigote' || t === 'candado') { moustache(c, hy); return; }
  if (t === 'perilla') return;
  if (t === 'vikinga') { for (const s of [-1, 1]) { toon(RR(s * 8 - 3, hy + 20, 6, 22, 3), c, { sx: -1, sy: 0, lw: 1.8 }); for (const y of [hy + 26, hy + 34]) stroke([[s * 8 - 3.5, y], [s * 8 + 3.5, y]], '#c9a24a', 2); } }
  fullBeard(c, hy, t === 'larga' ? 40 : 28, t === 'larga');
  moustache(c, hy);
}
function beardSide(L, hy) {
  const c = L.beard, t = L.beardT || 'completa';
  if (t === 'sombra') { X.globalAlpha = 0.32; path((k) => { k.moveTo(-6, hy + 6); k.quadraticCurveTo(-4, hy + 20, 8, hy + 19); k.quadraticCurveTo(16, hy + 16, 16, hy + 8); k.closePath(); }); X.fillStyle = c; X.fill(); X.globalAlpha = 1; return; }
  if (t === 'patillas') { toon(PL([[-6, hy - 4], [-1, hy - 4], [0, hy + 10], [-5, hy + 8]]), c, { shade: false, lw: 1.8 }); return; }
  if (t === 'perilla' || t === 'candado') toon((k) => { k.moveTo(9, hy + 15); k.quadraticCurveTo(15, hy + 15, 15, hy + 16); k.quadraticCurveTo(14, hy + 24, 10, hy + 25); k.closePath(); }, c, { shade: false, lw: 1.8 });
  if (t === 'bigote' || t === 'candado') { toon((k) => { k.moveTo(8, hy + 9.5); k.quadraticCurveTo(14, hy + 8, 18, hy + 11.5); k.quadraticCurveTo(13, hy + 11, 8, hy + 11.5); k.closePath(); }, c, { shade: false, lw: 1.8 }); return; }
  if (t === 'perilla') return;
  const len = t === 'larga' ? 40 : 26;
  toon((k) => { k.moveTo(-6, hy + 6); k.quadraticCurveTo(-4, hy + len, 8, hy + len + (t === 'larga' ? 4 : 0)); k.quadraticCurveTo(18, hy + 18, 17, hy + 8); k.quadraticCurveTo(10, hy + 10, -6, hy + 6); k.closePath(); }, c, { sx: -2, sy: -1 });
  if (t === 'vikinga') { toon(RR(5, hy + 22, 6, 20, 3), c, { sx: -1, sy: 0, lw: 1.8 }); stroke([[4.5, hy + 30], [11.5, hy + 30]], '#c9a24a', 2); }
}
function hidesHair(L) { return L.hat === 'helm' || L.hat === 'coif' || L.hat === 'hood'; }
function hasHood(L) { return L.hat === 'hood' || L.hat === 'coif'; }
function hoodColor(L) { return L.hat === 'coif' ? '#8f959e' : (L.hatC || (L.wear === 'darkrobe' ? '#3a3440' : dk(L.outfit))); }

function headFront(L, hy, girl) {
  const skin = L.skin;
  // orejas
  if (!hasHood(L) && L.hat !== 'helm') for (const s of [-1, 1]) toon(E(s * 17.5, hy + 3, 3.4, 4.6), skin, { shade: false, lw: 2 });
  // cara
  toon((k) => { k.moveTo(-17, hy - 2); k.quadraticCurveTo(-18, hy + 16, 0, hy + 18); k.quadraticCurveTo(18, hy + 16, 17, hy - 2); k.quadraticCurveTo(17, hy - 18, 0, hy - 18); k.quadraticCurveTo(-17, hy - 18, -17, hy - 2); k.closePath(); }, skin, { sx: -3, sy: -2 });
  if (L.hat === 'hood') { X.save(); path((k) => k.ellipse(0, hy, 17, 18, 0, 0, Math.PI * 2)); X.clip(); X.fillStyle = 'rgba(30,20,40,0.38)'; X.fillRect(-20, hy - 20, 40, 14); X.restore(); }
  face(L, hy, girl);
  if (L.beard) beardFront(L, hy);
  if (!hidesHair(L)) hairFront(L, hy);
  headgear(L, hy, 0);
}
function face(L, hy, girl) {
  const e = L.face || 'alegre';
  const ey = hy + 2;
  for (const s of [-1, 1]) {
    const ex = s * 7;
    X.save();
    path(E(ex, ey, 3.6 + (girl ? 0.3 : 0), 5.2 + (girl ? 0.4 : 0))); X.fillStyle = OUT; X.fill();
    if (L.eye !== OUT && L.eye !== '#2a2220') { path(E(ex, ey + 1.2, 2.6, 3.6)); X.fillStyle = L.eye; X.fill(); path(E(ex, ey + 1.6, 1.4, 2.2)); X.fillStyle = OUT; X.fill(); }
    X.restore();
    dot(ex - 1.2, ey - 2, 1.5, '#ffffff'); dot(ex + 1.3, ey + 2.2, 0.7, '#ffffff');
    if (girl) { stroke([[ex + s * 2.6, ey - 4.4], [ex + s * 5.2, ey - 6.2]], OUT, 1.6); stroke([[ex + s * 3.4, ey - 2.4], [ex + s * 5.8, ey - 3]], OUT, 1.3); }
    // cejas
    const lw = girl ? 1.6 : 2.4;
    if (e === 'enfadado' || e === 'decidido') stroke([[ex - s * 4.5, ey - 7 + (e === 'enfadado' ? 0 : 1)], [ex + s * 3.5, ey - 9.5]], OUT, lw);
    else if (e === 'alegre') { X.beginPath(); X.arc(ex, ey - 6, 4, Math.PI * 1.15, Math.PI * 1.85); X.strokeStyle = OUT; X.lineWidth = lw; X.stroke(); }
    else stroke([[ex - 3.5, ey - 8], [ex + 3.5, ey - 8]], OUT, lw);
  }
  // mejillas
  for (const s of [-1, 1]) { path(E(s * 11, ey + 6, 3, 1.7)); X.fillStyle = 'rgba(230,110,100,0.35)'; X.fill(); }
  // boca
  const my = hy + 11.5;
  if (e === 'alegre') {
    path((k) => { k.moveTo(-5, my - 1); k.quadraticCurveTo(0, my - 1.8, 5, my - 1); k.quadraticCurveTo(4.5, my + 6, 0, my + 6.2); k.quadraticCurveTo(-4.5, my + 6, -5, my - 1); k.closePath(); });
    X.fillStyle = '#7a2a26'; X.fill(); X.save(); X.clip(); dot(0, my + 6, 3.4, '#e0706a'); X.fillStyle = '#ffffff'; X.fillRect(-4, my - 2, 8, 2); X.restore();
    path((k) => { k.moveTo(-5, my - 1); k.quadraticCurveTo(0, my - 1.8, 5, my - 1); k.quadraticCurveTo(4.5, my + 6, 0, my + 6.2); k.quadraticCurveTo(-4.5, my + 6, -5, my - 1); k.closePath(); }); X.strokeStyle = OUT; X.lineWidth = 1.8; X.stroke();
  } else if (e === 'enfadado') {
    path(RR(-5.5, my - 1, 11, 5, 2)); X.fillStyle = '#ffffff'; X.fill(); X.strokeStyle = OUT; X.lineWidth = 1.8; X.stroke();
    stroke([[-5, my + 1.5], [5, my + 1.5]], OUT, 1); for (const x of [-2, 1.5]) stroke([[x, my - 1], [x, my + 4]], OUT, 0.9);
  } else if (e === 'decidido') { X.beginPath(); X.arc(0, my + 5, 4, Math.PI * 1.2, Math.PI * 1.8); X.strokeStyle = OUT; X.lineWidth = 1.8; X.stroke(); }
  else stroke([[-3, my + 1], [3, my + 1]], OUT, 1.8);
}
function hairFront(L, hy) {
  const h = L.hair, st = L.style;
  if (st === 'rapado') { toon((k) => { k.moveTo(-16, hy - 4); k.quadraticCurveTo(-16, hy - 19, 0, hy - 19); k.quadraticCurveTo(16, hy - 19, 16, hy - 4); k.quadraticCurveTo(8, hy - 11, 0, hy - 11); k.quadraticCurveTo(-8, hy - 11, -16, hy - 4); k.closePath(); }, dk(h), { shade: false }); return; }
  if (st === 'mono') toon(E(0, hy - 21, 8, 6.5), h, { sx: -2, sy: -1.5 });
  if (st === 'pincho') for (const [x, a] of [[-10, -0.5], [0, 0], [10, 0.5]]) toon((k) => { k.moveTo(x - 7, hy - 14); k.lineTo(x + Math.sin(a) * 10, hy - 30); k.lineTo(x + 7, hy - 14); k.closePath(); }, h, { sx: -2, sy: 0 });
  // casquete con flequillo en mechones
  toon((k) => {
    k.moveTo(-19, hy + 4);
    k.quadraticCurveTo(-21, hy - 20, 0, hy - 21);
    k.quadraticCurveTo(21, hy - 20, 19, hy + 4);
    k.quadraticCurveTo(16, hy - 4, 13, hy - 6);
    k.lineTo(10, hy - 1); k.lineTo(6, hy - 8);
    k.lineTo(1, hy - 2); k.lineTo(-3, hy - 9);
    k.lineTo(-8, hy - 2); k.lineTo(-11, hy - 8);
    k.quadraticCurveTo(-16, hy - 4, -19, hy + 4);
    k.closePath();
  }, h, { sx: -3, sy: -2.5 });
  stroke([[-9, hy - 16], [-3, hy - 18]], lt(h), 2);
  if (st === 'largo') for (const s of [-1, 1]) toon((k) => { k.moveTo(s * 18, hy - 4); k.quadraticCurveTo(s * 22, hy + 14, s * 17, hy + 26); k.lineTo(s * 13, hy + 20); k.quadraticCurveTo(s * 15, hy + 8, s * 14, hy - 2); k.closePath(); }, h, { sx: s * 1.5, sy: 0 });
  if (st === 'coleta') toon(E(15, hy - 10, 3, 3), '#a8452f', { shade: false, lw: 1.6 });
  if (st === 'mono') toon(RR(-6, hy - 17, 12, 3, 1.5), '#c9a24a', { shade: false, lw: 1.6 });
}
function headgear(L, hy, side) {
  const s = side ? 1 : 0;
  if (L.hat === 'wizard') {
    const hc = L.hatC || L.outfit;
    toon((k) => { k.moveTo(-14 + s * 4, hy - 16); k.quadraticCurveTo(-8, hy - 40, 2 + s * 4, hy - 48); k.quadraticCurveTo(10, hy - 52, 20, hy - 44); k.quadraticCurveTo(12, hy - 42, 10, hy - 34); k.lineTo(15 + s * 3, hy - 16); k.closePath(); }, hc, { sx: -3, sy: 0 });
    toon(E(s * 4, hy - 15, side ? 22 : 29, 7.5), hc, { sx: -2, sy: -2 });
    toon(PL([[-13 + s * 4, hy - 22], [14 + s * 4, hy - 22], [15 + s * 3, hy - 16], [-14 + s * 4, hy - 16]]), '#6b4630', { shade: false, lw: 2 });
  } else if (L.hat === 'helm') {
    const m = L.hatC || '#9aa1ac';
    toon((k) => { k.moveTo(-19 + s * 3, hy - 1); k.quadraticCurveTo(-20 + s * 3, hy - 24, 0 + s * 3, hy - 24); k.quadraticCurveTo(20 + s * 3, hy - 24, 19 + s * 3, hy - 1); k.lineTo(13 + s * 3, hy - 3); k.quadraticCurveTo(0, hy - 7, -13 + s * 3, hy - 3); k.closePath(); }, m, { sx: -3, sy: -2 });
    if (!side) { toon(RR(-2.2, hy - 6, 4.4, 13, 2), m, { shade: false, lw: 2 }); for (const x of [-15, -7, 7, 15]) dot(x, hy - 5, 1.2, OUT); }
    else toon(RR(15, hy - 6, 4, 12, 2), m, { shade: false, lw: 2 });
    stroke([[-19 + s * 3, hy - 2], [19 + s * 3, hy - 2]], '#c9a24a', 2);
    stroke([[0 + s * 3, hy - 23], [0 + s * 3, hy - 9]], '#b8bfc8', 2);
  } else if (L.hat === 'coif') {
    const m = L.hatC || '#8f959e';
    toon((k) => { k.moveTo(-21 + s * 2, hy + 14); k.quadraticCurveTo(-23, hy - 22, 0 + s * 2, hy - 22); k.quadraticCurveTo(23, hy - 22, 21 + s * 2, hy + 14); k.lineTo(14 + s * 4, hy + 12); k.quadraticCurveTo(15 + s * 4, hy - 9, 0 + s * 6, hy - 10); k.quadraticCurveTo(-15 + s * 6, hy - 9, -14 + s * 8, hy + 12); k.closePath(); }, m, { sx: -3, sy: -2 });
    X.save(); path((k) => k.ellipse(s * 2, hy - 4, 22, 20, 0, 0, Math.PI * 2)); X.clip();
    for (let y = hy - 20; y < hy + 14; y += 3.4) for (let x = -22 + ((y | 0) % 2) * 1.7; x < 22; x += 3.4) if (Math.hypot(x - s * 6, (y - hy + 1) * 0.9) > 14.5) dot(x + s * 2, y, 0.8, '#5d636c');
    X.restore();
  } else if (L.hat === 'hood') {
    const hc = hoodColor(L);
    toon((k) => { k.moveTo(-22 + s * 2, hy + 14); k.quadraticCurveTo(-24, hy - 26, 2 + s * 2, hy - 26); k.quadraticCurveTo(24, hy - 24, 22 + s * 2, hy + 14); k.lineTo(15 + s * 4, hy + 10); k.quadraticCurveTo(16 + s * 4, hy - 12, 0 + s * 6, hy - 13); k.quadraticCurveTo(-16 + s * 6, hy - 12, -15 + s * 8, hy + 10); k.closePath(); }, hc, { sx: -3, sy: -2 });
    if (L.wear === 'darkrobe') stroke([[-15 + s * 8, hy + 10], [-16 + s * 6, hy - 10], [0 + s * 6, hy - 13], [16 + s * 4, hy - 10], [15 + s * 4, hy + 10]], L.outfit, 1.8);
  } else if (L.hat === 'cap') {
    const hc = L.hatC;
    toon((k) => { k.moveTo(-18 + s * 2, hy - 6); k.quadraticCurveTo(-18, hy - 24, 0 + s * 2, hy - 24); k.quadraticCurveTo(18, hy - 24, 18 + s * 2, hy - 6); k.closePath(); }, hc, { sx: -2.5, sy: -2 });
    toon(E(s ? 16 : 0, hy - 7, side ? 12 : 24, 4.5), dk(hc), { shade: false });
    if (L.feather) toon((k) => { k.moveTo(12, hy - 14); k.quadraticCurveTo(30, hy - 30, 22, hy - 36); k.quadraticCurveTo(20, hy - 24, 10, hy - 18); k.closePath(); }, '#e8dcc0', { shade: false, lw: 1.8 });
  } else if (L.hat === 'hooddown') {
    // capucha bajada sobre los hombros (se dibuja en el torso)
  }
  helmDeco(L, hy, side);
}

/* ---------------------------------------------------------- de espaldas */
function drawBack(L, f, pose) {
  const W = wearColors(L);
  const lift = [0, 3, 0, -3][f], bob = bobOf(f);
  const hy = -64 + bob;
  drawWeapon(L.weapon, -17, -20 + bob, -0.12 + (pose === 'atk' ? -0.8 : 0));
  if (L.offhand) drawWeapon(L.offhand, 17, -20 + bob, 0.12);
  if (!W.robe) { toon(RR(-11, -20 + bob - Math.max(0, lift), 9, 15, 3), W.pants); toon(RR(2, -20 + bob - Math.max(0, -lift), 9, 15, 3), W.pants); }
  toon(E(-7, -4.5 - Math.max(0, lift), 7, 5), W.boots); toon(E(7, -4.5 - Math.max(0, -lift), 7, 5), W.boots);
  if (W.robe) toon((k) => { k.moveTo(-15, -44 + bob); k.lineTo(15, -44 + bob); k.lineTo(21, -6); k.quadraticCurveTo(0, -1, -21, -6); k.closePath(); }, W.body);
  else toon(PL([[-14, -44 + bob], [14, -44 + bob], [15, -12 + bob], [-15, -12 + bob]]), W.body);
  toon(RR(-15, -19 + bob, 30, 5.5, 2), W.belt, { shade: false, lw: 2 });
  if (L.wear === 'plate') toon(PL([[-14, -44 + bob], [14, -44 + bob], [19, -8], [-19, -8]]), L.outfit, { sx: 2, sy: 0 });
  if (L.hat === 'hooddown') toon(E(0, -42 + bob, 13, 6), dk(L.outfit), { shade: false });
  for (const s of [-1, 1]) { toon(PL([[s * 15 - 4, -42 + bob], [s * 15 + 4, -42 + bob], [s * 17 + 3.5, -22 + bob], [s * 17 - 3.5, -22 + bob]]), W.sleeve, { sx: -1.5, sy: 0 }); toon(E(s * 17, -21 + bob, 4.6, 4.4), W.glove); }
  if (L.cape) { toon((k) => { k.moveTo(-15, -46 + bob); k.lineTo(15, -46 + bob); k.lineTo(22, -6); k.quadraticCurveTo(0, -2, -22, -6); k.closePath(); }, L.cape, { sx: -3, sy: 0 }); stroke([[-5, -40 + bob], [-7, -9]], dk(L.cape), 1.8); stroke([[6, -40 + bob], [8, -9]], dk(L.cape), 1.8);
    const cr = L.capeR || 0;
    if (cr >= 2) stroke([[-21, -7.5], [0, -3.5], [21, -7.5]], TRIMC[cr], 2.4);
    if (cr >= 3) { toon(E(0, -28 + bob, 6.5, 7), TRIMC[cr], { shade: false, lw: 2 }); toon(PL([[0, -33 + bob], [3.5, -28 + bob], [0, -23 + bob], [-3.5, -28 + bob]]), GEMC[cr], { shade: false, lw: 1.4 }); } }
  if (L.shoulderC) for (const s of [-1, 1]) { toon(E(s * 15, -42 + bob, 8.5, 6), L.shoulderC, { sx: -1.5, sy: -1.5 }); shoulderDeco(L, s * 15, -42 + bob, s); }
  // cabeza de espaldas
  const hairC = hidesHair(L) ? (L.hat === 'helm' ? '#9aa1ac' : hoodColor(L)) : L.hair;
  toon(E(0, hy, 18.5, 19), hairC, { sx: -3, sy: -2 });
  if (!hidesHair(L)) {
    if (L.style === 'largo') toon((k) => { k.moveTo(-18, hy); k.quadraticCurveTo(-20, hy + 26, -14, hy + 30); k.lineTo(14, hy + 30); k.quadraticCurveTo(20, hy + 26, 18, hy); k.closePath(); }, L.hair);
    if (L.style === 'coleta') toon((k) => { k.moveTo(-4, hy + 6); k.quadraticCurveTo(-6, hy + 28, 0, hy + 30); k.quadraticCurveTo(6, hy + 28, 4, hy + 6); k.closePath(); }, L.hair);
    if (L.style === 'mono') toon(E(0, hy - 20, 8, 6.5), L.hair);
    if (L.style === 'pincho') for (const x of [-10, 0, 10]) toon(PL([[x - 7, hy - 12], [x, hy - 28], [x + 7, hy - 12]]), L.hair, { sx: -2, sy: 0 });
    stroke([[-8, hy - 12], [-2, hy - 15]], lt(L.hair), 2);
  }
  if (L.hat === 'wizard') { const hc = L.hatC || L.outfit; toon((k) => { k.moveTo(-14, hy - 16); k.quadraticCurveTo(-8, hy - 40, 2, hy - 48); k.quadraticCurveTo(10, hy - 52, 20, hy - 44); k.quadraticCurveTo(12, hy - 42, 10, hy - 34); k.lineTo(15, hy - 16); k.closePath(); }, hc); toon(E(0, hy - 15, 29, 7.5), hc, { sx: -2, sy: -2 }); }
  if (L.hat === 'cap') toon(E(0, hy - 10, 19, 12), L.hatC);
}

/* ------------------------------------------------------------ de perfil */
function drawSide(L, f, pose) {
  const W = wearColors(L), girl = girlOf(L), atk = pose === 'atk';
  const st = [0, 5, 0, -5][f], bob = bobOf(f);
  const hy = -64 + bob;
  if (L.cape) toon(PL([[-7, -45 + bob], [5, -45 + bob], [-6, -7], [-24 - Math.abs(st) * 0.6, -10]]), L.cape, { sx: 2, sy: 0 });
  if (!hidesHair(L) && L.style === 'largo') toon((k) => { k.moveTo(-16, hy - 6); k.quadraticCurveTo(-22, hy + 22, -12, hy + 30); k.lineTo(2, hy + 26); k.lineTo(0, hy); k.closePath(); }, dk(L.hair), { shade: false });
  if (!hidesHair(L) && L.style === 'coleta') toon((k) => { k.moveTo(-14, hy - 8); k.quadraticCurveTo(-32, hy, -24, hy + 24); k.quadraticCurveTo(-18, hy + 8, -10, hy + 2); k.closePath(); }, L.hair);
  if (L.wear === 'plate') toon(PL([[-10, -44 + bob], [4, -44 + bob], [-4, -6], [-20, -8]]), L.outfit, { sx: 2, sy: 0 });
  // brazo de atrás
  toon(PL([[-3, -42 + bob], [4, -42 + bob], [2 - st * 0.5, -22 + bob], [-5 - st * 0.5, -22 + bob]]), dk(W.sleeve), { shade: false });
  // piernas
  if (!W.robe) { toon(RR(-6 - st, -20 + bob, 9, 15, 3), dk(W.pants), { shade: false }); toon(RR(-3 + st, -20 + bob, 9, 15, 3), W.pants); }
  toon(E(-2 - st, -4.5, 7.5, 5), dk(W.boots), { shade: false }); toon(E(2 + st, -4.5, 7.5, 5), W.boots);
  // cuerpo
  if (W.robe) { toon((k) => { k.moveTo(-10, -44 + bob); k.lineTo(10, -44 + bob); k.lineTo(15, -6); k.quadraticCurveTo(0, -2, -15, -6); k.closePath(); }, W.body); stroke([[-14, -7], [14, -7]], W.trim, 2.2); }
  else { toon(PL([[-10, -44 + bob], [10, -44 + bob], [11, -12 + bob], [-11, -12 + bob]]), W.body); if (W.mail) { X.save(); path((k) => k.rect(-10, -44 + bob, 20, 32)); X.clip(); for (let y = -42 + bob; y < -12 + bob; y += 3.2) for (let x = -10 + ((y | 0) % 2) * 1.6; x < 10; x += 3.2) dot(x, y, 0.8, '#6b7079'); X.restore(); } }
  if (L.apron) toon(RR(2, -38 + bob, 9, 26, 3), L.apron, { lw: 2 });
  toon(RR(-11, -19 + bob, 22, 5.5, 2), W.belt, { shade: false, lw: 2 });
  toon(RR(6, -20 + bob, 6, 7, 1.5), '#c9a24a', { shade: false, lw: 1.6 });
  if (W.plate) toon(E(0, -41 + bob, 9, 6.5), '#b8bfc8', { sx: -2, sy: -1.5 });
  if (L.shoulderC) { toon(E(0, -42 + bob, 9.5, 6.5), L.shoulderC, { sx: -2, sy: -1.5 }); shoulderDeco(L, 0, -42 + bob, 1); }
  if (L.hat === 'hooddown') toon(E(-4, -43 + bob, 10, 5), dk(L.outfit), { shade: false });
  // cabeza de perfil
  if (!hidesHair(L)) toon(E(-6, hy - 2, 15, 17), L.hair, { shade: false });
  toon((k) => { k.moveTo(-14, hy - 2); k.quadraticCurveTo(-14, hy + 16, 4, hy + 17); k.quadraticCurveTo(14, hy + 16, 17, hy + 6); k.lineTo(19, hy + 4); k.quadraticCurveTo(18, hy - 18, 0, hy - 18); k.quadraticCurveTo(-14, hy - 18, -14, hy - 2); k.closePath(); }, L.skin, { sx: -2.5, sy: -2 });
  if (!hasHood(L) && L.hat !== 'helm') toon(E(-4, hy + 3, 3.4, 4.6), L.skin, { shade: false, lw: 2 });
  if (L.hat === 'hood') { X.save(); path((k) => k.ellipse(2, hy, 17, 18, 0, 0, Math.PI * 2)); X.clip(); X.fillStyle = 'rgba(30,20,40,0.38)'; X.fillRect(-20, hy - 20, 40, 14); X.restore(); }
  // ojo
  const e = L.face || 'alegre', ex = 9, ey = hy + 2;
  path(E(ex, ey, 3.2, 5.2)); X.fillStyle = OUT; X.fill();
  if (L.eye !== '#2a2220') { path(E(ex + 0.4, ey + 1.2, 2.2, 3.6)); X.fillStyle = L.eye; X.fill(); }
  dot(ex - 0.8, ey - 2, 1.4, '#fff');
  if (girl) stroke([[ex + 2.4, ey - 4.4], [ex + 5, ey - 6]], OUT, 1.6);
  if (e === 'enfadado' || e === 'decidido') stroke([[ex - 4, ey - 9.5], [ex + 4, ey - 7]], OUT, girl ? 1.6 : 2.4);
  else { X.beginPath(); X.arc(ex, ey - 6, 4, Math.PI * 1.15, Math.PI * 1.85); X.strokeStyle = OUT; X.lineWidth = girl ? 1.6 : 2.4; X.stroke(); }
  path(E(10, ey + 6, 2.6, 1.6)); X.fillStyle = 'rgba(230,110,100,0.35)'; X.fill();
  if (e === 'alegre') { path((k) => { k.moveTo(9, hy + 10.5); k.quadraticCurveTo(16, hy + 10, 16, hy + 11); k.quadraticCurveTo(14, hy + 16, 10, hy + 14); k.closePath(); }); X.fillStyle = '#7a2a26'; X.fill(); X.strokeStyle = OUT; X.lineWidth = 1.6; X.stroke(); }
  else stroke([[11, hy + 12], [15, hy + 11.5]], OUT, 1.6);
  if (L.beard) beardSide(L, hy);
  if (!hidesHair(L)) {
    if (L.style === 'rapado') toon((k) => { k.moveTo(-14, hy); k.quadraticCurveTo(-14, hy - 19, 2, hy - 19); k.quadraticCurveTo(16, hy - 19, 16, hy - 8); k.quadraticCurveTo(4, hy - 12, -6, hy - 8); k.closePath(); }, dk(L.hair), { shade: false });
    else {
      if (L.style === 'mono') toon(E(-4, hy - 21, 8, 6.5), L.hair);
      if (L.style === 'pincho') for (const x of [-10, -1, 8]) toon(PL([[x - 7, hy - 13], [x - 4, hy - 30], [x + 7, hy - 14]]), L.hair, { sx: -2, sy: 0 });
      toon((k) => { k.moveTo(-16, hy + 8); k.quadraticCurveTo(-20, hy - 20, 2, hy - 21); k.quadraticCurveTo(20, hy - 20, 18, hy - 4); k.lineTo(13, hy - 7); k.lineTo(10, hy - 1); k.lineTo(5, hy - 8); k.lineTo(0, hy - 3); k.quadraticCurveTo(-4, hy - 4, -6, hy + 4); k.quadraticCurveTo(-10, hy + 2, -16, hy + 8); k.closePath(); }, L.hair, { sx: -3, sy: -2.5 });
      stroke([[-6, hy - 16], [2, hy - 18]], lt(L.hair), 2);
    }
  }
  headgear(L, hy, 1);
  // brazo delantero y arma
  if (atk) { toon(PL([[-2, -42 + bob], [5, -42 + bob], [20, -36 + bob], [18, -29 + bob]]), W.sleeve, { sx: -1.5, sy: 0 }); drawWeapon(L.weapon, 21, -32 + bob, 1.45); toon(E(21, -32 + bob, 4.6, 4.4), W.glove); }
  else { const hx = 7 + st * 0.6, hy2 = -26 + bob; toon(PL([[-3, -42 + bob], [5, -42 + bob], [hx + 4, hy2], [hx - 3, hy2 + 1]]), W.sleeve, { sx: -1.5, sy: 0 }); drawWeapon(L.weapon, hx, hy2, wk(L) === 'staff' || wk(L) === 'spear' ? 0.06 : 0.3); toon(E(hx, hy2 + 1, 5, 4.8), W.glove); }
}

/* ------------------------------------------------------- aspecto héroe */
const wk = (L) => (typeof L.weapon === 'string' ? L.weapon : L.weapon?.kind);
function heroLook(o, wpn) {
  const K = CLASSES[o.cls];
  // se empieza con ropa sencilla: la armadura y los cascos se consiguen jugando
  const bd = o.gender === 'chico' && o.beard && o.beard !== 'ninguna';
  return { gender: o.gender, skin: o.skin, hair: o.hair, style: o.style, eye: o.eye, outfit: o.outfit, wear: 'tunic', hat: null, weapon: wpn || K.weapon, face: o.face, beard: bd ? o.hair : null, beardT: bd ? o.beard : null };
}
