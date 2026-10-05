# Pruebas y verificación

| Comando | Qué comprueba | Cuándo |
| --- | --- | --- |
| `npm run content:check` | Estructura: slots `___`, índices de respuesta, opciones únicas, efectos y actores válidos, regex de `fallback`, temas de examen | Siempre que edites `content/` |
| `npm run content:verify` | Lo anterior y además compila cada `check`, cada `solution` y cada `starter` contra el compilador real | Antes de dar por bueno contenido nuevo, sobre todo si lo generó un LLM |
| `npm run typecheck` | Tipos de TypeScript | Tras cambios de código |
| `npm run playtest -- <ruta>` | Un bot juega la lección o examen en Chrome headless y guarda capturas en `.playtest/` | Tras cambios visuales o de contenido |
| `npm run build` | Build de producción | Antes de entregar |

## Playtest

Necesita el servidor en marcha y Chrome instalado.

```bash
npm run dev
BASE_URL=http://localhost:3000 npm run playtest -- /play/rust/lesson/hola-let --mistakes=1
npm run playtest -- /play/rust/exam/senior --mistakes=3 --size=390x844 --out=.playtest/movil
```

El bot responde con los datos del contenido, comete `--mistakes` errores a propósito y falla con código 1 si hay errores de página o si no llega al final. Variables: `BASE_URL` y `CHROME_PATH`.

Las lecciones bloqueadas redirigen al mapa. Para probar una región avanzada en local, completa las anteriores o aprueba una prueba de ingreso. Después, `npm run db:reset` deja la base limpia.
