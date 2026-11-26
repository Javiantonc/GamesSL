// ============================================================
//  PUEBLO DE ALBOR: NPCs y misiones.
//  pos = desplazamiento en píxeles desde el centro del Claro del Inicio.
//  Tipos de objetivo:
//   kill {mob,count} · collect {item,count} (del inventario) · talk {npc}
//   dungeon {tier} · dungeons {count} · boss {mob}
// ============================================================

export const NPCS = {
  elara: {
    name: 'Capitana Elara', title: 'Guardia de Albor', pos: [-110, -70],
    look: { skin: '#f0c9a0', hair: '#3a2416', top: '#4a6a9a', trim: '#e0b85a', hat: 'helm', hatColor: '#c9d1e0', item: 'spear', cape: '#2f4a7a' },
    greet: 'La Pradera no se defiende sola, aventurero. ¿Tienes un momento para Albor?',
  },
  orvin: {
    name: 'Maestro Orvin', title: 'Guardián de portales', pos: [70, -60],
    look: { skin: '#f0d0b0', hair: '#eeeeee', top: '#6a3a9a', trim: '#7ad7ff', hat: 'wizard', hatColor: '#5a2a8a', item: 'staff', beard: '#eeeeee', robe: true },
    greet: 'Los portales de colores llevan a mazmorras llenas de espectros. Cada color, más peligroso que el anterior.', portals: true,
  },
  tobias: {
    name: 'Tobías', title: 'Mercader', pos: [175, 95],
    look: { skin: '#ffd7b5', hair: '#8a5a3a', top: '#9a5a2a', trim: '#e8c35a', hat: 'cap', hatColor: '#2f6a4a', item: 'bag', beard: '#8a5a3a', apron: '#e8dcc0' },
    greet: '¡Pociones, comida y buenas ofertas! Y te compro lo que traigas de ahí fuera.', shop: 'buy',
  },
  brunilda: {
    name: 'Brunilda', title: 'Herrera', pos: [-185, 105],
    look: { skin: '#c98e66', hair: '#b5482a', top: '#5a4a3a', trim: '#2a2420', hat: 'bun', item: 'hammer', apron: '#3a2e24' },
    greet: 'Tráeme oro y dejaré tu equipo como nuevo. Mejor que nuevo.', shop: 'forge',
  },
  marta: {
    name: 'Marta', title: 'Posadera', pos: [0, 175],
    look: { skin: '#ffd7b5', hair: '#d27a3a', top: '#b53a4a', trim: '#f4efe0', hat: 'bun', item: 'mug', apron: '#f4efe0' },
    greet: '¡Bienvenido a la posada El Limo Feliz! Aquí comes caliente y descansas.', inn: true,
  },
  lia: {
    name: 'Lía', title: 'Guardabosques', pos: [-235, -25],
    look: { skin: '#f0c8a0', hair: '#3a5a2a', top: '#3f6a3a', trim: '#8a6a3a', hat: 'hood', hatColor: '#2f5a2a', item: 'bow', cape: '#2f5a2a' },
    greet: 'Silencio… el Bosque Susurrante escucha. Y no le gustan los visitantes.',
  },
  dario: {
    name: 'Darío', title: 'Explorador', pos: [250, 25],
    look: { skin: '#b57a52', hair: '#1a1410', top: '#c98a4a', trim: '#6a3a1a', hat: 'cap', hatColor: '#a8662a', item: 'map' },
    greet: 'He recorrido medio mapa. Las Colinas de Piedra esconden cosas que no deberían andar.',
  },
  nieve: {
    name: 'Vigía Nieve', title: 'Centinela del hielo', pos: [255, -95],
    look: { skin: '#f4dcc8', hair: '#dde8f0', top: '#6a90b0', trim: '#ffffff', hat: 'hood', hatColor: '#9ab8d0', item: 'staff', cape: '#9ab8d0', robe: true },
    greet: 'Vigilo el portal de hielo. Solo quien venza a los diez espectros podrá cruzarlo.',
  },
};

