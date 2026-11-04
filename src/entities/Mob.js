import Phaser from 'phaser';
import { levelColor } from '../systems/Progression.js';

/**
 * Monstruo con IA de estados sencilla:
 *   idle (deambula) -> chase (persigue y ataca) -> leash (vuelve a casa y se cura)
 */
export class Mob {
  /**
   * opts (mazmorras): { boss, tint, name, noRespawn, dungeon, loot: { minRarity, bossRarity } }
   */
  constructor(scene, def, level, x, y, elite = false, opts = {}) {
    this.scene = scene;
    this.def = def;
    this.level = level;
    this.elite = elite || !!opts.boss;
    this.boss = !!opts.boss;
    this.opts = opts;
    this.baseTint = opts.tint ?? def.tint ?? 0xffffff;
    this.texScale = def.texScale || 1;          // los espectros usan texturas a doble resolución
    this.lift = 0;                              // altura extra (picado del grifo)
    this.nextHealAt = 0;
    this.leashDist = this.boss ? 800 : 420;
    this.home = { x, y };
    const hpMult = this.boss ? 9 : elite ? 3 : 1;
    const dmgMult = this.boss ? 2 : elite ? 1.6 : 1;
    this.maxHp = Math.round((def.hp + def.hpPerLvl * (level - 1)) * hpMult);
    this.hp = this.maxHp;
    this.damage = (def.dmg + def.dmgPerLvl * (level - 1)) * dmgMult;
    this.name = opts.name || (elite ? `${def.name} Alfa` : def.name);
    this.state = 'idle';
    this.dead = false;
    this.attackReadyAt = 0;
    this.slowUntil = 0;
    this.slowPct = 0;
    this.wanderTarget = null;
    this.nextWanderAt = 0;
    this.lunge = 0;
    this.facing = 1;
    this.asleep = false;
    this.showPlate = false;

    this.phys = scene.physics.add.image(x, y, 'shadow');
    this.phys.mob = this;
    this.scale = this.boss ? (def.bossScale || 2.3) : this.elite ? 1.4 : 1;
    this.phys.setScale(def.fly ? 2.4 : this.scale);

    // Jefes espectrales: aura del color de la mazmorra y, el grifo, alas animadas
    if (opts.auraColor != null) {
      this.aura = scene.add.image(x, y, 'glow').setTint(opts.auraColor).setBlendMode('ADD').setAlpha(0.5);
    }
    if (def.fly) {
      this.wingBack = scene.add.image(x, y, 'spec_griffin_wing').setOrigin(0.12, 0.85).setTint(this.baseTint).setAlpha(0.85);
      this.wingFront = scene.add.image(x, y, 'spec_griffin_wing').setOrigin(0.12, 0.85).setTint(this.baseTint);
    }
    this.sprite = scene.add.image(x, y, def.texture).setOrigin(0.5, 0.95).setScale(this.scale * this.texScale);
    this.bar = scene.add.graphics().setVisible(false);
    this.label = scene.add.text(x, y, `${this.name}  ${level}`, {
      fontFamily: 'Trebuchet MS, Segoe UI, sans-serif', fontSize: '12px', fontStyle: 'bold',
      color: this.elite ? '#ffd34d' : '#ffffff', stroke: '#1a1020', strokeThickness: 3,
    }).setOrigin(0.5, 1).setVisible(false);
  }

  get x() { return this.phys.x; }
  get y() { return this.phys.y; }
  get height() { return this.sprite.displayHeight; }

  /** Ajustes del cuerpo (después de añadirlo al grupo de físicas). */
  setupBody() {
    this.phys.body.setSize(22, 10);
    this.phys.setCollideWorldBounds(true);
    if (this.def.fly) this.phys.body.checkCollision.none = true;   // vuela por encima de muros
  }

  /** Partes visuales extra (aura, alas). */
  extras() { return [this.aura, this.wingBack, this.wingFront].filter(Boolean); }

  sleep() {
    if (this.asleep || this.dead) return;
    this.asleep = true;
    this.phys.body.setVelocity(0, 0);
    this.sprite.setVisible(false);          // fuera de rango: no se dibuja
    this.phys.setVisible(false);
    this.extras().forEach((o) => o.setVisible(false));
    this.bar.setVisible(false);
    this.label.setVisible(false);
  }

