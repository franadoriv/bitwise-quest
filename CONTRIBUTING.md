# Contribuir a Bit Forge

¡Gracias por querer ayudar! La forma más común de contribuir es añadir contenido: lecciones, regiones, preguntas de examen o lenguajes nuevos. El contenido es solo datos, así que casi nunca hace falta tocar el motor.

## Antes de empezar

1. Lee [`docs/README.md`](docs/README.md) y el documento de tu tarea:
   - Lecciones y regiones: [`docs/authoring-lessons.md`](docs/authoring-lessons.md)
   - Lenguajes nuevos: [`docs/adding-a-language.md`](docs/adding-a-language.md)
   - Preguntas de examen: [`docs/exams.md`](docs/exams.md)
2. Usa Node 22.18 o superior (`nvm use`).

## Flujo de trabajo

1. Crea una rama desde `main`: `feat/<tema>`, `fix/<tema>` o `content/<tema>`.
2. Haz tus cambios y verifica:
   ```bash
   npm run content:check
   npm run content:verify -- --lang=rust   # compila cada afirmación contra el compilador real
   npm run typecheck
   npm run playtest -- /play/rust/lesson/<slug>   # con npm run dev en marcha
   ```
3. Escribe commits con [Conventional Commits](https://www.conventionalcommits.org/es/): `feat:`, `fix:`, `content:`, `docs:`, `refactor:`, `chore:`.
4. Abre un pull request explicando qué enseña o arregla el cambio, con capturas si afecta a la interfaz.

## Reglas de contenido

- Nunca preguntes algo que el juego no haya enseñado antes.
- Cada afirmación sobre el compilador lleva `check`, y cada reto `run` lleva `solution`.
- Textos breves: diálogos de menos de 140 caracteres y globos de 22 como máximo.