export const QUESTS = [
  { id: 'q0', npc: 'elara', lvl: 1, name: 'Bienvenido a Albor', text: 'Antes de nada, preséntate al Maestro Orvin, junto al portal de hielo. Él sabe todo sobre las mazmorras.', obj: { type: 'talk', npc: 'orvin' }, xp: 60, gold: 10 },
  { id: 'q1', npc: 'elara', lvl: 1, req: 'q0', name: 'Limos en los campos', text: 'Los limos saltarines se comen las cosechas de la Pradera Esmeralda. Acaba con 6.', obj: { type: 'kill', mob: 'slime', count: 6 }, xp: 180, gold: 15, item: { slot: 'chest', rarity: 'uncommon' } },
  { id: 'q2', npc: 'marta', lvl: 2, name: 'Gelatina para la posada', text: 'Hago una mermelada famosa con gelatina de limo (¡no preguntes!). Tráeme 5.', obj: { type: 'collect', item: 'gel', count: 5 }, xp: 260, gold: 20, potions: 3 },
  { id: 'q3', npc: 'orvin', lvl: 1, req: 'q0', name: 'El primer portal', text: 'Busca el portal verde más cercano: la Cripta Esmeralda. Derrota al Fuego Fatuo Esmeralda y vuelve.', obj: { type: 'dungeon', tier: 0 }, xp: 700, gold: 40, item: { slot: 'ring', rarity: 'rare' } },
  { id: 'q4', npc: 'tobias', lvl: 3, name: 'Goblins ladrones', text: 'Unos goblins saqueadores asaltan mis carros en la pradera y la costa. Dales su merecido: derrota a 6.', obj: { type: 'kill', mob: 'goblin', count: 6 }, xp: 420, gold: 30, item: { slot: 'weapon', rarity: 'uncommon' } },
  { id: 'q5', npc: 'elara', lvl: 5, req: 'q1', name: 'Telas robadas', text: 'Los goblins robaron las telas del pueblo. Recupera 6 telas de lino.', obj: { type: 'collect', item: 'cloth', count: 6 }, xp: 650, gold: 40, item: { slot: 'head', rarity: 'uncommon' } },
  { id: 'q6', npc: 'lia', lvl: 6, name: 'Lobos del bosque', text: 'Los lobos del Bosque Susurrante cazan demasiado cerca del pueblo. Derrota a 8.', obj: { type: 'kill', mob: 'wolf', count: 8 }, xp: 900, gold: 45, item: { slot: 'feet', rarity: 'uncommon' } },
  { id: 'q7', npc: 'lia', lvl: 8, req: 'q6', name: 'Provisiones', text: 'El invierno será largo. Trae 6 piezas de carne de lobo para la despensa.', obj: { type: 'collect', item: 'meat', count: 6 }, xp: 1100, gold: 55 },
  { id: 'q8', npc: 'orvin', lvl: 9, req: 'q3', name: 'Cavernas de Escarcha', text: 'El portal cian lleva a las Cavernas de Escarcha. Dentro espera el Lobo Espectral Glacial.', obj: { type: 'dungeon', tier: 1 }, xp: 2400, gold: 80, item: { slot: 'weapon', rarity: 'rare' } },
  { id: 'q9', npc: 'brunilda', lvl: 10, name: 'Huesos que caminan', text: 'En las Colinas de Piedra hay esqueletos errantes. Derrota a 8 y tráeme noticias.', obj: { type: 'kill', mob: 'skeleton', count: 8 }, xp: 2000, gold: 70, item: { slot: 'legs', rarity: 'uncommon' } },
  { id: 'q10', npc: 'brunilda', lvl: 12, req: 'q9', name: 'Hueso para la forja', text: 'El hueso antiguo templa el acero como nada. Consígueme 8.', obj: { type: 'collect', item: 'bone', count: 8 }, xp: 2600, gold: 120, item: { slot: 'chest', rarity: 'rare' } },
  { id: 'q11', npc: 'dario', lvl: 14, name: 'Cazador de portales', text: 'Completa 3 mazmorras distintas y te contaré dónde están las demás.', obj: { type: 'dungeons', count: 3 }, xp: 4500, gold: 150, item: { slot: 'hands', rarity: 'rare' } },
  { id: 'q12', npc: 'orvin', lvl: 17, req: 'q8', name: 'Maestro de portales', text: 'Completa cinco mazmorras distintas y te consideraré un verdadero cazador de espectros.', obj: { type: 'dungeons', count: 5 }, xp: 9000, gold: 300, item: { slot: 'neck', rarity: 'epic' } },
  { id: 'q13', npc: 'dario', lvl: 22, req: 'q11', name: 'Las colinas malditas', text: 'Los esqueletos se multiplican. Derrota a 20 antes de que lleguen a Albor.', obj: { type: 'kill', mob: 'skeleton', count: 20 }, xp: 9500, gold: 260, item: { slot: 'shoulders', rarity: 'rare' } },
  { id: 'q14', npc: 'nieve', lvl: 33, req: 'q12', name: 'El portal de hielo', text: 'El portal del Bosque Invernal solo se abre para quien vence a los diez espectros. Completa las diez mazmorras.', obj: { type: 'dungeons', count: 10 }, xp: 40000, gold: 1000, item: { slot: 'weapon', rarity: 'legendary' } },
  { id: 'q15', npc: 'nieve', lvl: 76, req: 'q14', name: 'Pieles de oso polar', text: 'En el Bosque Invernal viven osos polares enormes. Tráeme 8 de sus pieles.', obj: { type: 'collect', item: 'fur', count: 8 }, xp: 60000, gold: 2000, item: { slot: 'chest', rarity: 'epic' } },
  { id: 'q16', npc: 'nieve', lvl: 78, req: 'q14', name: 'La Reina de la Escarcha', text: 'Al fondo del Bosque Invernal anida la Reina Araña de Escarcha. Acaba con ella y el bosque volverá a dormir.', obj: { type: 'boss', mob: 'frostSpider' }, xp: 90000, gold: 4000, item: { slot: 'ring', rarity: 'legendary' } },
];
export const QUEST_BY_ID = Object.fromEntries(QUESTS.map((q) => [q.id, q]));
