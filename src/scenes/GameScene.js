import Phaser from 'phaser';
import { TILE, WORLD_W, WORLD_H, SEED, AI_ACTIVE_RADIUS } from '../config.js';
import { generateWorld, BLOCKING } from '../world/WorldGenerator.js';
import { TreeManager } from '../world/TreeManager.js';
import { DungeonManager } from '../world/DungeonManager.js';
import { ShadowArmy } from '../systems/ShadowArmy.js';
import { PlayerState } from '../systems/PlayerState.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { LootSystem } from '../systems/LootSystem.js';
import { Player } from '../entities/Player.js';
import { Mob } from '../entities/Mob.js';
import { MOBS } from '../data/mobs.js';
import { UIManager } from '../ui/UIManager.js';
import { bus } from '../core/EventBus.js';

/**
 * Escena principal: crea el mundo, el jugador, los monstruos y los sistemas,
 * gestiona la entrada y orquesta el bucle de actualización.
 */
export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    this.state = new PlayerState();
    this.target = null;

    // ---------- Mundo ----------
    this.world = generateWorld(WORLD_W, WORLD_H, SEED);
    const map = this.make.tilemap({ data: this.world.tiles, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0);
    this.ground = map.createLayer(0, tileset, 0, 0).setDepth(-1e6);
    this.ground.setCollision(BLOCKING);

    // El tilemap incluye el mundo exterior + las mazmorras (a la derecha, fuera de la vista)
    const H = WORLD_H * TILE;
    this.physics.world.setBounds(0, 0, this.world.w * TILE, H);
    this.cameras.main.setBounds(0, 0, WORLD_W * TILE, H);
    this.spawnPoint = { x: this.world.spawn.x * TILE + 16, y: this.world.spawn.y * TILE + 16 };

    this.trees = new TreeManager(this, this.world.trees);

    // ---------- Jugador ----------
    this.player = new Player(this, this.spawnPoint.x, this.spawnPoint.y, this.state);
    this.physics.add.collider(this.player.phys, this.ground);
    this.physics.add.collider(this.player.phys, this.trees.group);
    this.cameras.main.startFollow(this.player.phys, true, 0.12, 0.12);

    // ---------- Monstruos ----------
    this.mobGroup = this.physics.add.group();
    this.mobs = this.world.mobSpawns.map((s) => {
      const m = new Mob(this, MOBS[s.type], s.level, s.x * TILE + 16, s.y * TILE + 16, s.elite);
      this.mobGroup.add(m.phys);
      m.setupBody();
      return m;
    });
    this.physics.add.collider(this.mobGroup, this.ground);
    this.physics.add.collider(this.mobGroup, this.trees.group);
    this.dungeons = new DungeonManager(this);   // portales + mazmorras (añade sus mobs a this.mobs)

    // Culling: solo se dibujan los objetos decorativos cercanos a la cámara (gran mejora de FPS)
    this.cullList = [...this.trees.list, ...this.dungeons.decor];
    this.nextCull = 0;

    // ---------- Ejército de sombras (Mago nivel 50+) ----------
    this.shadowGroup = this.physics.add.group();
    this.physics.add.collider(this.shadowGroup, this.ground);
    this.physics.add.collider(this.shadowGroup, this.trees.group);
    this.army = new ShadowArmy(this);

    // ---------- Sistemas ----------
    this.combat = new CombatSystem(this);
    this.loot = new LootSystem(this);
    this.targetRing = this.add.image(0, 0, 'target_ring').setVisible(false);

    this.setupInput();
    this.ui = new UIManager(this);

    bus.on('player:levelup', ({ level }) => this.levelUpFx(level));
    this.events.once('shutdown', () => bus.removeAllListeners());
  }

  // ================== ENTRADA ==================
  setupInput() {
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
    this.input.keyboard.addCapture('TAB');
    this.input.mouse.disableContextMenu();

    this.input.keyboard.on('keydown', (e) => {
      const code = e.code;
      if (code.startsWith('Digit')) {
        const n = parseInt(code.slice(5), 10);
        const idx = n === 0 ? 9 : n - 1;
        this.ui.actionBar.press(idx);
        this.combat.tryCastSlot(idx);
        return;
      }
      if (e.repeat) return;
      switch (code) {
        case 'Tab': e.preventDefault(); this.cycleTarget(); break;
        case 'KeyE': if (!this.dungeons.tryUse(this.player)) this.trees.tryChop(this.player); break;
        case 'KeyT': this.ui.toggle('tablet'); break;
        case 'KeyB': case 'KeyI': this.ui.toggle('tablet', 'items'); break;
        case 'KeyP': case 'KeyK': this.ui.toggle('tablet', 'skills'); break;
        case 'KeyC': this.ui.toggle('char'); break;
        case 'KeyO': this.ui.toggle('tablet', 'shop'); break;
        case 'Escape': if (!this.ui.closeAll()) this.setTarget(null); break;
      }
    });

    this.input.on('pointerdown', (p) => {
      const m = this.mobAt(p.worldX, p.worldY);
      if (p.rightButtonDown()) {
        // Clic derecho = ataque básico (Golpe Heroico) sobre el monstruo
        // clicado o, si clicas en el suelo, sobre tu objetivo actual.
        if (m) this.setTarget(m);
        this.basicAttack();
        return;
      }
      if (m) this.setTarget(m);
    });
    this.input.on('pointermove', (p) => {
      const m = this.mobAt(p.worldX, p.worldY);
      if (this.hovered && this.hovered !== m) this.hovered.showPlate = this.hovered === this.target;
      this.hovered = m;
      if (m) m.showPlate = true;
      this.game.canvas.style.cursor = m ? 'crosshair' : 'default';
    });
  }

  /** Ataque básico (clic derecho). Usa la habilidad 'strike' con su GCD y alcance. */
  basicAttack() {
    if (!this.getValidTarget()) return this.ui.hud.error('No tienes objetivo');
    this.combat.tryCast('strike');
  }

  // ================== OBJETIVO ==================
  mobAt(x, y) {
    let best = null, bd = Infinity;
    for (const m of this.mobs) {
      if (m.dead || !m.containsPoint(x, y)) continue;
      const d = Math.abs(m.x - x) + Math.abs(m.y - y);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }

  setTarget(mob) {
    if (this.target) this.target.showPlate = false;
    this.target = mob;
    if (mob) mob.showPlate = true;
    bus.emit('target:changed', mob);
  }

  getValidTarget() { return this.target && !this.target.dead ? this.target : null; }

  nearbyMobs(range) {
    const p = this.player;
    return this.mobs
      .filter((m) => !m.dead && Math.hypot(m.x - p.x, m.y - p.y) <= range)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
  }

  autoTarget(range) {
    const m = this.nearbyMobs(range)[0] || null;
    if (m) this.setTarget(m);
    return m;
  }

  cycleTarget() {
    const list = this.nearbyMobs(420);
    if (!list.length) return this.setTarget(null);
    const i = list.indexOf(this.target);
    this.setTarget(list[(i + 1) % list.length]);
  }

  // ================== VIDA Y MUERTE ==================
  playerDie() {
    if (this.player.dead) return;
    this.player.dead = true;
    this.state.hp = 0;
    this.player.view.setAlpha(0.45);
    this.setTarget(null);
    const cur = this.dungeons.current;
    const where = cur ? (cur.isWinter ? 'en la entrada del bosque' : 'en la entrada de la mazmorra') : 'en el Claro del Inicio';
    bus.emit('ui:toast', `Has muerto… reaparecerás ${where}`, '#ff6b6b');
    this.time.delayedCall(3000, () => {
      const rp = this.dungeons.respawnPoint();
      this.player.phys.body.reset(rp.x, rp.y);
      this.army.gatherAt(rp.x, rp.y);
      this.player.dead = false;
      this.player.view.setAlpha(1);
      this.state.hp = Math.round(this.state.stats.maxHp * 0.6);
      this.state.hunger = Math.max(this.state.hunger, 50);
    });
  }

  levelUpFx(level) {
    const p = this.player;
    const g = this.add.image(p.x, p.y - 30, 'glow').setTint(0xffd34d).setBlendMode('ADD').setScale(0.5).setDepth(2e6);
    this.tweens.add({ targets: g, scale: 4, alpha: 0, duration: 900, onComplete: () => g.destroy() });
    this.combat.burst(p.x, p.y - 30, 0xffd34d, 26);
    this.combat.float(p.x, p.y - 90, `¡Nivel ${level}!`, '#ffd34d', 28);
  }

  cull(now) {
    if (now < this.nextCull) return;
    this.nextCull = now + 150;
    const v = this.cameras.main.worldView, m = 180;
    const x0 = v.x - m, x1 = v.right + m, y0 = v.y - m, y1 = v.bottom + m + 80;
    for (const o of this.cullList) {
      const vis = o.x > x0 && o.x < x1 && o.y > y0 && o.y < y1;
      if (o.visible !== vis) o.setVisible(vis);
    }
  }

  // ================== BUCLE ==================
  update(time, delta) {
    const now = performance.now();
    const dt = Math.min(delta, 50) / 1000;
    const k = this.keys;
    const vx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    const vy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    this.player.update(time, vx, vy);

    const p = this.player;
    for (const m of this.mobs) {
      if (Math.abs(m.x - p.x) < AI_ACTIVE_RADIUS && Math.abs(m.y - p.y) < AI_ACTIVE_RADIUS * 0.75) m.update(now, dt, p);
      else m.sleep();
    }

    this.combat.update(now, dt);
    this.army.update(now, dt);
    this.loot.update(p);
    this.trees.update(now, p);
    this.dungeons.update(now, p);
    this.dungeons.snow(now);
    this.cull(now);

    if (!p.dead) {
      this.state.tick(dt, now);
      if (this.state.hp <= 0) this.playerDie();
    }

    const t = this.getValidTarget();
    this.targetRing.setVisible(!!t);
    if (t) {
      this.targetRing.setPosition(t.x, t.y).setDepth(t.y - 2).setScale(t.scale)
        .setTint(t.state === 'chase' ? 0xff4a3a : 0xffe14d);
    }

    this.ui.update(now);
  }
}
