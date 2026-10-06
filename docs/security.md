# Security and abuse protection

Optional cloud saves are browser-only and use Supabase owner-only RLS plus an atomic revision-checked RPC. No Vercel save endpoint exists. Imports have bounded decompression and structural validation. The page CSP permits only the exact configured Supabase HTTPS origin; see [cloud-saves.md](cloud-saves.md) for setup, limits and tests.

Bitwise Quest is a public game with two API endpoints, and one of them (`/api/run`) forwards code to external compiler services. This document explains how the backend protects itself and those upstreams from flooding, cost abuse, cross-site use, oversized payloads, header spoofing, XSS and clickjacking, and what you still need to add in front of it in production.

The server is stateless: content is served from memory (`lib/repo.ts`), there is no database, and the server never receives or stores player saves. The only mutable server state is the abuse-protection counters and the run cache described below.

**Player code never runs on the server.** Rust, Go, C++, C#, Zig, Haskell and Ruby snippets (including the Rails moon's, which run as plain Ruby) are forwarded to external sandboxes (the public Rust Playground, the official Go Playground and Compiler Explorer); JS/TS/React and Python snippets run in a Web Worker in the player's own browser and never reach the server. See [Player code execution](#player-code-execution).

## Map

| Piece | Path | Role |
| --- | --- | --- |
| Primitives | `lib/security/limits.ts` | `TokenBucket`, `Semaphore`, `KeyedConcurrency`, `TtlCache` (in memory, hard caps on keys) |
| HTTP guards | `lib/security/http.ts` | `clientKey`, `assertSameOrigin`, `readJson`, `onlyKeys`, `isPlainObject`, `json`, `errorResponse`, `rateLimitHeaders`, `HttpError` |
| Quotas | `lib/security/policies.ts` | `LIMITS` table and the process-wide `guards` singletons |
| Code runner endpoint | `app/api/run/route.ts` | Every guard applies; the most expensive endpoint |
| Review endpoint | `app/api/review-play/route.ts` | Origin, rate limit, body cap, strict validation |
| Upstream adapters | `lib/runners/rust-playground.ts`, `go-playground.ts`, `godbolt.ts`, `http.ts` | Timeout, no redirects, response cap, shape check, output cleanup |
| Browser runners | `lib/runners/browser.ts`, `js-worker.ts`, `js-core.ts`, `py-worker.ts`, `py-core.ts`, `ids.ts` | JS/TS runs in a disposable Web Worker (3 s hard timeout); Python in a reusable Pyodide worker (5 s limit, recreated when stuck) |
| Python runtime | `scripts/copy-pyodide.mjs`, `public/pyodide/<version>/` | Self-hosted Pyodide files, no third-party CDN |
| Page proxy | `proxy.ts` | Per-request nonce CSP and page rate limit |
| Static headers | `next.config.ts` | Security headers on every response, immutable caching for `/pyodide/*`, `poweredByHeader: false` |
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
| 8 | The language exists, is `active` and has a **server** runner (packs with a browser runner such as `js-browser` or `py-browser` are refused) | 404 `unknown_language` |
| 9 | Runner disabled (`BITWISE_RUNNER=off`) | 200 `{ ok: false, available: false }`: the client validates offline |
| 10 | Result cache (SHA-256 of language + code) | 200 with `x-cache: hit`, no upstream call, no global quota used |
| 11 | Global token bucket (60/min) | 503 `busy` + `Retry-After` |
| 12 | One compile in flight per client | 429 `one_at_a_time` + `Retry-After: 2` |
| 13 | Four compiles in flight in total (fail fast) | 503 `busy` + `Retry-After: 5` |
| 14 | Upstream call; output truncated to 8,000 chars each | 200 `{ ok, stdout, stderr, available, phase? }` |

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

## Upstream runners (server runners)

Every server runner is registered in `lib/runners/index.ts` and reached only through `POST /api/run`, so all of them share the guards, quotas, concurrency caps and result cache above.

