import { getLanguage, getReviewPlay } from "@/lib/repo";
import { HttpError, assertSameOrigin, clientKey, errorResponse, isPlainObject, json, onlyKeys, rateLimitHeaders, readJson } from "@/lib/security/http";
import { LIMITS, guards } from "@/lib/security/policies";

/** The client sends the review keys that are due in its save; the server returns those beats. */
export async function POST(req: Request) {
  let headers: Record<string, string> = {};
  try {
    assertSameOrigin(req);
    const d = guards.reviewPerClient.take(clientKey(req.headers));
    headers = rateLimitHeaders(d);
    if (!d.ok) return json({ error: "rate_limited" }, 429, headers);

    const body = await readJson(req, LIMITS.review.maxBytes);
    if (!isPlainObject(body)) throw new HttpError(400, "invalid_body");
    onlyKeys(body, ["lang", "keys"]);
    const { lang, keys } = body;
    if (typeof lang !== "string" || !/^[a-z0-9-]{1,32}$/.test(lang) || getLanguage(lang)?.status !== "active") throw new HttpError(404, "unknown_language");
    if (!Array.isArray(keys) || keys.length === 0 || keys.length > LIMITS.review.maxKeys) throw new HttpError(400, "invalid_keys");
    if (!keys.every((k) => typeof k === "string" && /^[a-z0-9-]{1,64}#\d{1,3}$/.test(k))) throw new HttpError(400, "invalid_keys");
    const play = getReviewPlay(lang, keys as string[]);
    if (!play || play.beats.length === 0) throw new HttpError(404, "not_found");
    return json(play, 200, headers);
  } catch (e) {
    return errorResponse(e, headers);
  }
}
