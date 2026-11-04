import { el } from './dom.js';
import { RARITIES, SLOTS, STAT_NAMES } from '../data/items.js';
import { MAX_RANK, rankPower, rankCooldown } from '../data/abilities.js';
import { CLASSES } from '../data/classes.js';

/** Tooltip estilo WoW con comparación contra el objeto equipado. */
export class Tooltip {
  constructor(root, state) {
    this.state = state;
    this.node = el('div', 'tooltip');
    root.append(this.node);
  }

  showItem(item, evt, { hint = '', compare = true } = {}) {
    if (!item) return this.hide();
    const R = RARITIES[item.rarity];
    let h = `<div class="tt-name" style="color:${R.color}">${item.icon} ${item.name}</div>`;
    if (item.type === 'equipment') {
      h += `<div class="tt-sub">${R.name} · ${SLOTS[item.slot].name}</div>`;
      h += `<div class="tt-ilvl">Nivel de objeto ${item.ilvl}</div>`;
      for (const [k, v] of Object.entries(item.stats)) {
        h += k === 'armor' ? `<div>${v} Armadura</div>` : `<div class="tt-stat">+${v} ${STAT_NAMES[k]}</div>`;
      }
      const lvlOk = item.reqLevel <= this.state.level;
      h += `<div class="${lvlOk ? 'tt-dim' : 'tt-bad'}">Requiere nivel ${item.reqLevel}</div>`;
      const eq = this.state.equipment.slots[item.slot];
      if (compare && eq && eq.uid !== item.uid) {
        const keys = new Set([...Object.keys(item.stats), ...Object.keys(eq.stats)]);
        const lines = [...keys].map((k) => {
          const d = (item.stats[k] || 0) - (eq.stats[k] || 0);
          if (!d) return '';
          return `<div class="${d > 0 ? 'tt-good' : 'tt-bad'}">${d > 0 ? '▲ +' : '▼ '}${d} ${STAT_NAMES[k]}</div>`;
        }).join('');
        h += `<div class="tt-compare"><div class="tt-dim">Comparado con ${eq.name}:</div>${lines || '<div class="tt-dim">Sin cambios</div>'}</div>`;
      } else if (compare && !eq) {
        h += `<div class="tt-good tt-compare">Ranura vacía: ¡todo son mejoras!</div>`;
      }
    } else {
      h += `<div class="tt-sub">${item.type === 'material' ? 'Material' : item.type === 'food' ? 'Comida' : 'Poción'}</div>`;
      h += `<div class="tt-desc">${item.desc || ''}</div>`;
    }
    if (hint) h += `<div class="tt-hint">${hint}</div>`;
    this.node.innerHTML = h;
    this.place(evt);
  }

  showAbility(ab, evt, known) {
    const rank = this.state.rank(ab.id);
    const cls = CLASSES[ab.cls];
    let h = `<div class="tt-name">${ab.icon} ${ab.name}</div>`;
    h += `<div class="tt-ilvl">${cls ? `${cls.icon} ${cls.name}` : 'Común'} · Rango ${known ? rank : 0}/${MAX_RANK} · Potencia ${Math.round(rankPower(rank) * 100)}%</div>`;
    const bits = [];
    if (ab.mana) bits.push(`${ab.mana} maná`);
    if (ab.range) bits.push(`${Math.round(ab.range / 32)} m de alcance`);
    h += `<div class="tt-sub">${bits.join(' · ') || 'Sin coste'}</div>`;
    h += `<div class="tt-dim">${ab.cooldown ? `Reutilización: ${rankCooldown(ab, rank).toFixed(1)} s` : 'Sin reutilización (solo GCD)'}</div>`;
    h += `<div class="tt-desc">${ab.desc}</div>`;
    if (!known) h += `<div class="tt-bad">Se aprende a nivel ${ab.unlockLevel}</div>`;
    this.node.innerHTML = h;
    this.place(evt);
  }

  place(evt) {
    const n = this.node;
    n.classList.add('show');
    const r = n.getBoundingClientRect();
    let x = evt.clientX + 16, y = evt.clientY + 16;
    if (x + r.width > innerWidth - 8) x = evt.clientX - r.width - 16;
    if (y + r.height > innerHeight - 8) y = innerHeight - r.height - 8;
    n.style.left = `${Math.max(8, x)}px`;
    n.style.top = `${Math.max(8, y)}px`;
  }

  hide() { this.node.classList.remove('show'); }
}
