// Decorado del mundo: árboles por zona, rocas, pueblo de Albor, campamentos
// y el muro de hielo del Bosque Invernal. También la rejilla de colisiones.
import * as THREE from 'three';
import { G, toon, glow, part } from '../gfx.js';
import { heightAt, zoneAt, roadDist, LIMIT, WINTER_Z, LAKE, WATER_Y, FLAT } from './terrain.js';

/* ------------------------------------------------------ colisiones */
export class Colliders {
  constructor(cell = 10) { this.cell = cell; this.map = new Map(); }
  key(cx, cz) { return cx * 100003 + cz; }
  add(x, z, r, tag) {
    const o = { x, z, r, tag };
    const c = this.cell;
    for (let cx = Math.floor((x - r) / c); cx <= Math.floor((x + r) / c); cx++)
      for (let cz = Math.floor((z - r) / c); cz <= Math.floor((z + r) / c); cz++) {
        const k = this.key(cx, cz);
        if (!this.map.has(k)) this.map.set(k, []);
        this.map.get(k).push(o);
      }
    return o;
  }
  remove(tag) { for (const arr of this.map.values()) for (let i = arr.length - 1; i >= 0; i--) if (arr[i].tag === tag) arr.splice(i, 1); }
  near(x, z) { return this.map.get(this.key(Math.floor(x / this.cell), Math.floor(z / this.cell))) || []; }
  push(p, rad) {
    for (const o of this.near(p.x, p.z)) {
      const dx = p.x - o.x, dz = p.z - o.z, min = o.r + rad, d2 = dx * dx + dz * dz;
      if (d2 < min * min) { const d = Math.sqrt(d2) || 0.01; p.x = o.x + (dx / d) * min; p.z = o.z + (dz / d) * min; }
    }
  }
  free(x, z, r) { return !this.near(x, z).some((o) => (x - o.x) ** 2 + (z - o.z) ** 2 < (o.r + r) ** 2); }
}

function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const dummy = new THREE.Object3D();
function instanced(scene, geo, mat, items, cast = true) {
  if (!items.length) return null;
  const im = new THREE.InstancedMesh(geo, mat, items.length);
  items.forEach((it, i) => {
    dummy.position.set(it.x, it.y, it.z);
    dummy.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
    if (typeof it.s === 'number') dummy.scale.setScalar(it.s); else dummy.scale.set(...it.s);
    dummy.updateMatrix();
    im.setMatrixAt(i, dummy.matrix);
    if (it.c !== undefined) im.setColorAt(i, new THREE.Color(it.c));
  });
  im.castShadow = cast; im.receiveShadow = true;
  scene.add(im);
  return im;
}

