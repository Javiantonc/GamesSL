import { el } from './dom.js';
import { bus } from '../core/EventBus.js';
import { RARITIES, STAT_NAMES } from '../data/items.js';
import { levelColor } from '../systems/Progression.js';

/** Marcos de unidad (jugador/objetivo), barra de XP, mensajes y registro de botín. */
export class HUD {
  constructor(ui) {
    this.ui = ui;
    this.state = ui.state;
    const root = ui.root;

    // ---- Marco del jugador ----
    this.pf = el('div', 'unitframe player-frame');
    this.pf.innerHTML = `
      <div class="portrait"><canvas width="128" height="128"></canvas><span class="lvl"></span></div>
      <div class="uf-body">
        <div class="uf-name">${this.state.name} <span class="uf-class"></span></div>
        <div class="bar hp"><div class="fill"></div><span></span></div>
        <div class="bar mana"><div class="fill"></div><span></span></div>
        <div class="bar hunger" title="Hambre: come para regenerar vida"><div class="fill"></div><span></span></div>
      </div>`;
    root.append(this.pf);
    this.classEl = this.pf.querySelector('.uf-class');
    this.buffsEl = el('div', 'buffs');
    this.goldEl = el('div', 'gold-pill', `🪙 ${this.state.gold}`);
    this.goldEl.title = 'Oro: gástalo en la Tienda de la tablet';
    this.armyEl = el('div', 'army-panel hidden');
    root.append(this.buffsEl, this.goldEl, this.armyEl);
    this.nextArmy = 0;
    ui.drawPortrait(this.pf.querySelector('canvas'), 2.1, true);
    this.pfLvl = this.pf.querySelector('.lvl');
    this.bars = {
      hp: this.pf.querySelector('.hp'), mana: this.pf.querySelector('.mana'), hunger: this.pf.querySelector('.hunger'),
    };

    // ---- Marco del objetivo ----
    this.tf = el('div', 'unitframe target-frame hidden');
    this.tf.innerHTML = `
      <div class="uf-body">
        <div class="uf-name"><span class="tname"></span> <span class="tlvl"></span></div>
        <div class="bar hp"><div class="fill"></div><span></span></div>
        <div class="tclass"></div>
      </div>`;
    root.append(this.tf);

    // ---- Barra de XP, mensajes, botín ----
    this.xp = el('div', 'xpbar', '<div class="fill"></div><span></span>');
    ui.bottom.prepend(this.xp);
    this.errorEl = el('div', 'error-text');
    this.toasts = el('div', 'toasts');
    this.lootLog = el('div', 'loot-log');
    this.banner = el('div', 'levelup-banner');
    this.zoneBanner = el('div', 'zone-banner');
    this.help = el('div', 'help', `
      <b>WASD</b> moverse · <b>Clic/Tab</b> objetivo · <b>Clic dcho.</b> atacar · <b>1-0</b> habilidades · <b>E</b> hablar / talar<br>
      📜 Habla con los NPCs con <b style="color:#ffd23a">!</b> del pueblo de Albor para conseguir misiones · <b>L</b> registro de misiones<br>
      <b>T</b> tablet (clase, atributos, habilidades, objetos) · <b>C</b> personaje y equipo<br>
      <b>E</b> junto a un <b>portal</b>: mazmorra · <b>O</b> tienda · ❄️ Bosque Invernal: completa las 10 mazmorras`);
    root.append(this.errorEl, this.toasts, this.lootLog, this.banner, this.zoneBanner, this.help);

    bus.on('target:changed', (m) => this.setTarget(m));
    bus.on('xp:changed', () => this.renderXp());
    bus.on('ui:error', (m) => this.error(m));
    bus.on('ui:toast', (m, c) => this.toast(m, c));
    bus.on('ui:loot', (item) => this.loot(item));
    bus.on('ui:statdiff', (diffs) => this.statDiff(diffs));
    bus.on('player:levelup', (d) => this.levelUp(d));
    bus.on('class:changed', (c) => { this.classEl.textContent = `· ${c.icon} ${c.name}`; this.classEl.style.color = c.color; });
    bus.on('buffs:changed', () => this.renderBuffs());
    bus.on('ui:zone', (z) => this.zone(z));
    bus.on('gold:changed', () => {
      this.goldEl.textContent = `🪙 ${this.state.gold.toLocaleString('es-ES')}`;
      this.goldEl.classList.remove('bump'); void this.goldEl.offsetWidth; this.goldEl.classList.add('bump');
    });
    this.renderXp();
    this.last = {};
  }

  setBar(bar, cur, max, key, label = null) {
    const pct = Math.max(0, Math.min(1, cur / max));
    const txt = label ?? `${Math.ceil(cur)} / ${max}`;
    if (this.last[key] === txt) return;
    this.last[key] = txt;
    bar.querySelector('.fill').style.width = `${pct * 100}%`;
    bar.querySelector('span').textContent = txt;
  }

