'use strict';
/* =========================================================================
   SISTEMAS: escenas (casas y mazmorras), acción contextual, mercader,
   profesiones, instructores de clase, bombas, minimapa y mapa.
   ========================================================================= */
const winEl = document.getElementById('win'), gbar = document.getElementById('gbar');
const timers = [];
const builtRooms = {};
let lastWorldPos = null;

/* ---------------------------------------------------------------- escenas */
function enterScene(S, x, y) {
  SC = S; npcs = S.npcs; mobs = S.mobs;
  hero.x = x; hero.y = y; hero.dir = 0;
  shots.length = 0; closeLoot(); closeWin();
  talkingTo = null; talkEl.style.display = 'none';
  hero.gather = null; gbar.style.display = 'none';
  document.body.classList.toggle('inworld', S.kind === 'world');
  if (S.kind !== 'world') toast(`<b>${S.name}</b>${S.portal ? ` · Nivel ${S.portal.lvl}` : ''}`);
  hero.zone = null;
}
function enterDoor(d) {
  if (SC.kind === 'world') {
    const R = builtRooms[d.room] || (builtRooms[d.room] = buildRoom(d.room));
    lastWorldPos = { x: d.x, y: d.y + 36 };
    enterScene(R, IW / 2, IH - 90);
  } else if (d.exit === 'dungeon') {
    const P = SC.portal; enterScene(WORLD, P.x, P.y + 70);
  } else {
    const p = lastWorldPos || WORLD.doors.find((w) => w.room === d.exit) || START;
    enterScene(WORLD, p.x, p.y + (lastWorldPos ? 0 : 36));
  }
}
function enterPortal(P) {
  if (hero.lvl < P.lvl - 3) toast(`⚠️ Cuidado: esta mazmorra es de nivel ${P.lvl} y tú eres nivel ${hero.lvl}`);
  const D = buildDungeon(P);
  place(D, portalArt(P.col), D.doors[0].x, D.doors[0].y, { w: 120, h: 128, portal: { col: P.col } });
  enterScene(D, D.start.x, D.start.y);
}
function onBossKilled(m) {
  const P = SC.portal, first = !hero.done[P.i];
  hero.done[P.i] = true;
  timers.push({ t: T, fn: () => {
    m.loot.push({ kind: 'gold', n: (first ? 40 : 15) + P.lvl * (first ? 12 : 5) });
    m.loot.push({ kind: 'weapon', w: makeWeapon(hero.cls, P.lvl + 1, Math.min(4, Math.max(2, rollRarity(40)) + (first && P.i >= 6 ? 1 : 0))) });
    m.loot.push({ kind: 'potion', icon: '🧪', name: 'Poción de vida', n: 2 });
  } });
  const R = SC.bossRoom, d = { x: R.x + R.w / 2, y: R.y + R.h - 50, exit: 'dungeon' };
  SC.doors.push(d); place(SC, portalArt(P.col), d.x, d.y, { w: 120, h: 128, portal: { col: P.col } });
  nums.push({ x: m.x, y: m.y - 170, t: 0, txt: `¡${m.name} derrotado!`, c: '#ffb0ff', big: true });
  toast(`🏆 <b>¡Mazmorra ${P.name} completada!</b>${first ? ' Primera vez: botín extra.' : ''} Saquea al guardián y sal por el portal.`);
  save();
}

/* ------------------------------------------------------- acción contextual */
const NODE_PROF = { ore: 'mineria', herb: 'herbo', fish: 'pesca' };
const NODE_VERB = { ore: ['⛏️', 'Picar'], herb: ['🌿', 'Recoger'], fish: ['🎣', 'Pescar'] };
function nearAct() {
  if (!hero || hero.dead) return null;
  const d = (x, y) => Math.hypot(x - hero.x, y - hero.y);
  const c = nearCorpse(); if (c) return { icon: '💰', text: 'Saquear', x: c.x, y: c.y, ref: c, fn: () => openLoot(c) };
  const n = nearNpc(); if (n) return { icon: '💬', text: 'Hablar', x: n.x, y: n.y, ref: n, fn: talk };
  for (const dr of SC.doors) if (d(dr.x, dr.y) < 62) return { icon: '🚪', text: SC.kind === 'world' ? `Entrar · ${ROOMS[dr.room].name}` : 'Salir', x: dr.x, y: dr.y, ref: dr, fn: () => enterDoor(dr) };
  for (const p of SC.portals) if (d(p.x, p.y) < 95) return { icon: '🌀', text: `Entrar · Mazmorra ${p.name}`, x: p.x, y: p.y, ref: p, fn: () => enterPortal(p) };
  let best = null, bd = 88;
  for (const nd of SC.nodes) if (T > nd.ready) { const dd = d(nd.x, nd.y); if (dd < bd) { bd = dd; best = nd; } }
  if (best) { const [ic, v] = NODE_VERB[best.kind]; return { icon: ic, text: `${v} · ${resName(best.kind, best.tier)}`, x: best.x, y: best.y, ref: best, fn: () => startGather(best) }; }
  return null;
}
function doAct() {
  if (!playing) return;
  if (winEl.classList.contains('open')) { closeWin(); return; }
  if (talkingTo) { talk(); return; }
  const a = nearAct(); if (a) a.fn();
}
function faceNpc(n) { const dx = hero.x - n.x, dy = hero.y - n.y; n.dir = Math.abs(dx) > Math.abs(dy) ? 2 : dy < 0 ? 1 : 0; n.flip = dx < 0; }

