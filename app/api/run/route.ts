import { db } from "@/lib/db";
import { getRunner } from "@/lib/runners";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { language?: string; code?: string } | null;
  if (!body?.language || typeof body.code !== "string" || body.code.length > 20_000) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const lang = db().prepare("SELECT runner FROM languages WHERE slug = ?").get(body.language) as { runner: string | null } | undefined;
  const runner = getRunner(lang?.runner);
  if (!runner) return Response.json({ ok: false, stdout: "", stderr: "", available: false });
  return Response.json(await runner.run(body.code));
}
