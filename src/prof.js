'use strict';
/* =========================================================================
   PROFESIONES (máximo 3). Rangos 1-5: Aprendiz → Maestro.
   Recolección: Pesca, Minería, Herboristería (nodos en el mundo).
   Fabricación: Ingeniería, Medicina, Herrería (recetas).
   Para subir de rango hay que completar la misión del instructor.
   ========================================================================= */
const RANKS = ['', 'Aprendiz', 'Oficial', 'Experto', 'Artesano', 'Maestro'];
const MAX_PROFS = 3;

// Recursos por nivel (tier 1-5)
const RES = {
  ore:  [null, ['Mena de cobre', '#c87a4a'], ['Mena de hierro', '#9aa1ac'], ['Mena de plata', '#d8e0ea'], ['Mena de oro', '#f0c040'], ['Mena de mitrilo', '#7ad0f0']],
  herb: [null, ['Hierbaluz', '#e8e070'], ['Raíz de sangre', '#c8403a'], ['Hoja de sombra', '#7a5ab0'], ['Flor de escarcha', '#a8e0ff'], ['Loto dorado', '#ffc040']],
  fish: [null, ['Trucha', '#a8b8a0'], ['Perca', '#c8a050'], ['Salmón', '#e07a5a'], ['Pez luna', '#c0c8ff'], ['Pez dragón', '#e04a6a']],
  meat: [null, ['Carne tierna', '#e89a8a'], ['Costillas de caza', '#d0705a'], ['Carne roja', '#c0504a'], ['Filete salvaje', '#a8403a'], ['Carne de bestia ancestral', '#902a3a']],
};
const RES_ICON = { ore: '⛏️', herb: '🌿', fish: '🐟', meat: '🍖' };
const resName = (kind, t) => RES[kind][t][0];

const PROFS = {
  pesca: {
    name: 'Pesca', icon: '🎣', kind: 'gather', res: 'fish', tool: 'Caña de pescar', trainer: 'bruno',
    desc: 'Pesca en los bancos de peces de los lagos (las ondas brillantes). Los peces se venden o se usan en Medicina.',
  },
  mineria: {
    name: 'Minería', icon: '⛏️', kind: 'gather', res: 'ore', tool: 'Pico de minero', trainer: 'greta',
    desc: 'Extrae menas de las vetas de las rocas. Sobre todo en las Colinas Rocosas. Sirven para Herrería e Ingeniería.',
  },
  herbo: {
    name: 'Herboristería', icon: '🌿', kind: 'gather', res: 'herb', tool: 'Hoz de herborista', trainer: 'lia',
    desc: 'Recoge plantas medicinales en praderas y bosques. Son la base de la Medicina.',
  },
  ingenieria: {
    name: 'Ingeniería', icon: '⚙️', kind: 'craft', tool: 'Kit de ingeniero', trainer: 'chispa',
    desc: 'Fabrica bombas que explotan en área (botón 💣). Cuanto más rango, más daño.',
    recipe: (t) => ({ name: `Bombas de ${['', 'cobre', 'hierro', 'plata', 'oro', 'mitrilo'][t]}`, needs: [['ore', t, 2]], gives: { kind: 'bombs', n: 2 + Math.floor(t / 2) } }),
  },
  medicina: {
    name: 'Medicina', icon: '⚕️', kind: 'craft', tool: 'Maletín de médico', trainer: 'amalia',
    desc: 'Prepara pociones de vida con plantas y peces.',
    recipe: (t) => ({ name: `Pociones (${resName('herb', t)})`, needs: [['herb', t, 2], ['fish', Math.max(1, t - 1), 1]], gives: { kind: 'potions', n: 1 + Math.ceil(t / 2) } }),
  },
  cocina: {
    name: 'Cocina', icon: '🍳', kind: 'craft', tool: 'Utensilios de cocina', trainer: 'marta',
    desc: 'Cocina la carne de los animales (conejos, ciervos, jabalíes, lobos, osos, cangrejos) y el pescado. La comida cura poco a poco y te deja «Bien alimentado»: más daño y más vida durante 5 minutos.',
    recipe: (t) => PROFS.cocina.recipes(t)[0],
    recipes: (t) => [
      { name: FOOD[`c${t}`][0], needs: [['meat', t, 2]], gives: { kind: 'food', key: `c${t}`, n: 2 } },
      { name: FOOD[`f${t}`][0], needs: [['fish', t, 2]], gives: { kind: 'food', key: `f${t}`, n: 2 } },
    ],
    quest: (r, n) => `Cocina ${n} platos de nivel ${r} (carne o pescado)`,
  },
  herreria: {
    name: 'Herrería', icon: '🔨', kind: 'craft', tool: 'Martillo de herrero', trainer: 'brunilda',
    desc: 'Forja armas de tu clase con menas. Las de rango alto salen raras, épicas o legendarias.',
    recipe: (t) => ({ name: `Forjar arma de ${['', 'cobre', 'hierro', 'plata', 'oro', 'mitrilo'][t]}`, needs: [['ore', t, 4]], gives: { kind: 'weapon', tier: t } }),
  },
};
/** Misión para pasar del rango r al r+1. */
function profQuest(id, r) {
  const P = PROFS[id], n = 4 + r * 2;
  if (P.kind === 'gather') return { text: `Consigue ${n} × ${resName(P.res, r)}`, kind: 'have', res: P.res, tier: r, n };
  const R = P.recipe(r), c = Math.max(2, r + 1);
  return { text: P.quest ? P.quest(r, c + 1) : `Fabrica ${c} veces: ${R.name}`, kind: 'craft', n: P.quest ? c + 1 : c };
}
const TOOL_PRICE = 25;
/* Comida: [nombre, icono, nivel, ¿da «Bien alimentado»?] */
const FOOD = {
  v1: ['Pan de centeno', '🍞', 1, false], v2: ['Queso curado', '🧀', 2, false], v3: ['Manzanas de Albor', '🍎', 1, false],
  c1: ['Brocheta de carne', '🍢', 1, true], c2: ['Estofado de jabalí', '🍲', 2, true], c3: ['Asado del cazador', '🍖', 3, true], c4: ['Filete a la brasa', '🥩', 4, true], c5: ['Festín del rey', '🍗', 5, true],
  f1: ['Trucha a la sal', '🐟', 1, true], f2: ['Perca al horno', '🐠', 2, true], f3: ['Salmón ahumado', '🍣', 3, true], f4: ['Sopa de pez luna', '🥣', 4, true], f5: ['Pez dragón picante', '🌶️', 5, true],
};
const FOOD_PRICE = { v1: 4, v2: 9, v3: 3 };
const recipeList = (pid, t) => (PROFS[pid].recipes ? PROFS[pid].recipes(t) : [PROFS[pid].recipe(t)]);
