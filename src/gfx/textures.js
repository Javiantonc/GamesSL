import Phaser from 'phaser';
import { mulberry32 } from '../world/noise.js';
import { DUNGEON_TIERS } from '../data/dungeons.js';
import { generateCharacterTextures } from './characters.js';
import { generateSpectreTextures } from './spectres.js';

/** Mezcla un color '#rrggbb' con otro (t = 0..1). */
function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (p, sh) => (p >> sh) & 255;
  const m = (sh) => Math.round(ch(pa, sh) + (ch(pb, sh) - ch(pa, sh)) * t);
  return `rgb(${m(16)},${m(8)},${m(0)})`;
}

// ============================================================
//  ARTE PROCEDURAL estilo "chibi": cabezas grandes, contorno
//  oscuro grueso, colores saturados. Todo se dibuja con Canvas 2D
//  y se registra como textura de Phaser, así el prototipo no
//  necesita assets. Más adelante puedes sustituir cada clave
//  (base_head, m_wolf, tree_oak...) por un PNG/atlas del mismo nombre.
// ============================================================

const OUT = '#2a1b12';

function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  return [c, ctx];
}
function ell(ctx, x, y, rx, ry, fill, lw = 2.5) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke(); }
}
function poly(ctx, pts, fill, lw = 2.5) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke(); }
}
function rrect(ctx, x, y, w, h, r, fill, lw = 2.5) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke(); }
}
function line(ctx, pts, color, lw) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]);
  ctx.lineWidth = lw; ctx.strokeStyle = color; ctx.stroke();
}
function eyes(ctx, x1, x2, y, rx = 3.2, ry = 4.2, color = '#1d1d2b') {
  ell(ctx, x1, y, rx, ry, color, 0); ell(ctx, x2, y, rx, ry, color, 0);
  ell(ctx, x1 - 1, y - 1.6, 1.2, 1.4, '#fff', 0); ell(ctx, x2 - 1, y - 1.6, 1.2, 1.4, '#fff', 0);
}
function register(scene, key, canvas) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}

export function generateTextures(scene) {
  tileset(scene);
  generateCharacterTextures(scene);   // personaje jugador (gfx/characters.js)
  generateSpectreTextures(scene);     // espectros del ejército del Mago (gfx/spectres.js)
  mobs(scene);
  trees(scene);
  fx(scene);
}

