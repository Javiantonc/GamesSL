import { bus } from '../core/EventBus.js';
import { characterLayers, PART_NAMES, RES } from '../gfx/characters.js';

/**
 * Vista + movimiento del jugador.
 *  - `phys`: imagen con cuerpo Arcade (la sombra en los pies) -> colisiones.
 *  - `view`: contenedor -> `rig` (capas chibi a doble resolución, escala 0,5).
 * Las capas dependen de la clase y del equipo (ver gfx/characters.js).
 * Animación procedural: pasos alternos, rebote, respiración y parpadeo.
 */
export class Player {
  constructor(scene, x, y, state) {
    this.scene = scene;
    this.state = state;
    this.speed = 165;
    this.facing = 1;
    this.moveDir = { x: 1, y: 0 };
    this.dead = false;
    this.dash = null;
    this.swinging = false;
    this.blinkUntil = 0;
    this.nextBlink = 0;

    this.phys = scene.physics.add.image(x, y, 'shadow');
    this.phys.body.setSize(18, 10);
    this.phys.setCollideWorldBounds(true);

    this.imgs = {};
    for (const n of PART_NAMES) this.imgs[n] = scene.add.image(0, 0, 'shadow').setVisible(false);
    this.rig = scene.add.container(0, 0).setScale(1 / RES);
    this.shieldFx = scene.add.image(0, -30, 'glow').setScale(1.5).setTint(0x66aaff).setAlpha(0).setBlendMode('ADD');
    this.view = scene.add.container(x, y, [this.rig, this.shieldFx]);

    this.refreshGear();
    bus.on('equipment:changed', this.refreshGear, this);
    bus.on('class:changed', this.refreshGear, this);
  }

  get x() { return this.phys.x; }
  get y() { return this.phys.y; }

  /** Reconstruye las capas según clase + equipo (texturas, tintes y orden). */
  refreshGear() {
    this.layers = {};
    this.rig.removeAll(false);
    for (const n of PART_NAMES) this.imgs[n].setVisible(false);
    for (const l of characterLayers(this.state)) {
      const img = this.imgs[l.name];
      img.setTexture(l.key).setOrigin(0.5, l.oy ?? 0.5).setPosition(l.x * RES, l.y * RES)
        .setAngle(l.angle || 0).setFlipX(!!l.flipX).setScale(1).setVisible(l.visible !== false);
      if (l.tint != null && l.tint !== 0xffffff) img.setTint(l.tint); else img.clearTint();
      this.rig.add(img);
      this.layers[l.name] = l;
    }
  }

  /** Coloca una capa desplazada (dx, dy) respecto a su posición base. */
  place(name, dx = 0, dy = 0) {
    const l = this.layers[name];
    if (l) this.imgs[name].setPosition((l.x + dx) * RES, (l.y + dy) * RES);
  }

  startDash(dx, dy, ms) {
    const len = Math.hypot(dx, dy) || 1;
    this.dash = { x: dx / len, y: dy / len, until: performance.now() + ms };
  }

  update(time, vx, vy) {
    const now = performance.now();
    const body = this.phys.body;
    if (this.dead) {
      body.setVelocity(0, 0);
    } else if (this.dash && now < this.dash.until) {
      body.setVelocity(this.dash.x * 820, this.dash.y * 820);
    } else {
      this.dash = null;
      const len = Math.hypot(vx, vy);
      if (len > 0) {
        vx /= len; vy /= len;
        this.moveDir = { x: vx, y: vy };
        if (Math.abs(vx) > 0.1) this.facing = vx > 0 ? 1 : -1;
      }
      const sp = this.speed * this.state.stats.speedMult;
      body.setVelocity(vx * sp, vy * sp);
    }

    const moving = body.velocity.lengthSq() > 10;
    this.view.setPosition(this.phys.x, this.phys.y);
    this.view.scaleX = this.facing;
    this.view.setDepth(this.phys.y);
    this.phys.setDepth(this.phys.y - 1);

    const w = this.layers.weapon;
    if (moving) {
      // Ciclo de paso: pies alternos, cuerpo que rebota, cabeza que se balancea
      const t = time * 0.017, s = Math.sin(t), c = Math.cos(t);
      const bob = Math.abs(s) * 2;
      this.place('bootL', c * 2.2, -Math.max(0, s) * 3);
      this.place('bootR', -c * 2.2, -Math.max(0, -s) * 3);
      for (const n of ['body', 'trim', 'off']) this.place(n, 0, -bob);
      for (const n of ['head', 'hat', 'blink']) { this.place(n, 0, -bob * 1.25); this.imgs[n].angle = s * 3; }
      this.imgs.body.scaleY = this.imgs.trim.scaleY = 1;
      this.place('weapon', 0, -bob);
      if (!this.swinging && w) this.imgs.weapon.angle = w.baseAngle + s * 9;
    } else {
      // Respiración
      const b = Math.sin(time * 0.004);
      this.place('bootL'); this.place('bootR');
      for (const n of ['body', 'trim']) { this.place(n, 0, -b * 0.3); this.imgs[n].scaleY = 1 + b * 0.015; }
      this.place('off', 0, -b * 0.3);
      for (const n of ['head', 'hat', 'blink']) { this.place(n, 0, b * 0.7); this.imgs[n].angle = 0; }
      this.place('weapon', 0, -b * 0.3);
      if (!this.swinging && w) this.imgs.weapon.angle = w.baseAngle + b * 2;
    }

    // Parpadeo cada 2,5-5 s
    if (now > this.nextBlink) { this.blinkUntil = now + 120; this.nextBlink = now + 2500 + Math.random() * 2500; }
    this.imgs.blink.setVisible(now < this.blinkUntil);

    this.shieldFx.setAlpha(this.state.absorb > 0 ? 0.35 + Math.sin(time * 0.008) * 0.1 : 0);
  }

  swing(spin = false) {
    const w = this.layers.weapon;
    if (!w) return;
    this.swinging = true;
    this.scene.tweens.add({
      targets: this.imgs.weapon,
      angle: spin ? { from: 0, to: 720 } : { from: w.baseAngle - 75, to: w.baseAngle + 95 },
      duration: spin ? 420 : 170,
      ease: 'Quad.Out',
      onComplete: () => { this.swinging = false; this.imgs.weapon.angle = w.baseAngle; },
    });
    if (this.layers.off && this.layers.off.key === 'w_dagger' && !spin) {
      // el asesino ataca con las dos dagas
      const o = this.imgs.off;
      this.scene.tweens.add({ targets: o, angle: { from: this.layers.off.angle + 40, to: this.layers.off.angle - 50 }, duration: 170, delay: 60, yoyo: true });
    }
    if (!spin) this.scene.tweens.add({ targets: this.rig, scaleY: { from: 0.9 / RES, to: 1 / RES }, duration: 160 });
  }

  flash() {
    for (const n of PART_NAMES) if (this.imgs[n].visible) this.imgs[n].setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.refreshGear());
  }
}
