import { completeReview, type AttemptInput } from "@/lib/repo";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { lang?: string; attempts?: AttemptInput[]; score?: number } | null;
  if (!b?.lang || !Array.isArray(b.attempts)) return Response.json({ error: "bad request" }, { status: 400 });
  return Response.json(completeReview(b.lang, b.attempts.slice(0, 50), Number(b.score) || 0));
}
