import type { LanguagePack } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { nameVillage } from "./regions/name-village.ts";
import { collectionForest } from "./regions/collection-forest.ts";
import { functionPeaks } from "./regions/function-peaks.ts";
import { objectTower } from "./regions/object-tower.ts";
import { exams } from "./exams.ts";
import { topics } from "./topics.ts";
import { pythonPlanet } from "./planet.ts";

// Planet Serpentia: Python. Exercises run in the player's browser (CPython in WebAssembly).
export const python: LanguagePack = {
  slug: "python",
  name: "PYTHON",
  tagline: L("Readable code, batteries included", "Código legible, con pilas incluidas", "読みやすいコード、標準ライブラリ充実"),
  color: "#3776ab",
  status: "active",
  runner: "py-browser",
  codeLang: "python",
  planet: pythonPlanet,
  regions: [nameVillage, collectionForest, functionPeaks, objectTower],
  topics,
  exams,
};
