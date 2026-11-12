// Criaturas originales de Mini Realms 3D. Cada especie tiene 3 etapas de
// evolución; el mismo constructor sirve para compañeros y para versiones
// salvajes (ojos rojos, ceño y aura morada).
import * as THREE from 'three';
import { G, toon, glow, part, eyes } from './gfx.js';

export const TYPES = {
  fuego:  { name: 'Fuego',  color: '#ff7a2f' },
  agua:   { name: 'Agua',   color: '#3fa7ff' },
  planta: { name: 'Planta', color: '#5fcf54' },
  rayo:   { name: 'Rayo',   color: '#c58bff' },
  hielo:  { name: 'Hielo',  color: '#8fe6ff' },
  tierra: { name: 'Tierra', color: '#c99a5b' },
};
// atacante → tipos contra los que es eficaz (x1.5)
export const STRONG = {
  fuego: ['planta', 'hielo'],
  agua: ['fuego', 'tierra'],
  planta: ['agua', 'tierra'],
  rayo: ['agua'],
  hielo: ['planta', 'tierra'],
  tierra: ['fuego', 'rayo'],
};
export const effectiveness = (atk, def) => (STRONG[atk]?.includes(def) ? 1.5 : 1);

export const SPECIES = {
  farolin: {
    type: 'fuego', names: ['Farolín', 'Farolón', 'Pirofaro'],
    desc: 'Un farolillo de piedra con una llama viva. Lanza bolas de fuego que explotan en área.',
    attack: { kind: 'lob', dmg: 14, cd: 1.6, range: 13, radius: 2.6 },
  },
  gotin: {
    type: 'agua', names: ['Gotín', 'Gotarro', 'Marejón'],
    desc: 'Una gota de agua juguetona con corona de coral. Dispara chorros rápidos.',
    attack: { kind: 'bolt', dmg: 9, cd: 0.55, range: 14 },
  },
  musgoro: {
    type: 'planta', names: ['Musgoro', 'Musgolem', 'Bosquemu'],
    desc: 'Un bloque de musgo con una flor en la cabeza. Hace girar hojas cortantes a tu alrededor.',
    attack: { kind: 'orbit', dmg: 7, cd: 0.35, range: 3.4, count: 2 },
  },
  medusin: {
    type: 'rayo', names: ['Medusín', 'Medusela', 'Tormedusa'],
    desc: 'Una medusa flotante cargada de electricidad. Sus rayos saltan entre enemigos.',
    attack: { kind: 'chain', dmg: 12, cd: 1.3, range: 12, jumps: 3 },
  },
  cristalo: {
    type: 'hielo', names: ['Cristalo', 'Cristalón', 'Glaciaro'],
    desc: 'Un cristal de hielo con un solo ojo. Libera ondas heladas que ralentizan.',
    attack: { kind: 'nova', dmg: 10, cd: 2.2, range: 5, slow: 0.5 },
  },
  bolarro: {
    type: 'tierra', names: ['Bolarro', 'Rodarro', 'Montarro'],
    desc: 'Un bicho acorazado que se hace bola. Golpea el suelo y empuja a los enemigos.',
    attack: { kind: 'quake', dmg: 16, cd: 2.8, range: 6.5, push: 6 },
  },
};
export const STARTERS = ['farolin', 'gotin', 'musgoro'];
export const ALL_SPECIES = Object.keys(SPECIES);
export const stageOf = (lvl) => (lvl >= 6 ? 3 : lvl >= 3 ? 2 : 1);

