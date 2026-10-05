import "server-only";
import type { RunResult } from "../runners/types";
import { KeyedConcurrency, Semaphore, TokenBucket, TtlCache } from "./limits";

// Quotas. Numbers are per server instance; tune here (one place) and keep docs/security.md in sync.
//
//   /api/run           6/min per client (burst 8), 60/min for the whole instance, 1 compile in flight
//                      per client, 4 in flight in total (fail fast), identical code cached for 10 min.
//   /api/review-play   30/min per client (burst 20).
//   pages (proxy.ts)   240/min per client (burst 120).
export const LIMITS = {
  run: { perClient: { capacity: 8, perMinute: 6 }, global: { capacity: 60, perMinute: 60 }, inFlightPerClient: 1, inFlightTotal: 4 },
  runBody: { maxBytes: 16 * 1024, maxChars: 10_000, maxLines: 400 },
  runOutput: { maxChars: 8_000 },
  runCache: { max: 500, ttlMs: 10 * 60_000 },
  review: { perClient: { capacity: 20, perMinute: 30 }, maxBytes: 2 * 1024, maxKeys: 12 },
  pages: { perClient: { capacity: 120, perMinute: 240 } },
} as const;

interface Guards {
  runPerClient: TokenBucket;
  runGlobal: TokenBucket;
  runInFlight: Semaphore;
  runInFlightPerClient: KeyedConcurrency;
  runCache: TtlCache<RunResult>;
  reviewPerClient: TokenBucket;
  pagesPerClient: TokenBucket;
}

declare global {
  // eslint-disable-next-line no-var
  var __bwqGuards: Guards | undefined;
}

/** Process-wide singletons (kept across dev hot reloads). */
export const guards: Guards = (globalThis.__bwqGuards ??= {
  runPerClient: new TokenBucket(LIMITS.run.perClient),
  runGlobal: new TokenBucket(LIMITS.run.global),
  runInFlight: new Semaphore(LIMITS.run.inFlightTotal),
  runInFlightPerClient: new KeyedConcurrency(LIMITS.run.inFlightPerClient),
  runCache: new TtlCache<RunResult>(LIMITS.runCache),
  reviewPerClient: new TokenBucket(LIMITS.review.perClient),
  pagesPerClient: new TokenBucket(LIMITS.pages.perClient),
});
