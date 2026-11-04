import { el, itemSlotEl, makeDraggable, makeDropTarget } from './dom.js';
import { CLASSES, ATTRIBUTES, ATTR_PER_POINT } from '../data/classes.js';
import { ABILITIES, MAX_RANK, RANK_POWER, rankPower, rankCooldown } from '../data/abilities.js';
import { bus } from '../core/EventBus.js';
import { RARITIES, SLOTS, STAT_NAMES, CONSUMABLES } from '../data/items.js';
import { FORGE_MAX, FORGE_STEP, forgeCost, POWERS, powerCost, SCROLLS, SHOP_STOCK, sellPrice } from '../data/shop.js';

const APPS = [
  { id: 'class', icon: '🧬', name: 'Clase' },
  { id: 'attrs', icon: '📊', name: 'Atributos' },
  { id: 'skills', icon: '✨', name: 'Habilidades' },
  { id: 'items', icon: '🎒', name: 'Objetos' },
  { id: 'shop', icon: '🛒', name: 'Tienda' },
];
const SHOP_TABS = [
  { id: 'forge', label: '⚒️ Forja' },
  { id: 'powers', label: '⚡ Poderes' },
  { id: 'buy', label: '🧪 Consumibles' },
  { id: 'sell', label: '💰 Vender' },
];

/**
 * TABLET: sustituye a la mochila. Un "dispositivo" con 4 apps:
 *  🧬 Clase       -> Asesino / Mago / Tanque / Support
 *  📊 Atributos   -> repartir puntos en Poder, Resistencia, Agilidad, Magia
 *  ✨ Habilidades -> subir de rango y arrastrar a la barra de acción
 *  🎒 Objetos     -> inventario (equipar, usar, destruir)
 */
export class TabletUI {
  constructor(ui) {
    this.ui = ui;
    this.state = ui.state;
    this.open = false;
    this.app = 'class';
    this.shopTab = 'forge';

    this.node = el('div', 'tablet');
    this.node.innerHTML = `
      <div class="tablet-cam"></div>
      <div class="tablet-screen">
        <div class="tablet-status">
          <span class="clock"></span><span class="os">MiniOS</span>
          <span class="pts"></span><span class="batt">📶 🔋87%</span>
          <button class="tclose" title="Cerrar (Esc)">✕</button>
        </div>
        <div class="tablet-app"></div>
        <div class="tablet-dock"></div>
      </div>
      <div class="tablet-home"></div>`;
    ui.root.append(this.node);
    this.appEl = this.node.querySelector('.tablet-app');
    this.ptsEl = this.node.querySelector('.pts');
    this.clockEl = this.node.querySelector('.clock');
    this.node.querySelector('.tclose').onclick = () => this.close();
    this.node.querySelector('.tablet-home').onclick = () => this.close();

    const dock = this.node.querySelector('.tablet-dock');
    this.dockBtns = {};
    for (const a of APPS) {
      const b = el('button', 'dock-app', `<span class="dock-icon">${a.icon}</span><small>${a.name}</small><i class="badge"></i>`);
      b.onclick = () => this.show(a.id);
      dock.append(b);
      this.dockBtns[a.id] = b;
    }

    const rerender = (apps) => () => { this.updateBadges(); if (this.open && (!apps || apps.includes(this.app))) this.render(); };
    bus.on('inventory:changed', rerender(['items', 'shop']));
    bus.on('gold:changed', rerender(['shop']));
    bus.on('shop:changed', rerender(['shop']));
    bus.on('equipment:changed', rerender(['shop']));
    bus.on('points:changed', rerender());
    bus.on('class:changed', rerender());
    bus.on('actionbar:changed', rerender(['skills']));
    bus.on('player:levelup', rerender());
    bus.on('stats:changed', rerender(['attrs']));
    this.updateBadges();
  }

