// Combate: habilidades, lanzamientos, ataque automático, daño, botín,
// proyectiles y efectos visuales.
import * as THREE from 'three';
import { GCD, mobXp } from './data/classes.js';
import { MOBS } from './data/mobs.js';
import { makeItem, rollRarity } from './data/items.js';
import { G, glow } from './gfx.js';
import { FLASH_MAT } from './world/models.js';

const v3 = new THREE.Vector3();

export class Combat {
  constructor(g) {
    this.g = g;
    this.fx = [];
    this.proj = [];
    this.cast = null;      // { ab, start, end, target }
    this.autoOn = false;
    this.swingAt = 0;
    this.lastCombat = -99;
  }
  get p() { return this.g.pl; }

  /* ------------------------------------------------------- utilidades */
  abilities() {
    return this.p.C.abilities;
  }
  abilityById(id) { return this.abilities().find((a) => a.id === id); }
  inCombat(t) { return t - this.lastCombat < 5; }
  distTo(m) { return Math.hypot(m.pos.x - this.g.ppos.x, m.pos.z - this.g.ppos.z) - m.r; }
  validTarget(m) { return m && !m.dead && m.dungeon === this.g.dungeonTier; }
  scaled(ab) {
    const p = this.p;
    let base = ab.power * (1 + (p.level - 1) * 0.1) + (ab.coef || 0) * p.power();
    if (ab.kind === 'melee' || ab.kind === 'finisher' || ab.kind === 'dash') base += p.wdmg * 0.6;
    return base;
  }

  /* -------------------------------------------------------- habilidades */
  /** Intenta usar una habilidad. Devuelve true si empezó. */
  use(id) {
    const g = this.g, p = this.p, t = g.now;
    const ab = this.abilityById(id);
    if (!ab || p.dead) return false;
    const err = (msg) => { g.ui.error(msg); return false; };
    if (p.level < ab.lvl) return err(`Se aprende en el nivel ${ab.lvl}`);
    if (this.cast) return err('Ya estás lanzando un hechizo');
    if (t < p.gcdUntil) return false;
    if ((p.cds[ab.id] || 0) > t) return err('Aún no está lista');
    if (ab.cost > 0 && p.res < ab.cost) return err(`No tienes suficiente ${p.C.resName.toLowerCase()}`);
    const needsTarget = ['melee', 'finisher', 'bolt', 'dot', 'dash', 'shadowstep', 'meteor'].includes(ab.kind);
    const tg = g.target;
    if (needsTarget) {
      if (!this.validTarget(tg)) return err('No tienes objetivo');
      const d = this.distTo(tg);
      if (ab.range && d > ab.range) return err('Estás demasiado lejos');
      if (ab.minRange && d < ab.minRange) return err('Estás demasiado cerca');
      if (ab.kind === 'finisher' && p.combo <= 0) return err('Necesitas puntos de combo');
    }
    p.gcdUntil = t + GCD;
    if (ab.cast) {
      if (g.moving) { p.gcdUntil = t; return err('No puedes lanzarlo mientras te mueves'); }
      this.cast = { ab, start: t, end: t + ab.cast, target: tg };
      g.hero.userData.anim.channel = true;
      return true;
    }
    this.execute(ab, tg);
    return true;
  }
  interrupt(reason) {
    if (!this.cast) return;
    this.cast = null;
    this.g.hero.userData.anim.channel = false;
    if (reason) this.g.ui.error(reason);
  }

