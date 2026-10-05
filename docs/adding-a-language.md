# Cómo añadir un lenguaje

Ejemplo: Go. Ningún archivo del motor cambia salvo el resaltado y, opcionalmente, un runner.

## Pasos

1. **Paquete.** Crea `content/go/index.ts` exportando un `LanguagePack`:
   ```ts
   export const go: LanguagePack = {
     slug: "go", name: "GO", tagline: "Concurrencia simple con goroutines", color: "#0099db",
     status: "active", runner: "go-playground",
     regions: [/* importadas de ./regions/*.ts */],
     topics, exams,
   };
   ```
   Copia la estructura de `content/rust/`: `helpers.ts`, `topics.ts`, `exams.ts` y `regions/`.
2. **Registro.** En `content/index.ts`, reemplaza `soon("go", ...)` por el paquete importado (`import { go } from "./go/index.ts"`).
3. **Resaltado.** Añade la gramática en `GRAMMARS` de `lib/syntax.ts` (palabras clave y tipos). Si falta, se usa la de Rust.
4. **Runner (opcional).** Para beats `run` y para verificar `check`:
   - Implementa `LanguageRunner` en `lib/runners/<id>.ts` y regístralo en `lib/runners/index.ts`.
   - Añade la ejecución en `runRust`/`verify` de `scripts/validate-content.ts`, eligiendo por `pack.runner`.
   - Ajusta `buildProgram` si el lenguaje necesita otro envoltorio que `fn main`.
   Sin runner, usa solo beats que no necesiten compilador y omite `check`.
5. **Verifica** con la lista de abajo.

## Diseño del mapa de regiones

Ordena las regiones por dependencia pedagógica, de lo concreto a lo abstracto. Para cada lenguaje, identifica los 4–6 conceptos que más cuestan a quien llega de otros lenguajes y dedica una región a cada uno.

| Lenguaje | Regiones sugeridas |
| --- | --- |
| Go | Variables y tipos · Slices y maps · Interfaces · Goroutines y channels · Errores y context |
| Zig | Tipos y comptime · Punteros y slices · Allocators · Errores · Interop con C |
| Haskell | Expresiones y tipos · Pattern matching · Tipos algebraicos · Typeclasses · Mónadas e IO |

## Lista de verificación

- [ ] `npm run content:check` y `npm run content:verify -- --lang=<slug>` sin errores.
- [ ] El cartucho aparece activo en la pantalla de título.
- [ ] `npm run playtest -- /play/<slug>/lesson/<primera-lección>` termina.
- [ ] `npm run typecheck && npm run build` pasan.
