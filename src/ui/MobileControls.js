import { el } from './dom.js';
import { ABILITIES } from '../data/abilities.js';
import { bus } from '../core/EventBus.js';

// Posiciones de los botones de habilidad en arco alrededor del botón de ataque
// (ángulo en grados: 180 = izquierda, 270 = arriba; radio en px)
const ARC = [
  [180, 118], [210, 118], [240, 118], [270, 118],     // anillo interior
  [188, 190], [211, 190], [234, 190], [257, 190],     // anillo exterior
];
const SLOT_OF_BUTTON = [1, 2, 3, 4, 5, 6, 7, 8];   // botón i -> ranura de la barra de acción

/**
 * Controles táctiles (solo en móvil):
 *  - Joystick a la izquierda para moverse.
 *  - A la derecha: botón grande de ataque + 8 botones de habilidad en arco,
 *    con barrido de reutilización, rango y aviso de falta de maná.
 *  - Botones 🎯 (siguiente objetivo) y ✋ (usar portal / talar).
 *  - Para colocar una habilidad: tócala en la app Habilidades de la tablet
 *    y después toca un botón del arco.
 */
export class MobileControls {
  constructor(ui) {
    this.ui = ui;
    this.state = ui.state;
    this.scene = ui.scene;
    this.vec = { x: 0, y: 0 };
    this.assigning = null;

    // ---------------- Joystick ----------------
    this.joy = el('div', 'joystick', '<div class="joy-base"><div class="joy-knob"></div></div>');
    ui.root.append(this.joy);
    this.knob = this.joy.querySelector('.joy-knob');
    this.base = this.joy.querySelector('.joy-base');
    let pid = null;
    const R = 52;
    const move = (e) => {
      const r = this.base.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
      this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const m = Math.min(1, d / R);
      this.vec = m < 0.18 ? { x: 0, y: 0 } : { x: dx / R, y: dy / R };
    };
    const end = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      this.vec = { x: 0, y: 0 };
      this.knob.style.transform = '';
      this.joy.classList.remove('active');
    };
    this.joy.addEventListener('pointerdown', (e) => {
      pid = e.pointerId;
      this.joy.setPointerCapture(e.pointerId);
      this.joy.classList.add('active');
      move(e);
    });
    this.joy.addEventListener('pointermove', (e) => { if (e.pointerId === pid) move(e); });
    this.joy.addEventListener('pointerup', end);
    this.joy.addEventListener('pointercancel', end);

    // ---------------- Botones de la derecha ----------------
    this.cluster = el('div', 'skill-cluster');
    ui.root.append(this.cluster);