/* ---------------------------------------------------- recursos y bolsa */
const resKey = (kind, t) => kind + t;
const resN = (kind, t) => hero.res[resKey(kind, t)] || 0;
function addRes(kind, t, n) { hero.res[resKey(kind, t)] = resN(kind, t) + n; if (hero.res[resKey(kind, t)] <= 0) delete hero.res[resKey(kind, t)]; }
function resList() { return Object.entries(hero.res).map(([k, n]) => { const kind = k.slice(0, -1), t = +k.slice(-1); return { kind, t, n, name: resName(kind, t), icon: RES_ICON[kind], col: RES[kind][t][1] }; }); }

/* ---------------------------------------------------------- recolectar */
function startGather(nd) {
  const pid = NODE_PROF[nd.kind], P = PROFS[pid], pr = hero.profs[pid];
  if (!pr) { toast(`Necesitas la profesión <b>${P.icon} ${P.name}</b>. Te la enseña ${trainerName(pid)}.`); return; }
  if (!hero.tools[P.tool]) { toast(`Necesitas <b>${P.tool}</b>. Cómprala a Tobías (mercader) o a tu instructor.`); return; }
  if (pr.r < nd.tier) { toast(`${resName(nd.kind, nd.tier)} requiere ${P.name} rango ${nd.tier} (${RANKS[nd.tier]}). Tú eres ${RANKS[pr.r]}.`); return; }
  hero.gather = { nd, p: 0 }; faceTo(nd.x, nd.y);
  gbar.style.display = 'block'; gbar.querySelector('span').textContent = `${NODE_VERB[nd.kind][1]}…`;
}
function finishGather() {
  const nd = hero.gather.nd; hero.gather = null; gbar.style.display = 'none';
  const n = 1 + (Math.random() < 0.35 ? 1 : 0);
  addRes(nd.kind, nd.tier, n);
  nd.ready = T + 45;
  nums.push({ x: hero.x, y: hero.y - 120, t: 0, txt: `+${n} ${resName(nd.kind, nd.tier)}`, c: RES[nd.kind][nd.tier][1] });
  gainXp(3 + nd.tier * 3);
  profTip(NODE_PROF[nd.kind]);
  save(); renderBag();
}
function profTip(pid) {
  const pr = hero.profs[pid]; if (!pr || pr.r >= 5) return;
  if (questDone(pid) && !pr.told) { pr.told = true; toast(`📜 Misión de <b>${PROFS[pid].name}</b> lista: vuelve con ${trainerName(pid)} para subir de rango.`); }
}

/* ----------------------------------------------------------- profesiones */
const trainerName = (pid) => ({ bruno: 'el Pescador Bruno (estanque del pueblo)', greta: 'la Minera Greta (camino del este)', lia: 'Lía (oeste del pueblo)', chispa: 'la Ingeniera Chispa (en la posada)', amalia: 'la Doctora Amalia (la Consulta)', brunilda: 'Brunilda (la Herrería)', marta: 'Marta (la Posada)' }[PROFS[pid].trainer]);
function questDone(pid) {
  const pr = hero.profs[pid]; if (!pr || pr.r >= 5) return false;
  const q = profQuest(pid, pr.r);
  return q.kind === 'have' ? resN(q.res, q.tier) >= q.n : (pr.q || 0) >= q.n;
}
function questProg(pid) { const pr = hero.profs[pid], q = profQuest(pid, pr.r); return [Math.min(q.n, q.kind === 'have' ? resN(q.res, q.tier) : pr.q || 0), q.n]; }
function canCraft(R) { return R.needs.every(([k, t, n]) => resN(k, t) >= n); }
function craft(pid, t, j = 0) {
  const P = PROFS[pid], pr = hero.profs[pid], R = recipeList(pid, t)[j];
  if (!hero.tools[P.tool]) { toast(`Necesitas <b>${P.tool}</b>`); return; }
  if (!canCraft(R)) return;
  for (const [k, tt, n] of R.needs) addRes(k, tt, -n);
  if (R.gives.kind === 'food') { hero.food[R.gives.key] = (hero.food[R.gives.key] || 0) + R.gives.n; toast(`${FOOD[R.gives.key][1]} Has cocinado ${R.gives.n} × ${FOOD[R.gives.key][0]} (tecla 5 o botón 🍖 para comer)`); }
  else if (R.gives.kind === 'potions') { hero.potions += R.gives.n; toast(`🧪 Has preparado ${R.gives.n} pociones`); }
  else if (R.gives.kind === 'bombs') { hero.bombs += R.gives.n; toast(`💣 Has fabricado ${R.gives.n} bombas (tecla 4 o botón 💣)`); }
  else {
    if (hero.bag.length >= BAGMAX) { toast('Tu bolsa está llena'); for (const [k, tt, n] of R.needs) addRes(k, tt, n); return; }
    const rar = Math.min(4, t - 1 + (Math.random() < 0.25 ? 1 : 0)), w = makeWeapon(hero.cls, Math.max(hero.lvl, t * 4), rar);
    hero.bag.push(w); toast(`🔨 Has forjado <b style="color:${RARITY[rar].color}">${w.name}</b> (daño ${w.dmg})`);
  }
  if (t === pr.r) pr.q = (pr.q || 0) + 1;
  gainXp(5 + t * 4); profTip(pid);
  save(); renderBag(); openProfs();
}
function learn(pid) {
  if (Object.keys(hero.profs).length >= MAX_PROFS) return;
  hero.profs[pid] = { r: 1, q: 0 };
  toast(`📜 Has aprendido <b>${PROFS[pid].icon} ${PROFS[pid].name}</b> (Aprendiz)`);
  save();
}
function rankUp(pid) {
  const pr = hero.profs[pid], q = profQuest(pid, pr.r);
  if (!questDone(pid)) return;
  if (q.kind === 'have') addRes(q.res, q.tier, -q.n);
  pr.r++; pr.q = 0; pr.told = false;
  fx.push({ k: 'ring', x: hero.x, y: hero.y - 10, r: 80, t: 0, life: 0.8, c: '#ffd27a' });
  toast(`⭐ <b>${PROFS[pid].name}</b>: ahora eres <b>${RANKS[pr.r]}</b>`);
  save(); renderBag();
}
function buyTool(pid) {
  const P = PROFS[pid];
  if (hero.tools[P.tool]) return;
  if (hero.gold < TOOL_PRICE) { toast('No tienes oro suficiente'); return; }
  hero.gold -= TOOL_PRICE; hero.tools[P.tool] = true; toast(`Has comprado <b>${P.tool}</b>`); save();
}

