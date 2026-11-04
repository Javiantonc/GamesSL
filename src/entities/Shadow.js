import { levelColor } from '../systems/Progression.js';

export const SHADOW_GLOW = 0x5ff2d6;     // llama turquesa de los espectros
const TEX_SCALE = 0.5;                   // las texturas de espectro son de doble resolución

/**
 * Tipos de espectro (diseños originales). Cada monstruo reclutado se
 * convierte en el espectro de su tipo; los jefes, en el Grifo.
 *  role: tank (provoca), melee, ranged (proyectiles), healer (cura), aoe (área)
 */
export const SPECTRES = {
  warrior: { name: 'Guerrero Espectral', icon: '⚔️', tex: 'spec_warrior', role: 'tank',   hp: 1.7, dmg: 0.85, speed: 1.0,  range: 42,  atkMs: 1200, float: true },
  wolf:    { name: 'Lobo Espectral',     icon: '🐺', tex: 'spec_wolf',    role: 'melee',  hp: 0.9, dmg: 1.25, speed: 1.45, range: 40,  atkMs: 850 },
  caster:  { name: 'Hechicero Espectral', icon: '🔮', tex: 'spec_caster', role: 'ranged', hp: 0.7, dmg: 1.15, speed: 1.0,  range: 250, atkMs: 1500, float: true },
  wisp:    { name: 'Fuego Fatuo',        icon: '✨', tex: 'spec_wisp',    role: 'healer', hp: 0.6, dmg: 0.45, speed: 1.15, range: 220, atkMs: 2200, float: true },
  griffin: { name: 'Grifo Espectral',    icon: '🦉', tex: 'spec_griffin', role: 'aoe',    hp: 1.0, dmg: 1.0,  speed: 1.2,  range: 80,  atkMs: 1700, fly: true },
};
export const SPECTRE_OF_MOB = {
  goblin: 'warrior', wolf: 'wolf', skeleton: 'caster', slime: 'wisp',
  polarbear: 'warrior', frostSpider: 'wolf', frostSkeleton: 'caster',
  // Jefes espectrales de las mazmorras: al reclutarlos obtienes su propio espectro
  spectre_warrior: 'warrior', spectre_wolf: 'wolf', spectre_caster: 'caster', spectre_wisp: 'wisp', spectre_griffin: 'griffin',
};

/**
 * Espectro aliado del Mago.
 * IA: sigue al jugador en formación, ataca a su objetivo (o a quien le ataque)
 * según su rol, y se teletransporta a su lado si se queda muy atrás.
 */
export class Shadow {
  constructor(scene, army, src, index) {
    this.scene = scene;
    this.army = army;
    this.def = src.def;
    this.elite = src.elite;
    this.boss = src.boss;
    this.index = index;
    this.isShadow = true;
    this.dead = false;
    this.type = SPECTRE_OF_MOB[this.def.id] || (this.boss ? 'griffin' : 'warrior');
    this.spec = SPECTRES[this.type];
    this.icon = this.spec.icon;
    this.name = `${this.spec.name}${this.boss ? ' (jefe)' : this.elite ? ' (élite)' : ''}`;

    const st = scene.state;
    const pw = st.power('shadowRecruit');
    const lvl = st.level;
    const mult = this.boss ? 5 : this.elite ? 2.2 : 1;
    this.level = lvl;
    this.maxHp = Math.round((40 + 16 * (lvl - 1)) * this.spec.hp * mult * pw);
    this.hp = this.maxHp;
    this.baseDmg = (6 + 2 * (lvl - 1)) * this.spec.dmg * (1 + st.stats.spellPower / 300)
      * (this.boss ? 2.5 : this.elite ? 1.6 : 1) * pw;
    this.dr = this.spec.role === 'tank' ? 0.4 : 0.2;
    this.speed = Math.max(170, 150 * this.spec.speed);
    this.scale = this.boss ? (this.spec.fly ? 1.2 : 1.7) : this.elite ? 1.3 : 1;
    this.target = null;
    this.attackReadyAt = 0;
    this.lunge = 0;
    this.lift = 0;               // altura extra (picado del grifo)
    this.facing = 1;
    this.nextSmoke = 0;

    this.phys = scene.physics.add.image(src.x, src.y, 'shadow').setScale(this.spec.fly ? 2 : this.scale);
    scene.shadowGroup.add(this.phys);
    this.phys.body.setSize(20, 10);
    this.phys.setCollideWorldBounds(true);
    if (this.spec.fly) this.phys.body.checkCollision.none = true;   // vuela por encima de todo
    this.aura = scene.add.image(src.x, src.y, 'glow').setTint(SHADOW_GLOW).setBlendMode('ADD').setAlpha(0.45);
    if (this.spec.fly) {
      this.wingBack = scene.add.image(src.x, src.y, 'spec_griffin_wing').setOrigin(0.12, 0.85).setTint(0x8fa3b8);
      this.wingFront = scene.add.image(src.x, src.y, 'spec_griffin_wing').setOrigin(0.12, 0.85);
    }
    this.sprite = scene.add.image(src.x, src.y, this.spec.tex).setOrigin(0.5, 0.95);
    this.bar = scene.add.graphics();

    // Aparición: se alza desde el suelo
    this.rise = 0;
    scene.tweens.add({ targets: this, rise: 1, duration: 560, ease: 'Back.Out' });
  }