  update(now, dt, player) {
    if (this.dead) return;
    if (this.asleep) { this.sprite.setVisible(true); this.phys.setVisible(true); this.extras().forEach((o) => o.setVisible(true)); }
    this.asleep = false;
    const body = this.phys.body;
    // Objetivo: el jugador o una sombra del ejército del mago (la que le haya atacado)
    if (this.aggroTarget && this.aggroTarget.dead) this.aggroTarget = null;
    const tgt = this.aggroTarget || player;
    const dx = tgt.x - this.x, dy = tgt.y - this.y;
    const dist = Math.hypot(dx, dy);
    const pDist = Math.hypot(player.x - this.x, player.y - this.y);
    const homeDist = Math.hypot(this.home.x - this.x, this.home.y - this.y);
    const slow = now < this.slowUntil ? 1 - this.slowPct : 1;
    let speed = this.def.speed * slow;
    let vx = 0, vy = 0;

    switch (this.state) {
      case 'idle':
        if (!player.dead && pDist < this.def.aggro) { this.aggro(); break; }
        {
          const sh = this.scene.army?.nearestShadow(this.x, this.y, this.def.aggro * 0.7);
          if (sh) { this.aggroTarget = sh; this.aggro(); break; }
        }
        if (now > this.nextWanderAt) {
          this.nextWanderAt = now + 2500 + Math.random() * 4000;
          this.wanderTarget = Math.random() < 0.6
            ? { x: this.home.x + (Math.random() - 0.5) * 140, y: this.home.y + (Math.random() - 0.5) * 140 }
            : null;
        }
        if (this.wanderTarget) {
          const wx = this.wanderTarget.x - this.x, wy = this.wanderTarget.y - this.y;
          const wd = Math.hypot(wx, wy);
          if (wd > 6) { vx = (wx / wd) * speed * 0.4; vy = (wy / wd) * speed * 0.4; } else this.wanderTarget = null;
        }
        break;

      case 'chase':
        if ((player.dead && !this.aggroTarget) || homeDist > this.leashDist) { this.state = 'leash'; this.aggroTarget = null; break; }
        if (dist > this.def.range) {
          vx = (dx / dist) * speed; vy = (dy / dist) * speed;
        } else if (now >= this.attackReadyAt) {
          this.attackReadyAt = now + this.def.atkMs;
          this.attack(tgt);
        }
        // El fuego fatuo jefe se cura cada 5 s mientras combate
        if (this.def.selfHeal && this.boss && now > this.nextHealAt) {
          this.nextHealAt = now + 5000;
          const n = Math.round(this.maxHp * 0.04);
          this.hp = Math.min(this.maxHp, this.hp + n);
          this.scene.combat.float(this.x, this.y - this.height - 20, `+${n}`, '#7dff6a', 16);
        }
        break;

      case 'leash': {
        speed = this.def.speed * 1.6;
        const hx = this.home.x - this.x, hy = this.home.y - this.y;
        if (homeDist > 8) { vx = (hx / homeDist) * speed; vy = (hy / homeDist) * speed; }
        else { this.state = 'idle'; this.hp = this.maxHp; }
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.5 * dt);
        break;
      }
    }

    body.setVelocity(vx, vy);
    if (Math.abs(vx) > 1) this.facing = vx > 0 ? 1 : -1;
    else if (this.state === 'chase') this.facing = dx > 0 ? 1 : -1;

    // --- animación ---
    const t = now * 0.012 + this.home.x;
    const moving = Math.abs(vx) + Math.abs(vy) > 1;
    let sx = 1, sy = 1, oy = 0;
    if (this.def.anim === 'hop') {
      const h = moving ? Math.abs(Math.sin(t * 0.8)) : Math.abs(Math.sin(t * 0.25)) * 0.3;
      oy = -h * 8; sy = 1 + h * 0.12 - (1 - h) * 0.06; sx = 1 / sy;
    } else if (moving) {
      oy = -Math.abs(Math.sin(t)) * 3; this.sprite.angle = Math.sin(t) * 5;
    } else {
      sy = 1 + Math.sin(t * 0.3) * 0.02; this.sprite.angle = 0;
    }
    if (this.def.anim === 'float') { oy = -8 - Math.sin(t * 0.4) * 4; this.sprite.angle = 0; }
    if (this.def.anim === 'scuttle' && moving) { oy = -Math.abs(Math.sin(t * 2)) * 1.5; this.sprite.angle = 0; }
    if (this.def.fly) { oy = -40 - Math.sin(t * 0.35) * 6 + this.lift; this.sprite.angle = 0; }
    this.curOy = oy;
    const flip = this.def.facesLeft ? -this.facing : this.facing;
    const ts = this.scale * this.texScale;
    this.sprite.setScale(ts * sx * (flip < 0 ? -1 : 1), ts * sy);
    this.sprite.setPosition(this.x + this.facing * this.lunge * 10, this.y + oy);
    this.sprite.setDepth(this.y + (this.def.fly ? 400 : 0));
    this.phys.setDepth(this.y - 1).setAlpha(this.def.fly ? 0.7 : 1);
    this.sprite.setTint(now < this.slowUntil ? 0x9fd8ff : this.baseTint);
    if (this.aura) {
      this.aura.setPosition(this.x, this.y + oy - this.height * 0.45).setDepth(this.y - 2 + (this.def.fly ? 400 : 0))
        .setScale(this.scale * (this.def.fly ? 2.2 : 1.3) * (1 + Math.sin(t * 0.5) * 0.08));
    }
    if (this.def.fly) {
      const fx = flip < 0 ? -1 : 1, flap = Math.sin(t * (moving ? 1.1 : 0.6));
      const wx = this.x - fx * 8 * ts * 2, wy = this.y + oy - 46 * ts * 2;
      this.wingBack.setPosition(wx, wy).setScale(ts * fx, ts * (0.75 + flap * 0.35)).setAngle(-fx * (20 + flap * 12)).setDepth(this.y + 399);
      this.wingFront.setPosition(wx + fx * 6, wy + 4).setScale(ts * fx, ts * (0.8 - flap * 0.35)).setAngle(-fx * (6 - flap * 14)).setDepth(this.y + 401);
    }

