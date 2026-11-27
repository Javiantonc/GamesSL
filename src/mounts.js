'use strict';
/* =========================================================================
   MONTURAS. Se compran en los establos de Albor (Mozo de cuadras Tomás).
   Montar: tecla Y o botón 🐎 (tarda 1,2 s y no se puede en combate).
   Si atacas, te golpean o entras en una casa o mazmorra, desmontas.
   Para añadir más: otra entrada en MOUNTS con sus colores.
   ========================================================================= */
const MOUNTS = {
  caballo: { name: 'Caballo castaño', icon: '🐎', req: 10, price: 80, speed: 1.8, col: '#9a6236', mane: '#3a2a24', saddle: '#a8452f', desc: 'Un caballo fiel y resistente. Corre casi el doble que tú a pie.' },
};
const horseCache = new Map();
/** layer 'a' = detrás del jinete · 'b' = delante del jinete */
function horseSprite(type, dir, f, layer) {
  const key = type + dir + f + layer;
  if (horseCache.has(key)) return horseCache.get(key);
  const M = MOUNTS[type], c = document.createElement('canvas'); c.width = TW * TRES; c.height = TH * TRES;
  X = c.getContext('2d'); X.lineJoin = 'round'; X.lineCap = 'round'; X.scale(TRES, TRES); X.translate(FX, FY);
  const b = M.col, mn = M.mane, st = [0, 4, 0, -4][f % 4];
  const leg = (x, top, len, w, k) => { toon(RR(x - w / 2, top, w, len, w / 2), k ? dk(b) : b, { shade: false }); toon(E(x, top + len - 1, w / 2 + 0.6, 2.8), '#3a2a24', { shade: false, lw: 1.8 }); };
  if (dir === 2) {   // de lado, mirando a la derecha
    if (layer === 'a') {
      toon((k) => { k.moveTo(-32, -54); k.quadraticCurveTo(-50, -48, -46, -22); k.quadraticCurveTo(-40, -40, -30, -46); k.closePath(); }, mn, { shade: false });
      leg(-22 - st, -36, 35, 7, 1); leg(20 + st, -36, 35, 7, 1); leg(-14 + st, -36, 35, 7, 0); leg(28 - st, -36, 35, 7, 0);
      toon(E(2, -46, 36, 15), b, { sx: -3, sy: -3 });
      toon(E(2, -38, 24, 6), lt(b), { shade: false, line: false });
      toon(RR(-16, -60, 30, 13, 4), M.saddle, { sx: -2, sy: -2 });
      toon(RR(-10, -64, 18, 7, 3), '#5a3a22', { shade: false, lw: 2 });
      stroke([[-2, -52], [-2, -30]], '#5a3a22', 1.6); toon(RR(-5, -32, 6, 5, 1), '#c9a24a', { shade: false, lw: 1.4 });
    } else {
      toon(PL([[20, -54], [30, -82], [42, -80], [36, -48]]), b, { sx: -2, sy: 0 });
      toon((k) => { k.moveTo(36, -90); k.quadraticCurveTo(54, -92, 60, -76); k.quadraticCurveTo(60, -68, 52, -68); k.quadraticCurveTo(44, -72, 34, -78); k.closePath(); }, b, { sx: -2, sy: -2 });
      toon(E(56, -72, 6, 5), lt(b), { shade: false, lw: 1.8 }); dot(58, -73, 1.3, OUT);
      toon(PL([[36, -88], [38, -98], [42, -89]]), b, { shade: false, lw: 1.8 });
      dot(46, -82, 2.4, OUT); dot(45.3, -82.8, 0.8, '#fff');
      for (let i = 0; i < 4; i++) toon(E(30 - i * 3 + 4, -84 + i * 9, 4, 6), mn, { shade: false, lw: 1.6 });
      stroke([[50, -76], [40, -70], [30, -62]], '#5a3a22', 1.4);
    }
  } else if (dir === 0) {   // de frente
    if (layer === 'a') {
      leg(-16, -34, 33, 7, 1); leg(16, -34, 33, 7, 1);
      toon(E(0, -46, 24, 17), b, { sx: -3, sy: -3 });
      toon(RR(-20, -58, 40, 12, 4), M.saddle, { sx: -2, sy: -2 });
      leg(-9 + st * 0.5, -32, 31, 8, 0); leg(9 - st * 0.5, -32, 31, 8, 0);
    } else {
      toon((k) => { k.moveTo(-10, -76); k.quadraticCurveTo(-12, -46, 0, -40); k.quadraticCurveTo(12, -46, 10, -76); k.quadraticCurveTo(0, -84, -10, -76); k.closePath(); }, b, { sx: -2, sy: -2 });
      toon(E(0, -44, 9, 6.5), lt(b), { shade: false, lw: 1.8 }); dot(-3, -44, 1.4, OUT); dot(3, -44, 1.4, OUT);
      for (const s of [-1, 1]) { toon(PL([[s * 6, -78], [s * 9, -90], [s * 11, -76]]), b, { shade: false, lw: 1.8 }); dot(s * 7, -66, 2.4, OUT); dot(s * 7 - 0.7, -66.8, 0.8, '#fff'); }
      toon(E(0, -79, 6, 4), mn, { shade: false, lw: 1.6 });
      stroke([[-9, -58], [0, -52], [9, -58]], '#5a3a22', 1.4);
    }
  } else {   // de espaldas
    if (layer === 'a') {
      leg(-9 - st * 0.5, -32, 31, 8, 0); leg(9 + st * 0.5, -32, 31, 8, 0);
      toon(E(0, -46, 25, 18), b, { sx: -3, sy: -3 });
      toon(RR(-20, -60, 40, 12, 4), M.saddle, { sx: -2, sy: -2 });
      toon(PL([[-12, -82], [-8, -92], [-5, -80]]), b, { shade: false, lw: 1.8 }); toon(PL([[12, -82], [8, -92], [5, -80]]), b, { shade: false, lw: 1.8 });
    } else {
      toon((k) => { k.moveTo(-5, -44); k.quadraticCurveTo(-8, -26, 0, -16); k.quadraticCurveTo(8, -26, 5, -44); k.closePath(); }, mn, { shade: false });
    }
  }
  horseCache.set(key, c);
  return c;
}
/** Dibuja al héroe montado (ctx ya trasladado a sus pies). */
function drawMounted(ctx, c, spr, dir, flip) {
  const t = c.mount || 'caballo', f = c.frame || 0;
  ctx.save(); if (dir === 2 && flip) ctx.scale(-1, 1);
  ctx.drawImage(horseSprite(t, dir, f, 'a'), -FX, -FY, TW, TH);
  // jinete: sin las piernas, sentado en la silla
  const cut = 16, ry = dir === 2 ? -44 : -40;
  ctx.drawImage(spr, 0, 0, spr.width, (TH - cut) * TRES, -FX, -FY + ry, TW, TH - cut);
  if (dir === 2) { ctx.fillStyle = c.look ? '#3a2a24' : OUT; }
  ctx.drawImage(horseSprite(t, dir, f, 'b'), -FX, -FY, TW, TH);
  ctx.restore();
}

