# Security and abuse protection

Bitwise Quest is a public game with two API endpoints, and one of them (`/api/run`) forwards code to an external compiler service. This document explains how the backend protects itself and that upstream from flooding, cost abuse, cross-site use, oversized payloads, header spoofing, XSS and clickjacking, and what you still need to add in front of it in production.

The server is stateless: content is served from memory (`lib/repo.ts`), there is no database, and the server never receives or stores player saves. The only mutable server state is the abuse-protection counters and the run cache described below.

## Map

| Piece | Path | Role |
| --- | --- | --- |
| Primitives | `lib/security/limits.ts` | `TokenBucket`, `Semaphore`, `KeyedConcurrency`, `TtlCache` (in memory, hard caps on keys) |
| HTTP guards | `lib/security/http.ts` | `clientKey`, `assertSameOrigin`, `readJson`, `onlyKeys`, `isPlainObject`, `json`, `errorResponse`, `rateLimitHeaders`, `HttpError` |
| Quotas | `lib/security/policies.ts` | `LIMITS` table and the process-wide `guards` singletons |
| Code runner endpoint | `app/api/run/route.ts` | Every guard applies; the most expensive endpoint |
| Review endpoint | `app/api/review-play/route.ts` | Origin, rate limit, body cap, strict validation |
| Upstream adapter | `lib/runners/rust-playground.ts` | Timeout, no redirects, response cap, shape check |
| Page proxy | `proxy.ts` | Per-request nonce CSP and page rate limit |
| Static headers | `next.config.ts` | Security headers on every response, `poweredByHeader: false` |
| Client | `components/game/beats/RunBeatView.tsx` | Treats 429/503 as "busy, retry in N s", no penalty |
| Tests | `tests/security.test.ts` | Unit tests of the primitives and guards (`npm test`) |

## Quotas (`LIMITS` in `lib/security/policies.ts`)

