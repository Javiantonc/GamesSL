import { mulberry32 } from './noise.js';
import { DUNGEON_TIERS, DUNGEON_SIZE, DUNGEON_GAP, DUNGEON_TOP, DUNGEONS_PER_ROW } from '../data/dungeons.js';

const VOID = 10;
/** Índice de baldosa de mazmorra para el nivel de color t. */
export function dungeonTile(t, kind) {
  return 11 + t * 3 + (kind === 'floor' ? 0 : kind === 'floor2' ? 1 : 2);
}

/**
 * Añade las mazmorras al mismo tilemap, a la derecha del mundo exterior.
 * Así no hace falta otra escena: entrar = teletransportar al jugador y
 * limitar la cámara al rectángulo de la mazmorra.
 *
 * Cada mazmorra: sala de entrada (izq.) -> 6 salas aleatorias -> sala del
 * jefe (der.), unidas por pasillos en L. Los monstruos suben de nivel a
 * medida que avanzas.
 */
export function appendDungeons(world, seed) {
  const { tiles, h } = world;
  const S = DUNGEON_SIZE;
  const extra = DUNGEONS_PER_ROW * (S + DUNGEON_GAP) + DUNGEON_GAP;
  for (const row of tiles) for (let i = 0; i < extra; i++) row.push(VOID);

  world.dungeons = DUNGEON_TIERS.map((tier, t) => {
    const rng = mulberry32(seed + t * 77);
    // 2 hileras de 5 mazmorras a la derecha del mundo exterior
    const col = t % DUNGEONS_PER_ROW, row = Math.floor(t / DUNGEONS_PER_ROW);
    const ox = world.overW + DUNGEON_GAP + col * (S + DUNGEON_GAP);
    const oy = Math.min(DUNGEON_TOP + row * (S + DUNGEON_GAP * 2), h - S - 1);
    const ri = (a, b) => a + Math.floor(rng() * (b - a + 1));

    // ---- Salas ----
    const entrance = { x: ox + 3, y: oy + ri(24, 34), w: 8, h: 8 };
    const boss = { x: ox + S - 18, y: oy + ri(20, 32), w: 15, h: 13 };
    const rooms = [entrance, boss];
    let tries = 0;
    while (rooms.length < 8 && tries++ < 500) {
      const r = { w: ri(6, 11), h: ri(6, 10) };
      r.x = ri(ox + 13, ox + S - 21 - r.w);
      r.y = ri(oy + 2, oy + S - 2 - r.h);
      const overlap = rooms.some((o) => r.x < o.x + o.w + 2 && r.x + r.w + 2 > o.x && r.y < o.y + o.h + 2 && r.y + r.h + 2 > o.y);
      if (!overlap) rooms.push(r);
    }
    const middle = rooms.slice(2).sort((a, b) => a.x - b.x);
    const ordered = [entrance, ...middle, boss];

    // Muros por defecto en todo el rectángulo
    for (let y = oy; y < oy + S; y++) for (let x = ox; x < ox + S; x++) tiles[y][x] = dungeonTile(t, 'wall');
    const floor = (x, y) => { tiles[y][x] = dungeonTile(t, rng() < 0.14 ? 'floor2' : 'floor'); };
    const carveRoom = (r) => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) floor(x, y); };
    const center = (r) => ({ x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) });
    const carveCorridor = (a, b) => {
      const A = center(a), B = center(b);
      const horizFirst = rng() < 0.5;
      const hLine = (y, x1, x2) => { for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) for (let d = 0; d < 3; d++) floor(x, y + d - 1); };
      const vLine = (x, y1, y2) => { for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) for (let d = 0; d < 3; d++) floor(x + d - 1, y); };
      if (horizFirst) { hLine(A.y, A.x, B.x); vLine(B.x, A.y, B.y); }
      else { vLine(A.x, A.y, B.y); hLine(B.y, A.x, B.x); }
    };
    ordered.forEach(carveRoom);
    for (let i = 0; i < ordered.length - 1; i++) carveCorridor(ordered[i], ordered[i + 1]);
    // Algún atajo extra para que no sea un pasillo lineal
    if (middle.length > 3) carveCorridor(middle[0], middle[middle.length - 2]);

    // ---- Monstruos: más nivel cuanto más cerca del jefe ----
    const mobs = [];
    const span = tier.maxLevel - tier.minLevel;
    middle.forEach((r, i) => {
      const level = tier.minLevel + Math.round((span * i) / Math.max(1, middle.length - 1) * 0.85);
      const n = ri(2, 4);
      for (let k = 0; k < n; k++) {
        mobs.push({
          type: tier.mobs[Math.floor(rng() * tier.mobs.length)],
          x: ri(r.x + 1, r.x + r.w - 2), y: ri(r.y + 1, r.y + r.h - 2),
          level, elite: rng() < 0.12,
        });
      }
    });
    const bc = center(boss);
    mobs.push({ type: tier.boss.def, x: bc.x + 3, y: bc.y, level: tier.maxLevel, boss: true });
    mobs.push({ type: tier.mobs[0], x: bc.x - 1, y: bc.y - 3, level: tier.maxLevel - 1, elite: true });
    mobs.push({ type: tier.mobs[1 % tier.mobs.length], x: bc.x - 1, y: bc.y + 3, level: tier.maxLevel - 1, elite: true });

    // ---- Decoración: cristales del color de la mazmorra en las esquinas de las salas ----
    const crystals = [];
    for (const r of ordered) {
      for (const [cx, cy] of [[r.x, r.y], [r.x + r.w - 1, r.y], [r.x, r.y + r.h - 1], [r.x + r.w - 1, r.y + r.h - 1]]) {
        if (rng() < 0.6) crystals.push({ x: cx, y: cy });
      }
    }

    const ec = center(entrance);
    return {
      tier: t, ...tier,
      rect: { x: ox, y: oy, w: S, h: S },
      entry: { x: ec.x, y: ec.y + 1 },
      exit: { x: ec.x - 2, y: ec.y - 2 },          // portal de salida en la sala de entrada
      bossRoom: bc,
      mobs, crystals,
    };
  });
}
