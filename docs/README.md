# Documentación de Bit Forge

Bit Forge es un arcade retro (pixel art NES/Game Boy) para **aprender** lenguajes de programación jugando. Esta carpeta explica cómo funciona y cómo extenderlo. Está escrita para personas y para LLMs: cada documento es autocontenido, usa rutas reales del repo y termina con una lista de verificación.

## Mapa de documentos

| Documento | Léelo cuando quieras... |
| --- | --- |
| [architecture.md](architecture.md) | Entender cómo encajan Next.js, SQLite, el escenario SVG y el mapa 3D |
| [content-model.md](content-model.md) | Conocer cada tipo de beat y cada efecto visual, con ejemplos |
| [authoring-lessons.md](authoring-lessons.md) | Añadir lecciones o regiones a un lenguaje existente |
| [adding-a-language.md](adding-a-language.md) | Añadir un lenguaje nuevo (Go, Zig, ...) |
| [exams.md](exams.md) | Entender o ampliar la prueba de ingreso (junior, semi senior, senior) |
| [game-design.md](game-design.md) | Conocer los principios "dopagaki", la puntuación y la progresión |
| [testing.md](testing.md) | Validar contenido, jugar en headless y comprobar el build |
| [research/](research/) | Investigación de soporte, como lo que evalúan las empresas en Rust |

## Ideas clave en 30 segundos

1. **El contenido es datos.** Todo lo que el jugador ve está en `content/<lenguaje>/`. El motor no sabe nada de Rust.
2. **El motor es genérico.** Siete tipos de beat y un vocabulario de efectos visuales cubren cualquier lenguaje.
3. **Todo es verificable.** Cada afirmación sobre el compilador lleva un `check` que `npm run content:verify` compila de verdad.
4. **SQLite se sincroniza solo.** Al arrancar, el contenido se copia a la base de datos sin tocar el progreso del jugador.

## Comandos

```bash
npm run dev              # servidor de desarrollo
npm run content:check    # valida la estructura del contenido
npm run content:verify   # además compila cada check contra el compilador real
npm run playtest -- /play/rust/lesson/hola-let   # un bot juega la lección en Chrome headless
npm run typecheck && npm run build
npm run db:reset         # borra el progreso local
```

## Para agentes de IA

Lee primero `AGENTS.md` en la raíz. Hay playbooks listos en [`playbooks/`](playbooks/) para las tareas habituales: añadir lecciones, añadir un lenguaje, ampliar exámenes y verificar contenido.
