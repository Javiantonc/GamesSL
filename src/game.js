'use strict';
/* ============================================================== aldeanos */
const VILLAGERS = {
  elara:    { name: 'Capitana Elara', title: 'Guardia de Albor', pos: [-176, -112], look: { gender: 'chica', skin: SKINS[2], hair: '#3a2a24', style: 'largo', eye: '#3d5a8a', outfit: '#3d5a8a', wear: 'plate', hat: 'helm', weapon: 'spear', face: 'decidido' }, greet: 'La Pradera no se defiende sola. Los limos han vuelto a los campos: ¡ve a probar tu arma con ellos!' },
  orvin:    { name: 'Maestro Orvin', title: 'Guardián de portales', pos: [112, -96], look: { gender: 'chico', skin: '#f0d0b0', hair: '#d9d6cc', style: 'corto', eye: '#2a2220', outfit: '#6b4a7a', wear: 'robe', hat: 'wizard', beard: '#d9d6cc', weapon: 'staff', face: 'serio' }, greet: 'Diez portales, diez colores. Cuanto más lejos del pueblo, más fuerte es el espectro que lo guarda.', inside: true },
  tobias:   { name: 'Tobías', title: 'Mercader', pos: [280, 175], look: { gender: 'chico', skin: SKINS[1], hair: '#8a5a3a', style: 'corto', eye: '#2a2220', outfit: '#9a5a2a', wear: 'tunic', hat: 'cap', hatC: '#5f7a3a', feather: true, apron: '#efe2c4', beard: '#8a5a3a', weapon: 'map', face: 'alegre' }, greet: '¡Manzanas frescas, pociones y buenas ofertas! Y te compro lo que traigas de ahí fuera.', role: 'shop' },
  brunilda: { name: 'Brunilda', title: 'Herrera', pos: [-300, 360], look: { gender: 'chica', skin: SKINS[3], hair: '#a8342a', style: 'mono', eye: '#3f7a4a', outfit: '#6b5a4a', wear: 'tunic', apron: '#3a2e24', weapon: 'hammer', face: 'decidido' }, greet: 'Tráeme mena y te enseño a forjar.', inside: true },
  marta:    { name: 'Marta', title: 'Posadera', pos: [-20, 560], look: { gender: 'chica', skin: SKINS[0], hair: '#b5652e', style: 'coleta', eye: '#3f7a4a', outfit: '#a8452f', wear: 'robe', apron: '#f4efe0', weapon: 'mug', face: 'alegre' }, greet: '¡Bienvenido a El Limo Feliz! Hoy hay estofado y pan recién hecho.', inside: true },
  lia:      { name: 'Lía', title: 'Herboristería', role: 'prof:herbo', pos: [-440, -20], look: { gender: 'chica', skin: SKINS[1], hair: '#4f6b3a', style: 'largo', eye: '#3f7a4a', outfit: '#5f7a3a', wear: 'leather', hat: 'hood', hatC: '#4f6a3a', weapon: 'bow', face: 'serio' }, greet: 'Silencio… el Bosque Susurrante escucha. Y no le gustan los visitantes.' },
  dario:    { name: 'Darío', title: 'Explorador', pos: [440, 40], look: { gender: 'chico', skin: SKINS[3], hair: '#3a2a24', style: 'pincho', eye: '#6b4226', outfit: '#b5652e', wear: 'tunic', weapon: 'map', face: 'alegre' }, greet: 'He recorrido medio mapa. Las Colinas de Piedra esconden cosas que no deberían andar.' },
  bruno:    { name: 'Pescador Bruno', title: 'Pesca', role: 'prof:pesca', pos: [-830, 560], look: { gender: 'chico', skin: SKINS[2], hair: '#6b4226', style: 'corto', eye: '#2a2220', outfit: '#3f7a7a', wear: 'tunic', hat: 'cap', hatC: '#c9a24a', beard: '#6b4226', weapon: 'spear', face: 'alegre' }, greet: '' },
  greta:    { name: 'Minera Greta', title: 'Minería', role: 'prof:mineria', pos: [900, -40], look: { gender: 'chica', skin: SKINS[1], hair: '#3a2a24', style: 'mono', eye: '#6b4226', outfit: '#7a5236', wear: 'mail', hat: 'helm', weapon: 'hammer', face: 'decidido' }, greet: '' },
  nieve:    { name: 'Vigía Nieve', title: 'Centinela del hielo', pos: [420, -170], look: { gender: 'chica', skin: '#f4dcc8', hair: '#d9d6cc', style: 'largo', eye: '#3d5a8a', outfit: '#6a8aa8', wear: 'robe', hat: 'hood', hatC: '#8aa8c0', weapon: 'staff', face: 'serio' }, greet: 'Vigilo el portal de hielo. Solo quien venza a los diez espectros podrá cruzarlo.' },
};
const HP = { picaro: 80, mago: 65, paladin: 115, guerrero: 100, brujo: 72 };
const SPD = 155;
let npcs = [], mobs = [], SC = null;
const BAGMAX = 24;
const shots = [], fx = [], nums = [];
let hero = null;
function buildNpcs() {
  for (const [id, V] of Object.entries(VILLAGERS)) {
    if (V.inside) continue;
    const x = CX + V.pos[0], y = CY + V.pos[1];
    WORLD.npcs.push({ id, V, x, y, dir: 0, t: Math.random() * 10 });
    addSolid(WORLD, { x: x - 12, y: y - 10, w: 24, h: 12 });
  }
}
function ringOf(x, y) { const d = Math.hypot(x - CX, (y - CY) * 1.45); return d < 1150 ? 0 : d < 1550 ? 1 : 2; }
function spawnMonsters() {
  const r = wrng(404);
  let n = 0, tries = 0;
  while (n < 240 && tries++ < 40000) {
    const x = 80 + r() * (WORLD_W - 160), y = 160 + r() * (WORLD_H - 220);
    if (villageZone(x, y, 1.15) || inLake(x, y, 40) || onPath(x, y, 10)) continue;
    SC = WORLD; if (blocked(x, y)) continue;
    const lvl = clamp(mobLvlAt(x, y) + ((r() * 3) | 0) - 1, 1, 20), types = mobTypesFor(lvl);
    WORLD.mobs.push(makeMob(types[(r() * types.length) | 0], x, y, lvl));
    n++;
  }
}

/* Botín de cada criatura: material propio (icono, nombre, probabilidad) */
const MATS_DROP = {
  limo: ['🟢', 'Gelatina de limo', 0.7], duende: ['🧶', 'Tela robada', 0.55], espantapajaros: ['🌾', 'Paja encantada', 0.6],
  diablillo: ['🦴', 'Cuerno de diablillo', 0.5], momia: ['🩹', 'Vendas antiguas', 0.6], zombi: ['🧠', 'Cerebro mustio', 0.45],
  necrofago: ['🦷', 'Garra de necrófago', 0.5], esqueleto: ['💀', 'Hueso antiguo', 0.65], gargola: ['🪨', 'Piedra de gárgola', 0.5],
  encapuchado: ['📜', 'Pergamino oscuro', 0.45], ogro: ['🟫', 'Piel de ogro', 0.55], caballero: ['🛡️', 'Placa maldita', 0.5],
};
function rollLoot(m) {
  const D = MONSTERS[m.type], md = MATS_DROP[m.type];
  if (D.animal) {
    const items = [];
    if (Math.random() < 0.85) { const t = meatTier(m.lvl); items.push({ kind: 'res', res: 'meat', t, n: 1 + (Math.random() < 0.4 ? 1 : 0) + (m.type === 'oso' ? 1 : 0), icon: '🍖', name: resName('meat', t) }); }
    if (md && Math.random() < md[2]) items.push({ kind: 'mat', icon: md[0], name: md[1], n: 1 });
    if (!items.length) items.push({ kind: 'mat', icon: '🦴', name: 'Hueso roído', n: 1 });
    return items;
  }
  const items = [{ kind: 'gold', n: Math.max(1, Math.round((2 + m.lvl * 2.2) * (0.6 + Math.random() * 0.9))) }];
  const dg = SC.kind === 'dungeon';   // en las mazmorras salen cosas mejores
  if (Math.random() < (dg ? 0.45 : 0.3)) items.push({ kind: 'gear', g: makeGear(hero.cls, Math.max(1, m.lvl + ((Math.random() * 3) | 0) - 1), rollRarity(m.lvl * 0.8 + (dg ? 30 : 0))) });
  if (md && Math.random() < md[2]) items.push({ kind: 'mat', icon: md[0], name: md[1], n: 1 + (Math.random() < 0.3 ? 1 : 0) });
  if (Math.random() < 0.14) items.push({ kind: 'potion', icon: '🧪', name: 'Poción de vida', n: 1 });
  if (Math.random() < (dg ? 0.3 : 0.2)) items.push({ kind: 'weapon', w: makeWeapon(hero.cls, Math.max(1, m.lvl + ((Math.random() * 3) | 0) - 1), rollRarity(m.lvl * 0.8 + (dg ? 30 : 0))) });
  return items;
}
function nearCorpse() {
  if (!hero) return null;
  let best = null, bd = 70;
  for (const m of mobs) if (m.dead && m.loot && m.loot.length) { const d = Math.hypot(m.x - hero.x, m.y - hero.y); if (d < bd) { bd = d; best = m; } }
  return best;
}
/* ============================================================= pantalla */
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let Z = 1, DPR = 1;
function resize() {
  DPR = Math.min(2, devicePixelRatio || 1);
  cv.width = innerWidth * DPR; cv.height = innerHeight * DPR;
  cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
  Z = Math.max(0.55, Math.min(1.5, Math.min(innerWidth / 1000, innerHeight / 620)));
  if (matchMedia('(pointer: coarse)').matches) Z = Math.max(0.62, Math.min(1.2, Math.min(innerWidth, innerHeight) / 520));
}
addEventListener('resize', resize);

