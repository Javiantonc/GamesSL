// ============================================================
//  MAZMORRAS. Cada nivel de dificultad tiene su COLOR: el portal,
//  el suelo, los muros, los cristales y los monstruos de dentro se
//  tiñen con él para reconocerlo de un vistazo.
//  Cada portal cubre 8 niveles: 1-8, 9-16, … 73-80.
// ============================================================

let DUNGEON_TIERS_COUNT = 0;

export const DUNGEON_TIERS = [
  // 10 mazmorras, de 8 en 8 niveles. Botín: rareza mínima de los monstruos / del jefe.
  // Jefe = un espectro (ver gfx/spectres.js) teñido del color de la mazmorra.
  tier('emerald',  'Cripta Esmeralda',      'Verde',   '🟢', '#3ddc6a', 1,  ['slime', 'goblin'],            'Esmeralda', 'spectre_wisp',    'Fuego Fatuo Esmeralda',          'common',   'rare'),
  tier('cyan',     'Cavernas de Escarcha',  'Cian',    '💠', '#2fe0e0', 9,  ['slime', 'wolf', 'skeleton'],  'Glacial',   'spectre_wolf',    'Lobo Espectral Glacial',         'common',   'rare'),
  tier('sapphire', 'Grutas Abisales',       'Azul',    '🔵', '#3b6bff', 17, ['slime', 'skeleton', 'wolf'],  'Abisal',    'spectre_caster',  'Hechicero Espectral Abisal',     'uncommon', 'rare'),
  tier('amethyst', 'Santuario Arcano',      'Morado',  '🟣', '#a64dff', 25, ['skeleton', 'goblin'],         'Arcano',    'spectre_warrior', 'Guerrero Espectral Arcano',      'uncommon', 'epic'),
  tier('rose',     'Jardín Maldito',        'Rosa',    '🌸', '#ff5fc8', 33, ['slime', 'goblin', 'wolf'],    'Maldito',   'spectre_griffin', 'Grifo Espectral Maldito',        'uncommon', 'epic'),
  tier('amber',    'Minas de Ámbar',        'Naranja', '🟠', '#ff9a2b', 41, ['goblin', 'skeleton'],         'de Ámbar',  'spectre_wisp',    'Fuego Fatuo de Ámbar',           'rare',     'epic'),
  tier('ember',    'Forja Ígnea',           'Rojo',    '🔴', '#ff3b3b', 49, ['wolf', 'goblin', 'skeleton'], 'Ígneo',     'spectre_wolf',    'Lobo Espectral Ígneo',           'rare',     'epic'),
  tier('gold',     'Cámara del Rey Dorado', 'Dorado',  '🟡', '#ffd34d', 57, ['skeleton', 'goblin', 'wolf'], 'Dorado',    'spectre_caster',  'Hechicero del Rey Dorado',       'rare',     'legendary'),
  tier('silver',   'Ciudadela de Cristal',  'Blanco',  '⚪', '#e6f0ff', 65, ['skeleton', 'slime', 'wolf'],  'Cristalino', 'spectre_warrior', 'Guerrero Espectral de Cristal', 'epic',     'legendary'),
  tier('void',     'Abismo del Vacío',      'Negro',   '⚫', '#6d6488', 73, ['skeleton', 'wolf', 'goblin'], 'del Vacío', 'spectre_griffin', 'Grifo del Vacío',                'epic',     'legendary'),
];

function tier(id, name, colorName, emoji, color, minLevel, mobs, suffix, bossDef, bossName, minRarity, bossRarity) {
  const t = DUNGEON_TIERS_COUNT++;
  return {
    id, name, colorName, emoji, color, hex: parseInt(color.slice(1), 16),
    minLevel, maxLevel: minLevel + 7,
    dist: 24 + t * 10,                        // distancia (baldosas) del portal al inicio: más lejos = más difícil
    mobs, suffix, boss: { def: bossDef, name: bossName }, minRarity, bossRarity,
  };
}

export const DUNGEON_SIZE = 64;      // cada mazmorra ocupa 64x64 baldosas
export const DUNGEON_GAP = 4;        // separación entre mazmorras en el mapa
export const DUNGEON_TOP = 28;       // fila de la primera hilera de mazmorras
export const DUNGEONS_PER_ROW = 5;   // se colocan en 2 hileras de 5
export const DUNGEONS_TO_UNLOCK_WINTER = 10;   // mazmorras completadas para abrir el Bosque Invernal

/** Aclara un color hex mezclándolo con blanco (para teñir sprites sin oscurecerlos). */
export function lighten(hex, t = 0.45) {
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  const m = (c) => Math.round(c + (255 - c) * t);
  return (m(r) << 16) | (m(g) << 8) | m(b);
}
