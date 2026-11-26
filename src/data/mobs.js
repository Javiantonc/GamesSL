// Tipos de monstruo. builder = constructor en world/models.js
export const MOBS = {
  lobo: { name: 'Lobo gris', builder: 'wolf', pal: { a: 0x8a8f96, b: 0x6a6e74 }, speed: 5.5, range: 2.6, aspeed: 2.0, hpM: 0.9, dmgM: 1.0 },
  jabali: { name: 'Jabalí salvaje', builder: 'boar', pal: { a: 0x7a5232, b: 0x5a3a22 }, speed: 5, range: 2.6, aspeed: 2.4, hpM: 1.1, dmgM: 1.0, drop: { item: 'piel', chance: 0.65 } },
  limo: { name: 'Limo verde', builder: 'slime', pal: { a: 0x6fdc5a, b: 0x3f9a3a }, speed: 3.6, range: 2.4, aspeed: 2.2, hpM: 0.8, dmgM: 0.9 },
  bandido: { name: 'Bandido', builder: 'bandit', pal: { a: 0x7a4a3a, b: 0x3a3028, c: 0x5a2a2a }, speed: 5, range: 2.6, aspeed: 2.0, hpM: 1.0, dmgM: 1.1 },
  arana: { name: 'Araña del bosque', builder: 'spider', pal: { a: 0x3a3a2a, b: 0x2a2a1e, c: 0xd2c23b }, speed: 5.5, range: 2.8, aspeed: 1.8, hpM: 0.9, dmgM: 1.1 },
  lobosombra: { name: 'Lobo sombrío', builder: 'wolf', pal: { a: 0x3a3a48, b: 0x24242e }, speed: 6, range: 2.6, aspeed: 1.8, hpM: 1.0, dmgM: 1.1 },
  esqueleto: { name: 'Esqueleto errante', builder: 'skeleton', pal: { a: 0xe8e0cc, b: 0x5a5048 }, speed: 4.2, range: 2.8, aspeed: 2.2, hpM: 1.1, dmgM: 1.1, drop: { item: 'hueso', chance: 0.6 } },
  encapuchado: { name: 'Bandido encapuchado', builder: 'bandit', pal: { a: 0x2f4a2f, b: 0x2a2a22, c: 0x1f3a1f }, speed: 5, range: 2.6, aspeed: 1.8, hpM: 1.1, dmgM: 1.2 },
  oso: { name: 'Oso pardo', builder: 'bear', pal: { a: 0x6a4a2e, b: 0xa88060 }, speed: 5, range: 3.6, aspeed: 2.6, hpM: 1.6, dmgM: 1.4, scale: 1.1 },
  escorpion: { name: 'Escorpión rojo', builder: 'scorpion', pal: { a: 0xc0462a, b: 0x8a2a1a }, speed: 5, range: 2.8, aspeed: 1.9, hpM: 1.0, dmgM: 1.2 },
  golem: { name: 'Gólem de roca', builder: 'golem', pal: { a: 0xb06a3a, b: 0x8a4f2a, c: 0xffa030 }, speed: 3.6, range: 3.6, aspeed: 2.8, hpM: 1.8, dmgM: 1.4, drop: { item: 'nucleo', chance: 0.55 } },
  desertico: { name: 'Saqueador del cañón', builder: 'bandit', pal: { a: 0xc98a4a, b: 0x6a4a2a, c: 0xa8662a }, speed: 5.2, range: 2.6, aspeed: 1.8, hpM: 1.1, dmgM: 1.2 },
  momia: { name: 'Esqueleto del desierto', builder: 'skeleton', pal: { a: 0xd8c08a, b: 0x7a5a3a, c: 0xa8662a }, speed: 4.2, range: 2.8, aspeed: 2.0, hpM: 1.2, dmgM: 1.2 },
  // Bosque Invernal
  osopolar: { name: 'Oso polar', builder: 'bear', pal: { a: 0xf2f6fa, b: 0xc8d4de }, speed: 5.5, range: 3.8, aspeed: 2.4, hpM: 1.7, dmgM: 1.4, scale: 1.25 },
  esqhelado: { name: 'Esqueleto helado', builder: 'skeleton', pal: { a: 0xcfe8ff, b: 0x4a6a8a, c: 0x9ad8ff, eye: 0x7ad7ff }, speed: 4.6, range: 2.8, aspeed: 1.9, hpM: 1.3, dmgM: 1.3 },
  aranahielo: { name: 'Araña de escarcha', builder: 'spider', pal: { a: 0xaee0ff, b: 0x6a9ac0, c: 0x2f6aff }, speed: 6, range: 2.8, aspeed: 1.7, hpM: 1.2, dmgM: 1.3 },
  reina: { name: 'Reina Araña de Escarcha', builder: 'spider', pal: { a: 0x7ac8ff, b: 0x3a6a9a, c: 0xff3a6a }, speed: 5, range: 5, aspeed: 2.2, hpM: 1, dmgM: 1, scale: 3.2, boss: true },
  // espectros de mazmorra (se tiñen del color de la mazmorra)
  e_guerrero: { name: 'Guerrero espectral', builder: 'spec_warrior', spectre: true, speed: 4.6, range: 3, aspeed: 2.2, hpM: 1.2, dmgM: 1.2 },
  e_lobo: { name: 'Lobo espectral', builder: 'spec_wolf', spectre: true, speed: 6.2, range: 2.6, aspeed: 1.8, hpM: 0.9, dmgM: 1.1 },
  e_hechicero: { name: 'Hechicero espectral', builder: 'spec_caster', spectre: true, speed: 4, range: 18, aspeed: 2.6, hpM: 0.8, dmgM: 1.0, ranged: true },
  e_fatuo: { name: 'Fuego fatuo', builder: 'spec_wisp', spectre: true, speed: 4.5, range: 14, aspeed: 2.2, hpM: 0.7, dmgM: 0.9, ranged: true, fly: 0.6 },
  e_grifo: { name: 'Grifo espectral', builder: 'spec_griffin', spectre: true, speed: 6.5, range: 3.2, aspeed: 2.0, hpM: 1.1, dmgM: 1.2, fly: 1.2 },
};

