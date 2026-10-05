import { createHash } from "node:crypto";
import { getRunner as getRunnerId } from "@/lib/repo";
import { getRunner } from "@/lib/runners";
import { HttpError, assertSameOrigin, clientKey, errorResponse, isPlainObject, json, onlyKeys, rateLimitHeaders, readJson } from "@/lib/security/http";
import { LIMITS, guards } from "@/lib/security/policies";

/** Compiles and runs a player's snippet. The most expensive endpoint: every guard applies. */
export async function POST(req: Request) {
  let headers: Record<string, string> = {};
  try {
    assertSameOrigin(req);
    const client = clientKey(req.headers);
    const perClient = guards.runPerClient.take(client);
    headers = rateLimitHeaders(perClient);
    if (!perClient.ok) return json({ error: "rate_limited" }, 429, headers);

    const body = await readJson(req, LIMITS.runBody.maxBytes);
    if (!isPlainObject(body)) throw new HttpError(400, "invalid_body");
    onlyKeys(body, ["language", "code"]);
    const { language, code } = body;
    if (typeof language !== "string" || !/^[a-z0-9-]{1,32}$/.test(language)) throw new HttpError(400, "invalid_language");
    if (typeof code !== "string" || !code.trim()) throw new HttpError(400, "invalid_code");
    if (code.length > LIMITS.runBody.maxChars || code.split("\n").length > LIMITS.runBody.maxLines || code.includes("\u0000")) throw new HttpError(413, "code_too_large");
    const runnerId = getRunnerId(language);
    if (!runnerId) throw new HttpError(404, "unknown_language");
    const runner = getRunner(runnerId);
    // Runner disabled (BITWISE_RUNNER=off): the client falls back to offline validation.
    if (!runner) return json({ ok: false, stdout: "", stderr: "", available: false }, 200, headers);

    // Many players submit the same solutions: serve those from cache without calling the upstream.
    const cacheKey = createHash("sha256").update(`${language}\u0000${code}`).digest("hex");
    const cached = guards.runCache.get(cacheKey);
    if (cached) return json(cached, 200, { ...headers, "x-cache": "hit" });

    const global = guards.runGlobal.take("global");
    if (!global.ok) return json({ error: "busy" }, 503, { ...headers, "retry-after": String(global.retryAfterSec) });
    const releaseClient = guards.runInFlightPerClient.tryAcquire(client);
    if (!releaseClient) return json({ error: "one_at_a_time" }, 429, { ...headers, "retry-after": "2" });
    const release = guards.runInFlight.tryAcquire();
    if (!release) {
      releaseClient();
      return json({ error: "busy" }, 503, { ...headers, "retry-after": "5" });
    }
    try {
      const r = await runner.run(code);
      const max = LIMITS.runOutput.maxChars;
      const result = { ...r, stdout: r.stdout.slice(0, max), stderr: r.stderr.slice(0, max) };
      if (result.available) guards.runCache.set(cacheKey, result);
      return json(result, 200, headers);
    } finally {
      release();
      releaseClient();
    }
  } catch (e) {
    return errorResponse(e, headers);
  }
}
