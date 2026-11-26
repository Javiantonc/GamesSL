// Modelos 3D procedurales: héroes por clase, NPCs, monstruos y espectros.
// Todo se construye con formas simples (sin imágenes ni modelos externos).
import * as THREE from 'three';
import { G, toon, glow, part, eyes, bake, GRADIENT } from '../gfx.js';

/* =========================================================== humanoides */
export const LOOKS = {
  tanque: { skin: 0xf2c9a0, hair: 0x5a3a22, top: 0x9aa4b0, trim: 0xd9b44a, bottom: 0x4a4f5a, boots: 0x3a3028, hat: 'helm', plume: 0xd23b3b, weapon: 'sword', off: 'shield', cape: 0xb5302e, pads: true },
  asesino: { skin: 0xe8c09a, hair: 0x22202a, top: 0x3a2f4a, trim: 0x8a4ad9, bottom: 0x24202c, boots: 0x1a1820, hat: 'hood', weapon: 'dagger', off: 'dagger', cape: 0x2a2238, mask: true },
  mago: { skin: 0xffd7b5, hair: 0xd9d9e8, top: 0x3b4fb0, trim: 0xffd84a, bottom: 0x2e3d8a, boots: 0x2a2440, hat: 'wizard', weapon: 'staff', off: 'none', robe: true, orb: 0x7ad7ff },
  support: { skin: 0xffe0c2, hair: 0xf2d27a, top: 0xf4f1e6, trim: 0xe0b23a, bottom: 0xe8e2cf, boots: 0x8a6a3a, hat: 'circlet', weapon: 'mace', off: 'book', robe: true, halo: true },
};

