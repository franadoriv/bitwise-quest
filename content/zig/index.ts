import type { LanguagePack } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { forgeVillage } from "./regions/forge-village.ts";
import { optionalForest } from "./regions/optional-forest.ts";
import { structMountain } from "./regions/struct-mountain.ts";
import { comptimeTower } from "./regions/comptime-tower.ts";
import { exams } from "./exams.ts";
import { topics } from "./topics.ts";
import { planet } from "./planet.ts";

// Planet Comptia: Zig. Exercises compile (Zig 0.15, Debug) and run in Compiler Explorer's sandbox (via /api/run).
export const zig: LanguagePack = {
  slug: "zig",
  name: "ZIG",
  tagline: L("Full control, no hidden magic", "Control total, sin magia oculta", "完全な制御、隠れた魔法なし"),
  color: "#feae34",
  status: "active",
  runner: "godbolt-zig",
  codeLang: "zig",
  planet: planet,
  regions: [forgeVillage, optionalForest, structMountain, comptimeTower],
  topics,
  exams,
};