// ---------------- TILESET (10 baldosas de 32x32) ----------------
function tileset(scene) {
  const S = 32;
  const defs = [
    { base: '#2468ad', kind: 'water' },  // 0 agua profunda
    { base: '#3d97dc', kind: 'water' },  // 1 agua
    { base: '#f3dc92', kind: 'sand' },   // 2 arena
    { base: '#7fd25b', kind: 'grass' },  // 3 hierba
    { base: '#86d862', kind: 'grass', flowers: true }, // 4 hierba con flores
    { base: '#4ea347', kind: 'forest' }, // 5 suelo de bosque
    { base: '#489a41', kind: 'forest' }, // 6
    { base: '#c2a878', kind: 'hill' },   // 7 colina
    { base: '#8d8d9c', kind: 'cliff' },  // 8 roca
    { base: '#eef5fc', kind: 'snow' },   // 9 nieve
    { base: '#07060d', kind: 'void' },   // 10 vacío (fuera de las mazmorras)
  ];
  // 11.. -> por cada mazmorra: suelo, suelo2, muro, teñidos con su color
  for (const tier of DUNGEON_TIERS) {
    defs.push({ base: mix(tier.color, '#4a4658', 0.62), kind: 'dfloor', tc: tier.color });
    defs.push({ base: mix(tier.color, '#4a4658', 0.55), kind: 'dfloor', tc: tier.color, rune: true });
    defs.push({ base: mix(tier.color, '#08070c', 0.86), kind: 'dwall', tc: tier.color });
  }
  // Bosque Invernal (índices 41-44): nieve, nieve con huellas, lago helado, roca helada
  defs.push({ base: '#f2f7ff', kind: 'snowfield' });
  defs.push({ base: '#e8f1fc', kind: 'snowfield', marks: true });
  defs.push({ base: '#8fc8ee', kind: 'ice' });
  defs.push({ base: '#9db4cc', kind: 'icecliff' });
  const [c, ctx] = mk(S * defs.length, S);
  const r = mulberry32(7);
  defs.forEach((d, i) => {
    const x0 = i * S;
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, 0, S, S); ctx.clip();
    ctx.fillStyle = d.base; ctx.fillRect(x0, 0, S, S);
    const dots = (n, col, sz) => { ctx.fillStyle = col; for (let k = 0; k < n; k++) ctx.fillRect(x0 + r() * S, r() * S, sz, sz); };
    switch (d.kind) {
      case 'water':
        ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.6;
        for (let k = 0; k < 3; k++) {
          const wx = x0 + 3 + r() * 20, wy = 5 + r() * 22;
          ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 3, wy - 3, wx + 6, wy); ctx.quadraticCurveTo(wx + 9, wy + 3, wx + 12, wy); ctx.stroke();
        }
        break;
      case 'sand':
        dots(16, 'rgba(170,125,55,0.35)', 2); dots(8, 'rgba(255,255,255,0.5)', 1.5); break;
      case 'grass':
      case 'forest': {
        const dark = d.kind === 'grass' ? 'rgba(40,120,40,0.55)' : 'rgba(20,70,25,0.55)';
        const light = d.kind === 'grass' ? 'rgba(200,255,150,0.45)' : 'rgba(150,220,120,0.3)';
        ctx.lineWidth = 1.4;
        for (let k = 0; k < 9; k++) {
          const bx = x0 + 2 + r() * 28, by = 4 + r() * 26;
          ctx.strokeStyle = k % 3 ? dark : light;
          ctx.beginPath(); ctx.moveTo(bx - 2, by); ctx.lineTo(bx - 1, by - 4); ctx.moveTo(bx, by); ctx.lineTo(bx + 1, by - 5); ctx.stroke();
        }
        if (d.kind === 'forest') dots(6, 'rgba(120,70,30,0.35)', 2);
        if (d.flowers) {
          const cols = ['#fff27a', '#ffffff', '#ff9ad5'];
          for (let k = 0; k < 3; k++) { ell(ctx, x0 + 4 + r() * 24, 4 + r() * 24, 1.8, 1.8, cols[k], 0); }
        }
        break;
      }
      case 'hill':
        for (let k = 0; k < 4; k++) ell(ctx, x0 + 4 + r() * 24, 4 + r() * 24, 2.5, 1.8, 'rgba(110,90,60,0.45)', 0);
        dots(10, 'rgba(255,255,255,0.25)', 1.5); break;
      case 'cliff': {
        const g = ctx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#a2a2b2'); g.addColorStop(1, '#6f6f80');
        ctx.fillStyle = g; ctx.fillRect(x0, 0, S, S);
        ctx.strokeStyle = 'rgba(40,40,55,0.55)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x0 + 6, 4); ctx.lineTo(x0 + 11, 14); ctx.lineTo(x0 + 8, 24);
        ctx.moveTo(x0 + 22, 8); ctx.lineTo(x0 + 19, 18); ctx.lineTo(x0 + 25, 28); ctx.stroke();
        dots(6, 'rgba(255,255,255,0.3)', 2); break;
      }
      case 'snow':
        dots(10, 'rgba(150,190,230,0.45)', 2); dots(6, '#ffffff', 2); break;
      case 'snowfield':
        dots(10, 'rgba(150,185,225,0.45)', 2); dots(6, '#ffffff', 2.5);
        if (d.marks) for (let k = 0; k < 2; k++) ell(ctx, x0 + 6 + r() * 20, 6 + r() * 20, 2.2, 3, 'rgba(140,170,210,0.4)', 0);
        break;
      case 'ice':
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x0 + 4, 8); ctx.lineTo(x0 + 14, 14); ctx.lineTo(x0 + 11, 24); ctx.moveTo(x0 + 14, 14); ctx.lineTo(x0 + 26, 10); ctx.stroke();
        dots(5, 'rgba(255,255,255,0.6)', 2);
        break;
      case 'icecliff': {
        const g = ctx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#cfe2f5'); g.addColorStop(1, '#7f97b2');
        ctx.fillStyle = g; ctx.fillRect(x0, 0, S, S);
        ctx.strokeStyle = 'rgba(40,60,90,0.45)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x0 + 7, 3); ctx.lineTo(x0 + 12, 15); ctx.lineTo(x0 + 9, 27); ctx.moveTo(x0 + 23, 6); ctx.lineTo(x0 + 20, 18); ctx.lineTo(x0 + 26, 29); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, 0, S, 4);
        break;
      }
      case 'void':
        dots(3, 'rgba(255,255,255,0.08)', 1); break;
      case 'dfloor':
        // losas
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
        ctx.strokeRect(x0 + 1, 1, 15, 15); ctx.strokeRect(x0 + 16, 1, 15, 15);
        ctx.strokeRect(x0 + 1, 16, 15, 15); ctx.strokeRect(x0 + 16, 16, 15, 15);
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x0 + 2, 2, 13, 3); ctx.fillRect(x0 + 17, 17, 13, 3);
        if (d.rune) {
          ctx.strokeStyle = d.tc; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(x0 + 16, 16, 7, 0, Math.PI * 2); ctx.moveTo(x0 + 16, 9); ctx.lineTo(x0 + 16, 23); ctx.moveTo(x0 + 10, 16); ctx.lineTo(x0 + 22, 16); ctx.stroke();
          ctx.globalAlpha = 1;
        }
        break;
      case 'dwall': {
        // ladrillos con borde superior iluminado del color de la mazmorra
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1.5;
        for (let row = 0; row < 4; row++) {
          const y = row * 8, off = row % 2 ? 8 : 0;
          ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + S, y); ctx.stroke();
          for (let bx = off; bx < S; bx += 16) { ctx.beginPath(); ctx.moveTo(x0 + bx, y); ctx.lineTo(x0 + bx, y + 8); ctx.stroke(); }
        }
        ctx.fillStyle = d.tc; ctx.globalAlpha = 0.12; ctx.fillRect(x0, 0, S, S); ctx.globalAlpha = 1;
        break;
      }
    }
    ctx.restore();
  });
  register(scene, 'tiles', c);
}