/* ---------------------------------------------------------------- modelos */
const BUILD = {
  farolin(g, s, wild) {
    const stone = toon(s === 3 ? 0x6f6a78 : 0x8a8478);
    const dark = toon(0x5d574e);
    part(g, G.sph, stone, [0, 0.55, 0], [0.55, 0.5, 0.5]);                 // cuerpo
    part(g, G.cyl6, dark, [0, 0.98, 0], [0.42, 0.12, 0.42]);                 // borde
    for (const x of [-0.25, 0.25]) part(g, G.sph, dark, [x, 0.12, 0.05], [0.18, 0.13, 0.22]); // pies
    eyes(g, { y: 0.6, z: 0.45, spread: 0.18, size: 0.13, wild });
    // llama
    const f1 = part(g, G.cone, glow(0xff6a1a), [0, 1.35, 0], [0.32, 0.7, 0.32]);
    const f2 = part(g, G.cone, glow(0xffd23a), [0, 1.28, 0.02], [0.18, 0.45, 0.18]);
    f1.castShadow = f2.castShadow = false;
    g.userData.flame = [f1, f2];
    if (s >= 2) for (const x of [-0.62, 0.62]) part(g, G.sph, stone, [x, 0.55, 0], [0.17, 0.2, 0.17]);
    if (s >= 3) {
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const c = part(g, G.cone, glow(0xff9a2a), [Math.cos(a) * 0.32, 1.12, Math.sin(a) * 0.32], [0.1, 0.32, 0.1]);
        c.castShadow = false;
      }
      part(g, G.cyl6, dark, [0, 0.25, 0], [0.6, 0.1, 0.6]);
    }
  },
  gotin(g, s, wild) {
    const water = toon(0x4fb3ff, { transparent: true, opacity: 0.9 });
    part(g, G.sph, water, [0, 0.5, 0], [0.5, 0.48, 0.5]);
    part(g, G.cone, water, [0, 1.1, 0], [0.38, 0.75, 0.38]);
    part(g, G.sph, toon(0xbfe6ff), [-0.18, 0.75, 0.28], [0.1, 0.16, 0.06]); // brillo
    eyes(g, { y: 0.55, z: 0.42, spread: 0.17, size: 0.13, wild });
    part(g, G.sph, toon(0xff8fb0), [0, 0.35, 0.47], [0.07, 0.04, 0.03]); // boquita
    if (s >= 2) {
      const coral = toon(0xff7f9d);
      for (const [x, h] of [[-0.12, 0.25], [0.12, 0.3], [0, 0.38]]) part(g, G.cone, coral, [x, 1.45, 0], [0.06, h, 0.06]);
    }
    if (s >= 3) {
      for (const x of [-1, 1]) part(g, G.cone, water, [x * 0.5, 0.35, -0.2], [0.18, 0.5, 0.1], [0, 0, x * 1.9]);
      g.userData.bubbles = [0, 1, 2].map((i) => part(g, G.sphLo, glow(0xcfefff, 0.7), [0, 0.8, 0], 0.08));
    }
  },
  musgoro(g, s, wild) {
    const moss = toon(s === 3 ? 0x3f9a3c : 0x58b84a);
    const soil = toon(0x7a5232);
    part(g, G.box, moss, [0, 0.55, 0], [0.95, 0.75, 0.85]);
    part(g, G.box, toon(0x4aa23f), [0, 0.95, 0], [1.0, 0.12, 0.9]);
    for (const [x, z] of [[-0.32, 0.28], [0.32, 0.28], [-0.32, -0.28], [0.32, -0.28]]) part(g, G.cyl6, soil, [x, 0.12, z], [0.13, 0.25, 0.13]);
    eyes(g, { y: 0.6, z: 0.44, spread: 0.2, size: 0.13, wild });
    if (s < 3) {
      // flor
      part(g, G.cyl, toon(0x3d8a33), [0, 1.15, 0], [0.03, 0.3, 0.03]);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        part(g, G.sph, toon(0xff9ad0), [Math.cos(a) * 0.15, 1.33, Math.sin(a) * 0.15], [0.11, 0.05, 0.11]);
      }
      part(g, G.sph, toon(0xffe066), [0, 1.35, 0], 0.08);
    } else {
      // arbolito
      part(g, G.cyl6, soil, [0, 1.25, 0], [0.08, 0.5, 0.08]);
      part(g, G.ico, toon(0x2f8a3a), [0, 1.65, 0], [0.42, 0.38, 0.42]);
      part(g, G.ico, toon(0x45a848), [0.15, 1.85, 0.05], [0.25, 0.22, 0.25]);
    }
    if (s >= 2) for (const x of [-1, 1]) part(g, G.cone4, toon(0x6cd65a), [x * 0.58, 0.7, 0], [0.16, 0.45, 0.06], [0, 0, x * 1.2]);
  },
  medusin(g, s, wild) {
    const bell = toon(0xa477ff, { transparent: true, opacity: 0.88, emissive: 0x3a1a70 });
    const body = part(g, G.half, bell, [0, 1.0, 0], [0.55, 0.55, 0.55]);
    part(g, G.cyl, toon(0x8a5ff0), [0, 1.0, 0], [0.56, 0.05, 0.56]);
    eyes(g, { y: 1.18, z: 0.44, spread: 0.17, size: 0.12, wild });
    const n = s === 1 ? 4 : s === 2 ? 6 : 8;
    const tents = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const t = new THREE.Group();
      t.position.set(Math.cos(a) * 0.32, 0.98, Math.sin(a) * 0.32);
      part(t, G.cyl, toon(0xc9a8ff), [0, -0.28, 0], [0.035, 0.56, 0.035]);
      part(t, G.sphLo, glow(0xfff35a), [0, -0.6, 0], 0.06);
      g.add(t); tents.push(t);
    }
    g.userData.tents = tents;
    g.userData.float = 0.25;
    if (s >= 2) {
      const ring = part(g, G.torus, glow(0xfff35a), [0, 1.0, 0], [0.75, 0.75, 0.5], [Math.PI / 2, 0, 0]);
      ring.castShadow = false; g.userData.ring = ring;
    }
    if (s >= 3) for (let i = 0; i < 3; i++) part(g, G.oct, glow(0xfff35a), [(i - 1) * 0.2, 1.62, 0], [0.06, 0.14, 0.06]);
    body.castShadow = true;
  },
  cristalo(g, s, wild) {
    const ice = toon(0x9be8ff, { emissive: 0x1b4a66 });
    part(g, G.oct, ice, [0, 1.0, 0], [0.48, 0.7, 0.48]);
    part(g, G.oct, toon(0xdaf6ff), [0, 1.0, 0.1], [0.3, 0.45, 0.3]);
    eyes(g, { y: 1.02, z: 0.38, spread: 0, size: 0.17, wild, single: true });
    g.userData.float = 0.3;
    const shards = [];
    const n = s === 1 ? 2 : s === 2 ? 3 : 5;
    for (let i = 0; i < n; i++) shards.push(part(g, G.oct, ice, [0, 1, 0], [0.1, 0.2, 0.1]));
    g.userData.shards = shards;
    if (s >= 3) part(g, G.cone4, toon(0xe8fbff), [0, 1.82, 0], [0.18, 0.4, 0.18]);
  },
  bolarro(g, s, wild) {
    const shell = toon(s === 3 ? 0x8a6a45 : 0xa77c4d);
    const band = toon(0x6e4f30);
    const segs = s === 1 ? 3 : s === 2 ? 4 : 5;
    for (let i = 0; i < segs; i++) {
      const z = 0.35 - i * (0.75 / segs) * 1.2;
      const r = 0.48 - Math.abs(i - (segs - 1) / 2) * 0.06;
      part(g, G.half, i % 2 ? band : shell, [0, 0.12, z], [r, r * 1.05, 0.32]);
    }
    part(g, G.sph, toon(0xd8b07a), [0, 0.3, 0.42], [0.3, 0.25, 0.2]); // cara
    eyes(g, { y: 0.35, z: 0.55, spread: 0.12, size: 0.09, wild });
    for (const x of [-1, 1]) {
      part(g, G.cyl, band, [x * 0.12, 0.6, 0.5], [0.02, 0.3, 0.02], [0.5, 0, x * 0.4]);
      for (let i = 0; i < 3; i++) part(g, G.cyl, band, [x * 0.42, 0.06, 0.2 - i * 0.25], [0.03, 0.15, 0.03], [0, 0, x * 0.9]);
    }
    if (s >= 3) for (let i = 0; i < 3; i++) part(g, G.cone4, toon(0xd7d1c4), [0, 0.6, 0.15 - i * 0.3], [0.1, 0.25, 0.1]);
  },
};