/* --------------------------------------------------------------- ventanas */
function openWin(html, wide) {
  winEl.innerHTML = html; winEl.classList.add('open'); winEl.classList.toggle('wide', !!wide);
  winEl.querySelector('[data-close]')?.addEventListener('click', closeWin);
}
function closeWin() { winEl.classList.remove('open'); }
const head = (t) => `<header><b>${t}</b><span class="purse2">🪙 ${hero.gold}</span><button class="ghost" data-close>✕</button></header>`;
function bind(sel, fn) { winEl.querySelectorAll(sel).forEach((b) => (b.onclick = () => fn(b.dataset))); }
function openRole(n) {
  const role = n.V.role;
  if (role === 'shop') return openShop('buy');
  if (role.startsWith('prof:')) return openTrainer(role.slice(5), n);
  if (role.startsWith('class:')) return openClassTrainer(role.slice(6), n);
  if (role === 'inn') return openInn(n);
  if (role === 'travel') return openTravel(n);
}

/* mercader */
let stock = null, stockLvl = 0;
function shopStock() {
  if (!stock || stockLvl !== hero.lvl || stock.cls !== hero.cls) {
    stock = [0, 1, 1, 2].map((r, i) => makeWeapon(hero.cls, hero.lvl + (i > 1 ? 1 : 0), r)); stock.cls = hero.cls; stockLvl = hero.lvl;
    const slots = SLOT_ORDER.slice().sort(() => Math.random() - 0.5).slice(0, 8);
    stock.gear = slots.map((sl, i) => makeGear(hero.cls, hero.lvl, i < 3 ? 0 : i < 7 ? 1 : 2, sl));
  }
  return stock;
}
const wPrice = (w) => Math.round((w.dmg * 5 + 10) * (1 + w.rarity * 0.6));
const sellW = (w) => Math.max(2, Math.round(wPrice(w) * 0.25));
const sellItem = (it) => (it.slot ? Math.max(2, Math.round(gearValue(it) * 0.25)) : sellW(it));
const resPrice = (t) => 2 + t * 3;
const MAT_PRICE = 3;
function junkValue() {
  let g = 0;
  for (const v of Object.values(hero.mats)) g += v.n * MAT_PRICE;
  for (const it of hero.bag) if (it.rarity === 0) g += sellItem(it);
  return g;
}
function openShop(tab) {
  const S = shopStock();
  const tabs = `<div class="tabs">${[['buy', 'Comprar'], ['armor', 'Armaduras'], ['sell', 'Vender']].map(([k, l]) => `<button class="chip ${tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>`;
  let body = '';
  if (tab === 'buy') {
    body += `<div class="lrow"><span class="li">🧪</span><b>Poción de vida<small>Cura el 40 % de tu vida al instante · tienes ${hero.potions}</small></b><button class="ghost" data-buy="pot">15 🪙</button></div>`;
    body += '<h4>Comida (cura poco a poco al comer: tecla 5 o 🍖)</h4>' + Object.entries(FOOD_PRICE).map(([k, p]) => `<div class="lrow"><span class="li">${FOOD[k][1]}</span><b>${FOOD[k][0]}<small>Tienes ${hero.food[k] || 0} · la comida cocinada además da «Bien alimentado»</small></b><button class="ghost" data-food="${k}">${p} 🪙</button></div>`).join('');
    body += '<h4>Herramientas de profesión</h4>' + Object.entries(PROFS).map(([pid, P]) => `<div class="lrow"><span class="li">${P.icon}</span><b>${P.tool}<small>Para ${P.name}</small></b>${hero.tools[P.tool] ? '<em>La tienes</em>' : `<button class="ghost" data-tool="${pid}">${TOOL_PRICE} 🪙</button>`}</div>`).join('');
    body += '<h4>Armas</h4>' + S.map((w, i) => { const R = RARITY[w.rarity]; return `<div class="lrow"><img src="${weaponIcon(w).toDataURL()}"><b style="color:${R.color}">${w.name}<small>${R.name} · Daño ${w.dmg}${w.dmg > hero.weapon.dmg ? ' <span class="up">▲</span>' : ''}</small></b><button class="ghost" data-bw="${i}">${wPrice(w)} 🪙</button></div>`; }).join('');
  } else if (tab === 'armor') {
    body += `<p class="sub">Piezas de ${ARMOR_NAME[maxArmor(hero.cls, hero.lvl)].toLowerCase()} para ti y joyas. Cambian cuando subes de nivel. ▲ = mejor que lo que llevas.</p>`;
    body += S.gear.map((g, i) => { const R = RARITY[g.rarity]; return `<div class="lrow"><img src="${gearIcon(g).toDataURL()}"><b style="color:${R.color}">${g.name}<small>${gearDesc(g)} · ${gearStats(g) || 'sin atributos'}${gearScore(g) > gearScore(hero.gear[g.slot]) ? ' <span class="up">▲</span>' : ''}</small></b><button class="ghost" data-bg="${i}">${gearValue(g)} 🪙</button></div>`; }).join('');
  } else {
    const mats = Object.entries(hero.mats), res = resList(), foods = Object.entries(hero.food).filter(([, n]) => n > 0), junk = junkValue();
    if (junk) body += `<div class="lgo"><button class="big" data-junk>Vender materiales y objetos comunes · ${junk} 🪙</button></div>`;
    body += mats.length + res.length + foods.length + hero.bag.length ? '' : '<p class="sub">No tienes nada para vender.</p>';
    body += mats.map(([nm, v]) => `<div class="lrow"><span class="li">${v.icon}</span><b>${nm}<small>×${v.n} · ${MAT_PRICE} 🪙 cada uno</small></b><button class="ghost" data-sm="${nm}">Vender (${v.n * MAT_PRICE})</button></div>`).join('');
    body += res.map((r) => `<div class="lrow"><span class="li">${r.icon}</span><b style="color:${r.col}">${r.name}<small>×${r.n} · ${resPrice(r.t)} 🪙 cada uno</small></b><button class="ghost" data-sr="${r.kind}${r.t}">Vender 1</button><button class="ghost" data-sra="${r.kind}${r.t}">Todo</button></div>`).join('');
    body += foods.map(([k, n]) => `<div class="lrow"><span class="li">${FOOD[k][1]}</span><b>${FOOD[k][0]}<small>×${n} · ${FOOD[k][2] * 3} 🪙 cada uno</small></b><button class="ghost" data-sf="${k}">Vender 1</button></div>`).join('');
    if (hero.potions) body += `<div class="lrow"><span class="li">🧪</span><b>Poción de vida<small>×${hero.potions} · 5 🪙 cada una</small></b><button class="ghost" data-sp>Vender 1</button></div>`;
    if (hero.bag.length) body += '<h4>Armas y armaduras de la bolsa</h4>' + hero.bag.map((w) => `<div class="lrow"><img src="${itemIcon(w).toDataURL()}"><b style="color:${RARITY[w.rarity].color}">${w.name}<small>${w.slot ? gearStats(w) || gearDesc(w) : 'Daño ' + w.dmg}</small></b><button class="ghost" data-sw="${w.id}">${sellItem(w)} 🪙</button></div>`).join('');
  }
  openWin(`${head('🛒 Tobías · Mercader')}${tabs}<div class="wbody">${body}</div>`);
  bind('[data-tab]', (d) => openShop(d.tab));
  const pay = (n) => { if (hero.gold < n) { toast('No tienes oro suficiente'); return false; } hero.gold -= n; return true; };
  const done = (t) => { save(); renderBag(); openShop(t); };
  bind('[data-buy]', () => { if (pay(15)) { hero.potions++; done('buy'); } });
  bind('[data-food]', (d) => { if (pay(FOOD_PRICE[d.food])) { hero.food[d.food] = (hero.food[d.food] || 0) + 1; done('buy'); } });
  bind('[data-tool]', (d) => { buyTool(d.tool); openShop('buy'); });
  bind('[data-bw]', (d) => {
    const w = S[+d.bw]; if (hero.bag.length >= BAGMAX) { toast('Tu bolsa está llena'); return; }
    if (pay(wPrice(w))) { hero.bag.push(w); S[+d.bw] = makeWeapon(hero.cls, hero.lvl, Math.max(0, w.rarity - (Math.random() < 0.5 ? 1 : 0))); toast(`Has comprado <b style="color:${RARITY[w.rarity].color}">${w.name}</b>. Equípala en la bolsa (B).`); done('buy'); }
  });
  bind('[data-bg]', (d) => {
    const g = S.gear[+d.bg]; if (hero.bag.length >= BAGMAX) { toast('Tu bolsa está llena'); return; }
    if (pay(gearValue(g))) { hero.bag.push(g); S.gear[+d.bg] = makeGear(hero.cls, hero.lvl, Math.max(0, g.rarity - (Math.random() < 0.5 ? 1 : 0)), g.slot); toast(`Has comprado <b style="color:${RARITY[g.rarity].color}">${g.name}</b>. Póntela desde la bolsa (B).`); done('armor'); }
  });
  bind('[data-junk]', () => { const g = junkValue(); hero.mats = {}; hero.bag = hero.bag.filter((it) => it.rarity > 0); hero.gold += g; toast(`Has vendido la chatarra por ${g} 🪙`); done('sell'); });
  bind('[data-sm]', (d) => { const v = hero.mats[d.sm]; hero.gold += v.n * MAT_PRICE; delete hero.mats[d.sm]; done('sell'); });
  bind('[data-sr]', (d) => { const kind = d.sr.slice(0, -1), t = +d.sr.slice(-1); addRes(kind, t, -1); hero.gold += resPrice(t); done('sell'); });
  bind('[data-sra]', (d) => { const kind = d.sra.slice(0, -1), t = +d.sra.slice(-1), n = resN(kind, t); addRes(kind, t, -n); hero.gold += n * resPrice(t); done('sell'); });
  bind('[data-sf]', (d) => { hero.food[d.sf]--; if (!hero.food[d.sf]) delete hero.food[d.sf]; hero.gold += FOOD[d.sf][2] * 3; done('sell'); });
  bind('[data-sp]', () => { hero.potions--; hero.gold += 5; done('sell'); });
  bind('[data-sw]', (d) => { const i = hero.bag.findIndex((w) => w.id === +d.sw); hero.gold += sellItem(hero.bag[i]); hero.bag.splice(i, 1); done('sell'); });
}

