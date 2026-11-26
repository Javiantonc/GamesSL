import { RARITIES, RARITY_ORDER } from '../data/items.js';
import { rollLoot } from './lootTables.js';
import { bus } from '../core/EventBus.js';

/**
 * Objetos en el suelo. Al morir un monstruo suelta bolsas que brillan
 * con el color de su rareza; el jugador las recoge al pasar por encima.
 */
export class LootSystem {
  constructor(scene) {
    this.scene = scene;
    this.drops = [];
    this.warnAt = 0;
  }

  dropFrom(mob) {
    const items = rollLoot(mob.def, mob.level, mob.elite, Math.random, { boss: mob.boss, ...(mob.opts.loot || {}) });
    // El equipo que sueltan los monstruos siempre lo puedes llevar puesto ya
    const lvl = this.scene.state.level;
    for (const it of items) if (it.type === 'equipment') it.reqLevel = Math.min(it.reqLevel, lvl);
    const now = performance.now();
    items.forEach((item) => {
      const ang = Math.random() * Math.PI * 2, r = 14 + Math.random() * 18;
      const x = mob.x + Math.cos(ang) * r, y = mob.y + Math.sin(ang) * r * 0.6;
      const rank = RARITY_ORDER.indexOf(item.rarity);
      const glow = this.scene.add.image(x, y, 'glow').setTint(RARITIES[item.rarity].hex)
        .setBlendMode('ADD').setDepth(y - 2).setScale(0.5 + rank * 0.12).setAlpha(rank > 0 ? 0.85 : 0.35);
      this.scene.tweens.add({ targets: glow, alpha: { from: glow.alpha, to: glow.alpha * 0.4 }, scale: glow.scale * 1.2, duration: 700, yoyo: true, repeat: -1 });
      const bag = this.scene.add.image(mob.x, mob.y - 20, 'bag').setDepth(y);
      this.scene.tweens.add({ targets: bag, x, duration: 420, ease: 'Linear' });
      this.scene.tweens.add({ targets: bag, y, duration: 420, ease: 'Bounce.Out' });
      this.drops.push({ item, bag, glow, x, y, born: now });
    });
  }

  update(player) {
    const now = performance.now();
    const inv = this.scene.state.inventory;
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      if (now - d.born > 120000) { this.remove(i); continue; }
      if (player.dead || now - d.born < 400) continue;
      if (Math.hypot(player.x - d.x, player.y - d.y) > 30) continue;
      const before = { ...d.item };
      if (inv.add(d.item)) {
        bus.emit('ui:loot', before);
        this.remove(i);
      } else if (now > this.warnAt) {
        this.warnAt = now + 2500;
        bus.emit('ui:error', 'Tu mochila está llena');
      }
    }
  }

  remove(i) {
    const d = this.drops[i];
    d.bag.destroy(); d.glow.destroy();
    this.drops.splice(i, 1);
  }
}
