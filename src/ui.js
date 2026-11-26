// Interfaz estilo MMO en HTML sobre el canvas.
import * as THREE from 'three';
import { CLASSES, ATTRS, xpToLevel, MAX_LEVEL } from './data/classes.js';
import { RARITY, SLOTS, CONSUMABLES, QUEST_ITEMS, sellPrice, forgeCost, FORGE_MAX, itemPower } from './data/items.js';
import { DUNGEONS } from './data/dungeons.js';
import { QUEST_BY_ID, NPCS } from './data/quests.js';
import { mapImage, HALF, ZONES, zoneAt } from './world/terrain.js';
import { CELL } from './world/dungeon.js';
import { heroPortrait } from './portraits.js';

const $ = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STAT_NAMES = { poder: 'Poder', agilidad: 'Agilidad', magia: 'Magia', resistencia: 'Resistencia' };
const lvlColor = (ml, pl) => { const d = ml - pl; return d >= 5 ? '#ff3b3b' : d >= 3 ? '#ff8a2a' : d >= -2 ? '#ffd84a' : d >= -7 ? '#4bd34b' : '#9a9a9a'; };
const v = new THREE.Vector3();
export const IS_TOUCH = matchMedia('(pointer: coarse)').matches || location.search.includes('movil');

export class UI {
  constructor(root) {
    this.root = root;
    this.g = null;
    this.open = null;
    this.typing = false;
    this.popups = [];
    this.plates = [];
    if (IS_TOUCH) document.body.classList.add('touch');
  }

  /* ===================================================== pantalla inicial */
  showTitle(onPlay) {
    const saved = this.g.loadSave();
    let cls = 'tanque';
    const el = $(`<div class="screen title">
      <div class="logo"><h1>Mini Realms</h1><p>Reinos de Albor · RPG online de aventuras</p></div>
      ${saved ? `<div class="continue"><button class="btn big" data-act="continue">▶ Continuar con ${esc(saved.name)} <small>(${CLASSES[saved.cls].name} · Nv ${saved.level})</small></button></div>` : ''}
      <div class="create panel">
        <h2>${saved ? 'O crea un personaje nuevo' : 'Crea tu personaje'}</h2>
        <div class="classes">${Object.entries(CLASSES).map(([id, c]) => `
          <button class="cls ${id === cls ? 'sel' : ''}" data-cls="${id}" style="--c:${c.color}">
            <img src="${heroPortrait(id, true)}" alt=""><b>${c.icon} ${c.name}</b><small>${c.title}</small></button>`).join('')}</div>
        <p class="cdesc"></p>
        <div class="namerow"><input maxlength="14" placeholder="Nombre del héroe" value="${['Aren', 'Lysa', 'Toren', 'Mira', 'Kael', 'Nyra'][(Math.random() * 6) | 0]}">
        <button class="btn big" data-act="new">Entrar en el mundo</button></div>
        ${saved ? '<p class="warn">Crear un personaje nuevo borra la partida guardada.</p>' : ''}
      </div>
      <p class="keys">${IS_TOUCH ? 'Joystick para moverte · arrastra para girar la cámara · toca un enemigo para seleccionarlo'
        : '<kbd>WASD</kbd> moverse · <kbd>ratón</kbd> girar cámara · <kbd>Tab</kbd> objetivo · <kbd>1-6</kbd> habilidades · <kbd>F</kbd> hablar · <kbd>clic der.</kbd> atacar'}</p>
    </div>`);
    const desc = el.querySelector('.cdesc');
    const setDesc = () => { const c = CLASSES[cls]; desc.innerHTML = `<b style="color:${c.color}">${c.name}</b> — ${c.desc}`; };
    setDesc();
    el.querySelectorAll('.cls').forEach((b) => b.addEventListener('click', () => {
      cls = b.dataset.cls; el.querySelectorAll('.cls').forEach((x) => x.classList.toggle('sel', x === b)); setDesc();
    }));
    const input = el.querySelector('input');
    input.addEventListener('focus', () => (this.typing = true));
    input.addEventListener('blur', () => (this.typing = false));
    el.querySelector('[data-act="new"]').addEventListener('click', () => {
      const name = input.value.trim() || 'Héroe';
      this.g.deleteSave();
      el.remove(); onPlay(name, cls, null);
    });
    el.querySelector('[data-act="continue"]')?.addEventListener('click', () => { el.remove(); onPlay(saved.name, saved.cls, saved); });
    this.root.appendChild(el);
  }

  /* ================================================================ HUD */
  onStart() {
    const g = this.g, p = g.pl, C = p.C;
    this.hud = $(`<div class="hud">
      <div class="unit player"><img class="port" src="${heroPortrait(p.cls)}"><div class="info">
        <div class="nm"><span>${esc(p.name)}</span><b class="lv"></b></div>
        <div class="bar hp"><i></i><span></span></div><div class="bar res" style="--c:${C.resColor}"><i></i><span></span></div>
        <div class="combo"></div></div><div class="buffs"></div></div>
      <div class="unit target hidden"><div class="info">
        <div class="nm"><span></span><b class="lv"></b></div>
        <div class="bar hp"><i></i><span></span></div><div class="tag"></div></div><div class="debuffs"></div></div>
      <div class="mm"><div class="zn"></div><canvas width="180" height="180"></canvas><div class="co"></div></div>
      <div class="tracker"></div>
      <div class="castbar hidden"><i></i><span></span></div>
      <div class="actionbar"></div>
      <div class="xpbar"><i></i><span></span></div>
      <div class="chat"><div class="lines"></div></div>
      <div class="micro">
        <button data-p="char" title="Personaje (C)">👤</button><button data-p="bag" title="Bolsa (B)">🎒</button>
        <button data-p="log" title="Misiones (L)">📜</button><button data-p="map" title="Mapa (M)">🗺️</button></div>
      <div class="banner"></div><div class="toasts"></div><div class="err"></div>
      <div class="hurtfx"></div>
    </div>`);
    this.root.appendChild(this.hud);
    this.q = (s) => this.hud.querySelector(s);
    this.hud.querySelectorAll('.micro button').forEach((b) => b.addEventListener('click', () => this.toggle(b.dataset.p)));
    this.mmCanvas = this.q('.mm canvas');
    this.mapImg = mapImage(300);
    this.buildActionBar();
    this.quests();
    this.targetChanged();
    if (IS_TOUCH) this.initTouch();
  }