  execute(ab, tg) {
    const g = this.g, p = this.p, t = g.now;
    if (ab.cost > 0) p.res -= ab.cost; else if (ab.cost < 0) p.res = Math.min(p.maxRes, p.res - ab.cost);
    if (ab.cd) p.cds[ab.id] = t + ab.cd;
    const A = g.hero.userData.anim;
    const amount = this.scaled(ab);
    const offensive = !['buff', 'shield', 'heal', 'hot', 'blink'].includes(ab.kind);
    if (offensive) this.lastCombat = t;
    switch (ab.kind) {
      case 'melee':
        A.swing = 1;
        this.faceTarget(tg);
        this.damageMob(tg, amount, { stun: ab.stun });
        if (ab.combo) p.combo = Math.min(5, p.combo + ab.combo);
        this.autoOn = true;
        break;
      case 'finisher':
        A.swing = 1;
        this.faceTarget(tg);
        this.damageMob(tg, amount * (1 + p.combo * 0.8));
        this.ring(tg.pos, 0xb48aff, 2.2, 0.35);
        p.combo = 0;
        this.autoOn = true;
        break;
      case 'bolt':
        A.cast = 0.3;
        this.faceTarget(tg);
        this.projectile(g.ppos, tg, ab.color || 0xffffff, 26, () => this.damageMob(tg, amount, { slow: ab.slow }), 0.32);
        break;
      case 'dot':
        this.faceTarget(tg);
        if (p.C.auto.range < 5) A.swing = 1; else A.cast = 0.3;
        tg.dots = tg.dots.filter((d) => d.id !== ab.id);
        tg.dots.push({ id: ab.id, tick: amount / ab.dur, next: t + 1, until: t + ab.dur + 0.05, color: ab.id === 'poison' ? '#7dff6a' : '#c58bff' });
        if (ab.combo) p.combo = Math.min(5, p.combo + ab.combo);
        this.aggro(tg);
        this.ring(tg.pos, ab.id === 'poison' ? 0x7dff6a : 0x9a4dff, 1.6, 0.4);
        break;
      case 'aoe_self': {
        A.swing = 1;
        const col = { thunder: 0x8fd0ff, fan: 0xb48aff, nova: 0x9be8ff, holyfire: 0xffe98a }[ab.id] || 0xffffff;
        this.ring(g.ppos, col, ab.radius, 0.5, 0.25);
        let dealt = 0;
        for (const m of g.mobs.near(g.ppos, ab.radius + 1, (m) => m.dungeon === g.dungeonTier)) {
          dealt += this.damageMob(m, amount, { slow: ab.slow, root: ab.root });
        }
        if (ab.combo) p.combo = Math.min(5, p.combo + ab.combo);
        if (ab.heal) this.healPlayer(dealt * ab.heal);
        g.shake(0.25);
        break;
      }
      case 'debuff_aoe':
        this.ring(g.ppos, 0xff9a4a, ab.radius, 0.5, 0.2);
        for (const m of g.mobs.near(g.ppos, ab.radius, (m) => m.dungeon === g.dungeonTier)) { m.weakenUntil = t + ab.dur; this.aggro(m); }
        g.ui.log('Los enemigos cercanos están debilitados');
        break;
      case 'buff':
        p.buffs[ab.buff] = { until: t + ab.dur, name: ab.name, icon: ab.icon };
        this.ring(g.ppos, ab.buff === 'wall' ? 0xc9d2dc : 0xffd84a, 2.5, 0.6);
        break;
      case 'shield':
        p.shield = amount; p.shieldUntil = t + ab.dur;
        p.buffs.shield = { until: t + ab.dur, name: ab.name, icon: ab.icon };
        this.ring(g.ppos, 0x9ad8ff, 2, 0.6);
        break;
      case 'heal':
        A.cast = 0.4;
        this.healPlayer(amount);
        this.ring(g.ppos, 0x7dff9a, 2.2, 0.6);
        break;
      case 'hot':
        p.hots = p.hots.filter((h) => h.id !== ab.id);
        p.hots.push({ id: ab.id, tick: amount / ab.dur, next: t + 1, until: t + ab.dur + 0.05 });
        p.buffs.renew = { until: t + ab.dur, name: ab.name, icon: ab.icon };
        this.ring(g.ppos, 0x7dff9a, 1.8, 0.5);
        break;
      case 'dash': {
        const d = this.distTo(tg);
        const dir = v3.set(tg.pos.x - g.ppos.x, 0, tg.pos.z - g.ppos.z).normalize();
        g.dashTo(g.ppos.x + dir.x * (d - 0.8), g.ppos.z + dir.z * (d - 0.8), 0.25);
        setTimeout(() => { if (!tg.dead) { this.damageMob(tg, amount, { stun: ab.stun }); this.ring(tg.pos, 0xffffff, 2.5, 0.35); } }, 250);
        this.autoOn = true;
        break;
      }
      case 'shadowstep': {
        const a = tg.mesh.rotation.y + Math.PI;
        g.teleport(tg.pos.x + Math.sin(a) * (tg.r + 1.2), tg.pos.z + Math.cos(a) * (tg.r + 1.2));
        this.faceTarget(tg);
        p.nextHitBonus = 0.5;
        this.ring(g.ppos, 0x5a3a8a, 2, 0.4);
        this.aggro(tg);
        this.autoOn = true;
        break;
      }
      case 'blink': {
        const f = g.heroFacing();
        this.ring(g.ppos, 0xc58bff, 1.6, 0.35);
        g.blink(f.x * ab.dist, f.z * ab.dist);
        this.ring(g.ppos, 0xc58bff, 1.6, 0.35);
        break;
      }
      case 'meteor': {
        A.cast = 0.4;
        const pos = tg.pos.clone();
        this.ring(pos, 0xff5a2a, ab.radius, 0.9, 0.08);
        const rock = new THREE.Mesh(G.ico, glow(0xff7a2f));
        rock.scale.setScalar(1.2);
        rock.position.set(pos.x + 6, pos.y + 22, pos.z - 4);
        g.scene.add(rock);
        this.fx.push({ obj: rock, life: 0.7, max: 0.7, update: (k) => rock.position.set(pos.x + 6 * k, pos.y + 0.5 + 22 * k, pos.z - 4 * k),
          done: () => {
            this.ring(pos, 0xffa040, ab.radius, 0.5, 0.35);
            this.ring(pos, 0xff4a1a, ab.radius * 0.6, 0.4, 0.3);
            g.shake(0.5);
            for (const m of g.mobs.near(pos, ab.radius + 0.5, (m) => m.dungeon === g.dungeonTier)) this.damageMob(m, amount);
          } });
        break;
      }
    }
  }
  faceTarget(tg) { this.g.faceTo(tg.pos.x, tg.pos.z); }