/* comer */
function eatFood(pickKey) {
  if (!hero || hero.dead || !playing) return;
  const keys = Object.keys(hero.food).filter((k) => hero.food[k] > 0);
  if (!keys.length) { toast('No tienes comida. Cómprala a Tobías o aprende Cocina con Marta.'); return; }
  if ((hero.cd.food || 0) > T) { toast(`Aún estás comiendo (${Math.ceil(hero.cd.food - T)} s)`); return; }
  keys.sort((a, b) => (FOOD[b][3] - FOOD[a][3]) || FOOD[b][2] - FOOD[a][2]);
  const k = pickKey && hero.food[pickKey] ? pickKey : keys[0], F = FOOD[k]; hero.food[k]--; if (!hero.food[k]) delete hero.food[k];
  hero.cd.food = T + 10;
  hero.regen = { until: T + 10, per: hero.max * (0.045 + 0.012 * F[2]) };
  nums.push({ x: hero.x, y: hero.y - 120, t: 0, txt: `${F[1]} ${F[0]}`, c: '#ffd27a' });
  if (F[3]) { hero.buff = { t: F[2], until: T + 300 }; recalc(); toast(`🍖 <b>Bien alimentado</b>: +${4 + 2 * F[2]} % de daño y +${F[2] * 10} de vida durante 5 minutos`); }
  save();
}

