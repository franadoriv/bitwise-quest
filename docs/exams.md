# Prueba de ingreso

Simula la evaluación técnica que hacen las empresas al contratar para puestos que requieren el lenguaje. Hay tres niveles: **junior**, **mid** (semi senior) y **senior**. La investigación de soporte para Rust está en [research/rust-hiring-assessments.md](research/rust-hiring-assessments.md).

## Cómo funciona

- Cada `ExamDef` tiene un **banco** de preguntas más grande que `count`. En cada intento se sacan `count` preguntas repartidas por tema (round robin) y ordenadas de fácil a difícil (`difficulty` 1–3). Así cada intento es distinto.
- Una sola oportunidad por pregunta, sin corazones ni reintentos, con `secondsPerQuestion` por pregunta (40% más en preguntas de `difficulty: 3`). Si se acaba el tiempo, cuenta como fallo.
- El servidor corrige con el banco como fuente de verdad (`completeExam` en `lib/repo.ts`). Guarda el intento en `exam_results` con el desglose por tema.
- El reporte muestra el porcentaje, si aprobó (`passPct`), el desempeño por tema y qué región estudiar para reforzar.
- **Saltar regiones:** recorriendo las regiones en orden, si el jugador acierta al menos el 80% de las preguntas de los temas de esa región (mínimo 2), sus lecciones se marcan como saltadas. Se detiene en la primera región que no supera.

## Temas

`content/<lang>/topics.ts` define los ids de tema. `region` enlaza el tema con la región que lo enseña. Los temas sin región (errores, colecciones, async...) cuentan para la nota y el reporte, pero no saltan regiones.

## Escribir preguntas

Tipos permitidos: `pick`, `predict`, `type` y `order`. Cada pregunta lleva `topic` y `difficulty`.

```ts
{
  topic: "concurrency", difficulty: 3,
  kind: "predict", prompt: "¿Compila?",
  code: "use std::rc::Rc;\nuse std::thread;\nlet r = Rc::new(5);\nthread::spawn(move || println!(\"{}\", r));",
  options: ["Sí", "No: Rc no es Send"], answer: 1,
  explain: "Rc usa un contador no atómico, así que no es Send. Entre hilos se usa Arc.",
  check: { compiles: false },
}
```

Reglas:
- Refleja lo que preguntan las empresas en ese nivel, no trivia.
- Prompts cortos (< 60 caracteres) y código de 12 líneas como máximo.
- `check` obligatorio cuando la respuesta depende del compilador.
- Que el banco tenga al menos 1,6 × `count` preguntas y cubra todos los temas del nivel.

## Lista de verificación

- [ ] `npm run content:verify -- --lang=<lang>` sin errores.
- [ ] `npm run playtest -- /play/<lang>/exam/<slug> --mistakes=3` termina y muestra el reporte.
