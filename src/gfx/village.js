// ============================================================
//  PUEBLO DE ALBOR: casas, puestos, pozo, barriles y cartel.
//  Arte procedural en el mismo estilo chibi (contorno grueso).
// ============================================================
const OUT = '#2a1b12';
function mk(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.lineJoin = 'round'; x.lineCap = 'round';
  return [c, x];
}
const stroke = (x, lw = 2.5) => { x.lineWidth = lw; x.strokeStyle = OUT; x.stroke(); };
function poly(x, pts, fill, lw = 2.5) { x.beginPath(); x.moveTo(...pts[0]); for (const p of pts.slice(1)) x.lineTo(...p); x.closePath(); if (fill) { x.fillStyle = fill; x.fill(); } if (lw) stroke(x, lw); }
function rect(x, a, b, w, h, r, fill, lw = 2.5) { x.beginPath(); x.roundRect(a, b, w, h, r); if (fill) { x.fillStyle = fill; x.fill(); } if (lw) stroke(x, lw); }
function ell(x, a, b, rx, ry, fill, lw = 2.5) { x.beginPath(); x.ellipse(a, b, rx, ry, 0, 0, Math.PI * 2); if (fill) { x.fillStyle = fill; x.fill(); } if (lw) stroke(x, lw); }
function ln(x, pts, color, lw) { x.beginPath(); x.moveTo(...pts[0]); for (const p of pts.slice(1)) x.lineTo(...p); x.lineWidth = lw; x.strokeStyle = color; x.stroke(); }
function register(scene, key, c) { if (scene.textures.exists(key)) scene.textures.remove(key); scene.textures.addCanvas(key, c); }
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };

