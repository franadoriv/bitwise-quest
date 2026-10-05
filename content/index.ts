import type { LanguagePack, Text } from "../lib/content/types.ts";
import { L } from "../lib/i18n/text.ts";
import { rust } from "./rust/index.ts";

// Register language packs here. "soon" packs show as locked cartridges.
const soon = (slug: string, name: string, tagline: Text, color: string): LanguagePack => ({ slug, name, tagline, color, status: "soon", regions: [], topics: {}, exams: [] });

export const LANGUAGE_PACKS: LanguagePack[] = [
  rust,
  soon("go", "GO", L("Simple concurrency with goroutines", "Concurrencia simple con goroutines", "goroutine でシンプルな並行処理"), "#0099db"),
  soon("zig", "ZIG", L("Full control, no hidden magic", "Control total, sin magia oculta", "完全な制御、隠れた魔法なし"), "#feae34"),
  soon("haskell", "HASKELL", L("Pure functional with powerful types", "Funcional puro y tipos poderosos", "強力な型を持つ純粋関数型"), "#8a6fd1"),
];