  buildActionBar() {
    const g = this.g, p = g.pl;
    const bar = this.q('.actionbar');
    const abs = p.C.abilities;
    const extra = [
      { id: 'pocion', icon: '🧪', name: 'Poción de vida', key: '7', fn: () => g.usePotion('pocion') },
      { id: 'eter', icon: '🔷', name: `Poción de ${p.C.resName.toLowerCase()}`, key: '8', fn: () => g.usePotion('eter') },
      { id: 'hearth', icon: '🏠', name: 'Piedra de hogar', key: 'H', fn: () => g.useHearth() },
    ];
    bar.innerHTML = abs.map((a, i) => `<button class="slot" data-i="${i}"><span class="ic">${a.icon}</span><em>${i + 1}</em><b class="cd"></b><s></s></button>`).join('')
      + '<span class="sep"></span>'
      + extra.map((x, i) => `<button class="slot ex" data-x="${i}"><span class="ic">${x.icon}</span><em>${x.key}</em><b class="cd"></b><small></small></button>`).join('');
    this.slots = [...bar.querySelectorAll('.slot:not(.ex)')];
    this.exSlots = [...bar.querySelectorAll('.slot.ex')];
    this.slots.forEach((b, i) => {
      b.addEventListener('click', () => this.pressSlot(i));
      this.tip(b, () => this.abilityTip(abs[i]));
    });
    this.exSlots.forEach((b, i) => {
      b.addEventListener('click', () => extra[i].fn());
      this.tip(b, () => `<b>${extra[i].name}</b><p>${extra[i].id === 'hearth' ? 'Vuelves al pueblo de Albor (4 s, no en combate). Recarga: 60 s.' : CONSUMABLES[extra[i].id].desc + ' Recarga compartida: 30 s.'}</p>`);
    });
    this.extra = extra;
  }
  abilitiesChanged() { /* las ranuras se actualizan solas en frame() */ }
  pressSlot(i) {
    const a = this.g.pl.C.abilities[i];
    if (!a) return;
    if (this.g.combat.use(a.id)) {
      const b = this.slots[i];
      b.classList.remove('press'); void b.offsetWidth; b.classList.add('press');
    }
  }
  abilityTip(a) {
    const p = this.g.pl;
    const lines = [];
    if (a.cost > 0) lines.push(`${a.cost} de ${p.C.resName}`); else if (a.cost < 0) lines.push(`Genera ${-a.cost} de ${p.C.resName}`);
    lines.push(a.cast ? `Lanzamiento: ${a.cast} s` : 'Instantáneo');
    if (a.range) lines.push(`Alcance: ${a.range} m`);
    if (a.cd) lines.push(`Recarga: ${a.cd} s`);
    const locked = p.level < a.lvl ? `<p class="bad">Se aprende en el nivel ${a.lvl}</p>` : '';
    let val = '';
    if (a.power) val = `<p class="good">≈ ${Math.round(this.g.combat.scaled(a))} ${['heal', 'hot', 'shield'].includes(a.kind) ? 'de curación/absorción' : 'de daño'}</p>`;
    return `<b>${a.icon} ${a.name}</b><p class="dim">${lines.join(' · ')}</p><p>${a.desc}</p>${val}${locked}`;
  }

