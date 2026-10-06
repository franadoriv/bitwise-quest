import type { TopicDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Exam topic ids for moon Railhaven (Rails). `region` links a topic to the region that teaches it;
// topics without a region (testing, database, architecture) count in the exam report but don't skip regions.
// Source: docs/research/rails-curriculum.md (entry exams, topics).
export const topics: Record<string, TopicDef> = {
  active_record_basics: { name: L("Models, tables and conventions", "Modelos, tablas y convenciones", "モデル・テーブル・規約"), region: "record-village" },
  finders: { name: L("find, find_by, where, find_by_*", "find, find_by, where, find_by_*", "find・find_by・where・動的検索"), region: "record-village" },
  relations: { name: L("Lazy relations, scopes, count", "Relaciones perezosas, scopes, count", "遅延リレーション・scope・count"), region: "record-village" },
  migrations: { name: L("Migrations and schema", "Migraciones y esquema", "マイグレーションとスキーマ"), region: "record-village" },
  associations: { name: L("Associations", "Asociaciones", "アソシエーション"), region: "association-forest" },
  n_plus_one: { name: L("N+1, eager loading, counter caches", "N+1, eager loading, counter caches", "N+1・eager load・件数キャッシュ"), region: "association-forest" },
  validations: { name: L("Validations and errors", "Validaciones y errores", "バリデーションとエラー"), region: "association-forest" },
  callbacks: { name: L("Callbacks and concerns", "Callbacks y concerns", "コールバックと concern"), region: "association-forest" },
  routing: { name: L("Routing and REST", "Routing y REST", "ルーティングと REST"), region: "controller-castle" },
  strong_params: { name: L("Strong params and mass assignment", "Strong params y asignación masiva", "ストロングパラメータと一括代入"), region: "controller-castle" },
  controllers_filters: { name: L("Filters, render vs redirect", "Filtros, render vs redirect", "フィルター・render と redirect"), region: "controller-castle" },
  views: { name: L("ERB views, layouts, escaping", "Vistas ERB, layouts, escapado", "ERB ビュー・レイアウト・エスケープ"), region: "controller-castle" },
  jobs: { name: L("Background jobs", "Jobs en segundo plano", "バックグラウンドジョブ"), region: "controller-castle" },
  caching: { name: L("Caching", "Caché", "キャッシュ"), region: "controller-castle" },
  security: { name: L("CSRF, SQL injection, XSS, sessions", "CSRF, inyección SQL, XSS, sesiones", "CSRF・SQL注入・XSS・セッション"), region: "controller-castle" },
  testing: { name: L("Testing Rails", "Testing en Rails", "Rails のテスト") },
  database: { name: L("Indexes, transactions, locking", "Índices, transacciones, bloqueos", "インデックス・トランザクション・ロック") },
  architecture: { name: L("Rack, services, STI, Zeitwerk", "Rack, servicios, STI, Zeitwerk", "Rack・サービス・STI・Zeitwerk") },
};
