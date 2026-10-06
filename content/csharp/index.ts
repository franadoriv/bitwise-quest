import type { LanguagePack } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { valueVillage } from "./regions/value-village.ts";
import { classForest } from "./regions/class-forest.ts";
import { linqPeaks } from "./regions/linq-peaks.ts";
import { taskTower } from "./regions/task-tower.ts";
import { exams } from "./exams.ts";
import { topics } from "./topics.ts";
import { csharpPlanet } from "./planet.ts";

// Planet Sharpholm: C# on .NET. Exercises compile and run in Compiler Explorer's sandbox (via /api/run).
export const csharp: LanguagePack = {
  slug: "csharp",
  name: "C#",
  tagline: L("Typed, managed and async-ready", "Tipado, administrado y listo para async", "型安全・マネージド・async 対応"),
  color: "#7b4bb5",
  status: "active",
  runner: "godbolt-csharp",
  codeLang: "csharp",
  planet: csharpPlanet,
  regions: [valueVillage, classForest, linqPeaks, taskTower],
  topics,
  exams,
};
