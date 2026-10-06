import type { TopicDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Exam topic ids (docs/research/zig-curriculum.md, "Entry exams"). `region` links a topic to the region
// that teaches it; topics without a region count toward the score but skip nothing.
export const topics: Record<string, TopicDef> = {
  basics: { name: L("const, var and the strict compiler", "const, var y el compilador estricto", "const・var と厳しいコンパイラ"), region: "forge-village" },
  integers: { name: L("Integer types, casts and overflow", "Enteros, casts y overflow", "整数型・キャスト・オーバーフロー"), region: "forge-village" },
  control: { name: L("Control flow and switch", "Control de flujo y switch", "制御フローと switch"), region: "forge-village" },
  slices: { name: L("Arrays, slices, strings and pointers", "Arrays, slices, strings y punteros", "配列・スライス・文字列・ポインタ"), region: "forge-village" },
  optionals: { name: L("Optionals", "Opcionales", "オプショナル"), region: "optional-forest" },
  errors: { name: L("Error unions and error sets", "Uniones de error y error sets", "エラーユニオンとエラーセット"), region: "optional-forest" },
  defer: { name: L("defer and errdefer", "defer y errdefer", "defer と errdefer"), region: "optional-forest" },
  safety: { name: L("undefined, safety and build modes", "undefined, chequeos y modos de build", "undefined・安全検査・ビルドモード"), region: "optional-forest" },
  structs: { name: L("Structs and methods", "Structs y métodos", "構造体とメソッド"), region: "struct-mountain" },
  unions: { name: L("Enums and tagged unions", "Enums y uniones etiquetadas", "列挙型とタグ付きユニオン"), region: "struct-mountain" },
  allocators: { name: L("Allocators and memory ownership", "Allocators y dueños de la memoria", "アロケータとメモリの所有"), region: "comptime-tower" },
  containers: { name: L("ArrayList and hash maps (0.15)", "ArrayList y hash maps (0.15)", "ArrayList とハッシュマップ"), region: "comptime-tower" },
  comptime: { name: L("comptime, generics and reflection", "comptime, genéricos y reflexión", "comptime・ジェネリクス・リフレクション"), region: "comptime-tower" },
  testing: { name: L("Test blocks and std.testing", "Bloques test y std.testing", "test ブロックと std.testing"), region: "comptime-tower" },
  interop: { name: L("C interop", "Interoperabilidad con C", "C との相互運用") },
  tooling: { name: L("Build system and 0.15 I/O", "Build, modos de build e I/O de 0.15", "ビルド・ビルドモード・0.15 の I/O") },
};
