import { SLOTS } from '../data/items.js';

/** Equipo puesto: una ranura por tipo (cabeza, pecho, arma...). */
export class Equipment {
  constructor() {
    this.slots = {};
    for (const k of Object.keys(SLOTS)) this.slots[k] = null;
  }

  /** Equipa y devuelve lo que había antes en esa ranura (o null). */
  equip(item) {
    const prev = this.slots[item.slot];
    this.slots[item.slot] = item;
    return prev;
  }

  unequip(slot) {
    const it = this.slots[slot];
    this.slots[slot] = null;
    return it;
  }

  /** Suma de estadísticas de todas las piezas. */
  totals() {
    const t = {};
    for (const it of Object.values(this.slots)) {
      if (!it) continue;
      for (const [k, v] of Object.entries(it.stats)) t[k] = (t[k] || 0) + v;
    }
    return t;
  }

  averageItemLevel() {
    const items = Object.values(this.slots).filter(Boolean);
    if (!items.length) return 0;
    return Math.round(items.reduce((s, i) => s + i.ilvl, 0) / Object.keys(this.slots).length);
  }
}