export function buildHumanoid(look) {
  const L = { skin: 0xffd7b5, hair: 0x5a3a22, top: 0x777777, trim: 0xaaaaaa, bottom: 0x444444, boots: 0x332822, ...look };
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const legs = [], arms = [];
  for (const x of [-0.2, 0.2]) {
    const leg = new THREE.Group(); leg.position.set(x, 0.9, 0);
    part(leg, G.cyl, toon(L.bottom), [0, -0.4, 0], [0.14, 0.8, 0.14]);
    part(leg, G.box, toon(L.boots), [0, -0.82, 0.07], [0.26, 0.2, 0.38]);
    body.add(leg); legs.push(leg);
  }
  // torso
  part(body, G.cyl, toon(L.top), [0, 1.35, 0], [0.38, 0.95, 0.28]);
  part(body, G.cyl, toon(L.trim), [0, 0.95, 0], [0.4, 0.12, 0.3]);                 // cinturón
  if (L.robe) part(body, G.cone, toon(L.bottom), [0, 0.68, 0], [0.55, 1.1, 0.48], [Math.PI, 0, 0]);
  part(body, G.box, toon(L.trim), [0, 1.45, 0.27], [0.12, 0.7, 0.04]);
  if (L.cape) {
    const cape = part(body, G.box, toon(L.cape), [0, 1.1, -0.32], [0.7, 1.4, 0.05], [0.12, 0, 0]);
    root.userData.cape = cape;
  }
  if (L.pads) for (const x of [-0.45, 0.45]) part(body, G.sph, toon(L.top), [x, 1.78, 0], [0.24, 0.17, 0.24]);
  for (const x of [-0.5, 0.5]) {
    const arm = new THREE.Group(); arm.position.set(x, 1.72, 0);
    part(arm, G.cyl, toon(L.top), [0, -0.32, 0], [0.11, 0.66, 0.11]);
    part(arm, G.sph, toon(L.skin), [0, -0.7, 0], 0.12);
    body.add(arm); arms.push(arm);
  }
  // cabeza
  const head = new THREE.Group(); head.position.set(0, 2.2, 0); body.add(head);
  part(head, G.sph, toon(L.skin), [0, 0.1, 0], [0.42, 0.44, 0.4]);
  part(head, G.sph, toon(L.hair), [0, 0.22, -0.06], [0.45, 0.4, 0.42]);
  eyes(head, { y: 0.08, z: 0.36, spread: 0.14, size: 0.085 });
  if (L.beard) part(head, G.cone, toon(L.beard), [0, -0.25, 0.25], [0.25, 0.5, 0.15], [Math.PI, 0, 0]);
  if (L.mask) part(head, G.box, toon(0x2a2238), [0, -0.08, 0.3], [0.5, 0.2, 0.2]);
  if (L.hat === 'helm') {
    part(head, G.sph, toon(0xa8b2be), [0, 0.22, 0], [0.47, 0.42, 0.45]);
    part(head, G.box, toon(0x7a8490), [0, 0.12, 0.38], [0.1, 0.4, 0.06]);
    part(head, G.cone, toon(L.plume), [0, 0.65, -0.05], [0.1, 0.55, 0.3]);
  } else if (L.hat === 'hood') {
    part(head, G.sph, toon(L.cape), [0, 0.2, -0.05], [0.5, 0.48, 0.47]);
    part(head, G.cone, toon(L.cape), [0, 0.35, -0.38], [0.2, 0.45, 0.2], [-1.2, 0, 0]);
  } else if (L.hat === 'wizard') {
    part(head, G.cyl, toon(L.top), [0, 0.42, 0], [0.62, 0.06, 0.62]);
    const h = part(head, G.cone, toon(L.top), [0, 0.95, -0.05], [0.38, 1.05, 0.38], [-0.15, 0, 0]);
    part(head, G.cyl, toon(L.trim), [0, 0.5, 0], [0.4, 0.1, 0.4]);
    root.userData.hat = h;
  } else if (L.hat === 'circlet') {
    part(head, G.torus, toon(L.trim), [0, 0.32, 0], [0.4, 0.4, 0.5], [Math.PI / 2, 0, 0]);
    part(head, G.oct, glow(0x7ad7ff), [0, 0.32, 0.4], 0.07);
  } else if (L.hat === 'cap') {
    part(head, G.sph, toon(L.capColor || 0x8a3a2a), [0, 0.33, 0], [0.46, 0.25, 0.44]);
    part(head, G.box, toon(L.capColor || 0x8a3a2a), [0, 0.28, 0.38], [0.4, 0.05, 0.25]);
  } else if (L.hat === 'bun') {
    part(head, G.sph, toon(L.hair), [0, 0.55, -0.15], 0.17);
  }
  if (L.halo) {
    const h = part(head, G.torus, glow(0xffe98a), [0, 0.85, 0], [0.32, 0.32, 0.4], [Math.PI / 2, 0, 0]);
    h.castShadow = false; root.userData.halo = h;
  }
  // armas
  const hand = new THREE.Group(); hand.position.set(0, -0.72, 0.05); arms[1].add(hand);
  const offh = new THREE.Group(); offh.position.set(0, -0.72, 0.05); arms[0].add(offh);
  weapon(hand, L.weapon, L);
  if (L.off === 'shield') {
    part(offh, G.cyl, toon(0x2f5aa8), [-0.12, 0, 0.15], [0.48, 0.08, 0.55], [0, 0, Math.PI / 2]);
    part(offh, G.cyl, toon(L.trim), [-0.17, 0, 0.15], [0.2, 0.04, 0.22], [0, 0, Math.PI / 2]);
  } else if (L.off === 'dagger') weapon(offh, 'dagger', L);
  else if (L.off === 'book') {
    part(offh, G.box, toon(0x7a3a2a), [0, 0, 0.12], [0.3, 0.38, 0.1]);
    part(offh, G.box, toon(0xf4efe0), [0, 0, 0.12], [0.26, 0.34, 0.12]);
  }
  root.userData.rig = { body, legs, arms, head, hand };
  root.userData.anim = { swing: 0, cast: 0 };
  return root;
}

