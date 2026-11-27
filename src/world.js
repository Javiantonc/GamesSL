'use strict';
/* =====================================================================
   MUNDO GRANDE (9600 × 6400) dividido en regiones:
     centro  · Pradera de Albor (el pueblo)
     norte   · Bosque Sombrío
     este    · Colinas Rocosas
     sur     · Costa de los Lagos
     oeste   · Pradera Salvaje
   El suelo se dibuja por trozos (chunks) a medida que te acercas.
   ===================================================================== */
const WORLD_W = 9600, WORLD_H = 6400, CX = 4800, CY = 3200;
const HS = 1.6;                       // escala de las casas respecto a su dibujo
function wrng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function cnv(w, h, k = 2) { const c = document.createElement('canvas'); c.width = w * k; c.height = h * k; const x = c.getContext('2d'); x.scale(k, k); x.lineJoin = 'round'; x.lineCap = 'round'; return [c, x]; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ------------------------------------------------------------ escenas */
// Cada lugar (mundo, interior de casa, mazmorra) es una escena con sus
// propios objetos, sólidos, monstruos y PNJ.
const CELL = 200;
function newScene(id, kind, W, H, name) {
  return { id, kind, W, H, name, objects: [], grid: new Map(), lights: [], chimneys: [], mobs: [], npcs: [], doors: [], nodes: [], portals: [], fish: [] };
}
function addSolid(S, s) {
  for (let i = Math.floor(s.x / CELL); i <= Math.floor((s.x + s.w) / CELL); i++)
    for (let j = Math.floor(s.y / CELL); j <= Math.floor((s.y + s.h) / CELL); j++) {
      const k = i + ',' + j; if (!S.grid.has(k)) S.grid.set(k, []); S.grid.get(k).push(s);
    }
}
function solidAt(S, x, y) {
  const L = S.grid.get(Math.floor(x / CELL) + ',' + Math.floor(y / CELL));
  if (L) for (const s of L) if (x + 10 > s.x && x - 10 < s.x + s.w && y > s.y && y - 8 < s.y + s.h) return true;
  // el héroe ocupa ±10: mira también la celda vecina en x
  const L2 = S.grid.get(Math.floor((x + (x % CELL < 20 ? -20 : 20)) / CELL) + ',' + Math.floor(y / CELL));
  if (L2 && L2 !== L) for (const s of L2) if (x + 10 > s.x && x - 10 < s.x + s.w && y > s.y && y - 8 < s.y + s.h) return true;
  return false;
}
function place(S, img, x, y, o = {}) {
  const w = (o.w || img.width / 2), h = (o.h || img.height / 2);
  const obj = { img, x, y, w, h, ...o };
  S.objects.push(obj);
  if (o.solid) addSolid(S, { x: x + o.solid[0], y: y + o.solid[1], w: o.solid[2], h: o.solid[3] });
  return obj;
}

/* ---------------------------------------------------- agua y caminos */
const POND = { x: CX - 1150, y: CY + 620, rx: 260, ry: 150 };
const LAKES = [POND,
  { x: CX + 1700, y: CY + 2380, rx: 720, ry: 360 }, { x: CX - 3300, y: CY + 700, rx: 520, ry: 320 },
  { x: CX - 1500, y: CY - 2350, rx: 460, ry: 270 }, { x: CX + 3150, y: CY - 1650, rx: 400, ry: 250 },
  { x: CX - 2500, y: CY + 2450, rx: 560, ry: 300 }, { x: CX + 3650, y: CY + 1350, rx: 380, ry: 240 },
  { x: CX - 300, y: CY + 2600, rx: 420, ry: 220 }];
const inLake = (x, y, m = 0) => { for (const L of LAKES) if (((x - L.x) / (L.rx + m)) ** 2 + ((y - L.y) / (L.ry + m)) ** 2 < 1) return L; return null; };
const inPond = inLake;
const roadV = (x, y, w = 34) => Math.abs(x - CX - Math.sin(y * 0.004) * 30 - Math.sin(y * 0.0011) * 140 * Math.min(1, Math.abs(y - CY) / 1500)) < w;
const roadH = (x, y, w = 34) => Math.abs(y - CY - 60 - Math.sin(x * 0.0035) * 26 - Math.sin(x * 0.0009) * 120 * Math.min(1, Math.abs(x - CX) / 1500)) < w;
// centro de cada carretera (para colocar los pueblos encima)
const roadX = (y) => CX + Math.sin(y * 0.004) * 30 + Math.sin(y * 0.0011) * 140 * Math.min(1, Math.abs(y - CY) / 1500);
const roadY = (x) => CY + 60 + Math.sin(x * 0.0035) * 26 + Math.sin(x * 0.0009) * 120 * Math.min(1, Math.abs(x - CX) / 1500);
/* Pueblos: Albor en el centro y uno más pequeño en cada región, sobre las carreteras. */
const TOWNS = [
  { id: 'albor', name: 'Albor', x: CX, y: CY + 40, rx: 820, ry: 600, main: true },
  { id: 'roble', name: 'Refugio del Roble', y: CY - 2050, zone: 'bosque', seed: 11 },
  { id: 'pico', name: 'Picoférreo', x: CX + 2650, zone: 'colinas', seed: 22 },
  { id: 'lirio', name: 'Puerto Lirio', y: CY + 1850, zone: 'costa', seed: 33 },
  { id: 'viento', name: 'Campamento Viento', x: CX - 2350, zone: 'salvaje', seed: 44 },
].map((t) => (t.main ? t : { ...t, x: t.x ?? roadX(t.y), y: t.y ?? roadY(t.x) - 60, rx: 560, ry: 420 }));
const plaza = (x, y, m = 0) => TOWNS.some((t) => ((x - t.x) / ((t.main ? 250 : 190) + m)) ** 2 + ((y - t.y) / ((t.main ? 165 : 125) + m)) ** 2 < 1);
const townAt = (x, y, k = 1) => TOWNS.find((t) => ((x - t.x) / (t.rx * k)) ** 2 + ((y - t.y - (t.main ? 20 : 0)) / (t.ry * k)) ** 2 < 1);
const safeZone = (x, y, k = 1) => !!townAt(x, y, k);
const onPath = (x, y, m = 0) => (plaza(x, y, m) || roadV(x, y, 34 + m) || roadH(x, y, 34 + m)) && !inLake(x, y, 30);
const villageZone = (x, y, k = 1) => ((x - CX) / (820 * k)) ** 2 + ((y - CY - 60) / (600 * k)) ** 2 < 1;

/* ------------------------------------------------------------ regiones */
const ZONES = {
  pradera: { name: 'Pradera de Albor', col: [134, 178, 90] },
  bosque: { name: 'Bosque Sombrío', col: [78, 122, 66] },
  colinas: { name: 'Colinas Rocosas', col: [166, 158, 108] },
  costa: { name: 'Costa de los Lagos', col: [118, 178, 112] },
  salvaje: { name: 'Pradera Salvaje', col: [178, 182, 92] },
};
/** Pesos de cada región en un punto (suman 1). */
function zoneW(x, y) {
  const dx = x - CX, dy = (y - CY) * 1.5, d = Math.hypot(dx, dy);
  const t = smooth(800, 1900, d), a = Math.atan2(dy, dx);
  const e = Math.max(0, Math.cos(a)) ** 2, w = Math.max(0, -Math.cos(a)) ** 2, s = Math.max(0, Math.sin(a)) ** 2, n = Math.max(0, -Math.sin(a)) ** 2;
  return { pradera: 1 - t, colinas: e * t, salvaje: w * t, costa: s * t, bosque: n * t };
}
function zoneAt(x, y) { const W = zoneW(x, y); let b = 'pradera', bv = -1; for (const k in W) if (W[k] > bv) { bv = W[k]; b = k; } return b; }
const distC = (x, y) => Math.hypot(x - CX, (y - CY) * 1.45);
/** Nivel de la zona (1-5) según la distancia al pueblo. */
const tierAt = (x, y) => clamp(1 + Math.floor((distC(x, y) - 900) / 750), 1, 5);
/** Nivel de los monstruos según la distancia al pueblo (1-20). */
const mobLvlAt = (x, y) => clamp(1 + Math.floor((distC(x, y) - 800) / 230), 1, 20);

/* --------------------------------------------- suelo dibujado por trozos */
const CH = 800, GK = 0.5, ZS = 50;
let ZMAP;
function buildZoneMap() {
  const w = WORLD_W / ZS, h = WORLD_H / ZS, c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'), img = x.createImageData(w, h), r = wrng(5);
  const noise = new Float32Array((w + 1) * (h + 1)); for (let i = 0; i < noise.length; i++) noise[i] = r();
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const W = zoneW(i * ZS + 25, j * ZS + 25); let R = 0, G = 0, B = 0;
    for (const k in W) { R += ZONES[k].col[0] * W[k]; G += ZONES[k].col[1] * W[k]; B += ZONES[k].col[2] * W[k]; }
    const n = (noise[j * w + i] + noise[(j >> 1) * w + (i >> 1)] * 2) / 3 - 0.5, p = (j * w + i) * 4;
    img.data[p] = R + n * 16; img.data[p + 1] = G + n * 18; img.data[p + 2] = B + n * 10; img.data[p + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  ZMAP = c;
}
const chunks = new Map();
function lakeArt(x, L, li) {
  x.beginPath(); x.ellipse(L.x, L.y, L.rx + 22, L.ry + 18, 0, 0, 7); x.fillStyle = '#e0cc94'; x.fill();
  x.beginPath(); x.ellipse(L.x, L.y, L.rx, L.ry, 0, 0, 7);
  const wg = x.createLinearGradient(0, L.y - L.ry, 0, L.y + L.ry); wg.addColorStop(0, '#5f9fd0'); wg.addColorStop(1, '#3f7ab0');
  x.fillStyle = wg; x.fill(); x.lineWidth = 4; x.strokeStyle = '#2a2220'; x.stroke();
  x.beginPath(); x.ellipse(L.x, L.y + 6, L.rx - 8, L.ry - 8, 0, Math.PI * 1.05, Math.PI * 1.95); x.lineWidth = 6; x.strokeStyle = 'rgba(40,60,100,.35)'; x.stroke();
  const r = wrng(300 + li), n = 5 + Math.floor(L.rx / 90);
  for (let i = 0; i < n; i++) {
    const a = r() * 6.28, d = 0.45 + r() * 0.4, px = L.x + Math.cos(a) * L.rx * d, py = L.y + Math.sin(a) * L.ry * d;
    x.beginPath(); x.ellipse(px, py, 16, 10, 0, 0.3, Math.PI * 2 - 0.1); x.lineTo(px, py); x.closePath(); x.fillStyle = '#6a9a48'; x.fill(); x.lineWidth = 2.4; x.strokeStyle = '#2a2220'; x.stroke();
    if (i % 2) { x.beginPath(); x.arc(px + 4, py - 3, 4, 0, 7); x.fillStyle = '#f2a0b8'; x.fill(); x.stroke(); }
  }
}
function buildChunk(i, j) {
  const c = document.createElement('canvas'); c.width = CH * GK; c.height = CH * GK;
  const x = c.getContext('2d'), x0 = i * CH, y0 = j * CH;
  x.scale(GK, GK); x.translate(-x0, -y0);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(ZMAP, x0 / ZS - 2, y0 / ZS - 2, CH / ZS + 4, CH / ZS + 4, x0 - 100, y0 - 100, CH + 200, CH + 200);
  const r = wrng(i * 977 + j * 131 + 7);
  for (let k = 0; k < 16; k++) {
    const px = x0 + r() * CH, py = y0 + r() * CH, rad = 80 + r() * 200;
    const gr = x.createRadialGradient(px, py, 0, px, py, rad), col = r() > 0.5 ? '0,0,0' : '255,255,220';
    gr.addColorStop(0, `rgba(${col},0.06)`); gr.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = gr; x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }
  // caminos
  for (const [fill, grow] of [['#8a6a40', 5], ['#c9a46a', 0]]) {
    x.fillStyle = fill;
    for (let y = y0 - 6; y < y0 + CH + 6; y += 6) for (let xx = x0 - 6; xx < x0 + CH + 6; xx += 6) if (onPath(xx, y, grow)) x.fillRect(xx - 1, y - 1, 8, 8);
  }
  for (let k = 0; k < 260; k++) {
    const px = x0 + r() * CH, py = y0 + r() * CH;
    if (!onPath(px, py, -6)) continue;
    const s = 2 + r() * 4; x.beginPath(); x.ellipse(px, py, s, s * 0.7, 0, 0, 7); x.fillStyle = r() > 0.5 ? '#b8935a' : '#ddbb82'; x.fill();
  }
  // losas de las plazas
  for (const T0 of TOWNS) if (Math.abs(x0 + CH / 2 - T0.x) < CH && Math.abs(y0 + CH / 2 - T0.y) < CH) {
    const p = wrng(77 + (T0.seed || 0)), big = T0.main ? 1 : 0.76;
    for (let k = 0; k < (T0.main ? 160 : 100); k++) {
      const a = p() * Math.PI * 2, d = Math.sqrt(p()), px = T0.x + Math.cos(a) * 230 * big * d, py = T0.y + Math.sin(a) * 150 * big * d, w = 26 + p() * 8, h = 16 + p() * 4, cc = p() > 0.5;
      x.beginPath(); x.roundRect(px - 14, py - 9, w, h, 5); x.fillStyle = cc ? '#b9a98a' : '#a8987a'; x.fill(); x.lineWidth = 2; x.strokeStyle = '#8a7a5e'; x.stroke();
    }
  }
  LAKES.forEach((L, li) => { if (L.x + L.rx + 40 > x0 && L.x - L.rx - 40 < x0 + CH && L.y + L.ry + 40 > y0 && L.y - L.ry - 40 < y0 + CH) lakeArt(x, L, li); });
  // hierba, flores y piedrecitas según la región
  for (let k = 0; k < 340; k++) {
    const px = x0 + r() * CH, py = y0 + r() * CH;
    if (onPath(px, py, 6) || inLake(px, py, 26)) continue;
    const z = zoneAt(px, py), q = r();
    if (z === 'colinas' && q < 0.35) { x.beginPath(); x.ellipse(px, py, 4 + r() * 5, 3 + r() * 3, 0, 0, 7); x.fillStyle = r() > 0.5 ? '#9a9488' : '#b8b0a0'; x.fill(); x.lineWidth = 1.6; x.strokeStyle = '#5a5248'; x.stroke(); continue; }
    if (q < (z === 'salvaje' ? 0.55 : 0.75)) {
      x.strokeStyle = z === 'bosque' ? (r() > 0.5 ? '#3f6a34' : '#4a7a3e') : z === 'salvaje' ? (r() > 0.5 ? '#8a9a40' : '#9aa84a') : (r() > 0.5 ? '#5f8a3e' : '#6e9a48');
      x.lineWidth = 2.4; x.beginPath(); x.moveTo(px - 5, py - 6); x.lineTo(px - 1, py + 2); x.lineTo(px + 1, py - 9); x.lineTo(px + 3, py + 2); x.lineTo(px + 7, py - 5); x.stroke();
    } else {
      const pal = z === 'bosque' ? ['#b89ae0', '#7ab0e0', '#e8e0c0'] : z === 'salvaje' ? ['#f2d05a', '#f09a4a', '#f4f0e0'] : ['#f4f0e0', '#f2d05a', '#e8829a', '#b89ae0'];
      const col = pal[(r() * pal.length) | 0];
      for (let m = 0; m < 5; m++) { const a = (m / 5) * Math.PI * 2; x.beginPath(); x.arc(px + Math.cos(a) * 3.4, py + Math.sin(a) * 3.4, 2.6, 0, 7); x.fillStyle = col; x.fill(); }
      x.beginPath(); x.arc(px, py, 2, 0, 7); x.fillStyle = '#e0a030'; x.fill();
    }
  }
  return c;
}
function getChunk(i, j) {
  const k = i + ',' + j;
  let c = chunks.get(k);
  if (!c) { c = buildChunk(i, j); chunks.set(k, c); if (chunks.size > 48) chunks.delete(chunks.keys().next().value); }
  else { chunks.delete(k); chunks.set(k, c); }
  return c;
}
/** Prepara un trozo cercano al jugador (uno por fotograma, para no dar tirones). */
function warmChunks(x, y) {
  const ci = Math.floor(x / CH), cj = Math.floor(y / CH);
  for (let dj = -1; dj <= 1; dj++) for (let di = -2; di <= 2; di++) {
    const i = ci + di, j = cj + dj;
    if (i < 0 || j < 0 || i >= WORLD_W / CH || j >= WORLD_H / CH || chunks.has(i + ',' + j)) continue;
    getChunk(i, j); return;
  }
}

/* --------------------------------------------------------------- árboles */
function treeArt(kind, seed) {
  const r = wrng(seed);
  const [c, x] = cnv(150, 190); X = x;
  const cx = 75, by = 184;
  if (kind === 'pino' || kind === 'abeto') {
    toon(RR(cx - 7, by - 34, 14, 34, 4), '#7a5236', { sx: -3, sy: 0 });
    const cols = kind === 'abeto' ? ['#2f5f44', '#386a4c'] : ['#3f7a4a', '#47855a'];
    for (let i = 0; i < 4; i++) {
      const y = by - 30 - i * 32, w = 62 - i * 12;
      toon((k) => { k.moveTo(cx - w, y); k.quadraticCurveTo(cx - w * 0.5, y - 14, cx, y - 58 + i * 4); k.quadraticCurveTo(cx + w * 0.5, y - 14, cx + w, y); k.quadraticCurveTo(cx, y + 10, cx - w, y); k.closePath(); }, cols[i % 2], { sx: -8, sy: -3 });
    }
  } else if (kind === 'seco') {
    toon((k) => { k.moveTo(cx - 10, by); k.lineTo(cx - 6, by - 90); k.lineTo(cx + 6, by - 90); k.lineTo(cx + 11, by); k.closePath(); }, '#6a5040', { sx: -4, sy: 0 });
    for (const [a, l] of [[-0.9, 50], [0.8, 44], [-0.4, 40], [0.3, 46]]) { const y0 = by - 60 - r() * 30; stroke([[cx, y0], [cx + Math.sin(a) * l, y0 - Math.cos(a) * l]], OUT, 9); stroke([[cx, y0], [cx + Math.sin(a) * l, y0 - Math.cos(a) * l]], '#6a5040', 5); }
  } else {
    toon((k) => { k.moveTo(cx - 9, by); k.lineTo(cx - 7, by - 46); k.lineTo(cx + 7, by - 46); k.lineTo(cx + 10, by); k.quadraticCurveTo(cx, by + 4, cx - 9, by); k.closePath(); }, '#7a5236', { sx: -4, sy: 0 });
    stroke([[cx - 2, by - 10], [cx - 3, by - 28]], '#5a3a22', 2);
    const base = { manzano: '#6a9e44', sombrio: '#4a7a52', otono: '#d08a3a' }[kind] || '#5f9440';
    const blobs = [[0, -92, 52, 44], [-36, -70, 32, 28], [36, -70, 32, 28], [-20, -118, 30, 26], [22, -116, 30, 26]];
    const all = (k) => { for (const [dx, dy, rx, ry] of blobs) { k.moveTo(cx + dx + rx, by + dy); k.ellipse(cx + dx, by + dy, rx, ry, 0, 0, Math.PI * 2); } };
    path(all); X.lineWidth = 6; X.strokeStyle = OUT; X.stroke();      // solo queda el contorno exterior
    X.save();
    path(all); X.fillStyle = dk(base); X.fill();
    X.clip(); X.translate(-7, -8); path(all); X.fillStyle = base; X.fill(); X.translate(7, 8);
    for (let i = 0; i < 10; i++) { const px = cx - 40 + r() * 70, py = by - 140 + r() * 60; X.beginPath(); X.arc(px, py, 6 + r() * 5, Math.PI, Math.PI * 2); X.strokeStyle = lt(base); X.lineWidth = 2.4; X.stroke(); }
    X.restore();
    if (kind === 'manzano') for (let i = 0; i < 7; i++) { const px = cx - 44 + r() * 88, py = by - 130 + r() * 70; toon(E(px, py, 5.5, 5.5), '#c8402e', { sx: -1.5, sy: -1.5, lw: 2 }); dot(px - 1.5, py - 2, 1.4, '#ffd0c0'); }
    if (kind === 'sombrio') for (let i = 0; i < 5; i++) { const px = cx - 40 + r() * 80, py = by - 130 + r() * 70; dot(px, py, 3, '#c8f0ff'); }
  }
  return c;
}
const TREES = {};
function treeImg(kind, v) { const k = kind + v; return TREES[k] || (TREES[k] = treeArt(kind, v * 31 + kind.length * 7)); }

/* ------------------------------------------------------ rocas, menas, plantas */
const ROCKS = {};
function rockArt(v, vein) {
  const k = v + (vein || ''); if (ROCKS[k]) return ROCKS[k];
  const r = wrng(40 + v), [c, x] = cnv(110, 80); X = x;
  const pts = []; for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; pts.push([55 + Math.cos(a) * (40 + r() * 10), 74 + Math.sin(a) * (44 + r() * 14)]); }
  toon(PL(pts), '#9a948a', { sx: -8, sy: -6, lw: 3 });
  stroke([[34, 50], [44, 40], [52, 46]], '#6a6458', 2.4); stroke([[64, 60], [74, 48]], '#6a6458', 2.4);
  if (vein) for (let i = 0; i < 5; i++) { const px = 30 + r() * 50, py = 40 + r() * 28; toon(PL([[px, py - 9], [px + 6, py], [px, py + 6], [px - 6, py]]), vein, { sx: -2, sy: -2, lw: 2 }); dot(px - 1, py - 3, 1.6, '#fff'); }
  return (ROCKS[k] = c);
}
const HERBS = {};
function herbArt(t) {
  if (HERBS[t]) return HERBS[t];
  const col = RES.herb[t][1], [c, x] = cnv(70, 60); X = x;
  for (const [a, l] of [[-0.8, 26], [-0.3, 32], [0.2, 30], [0.7, 24], [0, 20]]) toon(E(35 + Math.sin(a) * l * 0.5, 54 - Math.cos(a) * l * 0.6, 7, 14, a), t === 3 ? '#5a6a6a' : '#5f9440', { sx: -2, sy: -1, lw: 2 });
  for (let i = 0; i < 4; i++) { const px = 20 + i * 10 + (i % 2) * 3, py = 22 + (i % 2) * 8; toon(E(px, py, 6, 6), col, { sx: -1.5, sy: -1.5, lw: 2 }); dot(px - 1.5, py - 1.5, 1.6, '#fff'); }
  return (HERBS[t] = c);
}
function portalArt(col) {
  const [c, x] = cnv(160, 170); X = x;
  for (const s of [-1, 1]) { toon(RR(80 + s * 52 - 14, 40, 28, 124, 4), '#8a8478', { sx: -4, sy: 0, lw: 3 }); for (let i = 0; i < 4; i++) stroke([[80 + s * 52 - 14, 64 + i * 26], [80 + s * 52 + 14, 64 + i * 26]], '#6a6458', 2); }
  toon((k) => { k.moveTo(14, 46); k.quadraticCurveTo(80, -14, 146, 46); k.lineTo(146, 62); k.quadraticCurveTo(80, 6, 14, 62); k.closePath(); }, '#9a948a', { sx: -4, sy: -4, lw: 3 });
  toon(E(80, 22, 10, 10), col, { sx: -2, sy: -2, lw: 2.4 }); dot(77, 19, 3, '#fff');
  toon(RR(18, 158, 124, 10, 3), '#7a746a', { shade: false });
  return c;
}
function signArt(txt) {
  const [c, x] = cnv(90, 70); X = x;
  toon(RR(42, 30, 6, 40, 2), '#7a5236', { shade: false });
  toon(RR(6, 8, 78, 28, 4), '#c9a46a', { sx: -2, sy: -2 });
  x.fillStyle = OUT; x.font = 'bold 11px Trebuchet MS'; x.textAlign = 'center'; x.fillText(txt, 45, 26);
  return c;
}
function lampArt() {
  const [c, x] = cnv(30, 90); X = x;
  toon(RR(12, 22, 6, 66, 2), '#4a4450', { sx: -2, sy: 0 });
  toon(RR(6, 84, 18, 6, 2), '#4a4450', { shade: false });
  toon(PL([[5, 22], [25, 22], [21, 6], [9, 6]]), '#4a4450', { shade: false });
  toon(RR(8, 9, 14, 12, 2), '#ffd27a', { shade: false, lw: 2.2 });
  dot(12, 12, 2, '#fff4c0');
  toon(PL([[3, 7], [27, 7], [15, 0]]), '#3a3440', { shade: false });
  return c;
}

/* ------------------------------------------------------------ portales */
const PORTALS = [
  ['Verde', '#5ad06a'], ['Azul', '#4a8ae0'], ['Rojo', '#e0503a'], ['Violeta', '#a05ae0'], ['Dorado', '#f0c040'],
  ['Cian', '#40d0d0'], ['Naranja', '#f08a30'], ['Rosa', '#f070b0'], ['Sombrío', '#5a4a7a'], ['Helado', '#c0e8ff'],
].map(([name, col], i) => {
  const a = i * 2.4 + 0.6, d = 1300 + i * 330;
  let x = CX + Math.cos(a) * d, y = CY + Math.sin(a) * d * 0.66;
  for (let k = 0; k < 60 && (inLake(x, y, 140) || onPath(x, y, 80) || townAt(x, y, 1.35)); k++) { x += 70; y += 40; }
  return { i, name, col, x: clamp(x, 300, WORLD_W - 300), y: clamp(y, 400, WORLD_H - 200), lvl: 2 + i * 2 };
});

/* ------------------------------------------------------- pueblos pequeños */
function placeTown(S, T0) {
  const A = VILLAGE.ART, r = wrng(T0.seed), s = 1.35;
  const keys = ['v_house_blue', 'v_house_purple', 'v_house_red', 'v_house_green', 'v_house_inn'];
  const spots = [[-330, -170], [330, -170], [-360, 330], [360, 330]];
  spots.forEach(([dx, dy], i) => {
    const img = A[keys[(i + T0.seed) % keys.length]], w = img.width / 2 * s, h = img.height / 2 * s, x = T0.x + dx, y = T0.y + dy;
    place(S, img, x, y, { w, h, solid: [-w * 0.4, -h * 0.42, w * 0.8, h * 0.38], shadow: w * 0.5 });
    S.lights.push({ x, y: y - h * 0.25, r: 80 }); S.chimneys.push({ x: x + w * 0.23, y: y - h * 0.92 });
    // se puede entrar: cada casa es como la del mismo color en Albor
    S.doors.push({ x, y: y - 2, room: { v_house_blue: 'cuartel', v_house_purple: 'portales', v_house_red: 'herreria', v_house_green: 'consulta', v_house_inn: 'posada' }[keys[(i + T0.seed) % keys.length]] });
  });
  const P = (key, dx, dy, solid, k = s) => { const img = A[key], w = img.width / 2 * k, h = img.height / 2 * k; place(S, img, T0.x + dx, T0.y + dy, { w, h, solid, shadow: w * 0.45 }); };
  P('v_stall_red', 170, 10, [-70, -36, 140, 32]); P('v_well', -160, -10, [-40, -28, 80, 26]);
  P('v_firepit', 0, 150, null); S.lights.push({ x: T0.x, y: T0.y + 130, r: 110, fire: true });
  for (const [dx, dy] of [[-250, 170], [240, 180]]) P('v_barrel', dx, dy, [-18, -12, 36, 12]);
  P('v_crate', 250, -40, [-24, -12, 48, 12]);
  const lamp = lampArt();
  for (const [dx, dy] of [[-150, -120], [150, -120], [-150, 220], [150, 220]]) { place(S, lamp, T0.x + dx, T0.y + dy, { w: 30, h: 90, solid: [-5, -6, 10, 6], shadow: 12 }); S.lights.push({ x: T0.x + dx, y: T0.y + dy - 76, r: 70 }); }
  place(S, signArt(T0.name.length > 12 ? T0.name.split(' ').pop() : T0.name), T0.x + 90, T0.y - 150, { w: 90, h: 70, solid: [-6, -8, 12, 8], shadow: 20 });
}

/* ------------------------------------------------------- colocar el mundo */
let WORLD;
function buildWorld() {
  buildZoneMap();
  const S = WORLD = newScene('world', 'world', WORLD_W, WORLD_H, 'Mundo');
  VILLAGE.build(null);
  const A = VILLAGE.ART;
  const H = (key, dx, dy, door, wide = 1) => {
    const img = A[key], w = img.width / 2 * HS, h = img.height / 2 * HS;
    place(S, img, CX + dx, CY + dy, { w, h, solid: [-w * 0.4, -h * 0.42, w * 0.8, h * 0.38], shadow: w * 0.5 });
    S.lights.push({ x: CX + dx, y: CY + dy - h * 0.25, r: 90 * wide });
    S.chimneys.push({ x: CX + dx + w * 0.23, y: CY + dy - h * 0.92 });
    S.doors.push({ x: CX + dx, y: CY + dy - 2, room: door });
  };
  H('v_house_blue', -330, -250, 'cuartel'); H('v_house_purple', 20, -320, 'portales'); H('v_house_red', -430, 300, 'herreria');
  H('v_house_inn', 120, 520, 'posada', 1.3); H('v_house_green', 430, 400, 'consulta');
  const P = (key, dx, dy, solid, s = HS) => { const img = A[key]; const w = img.width / 2 * s, h = img.height / 2 * s; place(S, img, CX + dx, CY + dy, { w, h, solid, shadow: w * 0.45 }); };
  P('v_stall_red', 280, 120, [-80, -40, 160, 36]); P('v_stall_blue', -280, 120, [-80, -40, 160, 36]);
  P('v_well', 0, 40, [-44, -30, 88, 28]); P('v_sign', 150, -40, [-6, -8, 12, 8]);
  P('v_firepit', -60, 230, null);
  S.lights.push({ x: CX - 60, y: CY + 210, r: 120, fire: true });
  for (const [dx, dy] of [[-520, 340], [-300, 330], [380, 170], [-180, -170]]) P('v_barrel', dx, dy, [-20, -14, 40, 14]);
  for (const [dx, dy] of [[-560, 300], [220, 560], [330, 190]]) P('v_crate', dx, dy, [-26, -14, 52, 14]);
  const lamp = lampArt();
  for (const [dx, dy] of [[-200, -60], [200, -60], [-210, 210], [210, 210], [-40, 380]]) { place(S, lamp, CX + dx, CY + dy, { w: 30, h: 90, solid: [-5, -6, 10, 6], shadow: 12 }); S.lights.push({ x: CX + dx, y: CY + dy - 76, r: 70 }); }
  // carteles en los caminos
  for (const [x, y, t] of [[CX + 90, CY - 700, 'Bosque ↑'], [CX + 950, CY + 160, 'Colinas →'], [CX + 90, CY + 760, 'Lagos ↓'], [CX - 950, CY + 160, '← Pradera']]) place(S, signArt(t), x, y, { w: 90, h: 70, solid: [-6, -8, 12, 8], shadow: 20 });
  // portales (aparecen en el mapa cuando los descubres)
  for (const p of PORTALS) {
    place(S, portalArt(p.col), p.x, p.y, { w: 160, h: 170, solid: null, shadow: 70, portal: p });
    addSolid(S, { x: p.x - 74, y: p.y - 18, w: 28, h: 16 }); addSolid(S, { x: p.x + 46, y: p.y - 18, w: 28, h: 16 });
    S.portals.push(p);
  }
  // árboles y rocas según la región
  const r = wrng(91);
  const occ = new Map(), okSpot = (x, y, sx, sy) => {
    const ci = Math.floor(x / 200), cj = Math.floor(y / 200);
    for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) for (const o of occ.get(i + ',' + j) || []) if (Math.abs(o[0] - x) < sx && Math.abs(o[1] - y) < sy) return false;
    return true;
  };
  const mark = (x, y) => { const k = Math.floor(x / 200) + ',' + Math.floor(y / 200); if (!occ.has(k)) occ.set(k, []); occ.get(k).push([x, y]); };
  for (const T0 of TOWNS) if (!T0.main) placeTown(S, T0);
  const free = (x, y, m = 40) => !safeZone(x, y, 0.95) && !onPath(x, y, m) && !inLake(x, y, 80) && !PORTALS.some((p) => Math.abs(p.x - x) < 170 && Math.abs(p.y - y) < 150);
  for (let tries = 0; tries < 26000; tries++) {
    const x = 60 + r() * (WORLD_W - 120), y = 160 + r() * (WORLD_H - 180);
    const z = zoneAt(x, y), dens = { bosque: 0.95, pradera: 0.18, costa: 0.32, colinas: 0.22, salvaje: 0.2 }[z];
    if (r() > dens || !free(x, y)) continue;
    if (z === 'colinas' && r() < 0.55) {
      if (!okSpot(x, y, 120, 90)) continue;
      const s = 0.8 + r() * 0.6; place(S, rockArt((r() * 4) | 0), x, y, { w: 110 * s, h: 80 * s, solid: [-40 * s, -26 * s, 80 * s, 24 * s], shadow: 50 * s }); mark(x, y); continue;
    }
    if (!okSpot(x, y, z === 'bosque' ? 120 : 170, z === 'bosque' ? 95 : 130)) continue;
    const kind = z === 'bosque' ? (r() < 0.45 ? 'abeto' : r() < 0.5 ? 'sombrio' : r() < 0.3 ? 'seco' : 'roble')
      : z === 'salvaje' ? (r() < 0.4 ? 'otono' : r() < 0.4 ? 'seco' : 'roble')
        : z === 'colinas' ? (r() < 0.6 ? 'pino' : 'seco') : (r() < 0.3 ? 'pino' : r() < 0.3 ? 'manzano' : 'roble');
    const s = 0.85 + r() * 0.35;
    place(S, treeImg(kind, (r() * 3) | 0), x, y, { w: 150 * s, h: 190 * s, solid: [-12, -12, 24, 12], shadow: 60 * s, tree: true, sway: r() * 6 });
    mark(x, y);
  }
  // nodos de recolección: menas, plantas y bancos de peces
  const nodeAt = (kind, x, y) => { const t = tierAt(x, y); S.nodes.push({ kind, tier: t, x, y, ready: 0 }); mark(x, y); };
  for (let n = 0, tries = 0; n < 170 && tries < 20000; tries++) {
    const x = 100 + r() * (WORLD_W - 200), y = 200 + r() * (WORLD_H - 260), z = zoneAt(x, y);
    if (!free(x, y, 60) || !okSpot(x, y, 110, 80)) continue;
    if (z !== 'colinas' && r() < 0.6) continue;
    nodeAt('ore', x, y); addSolid(S, { x: x - 30, y: y - 20, w: 60, h: 18 }); n++;
  }
  for (let n = 0, tries = 0; n < 190 && tries < 20000; tries++) {
    const x = 100 + r() * (WORLD_W - 200), y = 200 + r() * (WORLD_H - 260), z = zoneAt(x, y);
    if (!free(x, y, 30) || !okSpot(x, y, 90, 70)) continue;
    if (z === 'colinas' && r() < 0.7) continue;
    nodeAt('herb', x, y); n++;
  }
  LAKES.forEach((L, li) => {
    const n = li === 0 ? 3 : 2 + Math.floor(L.rx / 160);
    for (let k = 0; k < n; k++) { const a = k * (6.28 / n) + li, x = L.x + Math.cos(a) * L.rx * 0.82, y = L.y + Math.sin(a) * L.ry * 0.82; S.nodes.push({ kind: 'fish', tier: li === 0 ? 1 : tierAt(x, y), x, y, ready: 0, lake: L }); }
  });
}
