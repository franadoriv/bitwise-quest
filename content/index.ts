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
import { ruby } from "./ruby/index.ts";
import { rails } from "./rails/index.ts";
import { zig } from "./zig/index.ts";
import { haskell } from "./haskell/index.ts";

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
  ruby,
  rails,
  zig,
  haskell,
];
