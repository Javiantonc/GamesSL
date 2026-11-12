// Interfaz HTML encima del canvas: inicio, HUD, mejoras, jefes, final,
// números de daño y controles táctiles.
import * as THREE from 'three';
import { SPECIES, STARTERS, TYPES, stageOf, ALL_SPECIES } from './creatures.js';
import { portrait } from './portraits.js';
import { MAX_CLEVEL, WIN_TIME } from './game.js';

const $ = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const STAT_TXT = {
  hp: ['❤️', 'Vitalidad', '+20 de vida máxima'],
  speed: ['👟', 'Zapatillas rápidas', '+8% de velocidad'],
  magnet: ['🧲', 'Imán de gemas', '+30% de radio de recogida'],
  dmg: ['🔥', 'Entrenamiento', '+12% de daño del equipo'],
  regen: ['🌿', 'Hierbas curativas', '+0,6 de vida por segundo'],
  heal: ['💖', 'Descanso', 'Recupera toda la vida'],
};
const typeBadge = (t) => `<span class="type" style="--c:${TYPES[t].color}">${TYPES[t].name}</span>`;

export class UI {
  constructor(root) {
    this.root = root;
    this.modalOpen = false;
    this.isTouch = matchMedia('(pointer: coarse)').matches || location.search.includes('movil');
    this.popups = [];
    this.v = new THREE.Vector3();
  }

  /* ------------------------------------------------------------ inicio */
  showStart(onPick) {
    const el = $(`
      <div class="screen start">
        <h1>Mini Realms <b>3D</b></h1>
        <p class="sub">Liga de Criaturas · modo supervivencia</p>
        <p class="hint">Elige tu primer compañero</p>
        <div class="starters">
          ${STARTERS.map((s) => `
            <button class="card starter" data-s="${s}">
              <img src="${portrait(s, 1)}" alt="">
              <h3>${SPECIES[s].names[0]}</h3>
              ${typeBadge(SPECIES[s].type)}
              <p>${SPECIES[s].desc}</p>
            </button>`).join('')}
        </div>
        <p class="controls">${this.isTouch
          ? 'Arrastra en la mitad izquierda para moverte · botón ✦ para el ataque definitivo'
          : '<kbd>WASD</kbd> moverse · <kbd>Espacio</kbd> ataque definitivo · <kbd>P</kbd> pausa'}<br>
          Tus criaturas atacan solas. Recoge gemas, sube de nivel, captura nuevos compañeros y haz que evolucionen.<br>
          Aguanta ${WIN_TIME / 60} minutos y derrota al Guardián de la Liga.</p>
      </div>`);
    el.querySelectorAll('.starter').forEach((b) => b.addEventListener('click', () => { el.remove(); onPick(b.dataset.s); }));
    this.root.appendChild(el);
  }

  /* --------------------------------------------------------------- HUD */
  onStart(game) {
    this.game = game;
    this.root.querySelectorAll('.hud, .screen, .modal').forEach((n) => n.remove());
    this.modalOpen = false;
    this.hud = $(`
      <div class="hud">
        <div class="xpbar"><i></i><span></span></div>
        <div class="topline"><span class="time">00:00</span><span class="kills">💀 0</span></div>
        <div class="hp"><i></i><span></span></div>
        <div class="team"></div>
        <button class="ult" title="Ataque definitivo (Espacio)"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" /></svg><b>✦</b></button>
        <button class="pausebtn" title="Pausa (P)">❚❚</button>
        <div class="bossbar hidden"><span></span><i></i></div>
        <div class="toasts"></div>
        <div class="hurt"></div>
        <div class="flash"></div>
      </div>`);
    this.root.appendChild(this.hud);
    this.q = (s) => this.hud.querySelector(s);
    this.q('.ult').addEventListener('click', () => game.useUltimate());
    this.q('.pausebtn').addEventListener('click', () => game.togglePause());
    this.teamKey = '';
    if (this.isTouch) this.initJoystick(game);
  }

