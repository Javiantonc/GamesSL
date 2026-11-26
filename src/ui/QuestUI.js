import { el } from './dom.js';
import { Panel } from './Panel.js';
import { QUEST_BY_ID, NPCS } from '../data/quests.js';
import { DUNGEON_TIERS } from '../data/dungeons.js';
import { bus } from '../core/EventBus.js';

/** Registro de misiones (tecla L) + diálogos con los NPCs + rastreador en pantalla. */
export class QuestUI extends Panel {
  constructor(ui) {
    super(ui, 'quest-panel', '📜 Misiones');
    this.Q = ui.scene.quests;
    this.tracker = el('div', 'quest-tracker');
    ui.root.append(this.tracker);
    this.dialog = el('div', 'panel npc-dialog');
    ui.root.append(this.dialog);
    bus.on('quests:changed', () => { this.renderTracker(); if (this.open) this.render(); if (this.npc) this.openNpc(this.npc, true); });
    this.renderTracker();
  }

  renderTracker() {
    const Q = this.Q, list = Q.list();
    this.tracker.innerHTML = list.length ? '<h4>Misiones</h4>' + list.map((q) => {
      const done = Q.complete(q);
      return `<div class="${done ? 'done' : ''}"><b>${q.name}</b><p>${done ? `✔ Entrégala a ${NPCS[Q.turnInNpc(q)].name}` : '· ' + Q.objText(q)}</p></div>`;
    }).join('') : '';
  }

  render() {
    const Q = this.Q, list = Q.list();
    this.body.innerHTML = list.length ? list.map((q) => `<div class="qe">
        <h4>${q.name} <small>Nv ${q.lvl} · ${NPCS[q.npc].name}</small></h4><p>${q.text}</p>
        <p class="${Q.complete(q) ? 'good' : 'obj'}">${Q.complete(q) ? `✔ Completada: vuelve con ${NPCS[Q.turnInNpc(q)].name}` : '▸ ' + Q.objText(q)}</p>
        <p class="rw">Recompensa: ${Q.rewardText(q)}</p>
        <button class="btn-ghost" data-ab="${q.id}">Abandonar</button></div>`).join('')
      : `<p class="dim">No tienes misiones. Ve al pueblo de Albor (en el Claro del Inicio) y habla con los personajes que tienen un <b class="mk">!</b> encima.</p>`;
    this.body.insertAdjacentHTML('beforeend', `<p class="dim small">Misiones completadas: ${Q.st.done.length}</p>`);
    this.body.querySelectorAll('[data-ab]').forEach((b) => (b.onclick = () => Q.abandon(b.dataset.ab)));
  }

