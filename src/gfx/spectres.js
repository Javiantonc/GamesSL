// ============================================================
//  ESPECTROS del ejército del Mago: diseños originales hechos de
//  llama azul turquesa. Cada monstruo reclutado se convierte en uno
//  según su tipo. Dibujados a doble resolución (se muestran a 0,5).
// ============================================================

const RES = 2;
const OUTL = '#0d1626';
const D = '#1b2c46';   // cuerpo oscuro
const M = '#28507a';   // tono medio
const G = '#5ff2d6';   // llama / brillo
const L = '#c9fff4';   // brillo claro

function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w * RES; c.height = h * RES;
  const x = c.getContext('2d');
  x.scale(RES, RES);
  x.lineJoin = 'round'; x.lineCap = 'round';
  return [c, x];
}
function shape(x, draw, fill, lw = 2.2, stroke = OUTL) {
  x.beginPath(); draw(x); x.closePath();
  if (fill) { x.fillStyle = fill; x.fill(); }
  if (lw) { x.lineWidth = lw; x.strokeStyle = stroke; x.stroke(); }
}
function ell(x, cx, cy, rx, ry, fill, lw = 2.2, stroke = OUTL) {
  shape(x, (k) => k.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2), fill, lw, stroke);
}
function poly(x, pts, fill, lw = 2.2) {
  shape(x, (k) => { k.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) k.lineTo(p[0], p[1]); }, fill, lw);
}
function rrect(x, rx, ry, w, h, r, fill, lw = 2.2) { shape(x, (k) => k.roundRect(rx, ry, w, h, r), fill, lw); }
function line(x, pts, color, lw) {
  x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) x.lineTo(p[0], p[1]);
  x.lineWidth = lw; x.strokeStyle = color; x.stroke();
}
function glowEye(x, cx, cy, rx = 2.2, ry = 1.7) {
  ell(x, cx, cy, rx + 2.2, ry + 2.2, 'rgba(95,242,214,0.35)', 0);
  ell(x, cx, cy, rx, ry, '#ffffff', 0);
}
/** Cola de llama (los espectros flotan, no tienen piernas). */
function flameTail(x, cx, top, w, h) {
  const g = x.createLinearGradient(0, top, 0, top + h);
  g.addColorStop(0, M); g.addColorStop(0.6, G); g.addColorStop(1, 'rgba(201,255,244,0.4)');
  shape(x, (k) => {
    k.moveTo(cx - w / 2, top);
    k.bezierCurveTo(cx - w / 2, top + h * 0.55, cx - w * 0.15, top + h * 0.6, cx + w * 0.1, top + h);
    k.bezierCurveTo(cx + w * 0.05, top + h * 0.7, cx + w * 0.35, top + h * 0.7, cx + w * 0.3, top + h * 0.45);
    k.bezierCurveTo(cx + w * 0.45, top + h * 0.5, cx + w / 2, top + h * 0.3, cx + w / 2, top);
  }, g);
}
function register(scene, key, canvas) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}