// ---------------- MONSTRUOS ----------------
function mobs(scene) {
  // Limo
  let [c, x] = mk(44, 36);
  x.beginPath(); x.moveTo(4, 31); x.quadraticCurveTo(1, 4, 22, 3); x.quadraticCurveTo(43, 4, 40, 31); x.quadraticCurveTo(22, 36, 4, 31); x.closePath();
  x.fillStyle = '#6fd16a'; x.fill(); x.lineWidth = 2.5; x.strokeStyle = OUT; x.stroke();
  ell(x, 13, 11, 5, 3, 'rgba(255,255,255,0.65)', 0);
  eyes(x, 16, 28, 20, 3, 4);
  x.beginPath(); x.arc(22, 25, 3, 0.1 * Math.PI, 0.9 * Math.PI); x.lineWidth = 1.8; x.stroke();
  register(scene, 'm_slime', c);

  // Lobo (mira a la izquierda)
  [c, x] = mk(56, 44);
  poly(x, [[44, 26], [55, 16], [52, 30]], '#7d7f8e', 2.2);           // cola
  ell(x, 34, 29, 16, 10, '#8d8f9e');                                   // cuerpo
  rrect(x, 23, 34, 5, 9, 2, '#7d7f8e', 2); rrect(x, 40, 34, 5, 9, 2, '#7d7f8e', 2);
  poly(x, [[9, 13], [11, 1], [18, 10]], '#9fa2b3', 2.2); poly(x, [[21, 9], [27, 0], [29, 12]], '#9fa2b3', 2.2);
  ell(x, 19, 20, 14, 12, '#a5a8b8');                                   // cabeza
  ell(x, 8, 25, 7, 5, '#d4d6e0');                                      // hocico
  ell(x, 3, 24, 2.6, 2.2, '#222', 0);
  ell(x, 17, 18, 3, 3.4, '#ffcc33', 1.5); ell(x, 16.5, 18, 1.2, 2.2, '#222', 0);
  ell(x, 26, 18, 3, 3.4, '#ffcc33', 1.5); ell(x, 25.5, 18, 1.2, 2.2, '#222', 0);
  register(scene, 'm_wolf', c);

  // Goblin
  [c, x] = mk(52, 56);
  poly(x, [[10, 18], [0, 10], [12, 26]], '#6fb03a', 2.2); poly(x, [[42, 18], [52, 10], [40, 26]], '#6fb03a', 2.2);
  rrect(x, 16, 32, 20, 16, 6, '#8b5a2b'); x.fillStyle = '#5b3a1f'; x.fillRect(17, 40, 18, 3);
  ell(x, 19, 51, 4.5, 4, '#4a3020'); ell(x, 33, 51, 4.5, 4, '#4a3020');
  ell(x, 26, 20, 16, 14, '#7bc043');
  ell(x, 20, 20, 3.6, 4, '#fff36b', 1.5); ell(x, 20, 20.5, 1.4, 2.2, '#222', 0);
  ell(x, 32, 20, 3.6, 4, '#fff36b', 1.5); ell(x, 32, 20.5, 1.4, 2.2, '#222', 0);
  x.beginPath(); x.moveTo(19, 27); x.quadraticCurveTo(26, 32, 33, 27); x.lineWidth = 2; x.strokeStyle = OUT; x.stroke();
  x.fillStyle = '#fff'; x.fillRect(22, 27.5, 2.4, 2.4); x.fillRect(28, 27.5, 2.4, 2.4);
  register(scene, 'm_goblin', c);

  // Esqueleto
  [c, x] = mk(44, 58);
  x.strokeStyle = '#e6e1d0'; x.lineWidth = 4;
  x.beginPath(); x.moveTo(17, 46); x.lineTo(16, 56); x.moveTo(27, 46); x.lineTo(28, 56); x.stroke();
  rrect(x, 13, 31, 18, 16, 5, '#e6e1d0');
  x.strokeStyle = 'rgba(60,50,40,0.6)'; x.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(16, 35 + i * 4); x.lineTo(28, 35 + i * 4); x.stroke(); }
  ell(x, 22, 17, 16, 14, '#f4f1e6');
  rrect(x, 15, 25, 14, 7, 3, '#f4f1e6', 2);
  ell(x, 16, 17, 4.2, 4.6, '#2b2433', 0); ell(x, 28, 17, 4.2, 4.6, '#2b2433', 0);
  ell(x, 16, 17.5, 1.6, 1.6, '#7ef0ff', 0); ell(x, 28, 17.5, 1.6, 1.6, '#7ef0ff', 0);
  register(scene, 'm_skeleton', c);

  // Oso polar (mira a la derecha)
  [c, x] = mk(64, 52);
  rrect(x, 16, 34, 9, 15, 4, '#e8edf5'); rrect(x, 38, 34, 9, 15, 4, '#e8edf5');     // patas
  ell(x, 28, 31, 21, 15, '#f6f8fc');                                                // cuerpo
  ell(x, 24, 37, 14, 6, 'rgba(150,180,215,0.35)', 0);
  rrect(x, 22, 36, 9, 14, 4, '#f6f8fc'); rrect(x, 44, 36, 9, 14, 4, '#f6f8fc');
  for (const px of [24, 27, 46, 49]) line(x, [[px, 47], [px, 50]], '#9aa8bb', 1.2);
  ell(x, 41, 15, 4, 4, '#f6f8fc'); ell(x, 53, 15, 4, 4, '#f6f8fc');                  // orejas
  ell(x, 47, 23, 13, 11.5, '#f6f8fc');                                              // cabeza
  ell(x, 56, 27, 7, 5.5, '#e2e8f2');                                                // hocico
  ell(x, 61, 25.5, 2.4, 2, '#1d1d2b', 0);
  ell(x, 49, 20, 2, 2.4, '#1d1d2b', 0); ell(x, 48.4, 19.2, 0.7, 0.8, '#fff', 0);
  x.beginPath(); x.moveTo(55, 31); x.quadraticCurveTo(58, 33, 61, 30.5); x.lineWidth = 1.6; x.strokeStyle = OUT; x.stroke();
  register(scene, 'm_polarbear', c);

  // Araña de escarcha (mira a la derecha)
  [c, x] = mk(60, 42);
  for (const [sx, sy, kx, ky, ex, ey] of [[30, 24, 22, 8, 10, 14], [30, 25, 18, 14, 4, 24], [32, 26, 20, 30, 8, 38], [34, 26, 26, 34, 18, 41],
    [36, 24, 42, 8, 50, 12], [37, 25, 46, 14, 57, 22], [37, 26, 46, 30, 56, 36], [36, 27, 40, 34, 46, 41]]) {
    line(x, [[sx, sy], [kx, ky], [ex, ey]], OUT, 4.2); line(x, [[sx, sy], [kx, ky], [ex, ey]], '#a9d4f2', 2);
  }
  ell(x, 20, 23, 14, 11.5, '#5b86b6');                                              // abdomen
  poly(x, [[13, 20], [20, 15], [27, 20], [20, 27]], '#cfeaff', 1.5);                 // dibujo de hielo
  ell(x, 39, 23, 10, 8.5, '#7aa7d6');                                               // cabeza
  for (const [ex, ey, r] of [[42, 19.5, 2.2], [46, 21, 1.8], [43, 24, 1.6], [46.5, 25, 1.3]]) ell(x, ex, ey, r, r, '#e9fbff', 0);
  ell(x, 42, 19.5, 0.8, 0.8, '#3fd0ff', 0);
  poly(x, [[47, 27], [50, 31], [46, 29]], '#e9fbff', 1.2);
  register(scene, 'm_spider', c);
}

