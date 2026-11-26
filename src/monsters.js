'use strict';
/* =========================================================================
   CRIATURAS (diseños originales en el mismo estilo dibujado).
   Vista de frente; para mirar al otro lado se refleja.
   ========================================================================= */
const MONSTERS = {
  limo:        { name: 'Limo', lvl: [1, 3], ring: 0, hp: 1, dmg: 1, speed: 70, size: 1, body: 'blob', skin: '#8ac05a' },
  duende:      { name: 'Duende saqueador', lvl: [2, 4], ring: 0, hp: 1.1, dmg: 1.1, speed: 95, size: 0.88, head: 'goblin', skin: '#6f9a48', wear: 'leather', weapon: { kind: 'axe', shape: 'simple', mat: 'acero' } },
  espantapajaros: { name: 'Espantapájaros', lvl: [2, 4], ring: 0, hp: 1, dmg: 1, speed: 80, size: 0.95, head: 'scarecrow', skin: '#d8b878', wear: 'rags', weapon: null },
  diablillo:   { name: 'Diablillo', lvl: [4, 6], ring: 1, hp: 1, dmg: 1.2, speed: 110, size: 0.85, head: 'imp', skin: '#b5463a', wear: 'loin', tail: true },
  momia:       { name: 'Momia', lvl: [4, 6], ring: 1, hp: 1.3, dmg: 1, speed: 65, size: 0.95, head: 'mummy', skin: '#d8cbb0', wear: 'bandage' },
  zombi:       { name: 'Zombi', lvl: [5, 7], ring: 1, hp: 1.4, dmg: 1.1, speed: 60, size: 1, head: 'zombie', skin: '#7a9a58', wear: 'rags' },
  necrofago:   { name: 'Necrófago', lvl: [6, 8], ring: 2, hp: 1.1, dmg: 1.3, speed: 105, size: 0.9, head: 'ghoul', skin: '#7a9ac0', wear: 'loin', claws: true },
  esqueleto:   { name: 'Esqueleto guerrero', lvl: [6, 8], ring: 2, hp: 1.2, dmg: 1.3, speed: 85, size: 0.95, head: 'skull', skin: '#e0d6bc', wear: 'darkarmor', weapon: { kind: 'sword', mat: 'acero' } },
  gargola:     { name: 'Gárgola', lvl: [7, 9], ring: 2, hp: 1.3, dmg: 1.3, speed: 95, size: 0.95, head: 'gargoyle', skin: '#4a4650', wear: 'none', wings: true, tail: true, claws: true },
  encapuchado: { name: 'Sectario sombrío', lvl: [7, 9], ring: 2, hp: 1.1, dmg: 1.5, speed: 90, size: 0.95, head: 'hood', skin: '#3a3a5a', wear: 'robe', glow: '#a8e05a' },
  ogro:        { name: 'Ogro pardo', lvl: [8, 10], ring: 2, hp: 2, dmg: 1.6, speed: 70, size: 1.2, head: 'ogre', skin: '#a8724a', wear: 'loin' },
  caballero:   { name: 'Caballero maldito', lvl: [9, 10], ring: 2, hp: 2.2, dmg: 1.7, speed: 75, size: 1.1, head: 'knight', skin: '#3d6aa8', wear: 'plate', weapon: { kind: 'sword', mat: 'sombra', glow: true } },
};
const monCache = new Map();
function monsterSprite(type, f = 0, atk = false) {
  const key = type + f + atk;
  if (monCache.has(key)) return monCache.get(key);
  const D = MONSTERS[type];
  const c = document.createElement('canvas'); c.width = TW * TRES; c.height = TH * TRES;
  X = c.getContext('2d'); X.scale(TRES, TRES); X.translate(FX, FY); X.lineJoin = 'round'; X.lineCap = 'round';
  if (D.animal) drawAnimal(D, f, atk); else if (D.body === 'blob') drawBlob(D, f, atk); else drawBeast(D, f, atk);
  monCache.set(key, c);
  return c;
}

