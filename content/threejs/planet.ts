import type { PlanetDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// three.js is a moon of Scriptara; moons reuse the PlanetDef shape.
export const threejsMoon: PlanetDef = {
  name: L("Scenara", "Scenara", "シーネラ"),
  story: L(
    "Scenara is a moon of scenes, cameras and meshes floating in a great scene graph. Every object hangs from a parent, and a light must shine before anything can be seen. Polly, a low-poly cube, teaches how to frame a shot and tidy up after it.",
    "Scenara es una luna de escenas, cámaras y mallas que flotan en un gran grafo de escena. Cada objeto cuelga de un padre y sin luz nada se ve. Polly, un cubo low-poly, enseña a encuadrar la toma y a limpiar después.",
    "シーネラは、シーン・カメラ・メッシュが大きなシーングラフに浮かぶ月。どの物体も親にぶら下がり、光がなければ何も見えない。ローポリの立方体ポリーが、ショットの構え方と後片付けのコツを教えてくれる。",
  ),
  guide: {
    name: L("Polly", "Polly", "ポリー"),
    sprite: "threejs/guide",
    title: L("Low-poly cube who frames scenes", "Cubo low-poly que encuadra escenas", "シーンを構えるローポリ立方体"),
  },
  colors: { surface: "#13261a", accent: "#7ee05a", ring: "#eef6ea" },
  shape: "cube",
  bugs: ["threejs/leak-blob", "threejs/lost-wanderer", "threejs/gimbal-knot"],
};