  get x() { return this.phys.x; }
  get y() { return this.phys.y; }
  get height() { return this.sprite.displayHeight; }

  /** Elige a quién atacar: el objetivo del jugador, o enemigos que estén peleando cerca. */
  pickTarget(player) {
    const s = this.scene;
    const near = (m, r) => m && !m.dead && Math.hypot(m.x - player.x, m.y - player.y) < r;
    if (near(this.target, 520)) return this.target;
    const pt = s.getValidTarget();
    if (near(pt, 480)) return pt;
    let best = null, bd = 300;
    for (const m of s.mobs) {
      if (m.dead || m.asleep || m.state !== 'chase') continue;
      const d = Math.hypot(m.x - player.x, m.y - player.y);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }

  update(now, dt, player, total) {
    if (this.dead) return;
    const body = this.phys.body;
    const fury = this.army.furyUntil > now;
    const mult = fury ? this.army.furyMult : 1;
    const role = this.spec.role;
    let vx = 0, vy = 0;

    if (Math.hypot(player.x - this.x, player.y - this.y) > 640) this.teleportNear(player.x, player.y);

    this.target = player.dead ? null : this.pickTarget(player);
    const t = this.target;
    const speed = this.speed * (fury ? 1.3 : 1);

    // El fuego fatuo cura periódicamente aunque no haya combate si alguien está herido
    if (role === 'healer' && now >= this.attackReadyAt) this.tryHeal(now, mult);

    if (t) {
      const dx = t.x - this.x, dy = t.y - this.y, d = Math.hypot(dx, dy);
      const reach = this.spec.range + 6;
      const keepAway = role === 'ranged' || role === 'healer';
      if (d > reach) { vx = (dx / d) * speed; vy = (dy / d) * speed; }
      else if (keepAway && d < reach * 0.45) { vx = -(dx / d) * speed * 0.6; vy = -(dy / d) * speed * 0.6; }
      if (d <= reach && now >= this.attackReadyAt) {
        this.attackReadyAt = now + this.spec.atkMs * (fury ? 0.75 : 1);
        this.attack(t, Math.round(this.baseDmg * mult * (0.85 + Math.random() * 0.3)));
      }
      this.facing = dx > 0 ? 1 : -1;
    } else {
      // Formación en anillo alrededor del jugador
      const ang = (this.index / Math.max(1, total)) * Math.PI * 2 + now * 0.0002;
      const r = (this.spec.fly ? 95 : 58) + (this.index % 2) * 26;
      const fx = player.x + Math.cos(ang) * r, fy = player.y + Math.sin(ang) * r * 0.6;
      const dx = fx - this.x, dy = fy - this.y, d = Math.hypot(dx, dy);
      if (d > 14) { const sp = Math.min(speed, d * 4); vx = (dx / d) * sp; vy = (dy / d) * sp; }
      if (Math.abs(vx) > 5) this.facing = vx > 0 ? 1 : -1;
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.04 * dt);
    }
    body.setVelocity(vx, vy);

    // Anti-atascos: si quiere moverse pero apenas avanza (muro, árbol), reaparece junto al jugador
    const wants = Math.abs(vx) + Math.abs(vy) > 40;
    if (!this.lastPos) this.lastPos = { x: this.x, y: this.y, t: now };
    if (now - this.lastPos.t > 1200) {
      const moved = Math.hypot(this.x - this.lastPos.x, this.y - this.lastPos.y);
      if (wants && moved < 20 && Math.hypot(player.x - this.x, player.y - this.y) > 90) this.teleportNear(player.x, player.y);
      this.lastPos = { x: this.x, y: this.y, t: now };
    }
    this.animate(now, vx, vy, fury);
  }