/* ------------------------------------------------------------ casas */
export const VILLAGE = { x: 0, z: 0 };
const HOUSES = [
  // x, z, ancho, fondo, rotación, color pared, color tejado
  [-22, -16, 9, 7, 0.1, 0xf1e3c6, 0xb5483a],
  [20, -18, 8, 7, -0.15, 0xe9d8b5, 0x3a6db5],
  [-26, 14, 10, 7, 1.5, 0xf4ead2, 0x8a5a3a],
  [24, 16, 9, 8, -1.4, 0xe8dcc0, 0xb5483a],
  [-6, -30, 12, 8, 0, 0xd9c7a2, 0x6b4a8a],     // posada
  [6, 30, 8, 6, 3.1, 0xf1e3c6, 0x3e8a4a],
];
function house(scene, col, [x, z, w, d, rot, wall, roof]) {
  const g = new THREE.Group();
  const y = heightAt(x, z);
  g.position.set(x, y, z);
  g.rotation.y = rot;
  part(g, G.box, toon(0x8a7a66), [0, 0.3, 0], [w + 0.6, 0.6, d + 0.6]);                      // zócalo de piedra
  part(g, G.box, toon(wall), [0, 2.2, 0], [w, 3.6, d]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(g, G.box, toon(0x6e4a2e), [sx * w / 2, 2.2, sz * d / 2], [0.4, 3.7, 0.4]); // vigas
  part(g, G.box, toon(0x6e4a2e), [0, 4.0, 0], [w + 0.3, 0.3, d + 0.3]);
  const r = part(g, G.cone4, toon(roof, { flatShading: true }), [0, 5.6, 0], [w * 0.78, 3.2, d * 0.78], [0, Math.PI / 4, 0]);
  r.scale.set(Math.max(w, d) * 0.8, 3.2, Math.max(w, d) * 0.8);
  part(g, G.box, toon(0x7a8088), [w * 0.25, 6.2, d * 0.1], [0.8, 2.2, 0.8]);                  // chimenea
  part(g, G.box, toon(0x5a3a22), [0, 1.3, d / 2 + 0.02], [1.4, 2.4, 0.15]);                   // puerta
  for (const sx of [-1, 1]) {
    part(g, G.box, toon(0x9fd8ff, { emissive: 0x334455 }), [sx * w * 0.3, 2.6, d / 2 + 0.02], [1.1, 1, 0.1]);
    part(g, G.box, toon(0x6e4a2e), [sx * w * 0.3, 2.6, d / 2 + 0.06], [1.3, 0.12, 0.08]);
  }
  scene.add(g);
  // colisión: varios círculos a lo largo del lado mayor
  const n = Math.ceil(Math.max(w, d) / Math.min(w, d)) + 1;
  for (let i = 0; i < n; i++) {
    const k = n === 1 ? 0 : i / (n - 1) - 0.5;
    const lx = w >= d ? k * (w - d) : 0, lz = w < d ? k * (d - w) : 0;
    const cx = x + lx * Math.cos(rot) + lz * Math.sin(rot), cz = z - lx * Math.sin(rot) + lz * Math.cos(rot);
    col.add(cx, cz, Math.min(w, d) / 2 + 0.6, 'house');
  }
}

function stall(scene, col, x, z, rot, cloth) {
  const g = new THREE.Group();
  g.position.set(x, heightAt(x, z), z); g.rotation.y = rot;
  part(g, G.box, toon(0x8a5a3a), [0, 0.6, 0], [3, 1.2, 1.4]);
  for (const sx of [-1.4, 1.4]) part(g, G.cyl, toon(0x6e4a2e), [sx, 1.4, -0.6], [0.08, 2.8, 0.08]);
  part(g, G.box, toon(cloth), [0, 2.85, 0], [3.4, 0.15, 2.2], [0.25, 0, 0]);
  for (let i = 0; i < 4; i++) part(g, G.sph, toon([0xff6b4a, 0xffd84a, 0x7dd35a, 0xffa04a][i]), [-1 + i * 0.65, 1.35, 0.2], 0.22);
  scene.add(g);
  col.add(x, z, 1.7);
}

function well(scene, col, x, z) {
  const g = new THREE.Group(); g.position.set(x, heightAt(x, z), z);
  part(g, G.cyl, toon(0x9a948c, { flatShading: true }), [0, 0.6, 0], [1.4, 1.2, 1.4]);
  part(g, G.cyl, glow(0x3f8fd0), [0, 1.15, 0], [1.15, 0.05, 1.15]);
  for (const sx of [-1.2, 1.2]) part(g, G.cyl, toon(0x6e4a2e), [sx, 1.9, 0], [0.1, 2.6, 0.1]);
  part(g, G.cone4, toon(0x9a4a3a), [0, 3.5, 0], [2.0, 1.2, 1.6], [0, Math.PI / 4, 0]);
  scene.add(g); col.add(x, z, 1.6);
}

export function campfire(scene, x, z) {
  const g = new THREE.Group(); g.position.set(x, heightAt(x, z), z);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; part(g, G.dode, toon(0x8a857e), [Math.cos(a) * 0.8, 0.15, Math.sin(a) * 0.8], 0.25); }
  for (let i = 0; i < 3; i++) part(g, G.cyl, toon(0x6e4a2e), [0, 0.2, 0], [0.09, 1.3, 0.09], [Math.PI / 2, (i / 3) * Math.PI, 0]);
  const f1 = part(g, G.cone, glow(0xff7a1a), [0, 0.65, 0], [0.45, 1.0, 0.45]);
  const f2 = part(g, G.cone, glow(0xffd84a), [0, 0.55, 0], [0.25, 0.65, 0.25]);
  f1.castShadow = f2.castShadow = false;
  const light = new THREE.PointLight(0xff9a3a, 6, 14, 1.6);
  light.position.y = 1.2; g.add(light);
  g.userData.flames = [f1, f2]; g.userData.light = light;
  scene.add(g);
  return g;
}

function tent(scene, col, x, z, rot, color) {
  const g = new THREE.Group(); g.position.set(x, heightAt(x, z), z); g.rotation.y = rot;
  part(g, G.cone4, toon(color, { flatShading: true }), [0, 1.3, 0], [2.4, 2.6, 2.4], [0, Math.PI / 4, 0]);
  part(g, G.box, toon(0x3a2a1a), [0, 0.7, 1.2], [0.9, 1.3, 0.1]);
  scene.add(g); col.add(x, z, 1.8);
}