  update(now = performance.now()) {
    const s = this.state;
    this.setBar(this.bars.hp, Math.max(0, s.hp), s.stats.maxHp, 'hp');
    this.setBar(this.bars.mana, s.mana, s.stats.maxMana, 'mana');
    this.setBar(this.bars.hunger, s.hunger, 100, 'hunger', `🍖 ${Math.ceil(s.hunger)}%`);
    this.bars.hunger.classList.toggle('starving', s.hunger <= 20);
    if (this.last.lvl !== s.level) { this.last.lvl = s.level; this.pfLvl.textContent = s.level; }
    if (now > this.nextArmy) { this.nextArmy = now + 250; this.renderArmy(); }
    if (this.buffsEl.children.length) {
      const now = performance.now();
      for (const n of this.buffsEl.children) n.querySelector('small').textContent = `${Math.max(0, Math.ceil((n.until - now) / 1000))}s`;
    }
    const t = this.target;
    if (t) {
      if (t.dead) { this.setTarget(null); return; }
      this.setBar(this.tf.querySelector('.hp'), Math.max(0, t.hp), t.maxHp, 'thp');
      this.tf.querySelector('.tlvl').style.color = levelColor(t.level, s.level);
    }
  }

  setTarget(m) {
    this.target = m;
    this.last.thp = null;
    this.tf.classList.toggle('hidden', !m);
    if (!m) return;
    this.tf.classList.toggle('elite', m.elite);
    this.tf.querySelector('.tname').textContent = m.name;
    this.tf.querySelector('.tlvl').textContent = `Nv ${m.level}`;
    this.tf.querySelector('.tclass').textContent = m.boss ? '☠ Jefe' : m.elite ? '★ Élite' : 'Bestia';
  }

  renderXp() {
    const s = this.state;
    if (s.level >= 80) {
      this.xp.querySelector('.fill').style.width = '100%';
      this.xp.querySelector('span').textContent = 'Nivel 80 · ¡Nivel máximo!';
      return;
    }
    const pct = s.xp / s.xpToNext;
    this.xp.querySelector('.fill').style.width = `${pct * 100}%`;
    this.xp.querySelector('span').textContent = `Nivel ${s.level} · XP ${s.xp} / ${s.xpToNext} (${Math.floor(pct * 100)}%)`;
  }

  error(msg) {
    this.errorEl.textContent = msg;
    this.errorEl.classList.remove('show'); void this.errorEl.offsetWidth; this.errorEl.classList.add('show');
  }

  toast(msg, color = '#ffffff') {
    const t = el('div', 'toast', msg);
    t.style.color = color;
    this.toasts.append(t);
    setTimeout(() => t.remove(), 3200);
  }

  loot(item) {
    const R = RARITIES[item.rarity];
    const line = el('div', 'loot-line', `Recibes: <b style="color:${R.color}">[${item.icon} ${item.name}]</b>${item.qty > 1 ? ` x${item.qty}` : ''}`);
    this.lootLog.append(line);
    while (this.lootLog.children.length > 6) this.lootLog.firstChild.remove();
    setTimeout(() => line.classList.add('fade'), 7000);
  }

  /** Cartel grande al entrar/salir/completar una mazmorra. */
  zone({ title, sub, color }) {
    this.zoneBanner.innerHTML = `<div class="zt">${title}</div><div class="zs">${sub}</div>`;
    this.zoneBanner.style.setProperty('--zc', color);
    this.zoneBanner.classList.remove('show'); void this.zoneBanner.offsetWidth; this.zoneBanner.classList.add('show');
  }

  /** Panel del ejército de sombras: plazas ocupadas y vida de cada sombra. */
  renderArmy() {
    const army = this.ui.scene.army;
    const show = army.unlocked() || army.shadows.length > 0;
    this.armyEl.classList.toggle('hidden', !show);
    if (!show) return;
    const fury = army.furyUntil > performance.now();
    let h = `<div class="army-title">👥 Ejército de espectros <b>${army.used()}/${army.capacity()}</b>${fury ? ' <span class="fury">🌑 FURIA</span>' : ''}</div><div class="army-list">`;
    for (const s of army.shadows) {
      const pct = Math.max(0, s.hp / s.maxHp) * 100;
      h += `<div class="army-unit ${s.boss ? 'boss' : s.elite ? 'elite' : ''}" title="${s.name}"><span>${s.icon}</span><i><b style="width:${pct}%"></b></i></div>`;
    }
    if (!army.shadows.length) h += '<small>Derrota enemigos y usa 👥 Reclutar Sombras junto a su esencia turquesa</small>';
    if (army.essences.length) h += `<small class="ess">✦ ${army.essences.length} esencia${army.essences.length > 1 ? 's' : ''} cerca</small>`;
    this.armyEl.innerHTML = h + '</div>';
  }

  renderBuffs() {
    this.buffsEl.innerHTML = '';
    for (const b of this.state.buffs) {
      const n = el('div', 'buff', `<span>${b.icon}</span><small></small>`);
      n.title = b.name; n.until = b.until;
      this.buffsEl.append(n);
    }
  }

  statDiff(diffs) {
    const txt = diffs.map(([k, d]) => `<span class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${d} ${STAT_NAMES[k]}</span>`).join(' ');
    this.toast(txt);
  }

  levelUp({ level, learned }) {
    this.banner.innerHTML = `<div class="lv">¡NIVEL ${level}!</div><div class="learn">+3 puntos de atributo · +1 punto de habilidad</div>` +
      (learned.length ? `<div class="learn">Nueva habilidad: ${learned.map((a) => `${a.icon} ${a.name}`).join(', ')} (añadida a tu barra)</div>` : '') +
      '<small>Abre tu tablet (T) para gastarlos</small>';
    this.banner.classList.remove('show'); void this.banner.offsetWidth; this.banner.classList.add('show');
    this.renderXp();
  }
}
