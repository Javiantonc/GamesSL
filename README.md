# Mini Realms · Reinos de Albor

RPG en 3D para el navegador, al estilo de los MMO clásicos (como World of ClaudeCraft), hecho con **Three.js + Vite**. Mantiene las ideas de Mini Realms: cuatro clases, nivel máximo 80, **10 mazmorras de colores (una cada 8 niveles)** con jefes espectrales y el **Bosque Invernal**, que se desbloquea al completarlas todas.

> Esta rama es `mini-realms-mmo`. El juego 2D original sigue en `main` y el modo survivor en `mini-realms-3d`.

## Jugar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

En Vercel: importa el repositorio, elige la rama `mini-realms-mmo` y despliega (el `vercel.json` ya está configurado).

La partida se guarda sola en el navegador (localStorage).

## Controles

| Ordenador | |
|---|---|
| `WASD` / flechas | Moverse (relativo a la cámara) |
| Arrastrar con el ratón | Girar la cámara (con el botón derecho el héroe gira también) |
| Rueda | Zoom |
| `Espacio` | Saltar |
| `Tab` | Siguiente enemigo |
| Clic / clic derecho | Seleccionar / atacar |
| `1`-`6` | Habilidades |
| `7` / `8` | Poción de vida / de maná |
| `H` | Piedra de hogar (volver a Albor) |
| `F` | Hablar con un NPC o usar un portal |
| `C` `B` `L` `M` | Personaje, bolsa, misiones, mapa |

En móvil: joystick a la izquierda, arrastra el dedo para girar la cámara y toca un enemigo para seleccionarlo.

## Contenido

- **Clases**: Tanque (Furia), Asesino (Energía y puntos de combo), Mago (Maná, hechizos con tiempo de lanzamiento) y Support (curaciones, escudos y daño sagrado). Seis habilidades cada una, que se aprenden por nivel.
- **Atributos**: Poder, Agilidad, Magia y Resistencia. 3 puntos por nivel (ventana de Personaje).
- **Mundo**: Pradera de Albor (Nv 1-10) con el pueblo, Bosque Sombrío al norte (Nv 10-20), Cañón Rojo al este (Nv 20-30), Lago Espejo al oeste y el Bosque Invernal al sur (Nv 76-80), detrás del muro de hielo.
- **Misiones**: 16 misiones con NPCs (Capitana Elara, Tobías, Brunilda, Maestro Orvin, Marta, Lía, Darío y Vigía Nieve). `!` = misión nueva, `?` = misión para entregar.
- **Mazmorras**: Cripta Esmeralda (verde, Nv 1) → Cavernas de Escarcha (cian, 9) → Grutas Abisales (azul, 17) → Santuario Arcano (morado, 25) → Jardín Maldito (rosa, 33) → Minas de Ámbar (naranja, 41) → Forja Ígnea (rojo, 49) → Cámara del Rey Dorado (dorado, 57) → Ciudadela de Cristal (blanco, 65) → Abismo del Vacío (negro, 73). Salas con espectros del color de la mazmorra, élites y un jefe con un golpe en área que hay que esquivar.
- **Botín**: equipo con 5 rarezas (común → legendario), oro, pociones. Tobías compra y vende; Brunilda forja tu equipo hasta +10; Marta te deja descansar.

## Estructura

```
src/
  main.js          arranque
  game.js          escena, cámara, control, NPCs, portales, mazmorras, guardado
  combat.js        habilidades, daño, botín, proyectiles, efectos
  quests.js        misiones
  mobs.js          aparición e IA de monstruos
  player.js        estado del jugador (atributos, equipo, bolsa)
  ui.js            interfaz (marcos, barra de acción, minimapa, ventanas, táctil)
  portraits.js     retratos de los héroes
  gfx.js           materiales toon y geometrías compartidas
  data/            clases, objetos, monstruos, mazmorras, misiones
  world/           terreno, decorado, modelos 3D, mazmorras
```

Todos los modelos se generan por código con formas simples; no hay imágenes ni modelos externos.
