'use strict';
/* =========================================================================
   EQUIPO (armaduras y joyas), al estilo de los MMO clásicos:
   - Tipos de armadura: tela (mago, brujo) · cuero (pícaro) ·
     malla (guerrero, paladín) · placas (guerrero y paladín desde nivel 10).
     Cada clase puede llevar su tipo o cualquiera más ligero.
   - Ranuras: cabeza, cuello, hombros, espalda, pecho, muñecas, manos,
     cintura, piernas, pies, dedo y abalorio.
   - Atributos: armadura (reduce el daño), aguante (vida) y el atributo
     principal de la clase (fuerza, agilidad o intelecto: más daño).
   ========================================================================= */
const ARMOR_TYPES = ['tela', 'cuero', 'malla', 'placas'];
const ARMOR_NAME = { tela: 'Tela', cuero: 'Cuero', malla: 'Malla', placas: 'Placas' };
const ARMOR_MULT = { tela: 1, cuero: 1.8, malla: 2.8, placas: 4 };
const MAIN_STAT = { picaro: 'Agilidad', mago: 'Intelecto', brujo: 'Intelecto', paladin: 'Fuerza', guerrero: 'Fuerza' };
const SLOTS = {
  cabeza:   { name: 'Cabeza', icon: '⛑️', arm: 0.8, w: 1, base: { tela: 'Capucha', cuero: 'Capucha', malla: 'Yelmo', placas: 'Casco' } },
  cuello:   { name: 'Cuello', icon: '📿', arm: 0, w: 0.6, jewel: ['Collar', 'Colgante', 'Gargantilla', 'Amuleto'] },
  hombros:  { name: 'Hombros', icon: '🛡️', arm: 0.7, w: 0.8, base: { tela: 'Hombreras', cuero: 'Hombreras', malla: 'Hombreras', placas: 'Espaldares' } },
  espalda:  { name: 'Espalda', icon: '🧣', arm: 0.35, w: 0.6, cape: ['Capa', 'Manto', 'Capa larga', 'Manto de viaje'] },
  pecho:    { name: 'Pecho', icon: '👕', arm: 1, w: 1, base: { tela: 'Túnica', cuero: 'Jubón', malla: 'Cota', placas: 'Coraza' } },
  munecas:  { name: 'Muñecas', icon: '⌚', arm: 0.45, w: 0.55, base: { tela: 'Brazaletes', cuero: 'Brazaletes', malla: 'Brazales', placas: 'Brazales' } },
  manos:    { name: 'Manos', icon: '🧤', arm: 0.6, w: 0.75, base: { tela: 'Guantes', cuero: 'Guantes', malla: 'Guantes', placas: 'Guanteletes' } },
  cintura:  { name: 'Cintura', icon: '🎗️', arm: 0.5, w: 0.7, base: { tela: 'Faja', cuero: 'Cinturón', malla: 'Cinturón', placas: 'Cinturón' } },
  piernas:  { name: 'Piernas', icon: '👖', arm: 0.9, w: 1, base: { tela: 'Pantalones', cuero: 'Pantalones', malla: 'Calzas', placas: 'Grebas' } },
  pies:     { name: 'Pies', icon: '👢', arm: 0.7, w: 0.75, base: { tela: 'Sandalias', cuero: 'Botas', malla: 'Botas', placas: 'Escarpes' } },
  dedo:     { name: 'Dedo', icon: '💍', arm: 0, w: 0.55, jewel: ['Anillo', 'Sortija', 'Sello', 'Aro'] },
  abalorio: { name: 'Abalorio', icon: '🔮', arm: 0, w: 0.7, jewel: ['Talismán', 'Ídolo', 'Piedra de poder', 'Reliquia'] },
};
const SLOT_ORDER = Object.keys(SLOTS);
// Materiales por nivel del objeto (1-5)
const MAT_NAMES = {
  tela: ['de lino', 'de lana', 'de seda', 'de tejido mágico', 'de paño rúnico'],
  cuero: ['de cuero ligero', 'de cuero curtido', 'de cuero grueso', 'de cuero endurecido', 'de cuero de dragón'],
  malla: ['de anillas', 'de malla de bronce', 'de malla de hierro', 'de malla de mitrilo', 'de malla de torio'],
  placas: ['de placas de hierro', 'de placas de acero', 'de placas de mitrilo', 'de placas de torio', 'de placas rúnicas'],
  joya: ['de cobre', 'de plata', 'de oro', 'de zafiro', 'de diamante'],
};
const PALETTE = {
  tela: ['#7a5aa8', '#3d5a8a', '#a8452f', '#d8d0e8', '#3f7a7a', '#6b4a7a'],
  cuero: ['#8a5a32', '#6b4226', '#5a4a3a', '#7a6040', '#4a3a30'],
  malla: ['#8f959e', '#7a8a9a', '#9a8a6a', '#6e7a88'],
  placas: ['#b0b4c0', '#a8b0c8', '#c0a870', '#9aa4b4'],
};
// Sufijos: reparto entre atributo principal y aguante
const SUFFIX = [['del Oso', 0.5], ['del Lobo', 1], ['de la Ballena', 0], ['del Tigre', 0.7], ['del Halcón', 0.8], ['del Jabalí', 0.35]];
const LEGEND_SUFFIX = ['del Titán Dormido', 'de los Mil Soles', 'del Dragón Eterno', 'de la Luna Rota'];
const tierOfLvl = (l) => clamp(Math.ceil(l / 4), 1, 5);
const maxArmor = (cls, lvl) => (cls === 'guerrero' || cls === 'paladin' ? (lvl >= 10 ? 'placas' : 'malla') : cls === 'picaro' ? 'cuero' : 'tela');
const mainArmor = maxArmor;
function canWear(it, h = hero) {
  if (!it.type || it.slot === 'espalda') return true;
  return ARMOR_TYPES.indexOf(it.type) <= ARMOR_TYPES.indexOf(maxArmor(h.cls, h.lvl));
}
const pick = (a) => a[(Math.random() * a.length) | 0];
/** Crea una pieza de equipo. */
function makeGear(cls, lvl, r = rollRarity(), slot = pick(SLOT_ORDER), type) {
  const S = SLOTS[slot], t = tierOfLvl(lvl), R = RARITY[r];
  if (!type) type = S.base ? (Math.random() < 0.85 ? mainArmor(cls, lvl) : pick(ARMOR_TYPES.slice(0, ARMOR_TYPES.indexOf(maxArmor(cls, lvl)) + 1))) : slot === 'espalda' ? 'tela' : null;
  let base, mat;
  if (S.base) { base = S.base[type]; mat = MAT_NAMES[type][t - 1]; }
  else if (S.cape) { base = pick(S.cape); mat = MAT_NAMES.tela[t - 1]; }
  else { base = pick(S.jewel); mat = MAT_NAMES.joya[t - 1]; }
  const budget = (1 + lvl * 0.6) * R.mult * S.w;
  const [suf, k] = pick(SUFFIX);
  const pts = r === 0 ? (S.jewel ? budget * 0.5 : 0) : budget;
  const poder = Math.round(pts * k * (S.jewel ? 1.2 : 1)), vida = Math.round(pts * (1 - k) * 1.5);
  const arm = Math.round(S.arm * (ARMOR_MULT[type] || 1) * (lvl + 3) * (1 + r * 0.15));
  const name = r === 4 ? `${base} ${pick(LEGEND_SUFFIX)}` : `${base} ${mat}${r > 0 ? ' ' + suf : ''}`;
  const color = type ? pick(PALETTE[type]) : pick(['#c9a24a', '#d8e0ea', '#e0605a', '#5aa0ff', '#7ad85a']);
  return { id: wid++, slot, type, tier: t, rarity: r, lvl, name, arm: S.arm ? arm : 0, poder, vida, color };
}
const gearScore = (it) => (it ? it.arm * 0.25 + it.poder + it.vida * 0.25 : 0);
const gearValue = (it) => Math.round((it.arm * 0.8 + it.poder * 3 + it.vida * 0.7 + 6 + it.lvl * 2) * (1 + it.rarity * 0.7));
function gearStats(it) {
  const out = [];
  if (it.arm) out.push(`${it.arm} armadura`);
  if (it.poder) out.push(`+${it.poder} ${MAIN_STAT[hero.cls]}`);
  if (it.vida) out.push(`+${it.vida} Vida`);
  return out.join(' · ');
}
const gearDesc = (it) => `${it.type ? ARMOR_NAME[it.type] + ' · ' : ''}${SLOTS[it.slot].name} · Nv ${it.lvl}`;

