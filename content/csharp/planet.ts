import type { PlanetDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

export const csharpPlanet: PlanetDef = {
  name: L("Sharpholm", "Sharpholm", "シャープホルム"),
  story: L(
    "Sharpholm is an orderly realm where a tireless collector sweeps the heap and every type is declared with care. Yet null references still haunt its halls, and forgotten awaits freeze its clock towers. Hashi, a keen-eared fox, keeps the realm sharp.",
    "Sharpholm es un reino ordenado donde un recolector incansable barre el heap y cada tipo se declara con cuidado. Aun así, las referencias null rondan sus salones y los await olvidados congelan sus relojes. Hashi, un zorro atento, lo mantiene afilado.",
    "シャープホルムは、疲れ知らずのコレクターがヒープを掃除し、すべての型がていねいに宣言される整った王国。それでも null 参照が広間にひそみ、忘れられた await が時計塔を止めてしまう。耳ざといキツネのハシが、王国を鋭く保っている。",
  ),
  guide: {
    name: L("Hashi", "Hashi", "ハシ"),
    sprite: "csharp/guide",
    title: L("Keen fox of the managed realm", "Zorro atento del reino gestionado", "マネージド王国の鋭いキツネ"),
  },
  colors: { surface: "#6a2c91", accent: "#c9a6ff", ring: "#e6d6ff" },
  moons: 1,
  bugs: ["csharp/nullref-ghost", "csharp/deadlock-hourglass", "csharp/boxing-mimic", "csharp/dispose-leak"],
};
