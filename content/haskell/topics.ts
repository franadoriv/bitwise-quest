import type { TopicDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Exam topic ids (docs/research/haskell-curriculum.md, "Entry exams"). `region` links a topic
// to the region that teaches it; topics without a region count toward the score but skip nothing.
export const topics: Record<string, TopicDef> = {
  basics: { name: L("Expressions and arithmetic", "Expresiones y aritmética", "式と算術"), region: "lambda-village" },
  types: { name: L("Types, signatures and numbers", "Tipos, firmas y números", "型・型シグネチャ・数値"), region: "lambda-village" },
  lists: { name: L("Lists and strings", "Listas y strings", "リストと文字列"), region: "lambda-village" },
  patterns: { name: L("Patterns, guards, partial functions", "Patrones, guardas y parciales", "パターン・ガード・部分関数"), region: "lambda-village" },
  recursion: { name: L("Recursion", "Recursión", "再帰"), region: "fold-forest" },
  hof: { name: L("Higher-order functions and lambdas", "Orden superior y lambdas", "高階関数とラムダ"), region: "fold-forest" },
  currying: { name: L("Currying, sections and composition", "Currying, secciones y composición", "カリー化・セクション・合成"), region: "fold-forest" },
  folds: { name: L("Folds", "Folds", "畳み込み（fold）"), region: "fold-forest" },
  laziness: { name: L("Laziness, thunks, seq and bottom", "Pereza, thunks, seq y bottom", "遅延評価・サンク・seq・ボトム"), region: "lazy-mountain" },
  adts: { name: L("Algebraic data types and records", "Tipos algebraicos y records", "代数的データ型とレコード"), region: "lazy-mountain" },
  maybe_either: { name: L("Maybe and Either", "Maybe y Either", "Maybe と Either"), region: "lazy-mountain" },
  typeclasses: { name: L("Type classes, deriving, newtype", "Type classes, deriving y newtype", "型クラス・deriving・newtype"), region: "monad-tower" },
  functors: { name: L("Functor and Applicative", "Functor y Applicative", "Functor と Applicative"), region: "monad-tower" },
  monads: { name: L("Monads and do notation", "Mónadas y notación do", "モナドと do 記法"), region: "monad-tower" },
  io: { name: L("IO, purity, mapM_ and traverse", "IO, pureza, mapM_ y traverse", "IO・純粋性・mapM_・traverse"), region: "monad-tower" },
  containers: { name: L("Data.Map and containers", "Data.Map y contenedores", "Data.Map とコンテナ"), region: "monad-tower" },
  effects: { name: L("Transformers, State, Reader, GADTs", "Transformers, State, Reader y GADTs", "モナド変換子・State・GADT") },
  concurrency: { name: L("forkIO, MVar and STM", "forkIO, MVar y STM", "forkIO・MVar・STM") },
  tooling: { name: L("Testing, builds and profiling", "Tests, builds y profiling", "テスト・ビルド・プロファイリング") },
};