export const STAGE_SCALE = [0, 0.85, 1.15, 1.45];

/** Construye un modelo animable. */
export function buildCreature(species, stage = 1, wild = false) {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  BUILD[species](inner, stage, wild);
  if (wild) {
    const aura = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), glow(0x4a2a5e, 0.35));
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.03;
    g.add(aura);
  }
  g.scale.setScalar(STAGE_SCALE[stage]);
  g.userData.inner = inner;
  g.userData.ud = inner.userData;
  return g;
}

/** Animación idle/andar de un modelo construido con buildCreature. */
export function animateCreature(g, t, moving = false, seed = 0) {
  const inner = g.userData.inner;
  const ud = inner.userData;
  const tt = t + seed;
  const fl = ud.float || 0;
  inner.position.y = fl + (fl ? Math.sin(tt * 2.2) * 0.12 : Math.abs(Math.sin(tt * (moving ? 9 : 3))) * (moving ? 0.14 : 0.04));
  inner.rotation.z = moving && !fl ? Math.sin(tt * 9) * 0.08 : 0;
  if (ud.flame) {
    ud.flame[0].scale.y = 0.7 + Math.sin(tt * 14) * 0.08;
    ud.flame[1].scale.y = 0.45 + Math.sin(tt * 18 + 1) * 0.06;
  }
  if (ud.tents) ud.tents.forEach((p, i) => { p.rotation.x = Math.sin(tt * 3 + i) * 0.25; p.rotation.z = Math.cos(tt * 2.6 + i) * 0.2; });
  if (ud.ring) ud.ring.rotation.z = tt * 2;
  if (ud.shards) ud.shards.forEach((p, i) => {
    const a = tt * 1.8 + (i / ud.shards.length) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.75, 1.0 + Math.sin(a * 2) * 0.12, Math.sin(a) * 0.75);
    p.rotation.y = a;
  });
  if (ud.bubbles) ud.bubbles.forEach((p, i) => {
    const k = (tt * 0.6 + i / 3) % 1;
    p.position.set(Math.sin(i * 2 + tt) * 0.45, 0.6 + k * 1.3, Math.cos(i * 2) * 0.3);
    p.scale.setScalar(0.05 + k * 0.06);
  });
}