  // ---------------- abrir / cerrar ----------------
  show(app) {
    if (app) this.app = app;
    this.open = true;
    this.node.classList.add('open');
    this.render();
  }
  toggle(app) {
    if (this.open && (!app || app === this.app)) this.close(); else this.show(app);
  }
  close() {
    this.open = false;
    this.node.classList.remove('open');
    this.ui.tooltip.hide();
  }

  updateBadges() {
    const st = this.state;
    const set = (id, v) => { const b = this.dockBtns[id].querySelector('.badge'); b.textContent = v || ''; b.style.display = v ? '' : 'none'; };
    set('class', st.classId ? '' : '!');
    set('attrs', st.attrPoints);
    set('skills', st.skillPoints);
    set('items', '');
    set('shop', '');
    this.ui.microTablet?.classList.toggle('notify', !st.classId || st.attrPoints > 0 || st.skillPoints > 0);
  }

  render() {
    const st = this.state;
    const now = new Date();
    this.clockEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.ptsEl.innerHTML = `<b title="Oro">🪙 ${st.gold.toLocaleString('es-ES')}</b> <b title="Puntos de atributo">📊 ${st.attrPoints}</b> <b title="Puntos de habilidad">✨ ${st.skillPoints}</b>`;
    for (const [id, b] of Object.entries(this.dockBtns)) b.classList.toggle('active', id === this.app);
    this.appEl.innerHTML = '';
    this.appEl.className = `tablet-app app-${this.app}`;
    const scroll = this.appEl.scrollTop;
    ({
      class: () => this.renderClass(), attrs: () => this.renderAttrs(), skills: () => this.renderSkills(),
      items: () => this.renderItems(), shop: () => this.renderShop(),
    })[this.app]();
    this.appEl.scrollTop = scroll;
    this.updateBadges();
  }

  // ---------------- App: Clase ----------------
  renderClass() {
    const st = this.state;
    this.appEl.append(el('div', 'app-head', `<h2>🧬 Clase</h2><p>Tu nivel, equipo y puntos se conservan. Cambiar de clase es gratis.</p>`));
    const grid = el('div', 'class-grid');
    for (const c of Object.values(CLASSES)) {
      const active = st.classId === c.id;
      const abilities = Object.values(ABILITIES).filter((a) => a.cls === c.id);
      const card = el('div', `class-card ${active ? 'active' : ''}`, `
        <div class="cc-top"><span class="cc-icon">${c.icon}</span><div><b>${c.name}</b><small>${c.role}</small></div></div>
        <p>${c.desc}</p>
        <ul>${c.perks.map((p) => `<li>${p}</li>`).join('')}</ul>
        <div class="cc-skills">${abilities.map((a) => `<span title="${a.name} (nivel ${a.unlockLevel})">${a.icon}</span>`).join('')}</div>
        <button>${active ? '✔ Clase actual' : 'Elegir'}</button>`);
      card.style.setProperty('--cc', c.color);
      card.querySelector('button').onclick = () => st.chooseClass(c.id);
      grid.append(card);
    }
    this.appEl.append(grid);
  }

  // ---------------- App: Atributos ----------------
  renderAttrs() {
    const st = this.state;
    const s = st.stats;
    const head = el('div', 'app-head', `<h2>📊 Atributos</h2><p>Puntos disponibles: <b class="big-pts">${st.attrPoints}</b> · ganas 3 por nivel</p>`);
    const reset = el('button', 'btn-ghost', '↺ Reiniciar puntos');
    reset.onclick = () => st.resetPoints();
    head.append(reset);
    this.appEl.append(head);

    for (const [k, a] of Object.entries(ATTRIBUTES)) {
      const mult = st.cls?.mods[k];
      const row = el('div', 'attr-row', `
        <span class="attr-icon">${a.icon}</span>
        <div class="attr-info"><b>${a.name}</b>${mult ? `<i class="tag" style="--cc:${st.cls.color}">×${String(mult).replace('.', ',')} ${st.cls.name}</i>` : ''}<small>${a.effect}</small></div>
        <div class="attr-val"><b>${s[k]}</b><small>${st.allocated[k] ? `+${st.allocated[k] * ATTR_PER_POINT} de puntos` : ''}</small></div>`);
      const plus = el('button', 'btn-plus', '+');
      plus.disabled = st.attrPoints <= 0;
      plus.onclick = () => st.allocate(k);
      row.append(plus);
      this.appEl.append(row);
    }
    const sum = [
      ['❤️ Vida', s.maxHp], ['💧 Maná', s.maxMana], ['⚔️ Poder de ataque', s.attackPower],
      ['🔮 Poder hechizos', s.spellPower], ['🎯 Crítico', `${s.crit}%`], ['🛡️ Reducción daño', `${(s.damageReduction * 100).toFixed(1)}%`],
    ];
    this.appEl.append(el('div', 'attr-summary', sum.map(([n, v]) => `<div><span>${n}</span><b>${v}</b></div>`).join('')));
  }

