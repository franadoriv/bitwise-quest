import type { LanguagePack } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { valueVillage } from "./regions/value-village.ts";
import { lifetimeForest } from "./regions/lifetime-forest.ts";
import { polymorphCastle } from "./regions/polymorph-castle.ts";
import { templateTower } from "./regions/template-tower.ts";
import { exams } from "./exams.ts";
import { topics } from "./topics.ts";
import { cppPlanet } from "./planet.ts";

// Planet Velocis: C++20. Exercises compile (g++ 14) and run in Compiler Explorer's sandbox (via /api/run).
export const cpp: LanguagePack = {
  slug: "cpp",
  name: "C++",
  tagline: L("Raw speed, full control", "Velocidad pura, control total", "圧倒的な速さと完全な制御"),
  color: "#1f5fa8",
  status: "active",
  runner: "godbolt-cpp",
  codeLang: "cpp",
  planet: cppPlanet,
  regions: [valueVillage, lifetimeForest, polymorphCastle, templateTower],
  topics,
  exams,
};
