import type { PlanetDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// React is a moon of Scriptara; moons reuse the PlanetDef shape.
export const reactMoon: PlanetDef = {
  name: L("Reactia", "Reactia", "リアクティア"),
  story: L(
    "Reactia is a small moon built from components stacked like blocks. Every change of state ripples across its surface, and hooks keep the ripples in order. Orbi, a bright little atom, shows how to keep renders calm and keys unique.",
    "Reactia es una pequeña luna hecha de componentes apilados como bloques. Cada cambio de estado ondula por su superficie y los hooks mantienen el orden. Orbi, un pequeño átomo brillante, enseña a calmar los renders y usar keys únicas.",
    "リアクティアは、ブロックのように積まれたコンポーネントでできた小さな月。状態が変わるたびに波紋が地表に広がり、フックがその波を整える。小さく光る原子のオービが、レンダーを落ち着かせ、key を一意に保つコツを教えてくれる。",
  ),
  guide: {
    name: L("Orbi", "Orbi", "オービ"),
    sprite: "react/guide",
    title: L("Little atom who calms renders", "Átomo que calma los renders", "レンダーを鎮める小さな原子"),
  },
  colors: { surface: "#20232a", accent: "#61dafb" },
  shape: "atom",
  bugs: ["react/rerender-tornado", "react/stale-closure", "react/key-twins"],
};
