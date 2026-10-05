<div align="center">

<img src="docs/screenshots/lesson-act.png" alt="Bit Forge: el código controla el mundo" width="100%" />

# BIT FORGE

**Arcade retro para aprender lenguajes de programación jugando.**
Pixel art NES/Game Boy, feedback constante y un mundo que reacciona a tu código.
Primer cartucho: **Rust**.

[![CI](https://github.com/franadoriv/coding-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/franadoriv/coding-lab/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs)
![Three.js](https://img.shields.io/badge/Three.js-low%20poly-049EF4?logo=threedotjs)
![GSAP](https://img.shields.io/badge/GSAP-SVG%20motion-88CE02?logo=greensock&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-node%3Asqlite-003B57?logo=sqlite)
![Rust](https://img.shields.io/badge/cartucho-Rust-CE422B?logo=rust)

</div>

---

## ¿Qué es?

Bit Forge enseña conceptos difíciles, como ownership, lifetimes o concurrencia, a quien **nunca** ha visto el lenguaje. Primero los muestra con metáforas jugables y después pide código. Una variable es una etiqueta sobre un personaje. Un *move* hace volar la espada a otro dueño. Un préstamo `&` es una copia fantasma que va y vuelve.

Cada acierto golpea al bug de la lección con partículas, combos y sonido chiptune. Cada error trae una explicación del sensei Ferro, y esa pregunta vuelve al final. Quien ya sabe el lenguaje puede saltar directo a la **prueba de ingreso**, que simula la evaluación técnica de empresas reales.

## Capturas

| Título y cartuchos | Mapa del mundo |
| --- | --- |
| ![Pantalla de título](docs/screenshots/title.png) | ![Mapa low poly](docs/screenshots/map.png) |
| **El error enseña** | **Compilador real** |
| ![Feedback de error](docs/screenshots/lesson-feedback.png) | ![Reto de código real](docs/screenshots/lesson-run.png) |
| **Jefe de región** | **Prueba de ingreso** |
| ![Jefe](docs/screenshots/boss.png) | ![Reporte del examen](docs/screenshots/exam-report.png) |
| **Paleta Game Boy** | **Paleta NES** |
| ![Paleta Game Boy](docs/screenshots/palette-gb.png) | ![Paleta NES](docs/screenshots/palette-nes.png) |

<p align="center"><img src="docs/screenshots/mobile.png" alt="Vista móvil" width="280" /></p>

## Cómo se aprende

Cada lección son retos de pocos segundos que siguen el arco **ver → practicar → producir**:

| Reto | Qué hace el jugador |
| --- | --- |
| Diálogo | El sensei presenta una idea en una o dos frases |
| Acción | Pulsa botones: cada uno escribe una línea de código y el mundo reacciona |
| Elegir | Completa el hueco del código con el token correcto |
| Predecir | Adivina qué imprime o si compila |
| Escribir | Teclea el token, con feedback carácter a carácter |
| Ordenar | Arma el programa línea a línea |
| Ejecutar | Arregla un programa real y lo compila con el compilador oficial |

## Características

- **Mundo en 3D low poly** con islas por región (Three.js), y escenas 2D pixel art animadas con GSAP sobre SVG.
- **Juice arcade:** combos, PERFECT y GREAT por velocidad, partículas, temblores, música y efectos chiptune sintetizados con WebAudio, sin archivos de audio.
- **Progreso persistente** en SQLite: XP, niveles, monedas, racha diaria, estrellas y dominio por lección.
- **Repaso espaciado:** lo que fallas vuelve como "bugs errantes" en cajas de Leitner.
- **Prueba de ingreso junior, semi senior y senior**, basada en lo que evalúan las empresas, con reporte por tema y salto de regiones dominadas.
- **Marco 16:9** que escala con la ventana, con modo vertical para móvil.
- **Tres paletas:** Naranja, Game Boy y NES.
- **Contenido verificado:** cada afirmación sobre el compilador se compila de verdad antes de publicarse.

## Contenido de Rust

<!-- content-table:start -->
| # | Región | Conceptos | Lecciones | Preguntas |
| --- | --- | --- | --- | --- |
| 1 | **Aldea Let** | Variables · mut · tipos | 3 + jefe | 27 |
| 2 | **Bosque Ownership** | Move · clone · préstamos | 3 + jefe | 28 |
| 3 | **Monte Lifetimes** | 'a · referencias que viven | 3 + jefe | 30 |
| 4 | **Castillo Traits** | Traits · genéricos | 4 + jefe | 40 |
| 5 | **Torre Fearless** | Hilos · Arc · Mutex | 4 + jefe | 45 |

En total hay 170 preguntas de lección, todas verificadas contra el compilador.

**Prueba de ingreso**

| Nivel | Preguntas por intento | Aprueba con | Tiempo por pregunta |
| --- | --- | --- | --- |
| Rust Developer Junior | 12 de un banco de 25 | 70% | 30 s |
| Rust Developer Semi-Senior | 14 de un banco de 26 | 70% | 40 s |
| Rust Developer Senior | 15 de un banco de 30 | 75% | 50 s |
<!-- content-table:end -->

## Empezar

Requisitos: Node 22.18 o superior (usa el SQLite nativo `node:sqlite`, sin módulos que compilar).

```bash
git clone https://github.com/franadoriv/coding-lab.git
cd coding-lab
npm install
npm run dev
```

Abre <http://localhost:3000> y pulsa **START**.

| Comando | Para qué |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run content:check` | Valida la estructura del contenido |
| `npm run content:verify` | Compila cada afirmación contra el compilador real |
| `npm run playtest -- <ruta>` | Un bot juega una lección en Chrome headless y guarda capturas |
| `npm run typecheck` | Comprobación de tipos |
| `npm run db:reset` | Borra el progreso local |

> Los retos de código envían el fragmento del jugador al Rust Playground público (`play.rust-lang.org`). Con `BITFORGE_RUNNER=off` no se hace ninguna llamada externa y la validación es local.

## Arquitectura

```
content/      Paquetes de lenguaje: regiones, lecciones, temas y exámenes (datos puros)
lib/          SQLite, consultas, reglas de juego, sonido, efectos, runners de código
components/   Motor de lección (escenario SVG + GSAP), mapa 3D, exámenes, UI
app/          Rutas de Next.js (App Router) y API
scripts/      Validador de contenido y bot de playtest
docs/         Documentación para personas y agentes
```

El motor no sabe nada de Rust. Siete tipos de reto y un vocabulario de efectos visuales sirven para cualquier lenguaje, y añadir uno nuevo es escribir datos. Más detalle en [`docs/architecture.md`](docs/architecture.md).

## Extender

| Quiero... | Guía |
| --- | --- |
| Añadir lecciones o regiones | [`docs/authoring-lessons.md`](docs/authoring-lessons.md) |
| Añadir un lenguaje | [`docs/adding-a-language.md`](docs/adding-a-language.md) |
| Ampliar la prueba de ingreso | [`docs/exams.md`](docs/exams.md) |
| Entender el modelo de contenido | [`docs/content-model.md`](docs/content-model.md) |
| Conocer el diseño de juego | [`docs/game-design.md`](docs/game-design.md) |

Los agentes de IA tienen instrucciones en [`AGENTS.md`](AGENTS.md) y playbooks paso a paso en [`docs/playbooks/`](docs/playbooks/).

## Hoja de ruta

- [x] Cartucho Rust: 5 regiones y prueba de ingreso en 3 niveles
- [ ] Cartuchos Go, Zig y Haskell
- [ ] Cuentas de usuario y tabla de récords
- [ ] Más tipos de reto, como "encuentra el bug" en código largo

## Contribuir

Lee [`CONTRIBUTING.md`](CONTRIBUTING.md). Toda contribución de contenido debe pasar `npm run content:verify`.