/* instructor de profesión */
let forgetArm = null;
function openTrainer(pid, n) {
  const P = PROFS[pid], pr = hero.profs[pid], cnt = Object.keys(hero.profs).length;
  let body = `<p class="sub">${P.desc}</p>`;
  if (!pr) {
    if (cnt < MAX_PROFS) body += `<p>¿Quieres aprender <b>${P.icon} ${P.name}</b>? Puedes tener hasta ${MAX_PROFS} profesiones (tienes ${cnt}).</p><div class="lgo"><button class="big" data-learn>Aprender ${P.name}</button></div>`;
    else body += `<p>Ya tienes ${MAX_PROFS} profesiones. Olvida una para aprender ${P.name}:</p>` + Object.keys(hero.profs).map((id) => `<button class="ghost" data-forget="${id}">Olvidar ${PROFS[id].icon} ${PROFS[id].name}${forgetArm === id ? ' (¿seguro? pulsa otra vez)' : ''}</button> `).join('');
  } else {
    body += `<div class="rank">${P.icon} <b>${P.name}</b> · Rango ${pr.r}/5 · <b>${RANKS[pr.r]}</b></div>`;
    if (pr.r >= 5) body += '<p>¡Eres Maestro! Ya no tengo nada más que enseñarte.</p>';
    else {
      const q = profQuest(pid, pr.r), [a, b] = questProg(pid), ok = questDone(pid);
      body += `<div class="quest"><b>📜 Misión para ser ${RANKS[pr.r + 1]}</b><span>${q.text}</span><div class="bar q"><i style="width:${(a / b) * 100}%"></i><span>${a} / ${b}</span></div></div>`;
      body += `<div class="lgo"><button class="big" data-rank ${ok ? '' : 'disabled'}>${ok ? 'Entregar y subir de rango' : 'Aún no está completa'}</button></div>`;
    }
    body += `<p class="sub">${P.kind === 'gather' ? `Rango ${pr.r}: puedes recoger hasta «${resName(P.res, pr.r)}». Los recursos mejores están más lejos del pueblo.` : 'Fabrica desde la ventana de profesiones (📜 o tecla P).'}</p>`;
    body += `<button class="ghost" data-forget="${pid}">${forgetArm === pid ? '¿Seguro? Pulsa otra vez para olvidar' : 'Olvidar profesión'}</button>`;
  }
  body += `<div class="lrow"><span class="li">${P.icon}</span><b>${P.tool}<small>Herramienta necesaria</small></b>${hero.tools[P.tool] ? '<em>La tienes</em>' : `<button class="ghost" data-tool>${TOOL_PRICE} 🪙</button>`}</div>`;
  openWin(`${head(`${n.V.name} · ${P.name}`)}<div class="wbody">${body}</div>`);
  bind('[data-learn]', () => { learn(pid); openTrainer(pid, n); });
  bind('[data-rank]', () => { rankUp(pid); openTrainer(pid, n); });
  bind('[data-tool]', () => { buyTool(pid); openTrainer(pid, n); });
  bind('[data-forget]', (d) => { if (forgetArm === d.forget) { delete hero.profs[d.forget]; forgetArm = null; toast(`Has olvidado ${PROFS[d.forget].name}`); save(); } else forgetArm = d.forget; openTrainer(pid, n); });
}

