// Mazmorras instanciadas. Cada una se construye (una sola vez) lejos del mapa
// principal, en x = 2000 + 500·nivel. Están formadas por salas conectadas por
// pasillos sobre una rejilla de celdas de 6 m.
import * as THREE from 'three';
import { G, toon, glow, part } from '../gfx.js';
import { DUNGEONS } from '../data/dungeons.js';

export const CELL = 6;
export const DUNGEON_ORIGIN = (tier) => ({ x: 2000 + tier * 500, z: 0 });

function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const lighten = (hex, k) => new THREE.Color(hex).lerp(new THREE.Color(0xffffff), k).getHex();
const darken = (hex, k) => new THREE.Color(hex).lerp(new THREE.Color(0x000000), k).getHex();

/** Genera la planta de la mazmorra: lista de salas y conjunto de celdas libres. */
function layout(tier) {
  const R = rng(9000 + tier * 77);
  const cells = new Set();
  const rooms = [];
  const nRooms = 5 + Math.min(3, Math.floor(tier / 3));
  let cx = 0, cz = 0, dir = 0;
  for (let i = 0; i <= nRooms; i++) {
    const boss = i === nRooms;
    const w = boss ? 7 : 3 + ((R() * 3) | 0), d = boss ? 7 : 3 + ((R() * 3) | 0);
    const room = { cx, cz, w, d, boss, start: i === 0 };
    rooms.push(room);
    for (let x = cx - (w >> 1); x <= cx + (w >> 1); x++) for (let z = cz - (d >> 1); z <= cz + (d >> 1); z++) cells.add(`${x},${z}`);
    // siguiente sala: avanza sobre todo hacia "delante" (−z) con giros
    const turn = R();
    dir = turn < 0.25 ? -1 : turn < 0.5 ? 1 : 0;
    const step = 9 + ((R() * 3) | 0);
    const nx = cx + dir * step, nz = cz - (dir === 0 ? step : ((R() * 5) | 0) - 2);
    // pasillo en L de 2 celdas de ancho
    const sx = Math.sign(nx - cx), sz = Math.sign(nz - cz);
    for (let x = cx; x !== nx; x += sx) { cells.add(`${x},${cz}`); cells.add(`${x},${cz + 1}`); }
    for (let z = cz; z !== nz + sz && sz !== 0; z += sz) { cells.add(`${nx},${z}`); cells.add(`${nx + 1},${z}`); }
    cx = nx; cz = nz;
  }
  return { cells, rooms };
}

export class DungeonInstance {
  constructor(scene, tier) {
    this.tier = tier;
    this.def = DUNGEONS[tier];
    this.origin = DUNGEON_ORIGIN(tier);
    const { cells, rooms } = layout(tier);
    this.cells = cells; this.rooms = rooms;
    this.group = new THREE.Group();
    this.group.position.set(this.origin.x, 0, this.origin.z);
    scene.add(this.group);
    this.build();
    this.group.visible = false;
  }
  wx(c) { return this.origin.x + c * CELL; }
  wz(c) { return this.origin.z + c * CELL; }
  /** Centro de una sala en coordenadas del mundo. */
  roomPos(r) { return { x: this.wx(r.cx), z: this.wz(r.cz) }; }
  isFree(x, z) {
    const cx = Math.round((x - this.origin.x) / CELL), cz = Math.round((z - this.origin.z) / CELL);
    return this.cells.has(`${cx},${cz}`);
  }
  /** Mantiene una posición dentro de las celdas libres (eje por eje). */
  clamp(p, prev) {
    if (this.isFree(p.x, p.z)) return;
    if (this.isFree(p.x, prev.z)) { p.z = prev.z; return; }
    if (this.isFree(prev.x, p.z)) { p.x = prev.x; return; }
    p.x = prev.x; p.z = prev.z;
  }

