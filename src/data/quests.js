// NPCs y misiones.
export const NPCS = {
  elara: { name: 'Capitana Elara', title: 'Guardia de Albor', look: 'capitana', pos: [6, -9], greet: 'La Pradera de Albor no se defiende sola, aventurero. ¿Tienes un momento?' },
  tobias: { name: 'Tobías', title: 'Mercader', look: 'mercader', pos: [11, 9], shop: true, greet: '¡Pociones, pociones! Y compro todo lo que traigas de ahí fuera.' },
  brunilda: { name: 'Brunilda', title: 'Herrera', look: 'herrera', pos: [-13, -5], forge: true, greet: 'Tráeme oro y dejaré tu equipo como nuevo. Mejor que nuevo.' },
  orvin: { name: 'Maestro Orvin', title: 'Guardián de portales', look: 'portalista', pos: [-6, 9], greet: 'Los portales de colores llevan a mazmorras llenas de espectros. Cada color, más peligroso que el anterior.' },
  marta: { name: 'Marta', title: 'Posadera', look: 'posadera', pos: [-6, -22], inn: true, greet: '¡Bienvenido a la posada El Jabalí Feliz! Aquí descansas y recuperas fuerzas.' },
  lia: { name: 'Lía', title: 'Guardabosques', look: 'guardabosques', pos: [10, -152], greet: 'Silencio... el Bosque Sombrío escucha. Y no le gustan los visitantes.' },
  dario: { name: 'Darío', title: 'Explorador', look: 'explorador', pos: [168, 30], greet: 'El Cañón Rojo esconde tesoros... y cosas que pican. Mucho.' },
  nieve: { name: 'Vigía Nieve', title: 'Centinela del hielo', look: 'vigia', pos: [0, 198], greet: 'Has roto el muro de hielo. Pocos han llegado tan lejos.' },
};

