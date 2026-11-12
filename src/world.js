// Mundo 2.5D: pradera low-poly con mesetas, árboles, rocas y flores.
import * as THREE from 'three';
import { toon, G, GRADIENT } from './gfx.js';

export const ARENA_R = 95;

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function noise2(x, y) {
  return Math.sin(x * 0.11 + Math.sin(y * 0.07) * 2) * 0.5 + Math.sin(y * 0.13 + x * 0.05) * 0.5;
}

/** Rejilla espacial de obstáculos circulares. */
export class Obstacles {
  constructor(cell = 8) { this.cell = cell; this.map = new Map(); this.list = []; }
  key(cx, cz) { return cx * 10007 + cz; }
  add(x, z, r) {
    const o = { x, z, r };
    this.list.push(o);
    const c = this.cell;
    for (let cx = Math.floor((x - r) / c); cx <= Math.floor((x + r) / c); cx++)
      for (let cz = Math.floor((z - r) / c); cz <= Math.floor((z + r) / c); cz++) {
        const k = this.key(cx, cz);
        if (!this.map.has(k)) this.map.set(k, []);
        this.map.get(k).push(o);
      }
  }
  /** Empuja una posición fuera de los obstáculos. Devuelve true si chocó. */
  resolve(p, rad) {
    const arr = this.map.get(this.key(Math.floor(p.x / this.cell), Math.floor(p.z / this.cell)));
    let hit = false;
    if (arr) for (const o of arr) {
      const dx = p.x - o.x, dz = p.z - o.z;
      const min = o.r + rad;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min) {
        const d = Math.sqrt(d2) || 0.001;
        p.x = o.x + (dx / d) * min;
        p.z = o.z + (dz / d) * min;
        hit = true;
      }
    }
    const r = Math.hypot(p.x, p.z);
    if (r > ARENA_R - rad) { p.x *= (ARENA_R - rad) / r; p.z *= (ARENA_R - rad) / r; hit = true; }
    return hit;
  }
  free(x, z, r) {
    for (const o of this.list) if ((x - o.x) ** 2 + (z - o.z) ** 2 < (o.r + r) ** 2) return false;
    return true;
  }
}