  // ---------------- App: Habilidades ----------------
  renderSkills() {
    const st = this.state;
    const s = st.stats;
    const head = el('div', 'app-head', `<h2>✨ Habilidades</h2><p>Puntos de habilidad: <b class="big-pts">${st.skillPoints}</b> · arrastra un icono a tu barra de acción</p>`);
    this.appEl.append(head);
    if (!st.classId) {
      const n = el('div', 'notice', 'Todavía no tienes clase. Elige una para desbloquear sus habilidades.');
      const go = el('button', 'btn-main', '🧬 Elegir clase');
      go.onclick = () => this.show('class');
      n.append(go);
      this.appEl.append(n);
    }
    const list = el('div', 'skill-list');
    for (const ab of st.availableAbilities()) {
      const known = st.known.has(ab.id);
      const rank = st.rank(ab.id);
      const row = el('div', `skill-row ${known ? '' : 'locked'}`);
      const icon = el('div', 'slot skill-icon', `<span class="icon">${ab.icon}</span>${known ? `<span class="rank-badge">${rank}</span>` : ''}`);
      if (known) makeDraggable(icon, () => ({ src: 'spell', id: ab.id }));
      icon.addEventListener('mouseenter', (e) => this.ui.tooltip.showAbility(ab, e, known));
      icon.addEventListener('mouseleave', () => this.ui.tooltip.hide());

      const pips = Array.from({ length: MAX_RANK }, (_, i) => `<i class="${i < rank && known ? 'on' : ''}"></i>`).join('');
      const cd = rankCooldown(ab, rank);
      const info = known
        ? `Potencia ${Math.round(rankPower(rank) * 100)}%${ab.cooldown ? ` · Reutilización ${cd.toFixed(1)} s` : ''}${st.actionBar.has(ab.id) ? ' · <span class="on-bar">en la barra</span>' : ''}`
        : `Se desbloquea a nivel ${ab.unlockLevel}`;
      row.append(icon, el('div', 'skill-info', `<b>${ab.name}</b><div class="pips">${pips}</div><small>${info}</small>`));

      const up = el('button', 'btn-up', rank >= MAX_RANK ? 'MAX' : `⬆<small>+${RANK_POWER * 100}%</small>`);
      up.disabled = !known || rank >= MAX_RANK || st.skillPoints <= 0;
      up.title = rank >= MAX_RANK ? 'Rango máximo' : 'Mejorar: +20% potencia, -4% reutilización';
      up.onclick = () => st.upgradeAbility(ab.id);
      row.append(up);
      list.append(row);
    }
    this.appEl.append(list);
    void s;
  }

