import type { TopicDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Exam topic ids (docs/research/go-curriculum.md, "Entry exams"). `region` links a topic to the region
// that teaches it; topics without a region count toward the score but skip nothing.
export const topics: Record<string, TopicDef> = {
  basics: { name: L("Variables, types and zero values", "Variables, tipos y valores cero", "変数・型・ゼロ値"), region: "gopher-village" },
  functions: { name: L("Functions, control flow, closures", "Funciones, control y closures", "関数・制御構文・クロージャ"), region: "gopher-village" },
  strings: { name: L("Strings, bytes and runes", "Strings, bytes y runas", "文字列・バイト・ルーン"), region: "gopher-village" },
  defer_panic: { name: L("Defer, panic and recover", "Defer, panic y recover", "defer・panic・recover"), region: "gopher-village" },
  slices: { name: L("Arrays and slices", "Arrays y slices", "配列とスライス"), region: "slice-forest" },
  maps: { name: L("Maps", "Mapas", "マップ"), region: "slice-forest" },
  structs: { name: L("Structs, pointers and methods", "Structs, punteros y métodos", "構造体・ポインタ・メソッド"), region: "slice-forest" },
  interfaces: { name: L("Interfaces and embedding", "Interfaces y embedding", "インターフェースと埋め込み"), region: "interface-castle" },
  errors: { name: L("Errors as values", "Errores como valores", "値としてのエラー"), region: "interface-castle" },
  generics: { name: L("Generics", "Genéricos", "ジェネリクス"), region: "interface-castle" },
  goroutines: { name: L("Goroutines and WaitGroup", "Goroutines y WaitGroup", "goroutine と WaitGroup"), region: "channel-tower" },
  channels: { name: L("Channels and select", "Canales y select", "チャネルと select"), region: "channel-tower" },
  context: { name: L("Context and cancellation", "Context y cancelación", "context とキャンセル"), region: "channel-tower" },
  sync: { name: L("Mutexes, atomics and data races", "Mutex, atómicos y data races", "ミューテックス・アトミック・競合"), region: "channel-tower" },
  testing: { name: L("Testing", "Testing", "テスト") },
  tooling: { name: L("Modules and tooling", "Módulos y herramientas", "モジュールとツール") },
  runtime: { name: L("Runtime, memory and performance", "Runtime, memoria y rendimiento", "ランタイム・メモリ・性能") },
};