/** Casa vista en 3/4: tejado grande, fachada con puerta y ventanas. */
function house(scene, key, wall, roof, opts = {}) {
  const W = opts.w || 176, H = 176;
  const [c, x] = mk(W, H);
  ell(x, W / 2, H - 8, W * 0.46, 9, 'rgba(0,0,0,.25)', 0);
  const wy = 86, wh = H - 14 - wy;
  rect(x, 18, wy, W - 36, wh, 3, wall);
  for (const bx of [18, W / 2 - 3, W - 24]) rect(x, bx, wy, 6, wh, 0, '#6e4a2e', 1.5);       // vigas
  rect(x, 18, wy + wh - 10, W - 36, 10, 2, '#8a8478', 2);                                    // zócalo
  rect(x, W / 2 - 15, wy + wh - 50, 30, 50, [12, 12, 0, 0], '#6a4228');                       // puerta
  ell(x, W / 2 + 8, wy + wh - 24, 2.2, 2.2, '#ffd34d', 1);
  for (const wx of [36, W - 66]) { rect(x, wx, wy + 16, 30, 26, 3, '#9fd8ff'); ln(x, [[wx + 15, wy + 16], [wx + 15, wy + 42]], OUT, 2); ln(x, [[wx, wy + 29], [wx + 30, wy + 29]], OUT, 2); ell(x, wx + 9, wy + 22, 3, 2, 'rgba(255,255,255,.7)', 0); }
  rect(x, W - 52, 6, 16, 40, 2, '#8a8478');                                                   // chimenea
  poly(x, [[4, wy + 6], [W - 4, wy + 6], [W - 26, 24], [26, 24]], roof);                       // tejado
  for (let i = 1; i < 4; i++) { const y = 24 + i * ((wy + 6 - 24) / 4); const k = (y - 24) / (wy + 6 - 24); ln(x, [[26 - k * 22, y], [W - 26 + k * 22, y]], shade(roof, 0.72), 2); }
  for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9; ln(x, [[26 + t * (W - 52), 26], [4 + t * (W - 8), wy + 4]], shade(roof, 0.82), 1.4); }
  poly(x, [[4, wy + 6], [W - 4, wy + 6], [W - 26, 24], [26, 24]], null);
  rect(x, 22, 18, W - 44, 8, 3, shade(roof, 1.25), 2);                                        // cumbrera
  if (opts.sign) {
    rect(x, W / 2 - 34, wy - 2, 68, 18, 4, '#d9b27a', 2);
    x.font = 'bold 12px Trebuchet MS'; x.fillStyle = '#3a2410'; x.textAlign = 'center'; x.fillText(opts.sign, W / 2, wy + 11);
  }
  register(scene, key, c);
}
function stall(scene, key, cloth) {
  const [c, x] = mk(116, 100);
  ell(x, 58, 92, 52, 7, 'rgba(0,0,0,.22)', 0);
  for (const px of [14, 98]) rect(x, px, 28, 6, 62, 2, '#7a5232', 2);
  rect(x, 8, 58, 100, 30, 3, '#8a5a32');
  rect(x, 12, 50, 92, 12, 2, '#a87a48', 2);
  for (const [fx, col] of [[26, '#ff6a5a'], [42, '#ffd34d'], [58, '#7dd65a'], [74, '#ff9a3a'], [90, '#c58bff']]) ell(x, fx, 48, 6.5, 5, col, 1.8);
  for (let i = 0; i < 6; i++) poly(x, [[6 + i * 17.3, 14], [6 + (i + 1) * 17.3, 14], [6 + (i + 1) * 17.3, 32], [6 + i * 17.3, 32]], i % 2 ? '#ffffff' : cloth, 1.6);
  for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(6 + i * 17.3 + 8.65, 32, 8.65, 0, Math.PI); x.fillStyle = i % 2 ? '#ffffff' : cloth; x.fill(); stroke(x, 1.6); }
  rect(x, 4, 8, 108, 8, 3, cloth, 2);
  register(scene, key, c);
}
function well(scene) {
  const [c, x] = mk(70, 84);
  ell(x, 35, 78, 30, 6, 'rgba(0,0,0,.22)', 0);
  for (const px of [10, 56]) rect(x, px, 14, 5, 46, 1, '#7a5232', 2);
  poly(x, [[2, 18], [68, 18], [56, 2], [14, 2]], '#b5483a');
  ell(x, 35, 58, 28, 10, '#9a948c');
  rect(x, 7, 52, 56, 22, [0, 0, 10, 10], '#a8a298');
  for (const bx of [16, 30, 44, 56]) ln(x, [[bx, 54], [bx, 72]], 'rgba(0,0,0,.25)', 2);
  ell(x, 35, 54, 24, 7, '#3f8fd0', 2);
  ell(x, 30, 52, 6, 2, 'rgba(255,255,255,.6)', 0);
  register(scene, 'v_well', c);
}
function props(scene) {
  let [c, x] = mk(36, 44);
  ell(x, 18, 40, 15, 4, 'rgba(0,0,0,.22)', 0);
  rect(x, 4, 8, 28, 32, 8, '#9a6a3a'); for (const y of [14, 32]) ln(x, [[4, y], [32, y]], '#5a5a5a', 3); ell(x, 18, 9, 13, 4, '#7a5232', 2);
  register(scene, 'v_barrel', c);
  [c, x] = mk(40, 40);
  ell(x, 20, 36, 17, 4, 'rgba(0,0,0,.22)', 0);
  rect(x, 3, 6, 34, 30, 2, '#b58a4a'); ln(x, [[3, 6], [37, 36]], '#7a5232', 3); ln(x, [[37, 6], [3, 36]], '#7a5232', 3); rect(x, 3, 6, 34, 30, 2, null);
  register(scene, 'v_crate', c);
  [c, x] = mk(84, 70);
  ell(x, 42, 66, 16, 4, 'rgba(0,0,0,.22)', 0);
  rect(x, 39, 18, 6, 48, 2, '#7a5232', 2);
  poly(x, [[6, 10], [70, 10], [80, 22], [70, 34], [6, 34]], '#d9b27a');
  x.font = 'bold 15px Trebuchet MS'; x.fillStyle = '#3a2410'; x.textAlign = 'center'; x.fillText('ALBOR', 40, 28);
  register(scene, 'v_sign', c);
  [c, x] = mk(48, 40);
  ell(x, 24, 34, 20, 5, 'rgba(0,0,0,.22)', 0);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ell(x, 24 + Math.cos(a) * 15, 30 + Math.sin(a) * 5, 5.5, 4, '#8a8478', 1.8); }
  register(scene, 'v_firepit', c);
}
export function generateVillageTextures(scene) {
  house(scene, 'v_house_blue', '#efe1c2', '#3a6db5', { sign: 'Cuartel' });
  house(scene, 'v_house_purple', '#e9dcc5', '#6b4a8a', { sign: 'Portales' });
  house(scene, 'v_house_red', '#e8d8b5', '#b5483a', { sign: 'Herrería' });
  house(scene, 'v_house_inn', '#f1e3c6', '#c9783a', { w: 210, sign: 'Posada' });
  house(scene, 'v_house_green', '#f1e3c6', '#3e8a4a');
  stall(scene, 'v_stall_red', '#d94a4a');
  stall(scene, 'v_stall_blue', '#3a7ad9');
  well(scene);
  props(scene);
}
