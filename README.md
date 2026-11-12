# Mini Realms 3D · Liga de Criaturas

Proyecto nuevo en **Three.js + Vite** con vista **2.5D** (cámara inclinada sobre un mundo 3D low-poly con sombreado toon). Es un juego de supervivencia por oleadas: tus criaturas atacan solas, tú te mueves, recoges gemas, subes de nivel, capturas compañeros nuevos y los haces evolucionar.

> El RPG 2D original (Phaser) sigue en la rama `main`. Esta rama, `mini-realms-3d`, es el proyecto nuevo.

## Jugar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/ (lo que se despliega en Vercel)
```

En Vercel: importa el repositorio, elige la rama `mini-realms-3d` y despliega (el `vercel.json` ya está configurado).

## Controles

| Ordenador | Móvil |
|---|---|
| `WASD` / flechas: moverse | Arrastra en la mitad izquierda |
| `Espacio`: ataque definitivo | Botón ✦ |
| `P` / `Esc`: pausa | Botón ❚❚ |

## Criaturas (diseños originales)

| Especie | Tipo | Ataque | Evoluciones |
|---|---|---|---|
| Farolín | Fuego | Bolas de fuego en arco que explotan en área | Farolón → Pirofaro |
| Gotín | Agua | Chorros rápidos (atraviesan desde Nv 4) | Gotarro → Marejón |
| Musgoro | Planta | Hojas que giran a tu alrededor | Musgolem → Bosquemu |
| Medusín | Rayo | Rayo en cadena que salta entre enemigos | Medusela → Tormedusa |
| Cristalo | Hielo | Onda helada que ralentiza | Cristalón → Glaciaro |
| Bolarro | Tierra | Terremoto que empuja a los enemigos | Rodarro → Montarro |

- Evolucionan en el **nivel 3** y en el **nivel 6** (máximo 8). Máximo 4 compañeros.
- **Tipos**: fuego > planta/hielo · agua > fuego/tierra · planta > agua/tierra · rayo > agua · hielo > planta/tierra · tierra > fuego/rayo. El daño eficaz hace ×1,5 (número con «!»).
- Los enemigos son versiones salvajes de las mismas especies (ojos rojos y aura oscura).

## Partida

- Aguanta **10 minutos**. Cada minuto llega una **estampida** que te rodea.
- **Alfas salvajes** (jefes) a los 2:30, 5:00 y 7:30. Al vencerlos sueltan muchas gemas y te curan.
- A los 10:00 aparece el **Guardián de la Liga**. Derrótalo para ganar.
- **Ataque definitivo**: se carga derrotando enemigos y golpea a todo lo que te rodea con el tipo más eficaz de tu equipo.

## Estructura

```
src/
  main.js        arranque
  game.js        bucle, oleadas, ataques, gemas, mejoras, jefes
  creatures.js   especies, tipos, modelos 3D procedurales y entrenador
  world.js       pradera low-poly, mesetas, árboles, colisiones
  gfx.js         material toon, geometrías y "horneado" de modelos
  portraits.js   retratos para tarjetas y HUD
  ui.js          interfaz HTML (inicio, HUD, mejoras, final, joystick)
  style.css
```

Todos los modelos se generan por código con formas simples (esferas, conos, cajas), sin imágenes externas.
