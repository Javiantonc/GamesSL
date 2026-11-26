import { Inventory } from './Inventory.js';
import { Equipment } from './Equipment.js';
import { ActionBar } from './ActionBar.js';
import { computeStats } from './Stats.js';
import { xpForLevel, MAX_LEVEL } from './Progression.js';
import { ABILITIES, GCD, MAX_RANK, rankPower, rankCooldown } from '../data/abilities.js';
import { CLASSES, ATTRIBUTES, ATTR_POINTS_PER_LEVEL, SKILL_POINTS_PER_LEVEL } from '../data/classes.js';
import { createStack, starterWeapon, STAT_NAMES } from '../data/items.js';
import { bus } from '../core/EventBus.js';
import {
  START_GOLD, FORGE_MAX, FORGE_STEP, forgeCost, POWERS, powerCost, SCROLLS, SHOP_STOCK, sellPrice,
} from '../data/shop.js';

/**
 * MODELO del jugador (sin nada de Phaser): clase, nivel, XP, puntos de
 * atributo y de habilidad, rangos, recursos, inventario, equipo, barra,
 * cooldowns y efectos temporales. Serializable para guardar partida.
 */
export class PlayerState {
  constructor() {
    this.name = 'Aventurero';
    this.classId = null;
    this.level = 1;
    this.xp = 0;
    this.inventory = new Inventory(32, () => bus.emit('inventory:changed'));
    this.equipment = new Equipment();
    this.actionBar = new ActionBar(10, () => bus.emit('actionbar:changed'));
    this.known = new Set();
    this.ranks = {};              // abilityId -> rango (1..MAX_RANK)
    this.allocated = { strength: 0, stamina: 0, agility: 0, intellect: 0 };
    this.attrPoints = ATTR_POINTS_PER_LEVEL;      // para probar desde el principio
    this.skillPoints = SKILL_POINTS_PER_LEVEL;
    this.buffs = [];              // { id, name, icon, until, ...modificadores }
    this.hots = [];               // curaciones en el tiempo { perSec, until }
    this.cooldowns = new Map();   // abilityId -> { readyAt, total }
    this.gcdUntil = 0;
    this.lastCombatAt = -1e9;
    this.hunger = 100;
    this.absorb = 0;
    this.absorbUntil = 0;
    this.gold = START_GOLD;
    this.powers = {};             // poderes comprados en la tienda: id -> nivel
    this.scrolls = { skill: 0, attr: 0 };
    this.quests = { active: {}, done: [] };   // misiones de Albor (ver QuestLog)
    this.dungeonsCleared = new Set();   // ids de mazmorras cuyo jefe has derrotado

    this.equipment.equip(starterWeapon());
    this.stats = this.computeStats();
    this.hp = this.stats.maxHp;
    this.mana = this.stats.maxMana;

    this.learnUnlocked(true);
    this.actionBar.slots[0] = 'strike';
    this.inventory.add(createStack('meat', 3));
    this.inventory.add(createStack('potion_hp', 2));
  }

  get cls() { return this.classId ? CLASSES[this.classId] : null; }
  get xpToNext() { return xpForLevel(this.level); }

  computeStats() {
    return computeStats(this.level, this.equipment, {
      allocated: this.allocated, cls: this.cls, buffs: this.buffs, powers: this.powers,
    });
  }

  recalc() {
    const old = this.stats;
    this.stats = this.computeStats();
    // Si sube la vida/maná máximos, el actual sube lo mismo (como en WoW)
    if (old) {
      if (this.stats.maxHp > old.maxHp) this.hp += this.stats.maxHp - old.maxHp;
      if (this.stats.maxMana > old.maxMana) this.mana += this.stats.maxMana - old.maxMana;
    }
    this.hp = Math.min(this.hp, this.stats.maxHp);
    this.mana = Math.min(this.mana, this.stats.maxMana);
    bus.emit('stats:changed', this.stats, old);
  }

  // ---------------- Clase ----------------
  chooseClass(id) {
    if (!CLASSES[id] || id === this.classId) return;
    this.classId = id;
    this.known = new Set();
    this.learnUnlocked(true);
    // Limpia de la barra lo que no es de la clase y coloca las habilidades nuevas
    this.actionBar.slots = this.actionBar.slots.map((a) => (a && this.known.has(a) ? a : null));
    for (const ab of this.availableAbilities()) {
      if (!this.known.has(ab.id) || this.actionBar.has(ab.id)) continue;
      const i = this.actionBar.firstEmpty();
      if (i >= 0) this.actionBar.slots[i] = ab.id;
    }
    this.buffs = [];
    this.recalc();
    bus.emit('actionbar:changed');
    bus.emit('class:changed', this.cls);
    bus.emit('ui:toast', `Ahora eres ${this.cls.icon} ${this.cls.name}`, this.cls.color);
  }