function weapon(hand, kind, L) {
  if (kind === 'sword') {
    part(hand, G.box, toon(0xdfe6ee), [0, 0, 0.55], [0.09, 0.05, 1.0]);
    part(hand, G.box, toon(L.trim), [0, 0, 0.05], [0.42, 0.08, 0.08]);
    part(hand, G.cyl, toon(0x5a3a22), [0, 0, -0.12], [0.05, 0.28, 0.05], [Math.PI / 2, 0, 0]);
  } else if (kind === 'dagger') {
    part(hand, G.cone4, toon(0xcfd6e0), [0, 0, 0.35], [0.08, 0.55, 0.04], [Math.PI / 2, 0, 0]);
    part(hand, G.box, toon(L.trim), [0, 0, 0.06], [0.22, 0.05, 0.05]);
  } else if (kind === 'staff') {
    part(hand, G.cyl, toon(0x6e4a2e), [0, 0.35, 0], [0.05, 1.9, 0.05]);
    const orb = part(hand, G.sph, glow(L.orb || 0x7ad7ff), [0, 1.35, 0], 0.17);
    orb.castShadow = false;
    part(hand, G.torus, toon(L.trim), [0, 1.35, 0], [0.2, 0.2, 0.3]);
  } else if (kind === 'mace') {
    part(hand, G.cyl, toon(0x8a6a3a), [0, 0, 0.3], [0.05, 0.7, 0.05], [Math.PI / 2, 0, 0]);
    part(hand, G.ico, toon(L.trim, { flatShading: true }), [0, 0, 0.68], 0.17);
  } else if (kind === 'axe') {
    part(hand, G.cyl, toon(0x6e4a2e), [0, 0, 0.3], [0.05, 0.9, 0.05], [Math.PI / 2, 0, 0]);
    part(hand, G.box, toon(0xb8c0c8), [0, 0.15, 0.7], [0.05, 0.35, 0.25]);
  } else if (kind === 'hammer') {
    part(hand, G.cyl, toon(0x6e4a2e), [0, 0, 0.3], [0.05, 0.7, 0.05], [Math.PI / 2, 0, 0]);
    part(hand, G.box, toon(0x6a6e74), [0, 0, 0.66], [0.3, 0.2, 0.2]);
  }
}

/** Animación del humanoide. speed = m/s, air = en el aire. */
export function animateHumanoid(m, t, speed, dt, air = false) {
  const { body, legs, arms, head, hand } = m.userData.rig;
  const A = m.userData.anim;
  const k = Math.min(1, speed / 6);
  const ph = t * (6 + speed * 1.2);
  const s = Math.sin(ph) * 0.8 * k;
  legs[0].rotation.x = air ? -0.5 : s; legs[1].rotation.x = air ? 0.3 : -s;
  arms[0].rotation.x = -s * 0.8; arms[1].rotation.x = s * 0.8;
  arms[0].rotation.z = 0.08; arms[1].rotation.z = -0.08;
  body.position.y = Math.abs(Math.sin(ph)) * 0.09 * k + Math.sin(t * 2) * 0.02;
  head.rotation.y = 0;
  if (A.swing > 0) {
    A.swing = Math.max(0, A.swing - dt * 3.2);
    const p = 1 - A.swing;
    arms[1].rotation.x = -2.4 + p * 3.2;
    arms[1].rotation.z = -0.4;
  }
  if (A.cast > 0) {
    A.cast = Math.max(0, A.cast - dt);
    arms[0].rotation.x = arms[1].rotation.x = -1.4 + Math.sin(t * 12) * 0.1;
  }
  if (A.channel) { arms[0].rotation.x = arms[1].rotation.x = -1.2 + Math.sin(t * 10) * 0.08; }
  if (m.userData.cape) m.userData.cape.rotation.x = 0.12 + k * 0.45 + Math.sin(t * 5) * 0.03;
  if (m.userData.halo) m.userData.halo.rotation.z = t;
}

