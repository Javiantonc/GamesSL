// Terreno de Mini Realms: una isla de 600 x 600 m dividida en zonas por nivel.
//   Pradera de Albor (centro, Nv 1-10) · Bosque Sombrío (norte, Nv 10-20)
//   Cañón Rojo (este, Nv 20-30)       · Bosque Invernal (sur, Nv 76+, bloqueado)
//   Lago Espejo (oeste)
import * as THREE from 'three';
import { GRADIENT } from '../gfx.js';

export const HALF = 300;
export const LIMIT = 272;          // borde caminable (más allá, montañas)
export const WATER_Y = -1.4;
export const WINTER_Z = 150;       // línea del muro de hielo
export const LAKE = { x: -175, z: 20, r: 62 };

export const ZONES = {
  pradera: { name: 'Pradera de Albor', lvl: '1-10', color: '#7ccf5a' },
  bosque: { name: 'Bosque Sombrío', lvl: '10-20', color: '#2f7a45' },
  canon: { name: 'Cañón Rojo', lvl: '20-30', color: '#d0773f' },
  invierno: { name: 'Bosque Invernal', lvl: '76-80', color: '#e8f4ff' },
};

/* ---------------------------------------------------------- ruido */
function hash(x, z) {
  let h = (x * 374761393 + z * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, z, oct = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += vnoise(x * f, z * f) * a; f *= 2.03; a *= 0.5; }
  return s;
}
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function zoneAt(x, z) {
  if (z > WINTER_Z) return 'invierno';
  if (z < -115) return 'bosque';
  if (x > 115) return 'canon';
  return 'pradera';
}

/** Altura del terreno (función pura: la usan malla, colisiones y spawns). */
export function heightAt(x, z) {
  let h = (fbm(x * 0.011 + 31, z * 0.011 + 7) - 0.5) * 14;
  const zone = zoneAt(x, z);
  if (zone === 'bosque') h += 2 + (fbm(x * 0.03, z * 0.03) - 0.5) * 6;
  if (zone === 'canon') {
    const m = fbm(x * 0.02 + 90, z * 0.02 - 40, 3);
    h = m > 0.58 ? 9 + Math.round((m - 0.58) * 40) * 1.5 : h * 0.4;   // mesetas escalonadas
  }
  if (zone === 'invierno') h += 3 + (fbm(x * 0.025, z * 0.025) - 0.5) * 8;
  // lago
  const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
  h = h * smooth(LAKE.r * 0.55, LAKE.r, dl) + -5 * (1 - smooth(LAKE.r * 0.55, LAKE.r, dl));
  // pueblo y campamentos llanos
  for (const [cx, cz, r] of FLAT) {
    const d = Math.hypot(x - cx, z - cz);
    const k = smooth(r, r + 18, d);
    h = h * k + 0.6 * (1 - k);
  }
  // caminos
  const road = roadDist(x, z);
  if (road < 6) h = h * (0.55 + 0.45 * smooth(2, 6, road)) + 0.3 * (1 - smooth(2, 6, road));
  // montañas del borde
  const r = Math.max(Math.abs(x), Math.abs(z));
  if (r > LIMIT - 8) h += (r - (LIMIT - 8)) * 1.6 + fbm(x * 0.05, z * 0.05) * 10 * smooth(LIMIT - 8, LIMIT + 10, r);
  return h;
}
export const FLAT = [[0, 0, 42], [10, -160, 18], [175, 30, 18], [0, 205, 20]];
/** Distancia aproximada a los caminos que salen del pueblo. */
export function roadDist(x, z) {
  const n = Math.abs(x - Math.sin(z * 0.02) * 10);             // norte-sur
  const e = Math.abs(z - Math.sin(x * 0.025) * 8);             // este-oeste
  const north = z < 0 && z > -175 ? n : 1e9;
  const south = z > 0 && z < WINTER_Z + 60 ? n : 1e9;
  const east = x > 0 && x < 190 ? e : 1e9;
  return Math.min(north, south, east);
}

