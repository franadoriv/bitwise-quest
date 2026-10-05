# Diseño de juego

## Objetivo

Aprender un lenguaje avanzado jugando, no solo repasarlo. El juego enseña con metáforas visuales antes de pedir código, y sirve también a quien ya sabe, mediante la prueba de ingreso y los jefes.

## Principios "dopagaki"

Estimulación frecuente y gratificación rápida, sin caos visual.

- **Cada acción tiene respuesta inmediata:** sonido, partículas, número flotante, reacción del personaje.
- **Victorias pequeñas:** beats de segundos. El bug pierde vida con cada acierto.
- **El código controla el mundo:** las variables son etiquetas sobre los personajes, los move hacen volar objetos y los préstamos van y vuelven.
- **Sin tiempos muertos:** si el jugador se queda quieto 9 segundos, el héroe lo anima.
- **El error enseña:** el sensei explica el porqué y la pregunta vuelve al final ("¡el bug ha vuelto!").

## Puntuación (`components/game/LessonGame.tsx`)

| Concepto | Regla |
| --- | --- |
| Puntos por acierto | `(100 + 60 × velocidad) × (1 + 0,1 × min(combo − 1, 10))` |
| Velocidad | Fracción de tiempo restante. Más de 0,66 es PERFECT y más de 0,33 es GREAT |
| Combo | Aciertos seguidos al primer intento. Banner en 3, 6, 9 y luego cada 5 |
| Corazones | 5 en lecciones y 3 en jefes. Solo el primer fallo de cada beat quita corazón |
| Estrellas | 3 sin errores, 2 con hasta 2 errores, 1 con más (`lib/game-rules.ts`) |
| XP | `xp de la lección × factor de estrellas` (40% al repetir) `+ puntos / 25` |
| Nivel | `floor(sqrt(xp / 40)) + 1` |

## Retención

- **Racha diaria** al completar cualquier lección, repaso o examen.
- **Repaso espaciado:** cada beat fallado entra en una caja de Leitner. Los intervalos son 10 minutos, 1, 3, 7 y 14 días. Aparece en el mapa como "BUGS ERRANTES".
- **Dominio por lección:** media de las últimas 20 respuestas, visible en el mapa.

## Estética

Pixel art 8 bits, paletas Naranja (predeterminada), Game Boy y NES. Fuentes Press Start 2P (UI), DotGothic16 (diálogos) y VT323 (código). Música y efectos chiptune sintetizados en `lib/sfx.ts`. El mapa es low poly en Three.js, renderizado a baja resolución con píxeles nítidos.
