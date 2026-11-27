'use strict';
/* =========================================================================
   HABILIDADES: 20 por clase. Llevas 5 equipadas:
     ranura 1 = ataque básico · ranuras 2-5 = habilidades de la clase.
   Se aprenden y se mejoran (rangos 1-5) con el instructor de tu clase,
   en los niveles pares. Cambia las equipadas en el libro (tecla K).
   Tipos: melee · bolt (proyectil) · multi (varios objetivos) · nova (área
   alrededor) · ground (zona que hace daño cada segundo) · meteor (área en
   el objetivo, con retraso) · charge (cargar contra el objetivo) · blink ·
   heal · shield · buff · stealth.
   Modificadores: dot/ticks, stun, slow, ls (robo de vida), exec (×2 si el
   enemigo tiene menos del 30 % de vida), heal (en nova), up (más daño).
   ========================================================================= */
const ABILS = {};
const ABIL = {};
function defAbils(cls, list) {
  ABILS[cls] = list.map(([id, name, icon, req, kind, p]) => {
    const a = { id: `${cls}.${id}`, cls, name, icon, req, kind, ...p };
    if (a.cd == null) a.cd = 6;
    ABIL[a.id] = a;
    return a;
  });
}
defAbils('picaro', [
  ['b1', 'Cuchillada', '🗡️', 1, 'melee', { basic: true, dmg: 9, cd: 0.45, range: 46 }],
  ['b2', 'Golpe siniestro', '🔪', 8, 'melee', { basic: true, dmg: 12, cd: 0.5, range: 48 }],
  ['b3', 'Mutilar', '🩸', 16, 'melee', { basic: true, dmg: 15, cd: 0.55, range: 48, dot: 3, ticks: 3 }],
  ['veneno', 'Puñalada venenosa', '🧪', 1, 'melee', { dmg: 12, dot: 5, ticks: 4, cd: 6, range: 46, color: '#8ae06a' }],
  ['evisc', 'Eviscerar', '💥', 2, 'melee', { dmg: 26, cd: 8, range: 48, exec: true, color: '#ff6a5a' }],
  ['patada', 'Patada', '🦶', 4, 'melee', { dmg: 6, stun: 2, cd: 10, range: 48 }],
  ['sprint', 'Sprint', '💨', 4, 'buff', { speed: 1.6, dur: 4, cd: 15, color: '#c8f0ff' }],
  ['sigilo', 'Sigilo', '🌫️', 6, 'stealth', { dur: 6, mult: 3, cd: 20 }],
  ['abanico', 'Abanico de cuchillas', '🌪️', 6, 'nova', { dmg: 14, radius: 72, cd: 7, color: '#e8e8f0' }],
  ['cuchillos', 'Cuchillos arrojadizos', '🔪', 8, 'multi', { dmg: 10, n: 3, range: 240, speed: 460, cd: 6, color: '#d8e0ea' }],
  ['golpebajo', 'Golpe bajo', '👊', 10, 'melee', { dmg: 14, stun: 3, cd: 15, range: 48 }],
  ['evasion', 'Evasión', '🍃', 10, 'shield', { abs: 0.35, dur: 6, cd: 25, color: '#c8f0ff' }],
  ['hemo', 'Hemorragia', '🩸', 12, 'melee', { dmg: 10, dot: 7, ticks: 5, cd: 8, range: 48, color: '#e04a4a' }],
  ['paso', 'Paso sombrío', '👤', 12, 'charge', { dmg: 18, range: 280, cd: 10, color: '#6a5a8a' }],
  ['humo', 'Bomba de humo', '💨', 14, 'nova', { dmg: 6, stun: 2.5, radius: 110, cd: 18, color: '#9a9aa8' }],
  ['mortal', 'Veneno mortal', '☠️', 14, 'melee', { dmg: 20, dot: 10, ticks: 5, cd: 9, range: 48, color: '#5ad040' }],
  ['embosc', 'Emboscada', '🌑', 16, 'melee', { dmg: 45, cd: 14, range: 48, color: '#b07ae0' }],
  ['danza', 'Danza de las sombras', '🌘', 18, 'buff', { up: 0.4, dur: 8, cd: 30, color: '#8a6ab0' }],
  ['letal', 'Estocada letal', '⚡', 20, 'melee', { dmg: 70, exec: true, cd: 16, range: 50, color: '#ffd27a' }],
  ['venen', 'Hoja envenenada', '🐍', 2, 'buff', { up: 0.15, dur: 15, cd: 30, color: '#8ae06a' }],
  ['ambi', 'Ambidextría', '⚔️', 4, 'passive', { dual: true }],
]);
defAbils('mago', [
  ['b1', 'Chispa arcana', '✨', 1, 'bolt', { basic: true, dmg: 7, cd: 0.6, range: 260, color: '#9ad8ff', speed: 420 }],
  ['b2', 'Proyectil de escarcha', '❄️', 8, 'bolt', { basic: true, dmg: 10, slow: 2, cd: 0.65, range: 270, color: '#a8e8ff', speed: 420 }],
  ['b3', 'Misiles arcanos', '🌠', 16, 'multi', { basic: true, dmg: 8, n: 3, cd: 0.8, range: 280, color: '#d0a0ff', speed: 480 }],
  ['fuego', 'Bola de fuego', '🔥', 1, 'bolt', { dmg: 26, cd: 5, range: 300, color: '#ff8a2a', speed: 320, big: true }],
  ['nova', 'Nova de escarcha', '❄️', 2, 'nova', { dmg: 8, slow: 4, radius: 110, cd: 9, color: '#a8e8ff' }],
  ['escudo', 'Escudo de maná', '🔵', 4, 'shield', { abs: 0.3, dur: 8, cd: 18, color: '#5aa0ff' }],
  ['trasla', 'Traslación', '💫', 4, 'blink', { dist: 230, cd: 12, color: '#d0a0ff' }],
  ['explo', 'Explosión arcana', '💜', 6, 'nova', { dmg: 18, radius: 92, cd: 6, color: '#d0a0ff' }],
  ['lanza', 'Lanza de hielo', '🧊', 6, 'bolt', { dmg: 22, stun: 1, cd: 6, range: 280, color: '#a8e8ff', speed: 480 }],
  ['ventisca', 'Ventisca', '🌨️', 8, 'ground', { dmg: 7, radius: 120, dur: 6, slow: 2, cd: 14, range: 300, color: '#a8e8ff' }],
  ['evoca', 'Evocación', '🔋', 8, 'heal', { heal: 0.35, cd: 30, color: '#9ad8ff' }],
  ['poli', 'Polimorfia', '🐑', 10, 'bolt', { dmg: 2, stun: 5, cd: 15, range: 260, color: '#ffb0e0', speed: 420 }],
  ['piro', 'Piroexplosión', '☄️', 10, 'meteor', { dmg: 50, radius: 70, delay: 0.8, cd: 12, range: 300, color: '#ff8a2a' }],
  ['llama', 'Llamarada', '🔥', 12, 'ground', { dmg: 9, radius: 100, dur: 5, cd: 12, range: 300, color: '#ff8a2a' }],
  ['barrera', 'Barrera de hielo', '🧊', 12, 'shield', { abs: 0.5, dur: 10, cd: 30, color: '#a8e8ff' }],
  ['descarga', 'Descarga arcana', '🔮', 14, 'bolt', { dmg: 40, cd: 8, range: 300, color: '#d0a0ff', speed: 380, big: true }],
  ['combus', 'Combustión', '🌋', 14, 'buff', { up: 0.35, dur: 10, cd: 35, color: '#ff8a2a' }],
  ['meteoro', 'Meteoro', '🌑', 16, 'meteor', { dmg: 90, radius: 110, delay: 1.4, cd: 20, range: 320, color: '#ff6a2a' }],
  ['cometa', 'Cometa helado', '🌌', 18, 'multi', { dmg: 25, n: 5, slow: 3, cd: 12, range: 320, color: '#a8e8ff', speed: 420 }],
  ['super', 'Supernova', '🌟', 20, 'nova', { dmg: 70, stun: 1.5, radius: 150, cd: 25, color: '#fff0a0' }],
]);
defAbils('paladin', [
  ['b1', 'Golpe de maza', '🔨', 1, 'melee', { basic: true, dmg: 10, cd: 0.7, range: 46 }],
  ['b2', 'Golpe de cruzado', '✝️', 8, 'melee', { basic: true, dmg: 13, ls: 0.1, cd: 0.7, range: 48, color: '#ffe98a' }],
  ['b3', 'Martillo del justo', '⚒️', 16, 'melee', { basic: true, dmg: 16, ls: 0.15, cd: 0.75, range: 50, color: '#ffe98a' }],
  ['luz', 'Luz sagrada', '✨', 1, 'nova', { dmg: 10, heal: 0.4, cd: 8, radius: 80, color: '#ffe98a' }],
  ['juicio', 'Juicio', '⚖️', 2, 'bolt', { dmg: 16, cd: 6, range: 220, color: '#ffe98a', speed: 460 }],
  ['martillo', 'Martillo de justicia', '🔨', 4, 'bolt', { dmg: 8, stun: 3, cd: 12, range: 240, color: '#ffd27a', speed: 400 }],
  ['poderio', 'Bendición de poderío', '💪', 4, 'buff', { up: 0.2, dur: 12, cd: 25, color: '#ffd27a' }],
  ['consagra', 'Consagración', '🔆', 6, 'ground', { dmg: 6, radius: 100, dur: 6, self: true, cd: 10, color: '#ffe98a' }],
  ['destello', 'Destello de luz', '💛', 6, 'heal', { heal: 0.3, cd: 8, color: '#ffe98a' }],
  ['vengador', 'Escudo de vengador', '🛡️', 8, 'multi', { dmg: 14, n: 3, stun: 1, cd: 9, range: 260, color: '#ffd27a', speed: 460 }],
  ['exorc', 'Exorcismo', '🌞', 10, 'bolt', { dmg: 28, cd: 8, range: 280, color: '#fff0a0', speed: 380, big: true }],
  ['divino', 'Escudo divino', '🟡', 10, 'shield', { abs: 0.8, dur: 6, cd: 45, color: '#ffe98a' }],
  ['manos', 'Imposición de manos', '🙌', 12, 'heal', { heal: 1, cd: 60, color: '#ffe98a' }],
  ['ira', 'Cólera vengativa', '😇', 12, 'buff', { up: 0.35, dur: 12, cd: 35, color: '#ffd27a' }],
  ['tormenta', 'Tormenta divina', '🌀', 14, 'nova', { dmg: 24, heal: 0.1, radius: 92, cd: 7, color: '#ffe98a' }],
  ['iramart', 'Martillo de cólera', '⚡', 14, 'bolt', { dmg: 45, exec: true, cd: 9, range: 260, color: '#ffd27a', speed: 460 }],
  ['carga', 'Carga sagrada', '🐎', 16, 'charge', { dmg: 22, stun: 1.5, range: 300, cd: 12, color: '#ffe98a' }],
  ['final', 'Juicio final', '☀️', 18, 'meteor', { dmg: 80, radius: 100, delay: 0.8, cd: 16, range: 300, color: '#fff0a0' }],
  ['amanecer', 'Amanecer', '🌅', 20, 'nova', { dmg: 50, heal: 0.6, radius: 160, cd: 25, color: '#fff0a0' }],
  ['devocion', 'Aura de devoción', '🔰', 2, 'shield', { abs: 0.2, dur: 10, cd: 20, color: '#ffd27a' }],
]);
defAbils('guerrero', [
  ['b1', 'Tajo', '🪓', 1, 'melee', { basic: true, dmg: 12, cd: 0.75, range: 50 }],
  ['b2', 'Golpe heroico', '⚔️', 8, 'melee', { basic: true, dmg: 15, cd: 0.75, range: 52 }],
  ['b3', 'Golpe mortal', '💀', 16, 'melee', { basic: true, dmg: 19, cd: 0.8, range: 52, dot: 3, ticks: 3 }],
  ['torbe', 'Torbellino', '🌀', 1, 'nova', { dmg: 16, cd: 6, radius: 76, color: '#ffffff' }],
  ['carga', 'Carga', '🐂', 2, 'charge', { dmg: 10, stun: 1.5, range: 300, cd: 10, color: '#ffffff' }],
  ['desga', 'Desgarrar', '🩸', 4, 'melee', { dmg: 6, dot: 6, ticks: 5, cd: 8, range: 50, color: '#e04a4a' }],
  ['grito', 'Grito de batalla', '📣', 4, 'buff', { up: 0.2, dur: 12, cd: 25, color: '#ff9a5a' }],
  ['atronar', 'Atronar', '💢', 6, 'nova', { dmg: 12, slow: 4, radius: 100, cd: 8, color: '#c8c8d8' }],
  ['aturde', 'Golpe aturdidor', '🔨', 6, 'melee', { dmg: 8, stun: 2.5, cd: 12, range: 50 }],
  ['regen', 'Regeneración enfurecida', '❤️‍🔥', 8, 'heal', { heal: 0.25, cd: 25, color: '#ff6a5a' }],
  ['hendir', 'Hendir', '🪓', 8, 'nova', { dmg: 20, radius: 70, cd: 5, color: '#ffffff' }],
  ['ejecutar', 'Ejecutar', '⚰️', 10, 'melee', { dmg: 30, exec: true, cd: 7, range: 52, color: '#ff6a5a' }],
  ['muro', 'Muro de escudo', '🧱', 10, 'shield', { abs: 0.5, dur: 8, cd: 35, color: '#c8c8d8' }],
  ['arroja', 'Hacha arrojadiza', '🪓', 12, 'bolt', { dmg: 22, slow: 3, range: 260, cd: 7, color: '#d8e0ea', speed: 440 }],
  ['salto', 'Salto heroico', '🦘', 12, 'charge', { dmg: 26, radius: 80, range: 340, cd: 14, color: '#ff9a5a' }],
  ['temer', 'Temeridad', '😤', 14, 'buff', { up: 0.4, dur: 10, cd: 35, color: '#ff6a5a' }],
  ['ola', 'Ola de choque', '🌊', 14, 'nova', { dmg: 30, stun: 2, radius: 120, cd: 14, color: '#ffd27a' }],
  ['sed', 'Sed de sangre', '🧛', 16, 'melee', { dmg: 22, ls: 0.3, cd: 6, range: 52, color: '#e04a4a' }],
  ['filo', 'Filotormenta', '🌪️', 18, 'ground', { dmg: 14, radius: 90, dur: 4, self: true, follow: true, cd: 18, color: '#ffffff' }],
  ['avatar', 'Avatar', '🗿', 20, 'buff', { up: 0.5, abs: 0.3, dur: 12, cd: 40, color: '#ff9a5a' }],
]);
defAbils('brujo', [
  ['b1', 'Corte ritual', '🗡️', 1, 'melee', { basic: true, dmg: 8, cd: 0.5, range: 46 }],
  ['b2', 'Dardo de sombras', '🟣', 8, 'bolt', { basic: true, dmg: 9, cd: 0.65, range: 260, color: '#b04dff', speed: 420 }],
  ['b3', 'Toque del vacío', '🖤', 16, 'bolt', { basic: true, dmg: 12, ls: 0.15, cd: 0.7, range: 270, color: '#7a3ad9', speed: 440 }],
  ['sombras', 'Descarga de sombras', '🟣', 1, 'bolt', { dmg: 14, dot: 4, ticks: 4, cd: 5, range: 280, color: '#b04dff', speed: 300, big: true }],
  ['corrup', 'Corrupción', '🦠', 2, 'bolt', { dmg: 3, dot: 6, ticks: 6, cd: 4, range: 280, color: '#8ae06a', speed: 420 }],
  ['drenar', 'Drenar vida', '🫀', 4, 'bolt', { dmg: 14, ls: 0.5, cd: 7, range: 260, color: '#e04a6a', speed: 400 }],
  ['miedo', 'Miedo', '😱', 4, 'bolt', { dmg: 1, stun: 4, cd: 15, range: 260, color: '#7a3ad9', speed: 420 }],
  ['inmolar', 'Inmolar', '🔥', 6, 'bolt', { dmg: 12, dot: 8, ticks: 4, cd: 6, range: 280, color: '#ff8a2a', speed: 380 }],
  ['alma', 'Escudo de alma', '💠', 6, 'shield', { abs: 0.3, dur: 8, cd: 20, color: '#b04dff' }],
  ['agonia', 'Maldición de agonía', '💀', 8, 'bolt', { dmg: 2, dot: 12, ticks: 6, cd: 8, range: 280, color: '#5a2a7a', speed: 420 }],
  ['lluvia', 'Lluvia de fuego', '☄️', 10, 'ground', { dmg: 9, radius: 120, dur: 6, cd: 14, range: 300, color: '#ff6a2a' }],
  ['espiral', 'Espiral de muerte', '🌀', 10, 'bolt', { dmg: 26, stun: 1, ls: 0.3, cd: 12, range: 260, color: '#7a3ad9', speed: 440 }],
  ['fuegoalma', 'Fuego de alma', '🔥', 12, 'bolt', { dmg: 45, cd: 10, range: 300, color: '#ff6a2a', speed: 340, big: true }],
  ['aullido', 'Aullido de terror', '👻', 12, 'nova', { dmg: 0, stun: 3, radius: 140, cd: 25, color: '#7a3ad9' }],
  ['semilla', 'Semilla de corrupción', '🌱', 14, 'meteor', { dmg: 40, radius: 120, delay: 1.5, cd: 12, range: 300, color: '#8ae06a' }],
  ['pacto', 'Pacto de sangre', '🩸', 14, 'buff', { up: 0.35, dur: 10, cd: 30, color: '#e04a6a' }],
  ['conflag', 'Conflagrar', '💥', 16, 'bolt', { dmg: 55, cd: 9, range: 300, color: '#ff6a2a', speed: 420, big: true }],
  ['drenalma', 'Drenar alma', '👁️', 16, 'bolt', { dmg: 30, ls: 0.4, exec: true, cd: 10, range: 280, color: '#b04dff', speed: 420 }],
  ['furia', 'Furia de las sombras', '🌑', 18, 'nova', { dmg: 40, stun: 2, radius: 130, cd: 18, color: '#7a3ad9' }],
  ['meta', 'Metamorfosis', '😈', 20, 'buff', { up: 0.5, abs: 0.3, dur: 12, cd: 40, color: '#b04dff' }],
]);
defAbils('cazador', [
  ['b1', 'Disparo', '🏹', 1, 'bolt', { basic: true, dmg: 8, cd: 0.6, range: 300, color: '#e8dcc0', speed: 560 }],
  ['b2', 'Disparo firme', '🎯', 8, 'bolt', { basic: true, dmg: 11, cd: 0.65, range: 320, color: '#e8dcc0', speed: 600 }],
  ['b3', 'Disparo rápido', '⚡', 16, 'multi', { basic: true, dmg: 9, n: 2, cd: 0.7, range: 320, color: '#ffe98a', speed: 620 }],
  ['arcano', 'Disparo arcano', '✴️', 1, 'bolt', { dmg: 22, cd: 5, range: 320, color: '#9ad8ff', speed: 520, big: true }],
  ['conmo', 'Disparo de conmoción', '🧊', 2, 'bolt', { dmg: 10, slow: 4, cd: 6, range: 300, color: '#a8e8ff', speed: 560 }],
  ['multi', 'Disparo múltiple', '🎆', 4, 'multi', { dmg: 14, n: 4, cd: 7, range: 300, color: '#ffd27a', speed: 560 }],
  ['marca', 'Marca del cazador', '🎯', 4, 'buff', { up: 0.2, dur: 15, cd: 25, color: '#e04a4a' }],
  ['raptor', 'Golpe de raptor', '🦅', 6, 'melee', { dmg: 18, cd: 5, range: 52, sec: true, color: '#ffd27a' }],
  ['hielo', 'Trampa de hielo', '❄️', 6, 'meteor', { dmg: 4, stun: 3, radius: 80, delay: 0.4, cd: 15, range: 300, color: '#a8e8ff' }],
  ['guepardo', 'Aspecto del guepardo', '🐆', 8, 'buff', { speed: 1.5, dur: 8, cd: 20, color: '#f0c040' }],
  ['serpiente', 'Picadura de serpiente', '🐍', 8, 'bolt', { dmg: 4, dot: 8, ticks: 5, cd: 7, range: 300, color: '#8ae06a', speed: 560 }],
  ['apuntado', 'Disparo apuntado', '🔭', 10, 'bolt', { dmg: 45, cd: 10, range: 360, color: '#fff0a0', speed: 760, big: true }],
  ['fingir', 'Fingir muerte', '💀', 10, 'stealth', { dur: 5, mult: 2, cd: 25 }],
  ['explosiva', 'Trampa explosiva', '💥', 12, 'meteor', { dmg: 30, dot: 6, ticks: 3, radius: 90, delay: 0.5, cd: 12, range: 300, color: '#ff8a2a' }],
  ['desen', 'Desenganche', '🦘', 12, 'blink', { dist: 200, back: true, cd: 14, color: '#c8f0ff' }],
  ['andanada', 'Andanada', '🌧️', 14, 'ground', { dmg: 10, radius: 110, dur: 5, cd: 14, range: 320, color: '#e8dcc0' }],
  ['mangosta', 'Mordedura de mangosta', '🐍', 14, 'melee', { dmg: 24, stun: 1.5, cd: 9, range: 52, sec: true, color: '#8ae06a' }],
  ['letal', 'Disparo letal', '☠️', 16, 'bolt', { dmg: 50, exec: true, cd: 10, range: 340, color: '#e04a4a', speed: 700 }],
  ['fuego', 'Fuego rápido', '🔥', 18, 'buff', { up: 0.4, dur: 10, cd: 30, color: '#ff8a2a' }],
  ['tormenta', 'Tormenta de flechas', '🌪️', 20, 'ground', { dmg: 22, radius: 140, dur: 6, cd: 25, range: 320, color: '#ffe98a' }],
]);
const hasSecond = () => !!(hero && SECONDARY[hero.cls]);
/* golpe automático con el arma secundaria cuando un enemigo se acerca a una clase a distancia */
const SEC_STRIKE = { id: 'sec', name: 'Golpe cuerpo a cuerpo', icon: '⚔️', kind: 'melee', dmg: 9, cd: 0.7, range: 52, sec: true, basic: true };
const START_ABILS = { picaro: ['picaro.b1', 'picaro.veneno'], mago: ['mago.b1', 'mago.fuego'], paladin: ['paladin.b1', 'paladin.luz'], guerrero: ['guerrero.b1', 'guerrero.torbe'], brujo: ['brujo.b1', 'brujo.sombras'], cazador: ['cazador.b1', 'cazador.arcano'] };
const KIND_NAME = { melee: 'Cuerpo a cuerpo', bolt: 'A distancia', multi: 'Varios objetivos', nova: 'Área a tu alrededor', ground: 'Zona de daño', meteor: 'Área en el objetivo', charge: 'Carga', blink: 'Movimiento', heal: 'Curación', shield: 'Escudo', buff: 'Mejora', stealth: 'Sigilo', passive: 'Pasiva' };

