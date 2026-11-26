// Utilidades gráficas: material toon, geometrías compartidas y "horneado"
// de modelos (fusiona un grupo de piezas en una sola malla con colores por
// vértice, para que 200 enemigos sean 200 draw calls y no 2000).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const grad = new Uint8Array([70, 150, 220, 255]);
export const GRADIENT = new THREE.DataTexture(grad, 4, 1, THREE.RedFormat);
GRADIENT.minFilter = GRADIENT.magFilter = THREE.NearestFilter;
GRADIENT.needsUpdate = true;

const mats = new Map();
export function toon(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!mats.has(key)) {
    mats.set(key, new THREE.MeshToonMaterial({ color, gradientMap: GRADIENT, ...opts }));
  }
  return mats.get(key);
}
export function glow(color, opacity = 1) {
  const key = 'g' + color + opacity;
  if (!mats.has(key)) {
    mats.set(key, new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 }));
  }
  return mats.get(key);
}

export const G = {
  sph: new THREE.SphereGeometry(1, 14, 10),
  sphLo: new THREE.SphereGeometry(1, 8, 6),
  half: new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  cone: new THREE.ConeGeometry(1, 1, 8),
  cone4: new THREE.ConeGeometry(1, 1, 4),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 10),
  cyl6: new THREE.CylinderGeometry(1, 1, 1, 6),
  box: new THREE.BoxGeometry(1, 1, 1),
  oct: new THREE.OctahedronGeometry(1, 0),
  ico: new THREE.IcosahedronGeometry(1, 0),
  dode: new THREE.DodecahedronGeometry(1, 0),
  torus: new THREE.TorusGeometry(1, 0.18, 6, 18),
};

/** Crea una pieza y la añade al padre. */
export function part(parent, geo, mat, pos = [0, 0, 0], scl = [1, 1, 1], rot = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  if (typeof scl === 'number') m.scale.setScalar(scl); else m.scale.set(...scl);
  m.rotation.set(...rot);
  m.castShadow = true;
  parent.add(m);
  return m;
}

/** Ojos estilo chibi mirando hacia +Z. wild = pupila roja y ceño. */
export function eyes(parent, { y, z, spread, size = 0.16, wild = false, single = false }) {
  const white = toon(0xffffff);
  const pupil = toon(wild ? 0xd0202a : 0x1a1a24);
  const xs = single ? [0] : [-spread, spread];
  for (const x of xs) {
    part(parent, G.sph, white, [x, y, z], [size, size * 1.15, size * 0.6]);
    part(parent, G.sph, pupil, [x, y - size * 0.1, z + size * 0.42], [size * 0.55, size * 0.7, size * 0.3]);
    part(parent, G.sph, white, [x + size * 0.2, y + size * 0.25, z + size * 0.55], size * 0.18);
    if (wild) {
      const s = Math.sign(x) || 1;
      part(parent, G.box, toon(0x2a1630), [x, y + size * 1.25, z + 0.02], [size * 1.6, size * 0.28, size * 0.3], [0, 0, s * 0.45]);
    }
  }
}

const bakeCache = new Map();
/** Fusiona un grupo en una geometría con color por vértice. */
export function bake(key, group) {
  if (bakeCache.has(key)) return bakeCache.get(key);
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const geos = [];
  group.traverse((o) => {
    if (!o.isMesh) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    const c = o.material.color || new THREE.Color(1, 1, 1);
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    geos.push(g);
  });
  const merged = mergeGeometries(geos, false);
  merged.computeBoundingSphere();
  bakeCache.set(key, merged);
  return merged;
}
export const BAKED_MAT = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: GRADIENT });
