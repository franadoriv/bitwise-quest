import type { LanguagePack } from "../lib/content/types.ts";
import { rust } from "./rust/index.ts";

// Register language packs here. "soon" packs show as locked cartridges.
const soon = (slug: string, name: string, tagline: string, color: string): LanguagePack => ({ slug, name, tagline, color, status: "soon", regions: [], topics: {}, exams: [] });

export const LANGUAGE_PACKS: LanguagePack[] = [
  rust,
  soon("go", "GO", "Concurrencia simple con goroutines", "#0099db"),
  soon("zig", "ZIG", "Control total, sin magia oculta", "#feae34"),
  soon("haskell", "HASKELL", "Funcional puro y tipos poderosos", "#8a6fd1"),
];