  /** Habilidades comunes + las de la clase actual, ordenadas por nivel. */
  availableAbilities() {
    return Object.values(ABILITIES)
      .filter((a) => a.cls === 'common' || a.cls === this.classId)
      .sort((a, b) => (a.cls === 'common' ? -1 : 0) - (b.cls === 'common' ? -1 : 0) || a.unlockLevel - b.unlockLevel);
  }

  learnUnlocked(silent = false) {
    const learned = [];
    for (const ab of this.availableAbilities()) {
      if (ab.unlockLevel <= this.level && !this.known.has(ab.id)) {
        this.known.add(ab.id);
        this.ranks[ab.id] ||= 1;
        learned.push(ab);
      }
    }
    if (learned.length && !silent) bus.emit('abilities:learned', learned);
    return learned;
  }

  // ---------------- Puntos ----------------
  allocate(attr) {
    if (this.attrPoints <= 0 || !(attr in ATTRIBUTES)) return false;
    this.allocated[attr]++;
    this.attrPoints--;
    const old = this.stats;
    this.recalc();
    this._emitDiff(old);
    bus.emit('points:changed');
    return true;
  }

  rank(id) { return this.ranks[id] || 1; }
  power(id) { return rankPower(this.rank(id)); }

  upgradeAbility(id) {
    if (!this.known.has(id)) return bus.emit('ui:error', 'Aún no conoces esa habilidad'), false;
    if (this.rank(id) >= MAX_RANK) return bus.emit('ui:error', 'Ya está al rango máximo'), false;
    if (this.skillPoints <= 0) return bus.emit('ui:error', 'No tienes puntos de habilidad'), false;
    this.ranks[id] = this.rank(id) + 1;
    this.skillPoints--;
    bus.emit('ui:toast', `${ABILITIES[id].icon} ${ABILITIES[id].name} sube a rango ${this.ranks[id]}`, '#ffe14d');
    bus.emit('points:changed');
    bus.emit('actionbar:changed');
    return true;
  }

  /** Devuelve todos los puntos (gratis en el prototipo). */
  resetPoints() {
    for (const k of Object.keys(this.allocated)) { this.attrPoints += this.allocated[k]; this.allocated[k] = 0; }
    for (const [id, r] of Object.entries(this.ranks)) { this.skillPoints += r - 1; this.ranks[id] = 1; }
    this.recalc();
    bus.emit('points:changed');
    bus.emit('actionbar:changed');
  }

  // ---------------- Progresión ----------------
  gainXp(amount) {
    if (this.level >= MAX_LEVEL || amount <= 0) return;
    this.xp += Math.round(amount * (this.stats.xpMult || 1));
    let gained = 0;
    while (this.level < MAX_LEVEL && this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      gained++;
    }
    if (this.level >= MAX_LEVEL) this.xp = 0;
    if (gained) {
      this.attrPoints += gained * ATTR_POINTS_PER_LEVEL;
      this.skillPoints += gained * SKILL_POINTS_PER_LEVEL;
      this.recalc();
      this.hp = this.stats.maxHp;
      this.mana = this.stats.maxMana;
      const learned = this.learnUnlocked();
      // Las habilidades nuevas se colocan solas en la primera ranura libre (se pueden mover)
      for (const ab of learned) {
        const i = this.actionBar.firstEmpty();
        if (i >= 0 && !this.actionBar.has(ab.id)) this.actionBar.slots[i] = ab.id;
      }
      if (learned.length) bus.emit('actionbar:changed');
      bus.emit('player:levelup', { level: this.level, learned });
      bus.emit('points:changed');
    }
    bus.emit('xp:changed');
  }

  // ---------------- Cooldowns y efectos ----------------
  startCooldown(id, now) {
    const cd = rankCooldown(ABILITIES[id], this.rank(id)) * 1000;
    if (cd > 0) this.cooldowns.set(id, { readyAt: now + cd, total: cd });
    this.gcdUntil = now + GCD;
  }