const keys = new Set(), joy = { x: 0, y: 0 };
let playing = false;
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  keys.add(e.code);
  if (!playing) return;
  if (e.code === 'KeyE') doAct();
  if (e.code === 'KeyX' || e.code === 'Digit7') throwBomb();
  if (e.code === 'KeyM') toggleMap();
  if (e.code === 'KeyC') openChar();
  if (e.code === 'Tab') { e.preventDefault(); cycleTarget(); }
  if (e.code === 'KeyV' || e.code === 'Digit8') eatFood();
  if (e.code === 'KeyP' || e.code === 'KeyL') openProfs();
  if (e.code === 'Escape') closeWin();
  if (e.code === 'Space' || e.code === 'KeyJ' || e.code === 'Digit1') { e.preventDefault(); use(0); }
  if (e.code === 'KeyQ' || e.code === 'Digit2') use(1);
  if (e.code === 'KeyR' || e.code === 'Digit3') use(2);
  if (e.code === 'KeyF' || e.code === 'Digit4') use(3);
  if (e.code === 'KeyT' || e.code === 'Digit5') use(4);
  if (e.code === 'KeyZ' || e.code === 'Digit6') drinkPotion();
  if (e.code === 'KeyK') openBook(0);
});
addEventListener('keyup', (e) => keys.delete(e.code));
cv.addEventListener('pointerdown', (e) => {
  if (!playing) return;
  // tocar o hacer clic sobre un monstruo lo fija como objetivo
  const wx = CAM.x + e.clientX / Z, wy = CAM.y + e.clientY / Z;
  let pick = null, bd = 70;
  for (const m of mobs) if (!m.dead) { const d = Math.hypot(m.x - wx, m.y - 40 * MONSTERS[m.type].size - wy); if (d < bd) { bd = d; pick = m; } }
  if (pick) hero.target = pick;
  if (e.pointerType !== 'touch') use(0);
});

function blocked(x, y) {
  if (x < 20 || y < 60 || x > SC.W - 20 || y > SC.H - 10) return true;
  if (SC.kind === 'world' ? inLake(x, y, -6) : SC.block(x, y)) return true;
  return solidAt(SC, x, y);
}

/* -------------------------------------------------------------- diálogo */
let talkingTo = null;
const talkEl = document.getElementById('talk');
function nearNpc() {
  if (!hero) return null;
  let best = null, bd = 70;
  for (const n of npcs) { const d = Math.hypot(n.x - hero.x, n.y - hero.y); if (d < bd) { bd = d; best = n; } }
  return best;
}
function talk() {
  const n = nearNpc();
  if (!n || talkingTo === n) { talkingTo = null; talkEl.style.display = 'none'; return; }
  if (n.V.role) { faceNpc(n); openRole(n); return; }
  talkingTo = n;
  const dx = hero.x - n.x, dy = hero.y - n.y;
  n.dir = Math.abs(dx) > Math.abs(dy) ? 2 : dy < 0 ? 1 : 0; n.flip = dx < 0;
  talkEl.innerHTML = `<b>${n.V.name} · ${n.V.title}</b>«${n.V.greet}»<small>Pulsa E para cerrar</small>`;
  talkEl.style.display = 'block';
}

/* -------------------------------------------------------------- combate */
const lvlMul = () => 1 + (hero.lvl - 1) * 0.15;
const xpNeed = (l) => Math.floor(30 * Math.pow(l, 1.5));
/** Autoapuntado: mantiene el objetivo fijado; si no hay, elige el enemigo más cercano
 *  (prefiere los que te atacan antes que los animales tranquilos). */
function nearestMob(r) {
  const t = hero.target;
  if (t && !t.dead && mobs.includes(t) && Math.hypot(t.x - hero.x, t.y - hero.y) < r * 1.3) return t;
  let best = null, bd = Infinity;
  for (const m of mobs) {
    if (m.dead) continue;
    const d = Math.hypot(m.x - hero.x, m.y - hero.y); if (d > r) continue;
    const score = d - (m.state === 'chase' ? 140 : 0) + (MONSTERS[m.type].passive && m.state === 'idle' ? 60 : 0);
    if (score < bd) { bd = score; best = m; }
  }
  if (best) hero.target = best;
  return best;
}
function cycleTarget() {
  const list = mobs.filter((m) => !m.dead && Math.hypot(m.x - hero.x, m.y - hero.y) < 420).sort((a, b) => Math.hypot(a.x - hero.x, a.y - hero.y) - Math.hypot(b.x - hero.x, b.y - hero.y));
  if (!list.length) return;
  hero.target = list[(list.indexOf(hero.target) + 1) % list.length];
}
let CAM = { x: 0, y: 0 };
function faceTo(x, y) { const dx = x - hero.x, dy = y - hero.y; if (Math.abs(dx) > Math.abs(dy)) { hero.dir = 2; hero.flip = dx < 0; } else hero.dir = dy < 0 ? 1 : 0; }
const facingVec = () => (hero.dir === 2 ? [hero.flip ? -1 : 1, 0] : hero.dir === 1 ? [0, -1] : [0, 1]);
function damageMob(m, n, color = '#ffe46a') {
  if (m.dead) return;
  n = Math.max(1, Math.round(n * lvlMul() * (0.9 + Math.random() * 0.2)));
  m.hp -= n; m.hit = 0.12;
  if (m.state === 'idle' || m.state === 'back') { m.state = MONSTERS[m.type].flee ? 'flee' : 'chase'; m.fleeT = T + 4; }
  nums.push({ x: m.x, y: m.y - 50, t: 0, txt: n, c: color });
  if (m.hp <= 0) {
    m.dead = true; m.respawn = m.noRespawn ? Infinity : T + 12;
    if (m.boss) onBossKilled(m);
    for (let i = 0; i < 12; i++) fx.push({ k: 'p', x: m.x, y: m.y - 30, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 140, t: 0, life: 0.6, c: MONSTERS[m.type].skin });
    gainXp(m.xp);
    // botín aleatorio: no siempre cae un arma
    m.loot = rollLoot(m); m.deadAt = T;
  }
  return n;
}
function gainXp(n) {
  hero.xp += n;
  nums.push({ x: hero.x, y: hero.y - 120, t: 0, txt: `+${n} XP`, c: '#d9a8ff' });
  while (hero.xp >= xpNeed(hero.lvl)) {
    hero.xp -= xpNeed(hero.lvl); hero.lvl++; recalc(); hero.hp = hero.max;
    fx.push({ k: 'ring', x: hero.x, y: hero.y - 10, r: 70, t: 0, life: 0.8, c: '#ffd27a' });
    nums.push({ x: hero.x, y: hero.y - 150, t: 0, txt: `¡Nivel ${hero.lvl}!`, c: '#ffd27a', big: true });
  }
  save();
}
/** Daño de la habilidad + el del arma equipada (el poder aprovecha más el arma). */
function hurtHero(n) {
  if (hero.dead) return;
  n = Math.max(1, Math.round(n * (1 - armorDR())));
  if (hero.shield && hero.shield.until > T && hero.shield.amt > 0) {
    const a = Math.min(n, hero.shield.amt); hero.shield.amt -= a; n -= a;
    if (!n) { nums.push({ x: hero.x, y: hero.y - 100, t: 0, txt: 'Absorbido', c: '#9ad8ff' }); return; }
  }
  hero.hp -= n; hero.hurt = 0.25; hero.lastHit = T;
  nums.push({ x: hero.x, y: hero.y - 100, t: 0, txt: `-${n}`, c: '#ff5a4a' });
  if (hero.hp <= 0) {
    hero.dead = true; hero.hp = 0;
    nums.push({ x: hero.x, y: hero.y - 140, t: 0, txt: '¡Te han derrotado!', c: '#ff8a7a', big: true });
    setTimeout(() => { hero.dead = false; hero.hp = hero.max; for (const m of mobs) m.state = 'idle'; enterScene(WORLD, START.x, START.y); }, 2000);
  }
}