  /* ---------------------------------------------------------- diálogos */
  closeDialog() { this.npc = null; this.dialog.classList.remove('open'); }
  showDialog(title, html) {
    this.dialog.innerHTML = `<div class="panel-head"><span>${title}</span><button class="close">✕</button></div><div class="panel-body">${html}</div>`;
    this.dialog.querySelector('.close').onclick = () => this.closeDialog();
    this.dialog.classList.add('open');
  }
  openNpc(id, refresh = false) {
    const Q = this.Q, d = NPCS[id], st = this.state;
    if (!refresh) Q.onTalk(id);
    this.npc = id;
    if (refresh && this.dialog.dataset.view !== 'npc') return;
    this.dialog.dataset.view = 'npc';
    const line = (q, mark, cls) => `<button class="qopt ${cls}" data-q="${q.id}"><b>${mark}</b> ${q.name} <small>Nv ${q.lvl}</small></button>`;
    const ready = Q.ready(id), avail = Q.available(id), prog = Q.inProgress(id), soon = Q.upcoming(id);
    const sv = [];
    if (d.shop === 'buy') sv.push('<button class="btn-main" data-s="shop">🛒 Comerciar</button>');
    if (d.shop === 'forge') sv.push('<button class="btn-main" data-s="forge">⚒️ Mejorar equipo</button>');
    if (d.inn) sv.push('<button class="btn-main" data-s="inn">🍲 Comer y descansar (gratis)</button>');
    if (d.portals) sv.push('<button class="btn-main" data-s="portals">🌀 Ver portales</button>');
    this.showDialog(`${d.name} <small>&lt;${d.title}&gt;</small>`, `
      <p class="greet">«${d.greet}»</p>
      ${ready.map((q) => line(q, '?', 'ready')).join('')}${avail.map((q) => line(q, '!', 'new')).join('')}${prog.map((q) => line(q, '…', 'prog')).join('')}
      ${!ready.length && !avail.length && soon.length ? `<p class="dim">Vuelve cuando seas nivel ${Math.min(...soon.map((q) => q.lvl))}: tendré algo para ti.</p>` : ''}
      <div class="services">${sv.join('')}</div>`);
    this.dialog.querySelectorAll('.qopt').forEach((b) => (b.onclick = () => this.openQuest(id, QUEST_BY_ID[b.dataset.q])));
    const s = (k) => this.dialog.querySelector(`[data-s="${k}"]`);
    if (s('shop')) s('shop').onclick = () => { this.closeDialog(); this.ui.tablet.shopTab = 'buy'; this.ui.tablet.show('shop'); };
    if (s('forge')) s('forge').onclick = () => { this.closeDialog(); this.ui.tablet.shopTab = 'forge'; this.ui.tablet.show('shop'); };
    if (s('inn')) s('inn').onclick = () => {
      st.hp = st.stats.maxHp; st.mana = st.stats.maxMana; st.hunger = 100;
      bus.emit('ui:toast', '🍲 Has comido y descansado en la posada. ¡Como nuevo!', '#7dff7a');
      this.closeDialog();
    };
    if (s('portals')) s('portals').onclick = () => this.portalList();
  }
  openQuest(npc, q) {
    const Q = this.Q;
    this.dialog.dataset.view = 'quest';
    const done = Q.complete(q), active = Q.isActive(q.id);
    this.showDialog(q.name, `
      <p>${q.text}</p>
      <p class="obj">▸ ${Q.objText(q)}</p>
      <p class="rw"><b>Recompensa:</b> ${Q.rewardText(q)}</p>
      <div class="services">${done ? '<button class="btn-main" data-a="turn">✔ Completar misión</button>'
        : active ? '<button class="btn-ghost" data-a="back">Volver</button>' : '<button class="btn-main" data-a="accept">Aceptar misión</button>'}
        ${!active ? '<button class="btn-ghost" data-a="back">Ahora no</button>' : ''}</div>`);
    const a = (k) => this.dialog.querySelector(`[data-a="${k}"]`);
    if (a('accept')) a('accept').onclick = () => { Q.accept(q.id); this.dialog.dataset.view = 'npc'; this.openNpc(npc, true); };
    if (a('turn')) a('turn').onclick = () => { Q.turnIn(q.id); this.dialog.dataset.view = 'npc'; this.openNpc(npc, true); };
    this.dialog.querySelectorAll('[data-a="back"]').forEach((b) => (b.onclick = () => { this.dialog.dataset.view = 'npc'; this.openNpc(npc, true); }));
  }
  portalList() {
    const st = this.state;
    this.dialog.dataset.view = 'portals';
    this.showDialog('🌀 Los diez portales', `<p class="dim">Hay un portal de cada color repartido por el mundo, cada vez más lejos del pueblo. Uno cada 8 niveles. Completa los diez para abrir el portal de hielo del Bosque Invernal.</p>
      ${DUNGEON_TIERS.map((d) => `<div class="prow"><span><i style="background:${d.color}"></i>${d.emoji} ${d.name}</span>
        <b class="${st.dungeonsCleared.has(d.id) ? 'good' : st.level >= d.minLevel ? 'obj' : 'bad'}">${st.dungeonsCleared.has(d.id) ? '✔ Completada' : `Nv ${d.minLevel}-${d.maxLevel}`}</b></div>`).join('')}
      <div class="services"><button class="btn-ghost" data-a="back">Volver</button></div>`);
    this.dialog.querySelector('[data-a="back"]').onclick = () => { this.dialog.dataset.view = 'npc'; this.openNpc(this.npc, true); };
  }
}