  /* ========================================================= frame */
  frame(dt, t) {
    const g = this.g, p = g.pl, C = p.C;
    // jugador
    this.q('.player .lv').textContent = p.level;
    this.bar(this.q('.player .hp'), p.hp, p.maxHp);
    this.bar(this.q('.player .res'), p.res, p.maxRes);
    this.q('.player .combo').innerHTML = p.cls === 'asesino' ? Array.from({ length: 5 }, (_, i) => `<i class="${i < p.combo ? 'on' : ''}"></i>`).join('') : '';
    const bk = Object.values(p.buffs).map((b) => `${b.icon}${Math.ceil(b.until - t)}`).join(' ');
    if (bk !== this.lastBuffs) { this.lastBuffs = bk; this.q('.player .buffs').innerHTML = Object.values(p.buffs).map((b) => `<span title="${b.name}">${b.icon}<small>${Math.ceil(b.until - t)}</small></span>`).join(''); }
    // objetivo
    const tg = g.target;
    if (tg) {
      this.bar(this.q('.target .hp'), tg.hp, tg.maxHp);
      const dk = tg.dots.map((d) => d.id + Math.ceil(d.until - t)).join();
      if (dk !== this.lastDots) {
        this.lastDots = dk;
        this.q('.target .debuffs').innerHTML = tg.dots.map((d) => `<span>${C.abilities.find((a) => a.id === d.id)?.icon || '•'}<small>${Math.ceil(d.until - t)}</small></span>`).join('')
          + (t < tg.stunUntil ? '<span>💫</span>' : '') + (t < tg.slowUntil ? '<span>🐌</span>' : '') + (t < tg.rootUntil ? '<span>🧊</span>' : '');
      }
    }
    // barra de acción
    C.abilities.forEach((a, i) => {
      const b = this.slots[i];
      const locked = p.level < a.lvl;
      b.classList.toggle('locked', locked);
      const cdEnd = Math.max(p.cds[a.id] || 0, p.gcdUntil);
      const total = (p.cds[a.id] || 0) > p.gcdUntil ? a.cd : 1;
      const left = cdEnd - t;
      const cdEl = b.querySelector('.cd');
      if (left > 0 && !locked) { cdEl.style.setProperty('--k', Math.min(1, left / total)); cdEl.textContent = left > 1.5 ? Math.ceil(left) : ''; b.classList.add('oncd'); }
      else { b.classList.remove('oncd'); cdEl.textContent = ''; }
      b.classList.toggle('nores', a.cost > 0 && p.res < a.cost);
      let far = false;
      if (tg && a.range) { const d = g.combat.distTo(tg); far = d > a.range || (a.minRange && d < a.minRange); }
      b.classList.toggle('far', !!far);
    });
    const pc = (p.cds.potion || 0) - t, hc = (p.cds.hearth || 0) - t;
    [[0, pc, 30, p.potions.pocion], [1, pc, 30, p.potions.eter], [2, hc, 60, null]].forEach(([i, left, tot, n]) => {
      const b = this.exSlots[i], cdEl = b.querySelector('.cd');
      if (left > 0) { cdEl.style.setProperty('--k', left / tot); cdEl.textContent = Math.ceil(left); b.classList.add('oncd'); } else { cdEl.textContent = ''; b.classList.remove('oncd'); }
      b.querySelector('small').textContent = n === null ? '' : n;
      b.classList.toggle('nores', n === 0);
    });
    // lanzamiento
    const cb = this.q('.castbar'), cast = g.combat.cast;
    if (cast) {
      cb.classList.remove('hidden');
      cb.querySelector('i').style.width = `${Math.min(1, (t - cast.start) / (cast.end - cast.start)) * 100}%`;
      cb.querySelector('span').textContent = `${cast.ab.icon} ${cast.ab.name}`;
    } else cb.classList.add('hidden');
    // xp
    const need = xpToLevel(p.level);
    this.q('.xpbar i').style.width = p.level >= MAX_LEVEL ? '100%' : `${(p.xp / need) * 100}%`;
    this.q('.xpbar span').textContent = p.level >= MAX_LEVEL ? 'Nivel máximo' : `XP ${p.xp} / ${need}`;
    // minimapa
    this.mmT = (this.mmT || 0) - dt;
    if (this.mmT <= 0) { this.mmT = 0.1; this.drawMinimap(); }
    this.updatePlates();
    this.updatePopups(dt);
    if (this.open === 'char' && this.charDirty) this.renderChar();
  }
  bar(el, val, max) {
    el.querySelector('i').style.width = `${Math.max(0, Math.min(1, val / max)) * 100}%`;
    el.querySelector('span').textContent = `${Math.max(0, Math.ceil(val))} / ${Math.round(max)}`;
  }

  targetChanged() {
    if (!this.hud) return;
    const tg = this.g.target, el = this.q('.target');
    this.lastDots = null;
    if (!tg) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    el.querySelector('.nm span').textContent = tg.name;
    const lv = el.querySelector('.lv');
    lv.textContent = tg.boss ? '💀' : tg.lvl;
    lv.style.color = lvlColor(tg.lvl, this.g.pl.level);
    el.querySelector('.tag').textContent = tg.boss ? 'Jefe' : tg.elite ? 'Élite' : '';
    el.classList.toggle('boss', tg.boss);
    el.classList.toggle('elite', tg.elite);
  }