/* --------------------------------------------------------------- iconos */
const gIconCache = new Map();
function gearIcon(it) {
  const key = it.slot + it.type + it.color + it.rarity;
  if (gIconCache.has(key)) return gIconCache.get(key);
  const c = document.createElement('canvas'); c.width = 96; c.height = 96;
  X = c.getContext('2d'); X.lineJoin = 'round'; X.lineCap = 'round';
  const col = it.color, gem = RARITY[it.rarity].color, metal = it.type === 'placas' || it.type === 'malla';
  X.translate(48, 48); X.scale(1.6, 1.6);
  const trim = metal ? '#c9a24a' : dk(col);
  switch (it.slot) {
    case 'cabeza':
      if (metal) { toon((k) => { k.moveTo(-18, 10); k.quadraticCurveTo(-20, -20, 0, -20); k.quadraticCurveTo(20, -20, 18, 10); k.closePath(); }, col); toon(RR(-14, -2, 28, 6, 2), OUT, { shade: false }); stroke([[0, -20], [0, -4]], trim, 3); }
      else { toon((k) => { k.moveTo(-20, 18); k.quadraticCurveTo(-22, -16, 0, -22); k.quadraticCurveTo(22, -16, 20, 18); k.quadraticCurveTo(0, 10, -20, 18); k.closePath(); }, col); toon(E(0, 2, 11, 12), '#2a2024', { shade: false }); }
      break;
    case 'hombros': for (const s of [-1, 1]) { toon(E(s * 13, 0, 13, 10), col); stroke([[s * 4, 4], [s * 24, 4]], trim, 2.4); dot(s * 13, -3, 2.4, gem); } break;
    case 'espalda': toon((k) => { k.moveTo(-12, -20); k.lineTo(12, -20); k.lineTo(20, 20); k.quadraticCurveTo(0, 26, -20, 20); k.closePath(); }, col); toon(RR(-14, -22, 28, 6, 3), trim, { shade: false }); stroke([[-4, -14], [-6, 18]], dk(col), 1.6); break;
    case 'pecho':
      toon(PL([[-12, -20], [12, -20], [22, -12], [18, 0], [14, -4], [14, 20], [-14, 20], [-14, -4], [-18, 0], [-22, -12]]), col);
      toon(PL([[-6, -20], [6, -20], [0, -10]]), metal ? '#5a5460' : '#f0e6d0', { shade: false, lw: 2 });
      if (it.type === 'malla') for (let y = -6; y < 18; y += 4) for (let x = -11; x < 12; x += 4) dot(x + ((y / 4) % 2) * 2, y, 0.9, '#5a6068');
      toon(RR(-14, 10, 28, 5, 2), trim, { shade: false, lw: 2 });
      break;
    case 'munecas': for (const s of [-1, 1]) { toon(RR(s * 11 - 8, -14, 16, 28, 4), col); stroke([[s * 11 - 7, -6], [s * 11 + 7, -6]], trim, 2.4); stroke([[s * 11 - 7, 6], [s * 11 + 7, 6]], trim, 2.4); } break;
    case 'manos': toon((k) => { k.moveTo(-12, 20); k.lineTo(-12, -4); k.quadraticCurveTo(-14, -10, -8, -10); k.lineTo(-8, -20); k.quadraticCurveTo(-4, -24, 0, -20); k.lineTo(0, -22); k.quadraticCurveTo(4, -26, 8, -20); k.lineTo(8, -14); k.quadraticCurveTo(14, -16, 13, -8); k.lineTo(12, 20); k.closePath(); }, col); toon(RR(-14, 12, 28, 9, 3), trim, { shade: false, lw: 2 }); break;
    case 'cintura': toon(RR(-24, -6, 48, 12, 4), col); toon(RR(-7, -9, 14, 18, 3), '#c9a24a', { shade: false }); toon(RR(-3, -4, 6, 8, 1), OUT, { shade: false, line: false }); break;
    case 'piernas': toon(PL([[-16, -20], [16, -20], [18, 20], [4, 20], [0, -4], [-4, 20], [-18, 20]]), col); toon(RR(-16, -22, 32, 6, 2), trim, { shade: false, lw: 2 }); break;
    case 'pies': toon((k) => { k.moveTo(-10, -20); k.lineTo(6, -20); k.lineTo(6, 6); k.quadraticCurveTo(22, 6, 22, 16); k.lineTo(22, 20); k.lineTo(-12, 20); k.closePath(); }, col); toon(RR(-12, 16, 35, 5, 2), '#3a2a24', { shade: false, lw: 2 }); stroke([[-10, -12], [6, -12]], trim, 2.4); break;
    case 'cuello': X.beginPath(); X.arc(0, -8, 18, 0.15 * Math.PI, 0.85 * Math.PI); X.strokeStyle = OUT; X.lineWidth = 6; X.stroke(); X.strokeStyle = '#d8c070'; X.lineWidth = 3; X.stroke(); toon(PL([[0, 6], [8, 14], [0, 24], [-8, 14]]), gem); dot(-2, 12, 2, '#fff'); break;
    case 'dedo': X.beginPath(); X.ellipse(0, 6, 15, 12, 0, 0, 7); X.strokeStyle = OUT; X.lineWidth = 9; X.stroke(); X.strokeStyle = col; X.lineWidth = 5; X.stroke(); toon(E(0, -8, 8, 7), gem); dot(-2, -10, 2, '#fff'); break;
    default: toon(PL([[0, -22], [14, -4], [8, 20], [-8, 20], [-14, -4]]), gem, { sx: -4, sy: -2 }); stroke([[0, -22], [0, 20]], '#ffffff88', 2); dot(-4, -6, 2.6, '#fff');
  }
  gIconCache.set(key, c);
  return c;
}
const itemIcon = (it) => (it.slot ? gearIcon(it) : weaponIcon(it));

