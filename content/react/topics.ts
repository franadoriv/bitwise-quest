import type { TopicDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Exam topic ids for moon Reactia (React). `region` links a topic to the region that teaches it;
// topics without a region count in the exam report but don't skip regions.
// Source: docs/research/typescript-react-curriculum.md (React moon, entry exams).
export const topics: Record<string, TopicDef> = {
  jsx: { name: L("JSX and rendering output", "JSX y lo que se renderiza", "JSX と描画結果"), region: "jsx-village" },
  components: { name: L("Components and props", "Componentes y props", "コンポーネントと props"), region: "jsx-village" },
  lists_keys: { name: L("Lists, keys and conditionals", "Listas, keys y condicionales", "リスト・key・条件付き描画"), region: "jsx-village" },
  state: { name: L("State and batching", "Estado y batching", "状態とバッチ処理"), region: "state-forest" },
  events_forms: { name: L("Events and forms", "Eventos y formularios", "イベントとフォーム"), region: "state-forest" },
  immutability: { name: L("Immutable updates", "Actualizaciones inmutables", "イミュータブルな更新"), region: "state-forest" },
  lifting_state: { name: L("Sharing and preserving state", "Compartir y preservar estado", "状態の共有と保持"), region: "state-forest" },
  effects: { name: L("Effects and cleanup", "Efectos y limpieza", "副作用とクリーンアップ"), region: "effect-peaks" },
  refs: { name: L("Refs and stale closures", "Refs y closures obsoletos", "ref と古いクロージャ"), region: "effect-peaks" },
  data_fetching: { name: L("Data fetching and race conditions", "Carga de datos y carreras", "データ取得と競合状態"), region: "effect-peaks" },
  context_reducer: { name: L("Context and reducers", "Contexto y reducers", "コンテキストとリデューサー"), region: "render-tower" },
  memoization: { name: L("Memoization", "Memoización", "メモ化"), region: "render-tower" },
  hooks_rules: { name: L("Rules of hooks and custom hooks", "Reglas de hooks y hooks propios", "フックのルールとカスタムフック"), region: "render-tower" },
  suspense_boundaries: { name: L("Suspense, lazy and error boundaries", "Suspense, lazy y error boundaries", "Suspense・lazy・エラー境界"), region: "render-tower" },
  rendering: { name: L("Re-renders, reconciling, StrictMode", "Renders, reconciliación y StrictMode", "再レンダー・差分検出・StrictMode") },
  server_components: { name: L("Server and client components", "Componentes de servidor y cliente", "サーバー/クライアントコンポーネント") },
  testing: { name: L("Testing React", "Testing en React", "React のテスト") },
  accessibility: { name: L("Accessibility", "Accesibilidad", "アクセシビリティ") },
  performance: { name: L("Profiling and performance", "Profiling y rendimiento", "計測とパフォーマンス") },
  security: { name: L("Security and escaping", "Seguridad y escapado", "セキュリティとエスケープ") },
};
