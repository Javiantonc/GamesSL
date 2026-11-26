'use strict';
/* ============================================================ arranque */
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
  if (playing) update(dt);
  draw();
  if (playing) { hud(); if ((mmT -= dt) < 0) { mmT = 0.25; drawMinimap(); } } else drawPreview();
  requestAnimationFrame(frame);
}
buildWorld();
buildNpcs();
spawnMonsters();
spawnAnimals();
SC = WORLD; npcs = WORLD.npcs; mobs = WORLD.mobs;
buildMapBase();
resize();
renderCreator();
requestAnimationFrame(frame);
window.__px = { get hero() { return hero; }, get mobs() { return mobs; }, get SC() { return SC; }, use, opt, enterScene, enterPortal, enterDoor, nearAct, doAct, openShop, openProfs, PORTALS, WORLD, get T() { return T; } };
