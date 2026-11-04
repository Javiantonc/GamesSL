import { TILE } from '../config.js';
import { MOBS } from '../data/mobs.js';
import { lighten, DUNGEONS_TO_UNLOCK_WINTER } from '../data/dungeons.js';
import { Mob } from '../entities/Mob.js';
import { levelColor, xpForLevel } from '../systems/Progression.js';
import { bus } from '../core/EventBus.js';

const px = (t) => t * TILE + 16;

/**
 * Mazmorras: portales de colores en el mundo exterior que teletransportan
 * a instancias con monstruos de su color y un jefe final.
 *  - Pulsa E junto a un portal para entrar o salir.
 *  - Al entrar, la mazmorra se reinicia (reaparecen todos los monstruos).
 *  - Al vencer al jefe aparece un portal de salida en su sala.
 */
export class DungeonManager {
  constructor(scene) {
    this.scene = scene;
    this.world = scene.world;
    this.current = null;
    this.portals = [];
    this.decor = [];          // objetos para el culling de GameScene
    this.lastOverworldPortal = null;

    // Portales de entrada en el mundo exterior
    this.entryPortals = {};
    for (const p of this.world.portals) {
      const d = this.world.dungeons[p.tier];
      const portal = this.createPortal(px(p.x), px(p.y), d, 'enter');
      this.entryPortals[d.id] = portal;
      this.portals.push(portal);
    }

    // Contenido de cada mazmorra
    this.dungeons = this.world.dungeons.map((d) => {
      const tint = lighten(d.hex, 0.35);
      const mobs = d.mobs.map((s) => {
        const def = MOBS[s.type];
        const name = s.boss ? d.boss.name : `${def.name} ${d.suffix}`;
        const m = new Mob(scene, def, s.level, px(s.x), px(s.y), s.elite, {
          boss: s.boss, tint, name, noRespawn: true, dungeon: d.id,
          loot: { minRarity: d.minRarity, bossRarity: d.bossRarity },
          auraColor: def.spectre ? d.hex : undefined,      // jefes espectrales con aura del color de la mazmorra
        });
        scene.mobGroup.add(m.phys);
        m.setupBody();
        scene.mobs.push(m);
        return m;
      });
      for (const c of d.crystals) {
        const x = px(c.x), y = px(c.y) + 10;
        this.decor.push(
          scene.add.image(x, y - 14, 'glow').setTint(d.hex).setAlpha(0.45).setScale(1.3).setDepth(y - 1),
          scene.add.image(x, y, 'crystal').setOrigin(0.5, 1).setTint(lighten(d.hex, 0.25)).setDepth(y),
        );
      }
      const exit = this.createPortal(px(d.exit.x), px(d.exit.y), d, 'exit');
      this.portals.push(exit);
      return { ...d, mobs, bossExit: null, completed: false };
    });

    // ---------- Bosque Invernal ----------
    const w = this.world.winter;
    const wmobs = w.mobs.map((sp) => {
      const def = MOBS[sp.type];
      const m = new Mob(scene, def, sp.level, px(sp.x), px(sp.y), sp.elite, {
        boss: sp.boss, name: sp.name, dungeon: 'winter',
        loot: { minRarity: sp.boss ? 'epic' : 'uncommon', bossRarity: 'legendary' },
        auraColor: sp.boss ? 0x8fd8ff : undefined,
      });
      scene.mobGroup.add(m.phys);
      m.setupBody();
      scene.mobs.push(m);
      return m;
    });
    this.winter = { ...w, mobs: wmobs };
    const wp = this.world.winterPortal;
    this.winterPortal = this.createPortal(px(wp.x), px(wp.y), this.winter, 'winter');
    this.portals.push(this.winterPortal, this.createPortal(px(w.exit.x), px(w.exit.y), this.winter, 'exit'));
    this.refreshWinterLabel();
    this.nextSnow = 0;

    this.prompt = scene.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS, Segoe UI, sans-serif', fontSize: '14px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#1a1020', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5, 0).setDepth(3e6).setVisible(false);
  }

