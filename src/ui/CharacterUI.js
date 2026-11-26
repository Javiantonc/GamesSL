import { Panel } from './Panel.js';
import { el, itemSlotEl, makeDraggable, makeDropTarget } from './dom.js';
import { IS_MOBILE, bindUse } from './device.js';
import { SLOTS } from '../data/items.js';
import { DISPLAY_STATS } from '../systems/Stats.js';
import { bus } from '../core/EventBus.js';

const LEFT = ['head', 'neck', 'shoulders', 'chest', 'hands'];
const RIGHT = ['legs', 'feet', 'ring', 'weapon', 'offhand'];

/** Hoja de personaje: muñeco con ranuras de equipo + estadísticas. */
export class CharacterUI extends Panel {
  constructor(ui) {
    super(ui, 'char-panel', '👤 Personaje');
    this.doll = el('div', 'paperdoll');
    this.colL = el('div', 'eq-col');
    this.colR = el('div', 'eq-col');
    this.center = el('div', 'doll-center', '<canvas width="240" height="300"></canvas><div class="doll-lvl"></div>');
    this.doll.append(this.colL, this.center, this.colR);
    this.statsEl = el('div', 'stats');
    this.body.append(this.doll, this.statsEl);
    this.prevStats = { ...this.state.stats };
    this.flash = {};

    bus.on('equipment:changed', () => this.open && this.render());
    bus.on('stats:changed', (s, old) => {
      for (const [k] of DISPLAY_STATS) {
        if (old && s[k] !== old[k]) this.flash[k] = s[k] > old[k] ? 'up' : 'down';
      }
      if (this.open) this.render();
    });
  }

  slotEl(slot) {
    const item = this.state.equipment.slots[slot];
    const tt = this.ui.tooltip;
    const s = itemSlotEl(item, 'equip');
    if (!item) s.append(el('span', 'icon ghost', SLOTS[slot].icon));
    s.append(el('span', 'slot-label', SLOTS[slot].name));
    if (item) {
      if (!IS_MOBILE) makeDraggable(s, () => ({ src: 'equip', slot }));
      bindUse(s, () => this.state.unequipToBag(slot), {
        show: (e) => tt.showItem(item, e, { hint: `${IS_MOBILE ? 'Toca' : 'Clic derecho'}: quitar`, compare: false }),
        hide: () => tt.hide(),
      });
    }
    makeDropTarget(s, (p) => {
      if (p.src !== 'bag') return false;
      const it = this.state.inventory.slots[p.index];
      return it && it.type === 'equipment' && it.slot === slot;
    }, (p) => this.state.equipFromBag(p.index));
    return s;
  }

  render() {
    this.colL.innerHTML = ''; this.colR.innerHTML = '';
    LEFT.forEach((k) => this.colL.append(this.slotEl(k)));
    RIGHT.forEach((k) => this.colR.append(this.slotEl(k)));
    this.ui.drawPortrait(this.center.querySelector('canvas'), 2.9, false);
    this.center.querySelector('.doll-lvl').textContent = `${this.state.name} · Nivel ${this.state.level}`;

    const s = this.state.stats;
    this.statsEl.innerHTML = DISPLAY_STATS.map(([k, label, fmt]) =>
      `<div class="stat ${this.flash[k] || ''}"><span>${label}</span><b>${fmt(s[k] || 0)}</b></div>`).join('');
    this.flash = {};
  }
}
