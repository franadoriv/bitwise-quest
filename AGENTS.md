<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Bit Forge — guía para agentes

Arcade retro (Next.js 16 + Three.js + GSAP/SVG + SQLite nativo de Node) para aprender lenguajes de programación jugando. Rust es el primer lenguaje.

## Antes de tocar nada
- Lee `docs/README.md`. La arquitectura está en `docs/architecture.md` y el esquema de contenido en `lib/content/types.ts`.
- Playbooks del proyecto en `docs/playbooks/`: `add-lessons`, `add-language`, `add-exam-questions` y `verify-content`.

## Reglas
- **El contenido es datos.** Lecciones, regiones, temas y exámenes viven en `content/<lang>/`. No metas lógica de un lenguaje en el motor (`components/`, `lib/`).
- **Imports relativos en `content/`, `lib/content/` y `scripts/` con extensión `.ts`.** Node ejecuta esos archivos directamente (validador y playtest).
- **Toda afirmación sobre el compilador lleva `check`**, y todo beat `run` lleva `solution`. `npm run content:verify` debe quedar sin errores.
- **Texto del jugador en español** (latinoamericano neutro), breve: diálogos < 140 caracteres y globos ≤ 22. El código y los comentarios del motor van en inglés.
- **Migraciones de SQLite solo aditivas**, en `migrate()` de `lib/db.ts`.
- **Tamaños de UI en px del lienzo lógico** de 1280×720 (o 480 de ancho en vertical). `GameFrame` escala todo. Usa `useOrientation()` para cambiar de disposición.
- El runner de Rust envía fragmentos al Rust Playground público. `BITFORGE_RUNNER=off` lo desactiva.

## Verificación mínima antes de terminar
`npm run content:check && npm run typecheck`. Si tocaste contenido, también `npm run content:verify`. Si tocaste UI, haz un playtest (ver `docs/testing.md`) y `npm run build`.

