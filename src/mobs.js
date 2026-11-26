// Monstruos: aparición por zonas, IA (vagar, perseguir, volver a casa) y ataques.
import * as THREE from 'three';
import { MOBS, mobStats, SPAWN_TABLE } from './data/mobs.js';
import { mobMesh, FLASH_MAT } from './world/models.js';
import { heightAt, zoneAt, walkable, LAKE, LIMIT, WINTER_Z, FLAT } from './world/terrain.js';

const ACTIVE_R = 120, SHOW_R = 115;

function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export class MobManager {
  constructor(game) {
    this.g = game;
    this.list = [];
  }

  /** Crea un monstruo. opts: { dungeon, elite, boss, name, tint } */
  spawn(type, lvl, x, z, opts = {}) {
    const def = MOBS[type];
    const tint = def.spectre ? opts.tint : null;
    const pal = def.spectre ? { a: 0x1c1a2a, b: 0x2c2840, eye: opts.tint } : def.pal;
    const mesh = mobMesh(def.builder, pal, `${type}-${tint || ''}`, tint);
    const sc = (def.scale || 1) * (opts.boss ? 2.2 : opts.elite ? 1.12 : 1);
    mesh.scale.setScalar(sc);
    this.g.scene.add(mesh);
    const st = mobStats(type, lvl, opts.boss ? 9 : opts.elite ? 1.4 : 1);
    if (def.boss) { st.hp = Math.round(st.hp * 14); st.dmg *= 1.6; }
    const m = {
      type, def, lvl, name: opts.name || def.name, mesh, sc,
      pos: new THREE.Vector3(x, 0, z), home: new THREE.Vector3(x, 0, z),
      hp: st.hp, maxHp: st.hp, dmg: st.dmg, dungeon: opts.dungeon ?? null,
      elite: !!opts.elite, boss: !!(opts.boss || def.boss), tint,
      state: 'idle', wanderAt: Math.random() * 5, wanderTo: null, atkAt: 0, face: Math.random() * 6,
      stunUntil: 0, slowUntil: 0, rootUntil: 0, weakenUntil: 0, dots: [], flash: 0,
      dead: false, respawnAt: 0, seed: Math.random() * 10, r: 0.6 * sc, slamAt: 0,
    };
    m.baseMat = mesh.material;
    m.pos.y = this.ground(m, x, z);
    mesh.position.copy(m.pos);
    this.list.push(m);
    return m;
  }

  ground(m, x, z) {
    const base = m.dungeon !== null ? 0 : heightAt(x, z);
    return base + (m.def.fly || 0) * m.sc;
  }

  /** Población del mundo abierto según SPAWN_TABLE. */
  populateWorld() {
    const R = rng(777);
    for (const row of SPAWN_TABLE) {
      let placed = 0, tries = 0;
      while (placed < row.n && tries++ < 4000) {
        let x, z;
        if (row.ring) {
          const a = R() * Math.PI * 2, d = row.ring[0] + R() * (row.ring[1] - row.ring[0]);
          x = Math.cos(a) * d; z = Math.sin(a) * d;
          if (row.near === 'lake') { const a2 = R() * Math.PI * 2, d2 = LAKE.r + 4 + R() * 26; x = LAKE.x + Math.cos(a2) * d2; z = LAKE.z + Math.sin(a2) * d2; }
          if (row.north) { z = -Math.abs(z) - 40; }
        } else {
          x = (R() * 2 - 1) * (LIMIT - 12); z = (R() * 2 - 1) * (LIMIT - 12);
        }
        if (zoneAt(x, z) !== row.zone) continue;
        if (!walkable(x, z)) continue;
        if (FLAT.some(([fx, fz, fr]) => Math.hypot(x - fx, z - fz) < fr + 16)) continue;
        if (Math.abs(z - WINTER_Z) < 10) continue;
        if (!this.g.props.col.free(x, z, 1.5)) continue;
        // nivel según la distancia al centro de la zona
        const k = R();
        const lvl = row.lvl[0] + Math.round(k * (row.lvl[1] - row.lvl[0]));
        this.spawn(row.mob, lvl, x, z);
        placed++;
      }
    }
    // jefa del Bosque Invernal
    this.queen = this.spawn('reina', 82, 0, 245, { name: 'Reina Araña de Escarcha' });
  }

  clearDungeon(tier) {
    for (const m of this.list) if (m.dungeon === tier) this.g.scene.remove(m.mesh);
    this.list = this.list.filter((m) => m.dungeon !== tier);
  }

  near(pos, r, filter) {
    const out = [];
    for (const m of this.list) {
      if (m.dead || (filter && !filter(m))) continue;
      const d = Math.hypot(m.pos.x - pos.x, m.pos.z - pos.z);
      if (d <= r) out.push(m);
    }
    return out;
  }

  update(dt, t) {
    const g = this.g, P = g.pl, pp = g.ppos;
    const inst = g.dungeonTier;
    for (const m of this.list) {
      const sameWorld = m.dungeon === inst;
      const dx = pp.x - m.pos.x, dz = pp.z - m.pos.z;
      const dist = Math.hypot(dx, dz);
      // respawn
      if (m.dead) {
        if (m.dungeon === null && t > m.respawnAt && dist > 40) this.respawn(m);
        continue;
      }
      if (!sameWorld || dist > ACTIVE_R) { m.mesh.visible = false; if (m.state !== 'idle' && !sameWorld) this.reset(m); continue; }
      m.mesh.visible = dist < SHOW_R;
      // efectos de estado
      for (let i = m.dots.length - 1; i >= 0; i--) {
        const d = m.dots[i];
        if (t >= d.next) { d.next += 1; g.combat.damageMob(m, d.tick, { dot: true, color: d.color, silent: false }); }
        if (t >= d.until || m.dead) m.dots.splice(i, 1);
      }
      if (m.dead) continue;
      const stunned = t < m.stunUntil;
      const rooted = t < m.rootUntil;
      const speed = m.def.speed * (t < m.slowUntil ? 0.5 : 1);
      // agresividad
      if (m.state === 'idle' && !P.dead && g.alive) {
        const aggroR = Math.max(6, Math.min(22, (m.boss ? 18 : 12) + (m.lvl - P.level) * 1.2));
        if (dist < aggroR) this.aggro(m, t);
      }
      let moving = false;
      if (m.state === 'idle') {
        if (t > m.wanderAt) {
          m.wanderAt = t + 4 + Math.random() * 6;
          const a = Math.random() * Math.PI * 2, r = Math.random() * (m.dungeon !== null ? 3 : 8);
          m.wanderTo = { x: m.home.x + Math.cos(a) * r, z: m.home.z + Math.sin(a) * r };
        }
        if (m.wanderTo && !stunned) moving = this.moveTo(m, m.wanderTo.x, m.wanderTo.z, speed * 0.35, dt, 0.5);
      } else if (m.state === 'chase') {
        const leash = m.dungeon !== null ? 60 : 48;
        if (P.dead || Math.hypot(m.pos.x - m.home.x, m.pos.z - m.home.z) > leash) { m.state = 'evade'; }
        else {
          const range = m.def.range * (m.boss ? 1.6 : 1) + 0.6;
          if (dist > range * 0.92 && !stunned && !rooted) moving = this.moveTo(m, pp.x, pp.z, speed, dt, range * 0.85);
          m.face = Math.atan2(dx, dz);
          if (dist <= range + 0.4 && !stunned && t >= m.atkAt) {
            m.atkAt = t + m.def.aspeed;
            this.attack(m, t);
          }
          if (m.boss && !stunned && t >= m.slamAt && dist < 22) { m.slamAt = t + 9; g.combat.bossSlam(m); }
        }
      } else if (m.state === 'evade') {
        moving = this.moveTo(m, m.home.x, m.home.z, speed * 1.6, dt, 0.6);
        m.hp = Math.min(m.maxHp, m.hp + m.maxHp * dt * 0.5);
        if (!moving) { this.reset(m); }
      }
      // visual
      const y = this.ground(m, m.pos.x, m.pos.z);
      m.pos.y = y;
      const bob = m.def.fly ? Math.sin(t * 2.5 + m.seed) * 0.25 : moving ? Math.abs(Math.sin(t * 10 + m.seed)) * 0.15 : 0;
      m.mesh.position.set(m.pos.x, y + bob, m.pos.z);
      m.mesh.rotation.y = lerpAngle(m.mesh.rotation.y, m.face, 1 - Math.exp(-dt * 10));
      m.mesh.rotation.z = moving && !m.def.fly ? Math.sin(t * 10 + m.seed) * 0.05 : 0;
      if (m.flash > 0) { m.flash -= dt; if (m.flash <= 0) m.mesh.material = m.baseMat || m.mesh.material; }
      m.mesh.scale.setScalar(m.sc * (stunned ? 0.95 + Math.sin(t * 20) * 0.02 : 1));
    }
  }

  moveTo(m, x, z, speed, dt, stop) {
    const dx = x - m.pos.x, dz = z - m.pos.z, d = Math.hypot(dx, dz);
    if (d <= stop) return false;
    const step = Math.min(d - stop, speed * dt);
    const prev = { x: m.pos.x, z: m.pos.z };
    m.pos.x += (dx / d) * step; m.pos.z += (dz / d) * step;
    m.face = Math.atan2(dx, dz);
    if (m.dungeon !== null) this.g.dungeons.get(m.dungeon)?.clamp(m.pos, prev);
    else {
      this.g.props.col.push(m.pos, m.r);
      if (!walkable(m.pos.x, m.pos.z)) { m.pos.x = prev.x; m.pos.z = prev.z; }
      if (m.pos.z > WINTER_Z - 2 && prev.z <= WINTER_Z - 2 && !this.g.winterOpen) m.pos.z = prev.z;
    }
    return true;
  }

  aggro(m, t) {
    if (m.state === 'chase' || m.dead) return;
    m.state = 'chase';
    m.atkAt = Math.max(m.atkAt, t + 0.6);
    m.slamAt = t + 5;
    // los compañeros cercanos también se unen (manadas)
    for (const o of this.list) {
      if (o === m || o.dead || o.state !== 'idle' || o.dungeon !== m.dungeon) continue;
      if (Math.hypot(o.pos.x - m.pos.x, o.pos.z - m.pos.z) < (m.dungeon !== null ? 10 : 7)) { o.state = 'chase'; o.atkAt = t + 0.8; o.slamAt = t + 5; }
    }
  }

  attack(m, t) {
    const g = this.g;
    let dmg = m.dmg * (0.85 + Math.random() * 0.3) * (t < m.weakenUntil ? 0.7 : 1);
    if (m.def.ranged) g.combat.mobBolt(m, dmg);
    else g.combat.damagePlayer(dmg, m);
  }

  reset(m) {
    m.state = 'idle'; m.hp = m.maxHp; m.dots = [];
    m.pos.copy(m.home); m.wanderTo = null;
  }

  kill(m, t) {
    m.dead = true;
    m.mesh.visible = false;
    m.state = 'idle'; m.dots = [];
    m.respawnAt = t + (m.boss ? 300 : 40 + Math.random() * 30);
  }
  respawn(m) {
    m.dead = false; m.hp = m.maxHp; m.state = 'idle';
    m.pos.copy(m.home);
    m.mesh.visible = true;
  }
}

export function lerpAngle(a, b, k) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}