/* ------------------------------------------------------ mundo entero */
export function buildProps(scene) {
  const R = rng(4242);
  const col = new Colliders();
  const fires = [];

  // pueblo de Albor
  HOUSES.forEach((h) => house(scene, col, h));
  well(scene, col, 0, 0);
  stall(scene, col, 11, 5, -0.4, 0xd94a4a);
  stall(scene, col, -11, 5, 0.4, 0x3a7ad9);
  stall(scene, col, 13, -6, -1.2, 0xe8b33a);
  fires.push(campfire(scene, -4, 12));
  // valla del pueblo
  const posts = [], rails = [];
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2, r = 40;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (roadDist(x, z) < 5) continue;
    posts.push({ x, y: heightAt(x, z) + 0.6, z, s: [0.18, 1.2, 0.18] });
    const a2 = ((i + 0.5) / 56) * Math.PI * 2;
    const x2 = Math.cos(a2) * r, z2 = Math.sin(a2) * r;
    if (roadDist(x2, z2) < 5) continue;
    rails.push({ x: x2, y: heightAt(x2, z2) + 0.85, z: z2, s: [0.1, 0.12, 4.6], ry: -a2 });
    rails.push({ x: x2, y: heightAt(x2, z2) + 0.45, z: z2, s: [0.1, 0.12, 4.6], ry: -a2 });
  }
  instanced(scene, G.cyl6, toon(0x7a5232), posts);
  instanced(scene, G.box, toon(0x8a6a42), rails);

  // campamentos
  tent(scene, col, 4, -166, 0.3, 0x5a7a3a); tent(scene, col, 16, -158, -0.6, 0x3a5a2a);
  fires.push(campfire(scene, 10, -160));
  tent(scene, col, 170, 22, 1.2, 0xc9783a); tent(scene, col, 182, 36, 2.2, 0xa85a2a);
  fires.push(campfire(scene, 175, 30));
  tent(scene, col, -6, 200, 0, 0x8ab0d0); tent(scene, col, 8, 210, 1, 0x6a90b0);
  fires.push(campfire(scene, 0, 205));

  // árboles y rocas por zona
  const T = { trunk: [], round: [], cone: [], cone2: [], snowCap: [], cactus: [], rocks: [], bush: [], flowers: [] };
  const okSpot = (x, z, clear) => {
    if (Math.max(Math.abs(x), Math.abs(z)) > LIMIT + 10) return false;
    if (heightAt(x, z) < WATER_Y + 0.5) return false;
    if (roadDist(x, z) < 6) return false;
    for (const [fx, fz, fr] of FLAT) if (Math.hypot(x - fx, z - fz) < fr + 4) return false;
    if (Math.abs(z - WINTER_Z) < 5) return false;
    return col.free(x, z, clear);
  };
  for (let i = 0; i < 4200; i++) {
    const x = (R() * 2 - 1) * (LIMIT + 8), z = (R() * 2 - 1) * (LIMIT + 8);
    const zone = zoneAt(x, z);
    const dens = { pradera: 0.16, bosque: 0.62, canon: 0.12, invierno: 0.4 }[zone];
    if (R() > dens) continue;
    if (!okSpot(x, z, 1.8)) continue;
    const y = heightAt(x, z), s = 0.8 + R() * 0.7;
    if (zone === 'canon') {
      if (R() < 0.5) {
        T.cactus.push({ x, y: y + 1.2 * s, z, s: [0.35 * s, 2.4 * s, 0.35 * s], c: 0x5f9a4a });
        T.cactus.push({ x: x + 0.45 * s, y: y + 1.6 * s, z, s: [0.2 * s, 0.9 * s, 0.2 * s], c: 0x5f9a4a });
        col.add(x, z, 0.45 * s);
      } else {
        T.rocks.push({ x, y: y + 0.6 * s, z, s: [1.6 * s, 1.3 * s, 1.5 * s], ry: R() * 6, c: R() > 0.5 ? 0xb8683a : 0xa05530 });
        col.add(x, z, 1.4 * s);
      }
      continue;
    }
    T.trunk.push({ x, y: y + 1.0 * s, z, s: [0.28 * s, 2.0 * s, 0.28 * s], c: zone === 'invierno' ? 0x5a4a3e : 0x6e4a2e });
    col.add(x, z, 0.55 * s);
    if (zone === 'pradera') {
      T.round.push({ x, y: y + 3.0 * s, z, s: 1.7 * s, ry: R() * 6, c: [0x5bbf48, 0x4aa83e, 0x6ccd52][(R() * 3) | 0] });
    } else if (zone === 'bosque') {
      const c = R() > 0.5 ? 0x235a35 : 0x2d6b3e;
      T.cone.push({ x, y: y + 3.4 * s, z, s: [1.9 * s, 3.4 * s, 1.9 * s], ry: R() * 6, c });
      T.cone.push({ x, y: y + 5.0 * s, z, s: [1.3 * s, 2.6 * s, 1.3 * s], ry: R() * 6, c: 0x377a48 });
    } else {
      T.cone2.push({ x, y: y + 3.3 * s, z, s: [1.8 * s, 3.2 * s, 1.8 * s], ry: R() * 6, c: 0x2f5a4a });
      T.snowCap.push({ x, y: y + 4.7 * s, z, s: [1.1 * s, 1.6 * s, 1.1 * s], ry: R() * 6, c: 0xf4faff });
    }
  }
  for (let i = 0; i < 700; i++) {
    const x = (R() * 2 - 1) * LIMIT, z = (R() * 2 - 1) * LIMIT;
    const zone = zoneAt(x, z);
    if (!okSpot(x, z, 1)) continue;
    const y = heightAt(x, z);
    if (R() < 0.45) {
      const s = 0.5 + R() * 1.1;
      T.rocks.push({ x, y: y + 0.3 * s, z, s: [s, s * 0.75, s], ry: R() * 6, c: zone === 'invierno' ? 0xa9b8c8 : zone === 'canon' ? 0xb8683a : 0x8f8a84 });
      if (s > 0.8) col.add(x, z, s * 0.8);
    } else if (zone !== 'canon') {
      T.bush.push({ x, y: y + 0.4, z, s: [0.9 + R() * 0.5, 0.7, 0.9 + R() * 0.5], ry: R() * 6, c: zone === 'invierno' ? 0xdde9f2 : zone === 'bosque' ? 0x2f6b3a : 0x4f9e3a });
    }
  }
  // flores (sin colisión)
  for (let i = 0; i < 2500; i++) {
    const x = (R() * 2 - 1) * LIMIT, z = (R() * 2 - 1) * LIMIT;
    if (zoneAt(x, z) !== 'pradera' || heightAt(x, z) < WATER_Y + 0.4) continue;
    T.flowers.push({ x, y: heightAt(x, z) + 0.12, z, s: 0.13 + R() * 0.07, c: [0xff7aa8, 0xfff06a, 0xffffff, 0xb08cff, 0xff9a4a][(R() * 5) | 0] });
  }
  const W = 0xffffff;
  instanced(scene, G.cyl6, toon(W, { flatShading: true }), T.trunk);
  instanced(scene, G.ico, toon(W, { flatShading: true }), T.round);
  instanced(scene, G.cone, toon(W, { flatShading: true }), T.cone);
  instanced(scene, G.cone, toon(W, { flatShading: true }), T.cone2);
  instanced(scene, G.cone, toon(W, { flatShading: true }), T.snowCap);
  instanced(scene, G.cyl6, toon(W, { flatShading: true }), T.cactus);
  instanced(scene, G.dode, toon(W, { flatShading: true }), T.rocks);
  instanced(scene, G.ico, toon(W, { flatShading: true }), T.bush, false);
  instanced(scene, G.sphLo, toon(W), T.flowers, false);

  // muro de hielo del Bosque Invernal
  const ice = new THREE.Group();
  const iceMat = toon(0xaee8ff, { transparent: true, opacity: 0.85, emissive: 0x1c4a6a, flatShading: true });
  for (let x = -LIMIT; x <= LIMIT; x += 3.2) {
    const h = 5 + Math.sin(x * 0.7) * 1.5 + Math.random() * 2;
    const m = part(ice, G.oct, iceMat, [x, heightAt(x, WINTER_Z) + h * 0.45, WINTER_Z], [1.8, h, 1.6], [0, Math.random(), 0]);
    m.receiveShadow = true;
  }
  scene.add(ice);
  for (let x = -LIMIT; x <= LIMIT; x += 3) col.add(x, WINTER_Z, 1.8, 'iceWall');

  // límites del mundo (montañas): colisión cuadrada aproximada
  return { col, fires, ice };
}

/** Animación de hogueras. */
export function animateFires(fires, t) {
  for (const f of fires) {
    const [a, b] = f.userData.flames;
    a.scale.y = 1.0 + Math.sin(t * 13) * 0.12; b.scale.y = 0.65 + Math.sin(t * 17 + 1) * 0.1;
    f.userData.light.intensity = 5.5 + Math.sin(t * 9) * 0.8;
  }
}
