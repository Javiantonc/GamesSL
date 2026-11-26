'use strict';
/* =========================================================================
   LUGARES: interiores de las casas del pueblo y mazmorras (una por portal).
   ========================================================================= */

/* ---------------------------------------------------------- muebles */
const FURN = {};
function furn(key, fn, w, h) { if (!FURN[key]) { const [c, x] = cnv(w, h); X = x; fn(); FURN[key] = c; } return FURN[key]; }
const ART2 = {
  table: () => furn('table', () => {
    toon(RR(10, 30, 8, 34, 2), '#6a4228', { shade: false }); toon(RR(102, 30, 8, 34, 2), '#6a4228', { shade: false });
    toon(RR(4, 18, 112, 22, 5), '#a8743e', { sx: 0, sy: 4 });
    toon(E(40, 16, 9, 6), '#e8e0d0', { shade: false, lw: 2 }); toon(RR(70, 4, 12, 14, 3), '#c8a050', { shade: false, lw: 2 });
  }, 120, 66),
  counter: () => furn('counter', () => {
    toon(RR(4, 22, 232, 50, 4), '#8a5a32', { sx: 0, sy: -6 }); toon(RR(0, 12, 240, 16, 4), '#b5824a', { sx: 0, sy: 3 });
    for (let i = 0; i < 4; i++) stroke([[30 + i * 58, 34], [30 + i * 58, 66]], '#6a4228', 2.4);
    toon(RR(30, -4, 16, 18, 4), '#7ad0a0', { shade: false, lw: 2 }); toon(RR(56, -2, 14, 16, 4), '#e0605a', { shade: false, lw: 2 }); toon(E(190, 6, 14, 8), '#e8e0d0', { shade: false, lw: 2 });
  }, 240, 74),
  anvil: () => furn('anvil', () => {
    toon(RR(30, 46, 40, 22, 3), '#5a5460', { shade: false });
    toon(PL([[6, 18], [94, 18], [80, 34], [64, 34], [64, 48], [36, 48], [36, 34], [20, 34]]), '#6e6878', { sx: 0, sy: 4 });
    stroke([[20, 22], [80, 22]], '#a8a2b0', 2);
  }, 100, 70),
  forge: () => furn('forge', () => {
    toon(RR(10, 20, 140, 100, 8), '#8a6a5a', { sx: -6, sy: 0 });
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) stroke([[14 + i * 35 + (j % 2) * 16, 32 + j * 22], [36 + i * 35 + (j % 2) * 16, 32 + j * 22]], '#6a4a3a', 2);
    toon(RR(40, 62, 80, 50, [30, 30, 4, 4]), '#2a1a14', { shade: false });
    toon(E(80, 100, 28, 12), '#ff9a3a', { shade: false, line: false }); dot(80, 98, 10, '#fff1a0');
    toon(RR(56, 0, 48, 24, 2), '#6a5a50', { shade: false });
  }, 160, 124),
  shelf: () => furn('shelf', () => {
    toon(RR(4, 4, 112, 146, 4), '#7a5236', { sx: -4, sy: 0 });
    for (let j = 0; j < 4; j++) {
      toon(RR(10, 14 + j * 34, 100, 26, 2), '#3a2a1e', { shade: false, lw: 1.6 });
      for (let i = 0; i < 6; i++) { const col = ['#e0605a', '#7ad0a0', '#5a8ae0', '#f0c040', '#b07ae0', '#c8a070'][(i * 3 + j) % 6]; if (j % 2) toon(RR(14 + i * 16, 18 + j * 34, 11, 22, 2), col, { shade: false, lw: 1.6 }); else toon(E(20 + i * 16, 32 + j * 34, 6, 8), col, { shade: false, lw: 1.6 }); }
    }
  }, 120, 152),
  bed: () => furn('bed', () => {
    toon(RR(4, 10, 92, 140, 8), '#8a5a32', { sx: -4, sy: 0 });
    toon(RR(10, 16, 80, 126, 6), '#f0ece0', { sx: -3, sy: -3 });
    toon(RR(10, 56, 80, 86, 6), '#5a8ae0', { sx: -3, sy: -3 });
    toon(RR(20, 22, 60, 26, 10), '#ffffff', { sx: -2, sy: -2 });
  }, 100, 152),
  rack: () => furn('rack', () => {
    toon(RR(6, 70, 128, 10, 2), '#6a4228', { shade: false }); toon(RR(6, 20, 128, 10, 2), '#6a4228', { shade: false });
    toon(RR(10, 14, 8, 80, 2), '#6a4228', { shade: false }); toon(RR(122, 14, 8, 80, 2), '#6a4228', { shade: false });
    const ws = ['dagger', 'staff', 'mace', 'axe'];
    ws.forEach((k, i) => { X.save(); X.translate(30 + i * 27, 56); X.scale(0.55, 0.55); X.translate(-30, -50); weapon(k, {}); X.restore(); });
  }, 140, 96),
  dummy: () => furn('dummy', () => {
    toon(RR(36, 30, 8, 86, 2), '#7a5236', { shade: false });
    toon(RR(10, 44, 60, 10, 4), '#7a5236', { shade: false });
    toon(E(40, 66, 20, 26), '#d8b878', { sx: -4, sy: -2 });
    toon(E(40, 26, 15, 15), '#d8b878', { sx: -3, sy: -2 });
    stroke([[26, 64], [54, 70]], '#a8884a', 2); stroke([[34, 22], [38, 26]], OUT, 2.4); stroke([[46, 22], [42, 26]], OUT, 2.4);
    toon(E(40, 118, 22, 6), '#6a4228', { shade: false });
  }, 80, 126),
  pedestal: () => furn('pedestal', () => {
    toon(RR(30, 60, 60, 50, 4), '#8a8478', { sx: -4, sy: 0 }); toon(RR(22, 52, 76, 12, 3), '#9a948a', { shade: false }); toon(RR(22, 106, 76, 12, 3), '#7a746a', { shade: false });
    toon(PL([[60, 4], [76, 26], [60, 50], [44, 26]]), '#a05ae0', { sx: -4, sy: -2 }); dot(56, 18, 3, '#fff');
  }, 120, 120),
  plant: () => furn('plant', () => {
    for (const [a, l] of [[-0.7, 34], [-0.2, 42], [0.3, 40], [0.8, 30]]) toon(E(30 + Math.sin(a) * l * 0.5, 40 - Math.cos(a) * l * 0.6, 8, 18, a), '#5f9440', { sx: -2, sy: -1, lw: 2 });
    toon(PL([[14, 50], [46, 50], [42, 76], [18, 76]]), '#c8703a', { sx: -3, sy: 0 });
  }, 60, 78),
  chest: () => furn('chest', () => {
    toon(RR(6, 24, 78, 44, 5), '#8a5a32', { sx: -4, sy: -3 }); toon(RR(4, 12, 82, 22, [10, 10, 2, 2]), '#a8743e', { sx: 0, sy: 3 });
    for (const x of [16, 70]) toon(RR(x - 3, 12, 6, 56, 1), '#c8a050', { shade: false, lw: 1.6 }); toon(RR(39, 30, 12, 12, 2), '#f0c040', { shade: false, lw: 1.6 });
  }, 90, 70),
  pillar: (col) => furn('pillar' + col, () => {
    toon(RR(14, 10, 52, 150, 4), tone(col, 0.9), { sx: -8, sy: 0, lw: 3 }); toon(RR(6, 0, 68, 16, 3), tone(col, 1.05), { shade: false, lw: 3 }); toon(RR(6, 152, 68, 16, 3), tone(col, 0.8), { shade: false, lw: 3 });
    for (let i = 0; i < 4; i++) stroke([[16, 40 + i * 30], [64, 40 + i * 30]], tone(col, 0.65), 2);
  }, 80, 170),
  bones: () => furn('bones', () => {
    stroke([[10, 30], [50, 20]], OUT, 9); stroke([[10, 30], [50, 20]], '#efe8d8', 5); stroke([[20, 12], [44, 34]], OUT, 9); stroke([[20, 12], [44, 34]], '#efe8d8', 5);
    toon(E(66, 22, 13, 11), '#efe8d8', { sx: -2, sy: -2 }); dot(62, 22, 3, OUT); dot(70, 22, 3, OUT);
  }, 84, 40),
  torch: () => furn('torch', () => { toon(RR(14, 20, 8, 30, 2), '#6a4228', { shade: false }); toon(RR(8, 16, 20, 8, 2), '#5a5460', { shade: false }); }, 36, 54),
};