export function generateSpectreTextures(scene) {
  let c, x;

  // ---------- Guerrero Espectral (tanque) ----------
  [c, x] = mk(48, 60);
  flameTail(x, 23, 36, 22, 24);
  ell(x, 10, 27, 7.5, 6.5, D); ell(x, 36, 27, 7.5, 6.5, D);                 // hombreras
  line(x, [[4, 25], [14, 22]], G, 1.6); line(x, [[42, 25], [32, 22]], G, 1.6);
  rrect(x, 11, 23, 24, 17, 7, M);                                           // torso
  line(x, [[16, 30], [30, 30]], 'rgba(95,242,214,0.5)', 1.4);
  ell(x, 23, 33, 3, 3, G, 1.6);                                             // núcleo
  poly(x, [[39, 36], [42, 4], [46, 6], [43, 37]], '#9ffcec', 2);             // espadón
  line(x, [[42.3, 8], [42.6, 33]], L, 1.2);
  rrect(x, 36, 34, 11, 3.5, 1.5, D, 1.8);
  ell(x, 39, 39, 4, 4, D);                                                  // mano
  ell(x, 7, 37, 3.6, 3.6, D);
  shape(x, (k) => { k.moveTo(18, 7); k.quadraticCurveTo(20, -1, 23, 3); k.quadraticCurveTo(26, -2, 28, 7); }, G, 1.6); // cresta de llama
  ell(x, 23, 15, 13, 12, M);                                                // yelmo
  rrect(x, 13, 13, 20, 5.5, 2.5, '#0b1220', 1.8);                           // visera
  glowEye(x, 18.5, 15.7); glowEye(x, 27.5, 15.7);
  line(x, [[23, 4], [23, 12]], 'rgba(201,255,244,0.5)', 1.4);
  register(scene, 'spec_warrior', c);

  // ---------- Lobo Espectral (rápido) ----------
  [c, x] = mk(62, 46);
  shape(x, (k) => {
    k.moveTo(17, 25); k.bezierCurveTo(6, 25, 0, 14, 5, 4); k.bezierCurveTo(8, 12, 11, 11, 12, 6);
    k.bezierCurveTo(15, 13, 19, 16, 21, 22);
  }, G);
  ell(x, 9, 15, 3, 5, L, 0);
  rrect(x, 21, 30, 5, 12, 2, D); rrect(x, 37, 30, 5, 12, 2, D);             // patas
  ell(x, 31, 27, 15.5, 9.5, M);                                             // cuerpo
  poly(x, [[20, 20], [23, 12], [26, 19], [29, 9], [32, 18], [35, 10], [38, 19], [41, 13], [42, 21]], G, 1.8); // melena
  ell(x, 31, 31, 9, 3, 'rgba(95,242,214,0.25)', 0);
  poly(x, [[41, 15], [43, 4], [47, 13]], D, 1.8); poly(x, [[47, 14], [51, 4], [53, 15]], D, 1.8);
  line(x, [[43.5, 8], [44.5, 12]], G, 1.2); line(x, [[50.5, 8], [50.5, 12]], G, 1.2);
  ell(x, 47, 22, 11, 9.5, M);                                               // cabeza
  ell(x, 56, 25.5, 6, 4.5, D);                                              // hocico
  ell(x, 60.5, 24.5, 1.6, 1.3, L, 0);
  glowEye(x, 49.5, 20, 2.6, 1.6);
  line(x, [[52, 29], [57, 29]], 'rgba(201,255,244,0.6)', 1.2);
  register(scene, 'spec_wolf', c);

  // ---------- Hechicero Espectral (distancia) ----------
  [c, x] = mk(46, 64);
  flameTail(x, 22, 42, 20, 22);
  ell(x, 9.5, 31, 5, 4.5, M); ell(x, 35, 31, 5, 4.5, M);                    // mangas
  shape(x, (k) => { k.moveTo(14, 21); k.lineTo(30, 21); k.lineTo(35, 45); k.quadraticCurveTo(22, 49, 9, 45); }, M);
  line(x, [[22, 26], [22, 45]], G, 1.6);
  poly(x, [[11, 19], [16, 27], [22, 23], [28, 27], [33, 19]], D, 1.8);       // cuello alto
  line(x, [[37, 50], [39, 12]], OUTL, 4.2); line(x, [[37, 50], [39, 12]], L, 2.2); // bastón
  poly(x, [[39, 2], [42.5, 8.5], [39, 15], [35.5, 8.5]], G, 1.8);           // cristal
  ell(x, 38, 7, 1, 1.6, '#ffffff', 0);
  ell(x, 36, 33, 3.4, 3.4, D);                                              // mano
  ell(x, 22, 17, 10, 9.5, D);                                               // cara oscura
  poly(x, [[12, 13], [25, 0], [32, 13]], M, 2);                             // gorro puntiagudo
  rrect(x, 12, 10.5, 20, 4, 2, G, 1.6);
  glowEye(x, 18.5, 18.5, 2, 1.5); glowEye(x, 25.5, 18.5, 2, 1.5);
  register(scene, 'spec_caster', c);

  // ---------- Fuego Fatuo (curandero) ----------
  [c, x] = mk(34, 36);
  poly(x, [[7, 20], [9, 6], [13, 14], [17, 1], [21, 14], [25, 6], [27, 20]], G, 1.8);
  ell(x, 17, 23, 11.5, 10.5, G);
  ell(x, 17, 24, 7.5, 7, L, 0);
  ell(x, 13.5, 23, 1.7, 2.3, OUTL, 0); ell(x, 20.5, 23, 1.7, 2.3, OUTL, 0);
  ell(x, 13, 22.2, 0.6, 0.7, '#ffffff', 0); ell(x, 20, 22.2, 0.6, 0.7, '#ffffff', 0);
  x.beginPath(); x.arc(17, 26.5, 2, 0.2 * Math.PI, 0.8 * Math.PI); x.lineWidth = 1.4; x.strokeStyle = OUTL; x.stroke();
  ell(x, 10.5, 27, 2, 1.1, 'rgba(255,140,190,0.5)', 0); ell(x, 23.5, 27, 2, 1.1, 'rgba(255,140,190,0.5)', 0);
  register(scene, 'spec_wisp', c);

  // ---------- Grifo Espectral (jefe, vuela) ----------
  [c, x] = mk(92, 72);
  poly(x, [[22, 40], [3, 29], [9, 40], [3, 51]], G, 2);                     // cola de plumas
  line(x, [[8, 33], [20, 40]], L, 1.2); line(x, [[8, 47], [20, 41]], L, 1.2);
  rrect(x, 38, 52, 5.5, 13, 2.5, D); rrect(x, 52, 52, 5.5, 13, 2.5, D);     // patas
  poly(x, [[37, 64], [40, 69], [44, 64]], L, 1.4); poly(x, [[51, 64], [54, 69], [58, 64]], L, 1.4);
  ell(x, 43, 42, 21, 15, M);                                                // cuerpo
  ell(x, 56, 43, 10, 12, D);                                                // pecho
  for (const [px, py] of [[52, 38], [58, 38], [55, 44], [61, 44], [53, 50], [59, 50]]) {
    x.beginPath(); x.arc(px, py, 3, 0.1 * Math.PI, 0.9 * Math.PI); x.lineWidth = 1.3; x.strokeStyle = G; x.stroke();
  }
  poly(x, [[54, 17], [55, 3], [61, 13]], D, 2); poly(x, [[70, 13], [76, 3], [77, 17]], D, 2); // penachos
  ell(x, 65.5, 26, 15, 14, M);                                              // cabeza de búho
  ell(x, 65.5, 28, 11.5, 9.5, D, 1.6);                                      // disco facial
  for (const ex of [60.5, 70.5]) { ell(x, ex, 27, 4.4, 4.4, '#e9fffa', 1.6); ell(x, ex, 27, 2.2, 2.2, G, 0); ell(x, ex - 0.8, 26, 0.8, 0.8, '#ffffff', 0); }
  poly(x, [[63.5, 32], [67.5, 32], [65.5, 37]], L, 1.6);                    // pico
  register(scene, 'spec_griffin', c);

  [c, x] = mk(66, 52);
  shape(x, (k) => {
    k.moveTo(4, 44); k.quadraticCurveTo(8, 6, 40, 4); k.quadraticCurveTo(62, 4, 63, 14);
    k.lineTo(57, 22); k.quadraticCurveTo(53, 31, 47, 27); k.quadraticCurveTo(43, 37, 35, 33);
    k.quadraticCurveTo(29, 43, 22, 39); k.quadraticCurveTo(14, 50, 4, 44);
  }, M, 2.2);
  for (const [a, b] of [[[14, 36], [32, 14]], [[24, 36], [42, 12]], [[35, 30], [52, 12]], [[46, 24], [59, 13]]]) line(x, [a, b], G, 1.5);
  x.beginPath(); x.moveTo(8, 36); x.quadraticCurveTo(12, 9, 40, 7); x.quadraticCurveTo(58, 7, 60, 13);
  x.lineWidth = 2; x.strokeStyle = L; x.stroke();
  register(scene, 'spec_griffin_wing', c);
}