/** Estadísticas de un monstruo de nivel l. */
export function mobStats(type, l, elite = 1) {
  const d = MOBS[type];
  return {
    hp: Math.round((38 + l * 26 + Math.pow(l, 1.7) * 2.2) * d.hpM * elite),
    dmg: (5 + l * 2.6 + Math.pow(l, 1.3) * 0.3) * 0.85 * d.dmgM * (elite > 1 ? 1.25 : 1),
  };
}

// Zonas del mundo: qué monstruos y en qué rango de nivel.
// area: función (x,z) => bool para colocar sub-grupos.
export const SPAWN_TABLE = [
  { zone: 'pradera', mob: 'lobo', lvl: [1, 4], n: 26, ring: [48, 95] },
  { zone: 'pradera', mob: 'limo', lvl: [2, 5], n: 20, ring: [50, 110], near: 'lake' },
  { zone: 'pradera', mob: 'jabali', lvl: [3, 6], n: 22, ring: [70, 120] },
  { zone: 'pradera', mob: 'bandido', lvl: [6, 9], n: 20, ring: [100, 150] },
  { zone: 'pradera', mob: 'arana', lvl: [8, 10], n: 12, ring: [90, 150], north: true },
  { zone: 'bosque', mob: 'lobosombra', lvl: [10, 13], n: 22 },
  { zone: 'bosque', mob: 'arana', lvl: [11, 15], n: 24 },
  { zone: 'bosque', mob: 'esqueleto', lvl: [13, 17], n: 22 },
  { zone: 'bosque', mob: 'encapuchado', lvl: [15, 18], n: 16 },
  { zone: 'bosque', mob: 'oso', lvl: [17, 20], n: 12 },
  { zone: 'canon', mob: 'escorpion', lvl: [20, 23], n: 22 },
  { zone: 'canon', mob: 'desertico', lvl: [22, 25], n: 16 },
  { zone: 'canon', mob: 'golem', lvl: [23, 27], n: 16 },
  { zone: 'canon', mob: 'momia', lvl: [25, 30], n: 16 },
  { zone: 'invierno', mob: 'osopolar', lvl: [76, 78], n: 18 },
  { zone: 'invierno', mob: 'esqhelado', lvl: [77, 79], n: 18 },
  { zone: 'invierno', mob: 'aranahielo', lvl: [78, 80], n: 16 },
];
