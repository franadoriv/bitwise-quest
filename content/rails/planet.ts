import type { PlanetDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Rails is a moon of Rubion; moons reuse the PlanetDef shape.
export const railsMoon: PlanetDef = {
  name: L("Railhaven", "Railhaven", "レイルヘイヴン"),
  story: L(
    "Railhaven is a moon of railways where convention lays the tracks and everything has its place: models in the depot, views on the platform, routes on the map. Stray off the line and query swarms gather. Chuff, a little engine, keeps every train on time.",
    "Railhaven es una luna de vías donde la convención tiende los rieles y todo tiene su lugar: modelos en el depósito, vistas en el andén, rutas en el mapa. Si te sales de la vía, llegan enjambres de consultas. Chuff, una locomotora, mantiene cada tren a tiempo.",
    "レイルヘイヴンは、規約が線路を敷き、すべてに居場所がある鉄道の月。モデルは車庫に、ビューはホームに、ルートは路線図に。線路を外れるとクエリの群れが集まってくる。小さな機関車チャフが、どの列車も定刻どおりに走らせる。",
  ),
  guide: {
    name: L("Chuff", "Chuff", "チャフ"),
    sprite: "rails/guide",
    title: L("Little engine of convention", "Locomotora de la convención", "規約をはこぶ小さな機関車"),
  },
  colors: { surface: "#5e0f1c", accent: "#e8404f", ring: "#b9c2cc" },
  shape: "wheel",
  bugs: ["rails/n-plus-one", "rails/mass-burglar", "rails/callback-knot"],
};
