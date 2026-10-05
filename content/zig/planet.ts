import type { PlanetDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

export const planet: PlanetDef = {
  name: L("Comptia", "Comptia", "コンプティア"),
  story: L(
    "Comptia is a forge world that hides nothing: every allocation is explicit and much of the work runs at compile time. Where builders slip, leaked memory drips from the pipes and undefined imps hatch in the gaps. Iggi, an iguana engineer, teaches full control.",
    "Comptia es un mundo forja sin nada oculto: cada asignación es explícita y mucho se hace al compilar. Si hay descuido, la memoria filtrada gotea de las tuberías y nacen diablillos indefinidos. Iggi, una iguana ingeniera, enseña a construir con control total.",
    "コンプティアは何も隠されていない鍛冶の星。メモリ確保はすべて明示的で、多くの仕事はコンパイル時に行われる。油断するとリークしたメモリがパイプからしたたり、未定義の小鬼が生まれる。イグアナ技師のイギが、完全な制御を教えてくれる。",
  ),
  guide: { name: L("Iggi", "Iggi", "イギ"), sprite: "zig/iggi", title: L("Iguana forge engineer", "Iguana ingeniera de la forja", "鍛冶場のイグアナ技師") },
  colors: { surface: "#f7a41d", accent: "#ffe08a", ring: "#8a5a1a" },
  moons: 1,
  bugs: ["zig/leak-jelly", "zig/undefined-imp", "zig/overflow-spark"],
};
