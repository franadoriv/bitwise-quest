import { getReviewPlay } from "@/lib/repo";

/** The client sends the review keys that are due in its save; the server returns those beats. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { lang?: string; keys?: unknown } | null;
  if (!b?.lang || !Array.isArray(b.keys)) return Response.json({ error: "bad request" }, { status: 400 });
  const keys = b.keys.filter((k): k is string => typeof k === "string" && /^[a-z0-9-]+#\d+$/.test(k));
  const play = getReviewPlay(b.lang, keys);
  if (!play) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(play);
}