/* ventana de profesiones (📜 / P) */
function openProfs() {
  if (!playing) return;
  const ids = Object.keys(hero.profs);
  let body = ids.length ? '' : '<p class="sub">Aún no tienes profesiones. Habla con los instructores del pueblo:</p>';
  for (const pid of ids) {
    const P = PROFS[pid], pr = hero.profs[pid];
    body += `<div class="prof"><div class="rank">${P.icon} <b>${P.name}</b> · ${RANKS[pr.r]} (${pr.r}/5)${hero.tools[P.tool] ? '' : ` · <span class="down">falta ${P.tool}</span>`}</div>`;
    if (pr.r < 5) { const q = profQuest(pid, pr.r), [a, b] = questProg(pid); body += `<div class="quest"><span>📜 ${q.text} → ${trainerName(pid)}</span><div class="bar q"><i style="width:${(a / b) * 100}%"></i><span>${a} / ${b}</span></div></div>`; }
    if (P.kind === 'craft') for (let t = 1; t <= pr.r; t++) recipeList(pid, t).forEach((R, j) => {
      const ok = canCraft(R), ic = R.gives.kind === 'food' ? FOOD[R.gives.key][1] : R.gives.kind === 'weapon' ? '⚔️' : R.gives.kind === 'bombs' ? '💣' : '🧪';
      body += `<div class="lrow"><span class="li">${ic}</span><b>${R.name}<small>${R.needs.map(([k, tt, nn]) => `<span class="${resN(k, tt) >= nn ? 'up' : 'down'}">${nn}× ${resName(k, tt)} (${resN(k, tt)})</span>`).join(' + ')}</small></b><button class="ghost" data-craft="${pid}:${t}:${j}" ${ok ? '' : 'disabled'}>${pid === 'cocina' ? 'Cocinar' : 'Fabricar'}</button></div>`;
    });
    body += '</div>';
  }
  if (ids.length < MAX_PROFS) body += `<h4>Profesiones disponibles (${ids.length}/${MAX_PROFS})</h4>` + Object.entries(PROFS).filter(([pid]) => !hero.profs[pid]).map(([pid, P]) => `<div class="lrow"><span class="li">${P.icon}</span><b>${P.name}<small>Te la enseña ${trainerName(pid)}</small></b></div>`).join('');
  body += `<h4>Habilidades equipadas</h4><div class="bbar">${hero.abil.bar.map((id) => `<span class="bslot">${id ? ABIL[id].icon : '＋'}<small>${id ? ABIL[id].name : 'vacía'}</small></span>`).join('')}</div><div class="lgo"><button class="ghost" data-book>📖 Libro de habilidades (K)</button></div>`;
  openWin(`${head('📜 Profesiones')}<div class="wbody">${body}</div>`);
  bind('[data-craft]', (d) => { const [pid, t, j] = d.craft.split(':'); craft(pid, +t, +j); });
  bind('[data-book]', () => openBook(0));
}

/* posadera y guardián de portales */
function openInn(n) {
  openWin(`${head('🍲 Marta · Posadera')}<div class="wbody"><p>«${n.V.greet}»</p><div class="lrow"><span class="li">🛏️</span><b>Descansar<small>Recuperas toda la vida</small></b><button class="ghost" data-rest>5 🪙</button></div><div class="lrow"><span class="li">🍳</span><b>Aprender Cocina<small>${hero.profs.cocina ? `Eres ${RANKS[hero.profs.cocina.r]} cocinero` : 'Te enseño a cocinar carne y pescado'}</small></b><button class="ghost" data-cook>Cocina</button></div><p class="sub">La que está en la mesa del fondo es la Ingeniera Chispa: enseña Ingeniería.</p></div>`);
  bind('[data-cook]', () => openTrainer('cocina', n));
  bind('[data-rest]', () => { if (hero.gold < 5) { toast('No tienes oro suficiente'); return; } hero.gold -= 5; hero.hp = hero.max; toast('Has descansado: vida al máximo'); save(); closeWin(); });
}
function openTravel(n) {
  const list = PORTALS.filter((p) => hero.found.includes(p.i));
  const body = list.length ? list.map((p) => `<div class="lrow"><span class="li" style="color:${p.col}">🌀</span><b style="color:${p.col}">Portal ${p.name}<small>Mazmorra de nivel ${p.lvl}${hero.done[p.i] ? ' · ✔ completada' : ''}</small></b><button class="ghost" data-go="${p.i}">Viajar · 10 🪙</button></div>`).join('') : '<p>Aún no has descubierto ningún portal. Explora: cuando te acerques a uno aparecerá en tu mapa y podré llevarte hasta él.</p>';
  openWin(`${head('🌀 Maestro Orvin · Portales')}<div class="wbody"><p class="sub">Diez portales, diez colores. Cuanto más lejos del pueblo, más fuerte es el guardián.</p>${body}</div>`);
  bind('[data-go]', (d) => { if (hero.gold < 10) { toast('No tienes oro suficiente'); return; } hero.gold -= 10; const p = PORTALS[+d.go]; enterScene(WORLD, p.x, p.y + 90); save(); });
}