  // ---------------- App: Tienda ----------------
  renderShop() {
    const st = this.state;
    const head = el('div', 'app-head', `<h2>🛒 Tienda</h2><p>Tu oro: <b class="big-pts">🪙 ${st.gold.toLocaleString('es-ES')}</b> · los monstruos sueltan oro al morir</p>`);
    const tabs = el('div', 'shop-tabs');
    for (const t of SHOP_TABS) {
      const b = el('button', `shop-tab ${t.id === this.shopTab ? 'active' : ''}`, t.label);
      b.onclick = () => { this.shopTab = t.id; this.appEl.scrollTop = 0; this.render(); };
      tabs.append(b);
    }
    this.appEl.append(head, tabs);
    const buyBtn = (cost, enabled, label = '') => {
      const b = el('button', 'btn-buy', `${label}🪙 ${cost.toLocaleString('es-ES')}`);
      b.disabled = !enabled || st.gold < cost;
      return b;
    };

    if (this.shopTab === 'forge') {
      this.appEl.append(el('div', 'shop-hint', `Cada mejora da <b>+${FORGE_STEP * 100}%</b> a todas las estadísticas de la pieza (máx. +${FORGE_MAX}).`));
      const equipped = Object.keys(SLOTS).map((k) => st.equipment.slots[k]).filter(Boolean);
      if (!equipped.length) this.appEl.append(el('div', 'notice', 'No llevas nada equipado.'));
      for (const item of equipped) {
        const up = item.upgrade || 0;
        const maxed = up >= FORGE_MAX;
        const cost = maxed ? 0 : forgeCost(item);
        const base = item.baseStats || item.stats;
        const next = Object.entries(base).map(([k, v]) => {
          const cur = item.stats[k];
          const nv = Math.max(Math.round(v * (1 + FORGE_STEP * (up + 1))), v + up + 1);
          return `${STAT_NAMES[k]} ${cur}${maxed ? '' : ` → <b class="tt-good">${nv}</b>`}`;
        }).join(' · ');
        const row = el('div', 'shop-row');
        const icon = el('div', 'slot', `<span class="icon">${item.icon}</span>${up ? `<span class="rank-badge">+${up}</span>` : ''}`);
        icon.style.setProperty('--rc', RARITIES[item.rarity].color);
        icon.addEventListener('mouseenter', (e) => this.ui.tooltip.showItem(item, e, { compare: false }));
        icon.addEventListener('mouseleave', () => this.ui.tooltip.hide());
        const info = el('div', 'shop-info', `<b style="color:${RARITIES[item.rarity].color}">${item.name}</b>
          <div class="pips forge">${Array.from({ length: FORGE_MAX }, (_, i) => `<i class="${i < up ? 'on' : ''}"></i>`).join('')}</div>
          <small>${next}</small>`);
        const b = maxed ? el('button', 'btn-buy', 'MAX') : buyBtn(cost, true, '⚒️ ');
        if (maxed) b.disabled = true;
        b.onclick = () => st.forge(item.slot);
        row.append(icon, info, b);
        this.appEl.append(row);
      }
    }

    if (this.shopTab === 'powers') {
      this.appEl.append(el('div', 'shop-hint', 'Mejoras permanentes para tu personaje, sea cual sea su clase.'));
      for (const [id, p] of Object.entries(POWERS)) {
        const lvl = st.powers[id] || 0;
        const maxed = lvl >= p.max;
        const cost = powerCost(p, lvl);
        const total = p.bonus.endsWith('Add') ? +(p.per * lvl).toFixed(1) : Math.round(p.per * lvl * 100);
        const row = el('div', 'shop-row');
        row.append(
          el('div', 'shop-big-icon', p.icon),
          el('div', 'shop-info', `<div><b>${p.name}</b> <span class="lvl-pill">Nv ${lvl}/${p.max}</span></div><small>${p.desc} por nivel · ahora: <b class="tt-good">+${total}${p.bonus === 'drAdd' ? '' : '%'}</b>${p.bonus === 'drAdd' ? '' : ''}</small>`),
        );
        const b = maxed ? el('button', 'btn-buy', 'MAX') : buyBtn(cost, true);
        if (maxed) b.disabled = true;
        b.onclick = () => st.buyPower(id);
        row.append(b);
        this.appEl.append(row);
      }
      this.appEl.append(el('div', 'shop-sub', '📜 Pergaminos'));
      for (const [id, s] of Object.entries(SCROLLS)) {
        const row = el('div', 'shop-row');
        row.append(el('div', 'shop-big-icon', s.icon), el('div', 'shop-info', `<b>${s.name}</b><small>${s.desc} · comprados: ${st.scrolls[id]}</small>`));
        const b = buyBtn(st.scrollCost(id), true);
        b.onclick = () => st.buyScroll(id);
        row.append(b);
        this.appEl.append(row);
      }
    }

    if (this.shopTab === 'buy') {
      for (const e of SHOP_STOCK) {
        const d = CONSUMABLES[e.id];
        const row = el('div', 'shop-row');
        row.append(el('div', 'shop-big-icon', d.icon), el('div', 'shop-info', `<b>${d.name}</b><small>${d.desc} · tienes ${st.inventory.countOf(e.id)}</small>`));
        const b = buyBtn(e.price, true);
        b.onclick = () => st.buyItem(e.id);
        row.append(b);
        this.appEl.append(row);
      }
    }

    if (this.shopTab === 'sell') {
      const bar = el('div', 'shop-hint', 'Haz clic en un objeto para venderlo. ');
      const junk = el('button', 'btn-ghost', '💰 Vender todo el equipo común y poco común');
      junk.onclick = () => st.sellJunk();
      bar.append(junk);
      this.appEl.append(bar);
      const grid = el('div', 'bag-grid sell-grid');
      st.inventory.slots.forEach((item, i) => {
        const s = itemSlotEl(item);
        if (item) {
          s.append(el('span', 'price', `${sellPrice(item)}`));
          s.addEventListener('click', () => { this.ui.tooltip.hide(); const g = st.sell(i); bus.emit('ui:toast', `Vendido: ${item.name} (+${g} 🪙)`, '#ffd34d'); });
          s.addEventListener('mouseenter', (e) => this.ui.tooltip.showItem(item, e, { hint: `Clic: vender por ${sellPrice(item)} 🪙` }));
          s.addEventListener('mouseleave', () => this.ui.tooltip.hide());
        }
        grid.append(s);
      });
      this.appEl.append(grid);
    }
  }