/** ¿Se puede caminar por (x,z)? (agua profunda y bordes) */
export function walkable(x, z) {
  if (Math.abs(x) > LIMIT || Math.abs(z) > LIMIT) return false;
  return heightAt(x, z) > WATER_Y - 0.25;
}

/* ------------------------------------------------------------ malla */
export function buildTerrain(scene) {
  const SEG = 260;
  const geo = new THREE.PlaneGeometry(HALF * 2, HALF * 2, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const C = {
    grass: new THREE.Color(0x78c855), grass2: new THREE.Color(0x9bd65f),
    forest: new THREE.Color(0x3f8a45), forest2: new THREE.Color(0x2c6b3a),
    canon: new THREE.Color(0xd7874b), canon2: new THREE.Color(0xb35f34), canonTop: new THREE.Color(0xc9a25a),
    snow: new THREE.Color(0xf0f7ff), snow2: new THREE.Color(0xcfe2f5),
    sand: new THREE.Color(0xe3d29a), road: new THREE.Color(0xc9ad78), rock: new THREE.Color(0x8b857e),
  };
  const c = new THREE.Color(), t2 = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = heightAt(x, z);
    pos.setY(i, h);
    const zone = zoneAt(x, z);
    const n = fbm(x * 0.08, z * 0.08, 2);
    if (zone === 'pradera') c.copy(C.grass).lerp(C.grass2, n);
    else if (zone === 'bosque') c.copy(C.forest).lerp(C.forest2, n);
    else if (zone === 'canon') c.copy(h > 8 ? C.canonTop : C.canon).lerp(C.canon2, n * 0.7);
    else c.copy(C.snow).lerp(C.snow2, n);
    // transiciones suaves entre zonas
    if (Math.abs(z + 115) < 10 && zone !== 'invierno') c.lerp(t2.copy(C.forest), (1 - Math.abs(z + 115) / 10) * 0.5);
    if (Math.abs(z - WINTER_Z) < 8) c.lerp(C.snow2, (1 - Math.abs(z - WINTER_Z) / 8) * 0.5);
    if (h < WATER_Y + 0.6) c.copy(C.sand);
    const rd = roadDist(x, z);
    if (rd < 3.2 && zone !== 'invierno') c.lerp(C.road, smooth(3.2, 1.5, rd));
    const r = Math.max(Math.abs(x), Math.abs(z));
    if (r > LIMIT - 4) c.lerp(zone === 'invierno' ? C.snow : C.rock, smooth(LIMIT - 4, LIMIT + 12, r));
    if (r > LIMIT + 14 && zone !== 'invierno' && h > 22) c.lerp(C.snow, 0.8);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: GRADIENT, flatShading: true }));
  mesh.receiveShadow = true;
  scene.add(mesh);

  // agua
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF * 2.4, HALF * 2.4),
    new THREE.MeshPhongMaterial({ color: 0x3fa3e0, transparent: true, opacity: 0.78, shininess: 90, specular: 0xbfe8ff }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER_Y;
  scene.add(water);
  return { mesh, water };
}

/** Imagen del mapa (para el minimapa) — 1 px = 600/size m. */
export function mapImage(size = 300) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const x = (i / size) * HALF * 2 - HALF, z = (j / size) * HALF * 2 - HALF;
    const h = heightAt(x, z);
    const zone = zoneAt(x, z);
    let col;
    if (h < WATER_Y) col = [63, 140, 210];
    else if (Math.max(Math.abs(x), Math.abs(z)) > LIMIT) col = [120, 112, 104];
    else if (roadDist(x, z) < 2.5 && zone !== 'invierno') col = [205, 180, 128];
    else col = { pradera: [118, 196, 86], bosque: [52, 120, 66], canon: h > 8 ? [196, 160, 92] : [210, 128, 70], invierno: [232, 242, 252] }[zone];
    const shade = 0.85 + Math.min(0.3, Math.max(-0.2, h * 0.012));
    const k = (j * size + i) * 4;
    img.data[k] = col[0] * shade; img.data[k + 1] = col[1] * shade; img.data[k + 2] = col[2] * shade; img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}
