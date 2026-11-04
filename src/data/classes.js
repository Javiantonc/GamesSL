// ============================================================
//  CLASES. Cada clase multiplica atributos (mods), da bonos
//  pasivos (bonus) y desbloquea su propio set de habilidades
//  (ver `cls` en data/abilities.js).
// ============================================================

export const CLASSES = {
  assassin: {
    id: 'assassin', name: 'Asesino', icon: '🗡️', role: 'Daño cuerpo a cuerpo', color: '#b77dff', tint: 0x8a5ad8,
    desc: 'Ágil y letal. Críticos devastadores y gran movilidad.',
    mods: { agility: 1.3 },
    bonus: { critAdd: 10, speedMult: 1.1 },
    perks: ['Agilidad ×1,3', '+10% prob. de crítico', '+10% velocidad'],
  },
  mage: {
    id: 'mage', name: 'Mago', icon: '🔮', role: 'Daño mágico a distancia', color: '#5fb4ff', tint: 0x3f7fe0,
    desc: 'Domina el fuego y el hielo. Mucho daño, poca armadura.',
    mods: { intellect: 1.3 },
    bonus: { spellPowerMult: 1.15, maxManaMult: 1.2 },
    perks: ['Magia ×1,3', '+15% poder con hechizos', '+20% maná máximo', 'Nv 50: ejército de sombras'],
  },
  tank: {
    id: 'tank', name: 'Tanque', icon: '🛡️', role: 'Resistencia y control', color: '#ffb84d', tint: 0xa8a8b8,
    desc: 'Aguanta golpes que tumbarían a cualquiera y provoca a los enemigos.',
    mods: { stamina: 1.4 },
    bonus: { armorMult: 1.5, armorAdd: 20, drAdd: 0.05 },
    perks: ['Resistencia ×1,4', 'Armadura ×1,5 (+20)', '+5% reducción de daño'],
  },
  support: {
    id: 'support', name: 'Support', icon: '✨', role: 'Curación y apoyo', color: '#7dff6a', tint: 0xf4efd8,
    desc: 'Luz sagrada que cura, protege y potencia. Difícil de matar.',
    mods: { intellect: 1.15, stamina: 1.15 },
    bonus: { healMult: 1.35, manaRegenMult: 1.5 },
    perks: ['Magia y Resistencia ×1,15', '+35% curación', '+50% regeneración de maná'],
  },
};

/** Atributos que el jugador puede mejorar con puntos (clave interna -> nombre). */
export const ATTRIBUTES = {
  strength:  { name: 'Poder',       icon: '💪', effect: '+2 por punto · +2,4 poder de ataque' },
  stamina:   { name: 'Resistencia', icon: '❤️', effect: '+2 por punto · +20 vida máxima' },
  agility:   { name: 'Agilidad',    icon: '🏃', effect: '+2 por punto · +0,3% crítico, +1 poder de ataque' },
  intellect: { name: 'Magia',       icon: '🔮', effect: '+2 por punto · +16 maná, +2,2 poder con hechizos' },
};
export const ATTR_PER_POINT = 2;
export const ATTR_POINTS_PER_LEVEL = 3;
export const SKILL_POINTS_PER_LEVEL = 1;