/* ---------------------------------------------------------- montar */
function toggleMount() {
  if (!hero || !playing || hero.dead) return;
  if (hero.mounted) { dismount(); return; }
  const id = hero.mounts[0];
  if (!id) { toast(`🐎 Aún no tienes montura. A partir del nivel ${MOUNTS.caballo.req} puedes comprar un caballo en los establos de Albor.`); return; }
  if (SC.kind !== 'world') { toast('Aquí dentro no puedes montar'); return; }
  if (hero.inCombat) { toast('No puedes montar en combate'); return; }
  hero.gather = { mount: id, p: 0 };
  gbar.style.display = 'block'; gbar.querySelector('span').textContent = `Llamando a ${MOUNTS[id].name}…`;
}
function finishMount(id) {
  hero.gather = null; gbar.style.display = 'none';
  hero.mounted = true; hero.mount = id; refreshLook();
  fx.push({ k: 'ring', x: hero.x, y: hero.y - 10, r: 60, t: 0, life: 0.5, c: '#ffe98a' });
}
function dismount() {
  if (!hero.mounted) return;
  hero.mounted = false; refreshLook();
  fx.push({ k: 'ring', x: hero.x, y: hero.y - 10, r: 50, t: 0, life: 0.4, c: '#e8dcc0' });
}
const mountSpeed = () => (hero.mounted ? MOUNTS[hero.mount || 'caballo'].speed : 1);

/* ---------------------------------------------------------- establos */
function openStable(n) {
  const rows = Object.entries(MOUNTS).map(([id, M]) => {
    const own = hero.mounts.includes(id);
    const btn = own ? '<em>Es tuyo</em>' : hero.lvl < M.req ? `<em class="down">Nivel ${M.req}</em>` : `<button class="ghost" data-buym="${id}" ${hero.gold >= M.price ? '' : 'disabled'}>Comprar · ${M.price} 🪙</button>`;
    return `<div class="lrow ${own || hero.lvl >= M.req ? '' : 'locked'}"><span class="li">${M.icon}</span><b>${M.name}<small>${M.desc} Velocidad ×${M.speed}.</small></b>${btn}</div>`;
  }).join('');
  openWin(`${head(`🐎 ${n.V.name} · Establos`)}<div class="wbody"><p class="sub">Desde el nivel 10 puedes tener tu propia montura. Para montar pulsa la tecla <b>Y</b> o el botón 🐎. Se desmonta al atacar, al recibir un golpe o al entrar en casas y mazmorras.</p>${rows}<p class="sub">Pronto llegarán más monturas…</p></div>`);
  bind('[data-buym]', (d) => {
    const M = MOUNTS[d.buym]; if (hero.gold < M.price || hero.lvl < M.req) return;
    hero.gold -= M.price; hero.mounts.push(d.buym);
    toast(`🐎 ¡Ya tienes tu <b>${M.name}</b>! Pulsa Y o el botón 🐎 para montar.`); buildBar(); save(); openStable(n);
  });
}