/* ---------------------------------------------------------- interiores */
const IW = 1000, IH = 720;
const ROOMS = {
  cuartel: { name: 'Cuartel de clases', wall: '#6a7a9a', floor: '#a8743e', rug: '#3a5a9a' },
  portales: { name: 'Torre de portales', wall: '#6b5a8a', floor: '#8a7a9a', rug: '#6b4a8a' },
  herreria: { name: 'Herrería', wall: '#7a5a4a', floor: '#8a7a6a', rug: null },
  posada: { name: 'Posada El Limo Feliz', wall: '#9a6a4a', floor: '#b5824a', rug: '#a8452f' },
  consulta: { name: 'Consulta de la doctora', wall: '#6a9a7a', floor: '#c8a070', rug: '#3e8a4a' },
};
/** Personajes de dentro de las casas (posición relativa a la sala). */
const INSIDE = {
  cuartel: [
    ['sombra', 'Vex', 'Instructora de pícaros', 170, 330, { gender: 'chica', skin: SKINS[2], hair: '#3a2a24', style: 'coleta', eye: '#3f7a4a', outfit: '#4a4a52', wear: 'leather', hat: 'hooddown', weapon: 'dagger', face: 'decidido' }, 'class:picaro'],
    ['selene', 'Archimaga Selene', 'Instructora de magos', 340, 300, { gender: 'chica', skin: SKINS[0], hair: '#d9d6cc', style: 'largo', eye: '#3d5a8a', outfit: '#3d5a8a', wear: 'robe', hat: 'wizard', weapon: 'staff', face: 'serio' }, 'class:mago'],
    ['aldric', 'Sir Aldric', 'Instructor de paladines', 500, 290, { gender: 'chico', skin: SKINS[1], hair: '#e6c068', style: 'corto', eye: '#3d5a8a', outfit: '#c9a24a', wear: 'plate', hat: 'helm', weapon: 'mace', face: 'decidido' }, 'class:paladin'],
    ['brakka', 'Brakka', 'Instructor de guerreros', 660, 300, { gender: 'chico', skin: SKINS[3], hair: '#a8342a', style: 'pincho', eye: '#6b4226', outfit: '#a8452f', wear: 'mail', hat: 'coif', weapon: 'axe', beard: '#a8342a', face: 'enfadado' }, 'class:guerrero'],
    ['morwen', 'Morwen', 'Instructora de brujos', 830, 330, { gender: 'chica', skin: '#e8d0e0', hair: '#3a2a3a', style: 'largo', eye: '#7a3a8a', outfit: '#6b4a7a', wear: 'darkrobe', hat: 'hood', weapon: 'dagger', face: 'serio' }, 'class:brujo'],
  ],
  portales: [['orvin', 'Maestro Orvin', 'Guardián de portales', 500, 380, VILLAGERS_LOOK('orvin'), 'travel']],
  herreria: [['brunilda', 'Brunilda', 'Herrera · Herrería', 600, 360, VILLAGERS_LOOK('brunilda'), 'prof:herreria']],
  posada: [
    ['marta', 'Marta', 'Posadera', 500, 300, VILLAGERS_LOOK('marta'), 'inn'],
    ['chispa', 'Ingeniera Chispa', 'Ingeniería', 790, 470, { gender: 'chica', skin: SKINS[1], hair: '#e6c068', style: 'coleta', eye: '#3d5a8a', outfit: '#c9a24a', wear: 'tunic', hat: 'cap', hatC: '#6e6e78', apron: '#6a5a4a', weapon: 'hammer', face: 'alegre' }, 'prof:ingenieria'],
  ],
  consulta: [['amalia', 'Doctora Amalia', 'Medicina', 520, 330, { gender: 'chica', skin: SKINS[3], hair: '#3a2a24', style: 'mono', eye: '#6b4226', outfit: '#f0ece0', wear: 'robe', apron: '#ffffff', weapon: 'mug', face: 'alegre' }, 'prof:medicina']],
};
function VILLAGERS_LOOK(id) { return null; }   // se rellena desde game.js (los aldeanos se definen allí)
function roomGround(R) {
  const [c, x] = cnv(IW, IH, 1); X = x;
  x.fillStyle = '#1a1410'; x.fillRect(0, 0, IW, IH);
  // pared del fondo
  x.fillStyle = R.wall; x.fillRect(40, 20, IW - 80, 170);
  x.fillStyle = tone(R.wall, 0.8); for (let i = 0; i < 9; i++) x.fillRect(40 + i * 115, 20, 10, 170);
  x.fillStyle = tone(R.wall, 0.7); x.fillRect(40, 160, IW - 80, 30);
  for (const wx of [200, IW - 260]) { toon(RR(wx, 50, 60, 70, 4), '#9ad0f0', { sx: 0, sy: 0, lw: 4 }); stroke([[wx + 30, 50], [wx + 30, 120]], OUT, 3); stroke([[wx, 85], [wx + 60, 85]], OUT, 3); }
  // suelo de tablas
  x.fillStyle = R.floor; x.fillRect(40, 190, IW - 80, IH - 230);
  const r = wrng(R.name.length);
  for (let y = 190; y < IH - 40; y += 34) {
    stroke([[40, y], [IW - 40, y]], tone(R.floor, 0.72), 2);
    for (let xx = 40 + (y % 68 ? 60 : 0) + r() * 40; xx < IW - 40; xx += 160 + r() * 60) stroke([[xx, y], [xx, y + 34]], tone(R.floor, 0.72), 2);
  }
  if (R.rug) { x.globalAlpha = 0.95; toon(RR(IW / 2 - 220, 300, 440, 260, 30), R.rug, { sx: 0, sy: 0, lw: 3 }); x.globalAlpha = 1; x.setLineDash([10, 8]); x.beginPath(); x.roundRect(IW / 2 - 200, 318, 400, 224, 22); x.strokeStyle = '#f0d890'; x.lineWidth = 3; x.stroke(); x.setLineDash([]); }
  // paredes laterales y marco
  x.lineWidth = 6; x.strokeStyle = OUT; x.strokeRect(40, 20, IW - 80, IH - 60);
  // puerta de salida
  toon(RR(IW / 2 - 50, IH - 46, 100, 30, 4), '#6a4228', { shade: false, lw: 3 });
  toon(RR(IW / 2 - 40, IH - 56, 80, 18, 6), '#c8a050', { shade: false, lw: 2 });
  return c;
}
function buildRoom(id) {
  const R = ROOMS[id], S = newScene(id, 'room', IW, IH, R.name);
  S.ground = roomGround(R);
  S.block = (x, y) => x < 66 || x > IW - 66 || y < 210 || y > IH - 32;
  S.doors.push({ x: IW / 2, y: IH - 36, exit: id });
  const F = (key, x, y, solid, arg) => { const img = ART2[key](arg); place(S, img, x, y, { w: img.width / 2, h: img.height / 2, solid, shadow: 0 }); };
  F('plant', 80, 220, null); F('plant', IW - 80, 220, null);
  if (id === 'cuartel') { F('rack', IW / 2, 200, null); for (const dx of [-330, -160, 160, 330]) F('dummy', IW / 2 + dx, 470, [-14, -10, 28, 10]); }
  if (id === 'herreria') { F('forge', 260, 220, null); F('anvil', 470, 380, [-44, -26, 88, 24]); F('rack', 760, 200, null); F('chest', 840, 560, [-40, -24, 80, 22]); S.lights.push({ x: 260, y: 200, r: 200, fire: true }); }
  if (id === 'posada') { F('counter', 500, 250, [-120, -40, 240, 38]); for (const [x, y] of [[230, 420], [230, 580], [760, 580]]) F('table', x, y, [-56, -26, 112, 24]); F('shelf', 160, 200, null); S.lights.push({ x: 500, y: 200, r: 180 }); }
  if (id === 'consulta') { F('shelf', 160, 200, null); F('shelf', 290, 200, null); F('bed', 760, 340, [-48, -140, 96, 136]); F('bed', 880, 340, [-48, -140, 96, 136]); F('table', 520, 470, [-56, -26, 112, 24]); }
  if (id === 'portales') { F('pedestal', 500, 300, [-40, -40, 80, 38]); F('shelf', 160, 200, null); F('shelf', 840, 200, null); S.lights.push({ x: 500, y: 240, r: 200 }); }
  for (const [nid, name, title, x, y, look, role] of INSIDE[id]) {
    const V = { name, title, look: look || VILLAGERS[nid].look, greet: (VILLAGERS[nid] && VILLAGERS[nid].greet) || '', role };
    S.npcs.push({ id: nid, V, x, y, dir: 0, t: Math.random() * 10 });
    addSolid(S, { x: x - 12, y: y - 10, w: 24, h: 12 });
  }
  return S;
}

