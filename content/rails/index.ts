import type { LanguagePack } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { recordVillage } from "./regions/record-village.ts";
import { associationForest } from "./regions/association-forest.ts";
import { controllerCastle } from "./regions/controller-castle.ts";
import { exams } from "./exams.ts";
import { topics } from "./topics.ts";
import { railsMoon } from "./planet.ts";

// Moon Railhaven: Ruby on Rails, a moon of planet Rubion. Rails can't run in the sandbox, so lessons build plain-Ruby versions of its mechanisms (see mini.ts); Rails API facts are conceptual questions.
export const rails: LanguagePack = {
  slug: "rails",
  parent: "ruby",
  name: "RAILS",
  tagline: L("Convention over configuration", "Convención sobre configuración", "設定より規約"),
  color: "#e8404f",
  status: "active",
  runner: "godbolt-ruby",
  codeLang: "ruby",
  planet: railsMoon,
  regions: [recordVillage, associationForest, controllerCastle],
  topics,
  exams,
};
