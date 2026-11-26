import { ABILITIES } from '../data/abilities.js';
import { xpFromMob } from './Progression.js';
import { MOB_RESPAWN_MS } from '../config.js';
import { goldDrop } from '../data/shop.js';
import { bus } from '../core/EventBus.js';

const FONT = 'Trebuchet MS, Segoe UI, sans-serif';

/**
 * Sistema de combate: lanzamiento de habilidades (comprobaciones de
 * conocimiento, cooldown, GCD, maná, objetivo y alcance), cálculo de
 * daño, proyectiles, áreas, muerte de monstruos, XP y textos flotantes.
 */
export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.projectiles = [];
  }

  get state() { return this.scene.state; }
  get player() { return this.scene.player; }

  tryCastSlot(i) {
    const id = this.state.actionBar.slots[i];
    if (id) this.tryCast(id);
  }

  tryCast(id) {
    const ab = ABILITIES[id];
    const st = this.state;
    const now = performance.now();
    if (!ab || this.player.dead) return false;
    if (!st.known.has(id)) return this.fail('Aún no conoces esa habilidad');
    const cd = st.cooldownInfo(id, now);
    if (cd.remaining > 0) return cd.gcd ? false : this.fail('Esa habilidad aún no está lista');
    if (st.mana < ab.mana) return this.fail('No tienes suficiente maná');
    if (ab.kind === 'recruit') { const err = this.scene.army.recruitError(); if (err) return this.fail(err); }
    if (ab.kind === 'armybuff' && !this.scene.army.shadows.length) return this.fail('No tienes sombras en tu ejército');

    let target = null;
    if (ab.needsTarget || ab.kind === 'dash') {
      target = this.scene.getValidTarget() || this.scene.autoTarget(ab.range || 300);
      if (ab.needsTarget && !target) return this.fail('No tienes objetivo');
      if (target && ab.range && this.dist(this.player, target) > ab.range + 10) {
        if (ab.needsTarget) return this.fail('Fuera de alcance');
        target = null;
      }
      if (target) this.player.facing = target.x >= this.player.x ? 1 : -1;
    }

    st.mana -= ab.mana;
    st.startCooldown(id, now);
    st.lastCombatAt = now;
    this.execute(ab, target);
    bus.emit('ability:cast', id);
    return true;
  }

  fail(msg) { bus.emit('ui:error', msg); return false; }

  execute(ab, target) {
    const p = this.player;
    switch (ab.kind) {
      case 'melee':
        p.swing();
        if (ab.slow) { target.slowUntil = performance.now() + ab.slowMs; target.slowPct = ab.slow; }
        this.hitMob(target, ab);
        this.burst(target.x, target.y - 20, 0xffffff, 6);
        break;
      case 'projectile': {
        const img = this.scene.add.image(p.x, p.y - 30, 'fireball').setBlendMode('ADD').setScale(1.3);
        if (ab.projTint) img.setTint(ab.projTint);
        this.projectiles.push({ img, target, ab });
        break;
      }
      case 'nova':
        this.ring(p.x, p.y - 10, ab.radius, ab.color);
        for (const m of this.mobsInRadius(p.x, p.y, ab.radius)) {
          m.slowUntil = performance.now() + ab.slowMs; m.slowPct = ab.slow;
          this.hitMob(m, ab);
        }
        break;
      case 'heal': {
        const amount = this.healAmount(ab);
        this.state.heal(amount);
        this.float(p.x, p.y - 70, `+${amount}`, '#7dff6a', 20);
        this.burst(p.x, p.y - 30, ab.color, 12);
        break;
      }
      case 'dash': {
        const dir = target ? { x: target.x - p.x, y: target.y - p.y } : p.moveDir;
        p.startDash(dir.x, dir.y, target ? Math.min(ab.distanceMs, (this.dist(p, target) - 30) / 0.82) : ab.distanceMs);
        this.scene.time.delayedCall(ab.distanceMs + 20, () => {
          if (target && !target.dead && this.dist(p, target) < 80) { p.swing(); this.hitMob(target, ab); }
        });
        break;
      }
      case 'whirl':
        p.swing(true);
        this.ring(p.x, p.y - 10, ab.radius, 0xffffff);
        for (const m of this.mobsInRadius(p.x, p.y, ab.radius)) this.hitMob(m, ab);
        break;
      case 'meteor': {
        const tx = target.x, ty = target.y;
        const marker = this.scene.add.ellipse(tx, ty, ab.radius * 2, ab.radius * 0.9, 0xff5522, 0.25).setDepth(ty - 5);
        const rock = this.scene.add.image(tx - 160, ty - 420, 'fireball').setScale(3.2).setBlendMode('ADD').setDepth(1e5);
        this.scene.tweens.add({
          targets: rock, x: tx, y: ty - 10, duration: ab.delay, ease: 'Quad.In',
          onComplete: () => {
            rock.destroy(); marker.destroy();
            this.scene.cameras.main.shake(180, 0.008);
            this.ring(tx, ty, ab.radius, 0xff7a22);
            this.burst(tx, ty - 10, 0xff8a1f, 22);
            for (const m of this.mobsInRadius(tx, ty, ab.radius)) this.hitMob(m, ab);
          },
        });
        break;
      }
      case 'shield':
        this.state.absorb = this.healAmount(ab);
        this.state.absorbUntil = performance.now() + ab.duration;
        this.float(p.x, p.y - 70, `Escudo ${this.state.absorb}`, '#8fc8ff', 16);
        break;
      case 'buff':
        this.state.addBuff(ab, performance.now());
        this.float(p.x, p.y - 80, `${ab.icon} ${ab.name}`, '#ffe14d', 17);
        this.burst(p.x, p.y - 30, ab.color || 0xffffff, 16);
        break;
      case 'hot': {
        const total = this.healAmount(ab);
        this.state.hots = this.state.hots.filter((h) => h.id !== ab.id);
        this.state.hots.push({ id: ab.id, perSec: total / (ab.duration / 1000), until: performance.now() + ab.duration });
        this.float(p.x, p.y - 70, `${ab.icon} +${total}`, '#7dff6a', 17);
        this.burst(p.x, p.y - 30, ab.color, 12);
        break;
      }
      case 'recruit':
        this.ring(p.x, p.y - 10, 220, 0x7a5cff);
        this.scene.army.recruit();
        break;
      case 'armybuff':
        this.scene.army.fury(ab.duration * (1 + 0.1 * (this.state.rank(ab.id) - 1)));
        this.float(p.x, p.y - 80, `${ab.icon} ${ab.name}`, '#b9a6ff', 18);
        this.ring(p.x, p.y - 10, 160, 0x7a5cff);
        break;
      case 'taunt':
        this.ring(p.x, p.y - 10, ab.radius, ab.color);
        this.scene.cameras.main.shake(120, 0.004);
        for (const m of this.mobsInRadius(p.x, p.y, ab.radius)) {
          m.aggro();
          m.aggroTarget = null;
          this.float(m.x, m.y - m.height - 24, '¡Provocado!', '#ffb84d', 13);
          this.hitMob(m, ab);
        }
        break;
    }
  }

  calcDamage(ab) {
    const s = this.state.stats;
    let dmg = (ab.base || 0) + (ab.ap || 0) * s.attackPower + (ab.sp || 0) * s.spellPower + (ab.weapon || 0) * s.weaponDmg;
    dmg *= this.state.power(ab.id) * s.damageMult * (0.9 + Math.random() * 0.2);
    const crit = Math.random() * 100 < s.crit + (ab.critBonus || 0);
    if (crit) dmg *= 1.75;
    return { amount: Math.max(1, Math.round(dmg)), crit };
  }

  /** Curación / absorción según rango y bono de curación de la clase. */
  healAmount(ab) {
    const s = this.state.stats;
    return Math.round((ab.base + (ab.sp || 0) * s.spellPower) * this.state.power(ab.id) * s.healMult);
  }

  hitMob(mob, ab) {
    if (!mob || mob.dead) return;
    const { amount, crit } = this.calcDamage(ab);
    const died = mob.takeDamage(amount);
    this.float(mob.x + (Math.random() - 0.5) * 20, mob.y - mob.height - 10, crit ? `${amount}!` : `${amount}`, crit ? '#ffe14d' : '#ffffff', crit ? 26 : 18);
    if (died) this.killMob(mob);
  }

  /** Golpe de una sombra aliada (el jugador se lleva la XP y el botín). */
  shadowHitMob(shadow, mob, dmg) {
    if (!mob || mob.dead) return;
    const died = mob.takeDamage(dmg, shadow);
    this.float(mob.x + (Math.random() - 0.5) * 24, mob.y - mob.height - 6, `${dmg}`, '#7dffe0', 14);
    if (died) this.killMob(mob);
  }

  /** Proyectil de un monstruo a distancia (jefes espectrales) contra el jugador o una sombra. */
  enemyBolt(mob, tgt) {
    const img = this.scene.add.image(mob.x, mob.y + (mob.curOy || 0) - mob.height * 0.6, 'fireball')
      .setBlendMode('ADD').setTint(mob.opts.auraColor ?? 0xff5a4d).setScale(mob.boss ? 1.8 : 1.2);
    this.projectiles.push({ img, target: tgt, ab: { speed: 430, color: mob.opts.auraColor ?? 0xff5a4d }, onHit: (t) => this.mobAttack(mob, t) });
  }

  /** Golpe en área de un monstruo: daña al jugador y a las sombras dentro del radio. */
  mobArea(mob, x, y, r) {
    this.ring(x, y, r, mob.opts.auraColor ?? 0xff7a5a);
    const p = this.player;
    if (!p.dead && Math.hypot(p.x - x, p.y - y) <= r) this.mobHitsPlayer(mob);
    for (const sh of [...this.scene.army.shadows]) {
      if (!sh.dead && Math.hypot(sh.x - x, sh.y - y) <= r) this.mobAttack(mob, sh);
    }
  }

  /** Proyectil de llama turquesa de un espectro a distancia. */
  shadowBolt(shadow, mob, dmg) {
    const img = this.scene.add.image(shadow.x, shadow.y - 40, 'fireball').setBlendMode('ADD').setTint(0x5ff2d6).setScale(1.1);
    this.projectiles.push({ img, target: mob, ab: { speed: 560, color: 0x5ff2d6 }, onHit: (t) => this.shadowHitMob(shadow, t, dmg) });
  }

  /** Ataque de un monstruo a su objetivo (jugador o sombra). */
  mobAttack(mob, tgt) {
    if (!tgt || tgt === this.player || !tgt.isShadow) return this.mobHitsPlayer(mob);
    const dmg = Math.round(mob.damage * (0.85 + Math.random() * 0.3) * (1 - tgt.dr));
    this.float(tgt.x, tgt.y - tgt.height - 6, `-${dmg}`, '#ff8a7a', 13);
    tgt.takeDamage(dmg, mob);
  }

  killMob(mob) {
    mob.die();
    bus.emit('mob:killed', mob);
    this.scene.army.onMobKilled(mob);
    const xp = xpFromMob(mob.level, this.state.level, mob.elite);
    if (xp > 0) this.float(mob.x, mob.y - 40, `+${xp} XP`, '#c88bff', 16);
    this.state.gainXp(xp);
    const gold = goldDrop(mob.level, mob.elite, mob.boss);
    this.state.addGold(gold);
    this.float(mob.x + 24, mob.y - 20, `+${gold} 🪙`, '#ffd34d', 15);
    this.scene.loot.dropFrom(mob);
    if (this.scene.target === mob) this.scene.setTarget(null);
    if (mob.opts.noRespawn) this.scene.dungeons.onMobKilled(mob);   // las mazmorras se reinician al entrar
    else this.scene.time.delayedCall(MOB_RESPAWN_MS, () => mob.respawn());
  }

  mobHitsPlayer(mob) {
    const st = this.state;
    if (this.player.dead) return;
    let dmg = Math.round(mob.damage * (0.85 + Math.random() * 0.3) * (1 - st.stats.damageReduction));
    st.lastCombatAt = performance.now();
    if (st.absorb > 0) {
      const absorbed = Math.min(st.absorb, dmg);
      st.absorb -= absorbed; dmg -= absorbed;
      if (absorbed) this.float(this.player.x, this.player.y - 60, `(${absorbed} absorbido)`, '#8fc8ff', 13);
    }
    if (dmg <= 0) return;
    st.hp -= dmg;
    this.player.flash();
    this.float(this.player.x + (Math.random() - 0.5) * 16, this.player.y - 64, `-${dmg}`, '#ff5a4d', 18);
    if (!this.scene.target) this.scene.setTarget(mob);
    if (st.hp <= 0) this.scene.playerDie();
  }

  update(now, dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      const t = pr.target;
      if (!t || t.dead) { pr.img.destroy(); this.projectiles.splice(i, 1); continue; }
      const tx = t.x, ty = t.y - (t.height || 50) * 0.5;
      const dx = tx - pr.img.x, dy = ty - pr.img.y;
      const d = Math.hypot(dx, dy);
      const step = pr.ab.speed * dt;
      pr.img.angle += 12;
      pr.img.setDepth(pr.img.y + 40);
      if (d <= step + 6) {
        this.burst(tx, ty, pr.ab.color, 10);
        if (pr.onHit) pr.onHit(t); else this.hitMob(t, pr.ab);
        pr.img.destroy();
        this.projectiles.splice(i, 1);
      } else {
        pr.img.x += (dx / d) * step; pr.img.y += (dy / d) * step;
      }
    }
  }

  // ---------------- utilidades / efectos ----------------
  dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  mobsInRadius(x, y, r) {
    return this.scene.mobs.filter((m) => !m.dead && Math.hypot(m.x - x, m.y - y) <= r);
  }

  float(x, y, text, color, size = 18) {
    const t = this.scene.add.text(x, y, text, {
      fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color, stroke: '#1a1020', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(2e6);
    t.setScale(0.4);
    this.scene.tweens.add({ targets: t, scale: 1, duration: 120, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: t, y: y - 42, alpha: 0, delay: 250, duration: 750, ease: 'Quad.Out', onComplete: () => t.destroy() });
  }

  burst(x, y, color, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = 20 + Math.random() * 30;
      const s = this.scene.add.image(x, y, 'spark').setTint(color).setBlendMode('ADD').setDepth(2e6 - 1);
      this.scene.tweens.add({ targets: s, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, alpha: 0, scale: 0.3, duration: 380 + Math.random() * 200, onComplete: () => s.destroy() });
    }
  }

  ring(x, y, radius, color) {
    const g = this.scene.add.ellipse(x, y, radius * 2, radius).setStrokeStyle(4, color, 1).setDepth(y + 1);
    const fill = this.scene.add.ellipse(x, y, radius * 2, radius, color, 0.25).setDepth(y);
    this.scene.tweens.add({
      targets: [g, fill], scale: { from: 0.1, to: 1 }, alpha: { from: 1, to: 0 }, duration: 400, ease: 'Quad.Out',
      onComplete: () => { g.destroy(); fill.destroy(); },
    });
  }
}