/* ------------------------------------------------------------------ bombas */
function throwBomb() {
  if (!hero || hero.dead || !playing) return;
  if (!hero.bombs) { toast('No tienes bombas. Se fabrican con Ingeniería.'); return; }
  if (hero.cd.bomb > T) return;
  hero.cd.bomb = T + 1; hero.bombs--; hero.atkT = 0.22;
  const m = nearestMob(280), [vx, vy] = facingVec();
  const tx = m ? m.x : hero.x + vx * 160, ty = m ? m.y : hero.y + vy * 160;
  if (m) faceTo(m.x, m.y);
  fx.push({ k: 'bomb', x0: hero.x, y0: hero.y - 40, x: tx, y: ty - 10, t: 0, life: 0.45 });
  const dmg = 16 + hero.lvl * 2.5 + 8 * (hero.profs.ingenieria?.r || 1);
  timers.push({ t: T + 0.45, fn: () => {
    fx.push({ k: 'ring', x: tx, y: ty, r: 100, t: 0, life: 0.5, c: '#ff9a3a' }); fx.push({ k: 'ring', x: tx, y: ty, r: 60, t: 0, life: 0.4, c: '#fff1a0' });
    for (let i = 0; i < 16; i++) fx.push({ k: 'p', x: tx, y: ty - 10, vx: (Math.random() - 0.5) * 300, vy: -Math.random() * 260, t: 0, life: 0.6, c: i % 2 ? '#ff9a3a' : '#5a5460' });
    for (const mm of mobs) if (!mm.dead && Math.hypot(mm.x - tx, mm.y - ty) < 100) damageMob(mm, dmg / lvlMul(), '#ffb03a');
  } });
  save();
}

/* ------------------------------------------------- mundo: zonas y descubrimiento */
let zoneT = 0, mmT = 0;
function updateWorldStuff(dt) {
  for (let i = timers.length - 1; i >= 0; i--) if (T >= timers[i].t) { const f = timers[i].fn; timers.splice(i, 1); f(); }
  if (hero.gather) {
    hero.gather.p += dt / 1.6; gbar.querySelector('i').style.width = `${Math.min(100, hero.gather.p * 100)}%`;
    if (hero.gather.p >= 1) finishGather();
  }
  if (SC !== WORLD) return;
  warmChunks(hero.x, hero.y);
  markSeen(hero.x, hero.y);
  if ((zoneT -= dt) < 0) {
    zoneT = 0.5;
    const z = villageZone(hero.x, hero.y, 1.1) ? 'pueblo' : zoneAt(hero.x, hero.y);
    if (hero.zone && z !== hero.zone) { const L = mobLvlAt(hero.x, hero.y); toast(z === 'pueblo' ? '🏠 <b>Albor</b> · zona segura' : `🗺️ <b>${ZONES[z].name}</b> · monstruos de nivel ${Math.max(1, L - 1)}-${L + 2}`); }
    hero.zone = z;
    for (const p of PORTALS) if (!hero.found.includes(p.i) && Math.hypot(p.x - hero.x, p.y - hero.y) < 900) {
      hero.found.push(p.i);
      toast(`🌀 ¡Has descubierto el <b style="color:${p.col}">Portal ${p.name}</b>! Mazmorra de nivel ${p.lvl}. Ya aparece en tu mapa.`);
      save();
    }
  }
}