  /* --------------------------------------------------------- daño */
  aggro(m) { if (m.state !== 'chase') this.g.mobs.aggro(m, this.g.now); }

  /** Daña a un monstruo. Devuelve el daño hecho. */
  damageMob(m, amount, o = {}) {
    if (!m || m.dead) return 0;
    const g = this.g, p = this.p, t = g.now;
    let dmg = amount * (0.92 + Math.random() * 0.16);
    const diff = m.lvl - p.level;
    if (diff > 0) dmg *= Math.max(0.5, 1 - diff * 0.06);
    let crit = false;
    if (!o.dot) {
      if (p.nextHitBonus) { dmg *= 1 + p.nextHitBonus; p.nextHitBonus = 0; }
      if (Math.random() < p.crit) { dmg *= 2; crit = true; }
    }
    dmg = Math.max(1, Math.round(dmg));
    m.hp -= dmg;
    if (o.stun) m.stunUntil = t + o.stun;
    if (o.slow) m.slowUntil = t + 4;
    if (o.root) m.rootUntil = t + o.root;
    if (!o.dot) { m.flash = 0.08; m.mesh.material = FLASH_MAT; }
    this.aggro(m);
    this.lastCombat = t;
    if (p.C.res === 'furia' && !o.dot) p.res = Math.min(p.maxRes, p.res + 2);
    g.ui.popup(m.pos.x, m.pos.y + 2.2 * m.sc, m.pos.z, crit ? `${dmg}!` : `${dmg}`, crit ? 'crit' : o.dot ? 'dot' : 'hit', o.color);
    if (m.hp <= 0) this.killMob(m);
    return dmg;
  }

  killMob(m) {
    const g = this.g, p = this.p, t = g.now;
    m.hp = 0;
    g.mobs.kill(m, t);
    this.puff(m.pos, m.sc);
    if (g.target === m) { g.setTarget(null); this.autoOn = false; }
    // experiencia
    let xp = mobXp(m.lvl, p.level) * (m.boss ? 12 : m.elite ? 2 : 1);
    if (m.dungeon !== null) xp = Math.round(xp * 1.3);
    if (xp > 0) {
      const ups = p.addXp(xp);
      g.ui.popup(m.pos.x, m.pos.y + 3 * m.sc, m.pos.z, `+${xp} XP`, 'xp');
      if (ups) g.onLevelUp(ups);
    }
    // oro
    const gold = Math.max(1, Math.round((1 + m.lvl * 0.6) * (0.6 + Math.random() * 0.8) * (m.boss ? 25 : m.elite ? 3 : 1)));
    p.gold += gold;
    // botín
    const loot = [];
    const nItems = m.boss ? 2 : Math.random() < (m.dungeon !== null ? 0.3 : 0.14) ? 1 : 0;
    for (let i = 0; i < nItems; i++) {
      const it = makeItem(Math.max(1, Math.min(80, m.lvl)), rollRarity(m.boss ? 2 + (i === 0 && Math.random() < 0.35 ? 1 : 0) : 0), p.cls);
      if (p.addToBag(it)) loot.push(it); else g.ui.error('Tu bolsa está llena');
    }
    if (Math.random() < 0.08) { p.potions.pocion++; g.ui.log('Has encontrado una Poción de vida'); }
    // objetos de misión
    const drop = MOBS[m.type].drop;
    if (drop && g.quests.wants(drop.item) && Math.random() < drop.chance) g.quests.addItem(drop.item);
    g.quests.onKill(m.type);
    g.ui.loot(gold, loot);
    if (m.boss && m.dungeon !== null) g.onDungeonBoss(m);
    if (m.type === 'reina') g.quests.onBoss('reina');
    g.save();
  }

