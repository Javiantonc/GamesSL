import { el } from './dom.js';
import { TILE } from '../config.js';
import { ZONE_NAMES } from '../world/WorldGenerator.js';

import { DUNGEON_TIERS } from '../data/dungeons.js';

const COLORS = ['#2468ad', '#3d97dc', '#f3dc92', '#7fd25b', '#86d862', '#3f8f3a', '#3b8a36', '#c2a878', '#8d8d9c', '#eef5fc', '#07060d'];
for (const t of DUNGEON_TIERS) COLORS.push(t.color + '99', t.color + 'aa', '#15131d');
COLORS.push('#f4f9ff', '#e9f3ff', '#8fc4e8', '#7f93aa');   // Bosque Invernal

/** Minimapa: el terreno se pinta una vez en un canvas; cada 120 ms se recorta alrededor del jugador. */
export class Minimap {
  constructor(ui) {
    this.ui = ui;
    const w = ui.scene.world;
    this.world = w;
    this.base = document.createElement('canvas');
    this.base.width = w.w; this.base.height = w.h;
    const b = this.base.getContext('2d');
    for (let y = 0; y < w.h; y++) for (let x = 0; x < w.w; x++) { b.fillStyle = COLORS[w.tiles[y][x]]; b.fillRect(x, y, 1, 1); }
    b.fillStyle = 'rgba(20,70,20,0.55)';
    // (las baldosas de mazmorra usan su color translúcido)
    for (const t of w.trees) b.fillRect(t.tx, t.ty, 1, 1);

    this.node = el('div', 'minimap', '<div class="zone"></div><canvas width="170" height="170"></canvas><div class="coords"></div>');
    ui.root.append(this.node);
    this.canvas = this.node.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.zone = this.node.querySelector('.zone');
    this.coords = this.node.querySelector('.coords');
    this.next = 0;
  }

  update(now) {
    if (now < this.next) return;
    this.next = now + 120;
    const scene = this.ui.scene;
    const p = scene.player;
    const R = 42; // radio de visión en baldosas
    const ptx = p.x / TILE, pty = p.y / TILE;
    const S = this.canvas.width / (R * 2);
    const ctx = this.ctx;
    ctx.fillStyle = '#10182a'; ctx.fillRect(0, 0, 170, 170);
    ctx.drawImage(this.base, ptx - R, pty - R, R * 2, R * 2, 0, 0, 170, 170);
    // En mazmorra o fuera: tapa lo que no pertenece a la zona actual
    const dgn = scene.dungeons.current;
    const zone = dgn ? dgn.rect : { x: 0, y: 0, w: this.world.overW, h: this.world.h };
    const zx0 = (zone.x - ptx + R) * S, zy0 = (zone.y - pty + R) * S;
    const zx1 = zx0 + zone.w * S, zy1 = zy0 + zone.h * S;
    ctx.fillStyle = '#07060d';
    if (zx0 > 0) ctx.fillRect(0, 0, zx0, 170);
    if (zx1 < 170) ctx.fillRect(zx1, 0, 170 - zx1, 170);
    if (zy0 > 0) ctx.fillRect(0, 0, 170, zy0);
    if (zy1 < 170) ctx.fillRect(0, zy1, 170, 170 - zy1);
    // portales: círculo del color de la mazmorra
    for (const pt of scene.dungeons.portals) {
      if (dgn ? pt.d.id !== dgn.id || pt.kind !== 'exit' : pt.kind === 'exit') continue;
      const mx = (pt.x / TILE - ptx + R) * S, my = (pt.y / TILE - pty + R) * S;
      if (mx < 0 || my < 0 || mx > 170 || my > 170) continue;
      ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI * 2);
      ctx.fillStyle = pt.d.color; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#140c22'; ctx.stroke();
    }
    for (const m of scene.mobs) {
      if (m.dead || m.opts.dungeon !== dgn?.id) continue;
      const mx = (m.x / TILE - ptx + R) * S, my = (m.y / TILE - pty + R) * S;
      if (mx < 0 || my < 0 || mx > 170 || my > 170) continue;
      ctx.fillStyle = m.boss ? '#ff2bd6' : m.elite ? '#ffd34d' : '#ff4a3a';
      const sz = m.boss ? 6 : 3;
      ctx.fillRect(mx - sz / 2, my - sz / 2, sz, sz);
    }
    // ejército de sombras y esencias
    for (const sh of [...scene.army.shadows, ...scene.army.essences]) {
      const mx = (sh.x / TILE - ptx + R) * S, my = (sh.y / TILE - pty + R) * S;
      if (mx < 0 || my < 0 || mx > 170 || my > 170) continue;
      ctx.fillStyle = sh.isShadow ? '#5ff2d6' : '#c9fff4';
      ctx.beginPath(); ctx.arc(mx, my, sh.isShadow ? 2.5 : 1.8, 0, Math.PI * 2); ctx.fill();
    }
    // NPCs del pueblo con misión (! nueva · ? para entregar)
    if (!dgn && scene.village) {
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      for (const n of scene.village.npcs) {
        const mx = (n.x / TILE - ptx + R) * S, my = (n.y / TILE - pty + R) * S;
        if (mx < 0 || my < 0 || mx > 170 || my > 170) continue;
        const mk = n.mark.text;
        if (mk === '!' || mk === '?') { ctx.lineWidth = 3; ctx.strokeStyle = '#1a1020'; ctx.strokeText(mk, mx, my + 4); ctx.fillStyle = '#ffd23a'; ctx.fillText(mk, mx, my + 4); }
        else { ctx.fillStyle = '#7dff7a'; ctx.fillRect(mx - 1.5, my - 1.5, 3, 3); }
      }
    }
    // jugador: flecha
    ctx.save(); ctx.translate(85, 85);
    ctx.rotate(Math.atan2(p.moveDir.y, p.moveDir.x) + Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4.5, 5); ctx.lineTo(0, 2.5); ctx.lineTo(-4.5, 5); ctx.closePath();
    ctx.fillStyle = '#ffe14d'; ctx.fill(); ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();

    const tx = Math.floor(ptx), ty = Math.floor(pty);
    const dg = scene.dungeons.current;
    const name = dg ? dg.name
      : Math.hypot(tx - this.world.spawn.x, ty - this.world.spawn.y) < 13 ? 'Pueblo de Albor' : ZONE_NAMES[this.world.biomeAt(tx, ty)];
    if (this.zone.textContent !== name) {
      this.zone.textContent = name;
      this.zone.style.color = dg ? dg.color : '';
      this.canvas.style.borderColor = dg ? dg.color : '';
    }
    this.coords.textContent = `${tx}, ${ty}`;
  }
}
