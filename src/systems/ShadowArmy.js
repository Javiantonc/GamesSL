import { Shadow, SHADOW_GLOW } from '../entities/Shadow.js';
import { bus } from '../core/EventBus.js';

export const ARMY_UNLOCK_LEVEL = 50;
const ESSENCE_MS = 12000;      // tiempo que dura la esencia de un enemigo derrotado
const RECRUIT_RADIUS = 220;

/**
 * EJÉRCITO DE SOMBRAS (solo Mago, desde nivel 50).
 *  1. Cada enemigo que muere cerca deja una ESENCIA de sombra durante 12 s.
 *  2. "Reclutar Sombras" alza todas las esencias cercanas como aliados.
 *  3. Capacidad: 3 a nivel 50, +1 cada 5 niveles, +1 por cada 3 rangos de la habilidad.
 *     Las sombras de élite ocupan 2 plazas y las de jefe 3.
 *  4. "Furia Sombría" potencia y cura a todo el ejército.
 */
export class ShadowArmy {
  constructor(scene) {
    this.scene = scene;
    this.shadows = [];
    this.essences = [];
    this.furyUntil = 0;
    this.furyMult = 1.6;
    bus.on('class:changed', () => { if (!this.unlocked()) this.dismissAll(); this.changed(); });
    bus.on('player:levelup', () => this.changed());
  }

  get state() { return this.scene.state; }

  unlocked() { return this.state.classId === 'mage' && this.state.level >= ARMY_UNLOCK_LEVEL; }

  capacity() {
    if (!this.unlocked()) return 0;
    const st = this.state;
    return 3 + Math.floor((st.level - ARMY_UNLOCK_LEVEL) / 5) + Math.floor(st.rank('shadowRecruit') / 3);
  }

  static weight(src) { return src.boss ? 3 : src.elite ? 2 : 1; }
  used() { return this.shadows.reduce((n, s) => n + ShadowArmy.weight(s), 0); }

  changed() { bus.emit('army:changed'); }

  nearestShadow(x, y, r) {
    let best = null, bd = r;
    for (const s of this.shadows) {
      if (s.dead) continue;
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  }

  // ---------------- Esencias ----------------
  onMobKilled(mob) {
    if (!this.unlocked()) return;
    const p = this.scene.player;
    if (Math.hypot(mob.x - p.x, mob.y - p.y) > 700) return;
    const s = this.scene;
    const glow = s.add.image(mob.x, mob.y - 8, 'glow').setTint(SHADOW_GLOW).setBlendMode('ADD').setScale(1.1, 0.55).setAlpha(0).setDepth(mob.y - 3);
    const ring = s.add.ellipse(mob.x, mob.y, 44, 18).setStrokeStyle(2, SHADOW_GLOW, 0.9).setDepth(mob.y - 2).setAlpha(0);
    s.tweens.add({ targets: [glow, ring], alpha: 1, duration: 500 });
    s.tweens.add({ targets: ring, scaleX: 1.25, scaleY: 1.25, duration: 800, yoyo: true, repeat: -1 });
    this.essences.push({
      x: mob.x, y: mob.y, def: mob.def, name: mob.name, elite: mob.elite && !mob.boss, boss: mob.boss,
      until: performance.now() + ESSENCE_MS, glow, ring, nextWisp: 0,
    });
  }

  removeEssence(e) {
    e.glow.destroy(); e.ring.destroy();
    this.essences = this.essences.filter((o) => o !== e);
  }

  /** Mensaje de error si no se puede reclutar ahora (o null si sí). */
  recruitError() {
    if (!this.unlocked()) return `Disponible para el Mago a nivel ${ARMY_UNLOCK_LEVEL}`;
    const p = this.scene.player;
    const near = this.essences.filter((e) => Math.hypot(e.x - p.x, e.y - p.y) <= RECRUIT_RADIUS);
    if (!near.length) return 'No hay esencias de sombra cerca: derrota enemigos primero';
    const free = this.capacity() - this.used();
    if (!near.some((e) => ShadowArmy.weight(e) <= free)) return `Tu ejército está completo (${this.used()}/${this.capacity()})`;
    return null;
  }

  /** Alza todas las esencias cercanas que quepan en el ejército. */
  recruit() {
    const p = this.scene.player;
    const near = this.essences
      .filter((e) => Math.hypot(e.x - p.x, e.y - p.y) <= RECRUIT_RADIUS)
      .sort((a, b) => ShadowArmy.weight(b) - ShadowArmy.weight(a));
    let n = 0;
    for (const e of near) {
      if (this.used() + ShadowArmy.weight(e) > this.capacity()) continue;
      this.removeEssence(e);
      const sh = new Shadow(this.scene, this, e, this.shadows.length);
      this.shadows.push(sh);
      this.scene.combat.burst(e.x, e.y - 10, SHADOW_GLOW, 16);
      this.scene.combat.float(e.x, e.y - 50, `¡${sh.spec.name}!`, '#7dffe0', e.boss ? 20 : 15);
      n++;
    }
    if (n) {
      this.scene.cameras.main.shake(160, 0.004);
      bus.emit('ui:toast', `👥 ${n} espectro${n > 1 ? 's' : ''} se ${n > 1 ? 'unen' : 'une'} a tu ejército (${this.used()}/${this.capacity()})`, '#7dffe0');
      this.reindex();
      this.changed();
    }
    return n;
  }

  /** Furia Sombría: +60% daño y +30% velocidad durante X s y cura un 50%. */
  fury(durationMs) {
    if (!this.shadows.length) return false;
    this.furyUntil = performance.now() + durationMs;
    for (const s of this.shadows) {
      s.hp = Math.min(s.maxHp, s.hp + s.maxHp * 0.5);
      this.scene.combat.burst(s.x, s.y - 20, SHADOW_GLOW, 8);
    }
    return true;
  }

  onShadowDied(sh) {
    this.shadows = this.shadows.filter((s) => s !== sh);
    bus.emit('ui:toast', `${sh.icon} ${sh.spec.name} se ha desvanecido (${this.used()}/${this.capacity()})`, '#8fb8b0');
    this.reindex();
    this.changed();
  }

  dismissAll() {
    for (const s of this.shadows) s.dismiss();
    this.shadows = [];
    for (const e of [...this.essences]) this.removeEssence(e);
  }

  reindex() { this.shadows.forEach((s, i) => { s.index = i; }); }

  /** Lleva el ejército junto al jugador (al cruzar portales o reaparecer). */
  gatherAt(x, y) { for (const s of this.shadows) s.teleportNear(x, y); }

  update(now, dt) {
    const p = this.scene.player;
    for (const e of [...this.essences]) {
      if (now > e.until) { this.removeEssence(e); continue; }
      if (now > e.nextWisp) {
        e.nextWisp = now + 180;
        const w = this.scene.add.image(e.x + (Math.random() - 0.5) * 30, e.y, 'spark').setTint(SHADOW_GLOW).setBlendMode('ADD').setDepth(e.y + 1);
        this.scene.tweens.add({ targets: w, y: e.y - 40 - Math.random() * 20, alpha: 0, duration: 800, onComplete: () => w.destroy() });
      }
      if (e.until - now < 2500) e.glow.setAlpha(0.4 + Math.sin(now * 0.02) * 0.4);
    }
    for (const s of this.shadows) s.update(now, dt, p, this.shadows.length);
  }
}
