import type { LanguagePack } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { letVillage } from "./regions/let-village.ts";
import { ownershipForest } from "./regions/ownership-forest.ts";
import { lifetimePeaks } from "./regions/lifetime-peaks.ts";
import { traitCastle } from "./regions/trait-castle.ts";
import { fearlessTower } from "./regions/fearless-tower.ts";
import { exams } from "./exams.ts";
import { topics } from "./topics.ts";

// Region order = learning order. A region unlocks when the previous one is fully cleared.
export const rust: LanguagePack = {
  slug: "rust",
  name: "RUST",
  tagline: L("Memory safety without a garbage collector", "Seguridad de memoria sin recolector de basura", "ガベージコレクタなしのメモリ安全性"),
  color: "#e43b44",
  status: "active",
  runner: "rust-playground",
  planet: {
    name: L("Oxide", "Óxido", "オキサイド"),
    story: L(
      "Oxide is a world of iron and gears where the ancient Borrow Dragon enforces the laws of memory. Bugs born from dangling pointers and data races corrode its cities. Ferro, an old crab sensei, trains new guardians to keep them safe.",
      "Óxido es un mundo de hierro y engranajes donde el antiguo Dragón del Préstamo impone las leyes de la memoria. Bugs nacidos de punteros colgantes y carreras de datos corroen sus ciudades. Ferro, un viejo sensei cangrejo, entrena a nuevos guardianes.",
      "オキサイドは鉄と歯車の星。古の借用ドラゴンがメモリのおきてを守っている。ダングリングポインタやデータ競合から生まれたバグが街をむしばむなか、カニの師匠フェロが新しい守護者を育てている。",
    ),
    guide: { name: L("Ferro", "Ferro", "フェロ"), sprite: "rust/ferro", title: L("Crab sensei of the forge", "Sensei cangrejo de la forja", "鍛冶場のカニ師匠") },
    colors: { surface: "#b7410e", accent: "#f2a65a", ring: "#6b3a1f" },
    moons: 2,
    bugs: ["rust/mite", "rust/dangler", "rust/cog-golem", "rust/borrow-dragon"],
  },
  regions: [
    letVillage,
    ownershipForest,
    lifetimePeaks,
    traitCastle,
    fearlessTower,
  ],
  topics,
  exams,
};