  damagePlayer(dmg, m) {
    const g = this.g, p = this.p, t = g.now;
    if (p.dead || !g.alive) return;
    if (p.buff('wall', t)) dmg *= 0.4;
    dmg *= 1 - p.dr;
    dmg = Math.max(1, Math.round(dmg));
    if (p.shield > 0 && t < p.shieldUntil) {
      const a = Math.min(p.shield, dmg);
      p.shield -= a; dmg -= a;
      if (p.shield <= 0) delete p.buffs.shield;
      if (!dmg) { g.ui.popup(g.ppos.x, g.ppos.y + 2.6, g.ppos.z, 'Absorbido', 'abs'); return; }
    }
    p.hp -= dmg;
    this.lastCombat = t;
    if (p.C.res === 'furia') p.res = Math.min(p.maxRes, p.res + (dmg / p.maxHp) * 120 + 2);
    g.ui.popup(g.ppos.x, g.ppos.y + 2.6, g.ppos.z, `-${dmg}`, 'hurt');
    g.ui.hurt();
    if (m && !g.target) g.setTarget(m);
    if (p.hp <= 0) { p.hp = 0; g.playerDied(); }
  }
  healPlayer(n) {
    const p = this.p;
    n = Math.round(n);
    if (n <= 0) return;
    p.hp = Math.min(p.maxHp, p.hp + n);
    this.g.ui.popup(this.g.ppos.x, this.g.ppos.y + 2.6, this.g.ppos.z, `+${n}`, 'heal');
  }