// ---------------- ÁRBOLES ----------------
function trees(scene) {
  const oak = (fruit) => {
    const [c, x] = mk(64, 84);
    rrect(x, 27, 52, 10, 30, 3, '#7a4b2a');
    ell(x, 19, 44, 16, 14, '#3e9a39'); ell(x, 45, 44, 16, 14, '#3e9a39');
    ell(x, 32, 27, 23, 21, '#4caf45');
    ell(x, 25, 19, 8, 5, 'rgba(255,255,255,0.22)', 0); ell(x, 15, 40, 4, 3, 'rgba(255,255,255,0.18)', 0);
    if (fruit) [[22, 30], [40, 22], [44, 42], [28, 44], [16, 46]].forEach(([fx, fy]) => ell(x, fx, fy, 3, 3, '#ff4d5e', 1.5));
    return c;
  };
  register(scene, 'tree_oak', oak(false));
  register(scene, 'tree_fruit', oak(true));

  const [c, x] = mk(52, 88);
  rrect(x, 22, 70, 8, 16, 2, '#6b4123');
  poly(x, [[26, 30], [50, 72], [2, 72]], '#2f7d4f');
  poly(x, [[26, 14], [45, 50], [7, 50]], '#368a57');
  poly(x, [[26, 1], [40, 30], [12, 30]], '#3f9a62');
  poly(x, [[26, 4], [32, 16], [22, 16]], 'rgba(255,255,255,0.18)', 0);
  register(scene, 'tree_pine', c);

  // Pino nevado (Bosque Invernal)
  const [cs, xs] = mk(52, 88);
  rrect(xs, 22, 70, 8, 16, 2, '#5e3a20');
  poly(xs, [[26, 30], [50, 72], [2, 72]], '#2c6b55');
  poly(xs, [[26, 14], [45, 50], [7, 50]], '#32785f');
  poly(xs, [[26, 1], [40, 30], [12, 30]], '#3a8669');
  poly(xs, [[26, 1], [33, 14], [29, 12], [26, 16], [22, 12], [19, 14]], '#ffffff', 2);
  poly(xs, [[26, 17], [36, 34], [31, 31], [26, 36], [20, 31], [15, 34]], '#ffffff', 2);
  poly(xs, [[26, 33], [42, 54], [35, 51], [26, 56], [17, 51], [10, 54]], '#ffffff', 2);
  register(scene, 'tree_snowpine', cs);

  const [c2, x2] = mk(32, 22);
  ell(x2, 16, 14, 11, 6, '#8a5a32'); ell(x2, 16, 11, 10, 5, '#d9b07a');
  x2.strokeStyle = 'rgba(120,80,40,0.6)'; x2.lineWidth = 1; x2.beginPath(); x2.ellipse(16, 11, 5, 2.4, 0, 0, Math.PI * 2); x2.stroke();
  register(scene, 'stump', c2);
}

