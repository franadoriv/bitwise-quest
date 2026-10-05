// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { KeyedConcurrency, Semaphore, TokenBucket, TtlCache } from "../lib/security/limits.ts";
import { HttpError, assertSameOrigin, clientKey, onlyKeys, rateLimitHeaders, readJson } from "../lib/security/http.ts";

test("token bucket allows a burst, then refills over time", () => {
  const b = new TokenBucket({ capacity: 3, perMinute: 6 }); // 1 token / 10 s
  const t0 = 1_000_000;
  assert.equal(b.take("a", 1, t0).ok, true);
  assert.equal(b.take("a", 1, t0).ok, true);
  assert.equal(b.take("a", 1, t0).ok, true);
  const denied = b.take("a", 1, t0);
  assert.equal(denied.ok, false);
  assert.equal(denied.retryAfterSec, 10);
  assert.equal(b.take("b", 1, t0).ok, true, "other clients are independent");
  assert.equal(b.take("a", 1, t0 + 10_000).ok, true, "refilled after 10 s");
  const h = rateLimitHeaders(denied);
  assert.equal(h["retry-after"], "10");
  assert.equal(h["ratelimit-limit"], "3");
});

test("token bucket memory is capped (LRU eviction)", () => {
  const b = new TokenBucket({ capacity: 1, perMinute: 1, maxKeys: 100 });
  for (let i = 0; i < 10_000; i++) b.take(`ip-${i}`);
  assert.equal(b.size, 100);
});

test("semaphore fails fast and releases once", () => {
  const s = new Semaphore(2);
  const r1 = s.tryAcquire()!;
  const r2 = s.tryAcquire()!;
  assert.equal(s.tryAcquire(), null);
  r1(); r1();
  assert.equal(s.active, 1);
  assert.ok(s.tryAcquire());
  r2();
});

test("keyed concurrency limits each client separately", () => {
  const k = new KeyedConcurrency(1);
  const a = k.tryAcquire("a")!;
  assert.equal(k.tryAcquire("a"), null);
  assert.ok(k.tryAcquire("b"));
  a();
  assert.ok(k.tryAcquire("a"));
});

test("ttl cache expires and caps size", () => {
  const c = new TtlCache<number>({ max: 2, ttlMs: 1000 });
  c.set("a", 1, 0); c.set("b", 2, 0); c.set("c", 3, 0);
  assert.equal(c.get("a", 10), undefined, "oldest evicted");
  assert.equal(c.get("c", 10), 3);
  assert.equal(c.get("c", 2000), undefined, "expired");
});

test("client key ignores spoofable headers unless proxies are trusted", () => {
  const h = new Headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" });
  assert.equal(clientKey(h, 0), "anonymous");
  assert.equal(clientKey(h, 1), "203.0.113.9", "right-most hop is the one our proxy saw");
  assert.equal(clientKey(new Headers({ "x-forwarded-for": "not an ip" }), 1), "anonymous");
});

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request("http://game.test/api/x", { method: "POST", body, headers: { host: "game.test", origin: "http://game.test", "content-type": "application/json", ...headers } });

test("origin check blocks cross-site and origin-less requests", () => {
  assert.doesNotThrow(() => assertSameOrigin(post("{}")));
  assert.throws(() => assertSameOrigin(post("{}", { origin: "https://evil.test" })), (e: HttpError) => e.status === 403);
  const noOrigin = new Request("http://game.test/api/x", { method: "POST", body: "{}", headers: { host: "game.test" } });
  assert.throws(() => assertSameOrigin(noOrigin), (e: HttpError) => e.code === "origin_required");
  assert.doesNotThrow(() => assertSameOrigin(post("{}", { origin: "https://app.test" }), "https://app.test"));
});

test("readJson enforces content type, size and syntax", async () => {
  assert.deepEqual(await readJson(post('{"a":1}'), 100), { a: 1 });
  await assert.rejects(readJson(post("x".repeat(500)), 100), (e: HttpError) => e.status === 413);
  await assert.rejects(readJson(post("{}", { "content-type": "text/plain" }), 100), (e: HttpError) => e.status === 415);
  await assert.rejects(readJson(post("{nope"), 100), (e: HttpError) => e.code === "invalid_json");
});

test("unknown fields are rejected", () => {
  assert.throws(() => onlyKeys({ lang: "rust", __proto__x: 1 }, ["lang"]), (e: HttpError) => e.code === "unknown_field");
});
