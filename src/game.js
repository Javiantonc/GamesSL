// Bucle principal del modo survivor: oleadas, compañeros, XP, mejoras,
// evoluciones, ataque definitivo y jefes.
import * as THREE from 'three';
import {
  SPECIES, ALL_SPECIES, buildCreature, animateCreature, buildTrainer, animateTrainer,
  effectiveness, stageOf, STAGE_SCALE,
} from './creatures.js';
import { bake, BAKED_MAT, G, glow } from './gfx.js';
import { buildWorld, ARENA_R } from './world.js';

export const MAX_TEAM = 4;
export const MAX_CLEVEL = 8;
export const WIN_TIME = 600; // 10 minutos

const FLASH_MAT = new THREE.MeshBasicMaterial({ color: 0xffffff });
const FLOAT = { medusin: 0.25, cristalo: 0.3 };
const ENEMY = { hp: [0, 16, 55, 150], speed: [0, 2.7, 2.5, 2.3], dmg: [0, 8, 13, 20], xp: [0, 1, 3, 8] };
const tmpV = new THREE.Vector3();

export class Game {
  constructor(container, ui) {
    this.ui = ui;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.5, 200);
    this.camOffset = new THREE.Vector3(0, 22, 11);
    this.shake = 0;

    const w = buildWorld(this.scene);
    this.sun = w.sun; this.obstacles = w.obstacles;

