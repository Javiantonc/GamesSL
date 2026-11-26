// Portales de mazmorra: 10 dificultades, cada una con su color, cada 8 niveles.
// El jefe de cada mazmorra es un espectro teñido de su color.
export const DUNGEONS = [
  d('Cripta Esmeralda', 'Verde', '#3ddc6a', 1, [70, 48], ['e_lobo', 'e_fatuo'], 'e_fatuo', 'Fuego Fatuo Esmeralda'),
  d('Cavernas de Escarcha', 'Cian', '#2fe0e0', 9, [-95, -70], ['e_lobo', 'e_guerrero'], 'e_lobo', 'Lobo Espectral Glacial'),
  d('Grutas Abisales', 'Azul', '#3b6bff', 17, [-90, -175], ['e_guerrero', 'e_hechicero'], 'e_hechicero', 'Hechicero Espectral Abisal'),
  d('Santuario Arcano', 'Morado', '#a64dff', 25, [120, -215], ['e_guerrero', 'e_fatuo', 'e_lobo'], 'e_guerrero', 'Guerrero Espectral Arcano'),
  d('Jardín Maldito', 'Rosa', '#ff5fc8', 33, [215, -60], ['e_lobo', 'e_hechicero', 'e_grifo'], 'e_grifo', 'Grifo Espectral Maldito'),
  d('Minas de Ámbar', 'Naranja', '#ff9a2b', 41, [235, 95], ['e_guerrero', 'e_fatuo'], 'e_fatuo', 'Fuego Fatuo de Ámbar'),
  d('Forja Ígnea', 'Rojo', '#ff3b3b', 49, [150, 130], ['e_lobo', 'e_guerrero', 'e_hechicero'], 'e_lobo', 'Lobo Espectral Ígneo'),
  d('Cámara del Rey Dorado', 'Dorado', '#ffd34d', 57, [-235, 115], ['e_guerrero', 'e_hechicero', 'e_grifo'], 'e_hechicero', 'Hechicero del Rey Dorado'),
  d('Ciudadela de Cristal', 'Blanco', '#e6f0ff', 65, [-240, -60], ['e_guerrero', 'e_fatuo', 'e_lobo'], 'e_guerrero', 'Guerrero Espectral de Cristal'),
  d('Abismo del Vacío', 'Negro', '#8a7ab8', 73, [-215, -235], ['e_lobo', 'e_hechicero', 'e_grifo', 'e_guerrero'], 'e_grifo', 'Grifo del Vacío'),
];
export const DUNGEONS_TO_UNLOCK_WINTER = 10;

function d(name, colorName, color, minLevel, pos, mobs, boss, bossName) {
  return { name, colorName, color, hex: parseInt(color.slice(1), 16), minLevel, maxLevel: minLevel + 7, pos, mobs, boss, bossName };
}
