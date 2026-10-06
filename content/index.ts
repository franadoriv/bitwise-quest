import type { LanguagePack, PlanetDef, Text } from "../lib/content/types.ts";
import { L } from "../lib/i18n/text.ts";
import { rust } from "./rust/index.ts";
import { typescript } from "./typescript/index.ts";
import { react } from "./react/index.ts";
import { webgl } from "./webgl/index.ts";
import { threejs } from "./threejs/index.ts";
import { python } from "./python/index.ts";
import { csharp } from "./csharp/index.ts";
import { go } from "./go/index.ts";
import { cpp } from "./cpp/index.ts";
import { planet as zigPlanet } from "./zig/planet.ts";
import { planet as haskellPlanet } from "./haskell/planet.ts";

// Register language packs here. "soon" packs show as locked cartridges.
const soon = (slug: string, name: string, tagline: Text, color: string, planet: PlanetDef): LanguagePack => ({ slug, name, tagline, color, status: "soon", planet, regions: [], topics: {}, exams: [] });

export const LANGUAGE_PACKS: LanguagePack[] = [
  rust,
  typescript,
  react,
  webgl,
  threejs,
  python,
  csharp,
  go,
  cpp,
  soon("zig", "ZIG", L("Full control, no hidden magic", "Control total, sin magia oculta", "完全な制御、隠れた魔法なし"), "#feae34", zigPlanet),
  soon("haskell", "HASKELL", L("Pure functional with powerful types", "Funcional puro y tipos poderosos", "強力な型を持つ純粋関数型"), "#8a6fd1", haskellPlanet),
];
