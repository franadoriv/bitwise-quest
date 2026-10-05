// HTTP hardening helpers for route handlers: client identity, origin checks, bounded JSON parsing and
// uniform, cache-proof JSON responses. Pure (Web Request/Response only) so they are unit-testable.
import type { Decision } from "./limits.ts";

export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message = code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const BASE_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" };

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...BASE_HEADERS, ...headers } });
}

/** Generic error body: a stable code, never internals or stack traces. */
export function errorResponse(e: unknown, headers: Record<string, string> = {}): Response {
  if (e instanceof HttpError) return json({ error: e.code }, e.status, headers);
  return json({ error: "internal" }, 500, headers);
}

/** IETF RateLimit headers + Retry-After when limited. */
export function rateLimitHeaders(d: Decision): Record<string, string> {
  const h: Record<string, string> = {
    "ratelimit-limit": String(d.limit),
    "ratelimit-remaining": String(Math.max(0, d.remaining)),
    "ratelimit-reset": String(d.resetSec),
  };
  if (!d.ok) h["retry-after"] = String(d.retryAfterSec);
  return h;
}

/**
 * Client identity for rate limiting. BITWISE_TRUSTED_PROXY_HOPS is the number of reverse proxies in
 * front of the app that append to X-Forwarded-For (default 1, the usual hosting setup). The client IP
 * is read from the right, counting hops, so a client cannot spoof it by prepending its own entries.
 * Set it to 0 when the server is exposed directly: every request then shares one identity, so the
 * per-client limits act globally (stricter, never weaker). Global quotas apply regardless.
 */
export function clientKey(headers: Headers, hops = Number(process.env.BITWISE_TRUSTED_PROXY_HOPS ?? "1")): string {
  if (hops > 0) {
    const chain = (headers.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const ip = chain[chain.length - hops];
    if (ip && /^[0-9a-f.:]{3,45}$/i.test(ip)) return ip.toLowerCase();
  }
  return "anonymous";
}

/**
 * Blocks cross-site use of the API from browsers (CSRF / hotlinking): the Origin must be this site
 * or an explicitly allowed origin (BITWISE_ALLOWED_ORIGINS, comma separated). Browsers always send
 * Origin on POST; requests without it are rejected too.
 */
export function assertSameOrigin(req: Request, allowed = process.env.BITWISE_ALLOWED_ORIGINS) {
  const origin = req.headers.get("origin");
  if (!origin) throw new HttpError(403, "origin_required");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, "bad_origin");
  }
  const extra = (allowed ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (originHost !== host && !extra.includes(origin)) throw new HttpError(403, "cross_origin");
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none" && !extra.includes(origin)) throw new HttpError(403, "cross_site");
}

/** Reads a JSON body with a hard byte cap (checked before and while reading) and content-type check. */
export async function readJson(req: Request, maxBytes: number): Promise<unknown> {
  const type = req.headers.get("content-type") ?? "";
  if (!/^application\/json\b/i.test(type)) throw new HttpError(415, "unsupported_media_type");
  const declared = Number(req.headers.get("content-length") ?? "NaN");
  if (Number.isFinite(declared) && declared > maxBytes) throw new HttpError(413, "payload_too_large");
  if (!req.body) throw new HttpError(400, "empty_body");
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new HttpError(413, "payload_too_large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let o = 0;
  for (const c of chunks) { bytes.set(c, o); o += c.byteLength; }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new HttpError(400, "invalid_json");
  }
}

export const isPlainObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Rejects unknown keys: requests must match the schema exactly. */
export function onlyKeys(body: Record<string, unknown>, keys: string[]) {
  for (const k of Object.keys(body)) if (!keys.includes(k)) throw new HttpError(400, "unknown_field");
}