// ---------------- EFECTOS ----------------
function fx(scene) {
  let [c, x] = mk(30, 12);
  ell(x, 15, 6, 14, 5, 'rgba(0,0,0,0.28)', 0);
  register(scene, 'shadow', c);

  [c, x] = mk(64, 64);
  let g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  register(scene, 'glow', c);

  [c, x] = mk(24, 24);
  g = x.createRadialGradient(12, 12, 0, 12, 12, 12);
  g.addColorStop(0, '#fffbd6'); g.addColorStop(0.35, '#ffb43a'); g.addColorStop(0.7, 'rgba(255,80,0,0.7)'); g.addColorStop(1, 'rgba(255,40,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 24, 24);
  register(scene, 'fireball', c);

  [c, x] = mk(10, 10);
  poly(x, [[5, 0], [6.5, 3.5], [10, 5], [6.5, 6.5], [5, 10], [3.5, 6.5], [0, 5], [3.5, 3.5]], '#ffffff', 0);
  register(scene, 'spark', c);

  [c, x] = mk(26, 26);
  ell(x, 13, 17, 10, 8.5, '#c08a4a'); rrect(x, 8.5, 4, 9, 6, 2, '#a0703a', 2);
  x.strokeStyle = '#f5d76e'; x.lineWidth = 2; x.beginPath(); x.moveTo(8, 10); x.lineTo(18, 10); x.stroke();
  register(scene, 'bag', c);

  [c, x] = mk(52, 22);
  x.beginPath(); x.ellipse(26, 11, 23, 9, 0, 0, Math.PI * 2); x.lineWidth = 3; x.strokeStyle = '#ffffff'; x.stroke();
  register(scene, 'target_ring', c);

  // Portal: arco de piedra (sin teñir) + remolino blanco (se tiñe con el color de la mazmorra)
  [c, x] = mk(84, 100);
  x.beginPath(); x.ellipse(42, 54, 36, 44, 0, Math.PI, 0); x.lineTo(78, 96); x.lineTo(62, 96); x.lineTo(62, 56);
  x.ellipse(42, 56, 20, 30, 0, 0, Math.PI, true); x.lineTo(22, 96); x.lineTo(6, 96); x.closePath();
  x.fillStyle = '#8d8a9c'; x.fill(); x.lineWidth = 3; x.strokeStyle = OUT; x.stroke();
  x.fillStyle = 'rgba(255,255,255,0.18)'; x.beginPath(); x.ellipse(42, 54, 32, 40, 0, Math.PI * 1.1, Math.PI * 1.6); x.lineTo(42, 54); x.fill();
  for (const [bx, by] of [[14, 40], [70, 40], [42, 13], [24, 20], [60, 20]]) rrect(x, bx - 5, by - 4, 10, 8, 2, '#a3a0b4', 2);
  rrect(x, 2, 90, 26, 9, 3, '#6f6c80', 2); rrect(x, 56, 90, 26, 9, 3, '#6f6c80', 2);
  register(scene, 'portal_frame', c);

  [c, x] = mk(64, 64);
  g = x.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.5, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0.05)');
  x.fillStyle = g; x.beginPath(); x.arc(32, 32, 31, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 3;
  for (let k = 0; k < 3; k++) {
    x.beginPath();
    for (let a = 0; a < Math.PI * 2.2; a += 0.1) {
      const r = 3 + a * 4.2, ang = a + (k * Math.PI * 2) / 3;
      const px = 32 + Math.cos(ang) * r, py = 32 + Math.sin(ang) * r;
      a === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
    }
    x.stroke();
  }
  register(scene, 'portal_swirl', c);

  [c, x] = mk(22, 34);
  poly(x, [[11, 1], [19, 12], [16, 32], [6, 32], [3, 12]], '#ffffff', 2);
  poly(x, [[11, 3], [15, 12], [11, 30]], 'rgba(0,0,0,0.12)', 0);
  register(scene, 'crystal', c);

  scene.textures.get('tiles').setFilter(Phaser.Textures.FilterMode.NEAREST);
}
