# Mini Realms: RPG de supervivencia 2D (Phaser 3 + Vite)

Prototipo jugable de un RPG de mundo abierto en 2D *top-down* con progresión inspirada en World of Warcraft
(barra de acción con cooldowns, loot por rarezas, equipo que sube estadísticas, niveles que desbloquean habilidades)
y una estética chibi colorida de juego de móvil.

## Cómo arrancarlo

```bash
npm install
npm run dev            # servidor de desarrollo con recarga en caliente (http://localhost:5173)
npm run build          # build de producción en dist/
npm run build:single   # todo el juego en un único dist-single/index.html
```


## Desplegar en Vercel

1. Entra en [vercel.com/new](https://vercel.com/new) e importa este repositorio (`Javiantonc/GamesSL`).
2. Vercel detecta Vite solo (también está fijado en `vercel.json`): *Build Command* `npm run build`, *Output Directory* `dist`.
3. Pulsa **Deploy**. Cada `git push` a `main` redespliega automáticamente.
4. Comparte con tus compañeros la URL `https://<proyecto>.vercel.app`.

Alternativa sin Vercel: `npm run build:single` genera `dist-single/index.html`, un único fichero que se puede enviar y abrir con doble clic.

## Controles

| Tecla | Acción |
|---|---|
| WASD / flechas | Moverse |
| Clic izquierdo sobre un monstruo / Tab | Seleccionar objetivo (Tab va rotando entre los cercanos) |
| Clic derecho sobre un monstruo | **Ataque básico** (Golpe Heroico): lo selecciona y le ataca. Clic derecho en el suelo ataca a tu objetivo actual |
| 1 … 0 | Usar la habilidad de esa ranura (o clic en la ranura) |
| E | Junto a un **portal**: entrar o salir de la mazmorra. Si no, talar el árbol más cercano |
| T | **Tablet**: apps Clase, Atributos, Habilidades, Objetos y Tienda |
| O | Tablet → Tienda |
| B / I | Tablet → app Objetos |
| P / K | Tablet → app Habilidades |
| C | Hoja de personaje y equipo |
| Clic derecho en Objetos | Usar o equipar |
| Clic derecho en el equipo | Quitar la pieza |
| Esc | Cerrar las ventanas o quitar el objetivo |

**Arrastrar y soltar:** habilidades desde la app Habilidades a la barra, entre ranuras de la barra (y fuera para quitarlas),
de la app Objetos al equipo y al revés, dentro del inventario y a la papelera.

## Mazmorras por colores (10 portales, de 8 en 8 niveles)

El mundo exterior mide 280×280 baldosas. Los 10 portales se reparten desde cerca del inicio (24 baldosas) hasta el borde
del mapa (unas 115): cuanto más lejos, más difícil. El color del portal es el de la mazmorra, y dentro todo se tiñe de
ese color. **Los jefes son los espectros** (`gfx/spectres.js`), teñidos del color de su mazmorra y con un aura propia:

| Color | Mazmorra | Nivel | Jefe | Cómo pelea |
|---|---|---|---|---|
| 🟢 Verde | Cripta Esmeralda | 1-8 | Fuego Fatuo Esmeralda | Proyectiles; se cura un 4 % cada 5 s |
| 💠 Cian | Cavernas de Escarcha | 9-16 | Lobo Espectral Glacial | Muy rápido |
| 🔵 Azul | Grutas Abisales | 17-24 | Hechicero Espectral Abisal | Proyectiles a distancia |
| 🟣 Morado | Santuario Arcano | 25-32 | Guerrero Espectral Arcano | Tajos en área |
| 🌸 Rosa | Jardín Maldito | 33-40 | Grifo Espectral Maldito | Vuela sobre los muros y ataca en picado (área) |
| 🟠 Naranja | Minas de Ámbar | 41-48 | Fuego Fatuo de Ámbar | Como el verde, más fuerte |
| 🔴 Rojo | Forja Ígnea | 49-56 | Lobo Espectral Ígneo | |
| 🟡 Dorado | Cámara del Rey Dorado | 57-64 | Hechicero del Rey Dorado | |
| ⚪ Blanco | Ciudadela de Cristal | 65-72 | Guerrero Espectral de Cristal | |
| ⚫ Negro | Abismo del Vacío | 73-80 | Grifo del Vacío | |

- Los jefes atacan al jugador y también a sus espectros.
- Si eres Mago de nivel 50 o más y reclutas a un jefe, obtienes **su espectro en versión gigante**.
- La mazmorra se reinicia al entrar. Al derrotar al jefe ganas XP extra, la mazmorra queda marcada con ✔ en su portal
  y aparece un portal de salida.

## ❄️ Bosque Invernal (contenido de fin de juego)

`world/WinterGenerator.js` añade una zona nevada de 150×104 baldosas, con lagos helados, crestas de roca helada, pinos
nevados y nevada constante.

- **Se desbloquea al completar las 10 mazmorras.** El portal de hielo está en el Claro del Inicio y muestra el progreso
  (por ejemplo, "🔒 Mazmorras 3/10").
- **Bestias de nivel 76-86**, más fuertes cuanto más te adentras:
  - 🐻 **Oso Polar**: mucha vida y zarpazos en área.
  - 💀 **Esqueleto de Escarcha**: esqueleto helado y más duro.
  - 🕷️ **Araña de Escarcha**: rápida y agresiva.
- Al fondo espera la **Reina Araña de Escarcha** (nivel 88), con su escolta. Es la jefa del bosque y suelta botín legendario.
- Sueltan los nuevos materiales 🐾 Piel de oso polar y 🧊 Cristal de escarcha (valiosos en la tienda) y equipo de nivel
  de objeto superior a 80, que se puede equipar a nivel 80.
- Si recluta a estas bestias, el Mago obtiene: Oso → Guerrero, Araña → Lobo y Esqueleto → Hechicero.

## Ejército de espectros (Mago, nivel 50+)

Al llegar a nivel 50, el Mago aprende **👥 Reclutar Sombras**, y a nivel 60, **🌑 Furia Sombría**
(`systems/ShadowArmy.js`, `entities/Shadow.js` y el arte en `gfx/spectres.js`):

1. Cada enemigo que muere cerca deja una **esencia turquesa** durante 12 s.
2. *Reclutar Sombras* alza esas esencias como **espectros aliados**: diseños originales de llama turquesa, cada uno con su rol.

| Enemigo | Espectro | Rol |
|---|---|---|
| Goblin | ⚔️ Guerrero Espectral | **Tanque**: más vida y armadura, y los enemigos que golpea van a por él |
| Lobo | 🐺 Lobo Espectral | **Rápido**: mucho daño cuerpo a cuerpo |
| Esqueleto | 🔮 Hechicero Espectral | **Distancia**: lanza llamas y mantiene la distancia |
| Limo | ✨ Fuego Fatuo | **Curandero**: cura al jugador y a los espectros cercanos |
| Cualquier jefe | 🦉 Grifo Espectral | **Vuela** sobre muros y árboles y ataca en picado (daño en área) |

3. Te siguen en formación y atacan a tu objetivo o a quien te esté atacando. Se teletransportan a tu lado si se quedan
   atrás, si se atascan o si cruzas un portal. Los monstruos también pueden atacarles.
4. **Capacidad:** 3 plazas a nivel 50, +1 cada 5 niveles y +1 por cada 3 rangos (hasta 12). Un espectro de élite ocupa 2 plazas y el grifo 3.
5. *Furia Sombría* cura un 50 % al ejército y le da +60 % de daño, +30 % de velocidad y ataques más rápidos durante 10 s.
6. El panel del HUD muestra cada espectro con su vida, y el minimapa los marca en turquesa. Si cambias de clase, el ejército se disuelve.

## Tienda y oro (app 🛒 de la tablet)

Los monstruos sueltan **oro** al morir (×3 los élites, ×25 los jefes). Se gasta en la tienda (`data/shop.js`):

- **⚒️ Forja:** mejora cualquier pieza equipada de +1 a +15. Cada nivel da +12 % a todas sus estadísticas
  (el arma también sube su daño). El coste crece con el nivel del objeto, la rareza y las mejoras previas.
- **⚡ Poderes:** mejoras permanentes que valen para cualquier clase: Fuerza Bruta (+daño), Vitalidad (+vida),
  Arcano (+maná), Precisión (+crítico), Baluarte (+reducción de daño), Celeridad (+velocidad) y Sabiduría (+XP).
  También hay pergaminos que dan puntos de habilidad o de atributo extra.
- **🧪 Consumibles:** pociones de vida y de maná, y comida.
- **💰 Vender:** clic en un objeto para venderlo, o vender de golpe todo el equipo común y poco común.

## Clases, atributos y habilidades (la tablet)

- **Clases** (`data/classes.js`): Asesino, Mago, Tanque y Support. Se elige al empezar y se cambia gratis desde la tablet.
  Cada clase multiplica un atributo, da bonos pasivos, tiñe la túnica del personaje y tiene 5 habilidades propias
  (niveles 1, 4, 9, 16 y 25). El *Ataque* básico (clic derecho) es común a todas.
- **Atributos:** cada nivel da 3 puntos para **Poder** (poder de ataque), **Resistencia** (vida), **Agilidad**
  (crítico) y **Magia** (maná y poder con hechizos). Cada punto suma +2. Se pueden reiniciar.
- **Rangos de habilidad:** cada nivel da 1 punto de habilidad. Cada rango (hasta 10) da +20 % de potencia
  y -4 % de reutilización (y +10 % de duración en los efectos temporales).
- **Nivel máximo: 80.** XP para subir = 70 × nivel^1,45. Los monstruos del exterior llegan hasta ~nivel 40 en los bordes;
  a partir de ahí se sube en las mazmorras.
- Tipos nuevos de habilidad: `buff` (Frenesí, Poder Arcano, Muro de Escudos, Bendición), `hot` (Renovar)
  y `taunt` (Grito Desafiante).

## Arquitectura

```
src/
├── main.js                 Configuración de Phaser (Arcade Physics, escalado RESIZE)
├── config.js               Constantes: tamaño del mundo, semilla, respawns…
├── core/
│   └── EventBus.js         Bus de eventos: el modelo emite y la UI escucha
├── data/                   ← DISEÑO DE JUEGO (datos puros, fáciles de balancear)
│   ├── abilities.js        Habilidades por clase: tipo, coste, cooldown, escalado, rangos
│   ├── classes.js          Clases (mods, bonos, perks) y atributos mejorables
│   ├── dungeons.js         10 mazmorras: color, rango de nivel, monstruos, jefe espectral, botín
│   ├── shop.js             Tienda: forja, poderes, pergaminos, consumibles, precios, oro
│   ├── items.js            Rarezas, ranuras, generador de equipo aleatorio, consumibles
│   └── mobs.js             Monstruos: stats por nivel, bioma, velocidad, botín
├── world/
│   ├── noise.js            PRNG con semilla + ruido de valor fBm
│   ├── WorldGenerator.js   Elevación y humedad → lagos, costa, pradera, bosque, colinas, montañas
│   ├── DungeonGenerator.js Salas + pasillos + baldosas por color, añadidos al tilemap
│   ├── DungeonManager.js   Portales, entrar/salir, jefes, progreso, Bosque Invernal, nevada
│   ├── WinterGenerator.js  Bosque Invernal: nieve, lagos helados, bestias y Reina Araña
│   └── TreeManager.js      Árboles: obstáculo con colisión en el tronco + recurso que vuelve a crecer
├── systems/                ← LÓGICA (sin depender de Phaser, salvo Combat y Loot)
│   ├── PlayerState.js      Modelo del jugador: nivel, XP, recursos, hambre, cooldowns
│   ├── Inventory.js        Mochila de 32 ranuras con pilas
│   ├── Equipment.js        10 ranuras de equipo y suma de estadísticas
│   ├── ActionBar.js        10 ranuras que guardan ids de habilidad
│   ├── Stats.js            Primarias por nivel + equipo → vida, maná, poder, crítico, armadura
│   ├── Progression.js      Curva de XP, XP por monstruo, color del nivel enemigo
│   ├── CombatSystem.js     Lanzar (GCD, CD, maná, alcance), daño, proyectiles, áreas, muerte
│   ├── lootTables.js       Tirada de botín (función pura)
│   ├── LootSystem.js       Bolsas en el suelo con brillo por rareza y recogida automática
│   └── ShadowArmy.js       Ejército de sombras del Mago: esencias, reclutar, capacidad, furia
├── entities/
│   ├── Player.js           Cuerpo físico + contenedor chibi por capas (el equipo se ve puesto)
│   ├── Mob.js              IA idle → chase → leash, placas de nombre y vida, élites
│   └── Shadow.js           Espectro aliado: tipos, roles, IA, vuelo del grifo
├── gfx/
│   ├── characters.js       Personaje jugador por clase (capas, tintes, retratos)
│   ├── spectres.js         Espectros del ejército del Mago (5 diseños)
│   └── textures.js         Arte procedural (Canvas 2D) → texturas de Phaser
├── scenes/
│   ├── BootScene.js        Genera o carga las texturas
│   └── GameScene.js        Mundo, entrada, objetivo, bucle principal, muerte y reaparición
└── ui/                     ← INTERFAZ EN HTML/CSS POR ENCIMA DEL CANVAS
    ├── UIManager.js        Monta la UI, micro-menú y retratos del personaje
    ├── HUD.js              Marcos de jugador y objetivo, XP, mensajes, botín, banner de nivel
    ├── ActionBarUI.js      Barra de acción + barrido de cooldown (conic-gradient)
    ├── TabletUI.js         Tablet con 4 apps: Clase, Atributos, Habilidades, Objetos
    ├── CharacterUI.js      Muñeco con ranuras de equipo + estadísticas que parpadean al cambiar
    ├── Minimap.js          Minimapa circular con zona y coordenadas
    ├── Tooltip.js          Tooltips con comparación ▲/▼ contra lo equipado
    ├── Panel.js / dom.js   Ventana base y utilidades de arrastrar y soltar
    └── styles.css
```

### Decisiones clave

- **Modelo, vista y eventos.** `PlayerState`, `Inventory`, `Equipment` y `ActionBar` no saben nada de Phaser ni del
  DOM. Emiten eventos (`inventory:changed`, `stats:changed`, …) y la UI se repinta. Así se puede guardar la partida con
  `JSON.stringify(state)`, testear con Vitest o llevar la lógica a un servidor multijugador.
- **UI en HTML/CSS y no dentro del canvas.** Arrastrar y soltar nativo, tooltips, grids y animaciones CSS salen
  prácticamente gratis, y es justo lo que ya dominas de DAW. Phaser solo dibuja el mundo.
- **Los datos mandan.** Añadir una habilidad, un monstruo o un sufijo de objeto es añadir una entrada en `data/`.
- **Rendimiento.** Tilemap de Phaser con culling, árboles como cuerpos estáticos (árbol espacial RTree), mobs lejanos
  dormidos (`AI_ACTIVE_RADIUS`) y minimapa pre-renderizado una sola vez.

### Fórmulas (en `Stats.js` y `CombatSystem.js`)

- Atributo = base por nivel + puntos × 2 + equipo, × multiplicador de clase
- Vida = 40 + Resistencia × 10 · Maná = 30 + Magia × 8
- Poder de ataque = Poder × 1,2 + Agilidad × 0,5 · Poder con hechizos = Magia × 1,1
- Daño = (base + ap × PA + sp × PH + weapon × DañoArma) × rango × bonos (±10 %, crítico ×1,75)
- Reducción de daño = Armadura / (Armadura + 80 + nivel × 15), máximo 75 %
- XP para subir = 70 × nivel^1,45 · los monstruos 6 o más niveles por debajo no dan XP

## Personaje por clase

`gfx/characters.js` dibuja un chibi original distinto para cada clase, a doble resolución para que tenga más detalle:

| Clase | Aspecto |
|---|---|
| Aventurero (sin clase) | Pelo castaño en punta, túnica azul y espada |
| 🗡️ Asesino | Capucha, bufanda roja, chaleco de cuero con correas cruzadas y dos dagas |
| 🔮 Mago | Pelo plateado largo, sombrero puntiagudo con estrella, túnica larga y bastón con orbe |
| 🛡️ Tanque | Yelmo con carrilleras y penacho, armadura de placas, tabardo, espada y escudo |
| ✨ Support | Trenza rubia, diadema alada, túnica blanca con capa y báculo solar |

- El personaje está formado por capas: botas, cuerpo, adornos, arma, escudo o daga, cabeza, parpadeo y tocado.
  `characterLayers(state)` decide qué capas se ven, y la usan tanto el sprite del juego como los retratos de la UI.
- **El equipo se ve puesto:** el tocado, los adornos del cuerpo, el arma y el escudo se tiñen con el color de su rareza
  (de poco común en adelante). Si no llevas nada en esa ranura, usan el color propio de la clase.
- La animación es procedural: pies que se alternan al andar, rebote, cabeza que se balancea, respiración, parpadeo
  y ataque con las dos dagas en el caso del asesino.

## Arte: de procedural a sprites reales

Todo el arte se genera por código en `gfx/textures.js` para que el prototipo funcione sin assets. Para usar tu propio
arte chibi, cárgalo en `BootScene.preload()` con **la misma clave** (`assassin_head`, `mage_body`, `w_staff`, `m_wolf`, `tree_oak`, `tiles`…) y quita
la llamada correspondiente. El juego no necesita más cambios. Para animaciones por fotogramas, sustituye las
animaciones procedurales de `Player.update()` / `Mob.update()` por `this.anims.play(...)`.

## Siguientes pasos sugeridos

1. **Guardado:** `localStorage.setItem('save', JSON.stringify(state))` y un `PlayerState.fromJSON()`.
2. **Artesanía de supervivencia:** recetas con madera, gelatina y hueso (hoguera = cocinar carne, vendas…).
3. **Tiempos de lanzamiento** con barra de casteo, como la Bola de Fuego de WoW.
4. **Misiones** con un PNJ en el Claro del Inicio (`data/quests.js` + rastreador en el HUD).
5. **Ciclo día/noche** con un overlay de color, y mobs nocturnos más fuertes.
6. **Talentos:** árbol simple que modifique `ABILITIES` (por ejemplo, +20 % de daño de fuego).
7. **Pathfinding** (EasyStar.js) para que los mobs rodeen lagos y árboles.
8. **Migrar a TypeScript** con interfaces `Item`, `Ability` y `MobDef`.
