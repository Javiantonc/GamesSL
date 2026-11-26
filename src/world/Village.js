import { RES } from '../gfx/characters.js';
import { NPCS } from '../data/quests.js';
import { bus } from '../core/EventBus.js';

// Decorado del pueblo: [textura, dx, dy, ancho y alto del bloque de colisión]
const DECOR = [
  ['v_house_blue', -200, -150, 140, 56],
  ['v_house_purple', 10, -190, 140, 56],
  ['v_house_red', -255, 175, 140, 56],
  ['v_house_inn', 70, 300, 174, 56],
  ['v_house_green', 250, 240, 140, 56],
  ['v_stall_red', 170, 58, 100, 24],
  ['v_stall_blue', -95, 58, 100, 24],
  ['v_well', -75, -20, 56, 20],
  ['v_sign', 70, 30, 12, 10],
  ['v_firepit', 0, 105, 0, 0],
  ['v_barrel', -300, 205, 26, 14], ['v_barrel', -170, 190, 26, 14], ['v_barrel', 245, 95, 26, 14],
  ['v_crate', -300, 172, 32, 14], ['v_crate', 128, 330, 32, 14], ['v_crate', 205, 100, 32, 14],
];

/**
 * Pueblo de Albor en el Claro del Inicio: casas con colisión, NPCs con
 * nombre y marca de misión (! nueva · ? para entregar · … en curso).
 */
export class Village {
  constructor(scene) {
    this.scene = scene;
    const C = scene.spawnPoint;
    this.center = C;
    this.solids = scene.physics.add.staticGroup();
    this.decor = [];
    for (const [key, dx, dy, w, h] of DECOR) {
      const x = C.x + dx, y = C.y + dy;
      const img = scene.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
      this.decor.push(img);
      if (w) {
        const z = scene.add.zone(x, y - h / 2 - 6, w, h);
        scene.physics.add.existing(z, true);
        this.solids.add(z);
      }
    }
    // hoguera con brillo
    const fire = scene.add.image(C.x, C.y + 92, 'glow').setTint(0xff8a2a).setBlendMode('ADD').setScale(0.9).setDepth(C.y + 106);
    scene.tweens.add({ targets: fire, scale: 1.15, alpha: 0.7, duration: 380, yoyo: true, repeat: -1 });
    this.decor.push(fire);
    scene.physics.add.collider(scene.player.phys, this.solids);
    scene.physics.add.collider(scene.mobGroup, this.solids);

    this.npcs = Object.entries(NPCS).map(([id, d]) => {
      const x = C.x + d.pos[0], y = C.y + d.pos[1];
      const img = scene.add.image(x, y, `npc_${id}`).setOrigin(0.5, 1).setScale(1 / RES).setDepth(y);
      const name = scene.add.text(x, y - 66, d.name, {
        fontFamily: 'Trebuchet MS, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#7dff7a', stroke: '#000', strokeThickness: 4,
      }).setOrigin(0.5, 1).setDepth(1e6 - 2);
      const title = scene.add.text(x, y - 54, `<${d.title}>`, {
        fontFamily: 'Trebuchet MS, sans-serif', fontSize: '10px', color: '#e8e2d0', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5, 1).setDepth(1e6 - 2);
      const mark = scene.add.text(x, y - 80, '', {
        fontFamily: 'Trebuchet MS, sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#ffd23a', stroke: '#2a1800', strokeThickness: 6,
      }).setOrigin(0.5, 1).setDepth(1e6 - 1);
      const z = scene.add.zone(x, y - 10, 22, 14);
      scene.physics.add.existing(z, true);
      this.solids.add(z);
      return { id, d, x, y, img, name, title, mark, seed: Math.random() * 6 };
    });
    this.decor.push(...this.npcs.flatMap((n) => [n.img, n.name, n.title, n.mark]));

    this.prompt = scene.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#ffffff', stroke: '#000', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5, 0).setDepth(1e6).setVisible(false);
    this.near = null;
    bus.on('quests:changed', () => this.refreshMarkers());
  }

  refreshMarkers() {
    const Q = this.scene.quests;
    if (!Q) return;
    for (const n of this.npcs) {
      const m = Q.marker(n.id) || '';
      if (n.mark.text !== m) n.mark.setText(m).setColor(m === '…' ? '#cfcfcf' : '#ffd23a');
    }
  }

  npcAt(x, y) {
    return this.npcs.find((n) => Math.abs(n.x - x) < 20 && y < n.y + 4 && y > n.y - 62) || null;
  }

  update(now, player) {
    if (this.scene.dungeons.current) { this.prompt.setVisible(false); this.near = null; return; }
    if (Math.abs(player.x - this.center.x) > 900 || Math.abs(player.y - this.center.y) > 700) { this.prompt.setVisible(false); this.near = null; return; }
    let near = null, nd = 64;
    const t = now / 1000;
    for (const n of this.npcs) {
      const s = 1 + Math.sin(t * 2.2 + n.seed) * 0.018;
      n.img.setScale((1 / RES) * (2 - s), (1 / RES) * s);
      n.mark.y = n.y - 80 + Math.sin(t * 3 + n.seed) * 3;
      const d = Math.hypot(n.x - player.x, n.y - player.y);
      if (d < 140) n.img.setFlipX(player.x < n.x);
      if (d < nd) { nd = d; near = n; }
    }
    this.near = near;
    if (near && !player.dead) this.prompt.setText(`[E] Hablar con ${near.d.name}`).setPosition(near.x, near.y + 6).setVisible(true);
    else this.prompt.setVisible(false);
  }

  /** Tecla E: habla con el NPC cercano. Devuelve true si había uno. */
  tryTalk(player) {
    if (!this.near || player.dead) return false;
    this.scene.ui.questUI.openNpc(this.near.id);
    return true;
  }
}