/* ------------------------------------------------------------ actualizar */
let last = performance.now(), T = 0;
const START = { x: CX, y: CY + 160 };
function update(dt) {
  let mx = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  let my = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
  if (joy.x || joy.y) { mx = joy.x; my = joy.y; }
  const len = Math.hypot(mx, my);
  hero.moving = len > 0.2 && !hero.dead;
  if (hero.moving) {
    const sp = SPD * (hero.speedUp && hero.speedUp.until > T ? hero.speedUp.v : 1) * dt / Math.max(1, len);
    const nx = hero.x + mx * sp, ny = hero.y + my * sp;
    if (!blocked(nx, hero.y)) hero.x = nx;
    if (!blocked(hero.x, ny)) hero.y = ny;
    if (hero.atkT <= 0) { if (Math.abs(mx) > Math.abs(my)) { hero.dir = 2; hero.flip = mx < 0; } else hero.dir = my < 0 ? 1 : 0; }
    hero.ft += dt * 7; hero.frame = Math.floor(hero.ft) % 4;
    if (hero.gather) { hero.gather = null; gbar.style.display = 'none'; }
    if (talkingTo && Math.hypot(talkingTo.x - hero.x, talkingTo.y - hero.y) > 100) { talkingTo = null; talkEl.style.display = 'none'; }
  } else { hero.frame = 0; hero.ft = 0; }
  hero.atkT -= dt; hero.hurt -= dt; hero.spin = Math.max(0, (hero.spin || 0) - dt);
  if (hero.regen && T < hero.regen.until && !hero.dead) hero.hp = Math.min(hero.max, hero.hp + hero.regen.per * dt);
  if (hero.buff && T > hero.buff.until) { hero.buff = null; recalc(); toast('Ya no estás bien alimentado'); }
  // fuera de combate la vida se regenera poco a poco
  hero.inCombat = T - (hero.lastHit || -99) < 4 || T - (hero.lastAtk || -99) < 4 || mobs.some((m) => !m.dead && m.state === 'chase' && Math.abs(m.x - hero.x) + Math.abs(m.y - hero.y) < 700);
  if (!hero.inCombat && !hero.dead && hero.hp < hero.max) {
    const before = Math.floor(hero.hp);
    hero.hp = Math.min(hero.max, hero.hp + hero.max * 0.06 * dt);
    hero.regAcc = (hero.regAcc || 0) + (hero.hp - before);
    if ((hero.regT = (hero.regT || 0) - dt) < 0) {
      hero.regT = 1;
      if (hero.regAcc >= 1) nums.push({ x: hero.x + 18, y: hero.y - 110, t: 0, txt: `+${Math.round(hero.regAcc)}`, c: '#7dff7a' });
      hero.regAcc = 0;
      for (let k = 0; k < 3; k++) fx.push({ k: 'p', x: hero.x + (Math.random() - 0.5) * 34, y: hero.y - 20 - Math.random() * 50, vx: 0, vy: -60, t: 0, life: 0.7, c: '#7dff7a' });
    }
  }

  updateWorldStuff(dt); updateZones(dt);
  for (const m of mobs) {
    if (!m.dead && m.state === 'idle' && Math.abs(m.x - hero.x) + Math.abs(m.y - hero.y) > 1600) continue;
    if (m.dead) { if (T > m.respawn && (!m.loot || !m.loot.length || T - m.deadAt > 60) && Math.hypot(m.hx - hero.x, m.hy - hero.y) > 400) { Object.assign(m, { dead: false, hp: m.max, x: m.hx, y: m.hy, state: 'idle', dots: [], loot: null }); if (lootOf === m) closeLoot(); } continue; }
    for (let i = m.dots.length - 1; i >= 0; i--) { const d = m.dots[i]; if (T >= d.next) { d.next += 1; d.n--; damageMob(m, d.d, d.c); } if (d.n <= 0) m.dots.splice(i, 1); }
    if (m.dead) continue;
    if (m.stunT > T) { m.hit -= dt; continue; }
    m.t += dt; m.hit -= dt; m.jump = Math.max(0, (m.jump || 0) - dt);
    const dx = hero.x - m.x, dy = hero.y - m.y, d = Math.hypot(dx, dy);
    if (m.state === 'idle') {
      if (d < 150 && !hero.dead && !MONSTERS[m.type].passive && !(hero.stealth > T)) m.state = 'chase';
      if (m.t > 3) { m.t = 0; m.tx = m.hx + (Math.random() - 0.5) * 120; m.ty = m.hy + (Math.random() - 0.5) * 90; }
      stepMob(m, m.tx, m.ty, MONSTERS[m.type].speed * 0.4, dt);
    } else if (m.state === 'chase') {
      if (hero.dead || Math.hypot(m.x - m.hx, m.y - m.hy) > (m.leash || 420)) { m.state = 'back'; continue; }
      if (d > 34) stepMob(m, hero.x, hero.y, MONSTERS[m.type].speed, dt);
      else if (T > m.atk) { m.atk = T + 1.2; m.jump = 0.25; hurtHero(m.dmg); }
    } else if (m.state === 'flee') {
      stepMob(m, m.x - dx, m.y - dy, MONSTERS[m.type].speed * 1.1, dt);
      if (T > m.fleeT) m.state = 'back';
    } else {
      stepMob(m, m.hx, m.hy, 100, dt); m.hp = Math.min(m.max, m.hp + m.max * dt);
      if (Math.hypot(m.x - m.hx, m.y - m.hy) < 10) m.state = 'idle';
    }
  }
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (Math.random() < 0.8) fx.push({ k: 'p', x: s.x, y: s.y, vx: 0, vy: -20, t: 0, life: 0.3, c: s.c });
    if (s.tg && !s.tg.dead) {   // proyectil teledirigido hacia su objetivo
      const dx = s.tg.x - s.x, dy = s.tg.y - 22 - s.y, d = Math.hypot(dx, dy) || 1, sp = Math.hypot(s.vx, s.vy), k = Math.min(1, dt * 8);
      s.vx += ((dx / d) * sp - s.vx) * k; s.vy += ((dy / d) * sp - s.vy) * k; s.life = Math.max(s.life, 0.1);
    }
    let hit = null;
    for (const m of mobs) if (!m.dead && Math.hypot(m.x - s.x, m.y - 22 - s.y) < 28) { hit = m; break; }
    if (hit) {
      hitMob(hit, s.ab, s.dmg, s.c === '#b04dff' ? '#d9a8ff' : '#ffe46a');
      fx.push({ k: 'ring', x: s.x, y: s.y + 20, r: s.ab.big ? 46 : 24, t: 0, life: 0.3, c: s.c });
    }
    if (hit || s.life <= 0) shots.splice(i, 1);
  }
  for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.t += dt; if (f.k === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 300 * dt; } if (f.t > f.life) fx.splice(i, 1); }
  for (let i = nums.length - 1; i >= 0; i--) { nums[i].t += dt; if (nums[i].t > (nums[i].big ? 1.6 : 0.9)) nums.splice(i, 1); }
}
function stepMob(m, tx, ty, sp, dt) {
  const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy);
  if (d < 2) return;
  const hop = Math.sin(m.t * 7) > 0 ? 1 : 0.25;
  if (m.slowT > T) sp *= 0.5;
  const nx = m.x + (dx / d) * sp * hop * dt, ny = m.y + (dy / d) * sp * hop * dt;
  if (!blocked(nx, m.y)) m.x = nx;
  if (!blocked(m.x, ny)) m.y = ny;
  if (Math.abs(dx) > 2) m.flip = dx < 0;
}