  cooldownInfo(id, now) {
    const cd = this.cooldowns.get(id);
    const cdRem = cd ? Math.max(0, cd.readyAt - now) : 0;
    const gcdRem = Math.max(0, this.gcdUntil - now);
    if (cdRem >= gcdRem && cdRem > 0) return { remaining: cdRem, total: cd.total, gcd: false };
    if (gcdRem > 0) return { remaining: gcdRem, total: GCD, gcd: true };
    return { remaining: 0, total: 0, gcd: false };
  }

  addBuff(ab, now) {
    this.buffs = this.buffs.filter((b) => b.id !== ab.id);
    const duration = ab.duration * (1 + 0.1 * (this.rank(ab.id) - 1));
    this.buffs.push({ id: ab.id, name: ab.name, icon: ab.icon, until: now + duration, duration, ...ab.buff });
    this.recalc();
    bus.emit('buffs:changed');
  }

  // ---------------- Equipo e inventario ----------------
  equipFromBag(index) {
    const item = this.inventory.slots[index];
    if (!item || item.type !== 'equipment') return false;
    if (item.reqLevel > this.level) { bus.emit('ui:error', `Necesitas nivel ${item.reqLevel}`); return false; }
    const old = this.stats;
    const prev = this.equipment.equip(item);
    this.inventory.slots[index] = prev;
    this._afterGearChange(old);
    return true;
  }

  unequipToBag(slot, targetIndex = null) {
    const item = this.equipment.slots[slot];
    if (!item) return false;
    const old = this.stats;
    let idx = targetIndex ?? this.inventory.firstEmpty();
    const there = idx >= 0 ? this.inventory.slots[idx] : null;
    if (there) {
      if (there.type === 'equipment' && there.slot === slot && there.reqLevel <= this.level) {
        this.equipment.slots[slot] = there;
        this.inventory.slots[idx] = item;
        this._afterGearChange(old);
        return true;
      }
      idx = this.inventory.firstEmpty();
    }
    if (idx < 0) { bus.emit('ui:error', 'Tu inventario está lleno'); return false; }
    this.equipment.slots[slot] = null;
    this.inventory.slots[idx] = item;
    this._afterGearChange(old);
    return true;
  }

  _afterGearChange(old) {
    this.recalc();
    this._emitDiff(old);
    bus.emit('inventory:changed');
    bus.emit('equipment:changed');
  }

  _emitDiff(old) {
    const diffs = Object.keys(STAT_NAMES)
      .map((k) => [k, (this.stats[k] || 0) - (old[k] || 0)])
      .filter(([, d]) => d !== 0);
    if (diffs.length) bus.emit('ui:statdiff', diffs);
  }

  useFromBag(index) {
    const item = this.inventory.slots[index];
    if (!item) return;
    if (item.type === 'equipment') return this.equipFromBag(index);
    if (item.type === 'food') {
      this.hunger = Math.min(100, this.hunger + item.hunger);
      this.heal(item.heal || 0);
      bus.emit('ui:toast', `Comes ${item.name} ${item.icon}`, '#ffd27a');
    } else if (item.type === 'potion') {
      if (item.healPct) this.heal(Math.round(this.stats.maxHp * item.healPct));
      if (item.manaPct) this.mana = Math.min(this.stats.maxMana, this.mana + Math.round(this.stats.maxMana * item.manaPct));
    } else {
      bus.emit('ui:error', 'No puedes usar eso');
      return;
    }
    this.inventory.removeAt(index, 1);
  }

  heal(n) { this.hp = Math.min(this.stats.maxHp, this.hp + n); }

  // ================== ORO Y TIENDA ==================
  addGold(n) { this.gold += n; bus.emit('gold:changed', n); }

  spend(n) {
    if (this.gold < n) { bus.emit('ui:error', 'No tienes suficiente oro'); return false; }
    this.gold -= n;
    bus.emit('gold:changed', -n);
    return true;
  }

  /** Forja: mejora una pieza equipada (+12% a todas sus estadísticas por nivel). */
  forge(slot) {
    const item = this.equipment.slots[slot];
    if (!item) return false;
    const up = item.upgrade || 0;
    if (up >= FORGE_MAX) { bus.emit('ui:error', 'Esta pieza ya está al máximo'); return false; }
    if (!this.spend(forgeCost(item))) return false;
    item.baseStats ||= { ...item.stats };
    item.baseName ||= item.name;
    item.upgrade = up + 1;
    for (const [k, v] of Object.entries(item.baseStats)) {
      item.stats[k] = Math.max(Math.round(v * (1 + FORGE_STEP * item.upgrade)), v + item.upgrade);
    }
    item.name = `${item.baseName} +${item.upgrade}`;
    const old = this.stats;
    this.recalc();
    this._emitDiff(old);
    bus.emit('equipment:changed');
    bus.emit('ui:toast', `⚒️ ${item.name} forjado con éxito`, '#ffd34d');
    return true;
  }