  build() {
    const hex = this.def.hex;
    const floorA = toon(darken(hex, 0.55), { flatShading: true });
    const floorB = toon(darken(hex, 0.68), { flatShading: true });
    const wallM = toon(darken(hex, 0.75), { flatShading: true });
    const trimM = toon(lighten(darken(hex, 0.2), 0.1), { flatShading: true });
    const tiles = [], walls = [], trims = [];
    for (const key of this.cells) {
      const [x, z] = key.split(',').map(Number);
      tiles.push({ x: x * CELL, z: z * CELL, alt: (x + z) & 1 });
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (this.cells.has(`${x + dx},${z + dz}`)) continue;
        walls.push({ x: x * CELL + dx * CELL * 0.5, z: z * CELL + dz * CELL * 0.5, rot: dx ? Math.PI / 2 : 0 });
      }
    }
    const dummy = new THREE.Object3D();
    const inst = (geo, mat, list, fn, cast = true) => {
      const im = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((it, i) => { fn(dummy, it); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
      im.castShadow = cast; im.receiveShadow = true;
      this.group.add(im);
    };
    inst(G.box, floorA, tiles.filter((t) => t.alt), (d, t) => { d.position.set(t.x, -0.25, t.z); d.scale.set(CELL, 0.5, CELL); d.rotation.set(0, 0, 0); }, false);
    inst(G.box, floorB, tiles.filter((t) => !t.alt), (d, t) => { d.position.set(t.x, -0.25, t.z); d.scale.set(CELL, 0.5, CELL); d.rotation.set(0, 0, 0); }, false);
    inst(G.box, wallM, walls, (d, w) => { d.position.set(w.x, 3, w.z); d.rotation.set(0, w.rot, 0); d.scale.set(CELL + 0.4, 6, 0.8); });
    inst(G.box, trimM, walls, (d, w) => { d.position.set(w.x, 6.1, w.z); d.rotation.set(0, w.rot, 0); d.scale.set(CELL + 0.6, 0.4, 1.1); });
    // decoración de salas: cristales del color de la mazmorra y antorchas
    const crystal = toon(lighten(hex, 0.25), { emissive: hex, emissiveIntensity: 0.6, flatShading: true });
    const R = rng(this.tier * 13 + 5);
    for (const r of this.rooms) {
      const { x, z } = { x: r.cx * CELL, z: r.cz * CELL };
      const hw = (r.w >> 1) * CELL, hd = (r.d >> 1) * CELL;
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const px = x + sx * (hw - 1), pz = z + sz * (hd - 1);
        part(this.group, G.oct, crystal, [px, 1.4, pz], [0.6, 1.6 + R(), 0.6], [0, R() * 3, 0]);
        part(this.group, G.oct, crystal, [px + 0.7 * sx * -1, 0.7, pz], [0.35, 0.8, 0.35], [0.3, R() * 3, 0.2]);
      }
      const torch = new THREE.PointLight(hex, 18, CELL * 4.5, 1.5);
      torch.position.set(x, 4.5, z);
      this.group.add(torch);
      if (r.boss) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(9, 10, 48), glow(hex, 0.5));
        ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.03, z);
        this.group.add(ring);
      }
    }
    // portal de salida en la entrada
    const s = this.rooms[0];
    this.entry = { x: this.wx(s.cx), z: this.wz(s.cz) + CELL };
    const bossR = this.rooms[this.rooms.length - 1];
    this.bossPos = this.roomPos(bossR);
  }

  /** Puntos de aparición de monstruos: grupos en cada sala intermedia. */
  spawnPoints() {
    const out = [];
    const R = rng(this.tier * 31 + 1);
    this.rooms.forEach((r, i) => {
      if (r.start || r.boss) return;
      const n = 3 + ((R() * 2) | 0) + Math.min(2, Math.floor(this.tier / 4));
      for (let k = 0; k < n; k++) {
        out.push({
          x: this.wx(r.cx) + (R() - 0.5) * (r.w - 1) * CELL * 0.7,
          z: this.wz(r.cz) + (R() - 0.5) * (r.d - 1) * CELL * 0.7,
          mob: this.def.mobs[(R() * this.def.mobs.length) | 0],
          lvl: this.def.minLevel + Math.min(7, Math.floor((i / this.rooms.length) * 8) + ((R() * 2) | 0)),
        });
      }
    });
    return out;
  }
}