/* ------------------------------------------------------------ mapa */
const SEEN_W = WORLD_W / 100, SEEN_H = WORLD_H / 100;
let SEEN = new Uint8Array(SEEN_W * SEEN_H), MAPBASE = null;
function initSeen() {
  SEEN = new Uint8Array(SEEN_W * SEEN_H); fogDirty = true;
  const s = hero.seen || '';
  for (let i = 0; i < s.length; i++) { const v = s.charCodeAt(i) - 48; for (let b = 0; b < 6; b++) if (v & (1 << b)) SEEN[i * 6 + b] = 1; }
}
function syncSeen() { let s = ''; for (let i = 0; i < SEEN.length; i += 6) { let v = 0; for (let b = 0; b < 6; b++) if (SEEN[i + b]) v |= 1 << b; s += String.fromCharCode(48 + v); } if (hero) hero.seen = s; }
function markSeen(x, y) {
  const ci = Math.floor(x / 100), cj = Math.floor(y / 100);
  for (let j = cj - 6; j <= cj + 6; j++) for (let i = ci - 8; i <= ci + 8; i++) if (i >= 0 && j >= 0 && i < SEEN_W && j < SEEN_H && ((i - ci) / 8) ** 2 + ((j - cj) / 6) ** 2 <= 1 && !SEEN[j * SEEN_W + i]) { SEEN[j * SEEN_W + i] = 1; fogDirty = true; }
}
function buildMapBase() {
  const k = 0.05, c = document.createElement('canvas'); c.width = WORLD_W * k; c.height = WORLD_H * k;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.drawImage(ZMAP, 0, 0, c.width, c.height);
  x.fillStyle = '#c9a46a'; for (let y = 0; y < WORLD_H; y += 40) for (let xx = 0; xx < WORLD_W; xx += 40) if (onPath(xx, y)) x.fillRect(xx * k - 1, y * k - 1, 3, 3);
  for (const L of LAKES) { x.beginPath(); x.ellipse(L.x * k, L.y * k, L.rx * k, L.ry * k, 0, 0, 7); x.fillStyle = '#4f8ac0'; x.fill(); x.lineWidth = 1.5; x.strokeStyle = '#2a2220'; x.stroke(); }
  x.fillStyle = '#2f5f3a'; for (const o of WORLD.objects) if (o.tree) x.fillRect(o.x * k - 1, o.y * k - 2, 2.4, 2.4);
  x.beginPath(); x.ellipse(CX * k, (CY + 60) * k, 40 * 0.8, 30 * 0.8, 0, 0, 7); x.fillStyle = '#e8d8a8'; x.fill(); x.lineWidth = 2; x.strokeStyle = '#6b4a22'; x.stroke();
  MAPBASE = c;
}
function drawMapTo(cn, x0, y0, w, h, big) {
  const x = cn.getContext('2d'), sx = cn.width / w, sy = cn.height / h, k = 0.05;
  x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#120c08'; x.fillRect(0, 0, cn.width, cn.height);
  x.imageSmoothingEnabled = true;
  x.drawImage(MAPBASE, x0 * k, y0 * k, w * k, h * k, 0, 0, cn.width, cn.height);
  // niebla suave: lo que aún no has visto
  const fc = fogCanvas();
  x.drawImage(fc, x0 / 100, y0 / 100, w / 100, h / 100, 0, 0, cn.width, cn.height);
  const P = (wx, wy) => [(wx - x0) * sx, (wy - y0) * sy];
  x.textAlign = 'center'; x.lineJoin = 'round';
  for (const p of PORTALS) if (hero.found.includes(p.i)) {
    const [px, py] = P(p.x, p.y);
    x.beginPath(); x.arc(px, py, big ? 9 : 5, 0, 7); x.fillStyle = p.col; x.fill(); x.lineWidth = 2; x.strokeStyle = '#fff'; x.stroke();
    if (big) { x.font = 'bold 13px Trebuchet MS'; x.lineWidth = 4; x.strokeStyle = '#2a2220'; const t = `${p.name} · Nv ${p.lvl}${hero.done[p.i] ? ' ✔' : ''}`; x.strokeText(t, px, py - 13); x.fillStyle = '#fff'; x.fillText(t, px, py - 13); }
  }
  if (big) {
    x.font = 'bold 15px Trebuchet MS';
    const lab = (t, wx, wy) => { const [px, py] = P(wx, wy); if (!SEEN[Math.floor(wy / 100) * SEEN_W + Math.floor(wx / 100)]) return; x.lineWidth = 4; x.strokeStyle = '#2a2220'; x.strokeText(t, px, py); x.fillStyle = '#ffd27a'; x.fillText(t, px, py); };
    lab('Albor', CX, CY + 40); lab(ZONES.bosque.name, CX, CY - 2200); lab(ZONES.colinas.name, CX + 3000, CY); lab(ZONES.costa.name, CX + 400, CY + 2000); lab(ZONES.salvaje.name, CX - 3000, CY - 300);
  }
  const [hx, hy] = P(hero.x, hero.y);
  x.beginPath(); x.arc(hx, hy, big ? 7 : 5, 0, 7); x.fillStyle = '#ffe46a'; x.fill(); x.lineWidth = 2.4; x.strokeStyle = '#2a2220'; x.stroke();
}
let fogC = null, fogDirty = true;
function fogCanvas() {
  if (!fogC) { fogC = document.createElement('canvas'); fogC.width = SEEN_W; fogC.height = SEEN_H; }
  if (fogDirty) {
    const x = fogC.getContext('2d'), img = x.createImageData(SEEN_W, SEEN_H);
    for (let i = 0; i < SEEN.length; i++) { img.data[i * 4] = 26; img.data[i * 4 + 1] = 20; img.data[i * 4 + 2] = 16; img.data[i * 4 + 3] = SEEN[i] ? 0 : 255; }
    x.putImageData(img, 0, 0); fogDirty = false;
  }
  return fogC;
}
const mmEl = document.getElementById('minimap'), mapEl = document.getElementById('mapwin');
function drawMinimap() {
  if (!MAPBASE || SC !== WORLD) return;
  const w = 2400, h = 1600;
  drawMapTo(mmEl, clamp(hero.x - w / 2, 0, WORLD_W - w), clamp(hero.y - h / 2, 0, WORLD_H - h), w, h, false);
}
function toggleMap() {
  if (!playing) return;
  if (mapEl.classList.toggle('open')) { if (SC !== WORLD) { mapEl.classList.remove('open'); toast('El mapa solo funciona en el exterior'); return; } drawMapTo(mapEl.querySelector('canvas'), 0, 0, WORLD_W, WORLD_H, true); }
}
mapEl.onclick = () => mapEl.classList.remove('open');
mmEl.onclick = toggleMap;
document.getElementById('mapbtn').onclick = toggleMap;
document.getElementById('charbtn').onclick = () => (winEl.classList.contains('open') ? closeWin() : openChar());
document.getElementById('profbtn').onclick = () => (winEl.classList.contains('open') ? closeWin() : openProfs());