// type: kill {mob,count} · collect {item,count} · talk {npc} · dungeon {tier} · dungeons {count} · boss {mob}
export const QUESTS = [
  { id: 'q1', npc: 'elara', lvl: 1, name: 'Lobos a las puertas', text: 'Los lobos grises rondan el pueblo y asustan a los niños. Acaba con 6 de ellos en los prados de alrededor.', obj: { type: 'kill', mob: 'lobo', count: 6 }, xp: 260, gold: 12, item: { slot: 'arma', rarity: 1 } },
  { id: 'q2', npc: 'marta', lvl: 2, name: 'Limos en el agua', text: 'Unos limos verdes han salido del Lago Espejo, al oeste, y ensucian el agua de la posada. ¡Elimina 8!', obj: { type: 'kill', mob: 'limo', count: 8 }, xp: 380, gold: 18, potions: 3 },
  { id: 'q3', npc: 'tobias', lvl: 3, name: 'Pieles para el invierno', text: 'Necesito pieles de jabalí para hacer abrigos. Los jabalíes salvajes viven en los prados lejanos. Tráeme 5.', obj: { type: 'collect', item: 'piel', count: 5 }, xp: 450, gold: 30, item: { slot: 'pecho', rarity: 1 } },
  { id: 'q4', npc: 'orvin', lvl: 1, name: 'El primer portal', text: 'Hay un portal verde al este del pueblo: la Cripta Esmeralda. Entra, derrota al Fuego Fatuo Esmeralda y vuelve a contármelo.', obj: { type: 'dungeon', tier: 0 }, xp: 900, gold: 40, item: { slot: 'abalorio', rarity: 2 } },
  { id: 'q5', npc: 'elara', lvl: 6, req: 'q1', name: 'Bandidos en el camino', text: 'Unos bandidos asaltan a los viajeros en las afueras de la pradera. Dales una lección: derrota a 6.', obj: { type: 'kill', mob: 'bandido', count: 6 }, xp: 1100, gold: 45, item: { slot: 'cabeza', rarity: 1 } },
  { id: 'q6', npc: 'elara', lvl: 8, req: 'q5', name: 'Un mensaje para Lía', text: 'La guardabosques Lía vigila el campamento al norte, en el Bosque Sombrío. Sigue el camino y lleva este mensaje.', obj: { type: 'talk', npc: 'lia' }, xp: 700, gold: 20 },
  { id: 'q7', npc: 'orvin', lvl: 9, req: 'q4', name: 'Cavernas de Escarcha', text: 'El portal cian está al noroeste. Dentro espera el Lobo Espectral Glacial. Demuéstrame que estás listo.', obj: { type: 'dungeon', tier: 1 }, xp: 2200, gold: 70, item: { slot: 'arma', rarity: 2 } },
  { id: 'q8', npc: 'lia', lvl: 10, req: 'q6', name: 'Plaga de arañas', text: 'Las arañas del bosque se multiplican. Si no las frenamos, cubrirán todo de telarañas. Elimina 8.', obj: { type: 'kill', mob: 'arana', count: 8 }, xp: 1900, gold: 55, item: { slot: 'botas', rarity: 1 } },
  { id: 'q9', npc: 'lia', lvl: 13, req: 'q8', name: 'Huesos inquietos', text: 'Esqueletos errantes vagan entre los árboles. Tráeme 6 fragmentos de hueso para estudiar qué los despierta.', obj: { type: 'collect', item: 'hueso', count: 6 }, xp: 2600, gold: 70, item: { slot: 'piernas', rarity: 2 } },
  { id: 'q10', npc: 'lia', lvl: 16, req: 'q9', name: 'El rey del bosque', text: 'Los osos pardos se han vuelto agresivos en lo más profundo del bosque. Derrota a 4.', obj: { type: 'kill', mob: 'oso', count: 4 }, xp: 3200, gold: 90, item: { slot: 'pecho', rarity: 2 } },
  { id: 'q11', npc: 'lia', lvl: 18, req: 'q10', name: 'Rumbo al Cañón Rojo', text: 'Darío, un explorador, acampa en el Cañón Rojo, al este. Necesita a alguien como tú. Sigue el camino del este.', obj: { type: 'talk', npc: 'dario' }, xp: 1500, gold: 40 },
  { id: 'q12', npc: 'dario', lvl: 20, req: 'q11', name: 'Aguijones rojos', text: 'Los escorpiones rojos no me dejan explorar. Despeja el camino: derrota a 10.', obj: { type: 'kill', mob: 'escorpion', count: 10 }, xp: 4200, gold: 110, item: { slot: 'cabeza', rarity: 2 } },
  { id: 'q13', npc: 'dario', lvl: 23, req: 'q12', name: 'Corazones de piedra', text: 'Los gólems de roca tienen un núcleo brillante. Consígueme 6 y te pagaré bien.', obj: { type: 'collect', item: 'nucleo', count: 6 }, xp: 5200, gold: 150, item: { slot: 'arma', rarity: 3 } },
  { id: 'q14', npc: 'orvin', lvl: 17, req: 'q7', name: 'Maestro de portales', text: 'Has visto dos mazmorras. Completa cinco distintas y te consideraré un verdadero cazador de espectros.', obj: { type: 'dungeons', count: 5 }, xp: 9000, gold: 300, item: { slot: 'abalorio', rarity: 3 } },
  { id: 'q15', npc: 'orvin', lvl: 33, req: 'q14', name: 'El Bosque Invernal', text: 'Dicen que el muro de hielo del sur solo se rompe cuando alguien vence a los diez espectros. Completa las diez mazmorras.', obj: { type: 'dungeons', count: 10 }, xp: 40000, gold: 1000, item: { slot: 'arma', rarity: 4 } },
  { id: 'q16', npc: 'nieve', lvl: 76, name: 'La Reina de la Escarcha', text: 'En el corazón del Bosque Invernal anida la Reina Araña de Escarcha. Acaba con ella y el bosque volverá a dormir.', obj: { type: 'boss', mob: 'reina' }, xp: 80000, gold: 3000, item: { slot: 'pecho', rarity: 4 } },
];
export const QUEST_BY_ID = Object.fromEntries(QUESTS.map((q) => [q.id, q]));
