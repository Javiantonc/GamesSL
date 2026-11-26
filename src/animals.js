'use strict';
/* =========================================================================
   ANIMALES (vistos de lado; miran a la derecha y se reflejan).
   Dan carne para Cocina y pieles/colmillos para vender.
   passive: no atacan hasta que les pegas · flee: huyen al recibir daño.
   ========================================================================= */
Object.assign(MONSTERS, {
  conejo:   { name: 'Conejo', animal: 'conejo', ring: -1, hp: 0.45, dmg: 0.3, speed: 120, size: 0.6, skin: '#c8b8a8', passive: true, flee: true, top: 54, hb: 46 },
  ciervo:   { name: 'Ciervo', animal: 'ciervo', ring: -1, hp: 0.9, dmg: 0.7, speed: 130, size: 0.95, skin: '#b5824a', passive: true, flee: true, top: 118, hb: 104 },
  jabali:   { name: 'Jabalí', animal: 'jabali', ring: -1, hp: 1.15, dmg: 1.05, speed: 115, size: 0.9, skin: '#6a4a3a', passive: true, top: 80, hb: 70 },
  lobo:     { name: 'Lobo', animal: 'lobo', ring: -1, hp: 0.95, dmg: 1.15, speed: 135, size: 0.92, skin: '#8a8e9a', top: 84, hb: 74 },
  oso:      { name: 'Oso pardo', animal: 'oso', ring: -1, hp: 1.9, dmg: 1.45, speed: 95, size: 1.25, skin: '#7a5236', passive: true, top: 96, hb: 86 },
  cangrejo: { name: 'Cangrejo de lago', animal: 'cangrejo', ring: -1, hp: 1, dmg: 0.9, speed: 75, size: 0.85, skin: '#d0503a', passive: true, top: 58, hb: 50 },
});
Object.assign(MATS_DROP, {
  conejo: ['🐾', 'Pata de conejo', 0.5], ciervo: ['🦌', 'Cornamenta', 0.5], jabali: ['🦷', 'Colmillo de jabalí', 0.6],
  lobo: ['🐺', 'Piel de lobo', 0.65], oso: ['🐻', 'Piel de oso', 0.7], cangrejo: ['🦀', 'Pinza de cangrejo', 0.6],
});
const ANIMALS_BY_ZONE = {
  pradera: ['conejo', 'conejo', 'ciervo', 'jabali'], bosque: ['lobo', 'lobo', 'oso', 'ciervo'], colinas: ['jabali', 'oso', 'lobo'],
  costa: ['cangrejo', 'conejo', 'jabali'], salvaje: ['jabali', 'jabali', 'lobo', 'ciervo'],
};
const meatTier = (lvl) => clamp(Math.ceil(lvl / 4), 1, 5);
function spawnAnimals() {
  const r = wrng(808);
  for (let n = 0, tries = 0; n < 170 && tries < 30000; tries++) {
    const x = 80 + r() * (WORLD_W - 160), y = 160 + r() * (WORLD_H - 220);
    if (villageZone(x, y, 1.1) || inLake(x, y, 30) || onPath(x, y, 0)) continue;
    SC = WORLD; if (blocked(x, y)) continue;
    let z = zoneAt(x, y);
    if (inLake(x, y, 260)) z = 'costa';
    const pool = ANIMALS_BY_ZONE[z], type = pool[(r() * pool.length) | 0];
    const lvl = clamp(mobLvlAt(x, y) + ((r() * 3) | 0) - 1 + (type === 'oso' ? 1 : type === 'conejo' ? -2 : 0), 1, 20);
    WORLD.mobs.push(makeMob(type, x, y, lvl));
    n++;
  }
}

