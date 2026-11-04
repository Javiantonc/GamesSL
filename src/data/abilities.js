// ============================================================
//  HABILIDADES. `cls` = 'common' o el id de una clase.
//  Se desbloquean por nivel y se mejoran con puntos de habilidad
//  hasta el rango MAX_RANK (más potencia y menos reutilización).
//
//  kind: melee | projectile | nova | heal | dash | whirl | meteor
//        | shield | buff | hot | taunt
//  Potencia = (base + ap*PoderAtaque + sp*PoderHechizos + weapon*DañoArma) × rango
// ============================================================

export const GCD = 1000;
export const MAX_RANK = 10;
export const RANK_POWER = 0.2;   // +20% potencia por rango
export const RANK_CD = 0.04;     // -4% reutilización por rango

export const ABILITIES = {
  // ------------------------- COMÚN -------------------------
  strike: {
    cls: 'common', name: 'Ataque', icon: '⚔️', unlockLevel: 1, kind: 'melee',
    cooldown: 0, mana: 0, range: 72, needsTarget: true, base: 6, ap: 0.6, weapon: 1,
    desc: 'Ataque básico (clic derecho). Golpea a tu objetivo con tu arma.',
  },

  // ------------------------- ASESINO -------------------------
  backstab: {
    cls: 'assassin', name: 'Puñalada Letal', icon: '🗡️', unlockLevel: 1, kind: 'melee',
    cooldown: 4, mana: 8, range: 72, needsTarget: true, base: 12, ap: 1.1, weapon: 1.2, critBonus: 25,
    desc: 'Puñalada precisa con +25% de probabilidad de crítico.',
  },
  throwKnives: {
    cls: 'assassin', name: 'Cuchillas Arrojadizas', icon: '🔪', unlockLevel: 4, kind: 'projectile',
    cooldown: 3, mana: 10, range: 300, needsTarget: true, base: 9, ap: 0.8, speed: 650, projTint: 0xd0d0ff,
    desc: 'Lanzas una cuchilla rápida a tu objetivo.',
  },
  shadowStep: {
    cls: 'assassin', name: 'Paso Sombrío', icon: '🌑', unlockLevel: 9, kind: 'dash',
    cooldown: 10, mana: 12, range: 300, distanceMs: 200, base: 10, ap: 0.9,
    desc: 'Te deslizas entre las sombras hasta tu objetivo y le apuñalas.',
  },
  bladeFan: {
    cls: 'assassin', name: 'Abanico de Cuchillas', icon: '🌀', unlockLevel: 16, kind: 'whirl',
    cooldown: 7, mana: 15, radius: 100, base: 10, ap: 0.8, weapon: 0.6,
    desc: 'Golpeas a todos los enemigos a tu alrededor.',
  },
  frenzy: {
    cls: 'assassin', name: 'Frenesí', icon: '😈', unlockLevel: 25, kind: 'buff',
    cooldown: 30, mana: 20, duration: 8000, buff: { critAdd: 30, speedMult: 1.25 }, color: 0xb04dff,
    desc: '+30% de crítico y +25% de velocidad durante 8 s.',
  },

  // ------------------------- MAGO -------------------------
  fireball: {
    cls: 'mage', name: 'Bola de Fuego', icon: '🔥', unlockLevel: 1, kind: 'projectile',
    cooldown: 2, mana: 10, range: 340, needsTarget: true, base: 10, sp: 1.0, speed: 480, color: 0xff8a1f,
    desc: 'Una bola de fuego que persigue a tu objetivo.',
  },
  frostNova: {
    cls: 'mage', name: 'Nova de Escarcha', icon: '❄️', unlockLevel: 4, kind: 'nova',
    cooldown: 12, mana: 18, radius: 120, base: 8, sp: 0.5, slow: 0.55, slowMs: 4000, color: 0x8fd8ff,
    desc: 'Explosión helada que daña y ralentiza a los enemigos cercanos.',
  },
  arcaneShield: {
    cls: 'mage', name: 'Escudo Arcano', icon: '🔷', unlockLevel: 9, kind: 'shield',
    cooldown: 25, mana: 25, base: 40, sp: 2, duration: 10000,
    desc: 'Un escudo que absorbe daño durante 10 s.',
  },
  meteor: {
    cls: 'mage', name: 'Meteoro', icon: '☄️', unlockLevel: 16, kind: 'meteor',
    cooldown: 25, mana: 40, range: 360, needsTarget: true, radius: 130, base: 40, sp: 2.2, delay: 800,
    desc: 'Un meteoro cae sobre tu objetivo y daña todo lo que hay en la zona.',
  },
  shadowRecruit: {
    cls: 'mage', name: 'Reclutar Sombras', icon: '👥', unlockLevel: 50, kind: 'recruit',
    cooldown: 4, mana: 30,
    desc: 'Alza como espectros aliados a los enemigos derrotados cerca de ti (dejan una esencia turquesa 12 s). '
      + 'Goblin → Guerrero (tanque), Lobo → Lobo (rápido), Esqueleto → Hechicero (distancia), Limo → Fuego Fatuo (cura), Jefe → Grifo (vuela, área). '
      + 'Capacidad: 3 a nivel 50, +1 cada 5 niveles y +1 por cada 3 rangos.',
  },
  shadowFury: {
    cls: 'mage', name: 'Furia Sombría', icon: '🌑', unlockLevel: 60, kind: 'armybuff',
    cooldown: 30, mana: 35, duration: 10000,
    desc: 'Tu ejército de espectros se cura un 50% y gana +60% de daño, +30% de velocidad y ataques más rápidos durante 10 s.',
  },
  arcanePower: {
    cls: 'mage', name: 'Poder Arcano', icon: '💥', unlockLevel: 25, kind: 'buff',
    cooldown: 40, mana: 25, duration: 10000, buff: { dmgMult: 1.4 }, color: 0x7fb8ff,
    desc: '+40% de daño durante 10 s.',
  },

  // ------------------------- TANQUE -------------------------
  shieldBash: {
    cls: 'tank', name: 'Golpe de Escudo', icon: '🛡️', unlockLevel: 1, kind: 'melee',
    cooldown: 5, mana: 6, range: 72, needsTarget: true, base: 9, ap: 0.8, slow: 0.5, slowMs: 3000,
    desc: 'Golpeas con el escudo y ralentizas al objetivo un 50%.',
  },
  taunt: {
    cls: 'tank', name: 'Grito Desafiante', icon: '📢', unlockLevel: 4, kind: 'taunt',
    cooldown: 10, mana: 10, radius: 170, base: 5, ap: 0.4, color: 0xffb84d,
    desc: 'Provocas a todos los enemigos cercanos para que vengan a por ti.',
  },
  shieldWall: {
    cls: 'tank', name: 'Muro de Escudos', icon: '🧱', unlockLevel: 9, kind: 'buff',
    cooldown: 25, mana: 15, duration: 8000, buff: { drAdd: 0.4 }, color: 0xffd34d,
    desc: '+40% de reducción de daño durante 8 s.',
  },
  charge: {
    cls: 'tank', name: 'Carga', icon: '💨', unlockLevel: 16, kind: 'dash',
    cooldown: 10, mana: 0, range: 300, distanceMs: 220, base: 6, ap: 0.5,
    desc: 'Cargas contra tu objetivo y le golpeas al llegar.',
  },
  whirlwind: {
    cls: 'tank', name: 'Torbellino', icon: '🌪️', unlockLevel: 25, kind: 'whirl',
    cooldown: 7, mana: 12, radius: 100, base: 8, ap: 0.7, weapon: 0.6,
    desc: 'Giras con tu arma golpeando a todo lo que te rodea.',
  },

  // ------------------------- SUPPORT -------------------------
  holyBolt: {
    cls: 'support', name: 'Rayo Sagrado', icon: '🌟', unlockLevel: 1, kind: 'projectile',
    cooldown: 2, mana: 8, range: 320, needsTarget: true, base: 8, sp: 0.85, speed: 520, projTint: 0xfff3a0,
    desc: 'Un rayo de luz que daña a tu objetivo.',
  },
  heal: {
    cls: 'support', name: 'Luz Sanadora', icon: '💚', unlockLevel: 4, kind: 'heal',
    cooldown: 8, mana: 20, base: 30, sp: 1.6, color: 0x9cff7a,
    desc: 'Te curas al instante.',
  },
  renew: {
    cls: 'support', name: 'Renovar', icon: '🌿', unlockLevel: 9, kind: 'hot',
    cooldown: 12, mana: 18, base: 40, sp: 2.0, duration: 8000, color: 0x7dff6a,
    desc: 'Te cura poco a poco durante 8 s.',
  },
  holyShield: {
    cls: 'support', name: 'Escudo Sagrado', icon: '🔰', unlockLevel: 16, kind: 'shield',
    cooldown: 25, mana: 25, base: 50, sp: 2.2, duration: 10000,
    desc: 'Un escudo de luz que absorbe daño durante 10 s.',
  },
  blessing: {
    cls: 'support', name: 'Bendición', icon: '👼', unlockLevel: 25, kind: 'buff',
    cooldown: 40, mana: 25, duration: 15000, buff: { dmgMult: 1.2, drAdd: 0.15, regenMult: 2 }, color: 0xfff3a0,
    desc: '+20% de daño, +15% de reducción de daño y el doble de regeneración durante 15 s.',
  },
};

for (const [id, ab] of Object.entries(ABILITIES)) ab.id = id;

/** Multiplicador de potencia según el rango. */
export const rankPower = (rank) => 1 + RANK_POWER * (rank - 1);
/** Reutilización efectiva (s) según el rango. */
export const rankCooldown = (ab, rank) => ab.cooldown * (1 - RANK_CD * (rank - 1));
