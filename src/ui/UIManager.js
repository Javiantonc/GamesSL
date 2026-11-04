import { el } from './dom.js';
import { Tooltip } from './Tooltip.js';
import { HUD } from './HUD.js';
import { ActionBarUI } from './ActionBarUI.js';
import { TabletUI } from './TabletUI.js';
import { CharacterUI } from './CharacterUI.js';
import { CLASSES } from '../data/classes.js';
import { Minimap } from './Minimap.js';
import { drawCharacter } from '../gfx/characters.js';
import { bus } from '../core/EventBus.js';

/**
 * Capa de interfaz en HTML/CSS sobre el canvas. Lee el modelo (PlayerState)
 * y escucha el bus de eventos; las acciones del jugador llaman al modelo o
 * al CombatSystem. Ventaja: maquetas la UI con lo que ya sabes de DAW.
 */
export class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.state = scene.state;
    this.root = document.getElementById('ui');
    this.root.innerHTML = '';

    this.tooltip = new Tooltip(this.root, this.state);
    this.bottom = el('div', 'bottom');
    this.root.append(this.bottom);

    this.hud = new HUD(this);
    this.actionBar = new ActionBarUI(this);
    this.char = new CharacterUI(this);
    this.tablet = new TabletUI(this);
    this.minimap = new Minimap(this);
    this.panels = { char: this.char, tablet: this.tablet };

    // Micro-menú (botones de ventanas)
    const micro = el('div', 'micro');
    const btn = (icon, title, key, onclick) => {
      const b = el('button', 'micro-btn', `${icon}<small>${key}</small>`);
      b.title = title; b.onclick = onclick;
      micro.append(b); return b;
    };
    btn('👤', 'Personaje y equipo (C)', 'C', () => this.toggle('char'));
    this.microTablet = btn('📱', 'Tablet: clase, atributos, habilidades y objetos (T)', 'T', () => this.toggle('tablet'));
    this.bottom.append(micro);
    this.tablet.updateBadges();

    // Pantalla de inicio con elección de clase (también da el foco de teclado si va en un iframe)
    const start = el('div', 'start-screen', `<div class="start-card"><h1>Mini Realms</h1>
      <p>RPG de supervivencia · mundo abierto · elige tu clase</p><div class="start-classes"></div>
      <small>Podrás cambiarla cuando quieras desde la tablet (T)</small></div>`);
    const row = start.querySelector('.start-classes');
    for (const c of Object.values(CLASSES)) {
      const b = el('button', 'start-class', `<span>${c.icon}</span><b>${c.name}</b><small>${c.role}</small>`);
      b.style.setProperty('--cc', c.color);
      b.onclick = () => { this.state.chooseClass(c.id); start.remove(); window.focus(); };
      row.append(b);
    }
    this.root.append(start);

    const redrawPortrait = () => this.drawPortrait(this.hud.pf.querySelector('canvas'), 2.1, true);
    bus.on('equipment:changed', redrawPortrait);
    bus.on('class:changed', () => { redrawPortrait(); if (this.char.open) this.char.render(); });
  }

  toggle(name, app) { this.panels[name].toggle(app); }

  closeAll() {
    let any = false;
    for (const p of Object.values(this.panels)) if (p.open) { p.close(); any = true; }
    return any;
  }

  update(now) {
    this.hud.update(now);
    this.actionBar.update(now);
    this.minimap.update(now);
  }

  /** Dibuja el personaje (con su clase y equipo) en un <canvas> para retratos. */
  drawPortrait(canvas, scale, headOnly) {
    drawCharacter(this.scene, this.state, canvas, { scale, headOnly });
  }

}
