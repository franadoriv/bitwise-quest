import type { TopicDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Exam topic ids (docs/research/python-curriculum.md, "Entry exam"). `region` links a topic to the
// region that teaches it; topics without a region count toward the score but skip nothing.
export const topics: Record<string, TopicDef> = {
  values: { name: L("Names, values and dynamic typing", "Nombres, valores y tipado dinámico", "名前・値・動的型付け"), region: "name-village" },
  numbers_strings: { name: L("Numbers, strings and slicing", "Números, strings y slicing", "数値・文字列・スライス"), region: "name-village" },
  truthiness: { name: L("Truthiness, is vs ==", "Veracidad, is vs ==", "真偽値と is / =="), region: "name-village" },
  collections_basics: { name: L("list, tuple, dict, set", "list, tuple, dict, set", "list・tuple・dict・set"), region: "collection-forest" },
  mutability: { name: L("Mutability, references and copies", "Mutabilidad, referencias y copias", "ミュータブル・参照・コピー"), region: "collection-forest" },
  comprehensions: { name: L("Comprehensions and sorting", "Comprehensions y ordenamiento", "内包表記とソート"), region: "collection-forest" },
  functions: { name: L("Functions, defaults, *args", "Funciones, defaults, *args", "関数・デフォルト引数・*args"), region: "function-peaks" },
  scope_closures: { name: L("Scope (LEGB) and closures", "Scope (LEGB) y closures", "スコープ（LEGB）とクロージャ"), region: "function-peaks" },
  decorators: { name: L("Decorators", "Decoradores", "デコレータ"), region: "function-peaks" },
  exceptions: { name: L("Exceptions", "Excepciones", "例外"), region: "function-peaks" },
  classes: { name: L("Classes, dunders, properties", "Clases, dunders, propiedades", "クラス・特殊メソッド・プロパティ"), region: "object-tower" },
  inheritance: { name: L("Inheritance, MRO, dataclasses", "Herencia, MRO, dataclasses", "継承・MRO・dataclass"), region: "object-tower" },
  generators: { name: L("Generators and context managers", "Generadores y context managers", "ジェネレータとコンテキストマネージャ"), region: "object-tower" },
  async: { name: L("async/await and asyncio", "async/await y asyncio", "async/await と asyncio"), region: "object-tower" },
  stdlib: { name: L("itertools, functools, collections", "itertools, functools, collections", "標準ライブラリ (itertools 等)") },
  typing: { name: L("Type hints at runtime", "Type hints en tiempo de ejecución", "型ヒントと実行時の挙動") },
  concurrency: { name: L("GIL, threads, processes", "GIL, hilos y procesos", "GIL・スレッド・プロセス") },
  object_model: { name: L("Descriptors and metaclasses", "Descriptores y metaclases", "ディスクリプタとメタクラス") },
  modules: { name: L("Modules and __main__", "Módulos y __main__", "モジュールと __main__") },
  patterns: { name: L("Modern syntax: match, walrus", "Sintaxis moderna: match, walrus", "モダン構文：match・walrus") },
};