  frame(game, dt) {
    const p = game.p;
    if (!this.hud) return;
    this.q('.xpbar i').style.width = `${(p.xp / p.xpNext) * 100}%`;
    this.q('.xpbar span').textContent = `Nivel ${p.level}`;
    this.q('.hp i').style.width = `${Math.max(0, p.hp / p.maxHp) * 100}%`;
    this.q('.hp span').textContent = `${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`;
    const left = WIN_TIME - game.time;
    this.q('.time').textContent = left > 0 ? fmt(left) : '¡JEFE FINAL!';
    this.q('.kills').textContent = `💀 ${game.kills}`;
    const ult = this.q('.ult');
    ult.style.setProperty('--k', p.ult / 100);
    ult.classList.toggle('ready', p.ult >= 100);
    // equipo
    const key = game.team.map((c) => c.species + c.lvl).join();
    if (key !== this.teamKey) {
      this.teamKey = key;
      this.q('.team').innerHTML = game.team.map((c) => `
        <div class="mate"><img src="${portrait(c.species, stageOf(c.lvl))}"><b>${c.lvl >= MAX_CLEVEL ? 'MÁX' : 'Nv ' + c.lvl}</b>
        <span>${SPECIES[c.species].names[stageOf(c.lvl) - 1]}</span></div>`).join('');
    }
    // jefe
    const bb = this.q('.bossbar');
    if (game.boss && !game.boss.dead) {
      bb.classList.remove('hidden');
      bb.querySelector('i').style.width = `${(game.boss.hp / game.boss.maxHp) * 100}%`;
    } else bb.classList.add('hidden');
    this.updatePopups(game, dt);
  }