  buyPower(id) {
    const p = POWERS[id];
    const lvl = this.powers[id] || 0;
    if (lvl >= p.max) { bus.emit('ui:error', 'Poder al máximo'); return false; }
    if (!this.spend(powerCost(p, lvl))) return false;
    this.powers[id] = lvl + 1;
    const old = this.stats;
    this.recalc();
    this._emitDiff(old);
    bus.emit('ui:toast', `${p.icon} ${p.name} nivel ${lvl + 1}`, '#ffd34d');
    bus.emit('shop:changed');
    return true;
  }

  scrollCost(id) { const s = SCROLLS[id]; return Math.round(s.base * Math.pow(s.growth, this.scrolls[id])); }

  buyScroll(id) {
    if (!this.spend(this.scrollCost(id))) return false;
    this.scrolls[id]++;
    if (id === 'skill') this.skillPoints += 1; else this.attrPoints += 3;
    bus.emit('ui:toast', `${SCROLLS[id].icon} ${SCROLLS[id].desc}`, '#ffd34d');
    bus.emit('points:changed');
    bus.emit('shop:changed');
    return true;
  }

  buyItem(id) {
    const entry = SHOP_STOCK.find((e) => e.id === id);
    if (!entry || this.inventory.isFull() && !this.inventory.countOf(id)) { bus.emit('ui:error', 'Tu inventario está lleno'); return false; }
    if (!this.spend(entry.price)) return false;
    this.inventory.add(createStack(id, 1));
    return true;
  }

  sell(index) {
    const item = this.inventory.slots[index];
    if (!item) return 0;
    const price = sellPrice(item);
    this.inventory.setSlot(index, null);
    this.addGold(price);
    return price;
  }

  /** Vende todo el equipo común y poco común de la mochila. */
  sellJunk() {
    let total = 0, n = 0;
    this.inventory.slots.forEach((it, i) => {
      if (it && it.type === 'equipment' && (it.rarity === 'common' || it.rarity === 'uncommon')) {
        total += sellPrice(it); this.inventory.slots[i] = null; n++;
      }
    });
    if (!n) { bus.emit('ui:error', 'No hay equipo común que vender'); return 0; }
    this.inventory.onChange();
    this.addGold(total);
    bus.emit('ui:toast', `Vendes ${n} objetos por ${total} 🪙`, '#ffd34d');
    return total;
  }

  /** Regeneración, hambre, efectos y curaciones en el tiempo. */
  tick(dt, now) {
    if (this.buffs.some((b) => b.until <= now)) {
      this.buffs = this.buffs.filter((b) => b.until > now);
      this.recalc();
      bus.emit('buffs:changed');
    }
    this.hots = this.hots.filter((h) => h.until > now);
    for (const h of this.hots) this.heal(h.perSec * dt);

    const s = this.stats;
    this.mana = Math.min(s.maxMana, this.mana + s.manaRegen * dt);
    this.hunger = Math.max(0, this.hunger - dt * 0.18);
    const outOfCombat = now - this.lastCombatAt > 5000;
    if (outOfCombat && this.hunger > 20) this.hp = Math.min(s.maxHp, this.hp + s.maxHp * 0.03 * s.regenMult * dt);
    if (this.absorbUntil < now) this.absorb = 0;
    if (this.hunger <= 0) {
      const dmg = s.maxHp * 0.01 * dt;
      this.hp -= dmg;
      return dmg;
    }
    return 0;
  }

  toJSON() {
    return {
      classId: this.classId, level: this.level, xp: this.xp, hunger: this.hunger,
      allocated: this.allocated, attrPoints: this.attrPoints, skillPoints: this.skillPoints, ranks: this.ranks,
      gold: this.gold, powers: this.powers, scrolls: this.scrolls, dungeonsCleared: [...this.dungeonsCleared], quests: this.quests,
      inventory: this.inventory.slots, equipment: this.equipment.slots, actionBar: this.actionBar.slots,
    };
  }
}
