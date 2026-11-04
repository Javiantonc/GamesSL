// ============================================================
//  MONSTRUOS. Estadísticas base + crecimiento por nivel.
//  biomes: dónde aparecen. loot: materiales que pueden soltar.
// ============================================================

export const MOBS = {
  slime: {
    id: 'slime', name: 'Limo Saltarín', texture: 'm_slime', biomes: ['grass'],
    hp: 30, hpPerLvl: 14, dmg: 4, dmgPerLvl: 1.6, speed: 70, aggro: 140, range: 34, atkMs: 1600,
    anim: 'hop', facesLeft: false, loot: ['gel'],
  },
  wolf: {
    id: 'wolf', name: 'Lobo del Bosque', texture: 'm_wolf', biomes: ['forest'],
    hp: 40, hpPerLvl: 16, dmg: 6, dmgPerLvl: 2, speed: 125, aggro: 190, range: 38, atkMs: 1300,
    anim: 'trot', facesLeft: true, loot: ['meat'],
  },
  goblin: {
    id: 'goblin', name: 'Goblin Saqueador', texture: 'm_goblin', biomes: ['grass', 'sand'],
    hp: 50, hpPerLvl: 18, dmg: 7, dmgPerLvl: 2.2, speed: 95, aggro: 170, range: 36, atkMs: 1400,
    anim: 'walk', facesLeft: false, loot: ['cloth', 'berries'],
  },
  skeleton: {
    id: 'skeleton', name: 'Esqueleto Errante', texture: 'm_skeleton', biomes: ['hill'],
    hp: 60, hpPerLvl: 20, dmg: 8, dmgPerLvl: 2.6, speed: 85, aggro: 180, range: 38, atkMs: 1500,
    anim: 'walk', facesLeft: false, loot: ['bone', 'cloth'],
  },

  // ---------- Bosque Invernal (niveles 76-88) ----------
  polarbear: {
    id: 'polarbear', name: 'Oso Polar', texture: 'm_polarbear', biomes: ['winter'],
    hp: 95, hpPerLvl: 34, dmg: 13, dmgPerLvl: 3.6, speed: 95, aggro: 180, range: 48, atkMs: 1700,
    anim: 'walk', facesLeft: false, loot: ['fur', 'meat'], attack: 'cleave',
  },
  frostSkeleton: {
    id: 'frostSkeleton', name: 'Esqueleto de Escarcha', texture: 'm_skeleton', tint: 0xa9dcff, biomes: ['winter'],
    hp: 75, hpPerLvl: 27, dmg: 11, dmgPerLvl: 3.3, speed: 95, aggro: 200, range: 40, atkMs: 1300,
    anim: 'walk', facesLeft: false, loot: ['bone', 'frost_crystal'],
  },
  frostSpider: {
    id: 'frostSpider', name: 'Araña de Escarcha', texture: 'm_spider', biomes: ['winter'],
    hp: 62, hpPerLvl: 23, dmg: 11, dmgPerLvl: 3.4, speed: 155, aggro: 230, range: 40, atkMs: 1000,
    anim: 'scuttle', facesLeft: false, loot: ['frost_crystal'], bossScale: 2.6,
  },

  // ---------- Jefes espectrales de las mazmorras (no aparecen fuera) ----------
  spectre_wisp: {
    id: 'spectre_wisp', name: 'Fuego Fatuo', texture: 'spec_wisp', texScale: 0.5, biomes: [], spectre: true,
    hp: 55, hpPerLvl: 20, dmg: 7, dmgPerLvl: 2.4, speed: 80, aggro: 280, range: 240, atkMs: 1500,
    anim: 'float', loot: [], attack: 'ranged', selfHeal: true, bossScale: 2.6,
  },
  spectre_wolf: {
    id: 'spectre_wolf', name: 'Lobo Espectral', texture: 'spec_wolf', texScale: 0.5, biomes: [], spectre: true,
    hp: 55, hpPerLvl: 20, dmg: 8, dmgPerLvl: 2.6, speed: 165, aggro: 280, range: 46, atkMs: 900,
    anim: 'trot', loot: [], attack: 'melee', bossScale: 1.9,
  },
  spectre_caster: {
    id: 'spectre_caster', name: 'Hechicero Espectral', texture: 'spec_caster', texScale: 0.5, biomes: [], spectre: true,
    hp: 50, hpPerLvl: 18, dmg: 9, dmgPerLvl: 2.8, speed: 85, aggro: 300, range: 260, atkMs: 1600,
    anim: 'float', loot: [], attack: 'ranged', bossScale: 2.0,
  },
  spectre_warrior: {
    id: 'spectre_warrior', name: 'Guerrero Espectral', texture: 'spec_warrior', texScale: 0.5, biomes: [], spectre: true,
    hp: 70, hpPerLvl: 25, dmg: 9, dmgPerLvl: 2.8, speed: 95, aggro: 280, range: 58, atkMs: 1500,
    anim: 'float', loot: [], attack: 'cleave', bossScale: 2.0,
  },
  spectre_griffin: {
    id: 'spectre_griffin', name: 'Grifo Espectral', texture: 'spec_griffin', texScale: 0.5, biomes: [], spectre: true,
    hp: 65, hpPerLvl: 23, dmg: 10, dmgPerLvl: 3, speed: 120, aggro: 320, range: 90, atkMs: 1800,
    anim: 'fly', loot: [], attack: 'dive', fly: true, bossScale: 1.35,
  },
};
