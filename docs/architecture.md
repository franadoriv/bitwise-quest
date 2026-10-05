# Arquitectura

## Vista general

```
content/<lang>/        Paquetes de lenguaje: regiones, lecciones, temas, exámenes (datos puros)
        │  importados por
        ▼
lib/db.ts              Esquema SQLite + seed idempotente (hash del contenido) + migraciones aditivas
lib/repo.ts            Lecturas y escrituras: mundo, lecciones, progreso, repaso, exámenes
        │  usados por
        ▼
app/                   Rutas Next.js (App Router). Páginas server que leen SQLite y pasan datos a clientes
app/api/*              Endpoints: complete, attempts, review, exam, run
        │
        ▼
components/game/       Motor de lección: Stage (SVG+GSAP), beats, LessonGame (orquestador), ResultScreen
components/exam/       Hub de exámenes y reporte por tema
components/world/      Mapa del mundo en Three.js (low poly) y su HUD
components/title/      Pantalla de título y selección de cartucho
components/ui/         GameFrame (escala 16:9), Settings (paleta y sonido), Providers
components/pixel/      Sprites pixel art definidos como cuadrículas de texto
lib/                   fx (partículas y banners), sfx (chiptune WebAudio), syntax (resaltado), palette, game-rules
lib/runners/           Adaptadores de ejecución de código por lenguaje
scripts/               validate-content.ts y playtest.mjs
```

## Flujo de una lección

1. `app/play/[lang]/lesson/[slug]/page.tsx` comprueba que la lección está desbloqueada y carga `LessonPlay` desde SQLite.
2. `LessonClient` monta `LessonGame` solo en el cliente, porque usa audio, GSAP y barajado aleatorio.
3. `LessonGame` recorre la cola de beats. Por cada beat ejecuta `setup` en el escenario, muestra el componente del beat y espera `solved` o `wrong`.
4. Un acierto suma puntos, combo y bonus de velocidad, ejecuta los efectos `win` y golpea al bug. Un fallo quita un corazón, muestra `explain` y añade el beat al final de la cola.
5. Al terminar, `POST /api/complete` guarda progreso, intentos y repasos, y devuelve XP, monedas y la siguiente lección.

## Escenario y efectos

`components/game/Stage.tsx` dibuja un SVG con `viewBox 240×96`. El fondo se extiende más allá del viewBox, así que llena cualquier proporción sin recortar. Los actores son `hero`, `ally` y `enemy`. Hay un objeto principal y un "fantasma" para clones y préstamos. El contenido no anima nada directamente: describe efectos (`give`, `lend`, `drop`...) y el escenario decide cómo se ven. Así, el mismo contenido funciona aunque cambie el arte.

## Marco 16:9

`components/ui/GameFrame.tsx` dibuja la interfaz sobre un lienzo lógico de 1280×720 y lo escala con CSS `zoom` para llenar la ventana. En vertical usa un lienzo de 480 px de ancho y una sola columna. Los componentes usan `useOrientation()` para elegir su disposición. Todos los tamaños en px se refieren al lienzo lógico.

## Base de datos

SQLite nativo de Node (`node:sqlite`), archivo en `data/bitforge.db`. Se puede cambiar con `BITFORGE_DB`.

| Tabla | Contenido |
| --- | --- |
| `languages`, `regions`, `lessons` | Copia del contenido. Se reescribe cuando cambia el hash de `content/` |
| `players` | Perfil local único (id 1): XP, monedas, racha |
| `progress` | Estrellas, mejor puntuación, completada o saltada por lección |
| `attempts` | Cada respuesta, para calcular el dominio por lección |
| `reviews` | Cajas de Leitner para el repaso ("bugs errantes") |
| `exam_results` | Intentos de prueba de ingreso con desglose por tema |

Las migraciones son aditivas y viven en `migrate()` de `lib/db.ts`. Nunca borres columnas: añade nuevas.

## Reglas de desbloqueo

- Una región se desbloquea cuando todas las lecciones de la anterior están completadas o saltadas.
- Una lección se desbloquea cuando la anterior de su región está completada.
- Una prueba de ingreso salta regiones en orden mientras el jugador acierte al menos el 80% de las preguntas de sus temas, con un mínimo de 2.

## Ejecución de código

Los beats `run` llaman a `POST /api/run`, que elige el runner del lenguaje (`lib/runners/`). El de Rust envía el fragmento del jugador al Rust Playground público. Con `BITFORGE_RUNNER=off` no se hace ninguna llamada externa y se valida con la regex `fallback` del beat.