    this.attackBtn = el('button', 'sk-btn sk-attack', '<span class="icon">⚔️</span><div class="cd"></div>');
    this.attackBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); this.press(this.attackBtn); this.attack(); });
    this.cluster.append(this.attackBtn);

    this.buttons = ARC.map(([deg, r], i) => {
      const b = el('button', 'sk-btn sk-skill', '<span class="icon"></span><span class="rank-badge"></span><div class="cd"></div><span class="cdtext"></span>');
      const a = (deg * Math.PI) / 180;
      b.style.left = `${Math.cos(a) * r}px`;
      b.style.top = `${Math.sin(a) * r}px`;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.tapSkill(i); });
      this.cluster.append(b);
      return { node: b, icon: b.querySelector('.icon'), rank: b.querySelector('.rank-badge'), cd: b.querySelector('.cd'), txt: b.querySelector('.cdtext'), last: '' };
    });

    const util = (cls, icon, title, fn) => {
      const b = el('button', `sk-btn sk-util ${cls}`, `<span class="icon">${icon}</span>`);
      b.title = title;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.press(b); fn(); });
      this.cluster.append(b);
      return b;
    };
    const place = (b, deg, r) => { const an = (deg * Math.PI) / 180; b.style.left = `${Math.cos(an) * r}px`; b.style.top = `${Math.sin(an) * r}px`; };
    place(util('sk-target', '🎯', 'Siguiente objetivo', () => this.scene.cycleTarget()), 297, 117);
    place(util('sk-use', '✋', 'Hablar / usar portal / talar', () => {
      this.scene.interact();
    }), 282, 192);

    this.hint = el('div', 'assign-hint hidden');
    ui.root.append(this.hint);

    bus.on('actionbar:changed', () => this.render());
    bus.on('ability:cast', (id) => this.buttons.forEach((b, i) => {
      if (this.state.actionBar.slots[SLOT_OF_BUTTON[i]] === id) this.press(b.node);
    }));
    this.render();
  }

  press(node) {
    node.classList.remove('pressed'); void node.offsetWidth; node.classList.add('pressed');
  }

  /** Ataque básico: si no hay objetivo, apunta al enemigo más cercano. */
  attack() {
    const s = this.scene;
    if (!s.getValidTarget()) s.autoTarget(320);
    s.basicAttack();
  }

  tapSkill(i) {
    const slot = SLOT_OF_BUTTON[i];
    if (this.assigning) {
      const bar = this.state.actionBar;
      const prev = bar.slots.indexOf(this.assigning);
      if (prev >= 0 && prev !== slot) bar.slots[prev] = null;      // no duplicar
      bar.assign(slot, this.assigning);
      bus.emit('ui:toast', `${ABILITIES[this.assigning].icon} ${ABILITIES[this.assigning].name} colocada`, '#ffe14d');
      this.endAssign();
      return;
    }
    const id = this.state.actionBar.slots[slot];
    if (!id) { bus.emit('ui:error', 'Botón vacío: coloca una habilidad desde la tablet (✨ Habilidades)'); return; }
    this.press(this.buttons[i].node);
    if (!this.scene.getValidTarget() && ABILITIES[id].needsTarget) this.scene.autoTarget(ABILITIES[id].range || 320);
    this.scene.combat.tryCast(id);
  }

  /** Modo colocar: la siguiente pulsación en un botón del arco recibe la habilidad. */
  beginAssign(id) {
    this.assigning = id;
    this.cluster.classList.add('assigning');
    this.hint.textContent = `Toca un botón para colocar ${ABILITIES[id].icon} ${ABILITIES[id].name}`;
    this.hint.classList.remove('hidden');
    clearTimeout(this.assignTimer);
    this.assignTimer = setTimeout(() => this.endAssign(), 9000);
    this.render();
  }

  endAssign() {
    this.assigning = null;
    this.cluster.classList.remove('assigning');
    this.hint.classList.add('hidden');
    this.render();
  }

  render() {
    this.buttons.forEach((b, i) => {
      const id = this.state.actionBar.slots[SLOT_OF_BUTTON[i]];
      b.icon.textContent = id ? ABILITIES[id].icon : (this.assigning ? '＋' : '');
      b.node.classList.toggle('empty', !id);
      const r = id ? this.state.rank(id) : 1;
      b.rank.textContent = r > 1 ? r : '';
      b.rank.style.display = r > 1 ? '' : 'none';
      b.last = '';
    });
  }

  /** Cada frame: barridos de reutilización (igual que la barra de escritorio). */
  update(now) {
    const st = this.state;
    const atk = st.cooldownInfo('strike', now);
    const af = atk.remaining > 0 ? atk.remaining / atk.total : 0;
    const ak = Math.round(af * 60);
    if (ak !== this.lastAtk) {
      this.lastAtk = ak;
      this.attackBtn.querySelector('.cd').style.background = af > 0 ? `conic-gradient(transparent ${(1 - af) * 360}deg, rgba(8,10,28,0.6) 0)` : '';
    }
    this.buttons.forEach((b, i) => {
      const id = st.actionBar.slots[SLOT_OF_BUTTON[i]];
      if (!id) { if (b.last) { b.cd.style.background = ''; b.txt.textContent = ''; b.last = ''; } return; }
      const { remaining, total, gcd } = st.cooldownInfo(id, now);
      const noMana = st.mana < ABILITIES[id].mana;
      const frac = remaining > 0 ? remaining / total : 0;
      const key = `${Math.round(frac * 90)}|${noMana}|${Math.ceil(remaining / 100)}`;
      if (key === b.last) return;
      b.last = key;
      b.cd.style.background = frac > 0 ? `conic-gradient(transparent ${(1 - frac) * 360}deg, rgba(8,10,28,0.72) 0)` : '';
      b.txt.textContent = !gcd && remaining > 150 ? (remaining > 10000 ? Math.ceil(remaining / 1000) : (remaining / 1000).toFixed(1)) : '';
      b.node.classList.toggle('nomana', noMana);
    });
  }
}
