/**
 * Barra de acción: N ranuras que guardan un id de habilidad (o null).
 * Teclas 1..9,0 -> ranuras 0..9.
 */
export class ActionBar {
  constructor(size = 10, onChange = () => {}) {
    this.slots = new Array(size).fill(null);
    this.onChange = onChange;
  }
  assign(i, abilityId) { this.slots[i] = abilityId; this.onChange(); }
  clear(i) { this.slots[i] = null; this.onChange(); }
  swap(a, b) { [this.slots[a], this.slots[b]] = [this.slots[b], this.slots[a]]; this.onChange(); }
  firstEmpty() { return this.slots.indexOf(null); }
  has(id) { return this.slots.includes(id); }
}