    this.keys = new Set();
    this.joy = { x: 0, z: 0 };
    addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space') { e.preventDefault(); this.useUltimate(); }
      if (e.code === 'Escape' || e.code === 'KeyP') this.togglePause();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.running && !this.paused) this.togglePause(); });
    this.resize();

    // gemas de experiencia (instanciadas)
    this.gemMax = 700;
    this.gemMesh = new THREE.InstancedMesh(G.oct, new THREE.MeshBasicMaterial({ color: 0xffffff }), this.gemMax);
    this.gemMesh.count = 0;
    this.gemMesh.frustumCulled = false;
    this.scene.add(this.gemMesh);
    this.dummy = new THREE.Object3D();
    this.gemColors = [new THREE.Color(0x5fe0ff), new THREE.Color(0x7dff7a), new THREE.Color(0xffd84a), new THREE.Color(0xff6ad5)];

    this.trainer = buildTrainer();
    this.scene.add(this.trainer);

    this.clock = new THREE.Clock();
    this.running = false;
    this.paused = false;
    this.renderer.setAnimationLoop(() => this.frame());
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    // en vertical alejamos la cámara para ver más
    const k = w < h ? 1.45 : 1;
    this.camOffset.set(0, 22 * k, 11 * k);
    this.camera.updateProjectionMatrix();
  }

  /* --------------------------------------------------------- partida */
  start(starter) {
    // limpiar partida anterior
    for (const e of this.enemies || []) this.scene.remove(e.mesh);
    for (const c of this.team || []) this.removeCompanionModel(c);
    for (const p of this.projectiles || []) this.scene.remove(p.mesh);
    for (const f of this.fx || []) this.scene.remove(f.obj);
    for (const b of this.bullets || []) this.scene.remove(b.mesh);

    this.time = 0; this.kills = 0;
    this.enemies = []; this.projectiles = []; this.fx = []; this.gems = []; this.bullets = [];
    this.spawnTimer = 0; this.nextStampede = 60;
    this.bossTimes = [150, 300, 450];
    this.finalSpawned = false; this.boss = null;
    this.levelQueue = 0;
    this.p = {
      pos: new THREE.Vector3(0, 0, 2), face: 0, hp: 100, maxHp: 100, speed: 6.2, magnet: 4,
      dmgMult: 1, regen: 0, level: 1, xp: 0, xpNext: 5, iframes: 0, ult: 0, moving: 0,
      stats: { hp: 0, speed: 0, magnet: 0, dmg: 0, regen: 0 },
    };
    this.team = [];
    this.addCompanion(starter);
    this.running = true; this.paused = false; this.over = false;
    this.clock.getDelta();
    this.ui.onStart(this);
  }

  togglePause() {
    if (!this.running || this.over || this.ui.modalOpen) return;
    this.paused = !this.paused;
    this.ui.showPause(this.paused);
  }

  /* -------------------------------------------------------- compañeros */
  addCompanion(species) {
    const c = { species, lvl: 1, cd: 0.5, pos: this.p.pos.clone().add(new THREE.Vector3(1, 0, 1)), face: 0, orbit: [], seed: Math.random() * 10 };
    this.team.push(c);
    this.buildCompanionModel(c);
    this.ui.toast(`¡${SPECIES[species].names[0]} se une al equipo!`);
  }
  buildCompanionModel(c) {
    c.model = buildCreature(c.species, stageOf(c.lvl), false);
    this.scene.add(c.model);
    c.orbit.forEach((o) => this.scene.remove(o));
    c.orbit = [];
  }
  removeCompanionModel(c) {
    this.scene.remove(c.model);
    c.orbit.forEach((o) => this.scene.remove(o));
  }
  levelCompanion(c) {
    const before = stageOf(c.lvl);
    c.lvl++;
    if (stageOf(c.lvl) !== before) {
      const oldName = SPECIES[c.species].names[before - 1];
      this.removeCompanionModel(c);
      this.buildCompanionModel(c);
      this.ring(c.pos, 0xffffff, 4, 0.6);
      this.ring(c.pos, 0xfff27a, 2.5, 0.8);
      this.ui.toast(`✨ ¡${oldName} evolucionó a ${SPECIES[c.species].names[stageOf(c.lvl) - 1]}!`, true);
    }
  }
  cStats(c) {
    const a = SPECIES[c.species].attack;
    const st = stageOf(c.lvl);
    const stageMul = [0, 1, 1.25, 1.6][st];
    return {
      ...a,
      dmg: a.dmg * (1 + 0.3 * (c.lvl - 1)) * stageMul,
      cd: a.cd * (1 - 0.045 * (c.lvl - 1)),
      range: a.range * (a.kind === 'nova' || a.kind === 'quake' ? 1 + 0.07 * (c.lvl - 1) : 1),
      count: (a.count || 0) + Math.floor((c.lvl - 1) / 2),
      jumps: (a.jumps || 0) + Math.floor((c.lvl - 1) / 2),
      pierce: c.lvl >= 4 ? 1 + Math.floor((c.lvl - 4) / 2) : 0,
      radius: (a.radius || 0) * (1 + 0.06 * (c.lvl - 1)),
    };
  }

  /* ----------------------------------------------------------- bucle */
  frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = performance.now() / 1000;
    if (this.running && !this.paused && !this.ui.modalOpen && !this.over) this.update(dt, t);
    else if (this.p) this.idleAnim(t);
    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
    if (this.running) this.ui.frame(this, dt);
  }

  idleAnim(t) {
    animateTrainer(this.trainer, t, 0);
    for (const c of this.team || []) animateCreature(c.model, t, false, c.seed);
  }

  update(dt, t) {
    this.time += dt;
    const p = this.p;

    // movimiento del jugador
    let mx = (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
    let mz = (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) - (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0);
    if (this.joy.x || this.joy.z) { mx = this.joy.x; mz = this.joy.z; }
    const len = Math.hypot(mx, mz);
    if (len > 0.1) {
      const k = Math.min(1, len) / len;
      p.pos.x += mx * k * p.speed * dt;
      p.pos.z += mz * k * p.speed * dt;
      p.face = Math.atan2(mx, mz);
      p.moving = Math.min(1, len) * p.speed;
    } else p.moving = 0;
    this.obstacles.resolve(p.pos, 0.45);
    this.trainer.position.copy(p.pos);
    this.trainer.rotation.y = lerpAngle(this.trainer.rotation.y, p.face, 1 - Math.exp(-dt * 14));
    animateTrainer(this.trainer, t, p.moving);
    p.iframes -= dt;
    p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);

    this.spawning(dt);
    this.updateCompanions(dt, t);
    this.updateEnemies(dt, t);
    this.updateProjectiles(dt);
    this.updateBullets(dt);
    this.updateGems(dt, t);
    this.updateFx(dt);

    if (this.levelQueue > 0 && !this.ui.modalOpen) { this.levelQueue--; this.ui.showLevelUp(this.upgradeOptions(), (o) => this.applyUpgrade(o)); }
    if (p.hp <= 0) this.end(false);
  }

  updateCamera(dt) {
    const target = this.p ? this.p.pos : tmpV.set(0, 0, 0);
    const desired = tmpV.copy(target).add(this.camOffset);
    this.camera.position.lerp(desired, 1 - Math.exp(-dt * 6));
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 1.6);
      this.camera.position.x += (Math.random() - 0.5) * this.shake;
      this.camera.position.y += (Math.random() - 0.5) * this.shake;
    }
    this.camera.lookAt(this.camera.position.x - this.camOffset.x, 0.8, this.camera.position.z - this.camOffset.z);
    this.sun.position.set(target.x - 14, 26, target.z + 10);
    this.sun.target.position.set(target.x, 0, target.z);
  }

  /* ------------------------------------------------------- aparición */
  enemyPool() {
    const t = this.time;
    const pool = ['bolarro', 'gotin', 'musgoro'];
    if (t > 50) pool.push('farolin', 'medusin');
    if (t > 100) pool.push('cristalo');
    return pool;
  }
  enemyStage() {
    const t = this.time, r = Math.random();
    if (t > 420 && r < 0.3) return 3;
    if (t > 200 && r < 0.45) return 2;
    if (t > 100 && r < 0.15) return 2;
    return 1;
  }
  spawning(dt) {
    const t = this.time;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.enemies.length < 230) {
      this.spawnTimer = Math.max(0.3, 1.15 - t * 0.0016);
      const n = 1 + Math.floor(t / 50);
      const pool = this.enemyPool();
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, d = 25 + Math.random() * 7;
        this.spawnEnemy(pool[(Math.random() * pool.length) | 0], this.enemyStage(), this.p.pos.x + Math.cos(a) * d, this.p.pos.z + Math.sin(a) * d);
      }
    }
    if (t >= this.nextStampede) {
      this.nextStampede += 60;
      const pool = this.enemyPool();
      const sp = pool[(Math.random() * pool.length) | 0];
      const n = 18 + Math.floor(t / 30);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        this.spawnEnemy(sp, this.enemyStage(), this.p.pos.x + Math.cos(a) * 21, this.p.pos.z + Math.sin(a) * 21);
      }
      this.ui.toast('⚠️ ¡Estampida! Te están rodeando');
    }
    if (this.bossTimes.length && t >= this.bossTimes[0]) {
      this.bossTimes.shift();
      const pool = this.enemyPool();
      this.spawnBoss(pool[(Math.random() * pool.length) | 0], false);
    }
    if (!this.finalSpawned && t >= WIN_TIME) {
      this.finalSpawned = true;
      this.spawnBoss('cristalo', true);
    }
  }
  spawnEnemy(species, stage, x, z, boss = 0) {
    const geo = bake(`${species}-${stage}-w`, buildCreature(species, stage, true));
    const mesh = new THREE.Mesh(geo, BAKED_MAT);
    mesh.castShadow = true;
    const scale = STAGE_SCALE[stage] * (boss ? (boss === 2 ? 3 : 2.3) : 1);
    mesh.scale.setScalar(scale);
    const pos = new THREE.Vector3(x, 0, z);
    const rr = Math.hypot(x, z);
    if (rr > ARENA_R - 2) pos.multiplyScalar((ARENA_R - 2) / rr);
    this.obstacles.resolve(pos, 0.5 * scale);
    mesh.position.copy(pos);
    this.scene.add(mesh);
    const hpMul = 1 + this.time / 140;
    const e = {
      mesh, species, type: SPECIES[species].type, stage, pos, boss,
      hp: ENEMY.hp[stage] * hpMul, speed: ENEMY.speed[stage] + Math.random() * 0.6,
      dmg: ENEMY.dmg[stage] * (1 + this.time / 400), r: 0.45 * scale, xp: ENEMY.xp[stage],
      slowUntil: 0, kx: 0, kz: 0, flash: 0, seed: Math.random() * 10, leafHit: 0, shoot: 3,
    };
    e.maxHp = e.hp;
    this.enemies.push(e);
    return e;
  }
  spawnBoss(species, final) {
    const a = Math.random() * Math.PI * 2;
    const e = this.spawnEnemy(species, 3, this.p.pos.x + Math.cos(a) * 18, this.p.pos.z + Math.sin(a) * 18, final ? 2 : 1);
    e.hp = e.maxHp = (final ? 9000 : 1400) * (1 + this.time / 300);
    e.speed = final ? 2.4 : 2.7;
    e.dmg = final ? 35 : 24;
    e.xp = final ? 0 : 50;
    e.name = final ? 'Guardián de la Liga' : `Alfa salvaje: ${SPECIES[species].names[2]}`;
    this.boss = e;
    this.ui.bossIntro(e);
    this.shake = 0.8;
  }

  /* --------------------------------------------------------- enemigos */
  updateEnemies(dt, t) {
    const p = this.p, list = this.enemies;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z;
      const d = Math.hypot(dx, dz) || 0.001;
      const slow = t < e.slowUntil ? 0.5 : 1;
      let vx = (dx / d) * e.speed * slow, vz = (dz / d) * e.speed * slow;
      // separación
      for (let j = i + 1; j < list.length; j++) {
        const o = list[j];
        const sx = e.pos.x - o.pos.x, sz = e.pos.z - o.pos.z;
        const min = e.r + o.r;
        const s2 = sx * sx + sz * sz;
        if (s2 < min * min && s2 > 0.0001) {
          const s = Math.sqrt(s2), push = (min - s) * 0.5;
          const ux = sx / s, uz = sz / s;
          e.pos.x += ux * push; e.pos.z += uz * push;
          o.pos.x -= ux * push; o.pos.z -= uz * push;
        }
      }
      e.pos.x += (vx + e.kx) * dt;
      e.pos.z += (vz + e.kz) * dt;
      e.kx *= Math.exp(-dt * 6); e.kz *= Math.exp(-dt * 6);
      this.obstacles.resolve(e.pos, e.r * 0.8);
      // despawn si se queda muy lejos (no jefes)
      if (!e.boss && d > 48) {
        const a = Math.random() * Math.PI * 2;
        e.pos.set(p.pos.x + Math.cos(a) * 28, 0, p.pos.z + Math.sin(a) * 28);
        this.obstacles.resolve(e.pos, e.r);
      }
      // contacto con el jugador
      if (d < e.r + 0.5 && p.iframes <= 0) {
        p.hp -= e.dmg; p.iframes = 0.6;
        this.ui.hurt();
        this.shake = Math.max(this.shake, 0.35);
      }
      // ataque de jefe: ráfaga radial
      if (e.boss) {
        e.shoot -= dt;
        if (e.shoot <= 0) {
          e.shoot = e.boss === 2 ? 2.2 : 3.2;
          const n = e.boss === 2 ? 14 : 9, off = Math.random();
          for (let k = 0; k < n; k++) this.enemyBullet(e, ((k + off) / n) * Math.PI * 2);
        }
      }
      // visual
      e.mesh.position.set(e.pos.x, (FLOAT[e.species] || 0) * e.mesh.scale.x + Math.abs(Math.sin(t * 8 + e.seed)) * 0.12 + (FLOAT[e.species] ? Math.sin(t * 2 + e.seed) * 0.15 : 0), e.pos.z);
      e.mesh.rotation.y = Math.atan2(dx, dz);
      if (e.flash > 0) { e.flash -= dt; if (e.flash <= 0) e.mesh.material = BAKED_MAT; }
    }
  }
  enemyBullet(e, a) {
    const mesh = new THREE.Mesh(G.sphLo, glow(0xb04dff));
    mesh.scale.setScalar(0.35);
    mesh.position.set(e.pos.x, 0.8, e.pos.z);
    this.scene.add(mesh);
    this.bullets.push({ mesh, vx: Math.cos(a) * 7, vz: Math.sin(a) * 7, life: 4, dmg: e.dmg * 0.6 });
  }
  updateBullets(dt) {
    const p = this.p;
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.mesh.position.x += b.vx * dt; b.mesh.position.z += b.vz * dt;
      b.life -= dt;
      const hit = Math.hypot(b.mesh.position.x - p.pos.x, b.mesh.position.z - p.pos.z) < 0.7;
      if (hit && p.iframes <= 0) { p.hp -= b.dmg; p.iframes = 0.5; this.ui.hurt(); }
      if (hit || b.life <= 0) { this.scene.remove(b.mesh); this.bullets.splice(i, 1); }
    }
  }

  nearest(pos, range, exclude) {
    let best = null, bd = range * range;
    for (const e of this.enemies) {
      if (exclude && exclude.has(e)) continue;
      const d = (e.pos.x - pos.x) ** 2 + (e.pos.z - pos.z) ** 2;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  hit(e, base, atkType, kb) {
    if (e.dead) return;
    const eff = effectiveness(atkType, e.type);
    const dmg = base * this.p.dmgMult * eff * (0.9 + Math.random() * 0.2);
    e.hp -= dmg;
    e.flash = 0.08; e.mesh.material = FLASH_MAT;
    if (kb && !e.boss) { e.kx += kb.x; e.kz += kb.z; }
    this.ui.popup(e.pos.x, 1.6 * e.mesh.scale.x, e.pos.z, Math.round(dmg), eff > 1 ? 'eff' : '', atkType);
    if (e.hp <= 0) this.kill(e);
  }
  kill(e) {
    e.dead = true;
    this.scene.remove(e.mesh);
    const i = this.enemies.indexOf(e);
    if (i >= 0) this.enemies.splice(i, 1);
    this.kills++;
    this.p.ult = Math.min(100, this.p.ult + (e.boss ? 40 : 1.2));
    this.puff(e.pos, e.boss ? 2.5 : 1);
    if (e.boss) {
      if (this.boss === e) this.boss = null;
      this.ui.bossDown(e);
      this.shake = 1;
      if (e.boss === 2) { this.end(true); return; }
      // lluvia de gemas y curación
      for (let k = 0; k < 20; k++) this.dropGem(e.pos.x + (Math.random() - 0.5) * 4, e.pos.z + (Math.random() - 0.5) * 4, 4);
      this.p.hp = Math.min(this.p.maxHp, this.p.hp + this.p.maxHp * 0.3);
    } else this.dropGem(e.pos.x, e.pos.z, e.xp);
  }

  /* ------------------------------------------------------ compañeros */
  updateCompanions(dt, t) {
    const p = this.p, n = this.team.length;
    this.team.forEach((c, i) => {
      // formación detrás del entrenador
      const a = p.face + Math.PI + (n === 1 ? 0.6 : ((i / (n - 1)) - 0.5) * 2.4);
      const tx = p.pos.x + Math.sin(a) * 1.9, tz = p.pos.z + Math.cos(a) * 1.9;
      const k = 1 - Math.exp(-dt * 6);
      const ox = c.pos.x, oz = c.pos.z;
      c.pos.x += (tx - c.pos.x) * k; c.pos.z += (tz - c.pos.z) * k;
      const mv = Math.hypot(c.pos.x - ox, c.pos.z - oz) / dt;
      const st = this.cStats(c);
      const target = st.kind === 'orbit' || st.kind === 'quake' ? null : this.nearest(c.pos, st.range);
      const face = target ? Math.atan2(target.pos.x - c.pos.x, target.pos.z - c.pos.z) : mv > 0.5 ? Math.atan2(c.pos.x - ox, c.pos.z - oz) : c.face;
      c.face = lerpAngle(c.face, face, 1 - Math.exp(-dt * 10));
      c.model.position.set(c.pos.x, 0, c.pos.z);
      c.model.rotation.y = c.face;
      animateCreature(c.model, t, mv > 0.6, c.seed);

      c.cd -= dt;
      if (st.kind === 'orbit') { this.orbitAttack(c, st, dt, t); return; }
      if (c.cd > 0) return;
      if (st.kind === 'quake') {
        if (this.nearest(p.pos, st.range)) { c.cd = st.cd; this.quake(c, st); }
        return;
      }
      if (st.kind === 'nova') {
        if (this.nearest(c.pos, st.range)) { c.cd = st.cd; this.nova(c, st, t); }
        return;
      }
      if (!target) return;
      c.cd = st.cd;
      c.model.userData.inner.scale.setScalar(1.15);
      setTimeout(() => c.model.userData.inner.scale.setScalar(1), 90);
      if (st.kind === 'bolt') this.bolt(c, st, target);
      else if (st.kind === 'lob') this.lob(c, st, target);
      else if (st.kind === 'chain') this.chain(c, st, target);
    });
  }

  bolt(c, st, target) {
    const mesh = new THREE.Mesh(G.sphLo, glow(0x5fc8ff));
    mesh.scale.set(0.22, 0.22, 0.22);
    mesh.position.set(c.pos.x, 0.8, c.pos.z);
    const dir = new THREE.Vector3(target.pos.x - c.pos.x, 0, target.pos.z - c.pos.z).normalize();
    this.scene.add(mesh);
    this.projectiles.push({ kind: 'bolt', mesh, dir, speed: 19, life: 1, dmg: st.dmg, type: 'agua', pierce: st.pierce, hitSet: new Set() });
  }
  lob(c, st, target) {
    const mesh = new THREE.Mesh(G.sphLo, glow(0xff7a2f));
    mesh.scale.setScalar(0.35);
    this.scene.add(mesh);
    // apunta un poco por delante del objetivo
    const to = new THREE.Vector3(target.pos.x, 0, target.pos.z);
    this.projectiles.push({ kind: 'lob', mesh, from: new THREE.Vector3(c.pos.x, 1.1, c.pos.z), to, t: 0, dur: 0.6, dmg: st.dmg, type: 'fuego', radius: st.radius });
  }
  chain(c, st, first) {
    const hitSet = new Set();
    let from = new THREE.Vector3(c.pos.x, 1.1, c.pos.z), cur = first, dmg = st.dmg;
    for (let j = 0; j <= st.jumps && cur; j++) {
      const to = new THREE.Vector3(cur.pos.x, 0.8, cur.pos.z);
      this.bolt3d(from, to);
      hitSet.add(cur);
      this.hit(cur, dmg, 'rayo');
      dmg *= 0.85;
      from = to;
      cur = this.nearest(cur.pos, 6, hitSet);
    }
  }
  nova(c, st, t) {
    this.ring(c.pos, 0x9be8ff, st.range, 0.45, 0.2);
    for (const e of [...this.enemies]) {
      if ((e.pos.x - c.pos.x) ** 2 + (e.pos.z - c.pos.z) ** 2 < st.range ** 2) {
        e.slowUntil = t + 2.2;
        this.hit(e, st.dmg, 'hielo');
      }
    }
  }
  quake(c, st) {
    const p = this.p.pos;
    this.ring(p, 0xc99a5b, st.range, 0.5, 0.15);
    this.shake = Math.max(this.shake, 0.25);
    for (const e of [...this.enemies]) {
      const dx = e.pos.x - p.x, dz = e.pos.z - p.z, d = Math.hypot(dx, dz) || 1;
      if (d < st.range) this.hit(e, st.dmg, 'tierra', { x: (dx / d) * st.push * 2.5, z: (dz / d) * st.push * 2.5 });
    }
  }
  orbitAttack(c, st, dt, t) {
    while (c.orbit.length < st.count) {
      const leaf = new THREE.Mesh(G.cone4, glow(0x7dff6a));
      leaf.scale.set(0.2, 0.55, 0.08);
      this.scene.add(leaf);
      c.orbit.push(leaf);
    }
    const p = this.p.pos;
    c.orbit.forEach((leaf, i) => {
      const a = t * 3.4 + (i / c.orbit.length) * Math.PI * 2;
      leaf.position.set(p.x + Math.cos(a) * st.range, 0.8, p.z + Math.sin(a) * st.range);
      leaf.rotation.set(Math.PI / 2, 0, -a);
      for (const e of [...this.enemies]) {
        if (e.leafHit > t) continue;
        if ((e.pos.x - leaf.position.x) ** 2 + (e.pos.z - leaf.position.z) ** 2 < (e.r + 0.6) ** 2) {
          e.leafHit = t + st.cd;
          this.hit(e, st.dmg, 'planta');
        }
      }
    });
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      let done = false;
      if (pr.kind === 'bolt') {
        pr.mesh.position.addScaledVector(pr.dir, pr.speed * dt);
        pr.life -= dt;
        for (const e of this.enemies) {
          if (pr.hitSet.has(e)) continue;
          if ((e.pos.x - pr.mesh.position.x) ** 2 + (e.pos.z - pr.mesh.position.z) ** 2 < (e.r + 0.25) ** 2) {
            pr.hitSet.add(e);
            this.hit(e, pr.dmg, pr.type, { x: pr.dir.x * 2, z: pr.dir.z * 2 });
            if (pr.pierce-- <= 0) { done = true; break; }
          }
        }
        if (pr.life <= 0) done = true;
      } else if (pr.kind === 'lob') {
        pr.t += dt / pr.dur;
        const k = Math.min(1, pr.t);
        pr.mesh.position.lerpVectors(pr.from, pr.to, k);
        pr.mesh.position.y = pr.from.y * (1 - k) + Math.sin(k * Math.PI) * 3.5;
        if (k >= 1) {
          done = true;
          this.ring(pr.to, 0xff7a2f, pr.radius, 0.35, 0.15);
          this.ring(pr.to, 0xffd23a, pr.radius * 0.6, 0.3, 0.1);
          for (const e of [...this.enemies]) if ((e.pos.x - pr.to.x) ** 2 + (e.pos.z - pr.to.z) ** 2 < (pr.radius + e.r) ** 2) this.hit(e, pr.dmg, 'fuego');
        }
      }
      if (done) { this.scene.remove(pr.mesh); this.projectiles.splice(i, 1); }
    }
  }

  /* ------------------------------------------------------------ gemas */
  dropGem(x, z, v) {
    if (this.gems.length >= this.gemMax) { this.gems[(Math.random() * this.gems.length) | 0].v += v; return; }
    this.gems.push({ x, z, v, pull: false });
  }
  updateGems(dt, t) {
    const p = this.p, d = this.dummy;
    const m2 = p.magnet * p.magnet;
    let n = 0;
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      const dx = p.pos.x - g.x, dz = p.pos.z - g.z, d2 = dx * dx + dz * dz;
      if (d2 < m2) g.pull = true;
      if (g.pull) {
        const dd = Math.sqrt(d2) || 1, sp = 14 * dt;
        g.x += (dx / dd) * Math.min(sp, dd); g.z += (dz / dd) * Math.min(sp, dd);
        if (dd < 0.6) { this.addXp(g.v); this.gems.splice(i, 1); continue; }
      }
    }
    for (const g of this.gems) {
      d.position.set(g.x, 0.45 + Math.sin(t * 3 + g.x) * 0.1, g.z);
      d.rotation.set(0, t * 2 + g.z, 0);
      d.scale.setScalar(g.v >= 8 ? 0.3 : g.v >= 3 ? 0.24 : 0.17);
      d.updateMatrix();
      this.gemMesh.setMatrixAt(n, d.matrix);
      this.gemMesh.setColorAt(n, this.gemColors[g.v >= 20 ? 3 : g.v >= 8 ? 2 : g.v >= 3 ? 1 : 0]);
      n++;
    }
    this.gemMesh.count = n;
    this.gemMesh.instanceMatrix.needsUpdate = true;
    if (this.gemMesh.instanceColor) this.gemMesh.instanceColor.needsUpdate = true;
  }
  addXp(v) {
    const p = this.p;
    p.xp += v;
    while (p.xp >= p.xpNext) {
      p.xp -= p.xpNext;
      p.level++;
      p.xpNext = Math.floor(p.xpNext * 1.2 + 5);
      this.levelQueue++;
    }
  }

  /* ---------------------------------------------------------- mejoras */
  upgradeOptions() {
    const opts = [];
    for (const c of this.team) {
      if (c.lvl < MAX_CLEVEL) {
        const evolves = stageOf(c.lvl + 1) !== stageOf(c.lvl);
        opts.push({ kind: 'up', c, species: c.species, evolves, w: evolves ? 3 : 2 });
      }
    }
    if (this.team.length < MAX_TEAM) {
      for (const s of ALL_SPECIES) if (!this.team.some((c) => c.species === s)) opts.push({ kind: 'new', species: s, w: 1.4 });
    }
    const st = this.p.stats;
    if (st.hp < 5) opts.push({ kind: 'stat', id: 'hp', w: 1 });
    if (st.speed < 5) opts.push({ kind: 'stat', id: 'speed', w: 1 });
    if (st.magnet < 5) opts.push({ kind: 'stat', id: 'magnet', w: 1 });
    if (st.dmg < 5) opts.push({ kind: 'stat', id: 'dmg', w: 1 });
    if (st.regen < 5) opts.push({ kind: 'stat', id: 'regen', w: 0.8 });
    const pick = [];
    while (pick.length < 3 && opts.length) {
      const total = opts.reduce((s, o) => s + o.w, 0);
      let r = Math.random() * total;
      const idx = opts.findIndex((o) => (r -= o.w) <= 0);
      pick.push(opts.splice(idx < 0 ? 0 : idx, 1)[0]);
    }
    if (!pick.length) pick.push({ kind: 'stat', id: 'heal' });
    return pick;
  }
  applyUpgrade(o) {
    const p = this.p;
    if (o.kind === 'new') this.addCompanion(o.species);
    else if (o.kind === 'up') this.levelCompanion(o.c);
    else {
      if (o.id !== 'heal') p.stats[o.id]++;
      if (o.id === 'hp') { p.maxHp += 20; p.hp += 20; }
      if (o.id === 'speed') p.speed *= 1.08;
      if (o.id === 'magnet') p.magnet *= 1.3;
      if (o.id === 'dmg') p.dmgMult += 0.12;
      if (o.id === 'regen') p.regen += 0.6;
      if (o.id === 'heal') p.hp = p.maxHp;
    }
  }

  /* ------------------------------------------------- ataque definitivo */
  useUltimate() {
    if (!this.running || this.paused || this.over || this.ui.modalOpen || this.p.ult < 100) return;
    this.p.ult = 0;
    const pos = this.p.pos;
    const colors = this.team.map((c) => SPECIES[c.species].type);
    const col = { fuego: 0xff7a2f, agua: 0x3fa7ff, planta: 0x5fcf54, rayo: 0xc58bff, hielo: 0x8fe6ff, tierra: 0xc99a5b };
    colors.forEach((ty, i) => setTimeout(() => this.ring(pos, col[ty], 18, 0.7, 0.3), i * 90));
    this.ring(pos, 0xffffff, 18, 0.5, 0.4);
    this.shake = 1.2;
    this.ui.ultFlash();
    const dmg = 70 + this.p.level * 14;
    for (const e of [...this.enemies]) {
      const dx = e.pos.x - pos.x, dz = e.pos.z - pos.z, d = Math.hypot(dx, dz) || 1;
      if (d < 18) {
        // cada compañero aporta su tipo; se aplica el mejor contra el enemigo
        const best = colors.reduce((b, ty) => (effectiveness(ty, e.type) > effectiveness(b, e.type) ? ty : b), colors[0]);
        this.hit(e, dmg, best, { x: (dx / d) * 10, z: (dz / d) * 10 });
      }
    }
  }

  /* ---------------------------------------------------------- efectos */
  ring(pos, color, radius, dur = 0.4, thick = 0.12) {
    const geo = new THREE.RingGeometry(1 - thick, 1, 40);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(pos.x, 0.15, pos.z);
    this.scene.add(m);
    this.fx.push({ obj: m, life: dur, max: dur, update: (k) => { m.scale.setScalar(0.2 + radius * easeOut(1 - k)); mat.opacity = 0.9 * k; }, dispose: () => geo.dispose() });
  }
  bolt3d(a, b) {
    const pts = [a.clone()];
    const segs = 6;
    for (let i = 1; i < segs; i++) {
      const v = a.clone().lerp(b, i / segs);
      v.x += (Math.random() - 0.5) * 0.6; v.y += (Math.random() - 0.5) * 0.6; v.z += (Math.random() - 0.5) * 0.6;
      pts.push(v);
    }
    pts.push(b.clone());
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0), 12, 0.06, 4, false);
    const mat = new THREE.MeshBasicMaterial({ color: 0xfff35a, transparent: true });
    const m = new THREE.Mesh(geo, mat);
    this.scene.add(m);
    this.fx.push({ obj: m, life: 0.18, max: 0.18, update: (k) => { mat.opacity = k; }, dispose: () => geo.dispose() });
  }
  puff(pos, s = 1) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false });
    const m = new THREE.Mesh(G.sphLo, mat);
    m.position.set(pos.x, 0.6, pos.z);
    this.scene.add(m);
    this.fx.push({ obj: m, life: 0.3, max: 0.3, update: (k) => { m.scale.setScalar(s * (1.2 - k)); mat.opacity = 0.8 * k; } });
  }
  updateFx(dt) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.life -= dt;
      const k = Math.max(0, f.life / f.max);
      f.update(k);
      if (f.life <= 0) { this.scene.remove(f.obj); f.dispose?.(); f.obj.material.dispose?.(); this.fx.splice(i, 1); }
    }
  }

  end(win) {
    if (this.over) return;
    this.over = true;
    this.ui.showEnd(win, this);
  }
}

function easeOut(x) { return 1 - (1 - x) ** 3; }
function lerpAngle(a, b, k) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}