/* --------------------------------------------------------- héroe */
function recalc() {
  const G = Object.values(hero.gear || {}).filter(Boolean);
  hero.armor = G.reduce((a, g) => a + g.arm, 0);
  hero.poder = G.reduce((a, g) => a + g.poder, 0);
  hero.vidaG = G.reduce((a, g) => a + g.vida, 0);
  const fed = hero.buff && hero.buff.until > T ? hero.buff.t * 10 : 0;
  const old = hero.max || 1;
  hero.max = HP[hero.cls] + (hero.lvl - 1) * 12 + hero.vidaG + fed;
  if (hero.hp != null) hero.hp = Math.min(hero.max, hero.hp * (hero.max / old) || hero.max);
}
const armorDR = () => Math.min(0.6, hero.armor / (hero.armor + 100 + hero.lvl * 45));
const powerMul = () => (1 + hero.poder * 0.004) * (hero.buff && hero.buff.until > T ? 1 + (4 + 2 * hero.buff.t) / 100 : 1);
const WEAR_OF = { tela: 'robe', cuero: 'leather', malla: 'mail', placas: 'plate' };
function refreshLook() {
  const L = heroLook(opt, hero.weapon), G = hero.gear;
  if (G.pecho) { L.outfit = G.pecho.color; L.wear = hero.cls === 'brujo' && G.pecho.type === 'tela' ? 'darkrobe' : WEAR_OF[G.pecho.type]; }
  if (G.cabeza) { L.hat = { tela: hero.cls === 'mago' ? 'wizard' : 'hood', cuero: 'hood', malla: 'coif', placas: 'helm' }[G.cabeza.type]; L.hatC = G.cabeza.color; }
  if (G.espalda) { L.cape = G.espalda.color; L.capeR = G.espalda.rarity; }
  if (G.pecho) L.chestR = G.pecho.rarity; if (G.cabeza) L.helmR = G.cabeza.rarity; if (G.hombros) L.shR = G.hombros.rarity;
  if (G.manos) L.handR = G.manos.rarity; if (G.pies) L.feetR = G.pies.rarity;
  const best = Math.max(0, ...Object.values(G).filter(Boolean).map((g) => g.rarity)), nEpic = Object.values(G).filter((g) => g && g.rarity >= 3).length;
  if (best >= 4 || nEpic >= 4) L.aura = best >= 4 ? '#ffa53a' : '#c070ff';
  if (hero.offhand && hasDual()) L.offhand = hero.offhand;
  if (G.hombros) L.shoulderC = G.hombros.color;
  if (G.piernas) L.pantsC = G.piernas.color;
  if (G.pies) L.bootsC = dk(G.pies.color);
  if (G.manos) L.gloveC = G.manos.color;
  if (G.cintura) L.beltC = dk(G.cintura.color);
  hero.look = L;
  if (typeof drawPortrait === 'function') drawPortrait();
}
function equipGear(id) {
  const i = hero.bag.findIndex((w) => w.id === id), it = hero.bag[i];
  if (!it || !canWear(it)) { toast(`No puedes llevar ${ARMOR_NAME[it?.type] || 'eso'} todavía`); return; }
  hero.bag.splice(i, 1);
  if (hero.gear[it.slot]) hero.bag.push(hero.gear[it.slot]);
  hero.gear[it.slot] = it;
  recalc(); refreshLook(); save(); renderBag();
  toast(`Te has puesto <b style="color:${RARITY[it.rarity].color}">${it.name}</b>`);
}
function unequip(slot) {
  if (!hero.gear[slot]) return;
  if (hero.bag.length >= BAGMAX) { toast('Tu bolsa está llena'); return; }
  hero.bag.push(hero.gear[slot]); delete hero.gear[slot];
  recalc(); refreshLook(); save(); renderBag();
}

