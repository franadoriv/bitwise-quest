// Manual hostile-request probes from docs/security.md, against a local dev server.
import assert from "node:assert/strict";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
let client = 10;
async function probe(path, body, expected, headers = {}, method = "POST") {
  const res = await fetch(BASE + path, { method, headers: { "content-type": "application/json", origin: BASE, "x-forwarded-for": `203.0.113.${client++}`, ...headers }, body: method === "POST" ? body : undefined });
  assert.equal(res.status, expected, `${path} ${body?.slice(0, 50)}: ${await res.text()}`);
}
await probe("/api/run", null, 405, {}, "GET");
await probe("/api/run", "{}", 403, { origin: "" });
await probe("/api/run", "{}", 403, { origin: "https://evil.example" });
await probe("/api/run", "{}", 403, { "sec-fetch-site": "cross-site" });
await probe("/api/run", "{}", 415, { "content-type": "text/plain" });
await probe("/api/run", "x".repeat(17000), 413);
await probe("/api/run", "{nope", 400);
await probe("/api/run", "[]", 400);
await probe("/api/run", JSON.stringify({ language: "rust", code: "x", admin: true }), 400);
await probe("/api/run", JSON.stringify({ language: "../etc", code: "x" }), 400);
await probe("/api/run", JSON.stringify({ language: "rust", code: "   " }), 400);
await probe("/api/run", JSON.stringify({ language: "rust", code: "x".repeat(10001) }), 413);
await probe("/api/run", JSON.stringify({ language: "rust", code: "x\n".repeat(401) }), 413);
await probe("/api/run", JSON.stringify({ language: "cobol", code: "x" }), 404);
for (const language of ["typescript", "python"]) await probe("/api/run", JSON.stringify({ language, code: "x" }), 404);
await probe("/api/review-play", JSON.stringify({ lang: "rust", keys: Array(13).fill("hello-let#1") }), 400);
await probe("/api/review-play", JSON.stringify({ lang: "rust", keys: ["bad-key"] }), 400);
await probe("/api/review-play", JSON.stringify({ lang: "elixir", keys: ["x#1"] }), 404);
await probe("/api/review-play", "x".repeat(2100), 413);
for (let n = 0; n < 9; n++) {
  const r = await fetch(BASE + "/api/run", { method: "POST", headers: { origin: BASE, "content-type": "application/json", "x-forwarded-for": "203.0.113.200" }, body: "{}" });
  if (n === 8) { assert.equal(r.status, 429); assert.ok(r.headers.get("retry-after")); assert.ok(r.headers.get("ratelimit-limit")); }
}
const a = await fetch(BASE + "/saves"); const b = await fetch(BASE + "/auth/callback");
for (const r of [a, b]) {
  const csp = r.headers.get("content-security-policy");
  assert.match(csp, /nonce-/); assert.match(csp, /strict-dynamic/); assert.match(csp, /frame-ancestors 'none'/);
  assert.equal(r.headers.get("x-frame-options"), "DENY"); assert.equal(r.headers.get("x-powered-by"), null);
  assert.ok(!csp.includes("*.supabase.co"));
}
assert.notEqual(a.headers.get("content-security-policy"), b.headers.get("content-security-policy"));
// Concurrent requests exceed the burst before the continuously refilling bucket can refill.
const burst = await Promise.all(Array.from({ length: 160 }, async () => {
  const r = await fetch(BASE + "/", { headers: { "x-forwarded-for": "203.0.113.202" } });
  await r.arrayBuffer(); return r.status;
}));
assert.ok(burst.includes(429), "page burst is rate limited");
console.log("✓ hostile bodies/origins, browser-only runners, request bursts, page limits, strict nonce CSP and security headers");
console.log("Upstream cache/concurrency probes are covered by unit tests; this script does not call external compilers.");
