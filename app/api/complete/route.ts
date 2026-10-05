import { completeLesson, isLessonUnlocked, type AttemptInput } from "@/lib/repo";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as {
    lang?: string; slug?: string; score?: number; mistakes?: number; maxCombo?: number; correct?: number; attempts?: AttemptInput[];
  } | null;
  if (!b?.lang || !b.slug || !Array.isArray(b.attempts)) return Response.json({ error: "bad request" }, { status: 400 });
  if (!isLessonUnlocked(b.lang, b.slug)) return Response.json({ error: "locked" }, { status: 403 });
  const reward = completeLesson(b.lang, b.slug, {
    score: Number(b.score) || 0,
    mistakes: Number(b.mistakes) || 0,
    maxCombo: Number(b.maxCombo) || 0,
    correct: Number(b.correct) || 0,
    attempts: b.attempts.slice(0, 200),
  });
  if (!reward) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(reward);
}
