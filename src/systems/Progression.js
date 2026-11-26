export const MAX_LEVEL = 80;

/** XP necesaria para pasar del nivel `l` al `l+1`. Crece rápido: cada nivel cuesta bastante más que el anterior. */
export function xpForLevel(l) {
  return Math.floor(75 * Math.pow(l, 1.65));
}

/** XP que da un monstruo, con penalización estilo WoW si es "gris". */
export function xpFromMob(mobLevel, playerLevel, elite = false) {
  const diff = mobLevel - playerLevel;
  if (diff <= -6) return 0;
  const base = 25 + mobLevel * 8;
  const factor = Math.max(0.25, Math.min(1.5, 1 + diff * 0.12));
  return Math.round(base * factor * (elite ? 2.5 : 1));
}

/** Color del nivel del enemigo respecto al jugador (como en WoW). */
export function levelColor(mobLevel, playerLevel) {
  const d = mobLevel - playerLevel;
  if (d >= 5) return '#ff3b3b';
  if (d >= 3) return '#ff8a2b';
  if (d >= -2) return '#ffe14d';
  if (d >= -5) return '#4dff6a';
  return '#9b9b9b';
}