| Runner | File | Third party and endpoint | What is sent |
| --- | --- | --- | --- |
| `rust-playground` | `lib/runners/rust-playground.ts` | Public Rust Playground, `https://play.rust-lang.org/execute` | The snippet plus fixed options (stable channel, debug, edition 2021, binary crate) |
| `go-playground` | `lib/runners/go-playground.ts` | Official Go Playground, `https://go.dev/_/compile` | The snippet as `body`, with `version=2` and `withVet=false` (form-encoded) |
| `godbolt-cpp` | `lib/runners/godbolt.ts` | Compiler Explorer, `https://godbolt.org/api/compiler/g142/compile` | The snippet as `source`, with g++ 14 and `-std=c++20 -O1`, execution enabled, empty stdin and arguments, `allowStoreCodeDebug: false` |
| `godbolt-csharp` | `lib/runners/godbolt.ts` | Compiler Explorer, `https://godbolt.org/api/compiler/dotnet100csharpcoreclr/compile` | The snippet as `source`, with .NET 10 (CoreCLR), execution enabled, empty stdin and arguments, `allowStoreCodeDebug: false` |
| `godbolt-zig` | `lib/runners/godbolt.ts` | Compiler Explorer, `https://godbolt.org/api/compiler/z0152/compile` | The snippet as `source`, with Zig 0.15.2 and no compiler flags (Debug build), execution enabled, empty stdin and arguments, `allowStoreCodeDebug: false` |
| `godbolt-haskell` | `lib/runners/godbolt.ts` | Compiler Explorer, `https://godbolt.org/api/compiler/ghc984/compile` | The snippet as `source`, with GHC 9.8.4 and no compiler flags, execution enabled, empty stdin and arguments, `allowStoreCodeDebug: false` |
| `godbolt-ruby` | `lib/runners/godbolt.ts` | Compiler Explorer, `https://godbolt.org/api/compiler/ruby347/compile` | The snippet as `source`, with Ruby 3.4.7 and no interpreter flags (standard library only, no gems), execution enabled, empty stdin and arguments, `allowStoreCodeDebug: false`. Used by the Ruby planet and the Rails moon; Rails moon snippets are plain Ruby, so nothing Rails-specific is sent |

Common rules (the Go, C++, C#, Zig, Haskell and Ruby runners use `postJson` in `lib/runners/http.ts`; the Rust runner applies the same rules inline):

- **Only the player's snippet** and fixed compiler options are sent. No identifiers, IPs, cookies or saves. Requests carry a fixed `User-Agent: bitwise-quest (learning game)`. Each third party's own terms and privacy policy apply to what it receives; review them before enabling a new sandbox.
- **Timeout**: 15 s (20 s for Compiler Explorer, which compiles and runs in one call, and 30 s for Zig, whose compiler is slower), so a slow upstream cannot hold a concurrency slot forever.
- **No redirects** (`redirect: "error"`).
- **Response size cap**: a body longer than 1,000,000 characters is discarded.
- **Shape check**: the reply must have the expected fields (`success` boolean for Rust, `Errors` string for Go, numeric `code` for Compiler Explorer); everything else is coerced to strings.
- **Output cleanup**: ANSI escape codes and build-tool noise (cargo, MSBuild, `Compiler returned:` lines) are removed, and sandbox paths are renamed to `prog.go`, `main.cpp`, `Program.cs`, `main.zig`, `Main.hs` or `main.rb`, so no upstream file system details reach the player. Zig traces are cut before the standard library's startup frames (paths under the sandbox's `/cefs/`), GHC's `output.s: ` prefix is dropped, and Ruby's `/app/output.s` path becomes `main.rb`. Each failure is tagged `phase: "compile"` or `phase: "runtime"` (a Ruby `SyntaxError` counts as `compile`).
- **Errors are reported as unavailable** (`available: false`) with empty output. Timeouts, network errors, non-2xx statuses, oversized or malformed bodies and bad shapes never leak details to the client, and unavailable results are never cached.
- **Kill switch**: `BITWISE_RUNNER=off` disables every external call; `run` beats are then validated locally with their `fallback` regex.

The content validator (`scripts/remote-run.ts`) calls the same Go, C++, C#, Zig, Haskell and Ruby runners at authoring time with the repository's own snippets, a small fixed parallelism and a local result cache (see [testing.md](testing.md)).

## Player code execution

| Pack runner | Where the code runs | Server role |
| --- | --- | --- |
| `rust-playground` (server runner) | The public Rust Playground's sandbox | `/api/run` forwards the snippet with every guard above; nothing is executed locally |
| `go-playground` (server runner) | The official Go Playground's sandbox | Same as above |
| `godbolt-cpp`, `godbolt-csharp`, `godbolt-zig`, `godbolt-haskell`, `godbolt-ruby` (server runners) | Compiler Explorer's sandbox | Same as above |
| `js-browser` (browser runner) | A Web Worker in the player's own browser | None. The code is never sent to the server, and `/api/run` refuses these packs (`getRunner` in `lib/repo.ts` returns `null` for ids in `BROWSER_RUNNER_IDS`) |
| `py-browser` (browser runner) | Pyodide (CPython in WebAssembly) in a Web Worker in the player's own browser | Serves the static Pyodide files only; the code is never sent to the server and `/api/run` refuses these packs |