function drawBlob(D, f, atk) {
  const b = D.skin, sq = f === 1 || atk;
  const w = sq ? 32 : 27, h = sq ? 34 : 42;
  toon((k) => {
    k.moveTo(-w, -2); k.quadraticCurveTo(-w - 2, -h * 0.5, -w * 0.6, -h * 0.85); k.quadraticCurveTo(0, -h - 6, w * 0.6, -h * 0.85);
    k.quadraticCurveTo(w + 2, -h * 0.5, w, -2);
    // gotas en la base
    k.quadraticCurveTo(w * 0.8, 4, w * 0.6, -1); k.quadraticCurveTo(w * 0.4, 5, w * 0.15, -1); k.quadraticCurveTo(-w * 0.15, 6, -w * 0.4, -1); k.quadraticCurveTo(-w * 0.7, 4, -w, -2);
    k.closePath();
  }, b, { sx: -6, sy: -5, lw: 3 });
  dot(-w * 0.45, -h * 0.7, 5, 'rgba(255,255,255,.55)'); dot(-w * 0.62, -h * 0.5, 2.6, 'rgba(255,255,255,.45)');
  for (const x of [w * 0.55, -w * 0.2]) { X.beginPath(); X.ellipse(x, -h * 0.25 + 4, 3, 5, 0, 0, 7); X.fillStyle = tone(b, 1.15); X.fill(); }
  // cara con ojos medio cerrados (aburrido) o abiertos al atacar
  const ey = -h * 0.55;
  for (const s of [-1, 1]) {
    X.beginPath(); X.ellipse(s * 9, ey, 5.5, 4.4, 0, 0, 7); X.fillStyle = '#fff'; X.fill(); X.lineWidth = 2; X.strokeStyle = OUT; X.stroke();
    dot(s * 9, ey + 1.2, 2.2, OUT);
    if (!atk) { X.beginPath(); X.ellipse(s * 9, ey - 1.5, 6.3, 3.4, 0, Math.PI, 0); X.fillStyle = tone(b, 0.9); X.fill(); X.stroke(); }
  }
  if (atk) { X.beginPath(); X.ellipse(0, ey + 12, 6, 5, 0, 0, 7); X.fillStyle = '#5a2a26'; X.fill(); X.lineWidth = 2; X.strokeStyle = OUT; X.stroke(); }
  else { X.beginPath(); X.moveTo(-6, ey + 13); X.quadraticCurveTo(0, ey + 7, 6, ey + 13); X.lineWidth = 2.4; X.strokeStyle = OUT; X.stroke(); }
}

