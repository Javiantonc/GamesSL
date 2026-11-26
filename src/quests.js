// Sistema de misiones: aceptar, progresar, entregar y recompensas.
import { QUESTS, QUEST_BY_ID, NPCS } from './data/quests.js';
import { QUEST_ITEMS, makeItem } from './data/items.js';
import { MOBS } from './data/mobs.js';
import { DUNGEONS } from './data/dungeons.js';

export class Quests {
  constructor(g) { this.g = g; }
  get st() { return this.g.pl.quests; }
  get p() { return this.g.pl; }

  turnInNpc(q) { return q.obj.type === 'talk' ? q.obj.npc : q.npc; }
  isActive(id) { return !!this.st.active[id]; }
  isDone(id) { return this.st.done.includes(id); }

  available(npc) {
    return QUESTS.filter((q) => q.npc === npc && !this.isDone(q.id) && !this.isActive(q.id)
      && this.p.level >= q.lvl && (!q.req || this.isDone(q.req)));
  }
  /** Misiones que se pueden entregar a este NPC. */
  ready(npc) {
    return Object.keys(this.st.active).map((id) => QUEST_BY_ID[id])
      .filter((q) => this.turnInNpc(q) === npc && this.complete(q));
  }
  inProgress(npc) {
    return Object.keys(this.st.active).map((id) => QUEST_BY_ID[id])
      .filter((q) => q.npc === npc && !this.complete(q) && q.obj.type !== 'talk');
  }
  /** Marca sobre la cabeza: ! (nueva), ? (para entregar), … (en curso), o nada. */
  marker(npc) {
    if (this.ready(npc).length) return '?';
    if (this.available(npc).length) return '!';
    if (this.inProgress(npc).length) return '…';
    return null;
  }
  /** Misiones nuevas que aparecen pronto (para avisar del nivel). */
  upcoming(npc) {
    return QUESTS.filter((q) => q.npc === npc && !this.isDone(q.id) && !this.isActive(q.id) && (!q.req || this.isDone(q.req)) && this.p.level < q.lvl);
  }

  progress(q) {
    const o = q.obj, a = this.st.active[q.id];
    switch (o.type) {
      case 'kill': return Math.min(o.count, a?.n || 0);
      case 'collect': return Math.min(o.count, this.p.questItems[o.item] || 0);
      case 'talk': return a?.talked ? 1 : 0;
      case 'dungeon': return this.p.dungeons.includes(o.tier) ? 1 : 0;
      case 'dungeons': return Math.min(o.count, this.p.dungeons.length);
      case 'boss': return this.p.bossKills.includes(o.mob) ? 1 : 0;
    }
    return 0;
  }
  goal(q) { return q.obj.count || 1; }
  complete(q) { return this.isActive(q.id) && this.progress(q) >= this.goal(q); }
  objText(q) {
    const o = q.obj;
    switch (o.type) {
      case 'kill': return `${MOBS[o.mob].name}: ${this.progress(q)}/${o.count}`;
      case 'collect': return `${QUEST_ITEMS[o.item].name}: ${this.progress(q)}/${o.count}`;
      case 'talk': return `Habla con ${NPCS[o.npc].name}`;
      case 'dungeon': return `Completa ${DUNGEONS[o.tier].name}: ${this.progress(q)}/1`;
      case 'dungeons': return `Mazmorras distintas completadas: ${this.progress(q)}/${o.count}`;
      case 'boss': return `Derrota a ${MOBS[o.mob].name}: ${this.progress(q)}/1`;
    }
    return '';
  }

  accept(id) {
    const q = QUEST_BY_ID[id];
    this.st.active[id] = { n: 0 };
    this.g.ui.toast(`Misión aceptada: ${q.name}`);
    this.g.ui.log(`Nueva misión: ${q.name}`, 'quest');
    this.g.refreshMarkers();
    this.g.save();
  }
  abandon(id) {
    delete this.st.active[id];
    this.g.refreshMarkers();
    this.g.save();
  }
  turnIn(id) {
    const q = QUEST_BY_ID[id], p = this.p;
    if (!this.complete(q)) return false;
    if (q.obj.type === 'collect') p.questItems[q.obj.item] -= q.obj.count;
    delete this.st.active[id];
    this.st.done.push(id);
    p.gold += q.gold;
    const rewards = [`${q.gold} de oro`];
    if (q.potions) { p.potions.pocion += q.potions; rewards.push(`${q.potions} pociones`); }
    if (q.item) {
      const it = makeItem(Math.max(1, Math.min(80, q.lvl + 1)), q.item.rarity, p.cls, q.item.slot);
      if (p.addToBag(it)) rewards.push(it.name); else this.g.ui.error('Bolsa llena: has perdido la recompensa');
    }
    const ups = p.addXp(q.xp);
    rewards.push(`${q.xp} XP`);
    this.g.ui.toast(`✔ ${q.name} completada`, true);
    this.g.ui.log(`Recompensa: ${rewards.join(', ')}`, 'quest');
    if (ups) this.g.onLevelUp(ups);
    this.g.refreshMarkers();
    this.g.save();
    return true;
  }

  /* ------------------------------------------------------- eventos */
  bump(filter, fn) {
    let changed = false;
    for (const id of Object.keys(this.st.active)) {
      const q = QUEST_BY_ID[id];
      if (!filter(q)) continue;
      const before = this.complete(q);
      fn(q, this.st.active[id]);
      changed = true;
      if (!before && this.complete(q)) { this.g.ui.toast(`${q.name}: ¡objetivo cumplido! Vuelve a hablar con ${NPCS[this.turnInNpc(q)].name}`); }
    }
    if (changed) { this.g.refreshMarkers(); this.g.ui.quests(); }
  }
  onKill(type) { this.bump((q) => q.obj.type === 'kill' && q.obj.mob === type, (q, a) => { a.n = Math.min(q.obj.count, (a.n || 0) + 1); }); }
  wants(item) { return Object.keys(this.st.active).some((id) => { const q = QUEST_BY_ID[id]; return q.obj.type === 'collect' && q.obj.item === item && this.progress(q) < q.obj.count; }); }
  addItem(item) {
    this.p.questItems[item] = (this.p.questItems[item] || 0) + 1;
    this.g.ui.log(`Has conseguido: ${QUEST_ITEMS[item].name}`, 'quest');
    this.bump((q) => q.obj.type === 'collect' && q.obj.item === item, () => {});
  }
  onTalk(npc) { this.bump((q) => q.obj.type === 'talk' && q.obj.npc === npc, (q, a) => { a.talked = true; }); }
  onDungeon() { this.bump((q) => q.obj.type === 'dungeon' || q.obj.type === 'dungeons', () => {}); }
  onBoss(mob) {
    if (!this.p.bossKills.includes(mob)) this.p.bossKills.push(mob);
    this.bump((q) => q.obj.type === 'boss', () => {});
  }
}
