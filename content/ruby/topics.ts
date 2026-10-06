import type { TopicDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Exam topic ids (docs/research/ruby-curriculum.md, "Entry exams"). `region` links a topic to the
// region that teaches it; topics without a region count toward the score but skip nothing.
export const topics: Record<string, TopicDef> = {
  basics: { name: L("Objects, variables and output", "Objetos, variables y salida", "オブジェクト・変数・出力"), region: "object-village" },
  strings: { name: L("Strings, symbols and numbers", "Strings, símbolos y números", "文字列・シンボル・数値"), region: "object-village" },
  control: { name: L("Truthiness and control flow", "Veracidad y control de flujo", "真偽値と制御フロー"), region: "object-village" },
  methods: { name: L("Methods and arguments", "Métodos y argumentos", "メソッドと引数"), region: "object-village" },
  arrays: { name: L("Arrays", "Arrays", "配列"), region: "enumerable-forest" },
  hashes: { name: L("Hashes and ranges", "Hashes y rangos", "ハッシュと範囲"), region: "enumerable-forest" },
  blocks: { name: L("Blocks, procs and lambdas", "Bloques, procs y lambdas", "ブロック・Proc・ラムダ"), region: "enumerable-forest" },
  enumerable: { name: L("Enumerable", "Enumerable", "Enumerable"), region: "enumerable-forest" },
  classes: { name: L("Classes, visibility, class state", "Clases, visibilidad, estado", "クラス・可視性・クラスの状態"), region: "module-castle" },
  modules: { name: L("Modules, mixins and method lookup", "Módulos, mixins y lookup", "モジュール・Mixin・メソッド探索"), region: "module-castle" },
  equality: { name: L("Equality, copies and freezing", "Igualdad, copias y congelado", "等価性・コピー・freeze"), region: "module-castle" },
  exceptions: { name: L("Exceptions", "Excepciones", "例外"), region: "meta-tower" },
  metaprogramming: { name: L("Metaprogramming", "Metaprogramación", "メタプログラミング"), region: "meta-tower" },
  pattern_matching: { name: L("Pattern matching", "Pattern matching", "パターンマッチ"), region: "meta-tower" },
  concurrency: { name: L("Threads, GVL and Ractors", "Hilos, GVL y Ractors", "スレッド・GVL・Ractor"), region: "meta-tower" },
  testing: { name: L("Testing (Minitest, RSpec)", "Testing (Minitest, RSpec)", "テスト（Minitest・RSpec）") },
  tooling: { name: L("Gems, Bundler and loading code", "Gems, Bundler y carga de código", "gem・Bundler・コードの読み込み") },
  runtime: { name: L("GC, memory and performance", "GC, memoria y rendimiento", "GC・メモリ・性能") },
};