/* ------------------------------------------------------------- entrenador */
export function buildTrainer() {
  const g = new THREE.Group();
  const skin = toon(0xffd7b5);
  const jacket = toon(0x2f7f8f);
  const pants = toon(0x34364a);
  const beanie = toon(0xf2a33a);
  const body = new THREE.Group();
  g.add(body);
  const legs = [];
  for (const x of [-0.17, 0.17]) {
    const leg = new THREE.Group();
    leg.position.set(x, 0.55, 0);
    part(leg, G.cyl, pants, [0, -0.25, 0], [0.12, 0.5, 0.12]);
    part(leg, G.box, toon(0xeeeeee), [0, -0.52, 0.06], [0.22, 0.12, 0.32]);
    body.add(leg); legs.push(leg);
  }
  part(body, G.cyl, jacket, [0, 0.85, 0], [0.32, 0.6, 0.26]);
  part(body, G.box, toon(0xf6f1e3), [0, 0.9, 0.24], [0.18, 0.4, 0.04]);
  part(body, G.box, toon(0x8a5a3a), [0, 0.9, -0.32], [0.42, 0.5, 0.22]); // mochila
  const arms = [];
  for (const x of [-0.4, 0.4]) {
    const arm = new THREE.Group();
    arm.position.set(x, 1.08, 0);
    part(arm, G.cyl, jacket, [0, -0.22, 0], [0.09, 0.45, 0.09]);
    part(arm, G.sph, skin, [0, -0.48, 0], 0.1);
    body.add(arm); arms.push(arm);
  }
  // cabeza grande chibi
  part(body, G.sph, skin, [0, 1.62, 0], [0.48, 0.46, 0.44]);
  part(body, G.sph, toon(0x3b2a20), [0, 1.72, -0.06], [0.5, 0.42, 0.46]); // pelo
  part(body, G.sph, beanie, [0, 1.86, -0.02], [0.5, 0.36, 0.48]);
  part(body, G.cyl, toon(0xd9861f), [0, 1.66, -0.02], [0.5, 0.08, 0.48]);
  part(body, G.sph, toon(0xffffff), [0, 2.2, -0.05], 0.1); // pompón
  // gafas de aventura sobre el gorro
  for (const x of [-0.16, 0.16]) part(body, G.cyl, toon(0x9be8ff, { emissive: 0x234455 }), [x, 1.84, 0.4], [0.11, 0.06, 0.11], [Math.PI / 2, 0, 0]);
  eyes(body, { y: 1.55, z: 0.4, spread: 0.16, size: 0.1 });
  part(body, G.sph, toon(0xff9f9f), [-0.28, 1.45, 0.34], [0.07, 0.04, 0.03]);
  part(body, G.sph, toon(0xff9f9f), [0.28, 1.45, 0.34], [0.07, 0.04, 0.03]);
  g.userData = { body, legs, arms };
  return g;
}
export function animateTrainer(g, t, speed) {
  const { body, legs, arms } = g.userData;
  const k = Math.min(1, speed / 5);
  const s = Math.sin(t * 12) * 0.7 * k;
  legs[0].rotation.x = s; legs[1].rotation.x = -s;
  arms[0].rotation.x = -s; arms[1].rotation.x = s;
  body.position.y = Math.abs(Math.sin(t * 12)) * 0.08 * k + Math.sin(t * 2) * 0.015;
}