/** Criatura con piernas, brazos y una cabeza grande y expresiva. */
function drawBeast(D, f, atk) {
  const sk = D.skin, step = f ? 3 : 0, bob = f ? -1.5 : 0;
  const hy = -62 + bob;
  const cloth = { leather: '#7a5236', rags: '#8a6a44', loin: '#6b4630', bandage: sk, darkarmor: '#4a4a52', robe: '#3a3460', plate: sk, none: sk }[D.wear];
  // alas y cola por detrás
  if (D.wings) for (const s of [-1, 1]) toon((k) => { k.moveTo(s * 10, -40 + bob); k.quadraticCurveTo(s * 34, -74, s * 50, -64); k.lineTo(s * 44, -52); k.lineTo(s * 48, -40); k.lineTo(s * 38, -36); k.lineTo(s * 36, -24); k.quadraticCurveTo(s * 22, -30, s * 10, -26); k.closePath(); }, tone(sk, 0.9), { sx: s * 3, sy: -2 });
  if (D.tail) { X.beginPath(); X.moveTo(8, -18); X.quadraticCurveTo(30, -10, 26, -30); X.lineWidth = 6; X.strokeStyle = OUT; X.stroke(); X.lineWidth = 3; X.strokeStyle = sk; X.stroke(); toon(PL([[26, -36], [31, -27], [21, -28]]), sk, { shade: false, lw: 2 }); }
  if (D.wear === 'robe') toon((k) => { k.moveTo(-16, -44 + bob); k.lineTo(16, -44 + bob); k.lineTo(22, -3); k.quadraticCurveTo(0, 1, -22, -3); k.closePath(); }, cloth);
  // piernas cortas y fuertes
  if (D.wear !== 'robe') for (const s of [-1, 1]) {
    const lift = s === -1 ? step : -step;
    const legC = D.wear === 'darkarmor' || D.wear === 'plate' ? tone(cloth, 0.85) : D.wear === 'bandage' ? sk : D.wear === 'rags' ? '#5a4a3a' : sk;
    toon(RR(s * 7 - 5.5, -22 + bob - Math.max(0, lift), 11, 17, 4), legC);
    if (D.wear === 'bandage') for (let y = -18; y < -6; y += 4) stroke([[s * 7 - 5, y + bob], [s * 7 + 5, y + 2 + bob]], tone(sk, 0.7), 1.2);
    toon(E(s * 8, -4 - Math.max(0, lift), 8.5, 5), D.wear === 'plate' || D.wear === 'darkarmor' ? '#5d6470' : D.head === 'ogre' || D.head === 'imp' || D.head === 'ghoul' || D.head === 'gargoyle' ? tone(sk, 0.9) : '#5a3a22');
    if (D.claws || D.head === 'imp') for (const t of [-4, 0, 4]) dot(s * 8 + t, -1 - Math.max(0, lift), 1.4, '#e8e0cc');
  }
  // torso
  const tw = D.head === 'ogre' ? 20 : 16;
  if (D.wear !== 'robe') toon((k) => { k.moveTo(-tw, -46 + bob); k.quadraticCurveTo(-tw - 3, -30, -tw + 2, -18 + bob); k.lineTo(tw - 2, -18 + bob); k.quadraticCurveTo(tw + 3, -30, tw, -46 + bob); k.closePath(); }, D.wear === 'leather' || D.wear === 'rags' || D.wear === 'darkarmor' || D.wear === 'plate' ? cloth : sk);
  if (D.wear === 'loin' || D.wear === 'none') { stroke([[-6, -38 + bob], [-2, -36 + bob]], tone(sk, 0.7), 1.6); stroke([[6, -38 + bob], [2, -36 + bob]], tone(sk, 0.7), 1.6); stroke([[0, -34 + bob], [0, -26 + bob]], tone(sk, 0.75), 1.4); }
  if (D.wear === 'bandage') for (let y = -44; y < -18; y += 5) stroke([[-tw + 1, y + bob], [tw - 1, y + 3 + bob]], tone(sk, 0.7), 1.3);
  if (D.wear === 'leather') { stroke([[-12, -44 + bob], [12, -22 + bob]], '#4a2f1c', 3); }
  if (D.wear === 'rags') { toon(PL([[-tw, -46 + bob], [tw, -46 + bob], [tw - 2, -40 + bob], [-tw + 2, -40 + bob]]), '#6b5a3a', { shade: false }); }
  if (D.wear === 'plate' || D.wear === 'darkarmor') { toon(E(0, -34 + bob, 8, 7), tone(cloth, 1.15), { shade: false, lw: 2 }); for (const s of [-1, 1]) toon(E(s * (tw + 1), -43 + bob, 8, 6), D.wear === 'plate' ? '#c9a24a' : '#5d6470', { sx: s > 0 ? -2 : 2, sy: -1.5 }); }
  // taparrabos / cinturón
  if (D.wear === 'loin' || D.wear === 'none' && D.head !== 'gargoyle') toon(PL([[-tw + 1, -21 + bob], [tw - 1, -21 + bob], [tw - 3, -10], [8, -13], [4, -8], [0, -12], [-4, -8], [-8, -13], [-tw + 3, -10]]), '#6b4630');
  if (D.wear !== 'bandage' && D.wear !== 'loin' && D.wear !== 'none') { toon(RR(-tw, -22 + bob, tw * 2, 5.5, 2), '#4a2f1c', { shade: false, lw: 2 }); toon(RR(-3.5, -23 + bob, 7, 7, 1.5), '#c9a24a', { shade: false, lw: 1.8 }); }
  // brazos: garras abiertas o puños
  for (const s of [-1, 1]) {
    const up = atk && s === 1;
    const hx = s * (tw + 6), hyy = up ? -50 + bob : -28 + bob - (s === -1 ? step * 0.5 : -step * 0.5);
    const armC = D.wear === 'plate' || D.wear === 'darkarmor' ? tone(cloth, 0.9) : D.wear === 'robe' ? cloth : D.wear === 'rags' ? sk : sk;
    toon((k) => { k.moveTo(s * (tw - 3), -45 + bob); k.quadraticCurveTo(s * (tw + 9), -42 + bob, hx + s * 3, hyy); k.lineTo(hx - s * 4, hyy + 2); k.quadraticCurveTo(s * (tw + 2), -36 + bob, s * (tw - 4), -36 + bob); k.closePath(); }, armC, { sx: -1.5, sy: 0 });
    if (D.wear === 'bandage') stroke([[hx - 3, hyy - 6], [hx + 3, hyy - 4]], tone(sk, 0.7), 1.2);
    if (s === 1 && D.weapon) drawWeapon(D.weapon, hx, hyy, up ? 0.9 : 0.25);
    if (D.claws) { toon(E(hx, hyy + 1, 5.5, 5), sk); for (const t of [-1, 0, 1]) stroke([[hx + t * 3, hyy + 4], [hx + t * 4, hyy + 9]], OUT, 2.2); }
    else toon(E(hx, hyy + 1, 5.6, 5.2), D.wear === 'plate' || D.wear === 'darkarmor' ? '#5d6470' : D.wear === 'rags' && D.head === 'scarecrow' ? '#8a6a44' : D.head === 'mummy' ? sk : D.wear === 'leather' ? '#5a3a22' : sk);
  }
  beastHead(D, hy, atk);
}

