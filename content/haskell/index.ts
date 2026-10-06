import type { LanguagePack } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { lambdaVillage } from "./regions/lambda-village.ts";
import { foldForest } from "./regions/fold-forest.ts";
import { lazyMountain } from "./regions/lazy-mountain.ts";
import { monadTower } from "./regions/monad-tower.ts";
import { exams } from "./exams.ts";
import { topics } from "./topics.ts";
import { planet } from "./planet.ts";

// Planet Lambdara: Haskell. Exercises compile (GHC 9.8) and run in Compiler Explorer's sandbox (via /api/run).
export const haskell: LanguagePack = {
  slug: "haskell",
  name: "HASKELL",
  tagline: L("Pure functional with powerful types", "Funcional puro y tipos poderosos", "強力な型を持つ純粋関数型"),
  color: "#8a6fd1",
  status: "active",
  runner: "godbolt-haskell",
  codeLang: "haskell",
  planet: planet,
  regions: [lambdaVillage, foldForest, lazyMountain, monadTower],
  topics,
  exams,
};