  /** Portal animado: arco de piedra + remolino del color de la mazmorra + partículas. */
  createPortal(x, y, d, kind) {
    const s = this.scene;
    const depth = y + 20;
    const glow = s.add.image(x, y - 34, 'glow').setTint(d.hex).setBlendMode('ADD').setScale(2.4, 2.8).setAlpha(0.6).setDepth(depth - 2);
    const swirl = s.add.image(0, 0, 'portal_swirl').setTint(d.hex).setBlendMode('ADD');
    const swirlBox = s.add.container(x, y - 34, [swirl]).setScale(0.62, 0.92).setDepth(depth - 1);
    const frame = s.add.image(x, y + 22, 'portal_frame').setOrigin(0.5, 1).setDepth(depth);
    const label = s.add.text(x, y - 96, kind === 'exit' ? '⬅ Salida' : `${d.emoji} ${d.name}\nNv ${d.minLevel}-${d.maxLevel}`, {
      fontFamily: 'Trebuchet MS, Segoe UI, sans-serif', fontSize: kind === 'exit' ? '13px' : '14px', fontStyle: 'bold',
      color: d.color, stroke: '#140c22', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5, 1).setDepth(3e6 - 1);
    s.tweens.add({ targets: swirl, angle: 360, duration: 2600, repeat: -1 });
    s.tweens.add({ targets: glow, alpha: { from: 0.35, to: 0.75 }, duration: 900, yoyo: true, repeat: -1 });
    s.tweens.add({ targets: label, y: label.y - 4, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const portal = { x, y, d, kind, parts: [glow, swirlBox, frame, label], label, nextSpark: 0 };
    this.decor.push(glow, swirlBox, frame, label);
    if (this.scene.cullList) this.scene.cullList.push(glow, swirlBox, frame, label);
    return portal;
  }

  sparks(p, now) {
    if (now < p.nextSpark) return;
    p.nextSpark = now + 140;
    const sp = this.scene.add.image(p.x + (Math.random() - 0.5) * 50, p.y, 'spark')
      .setTint(p.d.hex).setBlendMode('ADD').setDepth(p.y + 30);
    this.scene.tweens.add({ targets: sp, y: p.y - 70 - Math.random() * 30, alpha: 0, scale: 0.3, duration: 900, onComplete: () => sp.destroy() });
  }

  get inDungeon() { return !!this.current; }

  // ---------- Progreso: mazmorras completadas y Bosque Invernal ----------
  clearedCount() { return this.scene.state.dungeonsCleared.size; }
  winterUnlocked() { return this.clearedCount() >= DUNGEONS_TO_UNLOCK_WINTER; }

  refreshWinterLabel() {
    const n = this.clearedCount();
    this.winterPortal.label.setText(this.winterUnlocked()
      ? '❄️ Bosque Invernal\nNv 76-88 · ¡Abierto!'
      : `❄️ Bosque Invernal\n🔒 Mazmorras ${n}/${DUNGEONS_TO_UNLOCK_WINTER}`);
    for (const id of this.scene.state.dungeonsCleared) {
      const p = this.entryPortals[id];
      if (p && !p.label.text.includes('✔')) p.label.setText(`${p.label.text}\n✔ Completada`);
    }
  }

  /** Rectángulo (px) del mundo exterior para la cámara. */
  overworldBounds() { return { x: 0, y: 0, w: this.world.overW * TILE, h: this.world.h * TILE }; }

  update(now, player) {
    let near = null, nd = 46;
    for (const p of this.portals) {
      if (Math.abs(p.x - player.x) > 700 || Math.abs(p.y - player.y) > 500) continue;
      this.sparks(p, now);
      const d = Math.hypot(p.x - player.x, p.y - player.y);
      if (d < nd) { nd = d; near = p; }
    }
    this.near = near;
    if (near && !player.dead) {
      const lvl = this.scene.state.level;
      let txt;
      if (near.kind === 'enter') txt = `[E] Entrar en ${near.d.name}\nNivel recomendado ${near.d.minLevel}-${near.d.maxLevel}`;
      else if (near.kind === 'winter') {
        txt = this.winterUnlocked() ? '[E] Entrar en el Bosque Invernal\nBestias de nivel 76-88'
          : `🔒 Completa todas las mazmorras para abrirlo (${this.clearedCount()}/${DUNGEONS_TO_UNLOCK_WINTER})`;
      } else txt = this.current?.isWinter ? '[E] Volver al mundo exterior' : '[E] Salir de la mazmorra';
      this.prompt.setText(txt).setPosition(near.x, near.y + 72).setVisible(true);
      const locked = near.kind === 'winter' && !this.winterUnlocked();
      this.prompt.setColor(locked || (near.kind === 'enter' && lvl < near.d.minLevel - 1) ? '#ff7b6b' : '#ffffff');
    } else {
      this.prompt.setVisible(false);
    }
  }

  /** Tecla E: usa el portal cercano. Devuelve true si había uno. */
  tryUse(player) {
    if (!this.near || player.dead) return false;
    if (this.near.kind === 'enter') this.enter(this.near);
    else if (this.near.kind === 'winter') this.enterWinter(this.near);
    else this.exit();
    return true;
  }

  enterWinter(portal) {
    if (!this.winterUnlocked()) {
      bus.emit('ui:error', `Completa todas las mazmorras para abrir el Bosque Invernal (${this.clearedCount()}/${DUNGEONS_TO_UNLOCK_WINTER})`);
      return;
    }
    const w = this.winter;
    this.lastOverworldPortal = portal;
    this.teleport(px(w.entry.x), px(w.entry.y), () => {
      this.current = w;
      const r = w.rect;
      this.scene.cameras.main.setBounds(r.x * TILE, r.y * TILE, r.w * TILE, r.h * TILE);
      this.scene.cameras.main.setBackgroundColor('#dbe9f7');
      bus.emit('ui:zone', { title: '❄️ Bosque Invernal', sub: 'Osos polares, esqueletos y arañas de escarcha · Nivel 76-88 · Al fondo espera la Reina Araña', color: '#bfe8ff' });
    });
  }

  enter(portal) {
    const d = this.dungeons[portal.d.tier];
    this.lastOverworldPortal = portal;
    if (this.scene.state.level < d.minLevel - 1) {
      bus.emit('ui:error', `¡Cuidado! Mazmorra de nivel ${d.minLevel}-${d.maxLevel}`);
    }
    this.reset(d);
    this.teleport(px(d.entry.x), px(d.entry.y), () => {
      this.current = d;
      const r = d.rect;
      this.scene.cameras.main.setBounds(r.x * TILE, r.y * TILE, r.w * TILE, r.h * TILE);
      this.scene.cameras.main.setBackgroundColor('#07060d');
      bus.emit('ui:zone', { title: `${d.emoji} ${d.name}`, sub: `Mazmorra ${d.colorName} · Nivel ${d.minLevel}-${d.maxLevel} · Derrota a ${d.boss.name}`, color: d.color });
    });
  }

  exit() {
    const back = this.lastOverworldPortal || { x: this.scene.spawnPoint.x, y: this.scene.spawnPoint.y - 60 };
    this.teleport(back.x, back.y + 60, () => {
      this.current = null;
      const b = this.overworldBounds();
      this.scene.cameras.main.setBounds(b.x, b.y, b.w, b.h);
      this.scene.cameras.main.setBackgroundColor('#1f5f9e');
      bus.emit('ui:zone', { title: 'Mundo exterior', sub: 'Has vuelto al mundo exterior', color: '#ffe14d' });
    });
  }

  teleport(x, y, onArrive) {
    const s = this.scene;
    const cam = s.cameras.main;
    s.setTarget(null);
    s.player.dead = true;                     // bloquea el control durante la transición
    cam.fadeOut(220, 10, 6, 25);
    // Tiempo real (no fotogramas): la transición termina aunque el equipo vaya a pocos FPS
    setTimeout(() => {
      s.player.phys.body.reset(x, y);
      s.army.gatherAt(x, y);          // el ejército de sombras viaja contigo
      onArrive();
      cam.centerOn(x, y);
      s.player.dead = false;
      cam.resetFX();
      cam.fadeIn(320, 10, 6, 25);
    }, 240);
  }

  /** Reinicia la mazmorra: reaparecen los monstruos y desaparece el portal del jefe. */
  reset(d) {
    if (d.isWinter) return;                   // el bosque no se reinicia: sus bestias reaparecen solas
    for (const m of d.mobs) {
      if (m.dead) m.respawn();
      else { m.hp = m.maxHp; m.state = 'idle'; m.phys.body.reset(m.home.x, m.home.y); }
    }
    if (d.bossExit) {
      d.bossExit.parts.forEach((o) => o.destroy());
      this.scene.cullList = this.scene.cullList.filter((o) => !d.bossExit.parts.includes(o));
      this.portals = this.portals.filter((p) => p !== d.bossExit);
      d.bossExit = null;
    }
    d.completed = false;
  }

  onMobKilled(mob) {
    if (!mob.boss || !this.current) return;
    const d = this.current;
    if (d.isWinter) return;
    d.completed = true;
    const first = !this.scene.state.dungeonsCleared.has(d.id);
    this.scene.state.dungeonsCleared.add(d.id);
    this.refreshWinterLabel();
    if (first && this.winterUnlocked()) {
      this.scene.time.delayedCall(4500, () => bus.emit('ui:zone', { title: '❄️ ¡Bosque Invernal desbloqueado!', sub: 'Has completado todas las mazmorras. El portal de hielo del Claro del Inicio está abierto.', color: '#bfe8ff' }));
    }
    const bonus = Math.round(xpForLevel(d.maxLevel) * 0.35);   // XP extra por completar la mazmorra
    this.scene.state.gainXp(bonus);
    this.scene.combat.float(mob.x, mob.y - 120, `+${bonus} XP de mazmorra`, '#c88bff', 20);
    bus.emit('ui:zone', { title: '¡Mazmorra completada!', sub: `Has derrotado a ${d.boss.name}. Mazmorras completadas: ${this.clearedCount()}/${DUNGEONS_TO_UNLOCK_WINTER}`, color: d.color });
    this.scene.cameras.main.shake(300, 0.01);
    d.bossExit = this.createPortal(px(d.bossRoom.x) - 96, px(d.bossRoom.y), d, 'exit');
    this.portals.push(d.bossExit);
  }

  /** Dónde reaparece el jugador si muere (entrada de la mazmorra o el inicio). */
  respawnPoint() {
    if (this.current) return { x: px(this.current.entry.x), y: px(this.current.entry.y) };
    return this.scene.spawnPoint;
  }

  levelColorFor(d) { return levelColor(d.minLevel, this.scene.state.level); }

  /** Nevada en el Bosque Invernal (copos que caen sobre la vista de la cámara). */
  snow(now) {
    if (!this.current?.isWinter || now < this.nextSnow) return;
    this.nextSnow = now + 90;
    const v = this.scene.cameras.main.worldView;
    const f = this.scene.add.image(v.x + Math.random() * v.width, v.y - 10, 'spark')
      .setTint(0xffffff).setAlpha(0.6 + Math.random() * 0.4).setScale(0.4 + Math.random() * 0.6).setDepth(2.5e6);
    this.scene.tweens.add({
      targets: f, y: v.y + v.height + 20, x: f.x + (Math.random() - 0.5) * 120, angle: 180,
      duration: 3500 + Math.random() * 2500, onComplete: () => f.destroy(),
    });
  }
}