function angryEyes(y, sep = 8, r = 5, pupil = OUT, white = '#ffffff') {
  r *= 1.15;
  for (const s of [-1, 1]) {
    X.beginPath(); X.ellipse(s * sep, y, r, r * 0.85, 0, 0, 7); X.fillStyle = white; X.fill(); X.lineWidth = 2.2; X.strokeStyle = OUT; X.stroke();
    if (pupil) { dot(s * sep - s * 1, y + 1, r * 0.42, pupil); dot(s * sep - s * 1 - 0.8, y, r * 0.12, '#ffffff'); }
    // ceja enfadada gruesa por encima del ojo
    X.beginPath(); X.moveTo(s * (sep + r + 0.5), y - r * 0.95); X.lineTo(s * (sep - r - 1.5), y - r * 1.55);
    X.lineWidth = 3.2; X.strokeStyle = OUT; X.lineCap = 'round'; X.stroke();
  }
}
function fangMouth(y, w = 9, open = 7, color = '#7a2a26') {
  X.beginPath(); X.moveTo(-w, y); X.quadraticCurveTo(0, y - 3, w, y); X.quadraticCurveTo(w * 0.7, y + open, 0, y + open); X.quadraticCurveTo(-w * 0.7, y + open, -w, y); X.closePath();
  X.fillStyle = color; X.fill(); X.lineWidth = 2.2; X.strokeStyle = OUT; X.stroke();
  for (const s of [-1, 1]) { X.beginPath(); X.moveTo(s * w * 0.6, y - 0.8); X.lineTo(s * w * 0.35, y + 4); X.lineTo(s * w * 0.15, y - 1.2); X.closePath(); X.fillStyle = '#fff'; X.fill(); X.lineWidth = 1.4; X.stroke(); }
}
function beastHead(D, hy, atk) {
  const sk = D.skin;
  const ears = (len, up = 0.25) => { for (const s of [-1, 1]) toon((k) => { k.moveTo(s * 14, hy - 6); k.lineTo(s * (16 + len), hy - 10 - len * up); k.lineTo(s * 15, hy + 4); k.closePath(); }, sk, { sx: s * -1.5, sy: 0 }); };
  const round = (rx = 18, ry = 17, col = sk) => toon(E(0, hy, rx, ry), col, { sx: -3.5, sy: -3 });
  switch (D.head) {
    case 'goblin':
      ears(16); round(); angryEyes(hy - 1); fangMouth(hy + 8, 8, atk ? 8 : 6);
      break;
    case 'imp':
      for (const s of [-1, 1]) toon((k) => { k.moveTo(s * 7, hy - 14); k.quadraticCurveTo(s * 18, hy - 26, s * 14, hy - 34); k.quadraticCurveTo(s * 12, hy - 24, s * 3, hy - 16); k.closePath(); }, '#4a3a30', { sx: -1.5, sy: 0 });
      ears(9, 0.5); round(17, 16); angryEyes(hy - 1, 7.5, 5); fangMouth(hy + 8, 8, atk ? 9 : 7);
      break;
    case 'ghoul':
      ears(14, 0.1); round(18, 18); angryEyes(hy - 2); fangMouth(hy + 9, 9, atk ? 10 : 8, '#4a3a6a');
      for (const s of [-1, 1]) { X.beginPath(); X.ellipse(s * 11, hy + 4, 2, 3, 0, 0, 7); X.fillStyle = '#a8c8e8'; X.fill(); }
      break;
    case 'gargoyle':
      for (const s of [-1, 1]) toon(PL([[s * 8, hy - 12], [s * 16, hy - 28], [s * 15, hy - 10]]), tone(sk, 0.8), { shade: false });
      ears(8, 0.4); round(17, 16); angryEyes(hy - 1, 7.5, 4.6, null, '#f0ece0'); fangMouth(hy + 8, 8, 6, '#6a2a2a');
      break;
    case 'ogre':
      ears(6, 0.2); round(20, 18); toon((k) => { k.moveTo(-4, hy - 18); k.quadraticCurveTo(4, hy - 26, 8, hy - 16); k.closePath(); }, tone(sk, 0.7), { shade: false });
      angryEyes(hy - 3, 8, 4.6); fangMouth(hy + 8, 11, atk ? 9 : 7); dot(0, hy + 2, 3, tone(sk, 0.8));
      break;
    case 'zombie':
      round(18, 17);
      toon(PL([[-18, hy - 6], [-17, hy - 18], [-8, hy - 20], [-4, hy - 15], [2, hy - 21], [8, hy - 16], [13, hy - 20], [18, hy - 14], [18, hy - 6], [10, hy - 10], [-8, hy - 9]]), '#2e2e2a', { shade: false });
      stroke([[-10, hy - 8], [-4, hy - 4]], OUT, 1.6); stroke([[-9, hy - 4], [-6, hy - 8]], OUT, 1.4);
      for (const s of [-1, 1]) { X.beginPath(); X.ellipse(s * 7, hy + 1, 4.5, 3.4, 0, 0, 7); X.fillStyle = '#f0e8a0'; X.fill(); X.lineWidth = 2; X.strokeStyle = OUT; X.stroke(); dot(s * 7, hy + 1.5, 1.6, OUT); X.beginPath(); X.ellipse(s * 7, hy - 0.5, 5, 2.4, 0, Math.PI, 0); X.fillStyle = tone(sk, 0.85); X.fill(); X.stroke(); }
      stroke([[-6, hy + 10], [6, hy + 9]], OUT, 2.2);
      break;
    case 'mummy':
      round(17, 17);
      for (let y = hy - 14; y < hy + 16; y += 4.5) { X.save(); path(E(0, hy, 17, 17)); X.clip(); stroke([[-18, y], [18, y + 3]], tone(sk, 0.72), 1.4); X.restore(); }
      toon(RR(-14, hy - 4, 28, 9, 4), '#2a2220', { shade: false, lw: 2 });
      for (const s of [-1, 1]) { X.beginPath(); X.ellipse(s * 6, hy + 0.5, 3.6, 2.4, 0, 0, 7); X.fillStyle = '#ff7a3a'; X.fill(); }
      break;
    case 'scarecrow':
      toon(E(0, hy, 17, 16), sk, { sx: -3, sy: -3 });
      for (const s of [-1, 1]) { X.beginPath(); X.ellipse(s * 7, hy - 1, 4.5, 3.4, 0, 0, 7); X.fillStyle = OUT; X.fill(); }
      stroke([[-6, hy + 8], [-3, hy + 6], [0, hy + 8], [3, hy + 6], [6, hy + 8]], OUT, 1.6);
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) stroke([[s * (14 + i), hy + 10 + i], [s * (18 + i * 2), hy + 16 + i * 2]], '#c8a050', 2);
      toon(E(0, hy - 12, 30, 7), '#9a6a34', { sx: -2, sy: -2 });
      toon((k) => { k.moveTo(-13, hy - 14); k.quadraticCurveTo(-6, hy - 36, 4, hy - 42); k.quadraticCurveTo(8, hy - 32, 14, hy - 14); k.closePath(); }, '#9a6a34', { sx: -3, sy: 0 });
      toon(PL([[-13, hy - 20], [13, hy - 20], [14, hy - 14], [-13, hy - 14]]), '#5a3a22', { shade: false, lw: 2 });
      break;
    case 'skull':
      toon(E(0, hy, 17, 16), sk, { sx: -3, sy: -3 });
      for (const s of [-1, 1]) { X.beginPath(); X.ellipse(s * 7, hy + 1, 5.5, 5.5, 0, 0, 7); X.fillStyle = '#ffffff'; X.fill(); X.lineWidth = 2.2; X.strokeStyle = OUT; X.stroke(); dot(s * 7, hy + 1.5, 2, OUT); }
      toon(RR(-8, hy + 8, 16, 7, 2), '#f4ecd8', { shade: false, lw: 2 });
      for (const x of [-4, 0, 4]) stroke([[x, hy + 8], [x, hy + 15]], OUT, 1.2);
      toon((k) => { k.moveTo(-19, hy - 2); k.quadraticCurveTo(-20, hy - 22, 0, hy - 22); k.quadraticCurveTo(20, hy - 22, 19, hy - 2); k.closePath(); }, '#5d6470', { sx: -3, sy: -2 });
      toon(RR(-20, hy - 5, 40, 5, 2), '#4a4a52', { shade: false, lw: 2 });
      dot(0, hy - 14, 2, '#8a8f99');
      break;
    case 'hood':
      toon((k) => { k.moveTo(-22, hy + 14); k.quadraticCurveTo(-24, hy - 24, 2, hy - 28); k.quadraticCurveTo(24, hy - 24, 22, hy + 14); k.closePath(); }, '#3a3460', { sx: -3, sy: -2 });
      toon(E(0, hy + 2, 13, 13), '#141018', { shade: false, lw: 2 });
      stroke([[-15, hy + 12], [-14, hy - 10], [0, hy - 14], [14, hy - 10], [15, hy + 12]], D.glow, 1.8);
      for (const s of [-1, 1]) { X.save(); X.shadowColor = D.glow; X.shadowBlur = 8; X.beginPath(); X.moveTo(s * 2, hy); X.lineTo(s * 10, hy - 3); X.lineTo(s * 8, hy + 3); X.closePath(); X.fillStyle = D.glow; X.fill(); X.restore(); }
      break;
    case 'knight':
      for (const s of [-1, 1]) toon((k) => { k.moveTo(s * 10, hy - 14); k.quadraticCurveTo(s * 22, hy - 22, s * 20, hy - 36); k.quadraticCurveTo(s * 16, hy - 26, s * 6, hy - 20); k.closePath(); }, '#d9a93a', { sx: -1.5, sy: 0 });
      toon((k) => { k.moveTo(-18, hy + 14); k.quadraticCurveTo(-20, hy - 22, 0, hy - 24); k.quadraticCurveTo(20, hy - 22, 18, hy + 14); k.lineTo(6, hy + 16); k.lineTo(0, hy + 10); k.lineTo(-6, hy + 16); k.closePath(); }, sk, { sx: -3.5, sy: -2 });
      toon(PL([[-14, hy - 2], [-3, hy + 2], [-3, hy + 14], [3, hy + 14], [3, hy + 2], [14, hy - 2], [12, hy - 7], [-12, hy - 7]]), '#141018', { shade: false, lw: 2 });
      for (const s of [-1, 1]) { X.save(); X.shadowColor = '#ffd23a'; X.shadowBlur = 6; X.beginPath(); X.ellipse(s * 7, hy - 3, 3.6, 2, s * 0.25, 0, 7); X.fillStyle = '#ffd23a'; X.fill(); X.restore(); }
      stroke([[0, hy - 22], [0, hy - 8]], '#d9a93a', 2.4);
      break;
  }
}
