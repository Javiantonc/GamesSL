import { el } from './dom.js';
import { Tooltip } from './Tooltip.js';
import { HUD } from './HUD.js';
import { ActionBarUI } from './ActionBarUI.js';
import { TabletUI } from './TabletUI.js';
import { CharacterUI } from './CharacterUI.js';
import { CLASSES } from '../data/classes.js';
import { IS_MOBILE, IS_IOS, IS_STANDALONE } from './device.js';
import { MobileControls } from './MobileControls.js';
import { Minimap } from './Minimap.js';
import { QuestUI } from './QuestUI.js';
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
    this.isMobile = IS_MOBILE;
    document.body.classList.toggle('mobile', IS_MOBILE);

    this.tooltip = new Tooltip(this.root, this.state);
    this.bottom = el('div', 'bottom');
    this.root.append(this.bottom);

    this.hud = new HUD(this);
    this.actionBar = new ActionBarUI(this);
    this.char = new CharacterUI(this);
    this.tablet = new TabletUI(this);
    this.minimap = new Minimap(this);
    this.questUI = new QuestUI(this);
    this.panels = { char: this.char, tablet: this.tablet, quests: this.questUI };
    if (IS_MOBILE) {
      this.mobile = new MobileControls(this);
      // Escala de las ventanas para que quepan en la pantalla del móvil
      const fit = () => {
        const s = Math.min(1, (innerHeight - 12) / 600, (innerWidth - 12) / 600);
        document.documentElement.style.setProperty('--ps', s.toFixed(3));
        document.documentElement.style.setProperty('--hs', Math.min(1, Math.max(0.75, innerHeight / 560)).toFixed(3));
      };
      fit();
      addEventListener('resize', fit);
      this.root.append(el('div', 'rotate-hint', '<div>📱↻</div><b>Gira el móvil</b><small>Mini Realms se juega en horizontal</small>'));
      document.addEventListener('pointerdown', (e) => { if (!e.target.closest?.('.slot')) this.tooltip.hide(); });
    }

    // Micro-menú (botones de ventanas)
    const micro = el('div', 'micro');
    const btn = (icon, title, key, onclick) => {
      const b = el('button', 'micro-btn', `${icon}<small>${key}</small>`);
      b.title = title; b.onclick = onclick;
      micro.append(b); return b;
    };
    btn('👤', 'Personaje y equipo (C)', 'C', () => this.toggle('char'));
    btn('📜', 'Misiones (L)', 'L', () => this.toggle('quests'));
    this.microTablet = btn('📱', 'Tablet: clase, atributos, habilidades y objetos (T)', 'T', () => this.toggle('tablet'));
    this.bottom.append(micro);
    this.tablet.updateBadges();

    // Pantalla de inicio con elección de clase (también da el foco de teclado si va en un iframe)
    const start = el('div', 'start-screen', `<div class="start-card"><h1>Mini Realms</h1>
      <p>RPG de supervivencia · mundo abierto · elige tu clase</p><div class="start-classes"></div>
      <small>Podrás cambiarla cuando quieras desde la tablet ${IS_MOBILE ? '📱' : '(T)'}</small>
      <div class="install-row"></div></div>`);
    const row = start.querySelector('.start-classes');
    for (const c of Object.values(CLASSES)) {
      const b = el('button', 'start-class', `<span>${c.icon}</span><b>${c.name}</b><small>${c.role}</small>`);
      b.style.setProperty('--cc', c.color);
      b.onclick = () => {
        this.state.chooseClass(c.id); start.remove(); window.focus();
        if (IS_MOBILE) this.goFullscreen();
      };
      row.append(b);
    }
    this.root.append(start);
    this.setupInstall(start.querySelector('.install-row'));

    const redrawPortrait = () => this.drawPortrait(this.hud.pf.querySelector('canvas'), 2.1, true);
    bus.on('equipment:changed', redrawPortrait);
    bus.on('class:changed', () => { redrawPortrait(); if (this.char.open) this.char.render(); });
  }

  toggle(name, app) { this.panels[name].toggle(app); }

  closeAll() {
    let any = false;
    if (this.questUI.npc || this.questUI.dialog.classList.contains('open')) { this.questUI.closeDialog(); any = true; }
    for (const p of Object.values(this.panels)) if (p.open) { p.close(); any = true; }
    return any;
  }

  /** En móvil: pantalla completa y orientación horizontal (si el navegador lo permite). */
  goFullscreen() {
    try {
      const d = document.documentElement;
      if (!document.fullscreenElement && d.requestFullscreen && !IS_STANDALONE) {
        d.requestFullscreen({ navigationUI: 'hide' }).then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
      }
    } catch { /* no soportado */ }
  }

  /** Botón "Instalar app" (Android/Chrome/Edge) o instrucciones en iPhone. */
  setupInstall(row) {
    if (IS_STANDALONE) return;
    const show = (html, onclick) => {
      row.innerHTML = '';
      const b = el('button', 'install-btn', html);
      if (onclick) b.onclick = (e) => { e.stopPropagation(); onclick(); };
      row.append(b);
    };
    if (window.__installPrompt) {
      show('📲 Instalar como app', async () => { window.__installPrompt.prompt(); await window.__installPrompt.userChoice; row.innerHTML = ''; });
    } else if (IS_IOS) {
      show('📲 Para instalar: pulsa <b>Compartir</b> ⬆️ y <b>Añadir a pantalla de inicio</b>');
    }
    addEventListener('mini-realms:installable', () => this.setupInstall(row), { once: true });
  }

  update(now) {
    this.hud.update(now);
    this.mobile?.update(now);
    this.actionBar.update(now);
    this.minimap.update(now);
  }

  /** Dibuja el personaje (con su clase y equipo) en un <canvas> para retratos. */
  drawPortrait(canvas, scale, headOnly) {
    drawCharacter(this.scene, this.state, canvas, { scale, headOnly });
  }

}
