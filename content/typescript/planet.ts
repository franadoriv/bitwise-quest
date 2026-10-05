import type { PlanetDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

export const typescriptPlanet: PlanetDef = {
  name: L("Scriptara", "Scriptara", "スクリプタラ"),
  story: L(
    "Scriptara is a bustling world where everything runs on one great event loop. Loose types slip through its streets: undefined haunts the alleys and callbacks tangle into knots. Tyto, a wise owl, teaches travelers to name their types and stay safe.",
    "Scriptara es un mundo bullicioso donde todo gira en un gran event loop. Los tipos sueltos se cuelan por sus calles: undefined ronda los callejones y los callbacks se enredan. Tyto, una sabia lechuza, enseña a nombrar los tipos y viajar seguro.",
    "スクリプタラは、すべてが一つの大きなイベントループで動くにぎやかな星。ゆるい型が街にまぎれこみ、undefined が路地をさまよい、コールバックはもつれあう。賢いフクロウのタイトが、型に名前をつけて安全に進む方法を教えてくれる。",
  ),
  guide: {
    name: L("Tyto", "Tyto", "タイト"),
    sprite: "typescript/guide",
    title: L("Wise owl of type safety", "Sabia lechuza de los tipos", "型安全を説く賢いフクロウ"),
  },
  colors: { surface: "#2f74c0", accent: "#f7df1e", ring: "#9cc4f0" },
  moons: 1,
  bugs: ["typescript/undefined-ghost", "typescript/nan-gremlin", "typescript/callback-spaghetti", "typescript/any-shifter"],
};
