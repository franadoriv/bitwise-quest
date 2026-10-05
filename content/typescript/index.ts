import type { LanguagePack } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { valueVillage } from "./regions/value-village.ts";
import { closureForest } from "./regions/closure-forest.ts";
import { prototypePeaks } from "./regions/prototype-peaks.ts";
import { typeCastle } from "./regions/type-castle.ts";
import { eventLoopTower } from "./regions/event-loop-tower.ts";
import { exams } from "./exams.ts";
import { topics } from "./topics.ts";
import { typescriptPlanet } from "./planet.ts";

// Planet Scriptara: JavaScript and TypeScript. Code runs in the player's browser (Web Worker).
export const typescript: LanguagePack = {
  slug: "typescript",
  name: "TS/JS",
  tagline: L("The language of the web, with types", "El lenguaje de la web, con tipos", "型を備えたウェブの言語"),
  color: "#2f74c0",
  status: "active",
  runner: "js-browser",
  codeLang: "ts",
  planet: typescriptPlanet,
  regions: [valueVillage, closureForest, prototypePeaks, typeCastle, eventLoopTower],
  topics,
  exams,
};