/* ================================================================ dibujo */
function draw() {
  const vw = innerWidth / Z, vh = innerHeight / Z;
  const fxp = hero ? hero.x : CX, fyp = hero ? hero.y : CY + 120;
  const camX = SC.W <= vw ? (SC.W - vw) / 2 : Math.min(SC.W - vw, Math.max(0, fxp - vw / 2));
  const camY = SC.H <= vh ? (SC.H - vh) / 2 : Math.min(SC.H - vh, Math.max(0, fyp - 40 - vh / 2));
  CAM = { x: camX, y: camY };
  X = ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#120e12'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(DPR * Z, 0, 0, DPR * Z, -camX * DPR * Z, -camY * DPR * Z);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const inView = (x, y, w, h) => x + w > camX && x - w < camX + vw && y > camY - 20 && y - h < camY + vh + 40;
  if (SC.kind === 'world') {
    for (let j = Math.max(0, Math.floor(camY / CH)); j <= Math.min(WORLD_H / CH - 1, Math.floor((camY + vh) / CH)); j++)
      for (let i = Math.max(0, Math.floor(camX / CH)); i <= Math.min(WORLD_W / CH - 1, Math.floor((camX + vw) / CH)); i++) ctx.drawImage(getChunk(i, j), i * CH, j * CH, CH + 0.5, CH + 0.5);
    // brillos del agua
    for (const L of LAKES) {
      if (!inView(L.x, L.y + L.ry, L.rx + 40, L.ry * 2 + 40)) continue;
      for (let i = 0; i < 6 + L.rx / 40; i++) {
        const a = i * 2.4 + T * 0.4, px = L.x + Math.cos(a) * L.rx * 0.55 * ((i % 4) / 4 + 0.3), py = L.y + Math.sin(a * 1.3) * L.ry * 0.5 * ((i % 3) / 3 + 0.3);
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - 10, py); ctx.lineTo(px + 6 + Math.sin(T * 2 + i) * 4, py); ctx.stroke();
      }
    }
  } else ctx.drawImage(SC.ground, 0, 0, SC.W, SC.H);
  // sombras
  ctx.fillStyle = 'rgba(40, 30, 40, 0.22)';
  for (const o of SC.objects) if (o.shadow && inView(o.x, o.y, o.w, o.h)) { ctx.beginPath(); ctx.ellipse(o.x + o.shadow * 0.15, o.y - 4, o.shadow, o.shadow * 0.28, 0, 0, 7); ctx.fill(); }
  // bancos de peces
  for (const nd of SC.nodes) if (nd.kind === 'fish' && T > nd.ready && inView(nd.x, nd.y, 60, 60)) {
    for (let k = 0; k < 3; k++) { const p = (T * 0.7 + k / 3) % 1; ctx.globalAlpha = 1 - p; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(nd.x, nd.y, 10 + p * 34, (10 + p * 34) * 0.45, 0, 0, 7); ctx.stroke(); }
    ctx.globalAlpha = 1;
    if (Math.sin(T * 1.3 + nd.x) > 0.93) { ctx.fillStyle = RES.fish[nd.tier][1]; ctx.beginPath(); ctx.ellipse(nd.x + 8, nd.y - 14, 9, 4, -0.6, 0, 7); ctx.fill(); }
  }
  for (const m of mobs) {
    if (!m.dead || !m.loot || !inView(m.x, m.y, 60, 60)) continue;
    const D = MONSTERS[m.type], s = D.size * 0.95 * (m.sc || 1);
    ctx.save(); ctx.globalAlpha = 0.85; ctx.filter = 'saturate(0.5) brightness(0.8)';
    if (D.animal) { ctx.translate(m.x, m.y - D.top * s * 0.7); ctx.scale(m.flip ? -1 : 1, -1); } else { ctx.translate(m.x, m.y - 10); ctx.rotate(m.flip ? -1.45 : 1.45); }
    ctx.drawImage(monsterSprite(m.type, 0, false), -FX * s, -FY * s * 0.9, TW * s, TH * s); ctx.restore(); ctx.filter = 'none';
    if (m.loot.length) for (let k = 0; k < 4; k++) {
      const a = T * 2 + k * 1.6, r = 18 + Math.sin(T * 3 + k) * 4;
      ctx.fillStyle = `rgba(255, 220, 90, ${0.55 + Math.sin(T * 5 + k) * 0.35})`;
      ctx.beginPath(); ctx.arc(m.x + Math.cos(a) * r, m.y - 24 + Math.sin(a) * r * 0.5, 3, 0, 7); ctx.fill();
    }
  }
  drawZones(ctx);
  const tg = hero && hero.target;
  if (tg && !tg.dead && mobs.includes(tg) && Math.hypot(tg.x - hero.x, tg.y - hero.y) < 520) {   // marca del objetivo
    const s = MONSTERS[tg.type].size * (tg.sc || 1), r = 30 * s;
    ctx.strokeStyle = '#ff4a3a'; ctx.lineWidth = 3.5; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.ellipse(tg.x, tg.y - 2, r, r * 0.36, 0, 0, 7); ctx.stroke();
    for (let k = 0; k < 4; k++) { const a = T * 1.5 + k * Math.PI / 2; ctx.beginPath(); ctx.moveTo(tg.x + Math.cos(a) * (r + 4), tg.y - 2 + Math.sin(a) * (r + 4) * 0.36); ctx.lineTo(tg.x + Math.cos(a) * (r + 13), tg.y - 2 + Math.sin(a) * (r + 13) * 0.36); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  const list = [];
  for (const o of SC.objects) if (inView(o.x, o.y, o.w, o.h)) list.push({ y: o.y, o });
  for (const nd of SC.nodes) if (nd.kind !== 'fish' && T > nd.ready && inView(nd.x, nd.y, 60, 80)) list.push({ y: nd.y, nd });
  for (const n of npcs) if (inView(n.x, n.y, 60, 140)) list.push({ y: n.y, n });
  for (const m of mobs) if (!m.dead && inView(m.x, m.y, 40 * (m.sc || 1), 60 * (m.sc || 1))) list.push({ y: m.y, m });
  if (hero) list.push({ y: hero.y, h: hero });
  list.sort((a, b) => a.y - b.y);
  for (const it of list) {
    if (it.o) {
      const o = it.o;
      const behind = hero && o.y > hero.y && o.y - hero.y < o.h * 0.85 && Math.abs(o.x - hero.x) < o.w * 0.42;
      if (behind) ctx.globalAlpha = 0.45;
      if (o.tree) { ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(Math.sin(T * 1.1 + o.sway) * 0.012); ctx.drawImage(o.img, -o.w / 2, -o.h, o.w, o.h); ctx.restore(); }
      else ctx.drawImage(o.img, o.x - o.w / 2, o.y - o.h, o.w, o.h);
      if (o.portal) {   // remolino del portal
        const p = o.portal, cx0 = o.x, cy0 = o.y - 82;
        const g = ctx.createRadialGradient(cx0, cy0, 4, cx0, cy0, 60); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, p.col); g.addColorStop(1, p.col + '00');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx0, cy0, 40, 62, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 3;
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(cx0, cy0, 12 + k * 10, 20 + k * 14, 0, T * 2 + k * 2, T * 2 + k * 2 + 2.4); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
    } else if (it.nd) {
      const nd = it.nd;
      if (nd.kind === 'ore') ctx.drawImage(rockArt(nd.tier % 4, RES.ore[nd.tier][1]), nd.x - 48, nd.y - 64, 96, 70);
      else ctx.drawImage(herbArt(nd.tier), nd.x - 30, nd.y - 50, 60, 52);
      if (Math.sin(T * 3 + nd.x) > 0.7) { ctx.fillStyle = '#ffffffcc'; ctx.beginPath(); ctx.arc(nd.x + 14, nd.y - 40, 3, 0, 7); ctx.fill(); }
    } else if (it.m) {
      const m = it.m, D = MONSTERS[m.type], s = D.size * (m.sc || 1);
      const f = Math.sin(m.t * 7) > 0 && m.state !== 'idle' ? 1 : (m.state === 'idle' && Math.sin(m.t * 3) > 0.6 ? 1 : 0);
      const jy = m.jump > 0 ? -Math.sin((m.jump / 0.25) * Math.PI) * 10 : 0;
      ctx.fillStyle = 'rgba(40,30,40,.25)'; ctx.beginPath(); ctx.ellipse(m.x, m.y - 2, 24 * s, 7 * s, 0, 0, 7); ctx.fill();
      if (m.boss) { ctx.strokeStyle = SC.portal ? SC.portal.col : '#f0c040'; ctx.lineWidth = 4; ctx.globalAlpha = 0.6 + Math.sin(T * 4) * 0.3; ctx.beginPath(); ctx.ellipse(m.x, m.y - 2, 50, 16, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      if (m.hit > 0) ctx.filter = 'brightness(2.2)';
      else if (m.boss) ctx.filter = `drop-shadow(0 0 8px ${SC.portal ? SC.portal.col : '#f0c040'})`;
      ctx.save(); ctx.translate(m.x, m.y + jy);
      const face = m.state === 'chase' && hero ? hero.x < m.x : m.flip;
      if (face) ctx.scale(-1, 1);
      ctx.drawImage(monsterSprite(m.type, f, m.jump > 0), -FX * s, -FY * s, TW * s, TH * s);
      ctx.restore(); ctx.filter = 'none';
      const top = m.y - (D.hb || (D.body === 'blob' ? 58 : 100)) * s, bw = m.boss ? 110 : 56;
      if (m.hp < m.max || m.state === 'chase') { ctx.fillStyle = '#2a2220'; ctx.fillRect(m.x - bw / 2, top - 4, bw, 8); ctx.fillStyle = m.state === 'chase' ? '#d9402e' : '#d9a93a'; ctx.fillRect(m.x - bw / 2 + 2, top - 2, (bw - 4) * m.hp / m.max, 4); }
    } else {
      const c = it.n || it.h, isHero = !!it.h, L = isHero ? c.look : c.V.look;
      let dir = c.dir, flip = c.flip;
      if (isHero && c.spin > 0) { const k = Math.floor(c.spin * 16) % 4; dir = [0, 2, 1, 2][k]; flip = k === 3; }
      const spr = toonSprite(L, dir, isHero ? c.frame : 0, isHero && c.atkT > 0 ? 'atk' : '');
      ctx.fillStyle = 'rgba(40,30,40,.28)'; ctx.beginPath(); ctx.ellipse(c.x, c.y - 2, 22, 7, 0, 0, 7); ctx.fill();
      if (isHero && L.aura) {   // aura del equipo épico / legendario
        const g = ctx.createRadialGradient(c.x, c.y - 50, 10, c.x, c.y - 50, 70); g.addColorStop(0, L.aura + '40'); g.addColorStop(1, L.aura + '00');
        ctx.fillStyle = g; ctx.fillRect(c.x - 70, c.y - 120, 140, 140);
        for (let k = 0; k < 5; k++) { const p = (T * 0.6 + k / 5) % 1; ctx.globalAlpha = 1 - p; ctx.fillStyle = L.aura; ctx.beginPath(); ctx.arc(c.x + Math.sin(k * 2.3 + T) * 24, c.y - 10 - p * 90, 2.5, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
      const bob = isHero ? 0 : Math.sin(T * 2 + c.t) * 0.8;
      ctx.save(); ctx.translate(c.x, c.y);
      if (dir === 2 && flip) ctx.scale(-1, 1);
      if (isHero && (c.hurt > 0 || c.dead)) ctx.globalAlpha = c.dead ? 0.4 : 0.55 + Math.sin(T * 50) * 0.3;
      if (isHero && c.stealth > T) ctx.globalAlpha = 0.35;
      ctx.drawImage(spr, -FX, -FY + bob, TW, TH);
      if (isHero && c.shield && c.shield.until > T && c.shield.amt > 0) { ctx.globalAlpha = 0.25 + Math.sin(T * 5) * 0.08; ctx.fillStyle = c.shield.c; ctx.beginPath(); ctx.ellipse(0, -50, 44, 62, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 0.8; ctx.strokeStyle = c.shield.c; ctx.lineWidth = 3; ctx.stroke(); }
      ctx.restore();
    }
  }
  // proyectiles y efectos
  X = ctx;
  for (const s of shots) { const r = s.ab.big ? 9 : 6; ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(s.x, s.y, r + 4, 0, 7); ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, 7); ctx.fill(); ctx.lineWidth = 2.4; ctx.strokeStyle = OUT; ctx.stroke(); dot(s.x - 2, s.y - 2, r * 0.35, '#fff'); }
  for (const f of fx) {
    const k = f.t / f.life;
    if (f.k === 'p') { ctx.globalAlpha = 1 - k; ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, 4, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    else if (f.k === 'ring') { const r = 8 + (f.r - 8) * Math.min(1, k * 1.6); ctx.globalAlpha = 1 - k; ctx.strokeStyle = f.c; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.55, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
    else if (f.k === 'mark') { ctx.globalAlpha = 0.5 + Math.sin(T * 20) * 0.2; ctx.strokeStyle = f.c; ctx.lineWidth = 4; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.55, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * k, f.r * k * 0.55, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
    else if (f.k === 'bomb') { const p = Math.min(1, k), x0 = f.x0 + (f.x - f.x0) * p, y0 = f.y0 + (f.y - f.y0) * p - Math.sin(p * Math.PI) * 80; dot(x0, y0, 8, '#3a3440'); dot(x0 - 2, y0 - 3, 2.4, '#fff'); dot(x0 + 4, y0 - 9, 3, Math.sin(T * 40) > 0 ? '#ffd27a' : '#ff6a3a'); }
    else if (f.k === 'slash') {
      const a0 = Math.atan2(f.dir[1], f.dir[0]);
      ctx.globalAlpha = 1 - k; ctx.lineCap = 'round';
      ctx.strokeStyle = OUT; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(f.x - f.dir[0] * 14, f.y - f.dir[1] * 14, 28, a0 - 1.2 + k, a0 + 1.0 + k); ctx.stroke();
      ctx.strokeStyle = f.c; ctx.lineWidth = 5; ctx.stroke(); ctx.globalAlpha = 1;
    }
  }
  // humo y fuego
  for (const [i, ch] of SC.chimneys.entries()) {
    if (!inView(ch.x, ch.y, 60, 80)) continue;
    for (let k = 0; k < 4; k++) {
      const p = (T * 0.3 + k / 4 + i * 0.17) % 1;
      ctx.fillStyle = `rgba(235,230,222,${0.6 * (1 - p)})`; ctx.beginPath(); ctx.arc(ch.x + Math.sin(p * 6 + i) * 6 + p * 18, ch.y - p * 70, 6 + p * 10, 0, 7); ctx.fill();
    }
  }
  for (const fire of SC.lights) {
    if (!fire.fire || !inView(fire.x, fire.y + 40, 60, 80)) continue;
    const sc = fire.torch ? 0.55 : 1, fy = fire.torch ? fire.y + 18 : fire.y;
    for (let k = 0; k < 8; k++) {
      const p = (T * 1.5 + k / 8) % 1;
      ctx.fillStyle = p < 0.3 ? '#fff1a0' : p < 0.6 ? '#ffb03a' : '#e0522a';
      ctx.beginPath(); ctx.arc(fire.x + Math.sin(k * 3 + T * 9) * 8 * (1 - p) * sc, fy + (14 - p * 34) * sc, (7 * (1 - p) + 2) * sc, 0, 7); ctx.fill();
    }
  }
  // oscuridad de las mazmorras
  if (SC.dark && hero) {
    const hx = hero.x, hy = hero.y - 40, g = ctx.createRadialGradient(hx, hy, 120, hx, hy, 520);
    g.addColorStop(0, 'rgba(8,4,12,0)'); g.addColorStop(1, 'rgba(8,4,12,.82)');
    ctx.fillStyle = g; ctx.fillRect(camX - 10, camY - 10, vw + 20, vh + 20);
  }
  // luz cálida
  ctx.globalCompositeOperation = 'lighter';
  for (const l of SC.lights) {
    if (!inView(l.x, l.y + l.r, l.r, l.r * 2)) continue;
    const r = l.r * (1 + Math.sin(T * (l.fire ? 11 : 2.5) + l.x) * (l.fire ? 0.12 : 0.04));
    const gr = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
    gr.addColorStop(0, l.fire ? 'rgba(255,150,60,0.32)' : 'rgba(255,200,110,0.16)'); gr.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = gr; ctx.fillRect(l.x - r, l.y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  // textos
  ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  const label = (txt, x, y, col, size) => { ctx.font = `bold ${size}px Trebuchet MS, sans-serif`; ctx.lineWidth = 5; ctx.strokeStyle = '#2a2220'; ctx.strokeText(txt, x, y); ctx.fillStyle = col; ctx.fillText(txt, x, y); };
  const fs = 17 / Math.max(0.8, Z), touch = document.body.classList.contains('touch');
  const act = hero && nearAct();
  for (const n of npcs) {
    if (!inView(n.x, n.y, 80, 160)) continue;
    label(n.V.name, n.x, n.y - (n.V.look.hat === 'wizard' ? 132 : 112), act && act.ref === n ? '#ffe46a' : '#b8f08a', fs);
    if (n.V.role) label(n.V.title, n.x, n.y - (n.V.look.hat === 'wizard' ? 132 : 112) + fs, '#ffd27a', fs * 0.72);
  }
  for (const p of SC.portals) if (inView(p.x, p.y, 120, 200)) label(`Portal ${p.name} · Nv ${p.lvl}${hero && hero.done[p.i] ? ' ✔' : ''}`, p.x, p.y - 180, p.col, fs);
  if (act && act.ref !== talkingTo && act.ref !== lootOf) label(touch ? `Toca ${act.icon} ${act.text}` : `[E] ${act.text}`, act.x, act.y + 26, '#ffffff', fs * 0.85);
  for (const m of mobs) if (!m.dead && hero && Math.hypot(m.x - hero.x, m.y - hero.y) < 300) label(`${m.name || MONSTERS[m.type].name} · Nv ${m.lvl}`, m.x, m.y - (MONSTERS[m.type].top || (MONSTERS[m.type].body === 'blob' ? 66 : 112)) * MONSTERS[m.type].size * (m.sc || 1), m.boss ? '#ffb0ff' : m.state === 'chase' ? '#ff9a8a' : '#ffd27a', fs * (m.boss ? 1 : 0.8));
  if (hero) label(hero.name, hero.x, hero.y - (hero.look.hat === 'wizard' ? 132 : 112), '#ffffff', fs);
  for (const n of nums) {
    const k = n.t / (n.big ? 1.6 : 0.9);
    ctx.globalAlpha = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
    label(String(n.txt), n.x, n.y - n.t * 60, n.c, n.big ? fs * 1.7 : fs * 1.25);
    ctx.globalAlpha = 1;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/* ================================================================== HUD */
const bar2 = document.getElementById('bar2');
function buildBar() {
  const keyL = ['1', '2·Q', '3·R', '4·F', '5·T'];
  bar2.innerHTML = hero.abil.bar.map((id, i) => { const ab = id && ABIL[id]; return `<button class="slot ab${i}" data-s="${i}" title="${ab ? ab.name : 'Vacía: equipa una habilidad en el libro (K)'}"><em>${keyL[i]}</em>${ab ? ab.icon : '<span class="empty">＋</span>'}<span class="cd"></span></button>`; }).join('') + '<button class="slot pot" id="potbtn" title="Poción de vida (6 o Z)"><em>6</em>🧪<b id="potn"></b></button><button class="slot pot bomb" id="bombbtn" title="Bomba (7 o X)"><em>7</em>💣<b id="bombn"></b></button><button class="slot pot food" id="foodbtn" title="Comer (8 o V)"><em>8</em>🍖<b id="foodn"></b></button>';
  potBtn = document.getElementById('potbtn'); potEl = document.getElementById('potn');
  potBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); drinkPotion(); });
  document.getElementById('foodbtn').addEventListener('pointerdown', (e) => { e.preventDefault(); eatFood(); });
  document.getElementById('bombbtn').addEventListener('pointerdown', (e) => { e.preventDefault(); throwBomb(); });
  bar2.querySelectorAll('.slot[data-s]').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (hero.abil.bar[+b.dataset.s]) use(+b.dataset.s); else openBook(+b.dataset.s); }));
  document.getElementById('tip').innerHTML = 'Autoapuntado activado (Tab o clic en un monstruo para cambiar de objetivo) · Habilidades: Espacio/clic, Q, R, F, T (o 1-5) · E: interactuar · K: libro de habilidades · B: bolsa · C: personaje · P: profesiones · M: mapa';
}
function pressSlot(s) { const b = bar2.querySelector(`[data-s="${s}"]`); if (!b) return; b.classList.add('press'); setTimeout(() => b.classList.remove('press'), 120); }
function hud() {
  const act = nearAct();
  document.body.classList.toggle('nearnpc', !!act);
  if (act && actBtn.textContent !== act.icon) actBtn.textContent = act.icon;
  const bb = document.getElementById('bombbtn'); bb.style.display = hero.bombs ? 'inline-block' : 'none'; document.getElementById('bombn').textContent = hero.bombs;
  const nf = Object.values(hero.food).reduce((a, b) => a + b, 0), fb = document.getElementById('foodbtn'); fb.style.display = nf ? 'inline-block' : 'none'; document.getElementById('foodn').textContent = nf;
  goldEl.textContent = `🪙 ${hero.gold}`;
  potEl.textContent = hero.potions;
  potBtn.style.opacity = hero.potions ? 1 : 0.4;
  if (lootOf && Math.hypot(lootOf.x - hero.x, lootOf.y - hero.y) > 120) closeLoot();
  const hp = document.getElementById('h-hp'), xp = document.getElementById('h-xp');
  hp.querySelector('i').style.width = `${(hero.hp / hero.max) * 100}%`; hp.querySelector('span').textContent = `${Math.ceil(hero.hp)} / ${hero.max}${!hero.inCombat && hero.hp < hero.max ? ' ✚' : ''}`;
  hp.classList.toggle('regen', !hero.inCombat && hero.hp < hero.max);
  xp.querySelector('i').style.width = `${(hero.xp / xpNeed(hero.lvl)) * 100}%`; xp.querySelector('span').textContent = `Nivel ${hero.lvl} · ${hero.xp}/${xpNeed(hero.lvl)} XP`;
  for (const b of bar2.querySelectorAll('.slot[data-s]')) {
    const id = hero.abil.bar[+b.dataset.s]; if (!id) continue;
    const left = (hero.cd[id] || 0) - T, tot = cdOf(ABIL[id]), cd = b.querySelector('.cd');
    cd.style.setProperty('--k', left > 0 ? left / tot : 0); cd.textContent = left > 1 ? Math.ceil(left) : '';
  }
}
function drawPortrait() {
  const p = document.getElementById('port'), x = p.getContext('2d');
  x.clearRect(0, 0, p.width, p.height);
  x.drawImage(toonSprite(hero.look, 0, 0, ''), (FX - 30) * TRES, 28 * TRES, 60 * TRES, 60 * TRES, 0, 0, p.width, p.height);
}

/* ============================================================== creador */
const SAVE = 'mini-realms-toon-heroe';
const opt = { name: '', gender: 'chico', cls: 'mago', skin: SKINS[1], style: 'corto', hair: HAIRS[1], eye: EYES[0], outfit: CLASSES.mago.color, face: 'alegre' };
try { Object.assign(opt, JSON.parse(localStorage.getItem(SAVE)) || {}); } catch { /* */ }
const KEEP = ['lvl', 'xp', 'weapon', 'bag', 'gold', 'mats', 'potions', 'res', 'profs', 'tools', 'bombs', 'found', 'done', 'seen', 'gear', 'food', 'abil', 'offhand'];
function save() { if (!hero) return; try { syncSeen(); const o = { ...opt }; for (const k of KEEP) o[k] = hero[k]; localStorage.setItem(SAVE, JSON.stringify(o)); } catch { /* */ } }
const pv = document.getElementById('preview'), pvx = pv.getContext('2d');
let pvDir = 0, pvWalk = false;
function chips(id, items, key, onPick) {
  const el = document.getElementById(id);
  el.innerHTML = items.map(([v, label]) => `<button class="chip ${opt[key] === v ? 'on' : ''}" data-v="${v}">${label}</button>`).join(' ');
  el.querySelectorAll('button').forEach((b) => (b.onclick = () => { opt[key] = b.dataset.v; onPick?.(b.dataset.v); renderCreator(); }));
}
function swatches(id, cols, key) {
  const el = document.getElementById(id);
  el.innerHTML = cols.map((c) => `<button class="sw ${opt[key] === c ? 'on' : ''}" style="background:${c}" data-v="${c}"></button>`).join(' ');
  el.querySelectorAll('button').forEach((b) => (b.onclick = () => { opt[key] = b.dataset.v; renderCreator(); }));
}
function renderCreator() {
  chips('o-gender', [['chico', '👦 Chico'], ['chica', '👧 Chica']], 'gender', (v) => { opt.style = v === 'chica' ? 'largo' : 'corto'; });
  chips('o-cls', Object.entries(CLASSES).map(([k, c]) => [k, `${c.icon} ${c.name}`]), 'cls', (v) => { opt.outfit = CLASSES[v].color; });
  const K = CLASSES[opt.cls];
  document.getElementById('clsdesc').innerHTML = `${K.desc}<br>Empiezas con <b>${ABIL[START_ABILS[opt.cls][0]].icon} ${ABIL[START_ABILS[opt.cls][0]].name}</b> (ataque básico) y <b>${ABIL[START_ABILS[opt.cls][1]].icon} ${ABIL[START_ABILS[opt.cls][1]].name}</b>. Hay 20 habilidades por clase: lleva 5 a la vez.<br>Empiezas con ropa sencilla: la armadura se consigue matando monstruos, y las mazmorras dan las mejores piezas.`;
  swatches('o-skin', SKINS, 'skin');
  chips('o-style', Object.entries(STYLES), 'style');
  swatches('o-hair', HAIRS, 'hair');
  swatches('o-eye', EYES, 'eye');
  chips('o-face', Object.entries(FACES), 'face');
  document.getElementById('beardrow').style.display = opt.gender === 'chico' ? '' : 'none';
  if (!opt.beard) opt.beard = 'ninguna';
  chips('o-beard', Object.entries(BEARDS), 'beard');
  swatches('o-outfit', OUTFITS, 'outfit');
}
function drawPreview() {
  pvx.setTransform(1, 0, 0, 1, 0, 0);
  pvx.clearRect(0, 0, pv.width, pv.height);
  const dirs = [[0, false], [2, false], [1, false], [2, true]];
  const [d, flip] = dirs[pvDir];
  const spr = toonSprite(heroLook(opt), d, pvWalk ? Math.floor(T * 7) % 4 : 0, pvAtk > 0 ? 'atk' : '');
  const s = Math.min(pv.width / TW, pv.height / TH) * 0.98;
  pvx.fillStyle = 'rgba(30,20,20,.3)'; pvx.beginPath(); pvx.ellipse(pv.width / 2, pv.height - 18, 26 * s, 8 * s, 0, 0, 7); pvx.fill();
  pvx.save(); pvx.translate(pv.width / 2, pv.height - 18 - (TH - FY) * s);
  if (flip) pvx.scale(-1, 1);
  pvx.drawImage(spr, -FX * s, -FY * s, TW * s, TH * s);
  pvx.restore();
  pvAtk -= 1 / 60;
}
let pvAtk = 0;
document.querySelectorAll('[data-turn]').forEach((b) => (b.onclick = () => { pvDir = (pvDir + +b.dataset.turn + 4) % 4; }));
document.getElementById('anim').onclick = (e) => { pvWalk = !pvWalk; e.target.textContent = pvWalk ? '⏸ Parar' : '▶ Andar'; };
document.getElementById('atkbtn').onclick = () => { pvAtk = 0.4; };
document.getElementById('rand').onclick = () => {
  const p = (a) => a[(Math.random() * a.length) | 0];
  Object.assign(opt, { gender: p(['chico', 'chica']), cls: p(Object.keys(CLASSES)), skin: p(SKINS), style: p(Object.keys(STYLES)), hair: p(HAIRS), eye: p(EYES), outfit: p(OUTFITS), face: p(Object.keys(FACES)), beard: Math.random() < 0.5 ? 'ninguna' : p(Object.keys(BEARDS)) });
  renderCreator();
};
const nameEl = document.getElementById('name');
nameEl.value = opt.name || '';
document.getElementById('start').onclick = () => {
  opt.name = nameEl.value.trim() || (opt.gender === 'chica' ? 'Aventurera' : 'Aventurero');
  nameEl.blur();
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(SAVE)); } catch { /* */ }
  const keep = saved && saved.cls === opt.cls && saved.name === opt.name;
  const lvl = keep ? saved.lvl || 1 : 1;
  hero = { name: opt.name, cls: opt.cls, look: heroLook(opt), x: START.x, y: START.y, dir: 0, frame: 0, ft: 0, lvl, xp: keep ? saved.xp || 0 : 0, max: HP[opt.cls] + (lvl - 1) * 12, cd: { basic: 0, power: 0 }, atkT: 0, hurt: 0 };
  hero.weapon = keep && saved.weapon ? saved.weapon : starterWeapon(opt.cls);
  hero.bag = keep && saved.bag ? saved.bag : [];
  hero.gold = keep ? saved.gold || 0 : 0; hero.mats = keep ? saved.mats || {} : {}; hero.potions = keep ? saved.potions ?? 2 : 2;
  const def = { res: {}, profs: {}, tools: {}, bombs: 0, found: [], done: [], skill: { basic: 1, power: 1 }, seen: '', gear: {}, food: {} };
  for (const k in def) hero[k] = keep && saved[k] != null ? saved[k] : def[k];
  hero.cd.bomb = 0;
  hero.abil = keep ? saved.abil : null; hero.offhand = keep ? saved.offhand || null : null;
  if (!hero.abil || !hero.abil.bar) { const s0 = START_ABILS[hero.cls]; hero.abil = { known: { [s0[0]]: 1, [s0[1]]: 1 }, bar: [s0[0], s0[1], null, null, null] }; }
  hero.hp = null; recalc(); hero.hp = hero.max; refreshLook();
  document.getElementById('creator').style.display = 'none';
  for (const id of ['hud', 'bar2', 'tip']) document.getElementById(id).style.display = id === 'tip' ? 'block' : 'flex';
  initSeen(); enterScene(WORLD, START.x, START.y);
  for (const id of ['profbtn', 'mapbtn', 'charbtn', 'minimap']) document.getElementById(id).style.display = 'block';
  document.getElementById('h-name').textContent = hero.name;
  document.getElementById('h-cls').textContent = `${CLASSES[hero.cls].icon} ${CLASSES[hero.cls].name}`;
  buildBar(); drawPortrait(); renderBag();
  document.getElementById('bagbtn').style.display = 'block';
  playing = true; document.body.classList.add('playing');
  if (document.body.classList.contains('touch')) {
    try { const d = document.documentElement; (d.requestFullscreen ? d.requestFullscreen({ navigationUI: 'hide' }) : Promise.reject()).then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {}); } catch { /* no soportado */ }
  }
  save();
};

/* =========================================================== saqueo */
const lootEl = document.getElementById('lootwin'), actBtn = document.getElementById('act'), goldEl = document.getElementById('h-gold');
let lootOf = null, potBtn = null, potEl = null;
function itemLine(it, i) {
  if (it.kind === 'gold') return `<div class="lrow"><span class="li">🪙</span><b style="color:#ffd27a">${it.n} de oro</b><button class="ghost" data-take="${i}">Coger</button></div>`;
  if (it.kind === 'res') return `<div class="lrow"><span class="li">${it.icon}</span><b style="color:${RES[it.res][it.t][1]}">${it.name}${it.n > 1 ? ` ×${it.n}` : ''}<small>Para Cocina</small></b><button class="ghost" data-take="${i}">Coger</button></div>`;
  if (it.kind === 'gear') { const g = it.g, R = RARITY[g.rarity]; return `<div class="lrow"><img src="${gearIcon(g).toDataURL()}"><b style="color:${R.color}">${g.name}<small>${gearDesc(g)} · ${gearStats(g)}${gearScore(g) > gearScore(hero.gear[g.slot]) && canWear(g) ? ' <span class="up">▲</span>' : ''}${canWear(g) ? '' : ' <span class="down">(no puedes llevarlo)</span>'}</small></b><button class="ghost" data-take="${i}">Coger</button></div>`; }
  if (it.kind === 'weapon') { const R = RARITY[it.w.rarity]; return `<div class="lrow"><img src="${weaponIcon(it.w).toDataURL()}"><b style="color:${R.color}">${it.w.name}<small>${R.name} · Daño ${it.w.dmg}${it.w.dmg > hero.weapon.dmg ? ' <span class="up">▲</span>' : ''}</small></b><button class="ghost" data-take="${i}">Coger</button></div>`; }
  return `<div class="lrow"><span class="li">${it.icon}</span><b>${it.name}${it.n > 1 ? ` ×${it.n}` : ''}</b><button class="ghost" data-take="${i}">Coger</button></div>`;
}
function openLoot(m) {
  lootOf = m;
  lootEl.innerHTML = `<header><b>💰 Botín: ${MONSTERS[m.type].name}</b><button class="ghost" data-close>✕</button></header>
    ${m.loot.map(itemLine).join('')}<div class="lgo"><button class="big" data-all>Cogerlo todo</button></div>`;
  lootEl.classList.add('open');
  lootEl.querySelector('[data-close]').onclick = closeLoot;
  lootEl.querySelector('[data-all]').onclick = () => { for (let i = m.loot.length - 1; i >= 0; i--) take(m, i, true); finishLoot(m); };
  lootEl.querySelectorAll('[data-take]').forEach((b) => (b.onclick = () => { take(m, +b.dataset.take); finishLoot(m); }));
}
function closeLoot() { lootOf = null; lootEl.classList.remove('open'); }
function finishLoot(m) { save(); renderBag(); if (!m.loot.length) closeLoot(); else openLoot(m); }
function take(m, i, quiet) {
  const it = m.loot[i];
  if (!it) return;
  if (it.kind === 'gold') { hero.gold += it.n; nums.push({ x: hero.x, y: hero.y - 120, t: 0, txt: `+${it.n} 🪙`, c: '#ffd27a' }); }
  else if (it.kind === 'mat') { hero.mats[it.name] = { icon: it.icon, n: (hero.mats[it.name]?.n || 0) + it.n }; if (!quiet) toast(`${it.icon} ${it.name}${it.n > 1 ? ` ×${it.n}` : ''}`); }
  else if (it.kind === 'potion') hero.potions += it.n;
  else if (it.kind === 'res') { addRes(it.res, it.t, it.n); if (!quiet) toast(`${it.icon} ${it.name} ×${it.n}`); }
  else if (it.kind === 'gear') {
    if (hero.bag.length >= BAGMAX) { toast('Tu bolsa está llena'); return; }
    hero.bag.push(it.g);
    toast(`🎁 <b style="color:${RARITY[it.g.rarity].color}">${it.g.name}</b> · ${gearStats(it.g)}`);
  }
  else if (it.kind === 'weapon') {
    if (hero.bag.length >= BAGMAX) { toast('Tu bolsa está llena'); return; }
    hero.bag.push(it.w);
    toast(`🎁 <b style="color:${RARITY[it.w.rarity].color}">${it.w.name}</b> (${RARITY[it.w.rarity].name}, daño ${it.w.dmg})${it.w.dmg > hero.weapon.dmg ? ' <span style="color:#7dff7a">▲ mejor que la tuya</span>' : ''}`);
  }
  m.loot.splice(i, 1);
}
function drinkPotion() {
  if (!hero || hero.dead) return;
  if (!hero.potions) { toast('No te quedan pociones'); return; }
  if ((hero.potCd || 0) > T) return;
  hero.potions--; hero.potCd = T + 3;
  const h = Math.round(hero.max * 0.4); hero.hp = Math.min(hero.max, hero.hp + h);
  nums.push({ x: hero.x, y: hero.y - 110, t: 0, txt: `+${h}`, c: '#7dff7a' });
  fx.push({ k: 'ring', x: hero.x, y: hero.y - 10, r: 40, t: 0, life: 0.5, c: '#7dff7a' });
  save();
}

/* ================================================================= bolsa */
const bagEl = document.getElementById('bag');
function toast(html) {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html;
  const box = document.getElementById('toasts'); box.appendChild(t); while (box.children.length > (document.body.classList.contains('touch') ? 3 : 5)) box.firstChild.remove(); setTimeout(() => t.remove(), 4200);
}
/* ------------------------------------------------- mochila en cuadrícula */
let bagSel = null, dropArm = null;
function bagStacks() {
  const out = [];
  if (hero.potions) out.push({ key: 'pot', icon: '🧪', n: hero.potions, name: 'Poción de vida', col: '#e8e2d0', info: 'Cura al instante el 40 % de tu vida. Espera 3 s entre una y otra.', use: 'Beber' });
  if (hero.bombs) out.push({ key: 'bomb', icon: '💣', n: hero.bombs, name: 'Bomba', col: '#e8e2d0', info: 'Se lanza al enemigo más cercano y explota en área. Se fabrica con Ingeniería.', use: 'Lanzar' });
  for (const [k, n] of Object.entries(hero.food)) if (n > 0) { const F = FOOD[k]; out.push({ key: 'food:' + k, icon: F[1], n, name: F[0], col: F[3] ? '#7ad85a' : '#e8e2d0', info: `Comida de nivel ${F[2]}: te cura poco a poco durante 10 s${F[3] ? ` y te deja «Bien alimentado» (+${4 + 2 * F[2]} % de daño y +${F[2] * 10} de vida durante 5 min)` : ''}. Se vende por ${F[2] * 3} 🪙.`, use: 'Comer' }); }
  for (const r of resList()) out.push({ key: 'res:' + r.kind + r.t, icon: r.icon, n: r.n, name: r.name, col: r.col, info: `${{ ore: 'Mena para Herrería e Ingeniería', herb: 'Planta para Medicina', fish: 'Pescado para Cocina y Medicina', meat: 'Carne para Cocina' }[r.kind]} · calidad ${r.t}/5. Tobías te la compra a ${resPrice(r.t)} 🪙.` });
  for (const [nm, v] of Object.entries(hero.mats)) out.push({ key: 'mat:' + nm, icon: v.icon, n: v.n, name: nm, col: '#a8a290', info: `Material de criatura. No sirve para nada más que para venderlo: Tobías te da ${MAT_PRICE} 🪙 por cada uno.` });
  for (const t of Object.keys(hero.tools)) { const pid = Object.keys(PROFS).find((p) => PROFS[p].tool === t); out.push({ key: 'tool:' + t, icon: pid ? PROFS[pid].icon : '🧰', n: 0, name: t, col: '#ffd27a', info: `Herramienta de ${pid ? PROFS[pid].name : 'profesión'}. Se queda siempre en tu mochila.` }); }
  return out;
}
function cmp(a, b, label, unit = '') {
  const d = a - b;
  return `<div class="st"><span>${label}</span><b>${a}${unit}</b>${d ? `<i class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲ +' : '▼ '}${d}</i>` : ''}</div>`;
}
function itemInfo(sel) {
  if (!sel) return '<div class="binfo empty">Toca un objeto para ver su información.</div>';
  if (sel.stack) {
    const s = bagStacks().find((x) => x.key === sel.stack); if (!s) return itemInfo(null);
    return `<div class="binfo"><div class="bh"><span class="bi">${s.icon}</span><div><b style="color:${s.col}">${s.name}</b><small>${s.n ? `Tienes ${s.n}` : 'Herramienta'}</small></div></div><p>${s.info}</p>${s.use ? `<div class="bact"><button class="big sm" data-use="${s.key}">${s.use}</button></div>` : ''}</div>`;
  }
  const where = sel.eq === 'main' ? hero.weapon : sel.eq === 'off' ? hero.offhand : hero.bag.find((w) => w.id === sel.id);
  if (!where) return itemInfo(null);
  const it = where, R = RARITY[it.rarity], eq = !!sel.eq;
  let body = '', acts = '';
  if (it.slot) {
    const cur = hero.gear[it.slot] || { arm: 0, poder: 0, vida: 0 };
    body += `<small>${gearDesc(it)}</small>`;
    if (it.arm || cur.arm) body += cmp(it.arm, cur.arm, 'Armadura');
    if (it.poder || cur.poder) body += cmp(it.poder, cur.poder, MAIN_STAT[hero.cls]);
    if (it.vida || cur.vida) body += cmp(it.vida, cur.vida, 'Vida');
    body += `<p class="sub">${hero.gear[it.slot] ? `Comparado con lo que llevas: <b style="color:${RARITY[hero.gear[it.slot].rarity].color}">${hero.gear[it.slot].name}</b>` : `No llevas nada en ${SLOTS[it.slot].name.toLowerCase()}.`}</p>`;
    if (!canWear(it)) body += `<p class="down">Tu clase aún no puede llevar ${ARMOR_NAME[it.type].toLowerCase()}.</p>`;
    else acts += `<button class="big sm" data-geq="${it.id}">Ponérmelo</button>`;
  } else {
    const ref = sel.eq === 'off' ? hero.weapon : hero.weapon;
    body += `<small>Arma · ${(SHAPES[it.kind] && SHAPES[it.kind][it.shape]) || 'arma'} · Nv ${it.lvl}</small>`;
    body += eq ? `<div class="st"><span>Daño</span><b>${it.dmg}</b></div>` : cmp(it.dmg, ref.dmg, 'Daño');
    if (sel.eq === 'main') body += '<p class="sub">Es el arma que llevas en la mano.</p>';
    else if (sel.eq === 'off') { body += '<p class="sub">La llevas en la mano izquierda (Ambidextría).</p>'; acts += '<button class="ghost" data-unoff>Quitármela</button>'; }
    else {
      if (it.kind === WEAPON_OF[hero.cls]) acts += `<button class="big sm" data-eq="${it.id}">Equipar</button>`;
      if (hasDual() && it.kind === 'dagger') acts += `<button class="ghost" data-off="${it.id}">Mano izq.</button>`;
    }
  }
  if (!eq) acts += `<button class="ghost x" data-del="${it.id}">${dropArm === it.id ? '¿Seguro? Tirar' : 'Tirar'}</button>`;
  return `<div class="binfo r${it.rarity}"><div class="bh"><img src="${itemIcon(it).toDataURL()}"><div><b style="color:${R.color}">${it.name}</b><small style="color:${R.color}">${R.name}</small></div></div>${body}<div class="st"><span>Valor de venta</span><b>${sellItem(it)} 🪙</b></div>${acts ? `<div class="bact">${acts}</div>` : ''}</div>`;
}
function renderBag() {
  if (!hero) return;
  const cell = (it) => `<button class="bcell r${it.rarity} ${bagSel && bagSel.id === it.id && !bagSel.eq ? 'on' : ''}" data-it="${it.id}"><img src="${itemIcon(it).toDataURL()}">${it.slot && !canWear(it) ? '<i class="no">✕</i>' : ''}</button>`;
  const empty = '<span class="bcell vacio"></span>';
  const stacks = bagStacks();
  const eqCell = (w, k) => (w ? `<button class="bcell r${w.rarity} ${bagSel && bagSel.eq === k ? 'on' : ''}" data-eqs="${k}"><img src="${weaponIcon(w).toDataURL()}"><small>${k === 'main' ? 'Arma' : 'Izq.'}</small></button>` : '');
  bagEl.innerHTML = `<header><b>🎒 Mochila</b><span class="purse2">🪙 ${hero.gold}</span><button class="ghost" data-close>✕</button></header>
    <div class="bwrap"><div class="bleft"><div class="bgrid eqrow">${eqCell(hero.weapon, 'main')}${hasDual() ? eqCell(hero.offhand, 'off') || '<span class="bcell vacio"><small>Izq.</small></span>' : ''}<span class="bnote">Equipado · el resto de tu equipo está en 👤 (C)</span></div>
    <h4>Equipo (${hero.bag.length}/${BAGMAX})</h4>
    <div class="bgrid">${hero.bag.map(cell).join('')}${empty.repeat(Math.max(0, BAGMAX - hero.bag.length))}</div>
    ${stacks.length ? `<h4>Objetos</h4><div class="bgrid">${stacks.map((s) => `<button class="bcell st ${bagSel && bagSel.stack === s.key ? 'on' : ''}" data-st="${s.key}" style="--c:${s.col}"><span>${s.icon}</span>${s.n ? `<b>${s.n}</b>` : ''}</button>`).join('')}</div>` : ''}
    </div>${itemInfo(bagSel)}</div>`;
  const q = (s, f) => bagEl.querySelectorAll(s).forEach((b) => (b.onclick = () => f(b.dataset)));
  bagEl.querySelector('[data-close]').onclick = () => bagEl.classList.remove('open');
  q('[data-it]', (d) => { bagSel = { id: +d.it }; dropArm = null; renderBag(); });
  q('[data-eqs]', (d) => { bagSel = { eq: d.eqs }; renderBag(); });
  q('[data-st]', (d) => { bagSel = { stack: d.st }; renderBag(); });
  q('[data-eq]', (d) => {
    const i = hero.bag.findIndex((w) => w.id === +d.eq), w = hero.bag[i]; hero.bag[i] = hero.weapon; hero.weapon = w;
    bagSel = { eq: 'main' }; refreshLook(); renderBag(); save(); toast(`Has equipado <b style="color:${RARITY[w.rarity].color}">${w.name}</b>`);
  });
  q('[data-off]', (d) => {
    const i = hero.bag.findIndex((w) => w.id === +d.off), w = hero.bag[i];
    if (hero.offhand) hero.bag[i] = hero.offhand; else hero.bag.splice(i, 1);
    hero.offhand = w; bagSel = { eq: 'off' }; refreshLook(); renderBag(); save();
  });
  q('[data-unoff]', () => { if (hero.bag.length >= BAGMAX) { toast('Tu mochila está llena'); return; } hero.bag.push(hero.offhand); hero.offhand = null; bagSel = null; refreshLook(); renderBag(); save(); });
  q('[data-geq]', (d) => { bagSel = null; equipGear(+d.geq); });
  q('[data-del]', (d) => { if (dropArm !== +d.del) { dropArm = +d.del; renderBag(); return; } hero.bag = hero.bag.filter((w) => w.id !== +d.del); bagSel = null; dropArm = null; renderBag(); save(); });
  q('[data-use]', (d) => {
    if (d.use === 'pot') drinkPotion(); else if (d.use === 'bomb') throwBomb(); else if (d.use.startsWith('food:')) eatFood(d.use.slice(5));
    if (!bagStacks().some((s) => s.key === bagSel?.stack)) bagSel = null; renderBag();
  });
}
document.getElementById('bagbtn').onclick = () => { renderBag(); bagEl.classList.toggle('open'); };
addEventListener('keydown', (e) => { if (playing && (e.code === 'KeyB' || e.code === 'KeyI') && e.target.tagName !== 'INPUT') { renderBag(); bagEl.classList.toggle('open'); } });

/* ================================================================ táctil */
if (matchMedia('(pointer: coarse)').matches) {
  document.body.classList.add('touch');
  const j = document.getElementById('joy'), k = j.querySelector('i');
  let id = null, ox = 0, oy = 0;
  const mv = (e) => { if (e.pointerId !== id) return; let dx = e.clientX - ox, dy = e.clientY - oy; const d = Math.hypot(dx, dy); if (d > 50) { dx *= 50 / d; dy *= 50 / d; } k.style.transform = `translate(${dx}px,${dy}px)`; joy.x = dx / 50; joy.y = dy / 50; };
  j.addEventListener('pointerdown', (e) => { id = e.pointerId; j.setPointerCapture(id); const r = j.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2; mv(e); });
  j.addEventListener('pointermove', mv);
  const up = () => { id = null; joy.x = joy.y = 0; k.style.transform = ''; };
  j.addEventListener('pointerup', up); j.addEventListener('pointercancel', up);
  document.getElementById('act').addEventListener('click', doAct);
}

