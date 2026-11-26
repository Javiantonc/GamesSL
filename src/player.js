// Estado del jugador: clase, nivel, atributos, equipo, bolsa, recursos y buffs.
import { CLASSES, ATTR_POINTS_PER_LEVEL, MAX_LEVEL, xpToLevel } from './data/classes.js';
import { makeItem } from './data/items.js';

export const BAG_SIZE = 24;

export class PlayerState {
  constructor(name, cls) {
    this.name = name; this.cls = cls;
    this.level = 1; this.xp = 0; this.gold = 10;
    this.alloc = { poder: 0, agilidad: 0, magia: 0, resistencia: 0 };
    this.points = 0;
    this.equip = { arma: null, cabeza: null, pecho: null, piernas: null, botas: null, abalorio: null };
    this.bag = new Array(BAG_SIZE).fill(null);
    this.potions = { pocion: 3, eter: 2, piedra: 1 };
    this.questItems = {};
    this.quests = { active: {}, done: [] };
    this.dungeons = [];         // mazmorras completadas (índices)
    this.bossKills = [];
    this.buffs = {};            // id -> { until, ... }
    this.shield = 0; this.shieldUntil = 0;
    this.hots = []; this.combo = 0; this.nextHitBonus = 0;
    this.cds = {}; this.gcdUntil = 0;
    const w = makeItem(1, 0, cls, 'arma'); w.name = { tanque: 'Espada de recluta', asesino: 'Dagas de aprendiz', mago: 'Bastón de aprendiz', support: 'Maza de novicia' }[cls];
    this.equip.arma = w;
    this.recalc();
    this.hp = this.maxHp; this.res = this.resStart();
  }
  get C() { return CLASSES[this.cls]; }
  resStart() { return this.C.res === 'furia' ? 0 : this.maxRes; }

  /** Recalcula atributos y derivadas. */
  recalc(now = 0) {
    const C = this.C, L = this.level;
    const a = {};
    for (const k of Object.keys(C.base)) a[k] = Math.round(C.base[k] + C.grow[k] * (L - 1)) + this.alloc[k];
    let armor = 0, wdmg = 3;
    for (const it of Object.values(this.equip)) {
      if (!it) continue;
      const f = 1 + (it.forge || 0) * 0.12;
      for (const [k, v] of Object.entries(it.stats)) a[k] += Math.round(v * f);
      armor += Math.round((it.armor || 0) * f);
      if (it.dmg) wdmg = it.dmg * f;
    }
    this.attrs = a;
    this.armor = armor + a.resistencia * 2;
    this.maxHp = Math.round(C.hp + C.hpLvl * (L - 1) + a.resistencia * 9);
    this.maxRes = C.res === 'mana' ? Math.round(100 + a.magia * 6 + L * 10) : 100;
    this.ap = a.poder * 1.6 + a.agilidad * 0.8 + L * 1.5;
    this.sp = a.magia * 1.8 + L * 1.5;
    this.crit = Math.min(0.5, 0.05 + a.agilidad * 0.0022);
    this.wdmg = wdmg;
    this.dr = Math.min(0.6, this.armor / (this.armor + 40 + L * 12));   // reducción de daño por armadura
    if (this.hp > this.maxHp) this.hp = this.maxHp;
    if (this.res > this.maxRes) this.res = this.maxRes;
  }

  buff(id, now) { const b = this.buffs[id]; return b && b.until > now ? b : null; }
  power() { return this.C.scale === 'sp' ? this.sp : this.ap; }

  addXp(n) {
    if (this.level >= MAX_LEVEL) return 0;
    this.xp += n;
    let ups = 0;
    while (this.level < MAX_LEVEL && this.xp >= xpToLevel(this.level)) {
      this.xp -= xpToLevel(this.level);
      this.level++; ups++;
      this.points += ATTR_POINTS_PER_LEVEL;
    }
    if (ups) { this.recalc(); this.hp = this.maxHp; if (this.C.res === 'mana') this.res = this.maxRes; }
    return ups;
  }

  addToBag(item) {
    const i = this.bag.indexOf(null);
    if (i < 0) return false;
    this.bag[i] = item; return true;
  }
  equipFromBag(i) {
    const it = this.bag[i];
    if (!it || it.type !== 'equip') return false;
    if (it.level > this.level) return 'nivel';
    const old = this.equip[it.slot];
    this.equip[it.slot] = it;
    this.bag[i] = old;
    this.recalc();
    return true;
  }
  unequip(slot) {
    const it = this.equip[slot];
    if (!it || slot === 'arma') return false;
    if (!this.addToBag(it)) return false;
    this.equip[slot] = null;
    this.recalc();
    return true;
  }

  toJSON() {
    const { name, cls, level, xp, gold, alloc, points, equip, bag, potions, questItems, quests, dungeons, bossKills } = this;
    return { name, cls, level, xp, gold, alloc, points, equip, bag, potions, questItems, quests, dungeons, bossKills };
  }
  static from(o) {
    const p = new PlayerState(o.name, o.cls);
    Object.assign(p, o);
    p.buffs = {}; p.cds = {}; p.hots = []; p.combo = 0;
    p.recalc();
    p.hp = p.maxHp; p.res = p.resStart();
    return p;
  }
}