/* --------------------------------------------------------------- dibujo */
function drawAnimal(D, f, atk) {
  const b = D.skin, k = D.animal, lg = [0, 3, 0, -3][f * 2 % 4] || (f ? 3 : 0);
  const legs = (xs, top, len, w, col, hoof) => xs.forEach((x, i) => { const o = (i % 2 ? lg : -lg); toon(RR(x - w / 2 + o, top, w, len, w / 2), i < 2 ? dk(col) : col, { shade: false }); if (hoof) toon(E(x + o, top + len - 1, w / 2 + 0.5, 2.6), hoof, { shade: false, lw: 1.8 }); });
  const eye = (x, y, angry, r = 3.4) => {
    X.beginPath(); X.ellipse(x, y, r, r * 1.15, 0, 0, 7); X.fillStyle = '#fff'; X.fill(); X.lineWidth = 2; X.strokeStyle = OUT; X.stroke();
    dot(x + 0.8, y + 0.5, r * 0.55, OUT); dot(x + 0.2, y - 0.6, r * 0.2, '#fff');
    if (angry) stroke([[x - r - 1, y - r * 1.4], [x + r + 1, y - r * 0.6]], OUT, 2.8);
  };
  if (k === 'conejo') {
    const hop = f ? -6 : 0;
    toon(E(-9, -10 + hop, 5, 4), '#f4f0e8', { shade: false });                               // cola
    toon(E(0, -14 + hop, 15, 12), b, { sx: -3, sy: -3 });
    toon(E(8, -5 + hop, 6, 4), dk(b), { shade: false });
    toon(E(14, -28 + hop, 11, 10), b, { sx: -2, sy: -2 });
    for (const [dx, a] of [[0, -0.25], [6, 0.1]]) { toon(E(11 + dx, -48 + hop, 4, 13, a), b, { sx: -1.5, sy: 0 }); toon(E(11 + dx, -47 + hop, 1.8, 9, a), '#f0a8b0', { shade: false, line: false }); }
    eye(17, -30 + hop, false, 2.8); dot(24, -27 + hop, 1.8, '#e07a8a');
    return;
  }
  if (k === 'cangrejo') {
    const cl = atk ? 6 : 0;
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) stroke([[s * (8 + i * 5), -10], [s * (16 + i * 6), -4 + (i % 2) * 2 + (f && i % 2 ? -2 : 0)], [s * (20 + i * 6), 0]], OUT, 4.5);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) stroke([[s * (8 + i * 5), -10], [s * (16 + i * 6), -4 + (i % 2) * 2 + (f && i % 2 ? -2 : 0)], [s * (20 + i * 6), 0]], dk(b), 2.2);
    toon(E(0, -16, 22, 13), b, { sx: -3, sy: -3 });
    for (const s of [-1, 1]) { stroke([[s * 18, -20], [s * 28, -30 - cl]], OUT, 5); stroke([[s * 18, -20], [s * 28, -30 - cl]], b, 2.6); toon((kk) => { kk.moveTo(s * 24, -32 - cl); kk.quadraticCurveTo(s * 36, -46 - cl, s * 40, -32 - cl); kk.lineTo(s * 32, -34 - cl); kk.lineTo(s * 36, -26 - cl); kk.quadraticCurveTo(s * 28, -24 - cl, s * 24, -32 - cl); kk.closePath(); }, b, { sx: -1.5, sy: -1.5 }); }
    for (const s of [-1, 1]) { stroke([[s * 6, -26], [s * 7, -34]], OUT, 3); X.beginPath(); X.arc(s * 7, -37, 4, 0, 7); X.fillStyle = '#fff'; X.fill(); X.lineWidth = 2; X.strokeStyle = OUT; X.stroke(); dot(s * 7, -37, 2, OUT); }
    stroke([[-5, -11], [0, -9], [5, -11]], OUT, 2);
    return;
  }
  if (k === 'ciervo') {
    toon(E(-24, -50, 5, 6), '#f4f0e8', { shade: false });
    legs([-18, 14, -12, 20], -42, 40, 6, b, OUT);
    toon(E(-2, -52, 26, 15), b, { sx: -3, sy: -3 });
    toon(E(0, -44, 18, 7), lt(b), { shade: false, line: false });
    for (let i = 0; i < 4; i++) dot(-14 + i * 7, -58 + (i % 2) * 4, 1.8, '#f4e8d0');
    toon(PL([[14, -60], [24, -86], [32, -80], [24, -56]]), b, { sx: -2, sy: 0 });
    toon(E(32, -92, 11, 10), b, { sx: -2, sy: -2 });
    toon(E(41, -88, 7, 5), lt(b), { shade: false }); dot(47, -89, 2.4, OUT);
    toon(E(24, -100, 4, 8, -0.7), b, { shade: false });
    for (const s of [0, 8]) { stroke([[28 + s, -100], [24 + s, -118], [18 + s, -126]], OUT, 5); stroke([[28 + s, -100], [24 + s, -118], [18 + s, -126]], '#e8d8b0', 2.6); stroke([[25 + s, -114], [32 + s, -122]], OUT, 4.5); stroke([[25 + s, -114], [32 + s, -122]], '#e8d8b0', 2.2); }
    eye(34, -94, false, 3);
    return;
  }
  if (k === 'jabali') {
    stroke([[-26, -38], [-32, -30], [-30, -26]], OUT, 3);
    legs([-16, 12, -10, 18], -22, 22, 7, b, '#3a2a24');
    toon((kk) => { kk.moveTo(-28, -30); kk.quadraticCurveTo(-30, -56, -4, -58); kk.quadraticCurveTo(18, -60, 22, -42); kk.quadraticCurveTo(24, -18, 0, -18); kk.quadraticCurveTo(-26, -16, -28, -30); kk.closePath(); }, b, { sx: -4, sy: -3 });
    for (let i = 0; i < 7; i++) toon(PL([[-22 + i * 6, -54 + Math.abs(i - 3)], [-19 + i * 6, -64 + Math.abs(i - 3)], [-16 + i * 6, -54 + Math.abs(i - 3)]]), dk(b), { shade: false, lw: 1.8 });
    toon(E(26, -38, 14, 13), b, { sx: -2, sy: -2 });
    toon(RR(34, -40, 12, 11, 4), '#a87a6a', { sx: -1, sy: -1 }); dot(40, -36, 1.4, OUT); dot(44, -36, 1.4, OUT);
    toon((kk) => { kk.moveTo(34, -30); kk.quadraticCurveTo(38, -42, 44, -44); kk.quadraticCurveTo(40, -36, 37, -29); kk.closePath(); }, '#f4f0e0', { shade: false, lw: 1.8 });
    toon(PL([[16, -48], [20, -58], [24, -48]]), dk(b), { shade: false });
    eye(28, -44, true, 2.8);
    return;
  }
  if (k === 'lobo') {
    toon((kk) => { kk.moveTo(-22, -40); kk.quadraticCurveTo(-40, -50, -44, -66); kk.quadraticCurveTo(-30, -58, -18, -46); kk.closePath(); }, b, { sx: -2, sy: 0 });
    dot(-42, -64, 3, '#f0f0f0');
    legs([-16, 10, -10, 16], -26, 26, 6, b, OUT);
    toon(E(-2, -38, 23, 13), b, { sx: -3, sy: -3 });
    toon(E(4, -30, 15, 6), '#e0e0e6', { shade: false, line: false });
    toon(E(22, -52, 13, 12), b, { sx: -2, sy: -2 });
    toon((kk) => { kk.moveTo(26, -52); kk.lineTo(46, -46); kk.quadraticCurveTo(46, -38, 30, -40); kk.closePath(); }, lt(b), { sx: -1, sy: -1 });
    dot(46, -46, 2.6, OUT);
    if (atk) { toon(PL([[30, -41], [44, -40], [32, -34]]), '#7a2a26', { shade: false, lw: 1.6 }); stroke([[36, -40], [37, -37]], '#fff', 1.6); }
    for (const dx of [12, 20]) toon(PL([[dx, -58], [dx + 3, -74], [dx + 8, -60]]), b, { sx: -1.5, sy: 0 });
    toon(E(14, -42, 8, 6), '#e0e0e6', { shade: false, line: false });
    eye(28, -55, true, 3);
    return;
  }
  if (k === 'oso') {
    legs([-18, 14, -10, 22], -26, 26, 11, b, '#3a2a24');
    toon(E(-2, -44, 30, 22), b, { sx: -4, sy: -4 });
    toon(E(-4, -60, 18, 8), lt(b), { shade: false, line: false });
    toon(E(26, -60, 17, 16), b, { sx: -3, sy: -3 });
    for (const dx of [14, 30]) { toon(E(dx, -76, 6, 6), b, { shade: false }); dot(dx, -76, 3, dk(b)); }
    toon(E(38, -54, 9, 7), '#c8a070', { sx: -1, sy: -1 }); dot(45, -56, 3, OUT);
    if (atk) { toon(E(38, -47, 6, 3), '#7a2a26', { shade: false, lw: 1.6 }); }
    eye(30, -64, !!atk, 3);
  }
}