/* ================================================================ NPCs */
export const NPC_LOOKS = {
  capitana: { skin: 0xd9a77e, hair: 0x2a1a10, top: 0x4a6a9a, trim: 0xd9b44a, bottom: 0x3a3f4a, hat: 'none', weapon: 'sword', off: 'shield', cape: 0x2f4a7a, pads: true },
  mercader: { skin: 0xffd7b5, hair: 0x8a5a3a, top: 0x9a5a2a, trim: 0xe8c35a, bottom: 0x5a3a2a, hat: 'cap', capColor: 0x2f6a4a, weapon: 'none', off: 'none', beard: 0x8a5a3a },
  herrera: { skin: 0xc98e66, hair: 0xb5482a, top: 0x5a4a3a, trim: 0x2a2420, bottom: 0x3a3028, hat: 'bun', weapon: 'hammer', off: 'none' },
  portalista: { skin: 0xe8c8a8, hair: 0xeeeeee, top: 0x6a3a9a, trim: 0x7ad7ff, bottom: 0x4a2a6a, hat: 'wizard', weapon: 'staff', off: 'none', robe: true, orb: 0xc58bff, beard: 0xeeeeee },
  guardabosques: { skin: 0xf0c8a0, hair: 0x3a5a2a, top: 0x3f6a3a, trim: 0x8a6a3a, bottom: 0x3a3a2a, hat: 'hood', cape: 0x2f5a2a, weapon: 'dagger', off: 'none' },
  explorador: { skin: 0xb57a52, hair: 0x1a1410, top: 0xc98a4a, trim: 0x6a3a1a, bottom: 0x5a4a3a, hat: 'cap', capColor: 0xa8662a, weapon: 'axe', off: 'none' },
  vigia: { skin: 0xf4dcc8, hair: 0xdde8f0, top: 0x6a90b0, trim: 0xffffff, bottom: 0x4a6080, hat: 'hood', cape: 0x9ab8d0, weapon: 'staff', off: 'none', orb: 0xaee8ff },
  posadera: { skin: 0xffd7b5, hair: 0xd27a3a, top: 0xb53a4a, trim: 0xf4efe0, bottom: 0x6a2a3a, hat: 'bun', weapon: 'none', off: 'none', robe: true },
};

