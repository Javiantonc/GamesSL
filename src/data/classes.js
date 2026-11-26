// Clases jugables y sus habilidades (teclas 1-6). Se desbloquean por nivel.
// kind: cómo se resuelve en combat.js · power: daño/curación base
// coef: cuánto escala con el poder de ataque (AP) o de hechizo (SP)

export const MAX_LEVEL = 80;
export const GCD = 1.0;

export const ATTRS = {
  poder: { name: 'Poder', icon: '💪', desc: 'Aumenta el daño físico.' },
  agilidad: { name: 'Agilidad', icon: '🌀', desc: 'Más crítico y algo de daño físico.' },
  magia: { name: 'Magia', icon: '✨', desc: 'Aumenta el daño y la curación de hechizos y el maná.' },
  resistencia: { name: 'Resistencia', icon: '🛡️', desc: 'Más vida y armadura.' },
};
export const ATTR_POINTS_PER_LEVEL = 3;

export const CLASSES = {
  tanque: {
    name: 'Tanque', title: 'Guardián de acero', icon: '🛡️', color: '#c9d2dc',
    desc: 'Aguanta golpes enormes y protege. Usa Furia, que se llena al golpear y al recibir daño.',
    res: 'furia', resName: 'Furia', resColor: '#d23b3b',
    base: { poder: 8, agilidad: 4, magia: 2, resistencia: 10 }, grow: { poder: 1.4, agilidad: 0.5, magia: 0.2, resistencia: 1.8 },
    hp: 150, hpLvl: 24, auto: { range: 3.2, speed: 2.2, mult: 1 }, scale: 'ap',
    abilities: [
      { id: 'heroic', name: 'Golpe heroico', icon: '⚔️', lvl: 1, cost: 15, cd: 0, range: 3.4, kind: 'melee', power: 14, coef: 0.9, desc: 'Un golpe poderoso con el arma.' },
      { id: 'charge', name: 'Carga', icon: '🐂', lvl: 2, cost: -20, cd: 14, range: 25, minRange: 6, kind: 'dash', power: 8, coef: 0.4, stun: 1.5, desc: 'Cargas contra el objetivo, lo aturdes y ganas 20 de Furia.' },
      { id: 'thunder', name: 'Atronar', icon: '🌩️', lvl: 4, cost: 20, cd: 6, radius: 7, kind: 'aoe_self', power: 12, coef: 0.6, slow: 0.5, desc: 'Golpeas el suelo: daño a todos los enemigos cercanos y los ralentizas.' },
      { id: 'shieldbash', name: 'Golpe de escudo', icon: '🛡️', lvl: 6, cost: 10, cd: 12, range: 3.4, kind: 'melee', power: 10, coef: 0.5, stun: 2.5, desc: 'Aturde al objetivo 2,5 s.' },
      { id: 'shout', name: 'Grito intimidante', icon: '📢', lvl: 10, cost: 10, cd: 25, radius: 10, kind: 'debuff_aoe', weaken: 0.3, dur: 10, desc: 'Los enemigos cercanos hacen un 30% menos de daño durante 10 s.' },
      { id: 'wall', name: 'Muro de escudos', icon: '🧱', lvl: 14, cost: 0, cd: 60, kind: 'buff', buff: 'wall', dur: 8, desc: 'Recibes un 60% menos de daño durante 8 s.' },
    ],
  },
  asesino: {
    name: 'Asesino', title: 'Sombra veloz', icon: '🗡️', color: '#b48aff',
    desc: 'Golpes rápidos y críticos. Acumula puntos de combo y los gasta en remates. Usa Energía.',
    res: 'energia', resName: 'Energía', resColor: '#ffd84a',
    base: { poder: 6, agilidad: 10, magia: 2, resistencia: 5 }, grow: { poder: 1.0, agilidad: 1.8, magia: 0.2, resistencia: 0.9 },
    hp: 110, hpLvl: 18, auto: { range: 3.0, speed: 1.5, mult: 0.85, dual: true }, scale: 'ap',
    abilities: [
      { id: 'sinister', name: 'Puñalada', icon: '🗡️', lvl: 1, cost: 40, cd: 0, range: 3.2, kind: 'melee', power: 12, coef: 0.8, combo: 1, desc: 'Golpe rápido. +1 punto de combo.' },
      { id: 'evis', name: 'Evisceración', icon: '💥', lvl: 2, cost: 35, cd: 0, range: 3.2, kind: 'finisher', power: 10, coef: 0.55, desc: 'Remate: el daño crece con cada punto de combo (máx. 5).' },
      { id: 'step', name: 'Paso sombrío', icon: '🌑', lvl: 4, cost: 20, cd: 18, range: 25, kind: 'shadowstep', power: 0, desc: 'Apareces a la espalda del objetivo. Tu siguiente golpe hace +50%.' },
      { id: 'fan', name: 'Abanico de cuchillas', icon: '🌀', lvl: 6, cost: 45, cd: 4, radius: 7, kind: 'aoe_self', power: 11, coef: 0.55, combo: 1, desc: 'Lanzas cuchillas a todos los enemigos cercanos.' },
      { id: 'poison', name: 'Veneno letal', icon: '🧪', lvl: 10, cost: 30, cd: 8, range: 3.2, kind: 'dot', power: 40, coef: 1.2, dur: 10, combo: 1, desc: 'Envenena al objetivo: gran daño a lo largo de 10 s.' },
      { id: 'frenzy', name: 'Frenesí', icon: '⚡', lvl: 14, cost: 0, cd: 60, kind: 'buff', buff: 'frenzy', dur: 12, desc: 'Atacas un 50% más rápido y recuperas energía el doble de rápido durante 12 s.' },
    ],
  },
  mago: {
    name: 'Mago', title: 'Arcanista de fuego y hielo', icon: '🔥', color: '#7aa8ff',
    desc: 'Daño a distancia enorme con hechizos que se lanzan quieto. Frágil de cerca. Usa Maná.',
    res: 'mana', resName: 'Maná', resColor: '#3f8fff',
    base: { poder: 2, agilidad: 4, magia: 11, resistencia: 5 }, grow: { poder: 0.2, agilidad: 0.6, magia: 2.0, resistencia: 0.9 },
    hp: 100, hpLvl: 16, auto: { range: 25, speed: 2.0, mult: 0.6, wand: true }, scale: 'sp',
    abilities: [
      { id: 'fireball', name: 'Bola de fuego', icon: '🔥', lvl: 1, cost: 12, cd: 0, cast: 1.6, range: 30, kind: 'bolt', power: 22, coef: 1.0, color: 0xff7a2f, desc: 'Lanza una bola de fuego (1,6 s de lanzamiento).' },
      { id: 'frostbolt', name: 'Descarga de escarcha', icon: '❄️', lvl: 2, cost: 10, cd: 0, cast: 1.3, range: 30, kind: 'bolt', power: 16, coef: 0.8, slow: 0.5, color: 0x8fe6ff, desc: 'Daño de hielo que ralentiza al objetivo 4 s.' },
      { id: 'nova', name: 'Nova de escarcha', icon: '💠', lvl: 4, cost: 15, cd: 16, radius: 9, kind: 'aoe_self', power: 8, coef: 0.4, root: 4, desc: 'Congela en el sitio a los enemigos cercanos 4 s.' },
      { id: 'blink', name: 'Traslación', icon: '✨', lvl: 6, cost: 8, cd: 12, kind: 'blink', dist: 13, desc: 'Te teletransportas 13 m hacia delante.' },
      { id: 'meteor', name: 'Meteoro', icon: '☄️', lvl: 10, cost: 30, cd: 20, cast: 1.2, range: 30, radius: 7, kind: 'meteor', power: 50, coef: 1.6, desc: 'Un meteoro cae sobre el objetivo y daña a todos a su alrededor.' },
      { id: 'barrier', name: 'Barrera arcana', icon: '🔮', lvl: 14, cost: 20, cd: 30, kind: 'shield', power: 40, coef: 2.0, dur: 15, desc: 'Un escudo que absorbe daño durante 15 s.' },
    ],
  },
  support: {
    name: 'Support', title: 'Sacerdotisa de la luz', icon: '✨', color: '#ffe08a',
    desc: 'Se cura, protege y castiga con luz sagrada. Difícil de tumbar. Usa Maná.',
    res: 'mana', resName: 'Maná', resColor: '#3f8fff',
    base: { poder: 3, agilidad: 3, magia: 9, resistencia: 8 }, grow: { poder: 0.3, agilidad: 0.4, magia: 1.6, resistencia: 1.3 },
    hp: 120, hpLvl: 19, auto: { range: 3.2, speed: 2.2, mult: 0.9 }, scale: 'sp',
    abilities: [
      { id: 'smite', name: 'Castigo', icon: '🌟', lvl: 1, cost: 10, cd: 0, cast: 1.4, range: 28, kind: 'bolt', power: 18, coef: 0.9, color: 0xffe98a, desc: 'Lanza luz sagrada al objetivo.' },
      { id: 'heal', name: 'Sanar', icon: '💖', lvl: 1, cost: 18, cd: 0, cast: 1.8, kind: 'heal', power: 40, coef: 1.6, desc: 'Te curas una gran cantidad de vida.' },
      { id: 'pain', name: 'Palabra de dolor', icon: '💜', lvl: 4, cost: 12, cd: 0, range: 28, kind: 'dot', power: 30, coef: 1.0, dur: 12, desc: 'Daño de sombra a lo largo de 12 s.' },
      { id: 'pshield', name: 'Escudo sagrado', icon: '🛡️', lvl: 6, cost: 16, cd: 10, kind: 'shield', power: 35, coef: 1.4, dur: 15, desc: 'Absorbe daño durante 15 s.' },
      { id: 'renew', name: 'Renovar', icon: '🌿', lvl: 10, cost: 14, cd: 0, kind: 'hot', power: 50, coef: 1.5, dur: 12, desc: 'Curación a lo largo de 12 s.' },
      { id: 'holyfire', name: 'Fuego sagrado', icon: '☀️', lvl: 14, cost: 25, cd: 12, radius: 8, kind: 'aoe_self', power: 22, coef: 1.0, heal: 0.5, desc: 'Explosión de luz: daña a los enemigos cercanos y te cura la mitad del daño.' },
    ],
  },
};

export function xpToLevel(l) { return Math.floor(120 + l * l * 18 + l * 60); }
export function mobXp(mobLvl, plLvl) {
  const base = 18 + mobLvl * 7;
  const diff = mobLvl - plLvl;
  if (diff <= -8) return 0;
  return Math.round(base * Math.max(0.2, Math.min(1.4, 1 + diff * 0.1)));
}
