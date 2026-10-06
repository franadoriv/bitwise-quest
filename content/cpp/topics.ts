import type { TopicDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Exam topic ids (docs/research/cpp-curriculum.md, "Entry exam"). `region` links a topic to the region
// that teaches it; topics without a region count toward the score but skip nothing.
export const topics: Record<string, TopicDef> = {
  basics: { name: L("Types, operators and const", "Tipos, operadores y const", "型・演算子・const"), region: "value-village" },
  references: { name: L("References and parameter passing", "Referencias y paso de parámetros", "参照と引数の渡し方"), region: "value-village" },
  pointers: { name: L("Pointers, stack and heap", "Punteros, stack y heap", "ポインタ・スタック・ヒープ"), region: "value-village" },
  containers: { name: L("vector and string", "vector y string", "vector と string"), region: "value-village" },
  classes: { name: L("Classes, constructors and init", "Clases, constructores e init", "クラス・コンストラクタ・初期化"), region: "lifetime-forest" },
  raii: { name: L("Destructors and RAII", "Destructores y RAII", "デストラクタと RAII"), region: "lifetime-forest" },
  move: { name: L("Copy, move and the rule of 3/5/0", "Copia, move y la regla de 3/5/0", "コピー・ムーブ・3/5/0 の規則"), region: "lifetime-forest" },
  smart_pointers: { name: L("Smart pointers", "Punteros inteligentes", "スマートポインタ"), region: "lifetime-forest" },
  inheritance: { name: L("Inheritance and access", "Herencia y acceso", "継承とアクセス"), region: "polymorph-castle" },
  polymorphism: { name: L("Virtual functions and slicing", "Funciones virtuales y slicing", "仮想関数とスライシング"), region: "polymorph-castle" },
  operators: { name: L("Operator overloading", "Sobrecarga de operadores", "演算子オーバーロード"), region: "polymorph-castle" },
  templates: { name: L("Templates, constexpr and concepts", "Templates, constexpr y concepts", "テンプレート・constexpr・コンセプト"), region: "template-tower" },
  lambdas_stl: { name: L("Lambdas, algorithms, containers", "Lambdas, algoritmos y contenedores", "ラムダ・アルゴリズム・コンテナ"), region: "template-tower" },
  modern: { name: L("C++17/20: bindings, optional", "C++17/20: bindings, optional", "C++17/20：束縛と optional"), region: "template-tower" },
  concurrency: { name: L("Threads, mutexes and atomics", "Hilos, mutex y atómicos", "スレッド・ミューテックス・アトミック"), region: "template-tower" },
  ub: { name: L("Undefined behavior", "Comportamiento indefinido", "未定義動作") },
  exceptions: { name: L("Exceptions and noexcept", "Excepciones y noexcept", "例外と noexcept") },
  memory_model: { name: L("Memory order and cache effects", "Orden de memoria y caché", "メモリ順序とキャッシュ") },
  performance: { name: L("Copy elision and abstraction cost", "Elisión de copias y coste", "コピー省略と抽象化のコスト") },
};
