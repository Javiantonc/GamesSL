import { TILE, TREE_RESPAWN_MS } from '../config.js';
import { createStack } from '../data/items.js';
import { bus } from '../core/EventBus.js';

/**
 * Árboles: obstáculo (cuerpo estático en el tronco) y recurso (tecla E para talar).
 * Tras 3 golpes quedan en tocón, dan madera y vuelven a crecer.
 */
export class TreeManager {
  constructor(scene, trees) {
    this.scene = scene;
    this.group = scene.physics.add.staticGroup();
    this.list = [];
    for (const t of trees) {
      const x = t.tx * TILE + 16 + t.ox;
      const y = t.ty * TILE + 28;
      const img = this.group.create(x, y, t.kind);
      img.setOrigin(0.5, 0.95).setDepth(y);
      // Cuerpo de colisión solo en la base del tronco
      img.body.updateFromGameObject();
      img.body.setSize(16, 10, false);
      img.body.setOffset(img.width * 0.5 - 8, img.height * 0.95 - 10);
      img.tree = { kind: t.kind, hits: 0, alive: true, respawnAt: 0 };
      this.list.push(img);
    }
  }

  nearest(x, y, maxDist = 58) {
    let best = null, bd = maxDist;
    for (const img of this.list) {
      if (!img.tree.alive) continue;
      const d = Math.hypot(img.x - x, img.y - y);
      if (d < bd) { bd = d; best = img; }
    }
    return best;
  }

  tryChop(player) {
    const now = performance.now();
    if (player.dead || now < (this.nextChopAt || 0)) return false;
    const img = this.nearest(player.x, player.y);
    if (!img) { bus.emit('ui:error', 'No hay ningún árbol cerca (E)'); return false; }
    this.nextChopAt = now + 450;
    player.facing = img.x >= player.x ? 1 : -1;
    player.swing();
    img.tree.hits++;
    this.scene.tweens.add({ targets: img, angle: { from: -4, to: 4 }, duration: 60, yoyo: true, repeat: 1, onComplete: () => img.setAngle(0) });
    this.leaves(img);
    if (img.tree.hits >= 3) {
      img.tree.alive = false;
      img.tree.respawnAt = now + TREE_RESPAWN_MS;
      img.setTexture('stump').setOrigin(0.5, 0.8);
      img.body.enable = false;
      const fruit = img.tree.kind === 'tree_fruit';
      const loot = [createStack('wood', 2 + Math.floor(Math.random() * 2))];
      if (fruit) loot.push(createStack('berries', 2));
      for (const it of loot) {
        const copy = { ...it };
        if (this.scene.state.inventory.add(it)) bus.emit('ui:loot', copy);
        else bus.emit('ui:error', 'Tu mochila está llena');
      }
    }
    return true;
  }

  leaves(img) {
    for (let i = 0; i < 6; i++) {
      const p = this.scene.add.image(img.x + (Math.random() - 0.5) * 40, img.y - 50 - Math.random() * 20, 'spark')
        .setTint(0x5cc94a).setDepth(img.y + 1).setScale(0.8);
      this.scene.tweens.add({ targets: p, y: p.y + 40 + Math.random() * 20, x: p.x + (Math.random() - 0.5) * 30, alpha: 0, angle: 180, duration: 700, onComplete: () => p.destroy() });
    }
  }

  update(now, player) {
    if (now < (this.nextRegrowCheck || 0)) return;
    this.nextRegrowCheck = now + 1000;
    for (const img of this.list) {
      if (img.tree.alive || now < img.tree.respawnAt) continue;
      if (Math.hypot(img.x - player.x, img.y - player.y) < 40) continue;
      img.tree.alive = true; img.tree.hits = 0;
      img.setTexture(img.tree.kind).setOrigin(0.5, 0.95);
      img.body.enable = true;
    }
  }
}
