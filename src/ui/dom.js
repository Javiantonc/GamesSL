import { RARITIES } from '../data/items.js';

export function el(tag, cls = '', html = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

// ---------- Arrastrar y soltar (HTML5 Drag & Drop) ----------
// Payloads: {src:'bag', index} | {src:'equip', slot} | {src:'spell', id} | {src:'bar', index}
const MIME = 'application/x-mini-realms';
let current = null;

export function makeDraggable(node, getPayload) {
  node.draggable = true;
  node.addEventListener('dragstart', (e) => {
    const payload = getPayload();
    if (!payload) { e.preventDefault(); return; }
    current = payload;
    e.dataTransfer.setData(MIME, JSON.stringify(payload));
    e.dataTransfer.setData('text/plain', '');
    e.dataTransfer.effectAllowed = 'move';
    node.classList.add('dragging');
  });
  node.addEventListener('dragend', (e) => {
    node.classList.remove('dragging');
    node.dispatchEvent(new CustomEvent('dragfinished', { detail: { payload: current, dropped: e.dataTransfer.dropEffect !== 'none' } }));
    current = null;
  });
}

/** accept(payload) -> bool ; onDrop(payload) */
export function makeDropTarget(node, accept, onDrop) {
  node.addEventListener('dragover', (e) => {
    if (current && accept(current)) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; node.classList.add('drop-ok'); }
  });
  node.addEventListener('dragleave', () => node.classList.remove('drop-ok'));
  node.addEventListener('drop', (e) => {
    e.preventDefault();
    node.classList.remove('drop-ok');
    let p = current;
    try { p = JSON.parse(e.dataTransfer.getData(MIME)) || current; } catch { /* usa current */ }
    if (p && accept(p)) onDrop(p);
  });
}

/** Ranura cuadrada de objeto con icono, cantidad y borde del color de rareza. */
export function itemSlotEl(item, extraCls = '') {
  const s = el('div', `slot ${extraCls}`);
  if (item) {
    s.style.setProperty('--rc', RARITIES[item.rarity].color);
    s.classList.add('filled', `r-${item.rarity}`);
    s.append(el('span', 'icon', item.icon));
    if (item.qty > 1) s.append(el('span', 'qty', String(item.qty)));
  }
  return s;
}
