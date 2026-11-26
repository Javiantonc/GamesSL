import { QUESTS, QUEST_BY_ID, NPCS } from '../data/quests.js';
import { MOBS } from '../data/mobs.js';
import { CONSUMABLES, generateItem, createStack, RARITIES } from '../data/items.js';
import { DUNGEON_TIERS } from '../data/dungeons.js';
import { bus } from '../core/EventBus.js';

/**
 * Misiones de los NPCs de Albor. El estado vive en PlayerState.quests
 * ({ active: { id: { n, talked } }, done: [ids] }) para poder guardarlo.
 * Avisa con 'quests:changed' cuando algo cambia (marcas, rastreador…).
 */
export class QuestLog {
  constructor(scene) {
    this.scene = scene;
    this.state = scene.state;
    let pending = false;
    const changed = () => { if (pending) return; pending = true; queueMicrotask(() => { pending = false; bus.emit('quests:changed'); }); };
    this.changed = changed;
    bus.on('mob:killed', (m) => this.onKill(m));
    bus.on('dungeon:cleared', () => this.check(() => true));
    bus.on('inventory:changed', changed);
    bus.on('player:levelup', changed);
  }
  get st() { return this.state.quests; }

  turnInNpc(q) { return q.obj.type === 'talk' ? q.obj.npc : q.npc; }
  isActive(id) { return !!this.st.active[id]; }
  isDone(id) { return this.st.done.includes(id); }
  list() { return Object.keys(this.st.active).map((id) => QUEST_BY_ID[id]); }

  available(npc) {
    return QUESTS.filter((q) => q.npc === npc && !this.isDone(q.id) && !this.isActive(q.id)
      && this.state.level >= q.lvl && (!q.req || this.isDone(q.req)));
  }
  upcoming(npc) {
    return QUESTS.filter((q) => q.npc === npc && !this.isDone(q.id) && !this.isActive(q.id) && (!q.req || this.isDone(q.req)) && this.state.level < q.lvl);
  }
  ready(npc) { return this.list().filter((q) => this.turnInNpc(q) === npc && this.complete(q)); }
  inProgress(npc) { return this.list().filter((q) => q.npc === npc && !this.complete(q) && q.obj.type !== 'talk'); }
  marker(npc) {
    if (this.ready(npc).length) return '?';
    if (this.available(npc).length) return '!';
    if (this.inProgress(npc).length) return '…';
    return null;
  }

  progress(q) {
    const o = q.obj, a = this.st.active[q.id];
    switch (o.type) {
      case 'kill': return Math.min(o.count, a?.n || 0);
      case 'collect': return Math.min(o.count, this.state.inventory.countOf(o.item));
      case 'talk': return a?.talked ? 1 : 0;
      case 'dungeon': return this.state.dungeonsCleared.has(DUNGEON_TIERS[o.tier].id) ? 1 : 0;
      case 'dungeons': return Math.min(o.count, this.state.dungeonsCleared.size);
      case 'boss': return a?.boss ? 1 : 0;
    }
    return 0;
  }
  goal(q) { return q.obj.count || 1; }
  complete(q) { return this.isActive(q.id) && this.progress(q) >= this.goal(q); }
  objText(q) {
    const o = q.obj, p = this.progress(q);
    switch (o.type) {
      case 'kill': return `${MOBS[o.mob].name}: ${p}/${o.count}`;
      case 'collect': return `${CONSUMABLES[o.item].icon} ${CONSUMABLES[o.item].name}: ${p}/${o.count}`;
      case 'talk': return `Habla con ${NPCS[o.npc].name}`;
      case 'dungeon': return `Completa ${DUNGEON_TIERS[o.tier].name}: ${p}/1`;
      case 'dungeons': return `Mazmorras distintas completadas: ${p}/${o.count}`;
      case 'boss': return `Derrota a la Reina Araña de Escarcha: ${p}/1`;
    }
    return '';
  }
  rewardText(q) {
    const r = [`${q.xp.toLocaleString('es-ES')} XP`, `${q.gold} 🪙`];
    if (q.potions) r.push(`${q.potions} 🧪`);
    if (q.item) r.push(`<span style="color:${RARITIES[q.item.rarity].color}">objeto ${RARITIES[q.item.rarity].name.toLowerCase()}</span>`);
    return r.join(' · ');
  }

  accept(id) {
    const q = QUEST_BY_ID[id];
    this.st.active[id] = { n: 0 };
    bus.emit('ui:toast', `📜 Misión aceptada: ${q.name}`, '#ffd34d');
    if (q.obj.type === 'talk' && q.obj.npc === q.npc) this.st.active[id].talked = true;
    this.changed();
  }
  abandon(id) { delete this.st.active[id]; this.changed(); }

  turnIn(id) {
    const q = QUEST_BY_ID[id], s = this.state;
    if (!this.complete(q)) return false;
    if (q.obj.type === 'collect') this.removeItems(q.obj.item, q.obj.count);
    delete this.st.active[id];
    this.st.done.push(id);
    s.addGold(q.gold);
    if (q.potions && !s.inventory.add(createStack('potion_hp', q.potions))) bus.emit('ui:error', 'Bolsa llena: no caben las pociones');
    if (q.item) {
      const it = generateItem(Math.max(q.lvl + 1, s.level), Math.random, { slot: q.item.slot, rarity: q.item.rarity });
      if (s.inventory.add(it)) bus.emit('ui:loot', it); else bus.emit('ui:error', 'Bolsa llena: has perdido la recompensa');
    }
    bus.emit('ui:zone', { title: '✔ Misión completada', sub: q.name, color: '#ffd34d' });
    s.gainXp(q.xp);
    this.changed();
    return true;
  }
  removeItems(id, n) {
    const inv = this.state.inventory;
    for (let i = 0; i < inv.slots.length && n > 0; i++) {
      const sl = inv.slots[i];
      if (sl && sl.id === id) { const k = Math.min(n, sl.qty); inv.removeAt(i, k); n -= k; }
    }
  }

  /* --------------------------------------------------- eventos */
  check(filter, fn = () => {}) {
    let any = false;
    for (const q of this.list()) {
      if (!filter(q)) continue;
      const before = this.complete(q);
      fn(q, this.st.active[q.id]);
      any = true;
      if (!before && this.complete(q)) bus.emit('ui:toast', `✔ ${q.name}: ¡objetivo cumplido! Vuelve con ${NPCS[this.turnInNpc(q)].name}`, '#7dff7a');
    }
    if (any) this.changed();
  }
  onKill(m) {
    const id = m.def.id;
    this.check((q) => q.obj.type === 'kill' && q.obj.mob === id, (q, a) => { a.n = Math.min(q.obj.count, (a.n || 0) + 1); });
    if (m.boss && id === 'frostSpider') this.check((q) => q.obj.type === 'boss', (q, a) => { a.boss = true; });
  }
  onTalk(npc) {
    this.check((q) => q.obj.type === 'talk' && q.obj.npc === npc, (q, a) => { a.talked = true; });
  }
}