/* ============================================================ monstruos */
// Cada constructor recibe la paleta p = { a, b, c, eye } y devuelve un grupo.
const MOB_BUILD = {
  wolf(g, p) {
    part(g, G.sph, toon(p.a), [0, 0.75, 0], [0.42, 0.4, 0.75]);
    part(g, G.sph, toon(p.b), [0, 0.68, 0.25], [0.36, 0.32, 0.4]);
    part(g, G.sph, toon(p.a), [0, 1.0, 0.75], [0.3, 0.28, 0.32]);
    part(g, G.box, toon(p.b), [0, 0.9, 1.05], [0.2, 0.16, 0.3]);
    part(g, G.sph, toon(0x1a1a1a), [0, 0.95, 1.2], 0.05);
    for (const x of [-0.16, 0.16]) part(g, G.cone4, toon(p.a), [x, 1.3, 0.68], [0.1, 0.25, 0.08]);
    eyes(g, { y: 1.05, z: 1.0, spread: 0.12, size: 0.06, wild: true, color: p.eye });
    for (const [x, z] of [[-0.22, 0.4], [0.22, 0.4], [-0.22, -0.45], [0.22, -0.45]]) part(g, G.cyl, toon(p.b), [x, 0.3, z], [0.08, 0.6, 0.08]);
    part(g, G.cone, toon(p.a), [0, 0.9, -0.85], [0.12, 0.6, 0.12], [-1.1, 0, 0]);
  },
  boar(g, p) {
    part(g, G.sph, toon(p.a), [0, 0.7, 0], [0.55, 0.5, 0.75]);
    part(g, G.sph, toon(p.b), [0, 0.95, -0.1], [0.4, 0.25, 0.6]);
    part(g, G.sph, toon(p.a), [0, 0.75, 0.68], [0.36, 0.34, 0.32]);
    part(g, G.cyl, toon(0xd99a8a), [0, 0.68, 0.98], [0.15, 0.1, 0.15], [Math.PI / 2, 0, 0]);
    for (const x of [-1, 1]) part(g, G.cone, toon(0xf4efe0), [x * 0.2, 0.6, 0.95], [0.05, 0.25, 0.05], [-0.6, 0, x * 0.4]);
    eyes(g, { y: 0.9, z: 0.88, spread: 0.14, size: 0.055, wild: true, color: p.eye });
    for (const [x, z] of [[-0.28, 0.35], [0.28, 0.35], [-0.28, -0.4], [0.28, -0.4]]) part(g, G.cyl, toon(p.b), [x, 0.22, z], [0.1, 0.45, 0.1]);
  },
  slime(g, p) {
    part(g, G.half, toon(p.a, { transparent: true, opacity: 0.85 }), [0, 0, 0], [0.75, 0.8, 0.75]);
    part(g, G.sph, toon(p.b), [0, 0.3, 0], [0.25, 0.22, 0.25]);
    eyes(g, { y: 0.45, z: 0.6, spread: 0.2, size: 0.11, wild: true, color: p.eye });
  },
  spider(g, p) {
    part(g, G.sph, toon(p.a), [0, 0.75, -0.45], [0.55, 0.48, 0.65]);
    part(g, G.sph, toon(p.b), [0, 0.65, 0.25], [0.32, 0.28, 0.34]);
    for (let i = 0; i < 4; i++) part(g, G.sph, toon(p.c || 0xd23b3b), [-0.12 + (i % 2) * 0.24, 0.78 + (i > 1 ? 0.1 : 0), 0.55], 0.05);
    for (const x of [-1, 1]) for (let i = 0; i < 4; i++) {
      const z = 0.35 - i * 0.22;
      part(g, G.cyl, toon(p.b), [x * 0.55, 0.6, z], [0.04, 0.8, 0.04], [0, 0, x * 1.0]);
      part(g, G.cyl, toon(p.b), [x * 0.95, 0.28, z], [0.035, 0.6, 0.035], [0, 0, -x * 0.35]);
    }
    for (const x of [-0.08, 0.08]) part(g, G.cone, toon(0xe8e0d0), [x, 0.45, 0.55], [0.03, 0.18, 0.03], [Math.PI, 0, 0]);
  },
  skeleton(g, p) {
    const bone = toon(p.a), dark = toon(p.b);
    for (const x of [-0.16, 0.16]) part(g, G.cyl, bone, [x, 0.45, 0], [0.06, 0.9, 0.06]);
    part(g, G.cyl, dark, [0, 0.95, 0], [0.26, 0.15, 0.2]);
    for (let i = 0; i < 4; i++) part(g, G.torus, bone, [0, 1.15 + i * 0.13, 0], [0.24, 0.2, 0.4], [Math.PI / 2, 0, 0]);
    part(g, G.cyl, bone, [0, 1.35, 0], [0.05, 0.6, 0.05]);
    for (const x of [-1, 1]) part(g, G.cyl, bone, [x * 0.36, 1.3, 0.1], [0.05, 0.75, 0.05], [0.4, 0, x * 0.2]);
    part(g, G.sph, bone, [0, 1.92, 0], [0.3, 0.3, 0.3]);
    part(g, G.box, bone, [0, 1.75, 0.12], [0.24, 0.12, 0.18]);
    for (const x of [-0.11, 0.11]) part(g, G.sph, glow(p.eye || 0xff4a3a), [x, 1.95, 0.25], 0.06);
    part(g, G.box, toon(0xb8c0c8), [0.45, 1.0, 0.45], [0.06, 0.06, 0.9], [0.3, 0, 0]);
    if (p.c) part(g, G.cone, toon(p.c), [0, 2.25, 0], [0.32, 0.4, 0.32]);
  },
  bandit(g, p) {
    for (const x of [-0.17, 0.17]) part(g, G.cyl, toon(p.b), [x, 0.42, 0], [0.12, 0.84, 0.12]);
    part(g, G.cyl, toon(p.a), [0, 1.25, 0], [0.34, 0.85, 0.26]);
    for (const x of [-0.44, 0.44]) part(g, G.cyl, toon(p.a), [x, 1.3, 0.05], [0.1, 0.65, 0.1], [0.3, 0, 0]);
    part(g, G.sph, toon(0xe0b088), [0, 1.95, 0], [0.36, 0.38, 0.34]);
    part(g, G.sph, toon(p.c), [0, 2.02, -0.04], [0.42, 0.42, 0.4]);
    part(g, G.box, toon(p.c), [0, 1.86, 0.28], [0.42, 0.18, 0.12]);
    eyes(g, { y: 2.0, z: 0.3, spread: 0.12, size: 0.07, wild: true, color: p.eye });
    part(g, G.cone4, toon(0xcfd6e0), [0.48, 0.95, 0.4], [0.07, 0.5, 0.04], [Math.PI / 2, 0, 0]);
  },
  golem(g, p) {
    const r = toon(p.a, { flatShading: true }), r2 = toon(p.b, { flatShading: true });
    part(g, G.dode, r, [0, 1.4, 0], [0.85, 0.8, 0.65]);
    part(g, G.dode, r2, [0, 2.25, 0.1], [0.45, 0.4, 0.4]);
    for (const x of [-1, 1]) {
      part(g, G.dode, r2, [x * 0.95, 1.55, 0], [0.35, 0.35, 0.35]);
      part(g, G.dode, r, [x * 1.05, 0.9, 0.1], [0.32, 0.5, 0.32]);
      part(g, G.dode, r2, [x * 0.4, 0.4, 0], [0.3, 0.45, 0.3]);
    }
    for (const x of [-0.14, 0.14]) part(g, G.sph, glow(p.eye || 0xffa030), [x, 2.3, 0.45], 0.07);
    part(g, G.oct, glow(p.c || 0xffa030), [0, 1.45, 0.6], 0.15);
  },
  scorpion(g, p) {
    for (let i = 0; i < 4; i++) part(g, G.sph, toon(p.a), [0, 0.45, 0.35 - i * 0.32], [0.38 - i * 0.04, 0.22, 0.2]);
    for (let i = 0; i < 5; i++) {
      const a = (i / 4) * 2.4;
      part(g, G.sph, toon(p.b), [0, 0.5 + Math.sin(a) * 0.9, -0.85 - Math.sin(a * 0.5) * 0.4 + (i > 2 ? (i - 2) * 0.3 : 0)], 0.16 - i * 0.015);
    }
    part(g, G.cone, toon(0x2a1a10), [0, 1.35, -0.2], [0.07, 0.3, 0.07], [2.2, 0, 0]);
    for (const x of [-1, 1]) {
      part(g, G.cyl, toon(p.b), [x * 0.35, 0.45, 0.65], [0.06, 0.5, 0.06], [1.3, 0, x * 0.3]);
      part(g, G.sph, toon(p.a), [x * 0.42, 0.45, 0.95], [0.16, 0.1, 0.22]);
      for (let i = 0; i < 3; i++) part(g, G.cyl, toon(p.b), [x * 0.45, 0.25, 0.25 - i * 0.3], [0.03, 0.5, 0.03], [0, 0, x * 1.0]);
    }
    eyes(g, { y: 0.6, z: 0.52, spread: 0.1, size: 0.05, wild: true, color: p.eye });
  },
  bear(g, p) {
    part(g, G.sph, toon(p.a), [0, 1.1, 0], [0.8, 0.75, 1.05]);
    part(g, G.sph, toon(p.a), [0, 1.35, 0.95], [0.48, 0.45, 0.45]);
    part(g, G.sph, toon(p.b), [0, 1.22, 1.32], [0.22, 0.18, 0.2]);
    part(g, G.sph, toon(0x1a1a1a), [0, 1.28, 1.5], 0.07);
    for (const x of [-0.3, 0.3]) part(g, G.sph, toon(p.a), [x, 1.78, 0.85], 0.13);
    eyes(g, { y: 1.45, z: 1.3, spread: 0.18, size: 0.06, wild: true, color: p.eye });
    for (const [x, z] of [[-0.42, 0.55], [0.42, 0.55], [-0.42, -0.55], [0.42, -0.55]]) part(g, G.cyl, toon(p.a), [x, 0.4, z], [0.2, 0.8, 0.2]);
  },
  // ---- espectros (jefes de mazmorra y su séquito)
  spec_warrior(g, p) {
    const d = toon(p.a), e = glow(p.eye);
    part(g, G.cone, d, [0, 0.9, 0], [0.55, 1.8, 0.45], [Math.PI, 0, 0]);
    part(g, G.cyl, d, [0, 1.75, 0], [0.42, 0.8, 0.3]);
    for (const x of [-0.5, 0.5]) part(g, G.cone4, toon(p.b), [x, 2.15, 0], [0.22, 0.4, 0.22]);
    part(g, G.sph, d, [0, 2.45, 0], [0.32, 0.36, 0.32]);
    part(g, G.cone4, toon(p.b), [0, 2.85, 0], [0.12, 0.4, 0.12]);
    for (const x of [-0.11, 0.11]) part(g, G.sph, e, [x, 2.48, 0.27], [0.07, 0.04, 0.03]);
    part(g, G.box, e, [0.6, 1.6, 0.6], [0.1, 0.08, 1.6], [0.5, 0, 0]);
    part(g, G.cyl, toon(p.b), [-0.55, 1.5, 0.3], [0.45, 0.08, 0.55], [0, 0, Math.PI / 2]);
  },
  spec_wolf(g, p) {
    MOB_BUILD.wolf(g, { a: p.a, b: p.b, eye: p.eye });
    for (let i = 0; i < 4; i++) part(g, G.cone4, toon(p.b), [0, 1.2, 0.5 - i * 0.3], [0.08, 0.35, 0.08]);
    for (const x of [-0.12, 0.12]) part(g, G.sph, glow(p.eye), [x, 1.06, 1.06], 0.06);
  },
  spec_caster(g, p) {
    const d = toon(p.a);
    part(g, G.cone, d, [0, 1.0, 0], [0.6, 2.0, 0.6], [Math.PI, 0, 0]);
    part(g, G.cone, d, [0, 2.3, -0.05], [0.42, 0.9, 0.42]);
    part(g, G.sph, toon(0x050508), [0, 2.05, 0.18], [0.24, 0.26, 0.15]);
    for (const x of [-0.08, 0.08]) part(g, G.sph, glow(p.eye), [x, 2.08, 0.32], 0.05);
    part(g, G.cyl, toon(p.b), [0.55, 1.4, 0.2], [0.04, 2.2, 0.04]);
    part(g, G.oct, glow(p.eye), [0.55, 2.6, 0.2], 0.22);
    for (const x of [-1, 1]) part(g, G.cone, d, [x * 0.5, 1.5, 0.2], [0.14, 0.7, 0.14], [1.2, 0, 0]);
  },
  spec_wisp(g, p) {
    part(g, G.sph, glow(p.eye, 0.55), [0, 1.4, 0], 0.9);
    part(g, G.sph, glow(0xffffff, 0.85), [0, 1.4, 0], 0.45);
    part(g, G.cone, glow(p.eye, 0.5), [0, 2.4, -0.2], [0.55, 1.3, 0.55], [-0.3, 0, 0]);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; part(g, G.sph, glow(p.eye, 0.7), [Math.cos(a) * 1.2, 1.2, Math.sin(a) * 1.2], 0.18); }
    for (const x of [-0.16, 0.16]) part(g, G.sph, toon(0x111118), [x, 1.5, 0.82], [0.1, 0.14, 0.05]);
  },
  spec_griffin(g, p) {
    const d = toon(p.a), b = toon(p.b);
    part(g, G.sph, d, [0, 1.3, 0], [0.6, 0.55, 0.95]);
    part(g, G.sph, b, [0, 1.85, 0.85], [0.35, 0.35, 0.38]);
    part(g, G.cone, toon(0xd9b44a), [0, 1.8, 1.25], [0.12, 0.35, 0.12], [Math.PI / 2, 0, 0]);
    for (const x of [-0.13, 0.13]) part(g, G.sph, glow(p.eye), [x, 1.95, 1.12], 0.06);
    for (const x of [-1, 1]) part(g, G.box, b, [x * 1.3, 1.7, -0.1], [2.2, 0.08, 0.9], [0, 0, x * 0.35]);
    for (const [x, z] of [[-0.3, 0.5], [0.3, 0.5], [-0.3, -0.5], [0.3, -0.5]]) part(g, G.cyl, b, [x, 0.5, z], [0.08, 0.9, 0.08]);
    part(g, G.cone, d, [0, 1.3, -1.2], [0.2, 0.9, 0.2], [-1.3, 0, 0]);
  },
};

const BASE_MAT = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: GRADIENT });
const specMats = new Map();
export function spectreMaterial(hex) {
  if (!specMats.has(hex)) specMats.set(hex, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: GRADIENT, emissive: hex, emissiveIntensity: 0.28, transparent: true, opacity: 0.9 }));
  return specMats.get(hex);
}
export const FLASH_MAT = new THREE.MeshBasicMaterial({ color: 0xffffff });

/** Malla "horneada" de un monstruo (1 draw call). */
export function mobMesh(builder, pal, key, tint) {
  const geo = bake(key, (() => { const g = new THREE.Group(); MOB_BUILD[builder](g, pal); return g; })());
  const mesh = new THREE.Mesh(geo, tint ? spectreMaterial(tint) : BASE_MAT);
  mesh.castShadow = true;
  return mesh;
}
export { BASE_MAT };
