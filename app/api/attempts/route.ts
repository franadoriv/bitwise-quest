import { saveAttempts, type AttemptInput } from "@/lib/repo";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { lang?: string; slug?: string; attempts?: AttemptInput[] } | null;
  if (!b?.lang || !b.slug || !Array.isArray(b.attempts)) return Response.json({ error: "bad request" }, { status: 400 });
  return Response.json({ ok: saveAttempts(b.lang, b.slug, b.attempts.slice(0, 200)) });
}
