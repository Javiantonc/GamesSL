/**
 * Mochila: array fijo de ranuras. Cada ranura es `null` o un objeto:
 *   { uid, id, type, name, icon, rarity, qty, maxStack, ...extra }
 * Los objetos apilables (maxStack > 1) se fusionan automáticamente.
 */
export class Inventory {
  constructor(size = 32, onChange = () => {}) {
    this.size = size;
    this.slots = new Array(size).fill(null);
    this.onChange = onChange;
  }

  firstEmpty() { return this.slots.indexOf(null); }
  usedCount() { return this.slots.filter(Boolean).length; }
  isFull() { return this.firstEmpty() === -1; }
  countOf(id) { return this.slots.reduce((n, s) => n + (s && s.id === id ? s.qty : 0), 0); }

  /** Añade un objeto. Devuelve true si cupo entero (si no, item.qty queda con el resto). */
  add(item) {
    let changed = false;
    if (item.maxStack > 1) {
      for (const s of this.slots) {
        if (s && s.id === item.id && s.qty < s.maxStack) {
          const n = Math.min(item.qty, s.maxStack - s.qty);
          s.qty += n; item.qty -= n; changed = true;
          if (item.qty <= 0) { this.onChange(); return true; }
        }
      }
    }
    const i = this.firstEmpty();
    if (i < 0) { if (changed) this.onChange(); return false; }
    this.slots[i] = item;
    this.onChange();
    return true;
  }

  setSlot(i, item) { this.slots[i] = item || null; this.onChange(); }

  /** Quita `qty` unidades de la ranura i y devuelve lo quitado. */
  removeAt(i, qty = 1) {
    const s = this.slots[i];
    if (!s) return null;
    if (s.qty > qty) { s.qty -= qty; this.onChange(); return { ...s, qty }; }
    this.slots[i] = null; this.onChange();
    return s;
  }

  /** Mover/intercambiar entre ranuras (o fusionar pilas del mismo objeto). */
  move(from, to) {
    if (from === to) return;
    const a = this.slots[from], b = this.slots[to];
    if (a && b && a.id === b.id && a.maxStack > 1) {
      const n = Math.min(a.qty, b.maxStack - b.qty);
      b.qty += n; a.qty -= n;
      if (a.qty <= 0) this.slots[from] = null;
    } else {
      this.slots[from] = b; this.slots[to] = a;
    }
    this.onChange();
  }

  toJSON() { return this.slots; }
}
