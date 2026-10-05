import { completeExam } from "@/lib/repo";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { lang?: string; exam?: string; answers?: { index: number; correct: boolean }[] } | null;
  if (!b?.lang || !b.exam || !Array.isArray(b.answers)) return Response.json({ error: "bad request" }, { status: 400 });
  const report = completeExam(b.lang, b.exam, b.answers.slice(0, 100));
  if (!report) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(report);
}
