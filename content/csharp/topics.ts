import type { TopicDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Exam topic ids (docs/research/csharp-curriculum.md, "Entry exams"). `region` links a topic to the region
// that teaches it; topics without a region count toward the score but skip nothing.
export const topics: Record<string, TopicDef> = {
  "types-strings": { name: L("Types, casts and strings", "Tipos, conversiones y strings", "型・キャスト・文字列"), region: "value-village" },
  nulls: { name: L("Null and nullable types", "Null y tipos anulables", "null と null 許容型"), region: "value-village" },
  "value-reference": { name: L("Value vs reference, boxing", "Valor vs referencia, boxing", "値型と参照型・ボックス化"), region: "value-village" },
  equality: { name: L("Equality and identity", "Igualdad e identidad", "等価性と同一性"), region: "value-village" },
  classes: { name: L("Classes, properties, static", "Clases, propiedades, static", "クラス・プロパティ・static"), region: "class-forest" },
  inheritance: { name: L("Inheritance and polymorphism", "Herencia y polimorfismo", "継承とポリモーフィズム"), region: "class-forest" },
  interfaces: { name: L("Interfaces and abstract classes", "Interfaces y clases abstractas", "インターフェースと抽象クラス"), region: "class-forest" },
  "records-patterns": { name: L("Records and pattern matching", "Records y pattern matching", "レコードとパターンマッチ"), region: "class-forest" },
  "collections-generics": { name: L("Collections and generics", "Colecciones y genéricos", "コレクションとジェネリクス"), region: "linq-peaks" },
  "delegates-closures": { name: L("Delegates, events, closures", "Delegados, eventos, closures", "デリゲート・イベント・クロージャ"), region: "linq-peaks" },
  linq: { name: L("LINQ and deferred execution", "LINQ y ejecución diferida", "LINQ と遅延実行"), region: "linq-peaks" },
  exceptions: { name: L("Exceptions", "Excepciones", "例外"), region: "task-tower" },
  disposal: { name: L("IDisposable and using", "IDisposable y using", "IDisposable と using"), region: "task-tower" },
  async: { name: L("async/await and Task", "async/await y Task", "async/await と Task"), region: "task-tower" },
  memory: { name: L("Memory, GC and Span<T>", "Memoria, GC y Span<T>", "メモリ・GC・Span<T>") },
  concurrency: { name: L("Threads, lock and Interlocked", "Hilos, lock e Interlocked", "スレッド・lock・Interlocked") },
  "design-di": { name: L("Design, DI and variance", "Diseño, DI y varianza", "設計・DI・変性") },
};
