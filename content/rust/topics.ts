import type { TopicDef } from "../../lib/content/types.ts";

// Topic ids are used by exam questions. `region` links a topic to the region that teaches it.
export const topics: Record<string, TopicDef> = {
  variables: { name: "Variables y mutabilidad", region: "aldea-let" },
  types: { name: "Tipos y shadowing", region: "aldea-let" },
  ownership: { name: "Ownership y move", region: "bosque-ownership" },
  borrowing: { name: "Préstamos & y &mut", region: "bosque-ownership" },
  lifetimes: { name: "Lifetimes", region: "monte-lifetimes" },
  traits: { name: "Traits y genéricos", region: "castillo-traits" },
  concurrency: { name: "Concurrencia", region: "torre-fearless" },
  errors: { name: "Manejo de errores" },
  collections: { name: "Colecciones y strings" },
  patterns: { name: "Enums y pattern matching" },
  smart_pointers: { name: "Smart pointers e interior mutability" },
  unsafe_ffi: { name: "Unsafe y FFI" },
  closures: { name: "Closures y Fn traits" },
  iterators: { name: "Iteradores" },
  memory: { name: "Memoria, Drop y layout" },
  async: { name: "Async y futures" },
};
