import { el, makeDraggable, makeDropTarget } from './dom.js';
import { ABILITIES } from '../data/abilities.js';
import { bus } from '../core/EventBus.js';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

/**
 * Barra de acción estilo WoW:
 *  - Arrastra habilidades desde el Libro de hechizos a una ranura
 *  - Arrastra entre ranuras para reordenar; suéltala fuera para quitarla
 *  - Barrido radial de cooldown (conic-gradient) + segundos restantes
 */
export class ActionBarUI {
  constructor(ui) {
    this.ui = ui;
    this.state = ui.state;
    this.node = el('div', 'actionbar');
    ui.bottom.append(this.node);
    this.slots = KEYS.map((key, i) => {
      const s = el('div', 'slot ab-slot');
      s.innerHTML = `<span class="icon"></span><span class="key">${key}</span><span class="rank-badge"></span><div class="cd"></div><span class="cdtext"></span>`;
      s.addEventListener('click', () => { this.press(i); ui.scene.combat.tryCastSlot(i); });
      s.addEventListener('mouseenter', (e) => { const id = this.state.actionBar.slots[i]; if (id) ui.tooltip.showAbility(ABILITIES[id], e, true); });
      s.addEventListener('mouseleave', () => ui.tooltip.hide());
      makeDraggable(s, () => (this.state.actionBar.slots[i] ? { src: 'bar', index: i } : null));
      s.addEventListener('dragfinished', (e) => {
        const { payload, dropped } = e.detail;
        if (!dropped && payload?.src === 'bar') this.state.actionBar.clear(payload.index);
      });
      makeDropTarget(s, (p) => p.src === 'spell' || p.src === 'bar', (p) => {
        if (p.src === 'spell') this.state.actionBar.assign(i, p.id);
        else this.state.actionBar.swap(p.index, i);
      });
      this.node.append(s);
      return { node: s, icon: s.querySelector('.icon'), rank: s.querySelector('.rank-badge'), cd: s.querySelector('.cd'), txt: s.querySelector('.cdtext'), last: '' };
    });
    bus.on('actionbar:changed', () => this.render());
    bus.on('ability:cast', (id) => this.slots.forEach((s, i) => {
      if (this.state.actionBar.slots[i] === id) { s.node.classList.remove('cast'); void s.node.offsetWidth; s.node.classList.add('cast'); }
    }));
    this.render();
  }

  render() {
    this.slots.forEach((s, i) => {
      const id = this.state.actionBar.slots[i];
      s.icon.textContent = id ? ABILITIES[id].icon : '';
      const r = id ? this.state.rank(id) : 1;
      s.rank.textContent = r > 1 ? r : '';
      s.rank.style.display = r > 1 ? '' : 'none';
      s.node.classList.toggle('empty', !id);
      s.last = '';
    });
  }

  press(i) {
    const n = this.slots[i].node;
    n.classList.add('pressed');
    setTimeout(() => n.classList.remove('pressed'), 110);
  }

  /** Llamado cada frame: actualiza barridos de cooldown y estado de maná. */
  update(now) {
    const st = this.state;
    this.slots.forEach((s, i) => {
      const id = st.actionBar.slots[i];
      if (!id) { if (s.last) { s.cd.style.background = ''; s.txt.textContent = ''; s.last = ''; } return; }
      const { remaining, total, gcd } = st.cooldownInfo(id, now);
      const noMana = st.mana < ABILITIES[id].mana;
      const frac = remaining > 0 ? remaining / total : 0;
      const key = `${Math.round(frac * 120)}|${noMana}`;
      if (key === s.last) return;
      s.last = key;
      s.cd.style.background = frac > 0
        ? `conic-gradient(transparent ${(1 - frac) * 360}deg, rgba(8,10,28,0.72) 0)` : '';
      s.txt.textContent = !gcd && remaining > 150 ? (remaining > 10000 ? Math.ceil(remaining / 1000) : (remaining / 1000).toFixed(1)) : '';
      s.node.classList.toggle('nomana', noMana);
    });
  }
}
