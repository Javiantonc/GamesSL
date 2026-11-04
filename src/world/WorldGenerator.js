import { ValueNoise, mulberry32 } from './noise.js';
import { MOBS } from '../data/mobs.js';
import { MOB_COUNT } from '../config.js';
import { DUNGEON_TIERS } from '../data/dungeons.js';
import { appendDungeons, dungeonTile } from './DungeonGenerator.js';
import { appendWinter, WINTER_BLOCKING } from './WinterGenerator.js';

// Índices de baldosa (coinciden con el orden del tileset generado en gfx/textures.js)
export const T = { DEEP: 0, WATER: 1, SAND: 2, GRASS: 3, GRASS2: 4, FOREST: 5, FOREST2: 6, HILL: 7, CLIFF: 8, SNOW: 9, VOID: 10 };
// Baldosas de mazmorra: por cada nivel de color t -> suelo, suelo2, muro (ver DungeonGenerator)
export const BLOCKING = [T.DEEP, T.WATER, T.CLIFF, T.SNOW, T.VOID, ...DUNGEON_TIERS.map((_, t) => dungeonTile(t, 'wall')), ...WINTER_BLOCKING];

export const BIOME_OF_TILE = {
  [T.DEEP]: 'lake', [T.WATER]: 'lake', [T.SAND]: 'sand', [T.GRASS]: 'grass', [T.GRASS2]: 'grass',
  [T.FOREST]: 'forest', [T.FOREST2]: 'forest', [T.HILL]: 'hill', [T.CLIFF]: 'mountain', [T.SNOW]: 'mountain',
};
export const ZONE_NAMES = {
  winter: 'Bosque Invernal', dungeon: 'Mazmorra',
  lake: 'Lago Cristalino', sand: 'Costa Dorada', grass: 'Pradera Esmeralda',
  forest: 'Bosque Susurrante', hill: 'Colinas de Piedra', mountain: 'Picos Helados',
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Genera el mundo completo de forma determinista a partir de una semilla:
 *  - Elevación (fBm) -> lagos, costa, pradera, colinas, montañas, nieve
 *  - Humedad (fBm)   -> bosques densos
 *  - Árboles (obstáculo + recurso) y puntos de aparición de monstruos
 */
export function generateWorld(w, h, seed) {
  const elev = new ValueNoise(seed);
  const moist = new ValueNoise(seed + 101);
  const ridge = new ValueNoise(seed + 202);
  const rng = mulberry32(seed + 7);
  const cx = Math.floor(w / 2), cy = Math.floor(h / 2);

  const tiles = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      let e = elev.fbm(x / 46, y / 46, 5);
      e = (e - 0.5) * 1.9 + 0.47;                              // más contraste
      const r = 1 - Math.abs(ridge.fbm(x / 34, y / 34, 3) - 0.5) * 2; // crestas montañosas
      e += Math.max(0, r - 0.8) * 1.2;
      const d = Math.hypot(x - cx, y - cy) / (w / 2);
      e += Math.max(0, d - 0.9) * 4;                          // anillo de montañas en el borde
      const spawnBlend = clamp(1 - Math.hypot(x - cx, y - cy) / 16, 0, 1);
      e = lerp(e, 0.5, spawnBlend);                            // claro llano en el centro
      const m = moist.fbm(x / 30, y / 30, 4);

      let t;
      if (e < 0.25) t = T.DEEP;
      else if (e < 0.32) t = T.WATER;
      else if (e < 0.355) t = T.SAND;
      else if (e > 0.93) t = T.SNOW;
      else if (e > 0.82) t = T.CLIFF;
      else if (e > 0.73) t = T.HILL;
      else if (m > 0.56 && spawnBlend < 0.5) t = rng() < 0.5 ? T.FOREST : T.FOREST2;
      else t = rng() < 0.75 ? T.GRASS : T.GRASS2;
      row.push(t);
    }
    tiles.push(row);
  }

  const isBlocked = (tx, ty) => tx < 0 || ty < 0 || ty >= h || tx >= tiles[0].length || BLOCKING.includes(tiles[ty][tx]);
  const biomeAt = (tx, ty) => {
    if (tx < 0 || ty < 0 || ty >= h || tx >= tiles[0].length) return 'mountain';
    if (tiles[ty][tx] >= 41) return 'winter';
    return tx >= w ? 'dungeon' : BIOME_OF_TILE[tiles[ty][tx]];
  };

  // ---- Portales de mazmorra: solo en baldosas alcanzables desde el inicio (BFS) ----
  const reach = new Uint8Array(w * h);
  const queue = [cy * w + cx];
  reach[queue[0]] = 1;
  while (queue.length) {
    const i = queue.pop();
    const x = i % w, y = (i / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, ni = ny * w + nx;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || reach[ni] || isBlocked(nx, ny)) continue;
      reach[ni] = 1; queue.push(ni);
    }
  }
  const clearAround = (x, y, r) => {
    for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r; xx <= x + r; xx++) if (!reach[yy * w + xx]) return false;
    return true;
  };
  const placed = [];
  const portals = DUNGEON_TIERS.map((tier, t) => {
    const ang0 = rng() * Math.PI * 2;
    for (let tol = 3; tol < 40; tol += 3) {
      for (let k = 0; k < 120; k++) {
        const a = ang0 + (k / 120) * Math.PI * 2;
        const d = tier.dist + (rng() - 0.5) * tol;
        const x = Math.round(cx + Math.cos(a) * d), y = Math.round(cy + Math.sin(a) * d);
        if (x > 3 && y > 3 && x < w - 3 && y < h - 3 && clearAround(x, y, 1) && !placed.some((p) => Math.hypot(p.x - x, p.y - y) < 9)) {
          placed.push({ x, y });
          return { tier: t, x, y };
        }
      }
    }
    return { tier: t, x: cx + 4 + t * 2, y: cy + 4 };
  });
  const nearPortal = (x, y, r) => portals.some((p) => Math.abs(p.x - x) <= r && Math.abs(p.y - y) <= r);

  // ---- Árboles ----
  const trees = [];
  const treeSet = new Set();
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const b = biomeAt(x, y);
      if (Math.hypot(x - cx, y - cy) < 7 || nearPortal(x, y, 3)) continue;
      let p = 0;
      if (b === 'forest') p = 0.24;
      else if (b === 'grass') p = 0.018;
      else if (b === 'hill') p = 0.04;
      if (rng() < p) {
        const kind = b === 'forest' ? (rng() < 0.5 ? 'tree_pine' : 'tree_oak') : b === 'hill' ? 'tree_pine' : (rng() < 0.3 ? 'tree_fruit' : 'tree_oak');
        trees.push({ tx: x, ty: y, kind, ox: Math.round((rng() - 0.5) * 10) });
        treeSet.add(y * w + x);
      }
    }
  }

  // ---- Puntos de aparición de monstruos ----
  const mobSpawns = [];
  let guard = 0;
  while (mobSpawns.length < MOB_COUNT && guard++ < 20000) {
    const x = 2 + Math.floor(rng() * (w - 4));
    const y = 2 + Math.floor(rng() * (h - 4));
    const dist = Math.hypot(x - cx, y - cy);
    if (dist < 11 || isBlocked(x, y) || treeSet.has(y * w + x) || nearPortal(x, y, 4)) continue;
    const b = biomeAt(x, y);
    const candidates = Object.values(MOBS).filter((m) => m.biomes.includes(b));
    if (!candidates.length) continue;
    const def = candidates[Math.floor(rng() * candidates.length)];
    // Nivel por distancia al inicio: ~1 en el centro, ~35 en los bordes (las mazmorras llegan a 80)
    const level = clamp(1 + Math.floor((dist - 11) / 2.2) + (rng() < 0.3 ? 1 : 0), 1, 80);
    mobSpawns.push({ type: def.id, x, y, level, elite: rng() < 0.05 && level > 2 });
  }

  const world = { w, h, overW: w, tiles, trees, mobSpawns, portals, spawn: { x: cx, y: cy }, isBlocked, biomeAt };
  appendDungeons(world, seed + 999);   // añade las mazmorras a la derecha del mapa (fuera de la vista)
  appendWinter(world, seed + 4242);    // y el Bosque Invernal debajo de ellas
  // Portal del Bosque Invernal: en el Claro del Inicio
  world.winterPortal = { x: cx + 5, y: cy - 4 };
  world.w = tiles[0].length;
  return world;
}