  /** Ataque según el rol. */
  attack(t, dmg) {
    const c = this.scene.combat;
    switch (this.spec.role) {
      case 'tank':
        this.scene.tweens.add({ targets: this, lunge: { from: 0, to: 1 }, duration: 120, yoyo: true });
        c.shadowHitMob(this, t, dmg);
        if (!t.dead && Math.random() < 0.75) t.aggroTarget = this;   // provoca: el enemigo va a por él
        break;
      case 'melee':
        this.scene.tweens.add({ targets: this, lunge: { from: 0, to: 1 }, duration: 90, yoyo: true });
        c.shadowHitMob(this, t, dmg);
        break;
      case 'ranged':
      case 'healer':
        c.shadowBolt(this, t, dmg);
        break;
      case 'aoe': {
        // Picado: sube, cae sobre el objetivo y golpea en área
        const tx = t.x, ty = t.y;
        this.scene.tweens.add({
          targets: this, lift: { from: 0, to: 26 }, duration: 220, yoyo: true, ease: 'Quad.Out',
          onYoyo: () => {
            c.ring(tx, ty, 95, SHADOW_GLOW);
            c.burst(tx, ty - 10, SHADOW_GLOW, 12);
            for (const m of c.mobsInRadius(tx, ty, 95)) c.shadowHitMob(this, m, dmg);
          },
        });
        break;
      }
    }
  }