  /* ========================================================= minimapa */
  drawMinimap() {
    const g = this.g, ctx = this.mmCanvas.getContext('2d'), S = 180, R = S / 2;
    ctx.save();
    ctx.clearRect(0, 0, S, S);
    ctx.beginPath(); ctx.arc(R, R, R - 2, 0, Math.PI * 2); ctx.clip();
    const px = g.ppos.x, pz = g.ppos.z;
    if (g.dungeonTier === null) {
      const scale = 1.35; // px por metro
      const k = (300 / (HALF * 2));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.mapImg, (px + HALF) * k - (R / scale) * k, (pz + HALF) * k - (R / scale) * k, (S / scale) * k, (S / scale) * k, 0, 0, S, S);
      const W = (x, z) => [R + (x - px) * scale, R + (z - pz) * scale];
      for (const p of g.portals) {
        const [x, y] = W(p.pos.x, p.pos.z);
        ctx.fillStyle = DUNGEONS[p.tier].color; ctx.strokeStyle = '#000';
        ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); ctx.stroke();
      }
      ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
      for (const n of g.npcs) {
        const [x, y] = W(n.pos.x, n.pos.z);
        if (n.markerKind === '!' || n.markerKind === '?') { ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(n.markerKind, x, y + 5); ctx.fillText(n.markerKind, x, y + 5); }
        else { ctx.fillStyle = '#7dff7a'; ctx.fillRect(x - 2, y - 2, 4, 4); }
      }
      for (const m of g.mobs.list) {
        if (m.dead || m.dungeon !== null || !m.mesh.visible) continue;
        const [x, y] = W(m.pos.x, m.pos.z);
        if (x < 0 || y < 0 || x > S || y > S) continue;
        ctx.fillStyle = m === g.target ? '#ffffff' : m.state === 'chase' ? '#ff3b3b' : m.boss ? '#c58bff' : '#d8a040';
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
    } else {
      const inst = g.inst, scale = 2.2;
      ctx.fillStyle = '#0c0a14'; ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = DUNGEONS[g.dungeonTier].color + '88';
      for (const key of inst.cells) {
        const [cx, cz] = key.split(',').map(Number);
        const x = R + (inst.wx(cx) - px - CELL / 2) * scale, y = R + (inst.wz(cz) - pz - CELL / 2) * scale;
        if (x < -20 || y < -20 || x > S + 20 || y > S + 20) continue;
        ctx.fillRect(x, y, CELL * scale + 0.5, CELL * scale + 0.5);
      }
      for (const m of g.mobs.list) {
        if (m.dead || m.dungeon !== g.dungeonTier) continue;
        const x = R + (m.pos.x - px) * scale, y = R + (m.pos.z - pz) * scale;
        ctx.fillStyle = m.boss ? '#ff3bff' : m.state === 'chase' ? '#ff3b3b' : '#ffb04a';
        ctx.beginPath(); ctx.arc(x, y, m.boss ? 5 : 2.2, 0, 7); ctx.fill();
      }
      for (const p of g.exitPortals) { const x = R + (p.pos.x - px) * scale, y = R + (p.pos.z - pz) * scale; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill(); }
    }
    // jugador
    ctx.translate(R, R); ctx.rotate(-g.face + Math.PI);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5.5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5.5, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // borde
    ctx.strokeStyle = '#c9a85a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(R, R, R - 2, 0, 7); ctx.stroke();
    const zn = g.dungeonTier !== null ? DUNGEONS[g.dungeonTier].name : ZONES[zoneAt(px, pz)].name;
    this.q('.mm .zn').textContent = zn;
    this.q('.mm .co').textContent = g.dungeonTier !== null ? '' : `${Math.round(px)}, ${Math.round(pz)}`;
  }

  /* =========================================== carteles sobre enemigos */
  updatePlates() {
    const g = this.g, cam = g.camera, W = innerWidth, H = innerHeight;
    const list = [];
    for (const m of g.mobs.list) {
      if (m.dead || !m.mesh.visible || m.dungeon !== g.dungeonTier) continue;
      const d = Math.hypot(m.pos.x - g.ppos.x, m.pos.z - g.ppos.z);
      if (d > (m.boss ? 70 : 38) && m !== g.target) continue;
      list.push([d, m]);
    }
    list.sort((a, b) => a[0] - b[0]);
    const n = Math.min(list.length, 24);
    while (this.plates.length < n) {
      const el = $('<div class="plate"><span></span><div><i></i></div></div>');
      this.root.appendChild(el);
      this.plates.push(el);
    }
    for (let i = 0; i < this.plates.length; i++) {
      const el = this.plates[i];
      if (i >= n) { el.style.display = 'none'; continue; }
      const m = list[i][1];
      v.set(m.pos.x, m.pos.y + 2.4 * m.sc + (m.def.fly ? 0.3 : 0), m.pos.z).project(cam);
      if (v.z > 1) { el.style.display = 'none'; continue; }
      el.style.display = '';
      el.style.transform = `translate(${(v.x * 0.5 + 0.5) * W}px, ${(-v.y * 0.5 + 0.5) * H}px) translate(-50%,-100%)`;
      const key = m.name + m.lvl + (m === g.target) + m.state;
      if (el.dataset.k !== key) {
        el.dataset.k = key;
        el.querySelector('span').innerHTML = `<b style="color:${lvlColor(m.lvl, g.pl.level)}">${m.boss ? '💀' : m.lvl}</b> ${esc(m.name)}`;
        el.classList.toggle('sel', m === g.target);
        el.classList.toggle('boss', m.boss);
        el.classList.toggle('aggro', m.state === 'chase');
      }
      el.querySelector('i').style.width = `${(m.hp / m.maxHp) * 100}%`;
      el.querySelector('div').style.visibility = m.hp < m.maxHp || m === g.target ? 'visible' : 'hidden';
    }
  }

  /* ================================================ números flotantes */
  popup(x, y, z, text, cls = '', color) {
    if (this.popups.length > 40) this.popups.shift().el.remove();
    const el = document.createElement('div');
    el.className = `pop ${cls}`;
    if (color) el.style.color = color;
    el.textContent = text;
    this.root.appendChild(el);
    this.popups.push({ el, x: x + (Math.random() - 0.5) * 0.8, y, z, age: 0, life: cls === 'xp' ? 1.4 : 1 });
  }
  updatePopups(dt) {
    const cam = this.g.camera, W = innerWidth, H = innerHeight;
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.age += dt;
      if (p.age > p.life) { p.el.remove(); this.popups.splice(i, 1); continue; }
      v.set(p.x, p.y + p.age * 1.8, p.z).project(cam);
      if (v.z > 1) { p.el.style.display = 'none'; continue; }
      p.el.style.display = '';
      const s = p.age < 0.12 ? 1.5 - p.age * 4 : 1;
      p.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * W}px, ${(-v.y * 0.5 + 0.5) * H}px) translate(-50%,-50%) scale(${s})`;
      p.el.style.opacity = p.age > p.life * 0.6 ? 1 - (p.age - p.life * 0.6) / (p.life * 0.4) : 1;
    }
  }

  /* ================================================== mensajes */
  toast(text, big) {
    if (!this.hud) return;
    const el = $(`<div class="toast ${big ? 'big' : ''}">${text}</div>`);
    this.q('.toasts').appendChild(el);
    setTimeout(() => el.remove(), big ? 4200 : 3000);
  }
  error(msg) {
    if (!this.hud) return;
    const el = this.q('.err');
    el.textContent = msg;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  }
  log(text, kind = '') {
    if (!this.hud) return;
    const lines = this.q('.chat .lines');
    lines.appendChild($(`<p class="${kind}">${text}</p>`));
    while (lines.children.length > 40) lines.firstChild.remove();
    lines.scrollTop = lines.scrollHeight;
  }
  loot(gold, items) {
    const parts = [`<span class="gold">+${gold} 🪙</span>`].concat(items.map((it) => `<span style="color:${RARITY[it.rarity].color}">[${esc(it.name)}]</span>`));
    this.log(`Botín: ${parts.join(' ')}`, 'loot');
    if (items.some((it) => it.rarity >= 2)) this.toast(`¡Botín! <span style="color:${RARITY[items[0].rarity].color}">${esc(items[0].name)}</span>`);
    this.charDirty = true;
    if (this.open === 'bag') this.renderBag();
  }
  hurt() {
    const el = this.q('.hurtfx');
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  }
  zone(name, sub, color) {
    const el = this.q('.banner');
    el.innerHTML = `<h2 style="color:${color}">${name}</h2><p>${sub}</p>`;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  }
  quests() {
    if (!this.hud) return;
    const Q = this.g.quests;
    const act = Object.keys(this.g.pl.quests.active).map((id) => QUEST_BY_ID[id]);
    this.q('.tracker').innerHTML = act.length ? `<h4>Misiones</h4>` + act.map((q) => `<div class="${Q.complete(q) ? 'done' : ''}"><b>${q.name}</b><p>${Q.complete(q) ? `✔ Entrégala a ${NPCS[Q.turnInNpc(q)].name}` : '- ' + Q.objText(q)}</p></div>`).join('') : '';
    if (this.open === 'log') this.renderLog();
  }

  /* ===================================================== tooltips */
  tip(el, html) {
    if (IS_TOUCH) return;
    el.addEventListener('mouseenter', () => {
      this.tipEl?.remove();
      this.tipEl = $(`<div class="tooltip">${html()}</div>`);
      this.root.appendChild(this.tipEl);
      const r = el.getBoundingClientRect(), tr = this.tipEl.getBoundingClientRect();
      let x = r.left + r.width / 2 - tr.width / 2, y = r.top - tr.height - 8;
      if (y < 4) y = r.bottom + 8;
      x = Math.max(4, Math.min(innerWidth - tr.width - 4, x));
      this.tipEl.style.left = `${x}px`; this.tipEl.style.top = `${y}px`;
    });
    el.addEventListener('mouseleave', () => { this.tipEl?.remove(); this.tipEl = null; });
  }
  itemTip(it, compare = true) {
    if (!it) return '';
    const R = RARITY[it.rarity], p = this.g.pl;
    const f = 1 + (it.forge || 0) * 0.12;
    const st = Object.entries(it.stats).map(([k, v]) => `<p class="good">+${Math.round(v * f)} ${STAT_NAMES[k]}</p>`).join('');
    const eq = p.equip[it.slot];
    let cmp = '';
    if (compare && eq && eq !== it) {
      const d = itemPower(it) - itemPower(eq);
      cmp = `<p class="${d >= 0 ? 'good' : 'bad'}">${d >= 0 ? '▲ Mejor' : '▼ Peor'} que lo equipado (${esc(eq.name)})</p>`;
    }
    return `<b style="color:${R.color}">${esc(it.name)}${it.forge ? ` +${it.forge}` : ''}</b>
      <p class="dim">${SLOTS[it.slot].name} · ${R.name}</p>
      ${it.dmg ? `<p>Daño: ${Math.round(it.dmg * f)}</p>` : ''}${it.armor ? `<p>Armadura: ${Math.round(it.armor * f)}</p>` : ''}${st}
      <p class="${it.level > p.level ? 'bad' : 'dim'}">Requiere nivel ${it.level}</p>
      <p class="dim">Venta: ${sellPrice(it)} 🪙</p>${cmp}`;
  }

  /* ===================================================== paneles */
  closeAll() {
    const had = !!this.open || !!this.root.querySelector('.dialog');
    this.root.querySelectorAll('.panel.win, .dialog').forEach((n) => n.remove());
    this.open = null;
    this.tipEl?.remove();
    return had;
  }
  toggle(name) {
    if (!this.hud) return;
    const was = this.open;
    this.closeAll();
    if (was === name) return;
    this.open = name;
    if (name === 'char') this.renderChar();
    if (name === 'bag') this.renderBag();
    if (name === 'log') this.renderLog();
    if (name === 'map') this.renderMap();
  }
  win(title, cls, body) {
    this.root.querySelector(`.panel.win.${cls}`)?.remove();
    const el = $(`<div class="panel win ${cls}"><header><h3>${title}</h3><button class="x">✕</button></header><div class="body">${body}</div></div>`);
    el.querySelector('.x').addEventListener('click', () => { el.remove(); if (this.open === cls) this.open = null; });
    this.root.appendChild(el);
    return el;
  }

  renderChar() {
    this.charDirty = false;
    const p = this.g.pl, C = p.C;
    const slots = Object.keys(SLOTS).map((s) => {
      const it = p.equip[s];
      return `<div class="eq" data-s="${s}"><span class="ic">${SLOTS[s].icon}</span><div>${it ? `<b style="color:${RARITY[it.rarity].color}">${esc(it.name)}${it.forge ? ` +${it.forge}` : ''}</b><small>Nv ${it.level}</small>` : `<i>${SLOTS[s].name} vacío</i>`}</div></div>`;
    }).join('');
    const attrs = Object.entries(ATTRS).map(([k, a]) => `<div class="attr" title="${a.desc}"><span>${a.icon} ${a.name}</span><b>${p.attrs[k]}</b>${p.points ? `<button data-a="${k}">+</button>` : ''}</div>`).join('');
    const el = this.win(`${esc(p.name)} · ${C.icon} ${C.name} de nivel ${p.level}`, 'char', `
      <div class="charwrap"><div class="eqs">${slots}</div>
      <div class="stats"><img src="${heroPortrait(p.cls, true)}">
        <h4>Atributos ${p.points ? `<span class="pts">${p.points} puntos</span>` : ''}</h4>${attrs}
        <h4>Combate</h4>
        <div class="attr"><span>❤️ Vida</span><b>${p.maxHp}</b></div>
        <div class="attr"><span>🛡️ Armadura</span><b>${p.armor} (−${Math.round(p.dr * 100)}%)</b></div>
        <div class="attr"><span>⚔️ Poder de ataque</span><b>${Math.round(p.ap)}</b></div>
        <div class="attr"><span>✨ Poder de hechizo</span><b>${Math.round(p.sp)}</b></div>
        <div class="attr"><span>🎯 Crítico</span><b>${(p.crit * 100).toFixed(1)}%</b></div>
        <div class="attr"><span>🏰 Mazmorras</span><b>${p.dungeons.length}/10</b></div>
      </div></div>`);
    el.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
      if (p.points <= 0) return;
      p.alloc[b.dataset.a]++; p.points--; p.recalc(); this.renderChar(); this.g.save();
    }));
    el.querySelectorAll('.eq').forEach((d) => {
      this.tip(d, () => this.itemTip(p.equip[d.dataset.s], false) || SLOTS[d.dataset.s].name);
      d.addEventListener('click', () => { if (p.unequip(d.dataset.s)) { this.renderChar(); if (this.root.querySelector('.panel.bag')) this.renderBag(); } });
    });
  }

  renderBag(shop = false) {
    const p = this.g.pl;
    const cells = p.bag.map((it, i) => `<button class="cell ${it ? 'r' + it.rarity : ''}" data-i="${i}">${it ? `<span>${SLOTS[it.slot].icon}</span>${it.forge ? `<em>+${it.forge}</em>` : ''}${it.level > p.level ? '<s></s>' : ''}` : ''}</button>`).join('');
    const qi = Object.entries(p.questItems).filter(([, n]) => n > 0).map(([k, n]) => `<span>${QUEST_ITEMS[k].icon} ${QUEST_ITEMS[k].name} ×${n}</span>`).join('');
    const el = this.win(`🎒 Bolsa ${shop ? '· clic para vender' : '· clic para equipar'}`, 'bag', `
      <div class="grid">${cells}</div>
      <div class="cons">${Object.entries(CONSUMABLES).filter(([k]) => k !== 'piedra').map(([k, c]) => `<span>${c.icon} ${c.name} ×${p.potions[k] || 0}</span>`).join('')}</div>
      ${qi ? `<div class="qitems"><h4>Objetos de misión</h4>${qi}</div>` : ''}
      <div class="gold">🪙 ${p.gold} de oro</div>`);
    if (shop) el.classList.add('shopmode');
    el.querySelectorAll('.cell').forEach((b) => {
      const i = +b.dataset.i;
      this.tip(b, () => this.itemTip(p.bag[i]));
      b.addEventListener('click', () => {
        const it = p.bag[i];
        if (!it) return;
        this.tipEl?.remove();
        if (shop || this.shopOpen) {
          p.gold += sellPrice(it); p.bag[i] = null;
          this.log(`Vendido ${esc(it.name)} por ${sellPrice(it)} 🪙`, 'loot');
        } else {
          const r = p.equipFromBag(i);
          if (r === 'nivel') return this.error(`Necesitas nivel ${it.level}`);
        }
        this.renderBag(shop || this.shopOpen);
        if (this.root.querySelector('.panel.char')) this.renderChar();
        this.g.save();
      });
    });
    this.open = 'bag';
  }

  renderLog() {
    const Q = this.g.quests, st = this.g.pl.quests;
    const act = Object.keys(st.active).map((id) => QUEST_BY_ID[id]);
    const el = this.win(`📜 Misiones (${act.length})`, 'log', act.length ? act.map((q) => `<div class="qe">
        <h4>${q.name} <small>Nv ${q.lvl}</small></h4><p>${q.text}</p>
        <p class="${Q.complete(q) ? 'good' : 'obj'}">${Q.complete(q) ? `✔ Completada: vuelve con ${NPCS[Q.turnInNpc(q)].name}` : '▸ ' + Q.objText(q)}</p>
        <button class="btn small" data-ab="${q.id}">Abandonar</button></div>`).join('')
      : '<p class="dim">No tienes misiones. Busca personajes con un <b style="color:#ffd23a">!</b> encima.</p>' + `<p class="dim">Misiones completadas: ${st.done.length}</p>`);
    el.querySelectorAll('[data-ab]').forEach((b) => b.addEventListener('click', () => { Q.abandon(b.dataset.ab); this.quests(); this.renderLog(); }));
  }

  renderMap() {
    const g = this.g;
    const el = this.win('🗺️ Mapa de los Reinos', 'map', '<canvas width="600" height="600"></canvas><div class="legend"></div>');
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.mapImg, 0, 0, 600, 600);
    const W = (x, z) => [x + HALF, z + HALF];
    ctx.textAlign = 'center';
    for (const [k, Z] of Object.entries(ZONES)) {
      const pos = { pradera: [-40, 70], bosque: [0, -210], canon: [205, -10], invierno: [0, 235] }[k];
      const [x, y] = W(...pos);
      ctx.font = 'bold 18px Trebuchet MS'; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.fillStyle = '#fff';
      ctx.strokeText(`${Z.name}`, x, y); ctx.fillText(`${Z.name}`, x, y);
      ctx.font = 'bold 13px Trebuchet MS'; ctx.strokeText(`Nv ${Z.lvl}`, x, y + 16); ctx.fillText(`Nv ${Z.lvl}`, x, y + 16);
    }
    const [vx, vy] = W(0, 0);
    ctx.font = 'bold 15px Trebuchet MS'; ctx.strokeText('Albor', vx, vy - 12); ctx.fillStyle = '#ffd84a'; ctx.fillText('Albor', vx, vy - 12);
    for (const p of g.portals) {
      const d = DUNGEONS[p.tier], [x, y] = W(p.pos.x, p.pos.z);
      ctx.fillStyle = d.color; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#000'; ctx.font = 'bold 10px sans-serif'; ctx.fillText(p.tier + 1, x, y + 4);
      if (g.pl.dungeons.includes(p.tier)) { ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('✔', x + 10, y - 6); }
    }
    for (const n of g.npcs) {
      if (n.markerKind !== '!' && n.markerKind !== '?') continue;
      const [x, y] = W(n.pos.x, n.pos.z);
      ctx.font = 'bold 18px sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.fillStyle = '#ffd23a';
      ctx.strokeText(n.markerKind, x, y); ctx.fillText(n.markerKind, x, y);
    }
    if (g.dungeonTier === null) {
      const [x, y] = W(g.ppos.x, g.ppos.z);
      ctx.save(); ctx.translate(x, y); ctx.rotate(-g.face + Math.PI);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(7, 8); ctx.lineTo(0, 4); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    el.querySelector('.legend').innerHTML = DUNGEONS.map((d, i) => `<span style="--c:${d.color}"><i>${i + 1}</i>${d.name} <small>Nv ${d.minLevel}+</small>${g.pl.dungeons.includes(i) ? ' ✔' : ''}</span>`).join('');
  }

  /* ===================================================== diálogos NPC */
  dialog(title, body, cls = '') {
    this.root.querySelectorAll('.dialog').forEach((n) => n.remove());
    const el = $(`<div class="dialog panel ${cls}"><header><h3>${title}</h3><button class="x">✕</button></header><div class="body">${body}</div></div>`);
    el.querySelector('.x').addEventListener('click', () => { el.remove(); this.shopOpen = false; this.root.querySelector('.panel.bag.shopmode')?.remove(); });
    this.root.appendChild(el);
    return el;
  }
  npcDialog(npc) {
    const Q = this.g.quests, d = npc.d, p = this.g.pl;
    const ready = Q.ready(npc.id), avail = Q.available(npc.id), prog = Q.inProgress(npc.id), soon = Q.upcoming(npc.id);
    const qline = (q, mark, cls) => `<button class="qopt ${cls}" data-q="${q.id}"><b>${mark}</b> ${q.name} <small>Nv ${q.lvl}</small></button>`;
    const services = [];
    if (d.shop) services.push('<button class="btn" data-s="shop">🛒 Comerciar</button>');
    if (d.forge) services.push('<button class="btn" data-s="forge">🔨 Mejorar equipo</button>');
    if (d.inn) services.push('<button class="btn" data-s="inn">🛏️ Descansar (gratis)</button>');
    if (npc.id === 'orvin') services.push('<button class="btn" data-s="portals">🌀 Ver portales</button>');
    const el = this.dialog(`${d.name} <small>&lt;${d.title}&gt;</small>`, `
      <p class="greet">«${d.greet}»</p>
      ${ready.map((q) => qline(q, '?', 'ready')).join('')}${avail.map((q) => qline(q, '!', 'new')).join('')}${prog.map((q) => qline(q, '…', 'prog')).join('')}
      ${!ready.length && !avail.length && soon.length ? `<p class="dim">Vuelve cuando seas nivel ${Math.min(...soon.map((q) => q.lvl))}: tendré algo para ti.</p>` : ''}
      <div class="services">${services.join('')}</div>`);
    el.querySelectorAll('.qopt').forEach((b) => b.addEventListener('click', () => this.questDialog(npc, QUEST_BY_ID[b.dataset.q])));
    el.querySelector('[data-s="shop"]')?.addEventListener('click', () => this.shopDialog(npc));
    el.querySelector('[data-s="forge"]')?.addEventListener('click', () => this.forgeDialog(npc));
    el.querySelector('[data-s="portals"]')?.addEventListener('click', () => this.portalList(npc));
    el.querySelector('[data-s="inn"]')?.addEventListener('click', () => {
      p.hp = p.maxHp; if (p.C.res === 'mana') p.res = p.maxRes;
      this.log('Has descansado en la posada. Vida y maná al máximo.', 'info');
      this.closeAll();
    });
  }
  questDialog(npc, q) {
    const Q = this.g.quests;
    const active = Q.isActive(q.id), done = Q.complete(q);
    const rw = [`${q.xp} XP`, `${q.gold} 🪙`];
    if (q.item) rw.push(`<span style="color:${RARITY[q.item.rarity].color}">${SLOTS[q.item.slot].icon} ${SLOTS[q.item.slot].name} ${RARITY[q.item.rarity].name.toLowerCase()}</span>`);
    if (q.potions) rw.push(`${q.potions} 🧪`);
    const el = this.dialog(q.name, `
      <p>${q.text}</p>
      <p class="obj">▸ ${Q.objText(q)}</p>
      <p class="rw"><b>Recompensas:</b> ${rw.join(' · ')}</p>
      <div class="services">${done ? '<button class="btn big" data-a="turn">✔ Completar misión</button>' : active ? '<button class="btn" data-a="back">Volver</button>' : '<button class="btn big" data-a="accept">Aceptar misión</button>'}</div>`);
    el.querySelector('[data-a="accept"]')?.addEventListener('click', () => { Q.accept(q.id); this.quests(); this.npcDialog(npc); });
    el.querySelector('[data-a="turn"]')?.addEventListener('click', () => { Q.turnIn(q.id); this.quests(); this.npcDialog(npc); });
    el.querySelector('[data-a="back"]')?.addEventListener('click', () => this.npcDialog(npc));
  }
  shopDialog(npc) {
    const p = this.g.pl;
    const junk = p.bag.filter((it) => it && it.rarity === 0);
    const el = this.dialog(`🛒 ${npc.d.name}`, `
      <p class="dim">Haz clic en un objeto de tu bolsa para venderlo.</p>
      ${['pocion', 'eter'].map((k) => { const c = CONSUMABLES[k]; const price = Math.round(c.price * (1 + p.level * 0.15)); return `<div class="row"><span>${c.icon} ${c.name} <small>(tienes ${p.potions[k]})</small></span><button class="btn small" data-b="${k}" data-p="${price}">Comprar · ${price} 🪙</button></div>`; }).join('')}
      <div class="row"><span>🗑️ Vender todo lo común (${junk.length})</span><button class="btn small" data-a="junk">Vender · ${junk.reduce((s, it) => s + sellPrice(it), 0)} 🪙</button></div>
      <p class="gold">🪙 ${p.gold}</p>`, 'shop');
    el.querySelectorAll('[data-b]').forEach((b) => b.addEventListener('click', () => {
      const price = +b.dataset.p;
      if (p.gold < price) return this.error('No tienes suficiente oro');
      p.gold -= price; p.potions[b.dataset.b]++;
      this.shopDialog(npc);
    }));
    el.querySelector('[data-a="junk"]').addEventListener('click', () => {
      let g = 0;
      p.bag.forEach((it, i) => { if (it && it.rarity === 0) { g += sellPrice(it); p.bag[i] = null; } });
      p.gold += g;
      if (g) this.log(`Has vendido objetos comunes por ${g} 🪙`, 'loot');
      this.shopDialog(npc);
    });
    this.shopOpen = true;
    this.renderBag(true);
    this.g.save();
  }
  forgeDialog(npc) {
    const p = this.g.pl;
    const rows = Object.keys(SLOTS).map((s) => {
      const it = p.equip[s];
      if (!it) return `<div class="row"><span class="dim">${SLOTS[s].icon} ${SLOTS[s].name}: vacío</span></div>`;
      const max = (it.forge || 0) >= FORGE_MAX, cost = forgeCost(it);
      return `<div class="row"><span style="color:${RARITY[it.rarity].color}">${SLOTS[s].icon} ${esc(it.name)} <b>+${it.forge || 0}</b></span>
        ${max ? '<span class="good">Máximo</span>' : `<button class="btn small" data-s="${s}" data-c="${cost}">+1 · ${cost} 🪙</button>`}</div>`;
    }).join('');
    const el = this.dialog(`🔨 Forja de ${npc.d.name}`, `<p class="dim">Cada mejora aumenta un 12% todo lo que da la pieza (máximo +${FORGE_MAX}).</p>${rows}<p class="gold">🪙 ${p.gold}</p>`, 'forge');
    el.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => {
      const it = p.equip[b.dataset.s], cost = +b.dataset.c;
      if (p.gold < cost) return this.error('No tienes suficiente oro');
      p.gold -= cost; it.forge = (it.forge || 0) + 1; p.recalc();
      this.g.combat.ring(this.g.ppos, 0xffa040, 2, 0.5);
      this.log(`¡${esc(it.name)} mejorado a +${it.forge}!`, 'loot');
      this.forgeDialog(npc); this.charDirty = true;
      this.g.save();
    }));
  }
  portalList(npc) {
    const p = this.g.pl;
    this.dialog(`🌀 Portales de ${npc.d.name}`, `<p class="dim">Hay 10 portales repartidos por el mundo. Cada color es una mazmorra más difícil, una cada 8 niveles. Completa las 10 para romper el muro de hielo del sur.</p>
      ${DUNGEONS.map((d, i) => `<div class="row"><span><i class="dot" style="background:${d.color}"></i> ${d.name} <small>(${d.colorName})</small></span>
        <span>${p.dungeons.includes(i) ? '<b class="good">✔ Completada</b>' : p.level >= d.minLevel ? `<b style="color:#ffd84a">Nv ${d.minLevel}+</b>` : `<b class="bad">Nv ${d.minLevel}</b>`}</span></div>`).join('')}`, 'portals');
  }
  portalDialog(tier) {
    const d = DUNGEONS[tier], p = this.g.pl;
    const ok = p.level >= d.minLevel;
    const el = this.dialog(`<span style="color:${d.color}">🌀 ${d.name}</span>`, `
      <p>Mazmorra ${d.colorName.toLowerCase()} · niveles ${d.minLevel}-${d.maxLevel}</p>
      <p>Al fondo te espera <b style="color:${d.color}">${d.bossName}</b>.</p>
      ${p.dungeons.includes(tier) ? '<p class="good">✔ Ya la has completado (puedes repetirla para conseguir más botín).</p>' : ''}
      ${ok ? '' : `<p class="bad">Necesitas nivel ${d.minLevel} para entrar.</p>`}
      <div class="services"><button class="btn big" ${ok ? '' : 'disabled'} data-a="go">Entrar</button></div>`);
    el.querySelector('[data-a="go"]').addEventListener('click', () => { this.closeAll(); this.g.enterDungeon(tier); });
  }

  death() {
    const el = $(`<div class="dialog panel death"><h2>Has muerto</h2><p>Tu espíritu vuelve al punto de resurrección más cercano.</p><button class="btn big">Resucitar</button></div>`);
    el.querySelector('button').addEventListener('click', () => { el.remove(); this.g.respawn(); });
    this.root.appendChild(el);
  }

  /* ===================================================== táctil */
  initTouch() {
    const g = this.g;
    const pad = $(`<div class="touchpad"><div class="joy"><i></i></div>
      <div class="tbtns"><button data-t="jump">⤒</button><button data-t="tab">🎯</button><button data-t="use">✋</button></div></div>`);
    this.root.appendChild(pad);
    const joy = pad.querySelector('.joy'), knob = joy.querySelector('i');
    const R = 50;
    let jid = null, ox = 0, oy = 0;
    joy.addEventListener('pointerdown', (e) => {
      jid = e.pointerId; joy.setPointerCapture(jid);
      const r = joy.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2;
      move(e);
    });
    const move = (e) => {
      if (e.pointerId !== jid) return;
      let dx = e.clientX - ox, dy = e.clientY - oy;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      g.joy.x = dx / R; g.joy.y = dy / R;
    };
    joy.addEventListener('pointermove', move);
    const up = (e) => { if (e.pointerId !== jid) return; jid = null; g.joy.x = g.joy.y = 0; knob.style.transform = ''; };
    joy.addEventListener('pointerup', up); joy.addEventListener('pointercancel', up);
    pad.querySelector('[data-t="jump"]').addEventListener('click', () => g.jump());
    pad.querySelector('[data-t="tab"]').addEventListener('click', () => g.tabTarget());
    pad.querySelector('[data-t="use"]').addEventListener('click', () => g.interact());
    // cámara: arrastrar con un dedo sobre el mundo; toque corto = seleccionar
    const c = g.canvas;
    const touches = new Map();
    c.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') return; touches.set(e.pointerId, { x: e.clientX, y: e.clientY, m: 0 }); });
    c.addEventListener('pointermove', (e) => {
      const t = touches.get(e.pointerId); if (!t) return;
      const dx = e.clientX - t.x, dy = e.clientY - t.y; t.x = e.clientX; t.y = e.clientY; t.m += Math.abs(dx) + Math.abs(dy);
      g.rotateCam(dx * 1.2, dy * 1.2);
    });
    c.addEventListener('pointerup', (e) => { const t = touches.get(e.pointerId); touches.delete(e.pointerId); if (t && t.m < 10) g.clickAt(e.clientX, e.clientY, false); });
    c.addEventListener('pointercancel', (e) => touches.delete(e.pointerId));
  }
}
