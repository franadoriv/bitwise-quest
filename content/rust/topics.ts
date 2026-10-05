import type { TopicDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Topic ids are used by exam questions. `region` links a topic to the region that teaches it.
export const topics: Record<string, TopicDef> = {
  variables: { name: L("Variables and mutability", "Variables y mutabilidad", "変数と可変性"), region: "let-village" },
  types: { name: L("Types and shadowing", "Tipos y shadowing", "型とシャドーイング"), region: "let-village" },
  ownership: { name: L("Ownership and moves", "Ownership y move", "所有権とムーブ"), region: "ownership-forest" },
  borrowing: { name: L("Borrowing: & and &mut", "Préstamos & y &mut", "借用（& と &mut）"), region: "ownership-forest" },
  lifetimes: { name: L("Lifetimes", "Lifetimes", "ライフタイム"), region: "lifetime-peaks" },
  traits: { name: L("Traits and generics", "Traits y genéricos", "トレイトとジェネリクス"), region: "trait-castle" },
  concurrency: { name: L("Concurrency", "Concurrencia", "並行性"), region: "fearless-tower" },
  errors: { name: L("Error handling", "Manejo de errores", "エラー処理") },
  collections: { name: L("Collections and strings", "Colecciones y strings", "コレクションと文字列") },
  patterns: { name: L("Enums and pattern matching", "Enums y pattern matching", "列挙型とパターンマッチ") },
  smart_pointers: { name: L("Smart pointers & interior mutability", "Smart pointers e interior mutability", "スマートポインタと内部可変性") },
  unsafe_ffi: { name: L("Unsafe and FFI", "Unsafe y FFI", "unsafe と FFI") },
  closures: { name: L("Closures and Fn traits", "Closures y Fn traits", "クロージャと Fn トレイト") },
  iterators: { name: L("Iterators", "Iteradores", "イテレータ") },
  memory: { name: L("Memory, Drop and layout", "Memoria, Drop y layout", "メモリ、Drop、レイアウト") },
  async: { name: L("Async and futures", "Async y futures", "非同期と Future") },
};