  /** Fuego fatuo: cura al jugador y a los espectros heridos cercanos. */
  tryHeal(now, mult) {
    const s = this.scene, st = s.state, p = s.player;
    const pw = st.power('shadowRecruit') * mult;
    let healed = false;
    if (!p.dead && st.hp < st.stats.maxHp && Math.hypot(p.x - this.x, p.y - this.y) < 260) {
      const n = Math.round(st.stats.maxHp * 0.03 * pw);
      st.heal(n);
      s.combat.float(p.x, p.y - 70, `+${n}`, '#7dffe0', 14);
      healed = true;
    }
    for (const o of this.army.shadows) {
      if (o.dead || o.hp >= o.maxHp || Math.hypot(o.x - this.x, o.y - this.y) > 260) continue;
      o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.06 * pw);
      healed = true;
    }
    if (healed) {
      this.attackReadyAt = now + this.spec.atkMs;
      s.combat.ring(this.x, this.y - 10, 120, SHADOW_GLOW);
    }
  }

  animate(now, vx, vy, fury) {
    const tt = now * 0.012 + this.index * 7;
    const moving = Math.abs(vx) + Math.abs(vy) > 1;
    const fly = this.spec.fly, flt = this.spec.float;
    let oy = 0, sy = 1, angle = 0;
    if (fly) oy = -34 - Math.sin(tt * 0.35) * 5 + this.lift;
    else if (flt) { oy = -6 - Math.sin(tt * 0.4) * 3; sy = 1 + Math.sin(tt * 0.8) * 0.03; angle = moving ? Math.sign(vx) * 6 : 0; }
    else if (moving) { oy = -Math.abs(Math.sin(tt)) * 3; angle = Math.sin(tt) * 5; }
    else sy = 1 + Math.sin(tt * 0.3) * 0.03;

    const s = TEX_SCALE * this.scale * this.rise;
    const fx = this.facing < 0 ? -1 : 1;
    this.sprite.setScale(s * fx, s * sy).setAngle(angle)
      .setPosition(this.x + this.facing * this.lunge * 10, this.y + oy).setDepth(this.y + (fly ? 400 : 0));
    this.phys.setDepth(this.y - 1).setAlpha(fly ? 0.7 : 1);
    if (fly) {
      const flap = Math.sin(tt * (moving ? 1.2 : 0.7));
      const wx = this.x - fx * 8 * s * 2, wy = this.y + oy - 46 * s * 2;
      this.wingBack.setPosition(wx, wy).setScale(s * fx, s * (0.75 + flap * 0.35)).setAngle(-fx * (20 + flap * 12)).setDepth(this.y + 399);
      this.wingFront.setPosition(wx + fx * 6, wy + 4).setScale(s * fx, s * (0.8 - flap * 0.35)).setAngle(-fx * (6 - flap * 14)).setDepth(this.y + 401);
    }
    this.aura.setPosition(this.x, this.y + oy - this.height * 0.45).setDepth(this.y - 2 + (fly ? 400 : 0))
      .setScale(this.scale * (fly ? 2.2 : 1.1) * (1 + Math.sin(tt * 0.5) * 0.08) * (fury ? 1.4 : 1))
      .setAlpha((fury ? 0.75 : 0.42) * this.rise);

    if (now > this.nextSmoke) {
      this.nextSmoke = now + 240 + Math.random() * 200;
      const sm = this.scene.add.image(this.x + (Math.random() - 0.5) * 24 * this.scale, this.y + oy - Math.random() * this.height * 0.6, 'spark')
        .setTint(SHADOW_GLOW).setBlendMode('ADD').setAlpha(0.8).setDepth(this.y + 1 + (fly ? 400 : 0));
      this.scene.tweens.add({ targets: sm, y: sm.y - 30, alpha: 0, scale: 0.3, duration: 700, onComplete: () => sm.destroy() });
    }

    this.bar.clear().setDepth(1e6);
    if (this.hp < this.maxHp) {
      const w = 34 * this.scale, top = this.y + oy - this.height - 6;
      this.bar.fillStyle(0x0d1626, 0.9).fillRoundedRect(this.x - w / 2 - 1, top - 1, w + 2, 6, 3);
      this.bar.fillStyle(0x5ff2d6, 1).fillRoundedRect(this.x - w / 2, top, Math.max(1, w * (this.hp / this.maxHp)), 4, 2);
    }
  }

  teleportNear(x, y) {
    const a = Math.random() * Math.PI * 2;
    this.phys.body.reset(x + Math.cos(a) * 50, y + Math.sin(a) * 30);
    this.scene.combat.burst(this.phys.x, this.phys.y - 20, SHADOW_GLOW, 8);
  }

  takeDamage(n, attacker) {
    if (this.dead) return;
    this.hp -= n;
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => !this.dead && this.sprite.clearTint());
    if (attacker && !this.target) this.target = attacker;
    if (this.hp <= 0) this.die();
  }

  parts() { return [this.sprite, this.aura, this.wingBack, this.wingFront].filter(Boolean); }

  die() {
    this.dead = true;
    this.phys.disableBody(true, true);
    this.bar.destroy();
    this.scene.combat.burst(this.x, this.y - 20, SHADOW_GLOW, 14);
    this.scene.tweens.add({
      targets: this.parts(), alpha: 0, duration: 500,
      onComplete: () => { this.parts().forEach((o) => o.destroy()); this.phys.destroy(); },
    });
    this.army.onShadowDied(this);
  }

  /** Despide al espectro sin animación de muerte (al cambiar de clase). */
  dismiss() {
    this.dead = true;
    this.bar.destroy();
    this.scene.tweens.add({
      targets: this.parts(), alpha: 0, duration: 400,
      onComplete: () => { this.parts().forEach((o) => o.destroy()); this.phys.destroy(); },
    });
  }

  levelColor(playerLevel) { return levelColor(this.level, playerLevel); }
}
