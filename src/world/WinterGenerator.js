import { ValueNoise, mulberry32 } from './noise.js';

// Índices de baldosa del Bosque Invernal (ver tileset en gfx/textures.js)
export const W_T = { SNOW: 41, SNOW2: 42, ICE: 43, ICECLIFF: 44 };
export const WINTER_BLOCKING = [W_T.ICE, W_T.ICECLIFF];
export const WINTER_W = 150;
export const WINTER_H = 104;

/**
 * BOSQUE INVERNAL: zona de fin de juego que se abre al completar las mazmorras.
 * Se genera en el mismo tilemap, debajo de las mazmorras: nieve, lagos helados,
 * crestas de roca helada, pinos nevados y bestias de nivel 76-86 que se hacen
 * más fuertes cuanto más te adentras. Al fondo espera la Reina Araña de Escarcha.
 */
export function appendWinter(world, seed) {
  const { tiles } = world;
  const rng = mulberry32(seed);
  const nE = new ValueNoise(seed + 3);
  const nR = new ValueNoise(seed + 5);
  const ox = world.overW + 4;
  const oy = world.h - WINTER_H - 4;
  const ex = ox + 6, ey = oy + Math.floor(WINTER_H / 2);   // entrada (izquierda, centro)

  for (let y = oy; y < oy + WINTER_H; y++) {
    for (let x = ox; x < ox + WINTER_W; x++) {
      const lx = x - ox, ly = y - oy;
      const border = lx < 2 || ly < 2 || lx >= WINTER_W - 2 || ly >= WINTER_H - 2;
      const e = nE.fbm(x / 22, y / 22, 4);
      const r = 1 - Math.abs(nR.fbm(x / 16, y / 16, 3) - 0.5) * 2;
      const nearEntry = Math.hypot(x - ex, y - ey) < 9;
      let t = rng() < 0.82 ? W_T.SNOW : W_T.SNOW2;
      if (border) t = W_T.ICECLIFF;
      else if (!nearEntry && e < 0.27) t = W_T.ICE;
      else if (!nearEntry && r > 0.955 && e > 0.45) t = W_T.ICECLIFF;
      tiles[y][x] = t;
    }
  }

  // Alcanzables desde la entrada (BFS) para colocar monstruos y jefa
  const blocked = (x, y) => WINTER_BLOCKING.includes(tiles[y][x]);
  const dist = new Map();
  const key = (x, y) => y * 100000 + x;
  const queue = [[ex, ey]];
  dist.set(key(ex, ey), 0);
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < ox || ny < oy || nx >= ox + WINTER_W || ny >= oy + WINTER_H || blocked(nx, ny) || dist.has(key(nx, ny))) continue;
      dist.set(key(nx, ny), dist.get(key(x, y)) + 1);
      queue.push([nx, ny]);
    }
  }
  const reach = queue;
  const maxD = Math.max(...reach.map(([x, y]) => dist.get(key(x, y))));

  // Pinos nevados
  const treeSet = new Set();
  for (const [x, y] of reach) {
    if (Math.hypot(x - ex, y - ey) < 10) continue;
    if (rng() < 0.13) {
      world.trees.push({ tx: x, ty: y, kind: 'tree_snowpine', ox: Math.round((rng() - 0.5) * 10) });
      treeSet.add(key(x, y));
    }
  }

  // Jefa al fondo (la casilla alcanzable más lejana)
  let far = reach[0], fd = 0;
  for (const [x, y] of reach) { const d = dist.get(key(x, y)); if (d > fd && !treeSet.has(key(x, y))) { fd = d; far = [x, y]; } }

  // Monstruos: más nivel cuanto más lejos de la entrada
  const types = ['polarbear', 'frostSkeleton', 'frostSpider'];
  const mobs = [];
  let guard = 0;
  while (mobs.length < 140 && guard++ < 6000) {
    const [x, y] = reach[Math.floor(rng() * reach.length)];
    const d = dist.get(key(x, y));
    if (d < 14 || treeSet.has(key(x, y)) || Math.hypot(x - far[0], y - far[1]) < 6) continue;
    const level = 76 + Math.floor((d / maxD) * 10);
    mobs.push({ type: types[Math.floor(rng() * types.length)], x, y, level, elite: rng() < 0.08 });
  }
  mobs.push({ type: 'frostSpider', x: far[0], y: far[1], level: 88, boss: true, name: 'Reina Araña de Escarcha' });
  for (const [dx, dy] of [[-3, -2], [-3, 2]]) {
    const x = far[0] + dx, y = far[1] + dy;
    if (!blocked(x, y)) mobs.push({ type: 'frostSpider', x, y, level: 86, elite: true });
  }

  world.winter = {
    id: 'winter', name: 'Bosque Invernal', colorName: 'Hielo', emoji: '❄️', color: '#bfe8ff', hex: 0xbfe8ff,
    minLevel: 76, maxLevel: 88, rect: { x: ox, y: oy, w: WINTER_W, h: WINTER_H },
    entry: { x: ex + 2, y: ey }, exit: { x: ex - 1, y: ey - 2 }, bossRoom: { x: far[0], y: far[1] },
    boss: { name: 'Reina Araña de Escarcha' }, mobs, crystals: [], isWinter: true,
  };
}
