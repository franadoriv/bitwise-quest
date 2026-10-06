"use client";
// Runs a coding task for the player: in the browser (JS/TS, Python) the program is built here with
// the task's tests; with a server runner, /api/run appends the tests (hidden ones stay on the server).
import type { CodeLang, CodeTaskBeat } from "@/lib/content/types";
import { buildTaskProgram, parseTaskResults } from "./harness";
import { BROWSER_RUNNERS, runInBrowser, runPythonInBrowser } from "@/lib/runners/browser";

export interface TaskRef { scope: "lesson" | "exam"; slug: string; index: number }

export interface TaskTestView {
  hidden: boolean;
  pass: boolean;
  /** Visible tests only: the call, what it should print and what it printed. */
  run?: string;
  expect?: string;
  got?: string;
}

export interface TaskRun {
  /** False when the runner could not be reached (the attempt doesn't count against the player). */
  available: boolean;
  /** "busy": the server's quota is full; try again in a few seconds. */
  busy?: number;
  compileError: boolean;
  stderr: string;
  tests: TaskTestView[];
  passed: number;
}

const empty = (extra: Partial<TaskRun> = {}): TaskRun => ({ available: false, compileError: false, stderr: "", tests: [], passed: 0, ...extra });

export async function runTask(opts: { beat: CodeTaskBeat; code: string; pack: string; runner: string | null; lang: CodeLang; task: TaskRef | null }): Promise<TaskRun> {
  const { beat, code, pack, runner, lang, task } = opts;
  if (runner === "py-browser" || (runner && BROWSER_RUNNERS.has(runner))) {
    const program = buildTaskProgram(lang, code, beat.tests);
    const r = runner === "py-browser" ? await runPythonInBrowser(program, 8000) : await runInBrowser(program, { jsx: lang === "tsx", timeoutMs: 6000 });
    if (!r.available) return empty();
    const compileError = !r.ok && (r.phase ?? (/^SyntaxError/.test(r.stderr) ? "compile" : "runtime")) === "compile";
    const parsed = parseTaskResults(r.stdout, beat.tests);
    const tests = beat.tests.map((t, i) => {
      const res = parsed.results[i];
      return t.hidden ? { hidden: true, pass: res.pass } : { hidden: false, pass: res.pass, run: t.run, expect: t.expect, got: res.got };
    });
    return { available: true, compileError, stderr: compileError || !parsed.finished ? r.stderr : "", tests, passed: tests.filter((t) => t.pass).length };
  }
  if (!task) return empty();
  try {
    const res = await fetch("/api/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ language: pack, code, task }) });
    if (res.status === 429 || res.status === 503) return empty({ available: true, busy: Number(res.headers.get("retry-after") ?? "5") || 5 });
    if (!res.ok) return empty();
    const data = (await res.json()) as { available: boolean; ok: boolean; phase?: string; stderr: string; tests?: { pass: boolean; got?: string; hidden?: boolean }[]; finished?: boolean };
    if (!data.available) return empty();
    const compileError = !data.ok && data.phase === "compile";
    const visible = beat.tests.filter((t) => !t.hidden);
    let v = 0;
    const tests: TaskTestView[] = (data.tests ?? []).map((r) => {
      if (r.hidden) return { hidden: true, pass: r.pass };
      const t = visible[v++];
      return { hidden: false, pass: r.pass, run: t?.run, expect: t?.expect, got: r.got ?? "" };
    });
    // A compile error means no test ran: list them all as failed so the player sees what's at stake.
    const all: TaskTestView[] = tests.length ? tests : [...visible.map((t) => ({ hidden: false, pass: false, run: t.run, expect: t.expect, got: "" })), ...Array.from({ length: beat.hiddenCount ?? 0 }, () => ({ hidden: true, pass: false }))];
    return { available: true, compileError, stderr: compileError || data.finished === false ? data.stderr : "", tests: all, passed: all.filter((t) => t.pass).length };
  } catch {
    return empty();
  }
}