Rule: **never execute player code in the server process** (no `eval`, `new Function`, `vm`, child processes or in-process interpreters on player input). A new language uses an external sandbox behind `/api/run` or a browser runner. The content validator (`scripts/validate-content.ts`) does run TS/TSX snippets and Python (Pyodide) in Node, but only the repository's own content, at authoring time, never player input.

### The JS/TS worker

`lib/runners/browser.ts` runs each snippet in a fresh module worker created from `lib/runners/js-worker.ts`:

- **Isolation.** The worker is a separate thread with no DOM: player code cannot read or change the page, the game state or the save (`localStorage` does not exist in workers). It only sees the `console`, timer and `require` shims the core passes in, plus the standard worker globals. `import` statements resolve only `react`, `react-dom/server` and, for snippets that import it, `three` (loaded lazily from the game's own bundle).
- **Disposable.** One worker per run; it is terminated as soon as the result arrives.
- **Hard timeout.** If no result arrives within **3 s** the page calls `worker.terminate()`, which stops even an infinite synchronous loop, and the beat shows "it crashed while running" with `Timed out after 3 s (infinite loop?)`. Inside the worker, timers still pending after 2.5 s are cleared and the run fails.
- **Bounded output.** stdout and stderr together are capped at about 8,000 characters.
- **Fails closed to offline mode.** If the worker cannot be created, the result is `available: false` and the beat is checked with its `fallback` regex.
- **Self-reported results.** The verdict is computed in the player's browser, like all progress, which already lives on the client. Nothing server-side trusts it.

### The Python worker

`lib/runners/browser.ts` runs Python in one long-lived module worker created from `lib/runners/py-worker.ts`, which loads Pyodide from `/pyodide/<version>/pyodide.mjs` on the game's own origin:

- **Isolation.** Same thread boundary as the JS worker: no DOM, no access to the page, the game state or the save. The harness in `lib/runners/py-core.ts` gives every run fresh globals, so one snippet's variables do not leak into the next.
- **Reused, then discarded when stuck.** Loading CPython takes a few seconds, so the worker is warmed when a Python exercise opens and reused between runs. The **5 s** limit starts once the interpreter is ready; on timeout the page terminates the worker (stopping an infinite loop) and the next run creates a new one.
- **Bounded output.** stdout and stderr are capped at about 20,000 characters each by the harness.
- **Fails closed to offline mode.** If the worker or the runtime cannot load, the result is `available: false` and the beat is checked with its `fallback` regex.
- **Limitations.** No threads, no network from the standard library and no `input()`; lessons are written around them.

Review point (a consideration, not a known vulnerability): Pyodide exposes a bridge to the worker's JavaScript globals, so, as with the JS worker, a player's own snippet could reach worker APIs such as `fetch`. It runs only in that player's browser with their own privileges; content shipped in this repository must never do it.

### Self-hosted Pyodide

- **No third-party CDN.** `scripts/copy-pyodide.mjs` (run on `postinstall`, `predev` and `prebuild`) copies five files from the pinned `pyodide` npm package (`pyodide.mjs`, `pyodide.asm.mjs`, `pyodide.asm.wasm`, `python_stdlib.zip`, `pyodide-lock.json`) to `public/pyodide/<version>/`, which is gitignored. The browser loads the runtime only from the game's origin, so the page keeps `connect-src 'self'` and no external script source is needed. `PYODIDE_VERSION` in `lib/runners/py-core.ts` must match `package.json` (`tests/runners.test.ts` checks it).
- **Caching.** `next.config.ts` serves `/pyodide/*` with `Cache-Control: public, max-age=31536000, immutable` (on top of the static security headers); the path contains the version, so an upgrade changes the URL.
- **Proxy exclusion.** The `proxy.ts` matcher skips `pyodide/`, so these static files (about 12 MB on first load) do not consume the page rate limit and are served without the per-request CSP, like other static assets. As with the JS worker script, the worker's own CSP comes from its script response, which is what lets Pyodide compile WebAssembly inside the worker without loosening the page CSP.

### The worker script and the CSP

The worker scripts are bundled as static assets under `/_next/static/`, which the `proxy.ts` matcher skips, so it is served **without the page CSP** (it still gets the static headers from `next.config.ts`). A dedicated worker's CSP comes from its own script response, not from the page, so:

- the page keeps a strict CSP with no `'unsafe-eval'` in production, and only allows starting workers from `'self'` and `blob:` (`worker-src`);
- inside the worker, `executeJs` can compile the player's code with `new Function`, which the page CSP would block.

Review points (considerations, not known vulnerabilities):

- Code in the worker is not restricted by `connect-src`, so a player's own snippet could call `fetch`. It runs only in that player's browser, with their own privileges, like code typed into the browser's developer console; content shipped in this repository must never do it.
- Do not loosen the page CSP to make the runner work, and do not move `new Function` to the page. If the worker ever needs a CSP of its own, serve its script with one that allows `'unsafe-eval'` and nothing else.
- `postMessage` data from the worker is only rendered as text by React, never as HTML.

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
| `worker-src` | `'self' blob:` | Lets the page start the JS/TS and Python runner workers from this origin (see [Player code execution](#player-code-execution)) |
| `object-src` | `'none'` | No plugins |
| `base-uri`, `form-action` | `'self'` | No base hijacking or off-site form posts |
| `frame-ancestors` | `'none'` | Cannot be framed (clickjacking) |
| `upgrade-insecure-requests` | production only | |

- **Matcher**: the proxy skips `api` routes (they enforce their own, stricter quotas), static assets (`_next/static`, `_next/image`, `pyodide/`, `favicon.ico`, `icon.svg`) and prefetch requests (`next-router-prefetch` or `purpose: prefetch`), so navigation prefetching does not consume the page quota.

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

`components/game/beats/RunBeatView.tsx`: when `/api/run` answers **429 or 503**, the beat shows `run.busy` ("Too many runs right now. Try again in N s.", with N from `Retry-After`, default 5). It is not the player's fault, so it costs **no heart** and the beat is not marked wrong. Network failures and `available: false` fall back to offline validation with the beat's `fallback` regex. Packs with a browser runner never call `/api/run`, so they are never rate limited.

## Threat model

| Threat | Mitigation |
| --- | --- |
| API flooding | Per-client token buckets on every endpoint and on pages; uniform 429 with `Retry-After` |
| Upstream cost abuse (using the game as a free compiler) | Per-client and instance-wide quotas on `/api/run`, 1 compile in flight per client, 4 in total, result cache, code size limits, origin check, `BITWISE_RUNNER=off` kill switch |
| Remote code execution through player snippets | Player code never runs in the server process: Rust, Go, C++, C#, Zig, Haskell and Ruby go to external sandboxes, JS/TS and Python run in a Web Worker in the player's browser; `/api/run` refuses browser-runner packs |
| A player's snippet freezing the page | Both workers run off the main thread; the JS/TS worker is terminated after 3 s (one disposable worker per run), the Python worker after 5 s and recreated |
| Third-party script supply chain for the Python runtime | Pyodide is copied from the pinned npm package and served from the game's own origin; no CDN |
| CSRF / cross-site use of the API | `assertSameOrigin` (required `Origin`, host match or allowlist, `Sec-Fetch-Site`); JSON-only bodies; no auth cookies or sessions to ride |
| Oversized payloads / JSON bombs | Content-type check, byte cap before and while reading (stream cancelled), strict UTF-8, small schemas with `onlyKeys`, length/line/count limits |
| Spoofing client IPs via headers | `clientKey` reads `X-Forwarded-For` from the right with a configured number of trusted hops; invalid values fall back to `anonymous`; global quotas apply regardless |
| XSS | Nonce CSP with `strict-dynamic` (no `unsafe-eval` in production), React escaping, no `dangerouslySetInnerHTML`, `nosniff` |
| Clickjacking | `frame-ancestors 'none'` and `X-Frame-Options: DENY` |
| Information leakage | Stable error codes only, upstream failures reported as unavailable, `cache-control: no-store`, no `X-Powered-By`, strict `Referrer-Policy`; no player code or IPs in logs |
| Memory exhaustion via many keys | LRU caps on token buckets (10,000 keys) and the cache (500 entries); per-key concurrency entries deleted when idle |
| Slowloris / slow upstream | Fail-fast semaphores (no queues), 15 s upstream timeout (20 s for Compiler Explorer), body byte cap |

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
| `BITWISE_RUNNER` | on | `off` disables all calls to the external compilers (Rust Playground, Go Playground, Compiler Explorer); browser runners are unaffected |

## Tests

`npm test` runs `tests/security.test.ts` together with the save, JS runner, runners (Pyodide version sync, Python harness, snippet wrapper, highlighter) and music tests. `tests/js-runner.test.ts` checks that runtime and syntax errors are returned instead of thrown and that pending timers time out. The security tests cover:

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
| `/api/review-play` with `"lang":"elixir"` (no such pack, or not active) | 404 `unknown_language` |
| `/api/run` with `"language":"python"` or `"typescript"` (browser runner) | 404 `unknown_language` |
| `GET /pyodide/<version>/pyodide.mjs` | 200 with `Cache-Control: public, max-age=31536000, immutable`, no page rate limit |
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