export function buildWorld(scene, seed = 1112) {
  const R = rng(seed);
  const obstacles = new Obstacles();

  // cielo y niebla
  scene.background = new THREE.Color(0x9fd6ff);
  scene.fog = new THREE.Fog(0x9fd6ff, 45, 95);

  // luces
  scene.add(new THREE.HemisphereLight(0xdff3ff, 0x5b7a3a, 1.1));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.0);
  sun.position.set(-14, 26, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -32; sc.right = 32; sc.top = 32; sc.bottom = -32; sc.near = 1; sc.far = 80;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  // suelo con colores por vértice
  const size = ARENA_R * 2 + 60;
  const geo = new THREE.PlaneGeometry(size, size, 110, 110);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const cA = new THREE.Color(0x7ccf5a), cB = new THREE.Color(0x5fb34a), cC = new THREE.Color(0xa6dc6a);
  const cPath = new THREE.Color(0xd9c38f), cOut = new THREE.Color(0x4f8f45);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const n = noise2(x, z);
    tmp.copy(cA).lerp(n > 0 ? cC : cB, Math.abs(n) * 0.8);
    // caminos en cruz y anillo
    const ring = Math.abs(Math.hypot(x, z) - 40);
    const path = Math.min(Math.abs(x + Math.sin(z * 0.08) * 4), Math.abs(z + Math.sin(x * 0.07) * 4), ring);
    if (path < 2.4) tmp.lerp(cPath, Math.min(1, (2.4 - path) / 1.2));
    const r = Math.hypot(x, z);
    if (r > ARENA_R) { tmp.lerp(cOut, Math.min(1, (r - ARENA_R) / 6)); pos.setY(i, Math.min(4, (r - ARENA_R) * 0.35) + R() * 0.3); }
    else pos.setY(i, n * 0.12);
    cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: GRADIENT, flatShading: true }));
  ground.receiveShadow = true;
  scene.add(ground);

  const dummy = new THREE.Object3D();
  const placeInstanced = (geometry, material, items, cast = true) => {
    const im = new THREE.InstancedMesh(geometry, material, items.length);
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.y || 0, it.z);
      dummy.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
      if (typeof it.s === 'number') dummy.scale.setScalar(it.s); else dummy.scale.set(...it.s);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
      if (it.c) im.setColorAt(i, new THREE.Color(it.c));
    });
    im.castShadow = cast; im.receiveShadow = true;
    scene.add(im);
    return im;
  };
  const randPos = (minR, maxR, clear) => {
    for (let k = 0; k < 40; k++) {
      const a = R() * Math.PI * 2, r = minR + R() * (maxR - minR);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const path = Math.min(Math.abs(x + Math.sin(z * 0.08) * 4), Math.abs(z + Math.sin(x * 0.07) * 4), Math.abs(Math.hypot(x, z) - 40));
      if (path < 4) continue;
      if (obstacles.free(x, z, clear)) return { x, z };
    }
    return null;
  };

  // mesetas (formaciones de roca con la cima de hierba)
  const mesas = [], mesaTops = [];
  for (let i = 0; i < 16; i++) {
    const p = randPos(14, ARENA_R - 8, 7); if (!p) continue;
    const r = 2.6 + R() * 3.2, h = 3 + R() * 5;
    mesas.push({ x: p.x, z: p.z, y: h / 2, s: [r, h, r], ry: R() * 3, c: R() > 0.5 ? 0xc98a5a : 0xb8794f });
    mesaTops.push({ x: p.x, z: p.z, y: h + 0.15, s: [r * 1.04, 0.3, r * 1.04], ry: R() * 3 });
    obstacles.add(p.x, p.z, r * 0.95);
  }
  placeInstanced(G.cyl6, toon(0xffffff, { flatShading: true }), mesas);
  placeInstanced(G.cyl6, toon(0x6cc24f, { flatShading: true }), mesaTops);

  // árboles: tronco + dos conos o copa redonda
  const trunks = [], cones = [], blobs = [];
  for (let i = 0; i < 170; i++) {
    const p = randPos(6, ARENA_R + 6, 1.6); if (!p) continue;
    const s = 0.7 + R() * 0.55;
    trunks.push({ x: p.x, z: p.z, y: 0.7 * s, s: [0.22 * s, 1.4 * s, 0.22 * s] });
    if (R() > 0.45) {
      cones.push({ x: p.x, z: p.z, y: 2.2 * s, s: [1.25 * s, 2.0 * s, 1.25 * s], ry: R() * 3, c: R() > 0.5 ? 0x2f8f4a : 0x3aa155 });
      cones.push({ x: p.x, z: p.z, y: 3.2 * s, s: [0.9 * s, 1.5 * s, 0.9 * s], ry: R() * 3, c: 0x48b35f });
    } else {
      blobs.push({ x: p.x, z: p.z, y: 2.1 * s, s: 1.15 * s, ry: R() * 3, c: R() > 0.5 ? 0x5bbf48 : 0x4aa83e });
    }
    if (Math.hypot(p.x, p.z) < ARENA_R) obstacles.add(p.x, p.z, 0.45 * s);
  }
  placeInstanced(G.cyl6, toon(0x7a5232, { flatShading: true }), trunks);
  placeInstanced(G.cone, toon(0xffffff, { flatShading: true }), cones);
  placeInstanced(G.ico, toon(0xffffff, { flatShading: true }), blobs);

  // rocas
  const rocks = [];
  for (let i = 0; i < 70; i++) {
    const p = randPos(5, ARENA_R + 4, 1.2); if (!p) continue;
    const s = 0.4 + R() * 0.9;
    rocks.push({ x: p.x, z: p.z, y: s * 0.4, s: [s, s * 0.75, s], ry: R() * 3, c: R() > 0.5 ? 0x9a9a9f : 0x85858c });
    if (s > 0.7) obstacles.add(p.x, p.z, s * 0.85);
  }
  placeInstanced(G.dode, toon(0xffffff, { flatShading: true }), rocks);

  // anillo de rocas en el borde
  const edge = [];
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2, r = ARENA_R + 1.5 + R() * 2;
    const s = 1.4 + R() * 1.6;
    edge.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: s * 0.5, s: [s, s * 1.2, s], ry: R() * 3, c: R() > 0.5 ? 0x8e8a86 : 0x7b7874 });
  }
  placeInstanced(G.dode, toon(0xffffff, { flatShading: true }), edge);

  // flores y matas de hierba (sin sombra, decorativo)
  const flowers = [], tufts = [];
  const fc = [0xff7aa8, 0xfff06a, 0xffffff, 0xb08cff, 0xff9a4a];
  for (let i = 0; i < 900; i++) {
    const a = R() * Math.PI * 2, r = Math.sqrt(R()) * ARENA_R;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (R() > 0.55) flowers.push({ x, z, y: 0.12, s: 0.11 + R() * 0.06, c: fc[(R() * fc.length) | 0] });
    else tufts.push({ x, z, y: 0.18, s: [0.12, 0.4 + R() * 0.3, 0.12], ry: R() * 3, rz: (R() - 0.5) * 0.4, c: R() > 0.5 ? 0x4f9e3a : 0x6cbf4a });
  }
  placeInstanced(G.sphLo, toon(0xffffff), flowers, false);
  placeInstanced(G.cone4, toon(0xffffff), tufts, false);

  // altar central (punto de inicio)
  const altar = new THREE.Group();
  const m1 = new THREE.Mesh(G.cyl6, toon(0xd8d2c4, { flatShading: true })); m1.scale.set(3.2, 0.3, 3.2); m1.position.y = 0.15;
  const m2 = new THREE.Mesh(G.cyl6, toon(0xbdb5a4, { flatShading: true })); m2.scale.set(2.4, 0.25, 2.4); m2.position.y = 0.42;
  [m1, m2].forEach((m) => { m.receiveShadow = true; altar.add(m); });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pil = new THREE.Mesh(G.cyl6, toon(0xcfc8b8, { flatShading: true }));
    pil.scale.set(0.3, 1.6, 0.3);
    pil.position.set(Math.cos(a) * 3.6, 0.8, Math.sin(a) * 3.6);
    pil.castShadow = true;
    altar.add(pil);
    const gem = new THREE.Mesh(G.oct, new THREE.MeshBasicMaterial({ color: 0x8fe6ff }));
    gem.scale.setScalar(0.22); gem.position.set(Math.cos(a) * 3.6, 1.9, Math.sin(a) * 3.6);
    altar.add(gem);
  }
  scene.add(altar);

  return { sun, obstacles, altar };
}
