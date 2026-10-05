import type { TopicDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Exam topic ids (docs/research/typescript-react-curriculum.md, "Entry exams"). `region` links a topic
// to the region that teaches it; topics without a region count toward the score but skip nothing.
export const topics: Record<string, TopicDef> = {
  values: { name: L("Values, types and numbers", "Valores, tipos y números", "値・型・数値"), region: "value-village" },
  equality: { name: L("Equality and coercion", "Igualdad y coerción", "等価性と型変換"), region: "value-village" },
  scope: { name: L("Scope, hoisting and TDZ", "Scope, hoisting y TDZ", "スコープ・巻き上げ・TDZ"), region: "closure-forest" },
  closures: { name: L("Closures", "Closures", "クロージャ"), region: "closure-forest" },
  this: { name: L("this and binding", "this y binding", "this とバインド"), region: "closure-forest" },
  objects: { name: L("Objects, destructuring and copies", "Objetos, desestructuración y copias", "オブジェクト・分割代入・コピー"), region: "prototype-peaks" },
  arrays: { name: L("Arrays and higher-order functions", "Arrays y funciones de orden superior", "配列と高階関数"), region: "prototype-peaks" },
  classes: { name: L("Prototypes and classes", "Prototipos y clases", "プロトタイプとクラス"), region: "prototype-peaks" },
  ts_basics: { name: L("TypeScript shapes and inference", "Formas e inferencia en TypeScript", "TypeScript の型と推論"), region: "type-castle" },
  narrowing: { name: L("Unions and narrowing", "Uniones y narrowing", "ユニオン型と型の絞り込み"), region: "type-castle" },
  generics: { name: L("Generics, keyof and indexed access", "Genéricos, keyof y acceso indexado", "ジェネリクス・keyof・インデックス型"), region: "type-castle" },
  type_transforms: { name: L("Utility, mapped, conditional types", "Tipos utilitarios y condicionales", "ユーティリティ・マップ・条件型"), region: "type-castle" },
  async: { name: L("Promises and async/await", "Promesas y async/await", "Promise と async/await"), region: "event-loop-tower" },
  event_loop: { name: L("The event loop", "El event loop", "イベントループ"), region: "event-loop-tower" },
  collections: { name: L("Map, Set and weak collections", "Map, Set y colecciones débiles", "Map・Set・弱参照コレクション") },
  iterators: { name: L("Iterators and generators", "Iteradores y generadores", "イテレータとジェネレータ") },
  modules: { name: L("Modules: ESM and CommonJS", "Módulos: ESM y CommonJS", "モジュール：ESM と CommonJS") },
  memory: { name: L("Memory and garbage collection", "Memoria y recolección de basura", "メモリとガベージコレクション") },
  performance: { name: L("Debounce, throttle and performance", "Debounce, throttle y rendimiento", "デバウンス・スロットル・性能") },
  security: { name: L("Security basics (XSS)", "Seguridad básica (XSS)", "セキュリティの基本（XSS）") },
  ts_advanced: { name: L("Advanced TS: variance, overloads", "TS avanzado: varianza, sobrecargas", "高度な TS（変性・オーバーロード）") },
};