/* --------------------------------------------- ventana del personaje (C) */
function openChar() {
  if (!playing) return;
  const K = CLASSES[hero.cls];
  const cell = (slot) => {
    const it = hero.gear[slot], S = SLOTS[slot];
    return `<button class="gslot ${it ? 'r' + it.rarity : ''}" data-slot="${slot}" title="${it ? it.name : S.name}">${it ? `<img src="${gearIcon(it).toDataURL()}">` : `<span>${S.icon}</span>`}<small>${S.name}</small></button>`;
  };
  const left = ['cabeza', 'cuello', 'hombros', 'espalda', 'pecho', 'munecas'], right = ['manos', 'cintura', 'piernas', 'pies', 'dedo', 'abalorio'];
  const fed = hero.buff && hero.buff.until > T;
  const html = `${head(`👤 ${hero.name} · ${K.icon} ${K.name} nivel ${hero.lvl}`)}<div class="wbody">
    <div class="doll"><div class="gcol">${left.map(cell).join('')}</div>
      <div class="gmid"><canvas id="dollc" width="248" height="280"></canvas>
        <div class="wpns"><div class="gslot wpn r${hero.weapon.rarity}"><img src="${weaponIcon(hero.weapon).toDataURL()}"><small>Arma</small></div>${hasDual() ? `<button class="gslot wpn ${hero.offhand ? 'r' + hero.offhand.rarity : ''}" data-off>${hero.offhand ? `<img src="${weaponIcon(hero.offhand).toDataURL()}">` : '<span>🗡️</span>'}<small>Mano izq.</small></button>` : ''}</div>
        <button class="ghost" data-book>📖 Habilidades (K)</button></div>
      <div class="gcol">${right.map(cell).join('')}</div></div>
    <div class="stats"><span>❤️ Vida <b>${hero.max}</b></span><span>🛡️ Armadura <b>${hero.armor}</b> (−${Math.round(armorDR() * 100)} % daño)</span>
      <span>⚔️ ${MAIN_STAT[hero.cls]} <b>${hero.poder}</b> (+${Math.round(hero.poder * 0.4)} % daño)</span><span>🗡️ Arma <b>${hero.weapon.dmg}</b> de daño</span>
      <span>👕 Puedes llevar: <b>${ARMOR_TYPES.slice(0, ARMOR_TYPES.indexOf(maxArmor(hero.cls, hero.lvl)) + 1).map((t) => ARMOR_NAME[t]).join(', ')}</b>${(hero.cls === 'guerrero' || hero.cls === 'paladin') && hero.lvl < 10 ? ' (placas desde el nivel 10)' : ''}</span>
      ${fed ? `<span>🍖 Bien alimentado: +${4 + 2 * hero.buff.t} % daño, +${hero.buff.t * 10} vida (${Math.ceil((hero.buff.until - T) / 60)} min)</span>` : ''}</div>
    <p class="sub">Toca una pieza puesta para quitártela. Las piezas nuevas se equipan desde la bolsa 🎒.</p></div>`;
  openWin(html, true);
  const dc = document.getElementById('dollc'), dx = dc.getContext('2d');
  dx.drawImage(toonSprite(hero.look, 0, 0, ''), 0, 0, TW * TRES, TH * TRES, (248 - TW * 2) / 2, 280 - TH * 2, TW * 2, TH * 2);
  bind('[data-slot]', (d) => { if (hero.gear[d.slot]) { unequip(d.slot); openChar(); } });
  bind('[data-book]', () => openBook(0));
  bind('[data-off]', () => { if (hero.offhand && hero.bag.length < BAGMAX) { hero.bag.push(hero.offhand); hero.offhand = null; refreshLook(); save(); renderBag(); openChar(); } });
}
