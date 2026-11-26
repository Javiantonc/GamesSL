// Núcleo del juego: escena, cámara en tercera persona, control del héroe,
// selección de objetivos, NPCs, portales, mazmorras, muerte y guardado.
import * as THREE from 'three';
import { buildTerrain, heightAt, zoneAt, walkable, ZONES, WINTER_Z } from './world/terrain.js';
import { buildProps, animateFires } from './world/props.js';
import { buildHumanoid, animateHumanoid, LOOKS, NPC_LOOKS } from './world/models.js';
import { DungeonInstance } from './world/dungeon.js';
import { DUNGEONS, DUNGEONS_TO_UNLOCK_WINTER } from './data/dungeons.js';
import { NPCS } from './data/quests.js';
import { CLASSES } from './data/classes.js';
import { MobManager, lerpAngle } from './mobs.js';
import { Combat } from './combat.js';
import { Quests } from './quests.js';
import { PlayerState } from './player.js';
import { G, glow, toon, part } from './gfx.js';

const SAVE_KEY = 'mini-realms-3d-v1';
const SKY = { world: 0x9fd3f5, dungeon: 0x0d0b16, winter: 0xd8e8f5 };
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();

/** Texto en un sprite (carteles de nombre, marcas de misión). */
export function makeLabel(lines, opts = {}) {
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d');
  const fs = opts.size || 40;
  cv.width = 512; cv.height = opts.big ? 160 : 128;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  lines.forEach(([txt, color, scale = 1], i) => {
    ctx.font = `bold ${fs * scale}px Trebuchet MS, sans-serif`;
    const y = 8 + fs * scale * 0.95 + i * fs * 1.05;
    ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.strokeText(txt, 256, y);
    ctx.fillStyle = color; ctx.fillText(txt, 256, y);
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
  const w = opts.w || 5;
  sp.scale.set(w, w * (cv.height / cv.width), 1);
  sp.renderOrder = 10;
  return sp;
}

export class Game {
  constructor(container, ui) {
    this.ui = ui;
    ui.g = this;
    this.alive = false;
    this.now = 0;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    this.canvas = this.renderer.domElement;

    const scene = this.scene = new THREE.Scene();
    scene.background = new THREE.Color(SKY.world);
    scene.fog = new THREE.Fog(SKY.world, 90, 230);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.3, 600);
    this.hemi = new THREE.HemisphereLight(0xe6f4ff, 0x5b7a3a, 1.15);
    this.sun = new THREE.DirectionalLight(0xfff1d6, 2.1);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 160 });
    this.sun.shadow.bias = -0.0005; this.sun.shadow.normalBias = 0.04;
    scene.add(this.hemi, this.sun, this.sun.target);

    buildTerrain(scene);
    this.props = buildProps(scene);
    this.mobs = new MobManager(this);
    this.combat = new Combat(this);
    this.quests = new Quests(this);
    this.dungeons = new Map();
    this.dungeonTier = null;
    this.winterOpen = false;
    this.buildNpcs();
    this.buildPortals();

    // cámara
    this.yaw = Math.PI; this.pitch = 0.42; this.dist = 11; this.camLook = new THREE.Vector3();
    this.shakeT = 0;
    this.keys = new Set();
    this.joy = { x: 0, y: 0 };
    this.vy = 0; this.onGround = true;
    this.moving = false;
    this.lastZone = null;
    this.bindInput();
    addEventListener('resize', () => this.resize());
    this.resize();
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  resize() {
    this.renderer.setSize(innerWidth, innerHeight);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }

  /* =========================================================== partida */
  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } }
  loadSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; } }
  save() {
    if (!this.pl || !this.alive) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...this.pl.toJSON(), pos: [this.ppos.x, this.ppos.z] })); } catch { /* sin almacenamiento */ }
  }
  deleteSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* */ } }

  start(name, cls, saved) {
    this.pl = saved ? PlayerState.from(saved) : new PlayerState(name, cls);
    if (!this.mobs.list.length) this.mobs.populateWorld();
    this.hero = buildHumanoid(LOOKS[this.pl.cls]);
    this.hero.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.scene.add(this.hero);
    const sp = saved?.pos && walkable(saved.pos[0], saved.pos[1]) ? saved.pos : [2, 6];
    this.ppos = new THREE.Vector3(sp[0], 0, sp[1]);
    this.ppos.y = heightAt(this.ppos.x, this.ppos.z);
    this.face = 0; this.yaw = Math.PI;
    this.target = null;
    this.alive = true;
    this.checkWinter(true);
    this.refreshMarkers();
    this.ui.onStart();
    this.updateCamera(1);
    this.saveTimer = setInterval(() => this.save(), 15000);
    if (!saved) {
      this.ui.toast(`¡Bienvenido a Albor, ${this.pl.name}!`, true);
      this.ui.log('Habla con los personajes con ! sobre la cabeza para conseguir misiones (tecla F o clic).', 'info');
    }
  }

  /* ============================================================= NPCs */
  buildNpcs() {
    this.npcs = [];
    for (const [id, d] of Object.entries(NPCS)) {
      const m = buildHumanoid(NPC_LOOKS[d.look]);
      m.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      const [x, z] = d.pos;
      m.position.set(x, heightAt(x, z), z);
      m.rotation.y = Math.atan2(-x, -z) + (Math.abs(x) + Math.abs(z) < 1 ? 0 : 0);
      this.scene.add(m);
      const label = makeLabel([[d.name, '#7dff7a'], [`<${d.title}>`, '#d9e6ff', 0.75]], { w: 4.6 });
      label.position.set(0, 3.0, 0);
      m.add(label);
      const npc = { id, d, mesh: m, pos: m.position, marker: null, r: 0.8 };
      m.userData.npc = npc;
      this.props.col.add(x, z, 0.7, 'npc');
      this.npcs.push(npc);
    }
  }
  refreshMarkers() {
    if (!this.pl) return;
    for (const n of this.npcs) {
      const mk = this.quests.marker(n.id);
      if (n.markerKind === mk) continue;
      if (n.marker) { n.mesh.remove(n.marker); n.marker.material.map.dispose(); n.marker = null; }
      n.markerKind = mk;
      if (!mk) continue;
      const color = mk === '…' ? '#c8c8c8' : '#ffd23a';
      n.marker = makeLabel([[mk, color, 2.4]], { w: 3.2, big: true });
      n.marker.position.set(0, 4.3, 0);
      n.mesh.add(n.marker);
    }
    this.ui.minimapDirty = true;
  }

  /* ========================================================= portales */
  makePortal(color, x, z, y) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const stone = toon(0x8f8a99, { flatShading: true });
    part(g, G.cyl6, stone, [0, 0.2, 0], [3.4, 0.4, 3.4]);
    for (const s of [-1, 1]) part(g, G.box, stone, [s * 2.4, 2.6, 0], [0.8, 5.2, 0.9]);
    part(g, G.box, stone, [0, 5.4, 0], [5.8, 0.8, 1.1]);
    const swirl = new THREE.Mesh(new THREE.CircleGeometry(2.0, 32), glow(color, 0.75));
    swirl.position.set(0, 2.7, 0); swirl.scale.set(1, 1.25, 1);
    const swirl2 = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.9, 6, 1), glow(0xffffff, 0.35));
    swirl2.position.set(0, 2.7, 0.03); swirl2.scale.set(1, 1.25, 1);
    swirl.material = swirl.material.clone(); swirl.material.side = THREE.DoubleSide;
    swirl2.material = swirl2.material.clone(); swirl2.material.side = THREE.DoubleSide;
    g.add(swirl, swirl2);
    const light = new THREE.PointLight(color, 25, 14, 1.6);
    light.position.set(0, 2.8, 1.5);
    g.add(light);
    g.userData.swirl = [swirl, swirl2];
    this.scene.add(g);
    return g;
  }
  buildPortals() {
    this.portals = DUNGEONS.map((d, i) => {
      const [x, z] = d.pos;
      const y = heightAt(x, z);
      const g = this.makePortal(d.hex, x, z, y);
      g.rotation.y = Math.atan2(-x, -z);
      const lab = makeLabel([[d.name, d.color], [`Mazmorra · Nv ${d.minLevel}-${d.maxLevel}`, '#ffffff', 0.7]], { w: 7 });
      lab.position.set(0, 7.2, 0);
      g.add(lab);
      this.props.col.add(x + Math.sin(g.rotation.y + Math.PI / 2) * 2.4, z + Math.cos(g.rotation.y + Math.PI / 2) * 2.4, 0.7, 'portal');
      this.props.col.add(x - Math.sin(g.rotation.y + Math.PI / 2) * 2.4, z - Math.cos(g.rotation.y + Math.PI / 2) * 2.4, 0.7, 'portal');
      const portal = { kind: 'enter', tier: i, mesh: g, pos: new THREE.Vector3(x, y, z) };
      g.userData.portal = portal;
      return portal;
    });
    this.exitPortals = [];
  }

  /* ========================================================= mazmorras */
  enterDungeon(tier) {
    const d = DUNGEONS[tier], p = this.pl;
    if (p.level < d.minLevel) { this.ui.error(`Necesitas nivel ${d.minLevel} para entrar en ${d.name}`); return; }
    this.combat.interrupt();
    this.setTarget(null);
    let inst = this.dungeons.get(tier);
    if (!inst) { inst = new DungeonInstance(this.scene, tier); this.dungeons.set(tier, inst); }
    for (const [, di] of this.dungeons) di.group.visible = false;
    inst.group.visible = true;
    // monstruos nuevos en cada visita
    this.mobs.clearDungeon(tier);
    for (const s of inst.spawnPoints()) {
      this.mobs.spawn(s.mob, s.lvl, s.x, s.z, { dungeon: tier, tint: d.hex, elite: Math.random() < 0.18 });
    }
    this.boss = this.mobs.spawn(d.boss, d.maxLevel + 1, inst.bossPos.x, inst.bossPos.z, { dungeon: tier, tint: d.hex, boss: true, name: d.bossName });
    // portal de salida
    this.clearExitPortals();
    this.addExitPortal(inst.entry.x, inst.entry.z + 5, d.hex);
    this.returnPos = { x: this.portals[tier].pos.x + Math.sin(this.portals[tier].mesh.rotation.y) * 6, z: this.portals[tier].pos.z + Math.cos(this.portals[tier].mesh.rotation.y) * 6 };
    this.dungeonTier = tier;
    this.inst = inst;
    this.setSky('dungeon', d.hex);
    this.teleport(inst.entry.x, inst.entry.z - 1);
    this.yaw = 0; this.face = Math.PI;
    this.ui.zone(d.name, `Mazmorra ${d.colorName} · Nv ${d.minLevel}-${d.maxLevel}`, d.color);
    this.ui.log(`Has entrado en ${d.name}. Derrota a ${d.bossName} al fondo de la mazmorra.`, 'info');
  }
  addExitPortal(x, z, color) {
    const g = this.makePortal(color, x, z, 0);
    const lab = makeLabel([['Salida', '#ffffff']], { w: 4 });
    lab.position.set(0, 7, 0);
    g.add(lab);
    const portal = { kind: 'exit', mesh: g, pos: new THREE.Vector3(x, 0, z) };
    g.userData.portal = portal;
    this.exitPortals.push(portal);
  }
  clearExitPortals() {
    for (const p of this.exitPortals) this.scene.remove(p.mesh);
    this.exitPortals = [];
  }
  exitDungeon() {
    if (this.dungeonTier === null) return;
    const tier = this.dungeonTier;
    this.combat.interrupt();
    this.setTarget(null);
    this.clearExitPortals();
    this.mobs.clearDungeon(tier);
    this.dungeons.get(tier).group.visible = false;
    this.dungeonTier = null;
    this.inst = null;
    this.setSky(zoneAt(this.returnPos.x, this.returnPos.z) === 'invierno' ? 'winter' : 'world');
    this.teleport(this.returnPos.x, this.returnPos.z);
    this.lastZone = null;
  }
  onDungeonBoss(m) {
    const tier = m.dungeon, d = DUNGEONS[tier], p = this.pl;
    const first = !p.dungeons.includes(tier);
    if (first) p.dungeons.push(tier);
    this.ui.toast(`🏆 ¡Has completado ${d.name}!`, true);
    if (first) this.ui.log(`Mazmorras completadas: ${p.dungeons.length}/10`, 'quest');
    this.addExitPortal(m.home.x, m.home.z + 6, d.hex);
    this.quests.onDungeon();
    this.checkWinter();
  }
  checkWinter(silent) {
    if (this.winterOpen || this.pl.dungeons.length < DUNGEONS_TO_UNLOCK_WINTER) return;
    this.winterOpen = true;
    this.scene.remove(this.props.ice);
    this.props.col.remove('iceWall');
    if (!silent) {
      this.ui.toast('❄️ ¡El muro de hielo del sur se ha derrumbado! El Bosque Invernal está abierto.', true);
      this.ui.log('Viaja al sur por el camino para llegar al Bosque Invernal (Nv 76-80).', 'quest');
    }
  }
  setSky(kind, tint) {
    const c = new THREE.Color(SKY[kind]);
    this.scene.background = c;
    this.scene.fog.color = c;
    if (kind === 'dungeon') {
      this.scene.fog.near = 18; this.scene.fog.far = 70;
      this.hemi.color.set(tint).lerp(new THREE.Color(0xffffff), 0.5); this.hemi.groundColor.set(0x1a1424); this.hemi.intensity = 0.7;
      this.sun.intensity = 0.5;
    } else {
      this.scene.fog.near = kind === 'winter' ? 50 : 90; this.scene.fog.far = kind === 'winter' ? 160 : 230;
      this.hemi.color.set(0xe6f4ff); this.hemi.groundColor.set(kind === 'winter' ? 0x9ab0c8 : 0x5b7a3a); this.hemi.intensity = 1.15;
      this.sun.intensity = 2.1;
    }
    this.skyKind = kind;
  }

  /* ======================================================== movimiento */
  teleport(x, z) {
    this.ppos.x = x; this.ppos.z = z;
    this.ppos.y = this.groundY(x, z);
    this.vy = 0;
    this.hero.position.copy(this.ppos);
    this.updateCamera(1);
  }
  dashTo(x, z, dur) { this.dash = { fx: this.ppos.x, fz: this.ppos.z, tx: x, tz: z, t: 0, dur }; }
  blink(dx, dz) {
    const steps = 20;
    let lx = this.ppos.x, lz = this.ppos.z;
    for (let i = 1; i <= steps; i++) {
      const x = this.ppos.x + (dx * i) / steps, z = this.ppos.z + (dz * i) / steps;
      if (!this.canStand(x, z)) break;
      lx = x; lz = z;
    }
    this.teleport(lx, lz);
  }
  canStand(x, z) {
    if (this.dungeonTier !== null) return this.inst.isFree(x, z);
    if (!walkable(x, z)) return false;
    if (!this.winterOpen && z > WINTER_Z - 2) return false;
    return this.props.col.free(x, z, 0.4);
  }
  groundY(x, z) { return this.dungeonTier !== null ? 0 : heightAt(x, z); }
  faceTo(x, z) { this.face = Math.atan2(x - this.ppos.x, z - this.ppos.z); }
  heroFacing() { return { x: Math.sin(this.face), z: Math.cos(this.face) }; }
  shake(n) { this.shakeT = Math.max(this.shakeT, n); }

  /* ============================================================ input */
  bindInput() {
    const c = this.canvas;
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      const k = e.code;
      this.keys.add(k);
      if (!this.alive) return;
      if (k === 'Tab') { e.preventDefault(); this.tabTarget(); }
      if (k === 'Space') { e.preventDefault(); this.jump(); }
      if (k === 'Escape') { if (!this.ui.closeAll()) this.setTarget(null); }
      if (/^Digit[1-6]$/.test(k)) this.ui.pressSlot(+k.slice(5) - 1);
      if (k === 'Digit7') this.usePotion('pocion');
      if (k === 'Digit8') this.usePotion('eter');
      if (k === 'KeyH') this.useHearth();
      if (k === 'KeyF' || k === 'KeyE') this.interact();
      if (k === 'KeyC') this.ui.toggle('char');
      if (k === 'KeyB' || k === 'KeyI') this.ui.toggle('bag');
      if (k === 'KeyL' || k === 'KeyJ') this.ui.toggle('log');
      if (k === 'KeyM') this.ui.toggle('map');
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    // ratón: arrastrar gira la cámara (izq. o der.), clic selecciona,
    // clic derecho sobre un enemigo ataca.
    let drag = null;
    c.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return; // lo gestiona la UI táctil
      drag = { x: e.clientX, y: e.clientY, moved: 0, btn: e.button };
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      this.rotateCam(dx, dy);
      if (drag.btn === 2) this.face = this.yaw + Math.PI; // el héroe mira hacia donde mira la cámara
    });
    c.addEventListener('pointerup', (e) => {
      if (!drag) return;
      if (drag.moved < 6) this.clickAt(e.clientX, e.clientY, drag.btn === 2);
      drag = null;
    });
    c.addEventListener('wheel', (e) => { this.dist = Math.min(24, Math.max(4, this.dist + Math.sign(e.deltaY) * 1.2)); }, { passive: true });
  }
  rotateCam(dx, dy) {
    this.yaw -= dx * 0.006;
    this.pitch = Math.min(1.25, Math.max(-0.15, this.pitch + dy * 0.004));
  }

  pick(sx, sy) {
    ndc.set((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, this.camera);
    const objs = [];
    for (const m of this.mobs.list) if (!m.dead && m.mesh.visible && m.dungeon === this.dungeonTier) objs.push(m.mesh);
    if (this.dungeonTier === null) for (const n of this.npcs) objs.push(n.mesh);
    for (const p of this.dungeonTier === null ? this.portals : this.exitPortals) objs.push(p.mesh);
    const hits = ray.intersectObjects(objs, true);
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData.npc && !o.userData.portal && !this.mobByMesh(o)) o = o.parent;
      if (!o) continue;
      if (o.userData.npc) return { npc: o.userData.npc };
      if (o.userData.portal) return { portal: o.userData.portal };
      return { mob: this.mobByMesh(o) };
    }
    // margen generoso: el enemigo más cercano al rayo
    let best = null, bd = 1.6;
    for (const m of this.mobs.list) {
      if (m.dead || !m.mesh.visible || m.dungeon !== this.dungeonTier) continue;
      const d = ray.ray.distanceToPoint(new THREE.Vector3(m.pos.x, m.pos.y + m.sc, m.pos.z));
      if (d < bd * m.sc) { bd = d / m.sc; best = m; }
    }
    return best ? { mob: best } : null;
  }
  mobByMesh(o) { return this.mobs.list.find((m) => m.mesh === o); }
  clickAt(sx, sy, right) {
    if (!this.alive || this.pl.dead) return;
    const hit = this.pick(sx, sy);
    if (!hit) { if (!right) this.setTarget(null); return; }
    if (hit.mob) {
      this.setTarget(hit.mob);
      if (right || hit.mob === this.target && this.combat.distTo(hit.mob) < this.pl.C.auto.range) this.combat.autoOn = true;
      if (right) this.combat.lastCombat = this.now;
    } else if (hit.npc) this.talkTo(hit.npc);
    else if (hit.portal) this.usePortal(hit.portal);
  }
  setTarget(m) {
    this.target = m;
    if (!m) this.combat.autoOn = false;
    this.ui.targetChanged();
  }
  tabTarget() {
    const f = this.heroFacing();
    const cands = this.mobs.near(this.ppos, 32, (m) => m.dungeon === this.dungeonTier && m.mesh.visible)
      .map((m) => {
        const dx = m.pos.x - this.ppos.x, dz = m.pos.z - this.ppos.z, d = Math.hypot(dx, dz) || 1;
        const camF = { x: -Math.sin(this.yaw), z: -Math.cos(this.yaw) };
        const front = (dx * camF.x + dz * camF.z) / d;
        return { m, score: d - front * 10 };
      }).sort((a, b) => a.score - b.score).map((c) => c.m);
    if (!cands.length) { this.ui.error('No hay enemigos cerca'); return; }
    const i = cands.indexOf(this.target);
    this.setTarget(cands[(i + 1) % cands.length]);
    void f;
  }
  jump() {
    if (this.onGround && !this.pl.dead) { this.vy = 9.5; this.onGround = false; this.combat.interrupt(); }
  }

  /* ===================================================== interacción */
  nearestInteract() {
    let best = null, bd = 5.5;
    const list = this.dungeonTier === null ? [...this.npcs, ...this.portals] : this.exitPortals;
    for (const o of list) {
      const d = Math.hypot(o.pos.x - this.ppos.x, o.pos.z - this.ppos.z);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }
  interact() {
    const o = this.nearestInteract();
    if (!o) { if (this.target && !this.target.dead) this.combat.autoOn = true; return; }
    if (o.d) this.talkTo(o); else this.usePortal(o);
  }
  talkTo(npc) {
    if (Math.hypot(npc.pos.x - this.ppos.x, npc.pos.z - this.ppos.z) > 6) { this.ui.error('Acércate más para hablar'); return; }
    this.faceTo(npc.pos.x, npc.pos.z);
    npc.mesh.rotation.y = Math.atan2(this.ppos.x - npc.pos.x, this.ppos.z - npc.pos.z);
    this.quests.onTalk(npc.id);
    this.ui.npcDialog(npc);
  }
  usePortal(p) {
    if (Math.hypot(p.pos.x - this.ppos.x, p.pos.z - this.ppos.z) > 7) { this.ui.error('Acércate al portal'); return; }
    if (p.kind === 'enter') this.ui.portalDialog(p.tier);
    else this.exitDungeon();
  }

  usePotion(kind) {
    const p = this.pl, t = this.now;
    if (p.dead) return;
    if ((p.potions[kind] || 0) <= 0) { this.ui.error('No te quedan'); return; }
    if ((p.cds.potion || 0) > t) { this.ui.error('Las pociones aún no están listas'); return; }
    p.potions[kind]--;
    p.cds.potion = t + 30;
    if (kind === 'pocion') this.combat.healPlayer(p.maxHp * 0.4);
    else { p.res = Math.min(p.maxRes, p.res + p.maxRes * 0.5); this.ui.popup(this.ppos.x, this.ppos.y + 2.6, this.ppos.z, `+${p.C.resName}`, 'mana'); }
  }
  useHearth() {
    const p = this.pl;
    if (p.dead) return;
    if ((p.cds.hearth || 0) > this.now) { this.ui.error(`La piedra de hogar estará lista en ${Math.ceil(p.cds.hearth - this.now)} s`); return; }
    if (this.combat.inCombat(this.now)) { this.ui.error('No puedes usarla en combate'); return; }
    this.combat.cast = { ab: { id: 'hearth', name: 'Piedra de hogar', icon: '🏠', kind: 'hearth' }, start: this.now, end: this.now + 4 };
    this.hero.userData.anim.channel = true;
  }
  hearthHome() {
    this.pl.cds.hearth = this.now + 60;
    if (this.dungeonTier !== null) { this.returnPos = { x: 2, z: 6 }; this.exitDungeon(); }
    else { this.setSky('world'); this.teleport(2, 6); }
    this.ui.log('Has vuelto a Albor', 'info');
  }

  /* ===================================================== vida y muerte */
  onLevelUp(n) {
    const p = this.pl;
    this.combat.ring(this.ppos, 0xffd84a, 3.5, 0.9, 0.2);
    this.combat.ring(this.ppos, 0xffffff, 2, 0.7, 0.3);
    this.ui.toast(`⭐ ¡Nivel ${p.level}! +${n * 3} puntos de atributo (tecla C)`, true);
    const learned = p.C.abilities.filter((a) => a.lvl > p.level - n && a.lvl <= p.level);
    for (const a of learned) this.ui.log(`Has aprendido ${a.icon} ${a.name}`, 'quest');
    this.ui.abilitiesChanged();
    this.refreshMarkers();
    this.save();
  }
  playerDied() {
    const p = this.pl;
    p.dead = true;
    this.combat.interrupt();
    this.setTarget(null);
    for (const m of this.mobs.list) if (m.state === 'chase') m.state = 'evade';
    this.hero.rotation.z = Math.PI / 2;
    this.ui.death();
  }
  respawn() {
    const p = this.pl;
    p.dead = false;
    p.hp = Math.round(p.maxHp * 0.6);
    p.res = p.resStart();
    this.hero.rotation.z = 0;
    if (this.dungeonTier !== null) this.teleport(this.inst.entry.x, this.inst.entry.z - 1);
    else {
      const z = zoneAt(this.ppos.x, this.ppos.z);
      const spot = { pradera: [2, 6], bosque: [10, -150], canon: [168, 36], invierno: [0, 196] }[z];
      this.teleport(spot[0], spot[1]);
    }
    this.ui.log('Has resucitado.', 'info');
  }

  /* ============================================================ bucle */
  frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    this.now += dt;
    const t = this.now;
    if (this.alive) this.update(dt, t);
    else this.yaw += dt * 0.05, this.attract(t);
    animateFires(this.props.fires, t);
    for (const p of [...this.portals, ...this.exitPortals]) {
      const [a, b] = p.mesh.userData.swirl;
      b.rotation.z = t * 1.4; a.material.opacity = 0.65 + Math.sin(t * 3) * 0.1;
    }
    this.renderer.render(this.scene, this.camera);
    if (this.alive) this.ui.frame(dt, t);
  }
  /** Cámara de la pantalla de título. */
  attract(t) {
    const r = 60;
    this.camera.position.set(Math.sin(t * 0.05) * r, 28, Math.cos(t * 0.05) * r);
    this.camera.lookAt(0, 4, 0);
  }

  update(dt, t) {
    const p = this.pl;
    // movimiento relativo a la cámara
    let mx = 0, mz = 0;
    const K = this.keys;
    if (!p.dead && !this.ui.typing) {
      if (K.has('KeyW') || K.has('ArrowUp')) mz -= 1;
      if (K.has('KeyS') || K.has('ArrowDown')) mz += 1;
      if (K.has('KeyA') || K.has('ArrowLeft')) mx -= 1;
      if (K.has('KeyD') || K.has('ArrowRight')) mx += 1;
      if (this.joy.x || this.joy.y) { mx = this.joy.x; mz = this.joy.y; }
    }
    const len = Math.hypot(mx, mz);
    this.moving = len > 0.15;
    let speed = 0;
    if (this.dash) {
      const d = this.dash;
      d.t += dt / d.dur;
      const k = Math.min(1, d.t);
      this.ppos.x = d.fx + (d.tx - d.fx) * k; this.ppos.z = d.fz + (d.tz - d.fz) * k;
      speed = 20;
      if (k >= 1) this.dash = null;
    } else if (this.moving) {
      const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
      // adelante de la cámara = -(sin, cos)
      const fx = -sin, fz = -cos, rx = cos, rz = -sin;
      const n = Math.min(1, len) / len;
      let vx = (fx * -mz + rx * mx) * n, vz = (fz * -mz + rz * mx) * n;
      const back = mz > 0.3 && Math.abs(mx) < 0.3;
      speed = 7.2 * (back ? 0.6 : 1);
      const prev = { x: this.ppos.x, z: this.ppos.z };
      this.ppos.x += vx * speed * dt; this.ppos.z += vz * speed * dt;
      if (this.dungeonTier !== null) this.inst.clamp(this.ppos, prev);
      else {
        this.props.col.push(this.ppos, 0.45);
        if (!walkable(this.ppos.x, this.ppos.z)) { this.ppos.x = prev.x; this.ppos.z = prev.z; }
        if (!this.winterOpen && this.ppos.z > WINTER_Z - 2) this.ppos.z = Math.min(this.ppos.z, WINTER_Z - 2);
      }
      this.face = back ? Math.atan2(-vx, -vz) : Math.atan2(vx, vz);
    }
    // gravedad
    const gy = this.groundY(this.ppos.x, this.ppos.z);
    this.vy -= 26 * dt;
    this.ppos.y += this.vy * dt;
    if (this.ppos.y <= gy) { this.ppos.y = gy; this.vy = 0; this.onGround = true; }
    // héroe
    this.hero.position.copy(this.ppos);
    this.hero.rotation.y = lerpAngle(this.hero.rotation.y, this.face, 1 - Math.exp(-dt * 14));
    if (!p.dead) animateHumanoid(this.hero, t, this.moving ? speed : 0, dt, !this.onGround);

    this.combat.update(dt, t);
    this.mobs.update(dt, t);
    if (this.target && (this.target.dead || this.target.dungeon !== this.dungeonTier)) this.setTarget(null);
    this.updateCamera(dt);
    // sol sigue al jugador
    this.sun.position.set(this.ppos.x - 30, this.ppos.y + 60, this.ppos.z + 22);
    this.sun.target.position.copy(this.ppos);
    // zona
    if (this.dungeonTier === null) {
      const z = zoneAt(this.ppos.x, this.ppos.z);
      if (z !== this.lastZone) {
        if (this.lastZone !== null) {
          const Z = ZONES[z];
          this.ui.zone(Z.name, `Nv ${Z.lvl}`, Z.color);
        }
        this.lastZone = z;
        this.setSky(z === 'invierno' ? 'winter' : 'world');
      }
    }
  }

  updateCamera(dt) {
    const tgt = this.camLook.set(this.ppos.x, this.ppos.y + 2.0, this.ppos.z);
    let dist = this.dist;
    if (this.dungeonTier !== null) dist = Math.min(dist, 13);
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const pos = new THREE.Vector3(tgt.x + Math.sin(this.yaw) * cp * dist, tgt.y + sp * dist, tgt.z + Math.cos(this.yaw) * cp * dist);
    if (this.dungeonTier === null) {
      const gy = heightAt(pos.x, pos.z) + 0.8;
      if (pos.y < gy) pos.y = gy;
    } else pos.y = Math.min(Math.max(pos.y, 1.2), 9);
    if (dt >= 1) this.camera.position.copy(pos);
    else this.camera.position.lerp(pos, 1 - Math.exp(-dt * 14));
    if (this.shakeT > 0) {
      this.shakeT = Math.max(0, this.shakeT - dt * 1.8);
      this.camera.position.x += (Math.random() - 0.5) * this.shakeT;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeT;
    }
    this.camera.lookAt(tgt);
  }

  classInfo() { return CLASSES[this.pl.cls]; }
}
