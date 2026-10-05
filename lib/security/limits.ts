// Abuse-protection primitives: token-bucket rate limiting, fail-fast concurrency caps and a TTL cache.
// All in-memory with hard caps on the number of tracked keys, so an attacker cannot grow memory.
//
// NOTE: state is per server instance. On a single long-running server this is exact; with several
// instances (or serverless) each instance enforces its own limits, so put an edge rate limit / WAF in
// front for global guarantees (see docs/security.md). The interfaces are small on purpose so a shared
// store can replace them without touching the route handlers.

export interface Decision {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the bucket is full again. */
  resetSec: number;
  /** Seconds to wait before retrying (when !ok). */
  retryAfterSec: number;
}

/** Token bucket: `capacity` burst, refilled at `perMinute` tokens per minute. LRU-capped at `maxKeys`. */
export class TokenBucket {
  private buckets = new Map<string, { tokens: number; at: number }>();
  readonly capacity: number;
  readonly perMinute: number;
  readonly maxKeys: number;

  constructor(opts: { capacity: number; perMinute: number; maxKeys?: number }) {
    this.capacity = opts.capacity;
    this.perMinute = opts.perMinute;
    this.maxKeys = opts.maxKeys ?? 10_000;
  }

  take(key: string, cost = 1, now = Date.now()): Decision {
    const rate = this.perMinute / 60_000; // tokens per ms
    let b = this.buckets.get(key);
    if (b) {
      b.tokens = Math.min(this.capacity, b.tokens + (now - b.at) * rate);
      b.at = now;
      this.buckets.delete(key); // re-insert to mark as most recently used
    } else {
      b = { tokens: this.capacity, at: now };
      if (this.buckets.size >= this.maxKeys) this.buckets.delete(this.buckets.keys().next().value!);
    }
    this.buckets.set(key, b);
    const ok = b.tokens >= cost;
    if (ok) b.tokens -= cost;
    return {
      ok,
      limit: this.capacity,
      remaining: Math.floor(b.tokens),
      resetSec: Math.ceil((this.capacity - b.tokens) / rate / 1000),
      retryAfterSec: ok ? 0 : Math.max(1, Math.ceil((cost - b.tokens) / rate / 1000)),
    };
  }

  get size() {
    return this.buckets.size;
  }
}

/** Fail-fast semaphore: never queues, so slow upstreams cannot pile up requests in memory. */
export class Semaphore {
  private inFlight = 0;
  readonly max: number;
  constructor(max: number) {
    this.max = max;
  }
  tryAcquire(): (() => void) | null {
    if (this.inFlight >= this.max) return null;
    this.inFlight++;
    let released = false;
    return () => {
      if (!released) { released = true; this.inFlight--; }
    };
  }
  get active() {
    return this.inFlight;
  }
}

/** At most `perKey` concurrent operations per key (e.g. one compile per client at a time). */
export class KeyedConcurrency {
  private counts = new Map<string, number>();
  readonly perKey: number;
  constructor(perKey: number) {
    this.perKey = perKey;
  }
  tryAcquire(key: string): (() => void) | null {
    const n = this.counts.get(key) ?? 0;
    if (n >= this.perKey) return null;
    this.counts.set(key, n + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const m = (this.counts.get(key) ?? 1) - 1;
      if (m <= 0) this.counts.delete(key);
      else this.counts.set(key, m);
    };
  }
}

/** LRU cache with per-entry TTL and a hard size cap. */
export class TtlCache<V> {
  private map = new Map<string, { v: V; exp: number }>();
  readonly max: number;
  readonly ttlMs: number;
  constructor(opts: { max: number; ttlMs: number }) {
    this.max = opts.max;
    this.ttlMs = opts.ttlMs;
  }
  get(key: string, now = Date.now()): V | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    this.map.delete(key);
    if (e.exp <= now) return undefined;
    this.map.set(key, e);
    return e.v;
  }
  set(key: string, v: V, now = Date.now()) {
    this.map.delete(key);
    if (this.map.size >= this.max) this.map.delete(this.map.keys().next().value!);
    this.map.set(key, { v, exp: now + this.ttlMs });
  }
  get size() {
    return this.map.size;
  }
}