  mobBolt(m, dmg) {
    const col = m.tint || 0xb04dff;
    this.projectile(m.pos, 'player', col, 16, () => this.damagePlayer(dmg, m), 0.35, m.pos.y + 1.4 * m.sc);
  }
  bossSlam(m) {
    const g = this.g;
    const pos = m.pos.clone();
    const R = 7 * Math.min(1.6, m.sc / 2);
    g.ui.log(`¡${m.name} prepara un golpe devastador! Apártate del círculo rojo`, 'warn');
    const geo = new THREE.CircleGeometry(R, 40);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.25, depthWrite: false });
    const disc = new THREE.Mesh(geo, mat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(pos.x, pos.y + 0.12, pos.z);
    g.scene.add(disc);
    this.fx.push({ obj: disc, life: 1.6, max: 1.6, update: (k) => { mat.opacity = 0.2 + (1 - k) * 0.35; },
      done: () => {
        geo.dispose();
        if (m.dead) return;
        this.ring(pos, 0xff4a2a, R, 0.45, 0.3);
        g.shake(0.6);
        if (Math.hypot(g.ppos.x - pos.x, g.ppos.z - pos.z) < R) this.damagePlayer(m.dmg * 2.2, m);
      } });
  }

  /* ----------------------------------------------------- bucle */
  update(dt, t) {
    const g = this.g, p = this.p;
    if (p.dead) { this.cast = null; return; }
    const combat = this.inCombat(t);
    // recursos
    if (p.C.res === 'mana') p.res = Math.min(p.maxRes, p.res + p.maxRes * (combat ? 0.012 : 0.05) * dt);
    else if (p.C.res === 'energia') p.res = Math.min(p.maxRes, p.res + (p.buff('frenzy', t) ? 22 : 11) * dt);
    else if (!combat) p.res = Math.max(0, p.res - 3 * dt);
    if (!combat) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.025 * dt);
    if (p.shield > 0 && t > p.shieldUntil) { p.shield = 0; delete p.buffs.shield; }
    for (const [k, b] of Object.entries(p.buffs)) if (b.until <= t) delete p.buffs[k];
    for (let i = p.hots.length - 1; i >= 0; i--) {
      const h = p.hots[i];
      if (t >= h.next) { h.next += 1; this.healPlayer(h.tick); }
      if (t >= h.until) p.hots.splice(i, 1);
    }
    // lanzamiento
    if (this.cast) {
      const c = this.cast;
      if (g.moving) this.interrupt('Interrumpido');
      else if (!['heal', 'hearth'].includes(c.ab.kind) && !this.validTarget(c.target)) this.interrupt();
      else if (t >= c.end) {
        this.cast = null;
        g.hero.userData.anim.channel = false;
        if (c.ab.kind === 'hearth') g.hearthHome();
        else if (c.target && c.ab.range && this.distTo(c.target) > c.ab.range + 2) g.ui.error('Estás demasiado lejos');
        else this.execute(c.ab, c.target);
      }
    }
    // ataque automático
    const tg = g.target;
    if (this.autoOn && this.validTarget(tg) && !this.cast) {
      const au = p.C.auto;
      const d = this.distTo(tg);
      if (d <= au.range && t >= this.swingAt) {
        const speed = au.speed * (p.buff('frenzy', t) ? 0.66 : 1);
        this.swingAt = t + speed;
        const dmg = (p.wdmg * 0.9 + p.ap * 0.35 + (au.wand ? p.sp * 0.3 : 0)) * au.mult;
        this.faceTarget(tg);
        if (au.wand) this.projectile(g.ppos, tg, 0xc58bff, 30, () => this.damageMob(tg, dmg), 0.18);
        else {
          g.hero.userData.anim.swing = 1;
          this.damageMob(tg, dmg);
          if (p.C.res === 'furia') p.res = Math.min(p.maxRes, p.res + 7);
          if (au.dual && !tg.dead) setTimeout(() => this.damageMob(tg, dmg * 0.5), 180);
        }
      }
    } else if (this.autoOn && !this.validTarget(tg)) this.autoOn = false;
    this.updateProjectiles(dt);
    this.updateFx(dt);
  }

  /* ----------------------------------------------------- proyectiles */
  projectile(from, target, color, speed, onHit, size = 0.3, fromY) {
    const mesh = new THREE.Mesh(G.sphLo, glow(color));
    mesh.scale.setScalar(size);
    mesh.position.set(from.x, fromY ?? from.y + 1.5, from.z);
    const halo = new THREE.Mesh(G.sphLo, glow(color, 0.35));
    halo.scale.setScalar(1.9);
    mesh.add(halo);
    this.g.scene.add(mesh);
    this.proj.push({ mesh, target, speed, onHit, life: 4 });
  }
  updateProjectiles(dt) {
    const g = this.g;
    for (let i = this.proj.length - 1; i >= 0; i--) {
      const pr = this.proj[i];
      const tp = pr.target === 'player' ? v3.set(g.ppos.x, g.ppos.y + 1.2, g.ppos.z) : v3.set(pr.target.pos.x, pr.target.pos.y + 1.2 * pr.target.sc, pr.target.pos.z);
      const d = pr.mesh.position.distanceTo(tp);
      pr.life -= dt;
      const dead = pr.target !== 'player' && pr.target.dead;
      if (d < 0.6 || pr.life <= 0 || dead) {
        if (!dead && pr.life > 0) pr.onHit();
        g.scene.remove(pr.mesh);
        this.proj.splice(i, 1);
        continue;
      }
      pr.mesh.position.addScaledVector(tp.sub(pr.mesh.position).normalize(), Math.min(d, pr.speed * dt));
    }
  }

  /* --------------------------------------------------------- efectos */
  ring(pos, color, radius, dur = 0.4, thick = 0.12) {
    const geo = new THREE.RingGeometry(1 - thick, 1, 40);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(pos.x, (pos.y || 0) + 0.2, pos.z);
    this.g.scene.add(m);
    this.fx.push({ obj: m, life: dur, max: dur, update: (k) => { m.scale.setScalar(0.2 + radius * (1 - (k * k * k))); mat.opacity = 0.9 * k; }, dispose: () => { geo.dispose(); mat.dispose(); } });
  }
  puff(pos, s = 1) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false });
    const m = new THREE.Mesh(G.sphLo, mat);
    m.position.set(pos.x, pos.y + 0.8 * s, pos.z);
    this.g.scene.add(m);
    this.fx.push({ obj: m, life: 0.35, max: 0.35, update: (k) => { m.scale.setScalar(s * (1.6 - k)); mat.opacity = 0.7 * k; }, dispose: () => mat.dispose() });
  }
  updateFx(dt) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.life -= dt;
      f.update(Math.max(0, f.life / f.max));
      if (f.life <= 0) {
        this.g.scene.remove(f.obj);
        f.dispose?.();
        f.done?.();
        this.fx.splice(i, 1);
      }
    }
  }
}
