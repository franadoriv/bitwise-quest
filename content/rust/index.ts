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