    this.drawPlate(player);
  }

  drawPlate(player) {
    const show = this.showPlate || this.state === 'chase' || this.hp < this.maxHp;
    this.bar.setVisible(show);
    this.label.setVisible(show);
    if (!show) return;
    const top = this.y + Math.min(0, this.curOy || 0) - this.height - 6;
    this.label.setPosition(this.x, top - 7).setDepth(1e6);
    this.label.setColor(this.elite ? '#ffd34d' : levelColor(this.level, player.state.level));
    const w = this.boss ? 90 : 46, h = this.boss ? 8 : 6;
    this.bar.clear().setDepth(1e6);
    this.bar.fillStyle(0x1a1020, 0.9).fillRoundedRect(this.x - w / 2 - 1, top - 4, w + 2, h + 2, 3);
    this.bar.fillStyle(0xe8413a, 1).fillRoundedRect(this.x - w / 2, top - 3, Math.max(1, w * (this.hp / this.maxHp)), h, 2);
  }

  /** Ataque según el tipo del monstruo (def.attack). */
  attack(tgt) {
    const c = this.scene.combat;
    switch (this.def.attack) {
      case 'ranged':
        c.enemyBolt(this, tgt);
        break;
      case 'cleave':
        this.scene.tweens.add({ targets: this, lunge: { from: 0, to: 1 }, duration: 140, yoyo: true });
        c.mobArea(this, tgt.x, tgt.y, this.boss ? 95 : 70);
        break;
      case 'dive': {
        const tx = tgt.x, ty = tgt.y;
        this.scene.tweens.add({
          targets: this, lift: { from: 0, to: 34 }, duration: 260, yoyo: true, ease: 'Quad.Out',
          onYoyo: () => c.mobArea(this, tx, ty, 110),
        });
        break;
      }
      default:
        this.scene.tweens.add({ targets: this, lunge: { from: 0, to: 1 }, duration: 110, yoyo: true });
        c.mobAttack(this, tgt);
    }
  }

  aggro() {
    if (this.dead) return;
    if (this.state !== 'chase') this.attackReadyAt = performance.now() + 400;
    this.state = 'chase';
  }

  /** source: null = jugador, o la sombra que ha golpeado. */
  takeDamage(n, source = null) {
    this.hp -= n;
    if (source && (!this.aggroTarget || Math.random() < 0.3)) this.aggroTarget = source;
    else if (!source && this.aggroTarget && Math.random() < 0.2) this.aggroTarget = null;
    this.aggro();
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => this.sprite.setTint(this.baseTint));
    return this.hp <= 0;
  }

  die() {
    this.dead = true;
    this.state = 'idle';
    this.phys.disableBody(true, true);
    this.bar.setVisible(false);
    this.label.setVisible(false);
    if (this.extras().length) this.scene.tweens.add({ targets: this.extras(), alpha: 0, duration: 450 });
    this.scene.tweens.add({
      targets: this.sprite, alpha: 0, scaleY: 0.2 * this.texScale, angle: 90 * this.facing, duration: 450, ease: 'Quad.In',
      onComplete: () => this.sprite.setVisible(false),
    });
  }

  respawn() {
    this.dead = false;
    this.aggroTarget = null;
    this.asleep = false;
    this.hp = this.maxHp;
    this.state = 'idle';
    this.phys.enableBody(true, this.home.x, this.home.y, true, true);
    this.sprite.setVisible(true).setAlpha(0).setAngle(0);
    this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 600 });
    this.extras().forEach((o) => o.setVisible(true));
    if (this.extras().length) this.scene.tweens.add({ targets: this.extras(), alpha: { from: 0, to: this.aura ? 0.5 : 1 }, duration: 600 });
  }

  /** Para hacer clic sobre el monstruo. */
  containsPoint(px, py) {
    const halfW = this.sprite.displayWidth * 0.5 * Math.sign(1);
    const oy = Math.min(0, this.curOy || 0);
    return Math.abs(px - this.x) < Math.abs(halfW) + 4 && py < this.y + 8 && py > this.y + oy - this.height - 4;
  }
}

export const dist = (a, b) => Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