/* ---------------------------------------------------------------- rangos */
const rankOf = (id) => (hero.abil.known[id] || 0);
const rankMul = (id) => 1 + (Math.max(1, rankOf(id)) - 1) * 0.2;
const cdOf = (ab) => ab.cd * (ab.basic ? 1 : 1 - (rankOf(ab.id) - 1) * 0.05);
const learnPrice = (ab) => Math.round(8 + ab.req * ab.req * 2.2);
const rankPrice = (ab) => Math.round(learnPrice(ab) * 0.6 * rankOf(ab.id) + 10);
const rankLvl = (ab) => ab.req + 2 * rankOf(ab.id);          // siguiente rango: 2 niveles después
function abDesc(ab, r = Math.max(1, rankOf(ab.id))) {
  const m = 1 + (r - 1) * 0.2, o = [];
  if (ab.dmg) o.push(`daño ${Math.round(ab.dmg * m)}${ab.kind === 'ground' ? '/s' : ''}`);
  if (ab.n) o.push(`${ab.n} objetivos`);
  if (ab.dot) o.push(`+${Math.round(ab.dot * m)}×${ab.ticks} con el tiempo`);
  if (ab.radius) o.push(`radio ${ab.radius}`);
  if (ab.stun) o.push(`aturde ${ab.stun} s`);
  if (ab.slow) o.push(`ralentiza ${ab.slow} s`);
  if (ab.ls) o.push(`te cura el ${Math.round(ab.ls * 100)} % del daño`);
  if (ab.exec) o.push('×2 si le queda poca vida');
  if (ab.heal) o.push(`cura ${Math.round(ab.heal * m * 100)} % de tu vida`);
  if (ab.abs) o.push(`escudo del ${Math.round(ab.abs * m * 100)} % de tu vida`);
  if (ab.up) o.push(`+${Math.round(ab.up * m * 100)} % de daño`);
  if (ab.speed && ab.kind === 'buff') o.push(`+${Math.round((ab.speed - 1) * 100)} % de velocidad`);
  if (ab.kind === 'stealth') o.push(`invisible ${ab.dur} s · el siguiente golpe hace ×${ab.mult}`);
  if (ab.kind === 'blink') o.push(`te teletransportas ${ab.dist}`);
  if (ab.dual) return 'Pasiva · puedes llevar una segunda daga en la mano izquierda (bolsa 🎒 → «Mano izq.»). Tus ataques suman el 50 % de su daño (+10 % por rango).';
  if (ab.dur && ab.kind !== 'stealth') o.push(`${ab.dur} s`);
  o.push(`recarga ${ab.cd < 1 ? ab.cd.toFixed(2) : Math.round(ab.cd * (ab.basic ? 1 : 1 - (r - 1) * 0.05) * 10) / 10} s`);
  return `${KIND_NAME[ab.kind]} · ${o.join(' · ')}`;
}

