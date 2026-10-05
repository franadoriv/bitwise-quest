import type { LanguagePack } from "../../lib/content/types.ts";
import { aldeaLet } from "./regions/aldea-let.ts";
import { bosqueOwnership } from "./regions/bosque-ownership.ts";
import { monteLifetimes } from "./regions/monte-lifetimes.ts";
import { castilloTraits } from "./regions/castillo-traits.ts";
import { torreFearless } from "./regions/torre-fearless.ts";
import { exams } from "./exams.ts";
import { topics } from "./topics.ts";

// Region order = learning order. A region unlocks when the previous one is fully cleared.
export const rust: LanguagePack = {
  slug: "rust",
  name: "RUST",
  tagline: "Seguridad de memoria sin recolector de basura",
  color: "#e43b44",
  status: "active",
  runner: "rust-playground",
  regions: [
    aldeaLet,
    bosqueOwnership,
    monteLifetimes,
    castilloTraits,
    torreFearless,
  ],
  topics,
  exams,
};