`LIMITS` is the **single place to tune** every number. Change it there and update this table. All numbers are **per server instance** (see [Per-instance state](#per-instance-state)).

| Scope | Limit | Value |
| --- | --- | --- |
| `/api/run` | Rate per client | 6 per minute, burst 8 |
| `/api/run` | Rate for the whole instance | 60 per minute (burst 60) |
| `/api/run` | Compiles in flight per client | 1 |
| `/api/run` | Compiles in flight in total | 4 (fail fast, never queued) |
| `/api/run` | Request body | 16 KB |
| `/api/run` | `code` | 10,000 characters and 400 lines, no NUL characters |
| `/api/run` | Output returned | `stdout` and `stderr` capped at 8,000 characters each |
| `/api/run` | Result cache | 500 entries, 10 minutes TTL |
| `/api/review-play` | Rate per client | 30 per minute, burst 20 |
| `/api/review-play` | Request body | 2 KB |
| `/api/review-play` | `keys` | 1 to 12 |
| Pages (`proxy.ts`) | Rate per client | 240 per minute, burst 120 |

The `guards` object (token buckets, semaphores and cache) is stored on `globalThis.__bwqGuards` so it survives dev hot reloads instead of being reset on every edit.

## Primitives (`lib/security/limits.ts`)

All in memory, all with hard caps, so an attacker cannot grow memory by sending many distinct keys.

| Class | Behavior |
| --- | --- |
| `TokenBucket({ capacity, perMinute, maxKeys = 10,000 })` | One bucket per key with `capacity` tokens (the burst), refilled continuously at `perMinute`. `take(key)` returns a `Decision` (`ok`, `limit`, `remaining`, `resetSec`, `retryAfterSec`). Keys are kept in LRU order; when `maxKeys` is reached the least recently used bucket is evicted. |
| `Semaphore(max)` | Fail-fast concurrency cap: `tryAcquire()` returns a release function or `null` when full. It **never queues**, so a slow upstream cannot pile up waiting requests in memory. Releasing twice is harmless. |
| `KeyedConcurrency(perKey)` | Same idea per key, e.g. one compile per client at a time. Keys with no work in flight are deleted. |
| `TtlCache({ max, ttlMs })` | LRU cache with a per-entry TTL and a hard size cap. Expired entries are dropped on read. |

### Per-instance state

The counters live in the memory of one server process. On a single long-running server this is exact. With several instances (horizontal scaling, serverless functions, restarts) **each instance enforces its own limits**, so the effective global quota is the per-instance quota times the number of instances, and a restart resets the counters. For global guarantees, put an edge rate limit / WAF in front of the app, or back these interfaces with a shared store. The interfaces are deliberately small (`take`, `tryAcquire`, `get`/`set`) so a shared implementation can replace them without touching the route handlers.

## HTTP guards (`lib/security/http.ts`)

Pure functions over the Web `Request`/`Response`, so they are unit tested without a server.

### `clientKey(headers)`: who is the client

Used as the key for every per-client limit.

- `BITWISE_TRUSTED_PROXY_HOPS` is the number of reverse proxies in front of the app that append to `X-Forwarded-For`. Default **1** (the usual hosted setup with one proxy or load balancer).
- The client IP is read **from the right**, counting hops: with 1 hop it is the right-most entry, the one your own proxy added. A client cannot spoof its identity by sending its own `X-Forwarded-For`, because anything it sends ends up further left.
- The value must look like an IPv4/IPv6 address; otherwise the key is `anonymous`.
- Set it to **0** when the server is exposed directly with no proxy. Every request then shares the identity `anonymous`, so per-client limits act globally: stricter, never weaker. Global quotas apply in every case.
- If the number of hops is set higher than the real number of proxies, the key becomes attacker controlled; set it to exactly the number of proxies you run.

### `assertSameOrigin(req)`: no cross-site use

Blocks CSRF and hotlinking of the API from other sites.

- `Origin` is **required** (browsers always send it on POST). Missing: 403 `origin_required`. Unparseable: 403 `bad_origin`.
- The origin's host must equal the request host (`X-Forwarded-Host`, else `Host`) or the full origin must be listed in `BITWISE_ALLOWED_ORIGINS` (comma separated). Otherwise 403 `cross_origin`.
- If `Sec-Fetch-Site` is present it must be `same-origin` or `none` (unless the origin is explicitly allowed). Otherwise 403 `cross_site`.

Non-browser clients can forge `Origin`; this check stops browsers being used against the API, and the rate limits handle scripted clients.

### `readJson(req, maxBytes)`: bounded body parsing

1. `Content-Type` must be `application/json`: otherwise 415 `unsupported_media_type`.
2. A declared `Content-Length` above `maxBytes`: 413 `payload_too_large` before reading anything.
3. No body: 400 `empty_body`.
4. The stream is read chunk by chunk and **cancelled as soon as it exceeds `maxBytes`** (413), so a lying or missing `Content-Length` cannot make the server buffer more.
5. The bytes are decoded as strict UTF-8 (`fatal: true`) and parsed as JSON; any failure is 400 `invalid_json`.

### Validation helpers

- `isPlainObject(v)`: the body must be a JSON object, not an array or a primitive (400 `invalid_body`).
- `onlyKeys(body, keys)`: any field outside the schema is 400 `unknown_field`. Requests must match the schema exactly.

### Uniform responses

- `json(body, status, headers)` always sets `content-type: application/json; charset=utf-8`, `cache-control: no-store` and `x-content-type-options: nosniff`.
- `errorResponse(e)` turns an `HttpError` into `{ "error": "<code>" }` with its status. Anything else becomes 500 `{ "error": "internal" }`. Error bodies never contain messages, stack traces, paths or upstream details.
- `rateLimitHeaders(decision)` adds the IETF `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` headers, plus `Retry-After` (seconds) when the request is limited. Once the per-client bucket has been checked, these headers are attached to every later response of that request, errors included.

## Endpoints

Both route files export only `POST`; any other method gets **405** from the framework. Both answer JSON through `json` / `errorResponse`.

### `POST /api/run`

Body: `{ "language": string, "code": string }`. Checks, in order:

| # | Check | Failure |
| --- | --- | --- |
| 1 | `assertSameOrigin` | 403 `origin_required` / `bad_origin` / `cross_origin` / `cross_site` |
| 2 | Per-client token bucket (6/min, burst 8) | 429 `rate_limited` + `Retry-After` |
| 3 | `readJson` with a 16 KB cap | 415 `unsupported_media_type`, 413 `payload_too_large`, 400 `empty_body` / `invalid_json` |
| 4 | Plain object, only `language` and `code` | 400 `invalid_body` / `unknown_field` |
| 5 | `language` matches `^[a-z0-9-]{1,32}$` | 400 `invalid_language` |
| 6 | `code` is a non-blank string | 400 `invalid_code` |
| 7 | `code` ≤ 10,000 chars, ≤ 400 lines, no NUL | 413 `code_too_large` |
| 8 | The language exists and has a runner | 404 `unknown_language` |
| 9 | Runner disabled (`BITWISE_RUNNER=off`) | 200 `{ ok: false, available: false }`: the client validates offline |
| 10 | Result cache (SHA-256 of language + code) | 200 with `x-cache: hit`, no upstream call, no global quota used |
| 11 | Global token bucket (60/min) | 503 `busy` + `Retry-After` |
| 12 | One compile in flight per client | 429 `one_at_a_time` + `Retry-After: 2` |
| 13 | Four compiles in flight in total (fail fast) | 503 `busy` + `Retry-After: 5` |
| 14 | Upstream call; output truncated to 8,000 chars each | 200 `{ ok, stdout, stderr, available }` |

Only results with `available: true` are cached, so an upstream outage is never cached. Many players submit the same correct solutions, so the cache absorbs most repeated traffic without calling the upstream.

### `POST /api/review-play`

Body: `{ "lang": string, "keys": string[] }`. Checks, in order:

| # | Check | Failure |
| --- | --- | --- |
| 1 | `assertSameOrigin` | 403 |
| 2 | Per-client token bucket (30/min, burst 20) | 429 `rate_limited` + `Retry-After` |
| 3 | `readJson` with a 2 KB cap | 415 / 413 / 400 |
| 4 | Plain object, only `lang` and `keys` | 400 `invalid_body` / `unknown_field` |
| 5 | `lang` matches `^[a-z0-9-]{1,32}$` and is an `active` language | 404 `unknown_language` |
| 6 | `keys` is an array of 1 to 12 strings matching `^[a-z0-9-]{1,64}#\d{1,3}$` | 400 `invalid_keys` |
| 7 | At least one key matches a reviewable beat | 404 `not_found` |

Keys that do not resolve to a question beat (or point to a `run` beat) are skipped, so the response only ever contains content that already exists; at most 12 keys are read.

### Status code summary

| Status | Codes | Meaning |
| --- | --- | --- |
| 400 | `empty_body`, `invalid_json`, `invalid_body`, `unknown_field`, `invalid_language`, `invalid_code`, `invalid_keys` | Malformed request |
| 403 | `origin_required`, `bad_origin`, `cross_origin`, `cross_site` | Not from this site |
| 404 | `unknown_language`, `not_found` | Nothing to serve |
| 405 | (framework) | Method other than POST |
| 413 | `payload_too_large`, `code_too_large` | Over the byte or code limits |
| 415 | `unsupported_media_type` | Not `application/json` |
| 429 | `rate_limited`, `one_at_a_time` | Per-client quota; honor `Retry-After` |
| 503 | `busy` | Instance-wide quota or concurrency cap; honor `Retry-After` |
| 500 | `internal` | Unexpected error, no details |

## Upstream runner (`lib/runners/rust-playground.ts`)

- **Only the player's snippet** is sent to the public Rust Playground, with fixed compile options. No identifiers, IPs, cookies or saves.
- **15 s timeout** (`AbortSignal.timeout(15_000)`), so a slow upstream cannot hold a concurrency slot forever.
- **No redirects** (`redirect: "error"`).
- **Response size cap**: a body longer than 1,000,000 characters is discarded.
- **Shape check**: `success` must be a boolean; `stdout`/`stderr` are coerced to strings and cargo noise is stripped from `stderr`.
- **Errors are reported as unavailable** (`available: false`) with empty output. Timeouts, network errors, non-2xx statuses and bad shapes never leak details to the client.
- **Kill switch**: `BITWISE_RUNNER=off` disables every external call; `run` beats are then validated locally with their `fallback` regex.

## Pages (`proxy.ts`)

Runs before every page request.

- **Page rate limit**: 240 per minute per client, burst 120. When exceeded it answers 429 `text/plain` with the RateLimit headers and `Retry-After`.
- **Per-request nonce CSP**: a fresh random nonce per request, passed to the framework (`x-nonce` request header) so its own scripts carry it.

| Directive | Value | Why |
| --- | --- | --- |
| `default-src` | `'self'` | Same-origin by default |
| `script-src` | `'self' 'nonce-…' 'strict-dynamic'` | Only nonced scripts, and the chunks they load. `'unsafe-eval'` is added in development only |
| `style-src` | `'self' 'unsafe-inline'` | React `style={}` props render as inline style attributes; this does not allow scripts |
| `img-src` | `'self' data: blob:` | Sprites and generated images |
| `font-src`, `media-src` | `'self'` | |
| `connect-src` | `'self'` | The browser only talks to this site (plus `ws:`/`wss:` in development for hot reload) |
| `worker-src` | `'self' blob:` | |
| `object-src` | `'none'` | No plugins |
| `base-uri`, `form-action` | `'self'` | No base hijacking or off-site form posts |
| `frame-ancestors` | `'none'` | Cannot be framed (clickjacking) |
| `upgrade-insecure-requests` | production only | |

- **Matcher**: the proxy skips `api` routes (they enforce their own, stricter quotas), static assets (`_next/static`, `_next/image`, `favicon.ico`, `icon.svg`) and prefetch requests (`next-router-prefetch` or `purpose: prefetch`), so navigation prefetching does not consume the page quota.

## Security headers (`next.config.ts`)

Set on every response (pages, API and static files):

| Header | Value |
| --- | --- |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` |

`poweredByHeader: false` removes the `X-Powered-By` header.

## Client behavior

`components/game/beats/RunBeatView.tsx`: when `/api/run` answers **429 or 503**, the beat shows `run.busy` ("Too many runs right now. Try again in N s.", with N from `Retry-After`, default 5). It is not the player's fault, so it costs **no heart** and the beat is not marked wrong. Network failures and `available: false` fall back to offline validation with the beat's `fallback` regex.

## Threat model

| Threat | Mitigation |
| --- | --- |
| API flooding | Per-client token buckets on every endpoint and on pages; uniform 429 with `Retry-After` |
| Upstream cost abuse (using the game as a free compiler) | Per-client and instance-wide quotas on `/api/run`, 1 compile in flight per client, 4 in total, result cache, code size limits, origin check, `BITWISE_RUNNER=off` kill switch |
| CSRF / cross-site use of the API | `assertSameOrigin` (required `Origin`, host match or allowlist, `Sec-Fetch-Site`); JSON-only bodies; no auth cookies or sessions to ride |
| Oversized payloads / JSON bombs | Content-type check, byte cap before and while reading (stream cancelled), strict UTF-8, small schemas with `onlyKeys`, length/line/count limits |
| Spoofing client IPs via headers | `clientKey` reads `X-Forwarded-For` from the right with a configured number of trusted hops; invalid values fall back to `anonymous`; global quotas apply regardless |
| XSS | Nonce CSP with `strict-dynamic` (no `unsafe-eval` in production), React escaping, no `dangerouslySetInnerHTML`, `nosniff` |
| Clickjacking | `frame-ancestors 'none'` and `X-Frame-Options: DENY` |
| Information leakage | Stable error codes only, upstream failures reported as unavailable, `cache-control: no-store`, no `X-Powered-By`, strict `Referrer-Policy`; no player code or IPs in logs |
| Memory exhaustion via many keys | LRU caps on token buckets (10,000 keys) and the cache (500 entries); per-key concurrency entries deleted when idle |
| Slowloris / slow upstream | Fail-fast semaphores (no queues), 15 s upstream timeout, body byte cap |

## Known limits / what to add in production

- **Shared rate-limit store.** Counters are per instance and reset on restart. Back the primitives with a shared store if you run several instances.
- **Edge rate limit / WAF** in front of the app for global, per-IP and per-path limits, bot filtering and protection against volumetric attacks the app cannot absorb.
- **Monitoring and alerting** on the rate of 429 and 503 responses (and on upstream unavailability), so abuse and under-sized quotas are noticed.
- **Dependency auditing.** Running `npm audit` (or an equivalent scanner) in CI is a good next step.
- **Trusted hops must match reality.** Review `BITWISE_TRUSTED_PROXY_HOPS` whenever the network path in front of the app changes.

## Configuration

| Variable | Default | Effect |
| --- | --- | --- |
| `BITWISE_TRUSTED_PROXY_HOPS` | `1` | Number of reverse proxies appending to `X-Forwarded-For`; `0` when exposed directly |
| `BITWISE_ALLOWED_ORIGINS` | empty | Extra origins (comma separated, full origins such as `https://example.test`) allowed to call the API |
| `BITWISE_RUNNER` | on | `off` disables all calls to the external compiler |

## Tests

`npm test` runs `tests/security.test.ts` together with the save tests. It covers:

- Token bucket: burst, denial with the right `Retry-After`, independent clients, refill over time, and the RateLimit headers.
- Token bucket memory cap: 10,000 distinct keys with `maxKeys: 100` keep only 100.
- Semaphore: fails fast when full and a double release only frees one slot.
- Keyed concurrency: limits each client separately and frees on release.
- TTL cache: evicts the oldest entry at the cap and expires entries.
- `clientKey`: `anonymous` with 0 hops, right-most hop with 1, `anonymous` for a non-IP value.
- `assertSameOrigin`: accepts same origin and allowlisted origins, rejects cross-site and origin-less requests.
- `readJson`: parses valid JSON, rejects oversized (413), wrong content type (415) and invalid JSON.
- `onlyKeys`: rejects unknown fields.

## Manual probes

Run against the dev server (`npm run dev`) after touching an API route, `proxy.ts` or `lib/security/`. Unless the row says otherwise, send `POST` with `content-type: application/json` and `origin: http://localhost:3000`. Example:

```bash
curl -i -X POST http://localhost:3000/api/run \
  -H 'content-type: application/json' -H 'origin: http://localhost:3000' \
  -d '{"language":"rust","code":"fn main(){println!(\"hi\");}"}'
```

| Hostile request | Expected |
| --- | --- |
| `GET /api/run` | 405 |
| POST without `Origin` | 403 `origin_required` |
| `Origin: https://evil.example` | 403 `cross_origin` |
| `Sec-Fetch-Site: cross-site` with a same-host origin | 403 `cross_site` |
| `content-type: text/plain` | 415 `unsupported_media_type` |
| Body larger than 16 KB to `/api/run` (or 2 KB to `/api/review-play`) | 413 `payload_too_large` |
| Body `{nope` | 400 `invalid_json` |
| Body `[]` | 400 `invalid_body` |
| Extra field, e.g. `{"language":"rust","code":"x","admin":true}` | 400 `unknown_field` |
| `"language":"../etc"` | 400 `invalid_language` |
| `"code":"   "` | 400 `invalid_code` |
| `code` with 401 lines or 10,001 characters | 413 `code_too_large` |
| `"language":"cobol"` | 404 `unknown_language` |
| `/api/review-play` with 13 keys or a key without `#<n>` | 400 `invalid_keys` |
| `/api/review-play` with `"lang":"go"` (not active) | 404 `unknown_language` |
| 9 quick `/api/run` calls from one client | the 9th gets 429 `rate_limited` with `Retry-After` and `RateLimit-*` headers |
| Two concurrent `/api/run` calls from one client (different code) | one gets 429 `one_at_a_time` |
| The same valid snippet twice | the second has `x-cache: hit` |
| More than 120 quick page loads from one client | 429 plain text |
| Any page response | `Content-Security-Policy` with a fresh nonce, `X-Frame-Options: DENY`, no `X-Powered-By` |

## Adding an endpoint

- [ ] Export only the methods you need (normally `POST`).
- [ ] `assertSameOrigin(req)` first.
- [ ] A per-client `TokenBucket` keyed by `clientKey(req.headers)`; return 429 with `rateLimitHeaders` when denied.
- [ ] `readJson(req, <byte cap>)`, `isPlainObject`, `onlyKeys`, and strict validation of every field (type, regex, length, count).
- [ ] For slow or paid work: a global quota, `Semaphore` / `KeyedConcurrency` (fail fast), a timeout and a response size cap on the upstream call, and a cache if results repeat.
- [ ] Respond with `json` / `errorResponse` and stable error codes; never return internals or upstream errors.
- [ ] Never log player code, IPs or request bodies.
- [ ] Put the numbers in `LIMITS` (`lib/security/policies.ts`) and in the quota table above.
- [ ] Add tests to `tests/security.test.ts` for new guards and run the manual probes.
