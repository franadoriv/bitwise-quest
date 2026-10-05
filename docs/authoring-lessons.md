# Cómo escribir lecciones y regiones

## Principio pedagógico

El jugador puede no saber nada del lenguaje. **Nunca pidas algo que el juego no haya mostrado antes.** Cada lección sigue este arco:

1. **Gancho** (`dialog`, 1–2 frases). Qué problema resuelve el concepto.
2. **Demostración jugable** (`act`). El jugador pulsa botones, el código aparece línea a línea y el mundo muestra la idea con efectos. Si hay un error típico, muéstralo aquí con `error`.
3. **Práctica guiada** (`pick`, `predict`). Variaciones pequeñas del mismo patrón, con `setup` y `win` que dibujen lo que pasa.
4. **Producción** (`type`, `order`). El jugador recuerda y escribe.
5. **Código real** (`run`). Un programa corto con un bug que arreglar.

Reparte los diálogos entre las preguntas, no los acumules al principio. Una idea nueva por diálogo.

## Ritmo "dopagaki"

- Diálogos de menos de 140 caracteres. Globos `say` de 22 como máximo.
- Ninguna pantalla de más de 10–20 segundos sin feedback.
- Código de 1–6 líneas en preguntas y como mucho 12 en `run`.
- `explain` enseña el porqué en una o dos frases. Es lo que lee quien falla.
- Usa `setup` y `win` para que cada respuesta tenga consecuencia visible.

## Añadir una lección a una región existente

1. Abre `content/<lang>/regions/<region>.ts`.
2. Declara `const miLeccion: LessonDef = { ... }` siguiendo el estilo del archivo.
3. Añádela al array `lessons` de la región, antes del jefe.
4. Ejecuta la verificación (abajo).

## Añadir una región nueva

1. Crea `content/<lang>/regions/<slug>.ts` y exporta un `RegionDef` con `theme` (`village`, `forest`, `mountain`, `castle` o `tower`), 3 lecciones y un jefe al final.
2. Impórtalo en `content/<lang>/index.ts` con extensión `.ts` y colócalo en el orden de aprendizaje. Si había un marcador `status: "soon"`, reemplázalo.
3. Si la región enseña un tema de examen, pon su slug en `topics.<tema>.region` (`content/<lang>/topics.ts`).

## Escribir con un LLM

Pide contenido citando este documento, `docs/content-model.md` y un archivo de región existente como ejemplo de estilo. Exige `check` en cada pregunta que dependa del compilador y `solution` en cada `run`. Después, corre la verificación y corrige hasta que no haya errores. El playbook `docs/playbooks/add-lessons` automatiza este flujo.

## Lista de verificación

- [ ] `npm run content:check` sin errores ni avisos en tus archivos.
- [ ] `npm run content:verify -- --lang=<lang>` sin errores. Todas las afirmaciones están compiladas.
- [ ] `npm run typecheck` pasa.
- [ ] `npm run playtest -- /play/<lang>/lesson/<slug>` termina. Revisa las capturas en `.playtest/`.
- [ ] Ninguna pregunta usa un concepto no presentado antes en la región.