/* --------------------------------------------------------------- lanzar */
const zones = [];
const hasDual = () => hero.cls === 'picaro' && rankOf('picaro.ambi') > 0;
function abDmg(ab) {
  const wf = ab.basic ? 0.6 : Math.min(1, ab.dmg / 12), W = ab.sec && hero.second ? hero.second : hero.weapon;
  const up = hero.dmgUp && hero.dmgUp.until > T ? 1 + hero.dmgUp.v : 1;
  const off = hasDual() && hero.offhand ? hero.offhand.dmg * (0.4 + 0.1 * rankOf('picaro.ambi')) * wf : 0;
  return (ab.dmg * rankMul(ab.id) + (W.dmg * wf + off) / lvlMul()) * powerMul() * up;
}
function hitMob(m, ab, dmg, color) {
  if (m.dead) return;
  if (ab.exec && m.hp / m.max < 0.3) dmg *= 2;
  const dealt = dmg > 0 ? damageMob(m, dmg, color || (ab.color && ab.color !== '#ffffff' ? ab.color : '#ffe46a')) || 0 : 0;
  if (m.dead) return;
  if (ab.dot) m.dots.push({ d: ab.dot * rankMul(ab.id), n: ab.ticks, next: T + 1, c: ab.color || '#c58bff' });
  if (ab.stun) { m.stunT = T + ab.stun; nums.push({ x: m.x, y: m.y - 80, t: 0, txt: '💫', c: '#fff' }); }
  if (ab.slow) m.slowT = T + ab.slow + 2;
  if (ab.ls && dealt) healHero(dealt * ab.ls);
  if (m.state === 'idle' || m.state === 'back') m.state = MONSTERS[m.type].flee ? 'flee' : 'chase';
}
function healHero(n) {
  n = Math.round(n); if (n <= 0 || hero.dead) return;
  hero.hp = Math.min(hero.max, hero.hp + n);
  nums.push({ x: hero.x + 20, y: hero.y - 110, t: 0, txt: `+${n}`, c: '#7dff7a' });
}
function areaHit(x, y, r, ab, dmg) { for (const m of mobs) if (!m.dead && Math.hypot(m.x - x, m.y - y) < r) hitMob(m, ab, dmg); }
function use(i) {
  if (!hero || hero.dead || !playing) return;
  let id = hero.abil.bar[i]; if (!id) return;
  let ab = ABIL[id];
  if (hero.mounted) dismount();
  // clases a distancia: si el enemigo está pegado, el ataque básico se hace con el arma secundaria
  if (i === 0 && hasSecond() && hero.second && ab.kind !== 'melee') { const near = nearestMob(70); if (near && Math.hypot(near.x - hero.x, near.y - hero.y) < 70) { ab = SEC_STRIKE; id = ab.id; } }
  if ((hero.cd[id] || 0) > T) return;
  const rng = ab.range || 110;
  const target = nearestMob(['bolt', 'multi', 'charge', 'meteor', 'ground'].includes(ab.kind) ? rng : ab.kind === 'melee' ? 190 : 140);
  if ((ab.kind === 'charge' || ab.kind === 'meteor' || (ab.kind === 'ground' && !ab.self)) && !target) { toast(`${ab.icon} ${ab.name}: no hay ningún enemigo a tu alcance`); return; }
  hero.cd[id] = T + cdOf(ab);
  hero.atkT = 0.22; hero.lastAtk = T; pressSlot(i);
  if (ab.sec && hero.second) hero.secT = T + 0.7;   // saca la espada/daga un momento
  let mult = 1;
  if (hero.stealth > T && ab.dmg) { mult = hero.stealthMult; hero.stealth = 0; }
  if (target && !['nova', 'heal', 'shield', 'buff', 'stealth', 'blink'].includes(ab.kind)) faceTo(target.x, target.y);
  // autoapuntado: si el objetivo está un poco lejos para un golpe cuerpo a cuerpo, das un paso hacia él
  if (target && ab.kind === 'melee') {
    const d = Math.hypot(target.x - hero.x, target.y - hero.y), reach = ab.range + 24;
    if (d > reach) { const st = Math.min(80, d - reach + 6), nx = hero.x + ((target.x - hero.x) / d) * st, ny = hero.y + ((target.y - hero.y) / d) * st; if (!blocked(nx, ny)) { hero.x = nx; hero.y = ny; } }
  }
  const aim = target && !['nova', 'heal', 'shield', 'buff', 'stealth', 'blink'].includes(ab.kind) ? (() => { const dx = target.x - hero.x, dy = target.y - hero.y, d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; })() : null;
  const [vx, vy] = aim || facingVec(), dmg = ab.dmg ? abDmg(ab) * mult : 0, col = ab.color || '#ffffff';
  const R = rankMul(id);
  switch (ab.kind) {
    case 'melee': {
      const cx0 = hero.x + vx * 30, cy0 = hero.y - 20 + vy * 26;
      const wr = (ab.sec && hero.second ? hero.second : hero.weapon).rarity;
      fx.push({ k: 'slash', x: cx0, y: cy0, dir: [vx, vy], t: 0, life: wr >= 3 ? 0.32 : 0.2, c: wr >= 3 && !ab.color ? trailColor(wr, T) : col, wr });
      if (wr >= 3) for (let q = 0; q < 8 + wr * 2; q++) { const a = Math.atan2(vy, vx) - 1.2 + q * 0.22; fx.push({ k: 'tr', x: cx0 - vx * 14 + Math.cos(a) * 30, y: cy0 - vy * 14 + Math.sin(a) * 30, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30 - 20, t: 0, life: 0.4 + Math.random() * 0.2, c: trailColor(wr, T + q * 0.15), r: 2.6 + (wr - 3) }); }
      for (const m of mobs) if (!m.dead && Math.hypot(m.x - cx0, m.y - 18 - cy0) < ab.range) hitMob(m, ab, dmg);
      break;
    }
    case 'bolt': case 'multi': {
      const ts = ab.kind === 'multi' ? mobs.filter((m) => !m.dead && Math.hypot(m.x - hero.x, m.y - hero.y) < rng).sort((a, b) => Math.hypot(a.x - hero.x, a.y - hero.y) - Math.hypot(b.x - hero.x, b.y - hero.y)).slice(0, ab.n) : [target];
      if (!ts.length) ts.push(null);
      ts.forEach((t, k) => {
        const tx = t ? t.x : hero.x + vx * rng, ty = t ? t.y - 22 : hero.y - 40 + vy * rng;
        const sx = hero.x + vx * 20, sy = hero.y - 46 - k * 6, d = Math.hypot(tx - sx, ty - sy) || 1, sp = ab.speed || 420;
        shots.push({ dmg, x: sx, y: sy, vx: ((tx - sx) / d) * sp, vy: ((ty - sy) / d) * sp, life: rng / sp + 0.4, ab, c: col, tg: t, wr: hero.weapon.rarity, arrow: ab.cls === 'cazador' && !ab.big ? (hero.weapon.kind === 'rifle' ? 'bala' : 'flecha') : null });
      });
      break;
    }
    case 'nova':
      fx.push({ k: 'ring', x: hero.x, y: hero.y - 10, r: ab.radius, t: 0, life: 0.45, c: col });
      if (ab.radius < 100) hero.spin = 0.4;
      areaHit(hero.x, hero.y, ab.radius, ab, dmg);
      if (ab.heal) healHero(hero.max * ab.heal * R);
      break;
    case 'ground': {
      const x = ab.self ? hero.x : target.x, y = ab.self ? hero.y : target.y;
      zones.push({ x, y, r: ab.radius, until: T + ab.dur, next: T, ab, dmg, follow: ab.follow, c: col });
      break;
    }
    case 'meteor': {
      const x = target.x, y = target.y;
      fx.push({ k: 'mark', x, y, r: ab.radius, t: 0, life: ab.delay, c: col });
      timers.push({ t: T + ab.delay, fn: () => {
        fx.push({ k: 'ring', x, y, r: ab.radius * 1.2, t: 0, life: 0.5, c: col }); fx.push({ k: 'ring', x, y, r: ab.radius * 0.6, t: 0, life: 0.4, c: '#fff1a0' });
        for (let q = 0; q < 18; q++) fx.push({ k: 'p', x, y: y - 10, vx: (Math.random() - 0.5) * 320, vy: -Math.random() * 280, t: 0, life: 0.6, c: col });
        areaHit(x, y, ab.radius, ab, dmg);
      } });
      break;
    }
    case 'charge': {
      const d = Math.hypot(target.x - hero.x, target.y - hero.y) || 1, nx = target.x - ((target.x - hero.x) / d) * 34, ny = target.y - ((target.y - hero.y) / d) * 10;
      for (let q = 0; q < 10; q++) { const k = q / 10; fx.push({ k: 'p', x: hero.x + (nx - hero.x) * k, y: hero.y - 30 + (ny - hero.y) * k, vx: 0, vy: -30, t: 0, life: 0.4, c: col }); }
      if (!blocked(nx, ny)) { hero.x = nx; hero.y = ny; }
      if (ab.radius) { fx.push({ k: 'ring', x: hero.x, y: hero.y - 10, r: ab.radius, t: 0, life: 0.45, c: col }); areaHit(hero.x, hero.y, ab.radius, ab, dmg); } else hitMob(target, ab, dmg);
      break;
    }
    case 'blink': {
      fx.push({ k: 'ring', x: hero.x, y: hero.y - 10, r: 40, t: 0, life: 0.4, c: col });
      const [bx, by] = ab.back && target ? (() => { const dx = hero.x - target.x, dy = hero.y - target.y, d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; })() : [vx, vy];
      for (let s = 0; s < ab.dist; s += 10) { const nx = hero.x + bx * 10, ny = hero.y + by * 10; if (blocked(nx, ny)) break; hero.x = nx; hero.y = ny; }
      fx.push({ k: 'ring', x: hero.x, y: hero.y - 10, r: 40, t: 0, life: 0.4, c: col });
      for (const m of mobs) if (m.state === 'chase') m.state = 'back';
      break;
    }
    case 'heal': healHero(hero.max * ab.heal * R); fx.push({ k: 'ring', x: hero.x, y: hero.y - 10, r: 50, t: 0, life: 0.6, c: col }); break;
    case 'shield': hero.shield = { amt: hero.max * ab.abs * R, until: T + ab.dur, c: col }; toast(`${ab.icon} ${ab.name}: absorbes ${Math.round(hero.shield.amt)} de daño`); break;
    case 'buff':
      if (ab.up) hero.dmgUp = { v: ab.up * R, until: T + ab.dur };
      if (ab.speed) hero.speedUp = { v: ab.speed, until: T + ab.dur };
      if (ab.abs) hero.shield = { amt: hero.max * ab.abs * R, until: T + ab.dur, c: col };
      fx.push({ k: 'ring', x: hero.x, y: hero.y - 10, r: 70, t: 0, life: 0.6, c: col });
      nums.push({ x: hero.x, y: hero.y - 140, t: 0, txt: `${ab.icon} ${ab.name}`, c: col });
      break;
    case 'stealth':
      hero.stealth = T + ab.dur; hero.stealthMult = ab.mult * R;
      for (const m of mobs) if (m.state === 'chase') m.state = 'back';
      break;
  }
}
function updateZones(dt) {
  for (let i = zones.length - 1; i >= 0; i--) {
    const z = zones[i];
    if (z.follow) { z.x = hero.x; z.y = hero.y; hero.spin = 0.3; }
    if (T >= z.next) { z.next = T + 1; areaHit(z.x, z.y, z.r, z.ab, z.dmg); }
    if (T > z.until) zones.splice(i, 1);
  }
}
function drawZones(ctx) {
  for (const z of zones) {
    ctx.globalAlpha = 0.22 + Math.sin(T * 6) * 0.06; ctx.fillStyle = z.c;
    ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.55, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.7; ctx.strokeStyle = z.c; ctx.lineWidth = 3; ctx.stroke();
    for (let k = 0; k < 5; k++) { const a = T * 2 + k * 1.26, rr = z.r * (0.3 + ((T + k * 0.2) % 1) * 0.6); ctx.beginPath(); ctx.arc(z.x + Math.cos(a) * rr, z.y + Math.sin(a) * rr * 0.55 - ((T * 60 + k * 13) % 30), 4, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
}

/* ------------------------------------------------------ libro de hechizos */
let bookSel = 0;
function openBook(sel = bookSel) {
  if (!playing) return;
  bookSel = sel;
  const list = ABILS[hero.cls], K = CLASSES[hero.cls];
  const slot = (i) => { const id = hero.abil.bar[i], ab = id && ABIL[id]; return `<button class="bslot ${i === sel ? 'on' : ''}" data-sel="${i}">${ab ? ab.icon : '＋'}<small>${i === 0 ? 'Básica' : 'Habilidad ' + (i + 1)}</small></button>`; };
  const row = (ab) => {
    const r = rankOf(ab.id), inBar = hero.abil.bar.indexOf(ab.id), fits = (sel === 0) === !!ab.basic;
    const btn = !r ? (hero.lvl >= ab.req ? '<em class="up">Apréndela con tu instructor</em>' : `<em class="down">Nivel ${ab.req}</em>`) : ab.kind === 'passive' ? '<em>Pasiva: siempre activa</em>' : inBar === sel ? '<em>Equipada</em>' : fits ? `<button class="ghost" data-put="${ab.id}">Equipar</button>` : '';
    return `<div class="lrow ${r ? '' : 'locked'}"><span class="li">${ab.icon}</span><b>${ab.name}${r ? ` <span class="rk">R${r}</span>` : ''}${inBar >= 0 ? ` <span class="up">[${inBar + 1}]</span>` : ''}<small>${abDesc(ab)}</small></b>${btn}</div>`;
  };
  const basics = list.filter((a) => a.basic), others = list.filter((a) => !a.basic);
  openWin(`${head(`📖 Habilidades de ${K.name}`)}<div class="wbody">
    <p class="sub">Llevas 5 habilidades: 1 ataque básico y 4 de clase. Elige una ranura y luego la habilidad. Las nuevas (y sus mejoras) te las enseña tu instructor en el Cuartel, en los niveles pares.</p>
    <div class="bbar">${[0, 1, 2, 3, 4].map(slot).join('')}</div>
    <h4>${sel === 0 ? 'Ataques básicos' : 'Habilidades de clase'} (${(sel === 0 ? basics : others).filter((a) => rankOf(a.id)).length}/${(sel === 0 ? basics : others).length} aprendidas)</h4>
    ${(sel === 0 ? basics : others).map(row).join('')}</div>`, true);
  bind('[data-sel]', (d) => openBook(+d.sel));
  bind('[data-put]', (d) => {
    const old = hero.abil.bar.indexOf(d.put); if (old >= 0) hero.abil.bar[old] = hero.abil.bar[sel];
    hero.abil.bar[sel] = d.put; buildBar(); save(); openBook(sel);
  });
}

/* ------------------------------------------------- instructor de clase */
function openClassTrainer(cls, n) {
  const K = CLASSES[cls];
  if (cls !== hero.cls) { openWin(`${head(n.V.name)}<div class="wbody"><p>Yo solo entreno a los <b>${K.icon} ${K.name}</b>. Busca a tu instructor de ${CLASSES[hero.cls].name}: está aquí mismo, en el Cuartel.</p></div>`); return; }
  const rows = ABILS[cls].slice().sort((a, b) => a.req - b.req).map((ab) => {
    const r = rankOf(ab.id);
    let btn;
    if (!r) btn = hero.lvl >= ab.req ? `<button class="ghost" data-learn="${ab.id}" ${hero.gold >= learnPrice(ab) ? '' : 'disabled'}>Aprender · ${learnPrice(ab)} 🪙</button>` : `<em class="down">Nivel ${ab.req}</em>`;
    else if (r >= 5) btn = '<em>Rango máximo</em>';
    else btn = hero.lvl >= rankLvl(ab) ? `<button class="ghost" data-rank="${ab.id}" ${hero.gold >= rankPrice(ab) ? '' : 'disabled'}>Rango ${r + 1} · ${rankPrice(ab)} 🪙</button>` : `<em class="down">R${r + 1} a nivel ${rankLvl(ab)}</em>`;
    return `<div class="lrow ${r || hero.lvl >= ab.req ? '' : 'locked'}"><span class="li">${ab.icon}</span><b>${ab.name}${r ? ` <span class="rk">R${r}</span>` : ''}${ab.basic ? ' <span class="rk b">básica</span>' : ''}<small>${abDesc(ab, Math.max(1, r))}</small></b>${btn}</div>`;
  }).join('');
  openWin(`${head(`${n.V.name} · ${n.V.title}`)}<div class="wbody"><p class="sub">Cada nivel par puedo enseñarte habilidades nuevas o subir de rango las que ya sabes (+20 % de efecto por rango). Luego equípalas en tu libro de habilidades (📖, tecla K).</p>
    <div class="lgo"><button class="ghost" data-book>📖 Abrir libro de habilidades</button></div>${rows}</div>`, true);
  bind('[data-book]', () => openBook(0));
  bind('[data-learn]', (d) => {
    const ab = ABIL[d.learn]; if (hero.gold < learnPrice(ab) || hero.lvl < ab.req) return;
    hero.gold -= learnPrice(ab); hero.abil.known[ab.id] = 1;
    const free = ab.kind === 'passive' ? -1 : hero.abil.bar.findIndex((x, i) => !x && (i === 0) === !!ab.basic);
    if (free >= 0) { hero.abil.bar[free] = ab.id; buildBar(); }
    fx.push({ k: 'ring', x: hero.x, y: hero.y - 10, r: 80, t: 0, life: 0.8, c: K.color });
    toast(`📖 Has aprendido <b>${ab.icon} ${ab.name}</b>${ab.dual ? '. Ya puedes ponerte una daga en la mano izquierda desde la bolsa' : free >= 0 ? ` y la has puesto en la ranura ${free + 1}` : '. Equípala en tu libro (K)'}`); save(); openClassTrainer(cls, n);
  });
  bind('[data-rank]', (d) => {
    const ab = ABIL[d.rank]; if (hero.gold < rankPrice(ab) || hero.lvl < rankLvl(ab)) return;
    hero.gold -= rankPrice(ab); hero.abil.known[ab.id]++;
    toast(`⭐ <b>${ab.name}</b> sube a rango ${hero.abil.known[ab.id]}`); save(); openClassTrainer(cls, n);
  });
}

/* --------------------------------------------- estela de las armas épicas o mejores */
function weaponTrail(dt, moving) {
  if (!hero || hero.dead) return;
  const wr = Math.max(hero.weapon.rarity || 0, hero.offhand && hasDual() ? hero.offhand.rarity : 0);
  if (wr < 3) return;
  if ((hero.trT = (hero.trT || 0) - dt) > 0) return;
  hero.trT = moving || hero.atkT > 0 ? 0.025 : 0.09;
  const up = hero.mounted ? 42 : 0;
  const pts = hero.dir === 2 ? [[(hero.flip ? -1 : 1) * 24, -78]] : hero.dir === 1 ? [[-17, -70]] : [[22, -76]];
  if (hero.offhand && hasDual() && hero.dir !== 2) pts.push(hero.dir === 1 ? [17, -64] : [-22, -66]);
  for (const [ox, oy] of pts) fx.push({ k: 'tr', x: hero.x + ox + (Math.random() - 0.5) * 8, y: hero.y + oy - up + (Math.random() - 0.5) * 14, vx: (Math.random() - 0.5) * 16 + (moving ? -Math.sign(hero.vx || 0) * 30 : 0), vy: -14 - Math.random() * 18, t: 0, life: 0.5 + (wr - 3) * 0.15, c: trailColor(wr, T + Math.random()), r: 2.4 + (wr - 3) * 0.9 });
}