/* ---------------------------------------------------------- mazmorras */
function buildDungeon(P) {
  const r = wrng(1000 + P.i * 17), S = newScene('dg' + P.i, 'dungeon', 3400, 1500, `Mazmorra ${P.name}`);
  S.portal = P; S.dark = true;
  const rooms = [], rects = [];
  let x = 120, y = 560;
  const n = 5 + Math.min(2, Math.floor(P.i / 3));
  for (let k = 0; k < n; k++) {
    const boss = k === n - 1, w = boss ? 620 : 360 + r() * 120, h = boss ? 480 : 300 + r() * 100;
    const R = { x, y: clamp(y - h / 2, 80, S.H - h - 40), w, h, boss };
    rooms.push(R); rects.push(R);
    if (k < n - 1) {
      const ny = 250 + r() * 1000, nx = x + w + 120 + r() * 80;
      const cy1 = R.y + R.h / 2, cx2 = nx + 60;
      rects.push({ x: x + w - 20, y: cy1 - 50, w: cx2 - x - w + 70, h: 100, cor: true });
      const ty = clamp(ny, 160, S.H - 200);
      rects.push({ x: cx2 - 50, y: Math.min(cy1, ty) - 50, w: 100, h: Math.abs(ty - cy1) + 100, cor: true });
      x = nx; y = ty;
    }
  }
  S.W = Math.max(...rooms.map((R) => R.x + R.w)) + 160;
  S.rects = rects; S.rooms = rooms;
  S.block = (px, py) => !rects.some((R) => px > R.x + 16 && px < R.x + R.w - 16 && py > R.y + (R.cor ? 18 : 46) && py < R.y + R.h - 10);
  // suelo
  const [c, g] = cnv(S.W, S.H, 0.5); X = g;
  g.fillStyle = '#120e12'; g.fillRect(0, 0, S.W, S.H);
  const fl = tone(P.col, 0.45), wl = tone(P.col, 0.3);
  for (const R of rects) { g.fillStyle = OUT; g.fillRect(R.x - 8, R.y - 70, R.w + 16, R.h + 78); }
  for (const R of rects) { g.fillStyle = wl; g.fillRect(R.x, R.y - 62, R.w, 70); for (let i = 0; i < R.w; i += 46) { g.fillStyle = tone(P.col, 0.24); g.fillRect(R.x + i, R.y - 62 + ((i / 46) % 2) * 30, 4, 30); } }
  for (const R of rects) {
    g.fillStyle = fl; g.fillRect(R.x, R.y + 8, R.w, R.h - 8);
    for (let ty = R.y + 8; ty < R.y + R.h; ty += 48) for (let tx = R.x; tx < R.x + R.w; tx += 48) { g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.08)'; g.fillRect(tx + 2, ty + 2, Math.min(44, R.x + R.w - tx - 2), Math.min(44, R.y + R.h - ty - 2)); }
  }
  for (const R of rooms) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(R.x, R.y + 8, R.w, 22); }
  S.ground = c; S.gk = 0.5;
  // decoración, antorchas y monstruos
  const types = mobTypesFor(P.lvl);
  rooms.forEach((R, k) => {
    for (let t = 0; t < 2; t++) { const tx = R.x + R.w * (0.25 + t * 0.5); place(S, ART2.torch(), tx, R.y - 6, { w: 36, h: 54, shadow: 0 }); S.lights.push({ x: tx, y: R.y - 40, r: 170, fire: true, torch: true }); }
    if (!R.boss && r() < 0.7) place(S, ART2.bones(), R.x + 60 + r() * (R.w - 120), R.y + 100 + r() * (R.h - 140), { w: 84, h: 40, shadow: 0 });
    if (R.boss) for (const [fx, fy] of [[0.18, 0.35], [0.82, 0.35], [0.18, 0.85], [0.82, 0.85]]) place(S, ART2.pillar(P.col), R.x + R.w * fx, R.y + R.h * fy, { w: 80, h: 170, solid: [-30, -16, 60, 14], shadow: 30 });
    if (k === 0) { S.doors.push({ x: R.x + 90, y: R.y + R.h / 2 + 20, exit: 'dungeon' }); S.start = { x: R.x + 170, y: R.y + R.h / 2 + 20 }; return; }
    if (R.boss) {
      const m = makeMob('caballero', R.x + R.w / 2, R.y + R.h / 2 + 40, P.lvl + 2);
      Object.assign(m, { boss: true, sc: 1.7, name: `Guardián ${P.name}`, leash: 2000 });
      m.max = m.hp = m.hp * 7; m.dmg = Math.round(m.dmg * 1.4); m.xp *= 6;
      S.mobs.push(m); S.bossRoom = R;
      return;
    }
    const cnt = 2 + Math.floor(r() * 3);
    for (let i = 0; i < cnt; i++) S.mobs.push(makeMob(types[(r() * types.length) | 0], R.x + 60 + r() * (R.w - 120), R.y + 90 + r() * (R.h - 120), P.lvl + ((r() * 2) | 0), true));
  });
  return S;
}
/** Tipos de monstruo adecuados a un nivel. */
function mobTypesFor(lvl) {
  const ring = lvl <= 4 ? 0 : lvl <= 9 ? 1 : 2;
  return Object.keys(MONSTERS).filter((t) => MONSTERS[t].ring === ring);
}
function makeMob(type, x, y, lvl, noRespawn) {
  const D = MONSTERS[type], hp = Math.round((18 + lvl * 12) * D.hp);
  return { type, x, y, hx: x, hy: y, lvl, hp, max: hp, dmg: Math.round((3 + lvl * 2) * D.dmg), xp: Math.round((8 + lvl * 6) * D.hp), state: 'idle', t: Math.random() * 5, atk: 0, dots: [], dead: false, hit: 0, tx: x, ty: y, flip: Math.random() < 0.5, noRespawn };
}
