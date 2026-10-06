import type { LanguagePack } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { objectVillage } from "./regions/object-village.ts";
import { enumerableForest } from "./regions/enumerable-forest.ts";
import { moduleCastle } from "./regions/module-castle.ts";
import { metaTower } from "./regions/meta-tower.ts";
import { exams } from "./exams.ts";
import { topics } from "./topics.ts";
import { rubyPlanet } from "./planet.ts";

// Planet Rubion: Ruby. Exercises run on Ruby 3.4 in Compiler Explorer's sandbox (via /api/run).
export const ruby: LanguagePack = {
  slug: "ruby",
  name: "RUBY",
  tagline: L("Built for programmer happiness", "Hecho para la felicidad del programador", "プログラマの幸せのために"),
  color: "#cc342d",
  status: "active",
  runner: "godbolt-ruby",
  codeLang: "ruby",
  planet: rubyPlanet,
  regions: [objectVillage, enumerableForest, moduleCastle, metaTower],
  topics,
  exams,
};