  // ---------------- App: Objetos ----------------
  renderItems() {
    const st = this.state;
    const inv = st.inventory;
    const tt = this.ui.tooltip;
    this.appEl.append(el('div', 'app-head', `<h2>🎒 Objetos</h2><p>${inv.usedCount()} / ${inv.size} ranuras · clic derecho para usar o equipar</p>`));
    const grid = el('div', 'bag-grid');
    inv.slots.forEach((item, i) => {
      const s = itemSlotEl(item);
      if (item) {
        makeDraggable(s, () => ({ src: 'bag', index: i }));
        s.addEventListener('contextmenu', (e) => { e.preventDefault(); tt.hide(); st.useFromBag(i); });
        s.addEventListener('mouseenter', (e) => tt.showItem(item, e, { hint: item.type === 'equipment' ? 'Clic derecho: equipar' : item.type === 'material' ? '' : 'Clic derecho: usar' }));
        s.addEventListener('mouseleave', () => tt.hide());
      }
      makeDropTarget(s, (p) => p.src === 'bag' || p.src === 'equip', (p) => {
        if (p.src === 'bag') inv.move(p.index, i);
        else st.unequipToBag(p.slot, i);
      });
      grid.append(s);
    });
    const trash = el('div', 'trash', '🗑️ Destruir');
    trash.title = 'Arrastra un objeto aquí para destruirlo';
    makeDropTarget(trash, (p) => p.src === 'bag', (p) => {
      const it = inv.removeAt(p.index, Infinity);
      if (it) bus.emit('ui:toast', `Destruido: ${it.name}`, '#bbbbbb');
    });
    const openChar = el('button', 'btn-ghost', '👤 Ver equipo (C)');
    openChar.onclick = () => this.ui.panels.char.show();
    const foot = el('div', 'bag-footer');
    foot.append(openChar, trash);
    this.appEl.append(grid, foot);
  }
}