  /* ----------------------------------------------- números de daño */
  popup(x, y, z, n, cls, type) {
    if (this.popups.length > 45) { const o = this.popups.shift(); o.el.remove(); }
    const el = document.createElement('div');
    el.className = `pop ${cls}`;
    el.style.color = TYPES[type]?.color || '#fff';
    el.textContent = cls === 'eff' ? `${n}!` : n;
    this.root.appendChild(el);
    this.popups.push({ el, x: x + (Math.random() - 0.5) * 0.6, y, z, age: 0 });
  }
  updatePopups(game, dt) {
    const cam = game.camera, w = innerWidth, h = innerHeight;
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.age += dt;
      if (p.age > 0.7) { p.el.remove(); this.popups.splice(i, 1); continue; }
      this.v.set(p.x, p.y + p.age * 1.6, p.z).project(cam);
      p.el.style.transform = `translate(${(this.v.x * 0.5 + 0.5) * w}px, ${(-this.v.y * 0.5 + 0.5) * h}px) translate(-50%,-50%) scale(${p.age < 0.1 ? 1.4 : 1})`;
      p.el.style.opacity = p.age > 0.45 ? 1 - (p.age - 0.45) / 0.25 : 1;
    }
  }

  toast(text, big = false) {
    if (!this.hud) return;
    const el = $(`<div class="toast ${big ? 'big' : ''}">${text}</div>`);
    this.q('.toasts').appendChild(el);
    setTimeout(() => el.remove(), big ? 3200 : 2400);
  }
  hurt() {
    const el = this.q('.hurt');
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  }
  ultFlash() {
    const el = this.q('.flash');
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  }
  bossIntro(e) {
    this.q('.bossbar span').textContent = e.name;
    this.toast(`👑 ¡Aparece ${e.name}!`, true);
  }
  bossDown(e) {
    if (e.boss === 1) this.toast(`🏆 ¡Has derrotado a ${e.name}! +30% de vida`, true);
  }
  showPause(on) {
    this.root.querySelector('.modal.pause')?.remove();
    if (!on) return;
    const el = $(`<div class="modal pause"><div class="box"><h2>Pausa</h2><button class="btn">Continuar</button></div></div>`);
    el.querySelector('button').addEventListener('click', () => this.game.togglePause());
    this.root.appendChild(el);
  }

  /* --------------------------------------------------- subir de nivel */
  showLevelUp(opts, cb) {
    this.modalOpen = true;
    const card = (o, i) => {
      if (o.kind === 'stat') {
        const [ic, name, desc] = STAT_TXT[o.id];
        return `<button class="card up" data-i="${i}"><div class="ico">${ic}</div><h3>${name}</h3><p>${desc}</p></button>`;
      }
      const sp = SPECIES[o.species];
      if (o.kind === 'new') {
        return `<button class="card up new" data-i="${i}"><div class="tag">NUEVO</div><img src="${portrait(o.species, 1)}">
          <h3>Capturar ${sp.names[0]}</h3>${typeBadge(sp.type)}<p>${sp.desc}</p></button>`;
      }
      const nl = o.c.lvl + 1, st = stageOf(nl);
      return `<button class="card up ${o.evolves ? 'evo' : ''}" data-i="${i}">${o.evolves ? '<div class="tag">EVOLUCIÓN</div>' : ''}
        <img src="${portrait(o.species, st)}">
        <h3>${o.evolves ? `${sp.names[st - 2]} → ${sp.names[st - 1]}` : `${sp.names[st - 1]} Nv ${nl}`}</h3>${typeBadge(sp.type)}
        <p>${o.evolves ? 'Evoluciona: más grande, más fuerte y con nuevos poderes.' : upgradeText(o.species, nl)}</p></button>`;
    };
    const el = $(`<div class="modal levelup"><div class="box wide"><h2>¡Nivel ${this.game.p.level}!</h2><p class="hint">Elige una mejora</p>
      <div class="cards">${opts.map(card).join('')}</div></div></div>`);
    el.querySelectorAll('.card').forEach((b) => b.addEventListener('click', () => {
      el.remove();
      this.modalOpen = false;
      this.game.clock.getDelta();
      cb(opts[+b.dataset.i]);
    }));
    this.root.appendChild(el);
  }

  /* ------------------------------------------------------------ final */
  showEnd(win, game) {
    this.modalOpen = true;
    const el = $(`<div class="modal end ${win ? 'win' : 'lose'}"><div class="box">
      <h2>${win ? '🏆 ¡Campeón de la Liga!' : 'Tu equipo se ha debilitado…'}</h2>
      <p>Tiempo: <b>${fmt(game.time)}</b> · Derrotados: <b>${game.kills}</b> · Nivel: <b>${game.p.level}</b></p>
      <div class="team-end">${game.team.map((c) => `<div><img src="${portrait(c.species, stageOf(c.lvl))}"><span>${SPECIES[c.species].names[stageOf(c.lvl) - 1]} Nv ${c.lvl}</span></div>`).join('')}</div>
      <button class="btn">Jugar otra vez</button></div></div>`);
    el.querySelector('button').addEventListener('click', () => {
      el.remove();
      this.modalOpen = false;
      this.root.querySelector('.hud')?.remove();
      this.hud = null;
      this.showStart((s) => game.start(s));
    });
    this.root.appendChild(el);
  }

  /* ----------------------------------------------------------- táctil */
  initJoystick(game) {
    if (this.joyEl) return;
    const base = $(`<div class="joy"><i></i></div>`);
    this.root.appendChild(base);
    this.joyEl = base;
    const knob = base.querySelector('i');
    const R = 55;
    let id = null, ox = 0, oy = 0;
    addEventListener('pointerdown', (e) => {
      if (id !== null || e.clientX > innerWidth * 0.55 || e.target.closest('button, .card')) return;
      id = e.pointerId; ox = e.clientX; oy = e.clientY;
      base.style.left = `${ox}px`; base.style.top = `${oy}px`;
      base.classList.add('on');
    });
    addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      let dx = e.clientX - ox, dy = e.clientY - oy;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      game.joy.x = dx / R; game.joy.z = dy / R;
    });
    const up = (e) => {
      if (e.pointerId !== id) return;
      id = null; game.joy.x = game.joy.z = 0;
      knob.style.transform = '';
      base.classList.remove('on');
    };
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  }
}

function upgradeText(species, lvl) {
  const k = SPECIES[species].attack.kind;
  const extra = {
    bolt: lvl >= 4 ? 'Los chorros atraviesan enemigos.' : 'Dispara más rápido.',
    lob: 'Explosiones más grandes.',
    orbit: lvl % 2 === 1 ? '+1 hoja girando.' : 'Hojas más afiladas.',
    chain: lvl % 2 === 1 ? 'El rayo salta a 1 enemigo más.' : 'Rayos más potentes.',
    nova: 'Onda helada más amplia.',
    quake: 'Terremoto más amplio.',
  }[k];
  return `+30% de daño. ${extra}`;
}
export { ALL_SPECIES };
