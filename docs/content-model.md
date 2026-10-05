# Modelo de contenido

Fuente de verdad: `lib/content/types.ts`. Este documento lo explica con ejemplos.

## Jerarquía

```
LanguagePack            content/<lang>/index.ts
├── regions[]           RegionDef: un concepto grande, una isla del mapa
│   └── lessons[]       LessonDef: 8–14 beats. La última de cada región es mode "boss"
│       └── beats[]     Beat: la unidad mínima de juego (unos segundos)
├── topics{}            TopicDef: temas de examen, enlazados a la región que los enseña
└── exams[]             ExamDef: pruebas de ingreso junior / mid / senior
```

### LessonDef

| Campo | Notas |
| --- | --- |
| `slug` | Único dentro del lenguaje. Aparece en la URL |
| `title` | Corto, cabe en una tarjeta |
| `concept` | Id del concepto, normalmente un id de `topics` |
| `mode` | `"lesson"` (5 corazones) o `"boss"` (3 corazones, timeout cuenta como fallo) |
| `xp` | 40–85 en lecciones (más en regiones avanzadas) y 120–200 en jefes |
| `enemy`, `enemyName` | `slime`, `ghost`, `golem` o `dragon`, y un nombre en mayúsculas ("BUG COLGANTE") |

El bug de la lección tiene tantos puntos de vida como preguntas. Cada acierto le quita uno y cada fallo lo cura uno, porque la pregunta vuelve al final.

## Beats

Campos comunes (`BeatBase`): `setup` (efectos al empezar; si existe, se limpia la escena), `win` (efectos al acertar), `time` (segundos para el bonus; en jefes y exámenes, el límite), `check` (prueba para el validador) y `concept`.

| kind | Para qué | Campos clave |
| --- | --- | --- |
| `dialog` | El sensei explica una idea | `speaker` (master, hero, ally, enemy), `text` (< 140 caracteres), `code?` |
| `act` | **Enseñar haciendo.** Cada botón escribe una línea y el mundo reacciona | `prompt`, `steps[]: { label, line?, effects?, output?, error? }` |
| `pick` | Elegir el token que completa `___` | `code` con un único `___`, `options` (2–4), `answer` (índice), `explain` |
| `predict` | Predecir salida o si compila | `code`, `options`, `answer`, `explain`, `output?` (se imprime al acertar) |
| `type` | Escribir el token de `___` | `code` con un único `___`, `answer` exacto, `explain` |
| `order` | Ordenar líneas | `lines` en el orden correcto (únicas tras `trim`), `explain` |
| `run` | Editar y ejecutar código real | `starter` (roto), `solution`, `expect` (subcadena de stdout), `fallback` (regex offline, o lista de regex para aceptar varias correcciones válidas), `explain` |

Un `error` en un paso de `act` muestra el error del compilador y una explicación en lenguaje llano. Los pasos siguientes continúan, así que se puede mostrar el error y luego la corrección.

### Ejemplo de `act` (el patrón más importante)

```ts
{
  kind: "act",
  prompt: "Pulsa en orden y observa la espada",
  steps: [
    { label: "FORJAR", line: 'let a = String::from("espada");',
      effects: [{ t: "item", kind: "sword", holder: "hero" }, { t: "tag", actor: "hero", text: "a" }] },
    { label: "DAR A b", line: "let b = a;",
      effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "b" }, { t: "give", to: "ally" }, { t: "dead", actor: "hero" }] },
    { label: "USAR a", line: 'println!("{}", a);',
      effects: [{ t: "shake" }, { t: "say", actor: "hero", text: "¡Ya no la tengo!" }],
      error: { compiler: "error[E0382]: borrow of moved value: `a`", plain: "a ya no es dueña: la espada se MOVIÓ a b." } },
  ],
}
```

### Ejemplo de pregunta verificable

```ts
{
  kind: "predict",
  prompt: "¿Compila?",
  code: 'let s1 = String::from("gema");\nlet s2 = s1;\nprintln!("{}", s1);',
  options: ["Sí: imprime gema", "No: s1 se movió a s2"],
  answer: 1,
  explain: "Tras el move, usar s1 es error E0382.",
  check: { compiles: false },
}
```

## `check`: la prueba de cada afirmación

`npm run content:verify` construye un programa y lo compila con el runner del lenguaje:

- En `pick` y `type`, `___` se rellena con la respuesta correcta.
- Si el código no tiene `fn main`, se envuelve en `fn main() { ... }`. Las funciones anidadas son válidas en Rust.
- Si el fragmento solo no es un programa válido, usa `check.program` con un programa completo que pruebe lo mismo.
- `check.stdout` compara la salida exacta (sin espacios al borde).
- `check.wrongFail: true` (solo `pick`) prueba que cada opción incorrecta **no** compila, para evitar distractores ambiguos. No lo uses si un distractor compila pero es semánticamente peor; explícalo en `explain`.
- Un programa que entra en pánico cuenta como "no compila" para el validador. Evita pánicos en los checks.

## Efectos visuales

Los actores son `hero`, `ally` y `enemy`. Los objetos son `sword`, `potion`, `gem`, `shield`, `scroll` y `key`.

| Efecto | Significado didáctico | Campos |
| --- | --- | --- |
| `enter` / `exit` | Un actor entra o sale de escena | `actor` |
| `tag` | Etiqueta de variable sobre el actor (binding) | `actor`, `text`, `value?` |
| `value` | Cambia el valor mostrado en la etiqueta | `actor`, `text` |
| `untag` | Quita la etiqueta | `actor` |
| `dead` | Tacha la etiqueta: el binding ya no es válido | `actor` |
| `item` | Aparece un valor en manos de un actor | `kind`, `holder` |
| `give` | El valor cambia de dueño (move) | `to` |
| `clone` | Se duplica el valor | `to` |
| `lend` | Préstamo: una copia fantasma va y vuelve, con cadena | `to`, `mut?` |
| `drop` | El valor se destruye | – |
| `attack` | Un actor golpea a otro | `from`, `to`, `dmg?` |
| `hp` | Muestra una barra de vida del mundo | `actor`, `value` |
| `say` | Globo de diálogo (≤ 22 caracteres) | `actor`, `text` |
| `print` | Línea en el panel STDOUT | `text` |
| `shake`, `banner`, `wait` | Temblor, texto grande, pausa | `text`, `ms` |

Para añadir un efecto nuevo, añádelo al tipo `Effect`, impleméntalo en `one()` de `Stage.tsx` y en la lista `EFFECTS` de `scripts/validate-content.ts`.

## Temas y exámenes

Ver [exams.md](exams.md).
