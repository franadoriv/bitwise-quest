import type { LanguageRunner, RunResult } from "./types.ts";
import { postJson, UNAVAILABLE } from "./http.ts";

// Uses the official Go Playground. Only the player's practice snippet is sent.
export const goPlayground: LanguageRunner = {
  id: "go-playground",
  async run(code: string): Promise<RunResult> {
    const data = (await postJson("https://go.dev/_/compile", new URLSearchParams({ version: "2", body: code, withVet: "false" }).toString(), "application/x-www-form-urlencoded")) as
      | { Errors?: unknown; Events?: unknown; Status?: unknown; IsTest?: unknown }
      | null;
    if (!data || typeof data.Errors !== "string") return UNAVAILABLE;
    if (data.Errors) return { ok: false, stdout: "", stderr: cleanGo(data.Errors), available: true, phase: "compile" };
    let stdout = "";
    let stderr = "";
    for (const ev of Array.isArray(data.Events) ? (data.Events as { Message?: unknown; Kind?: unknown }[]) : []) {
      if (ev.Kind === "stderr") stderr += String(ev.Message ?? "");
      else stdout += String(ev.Message ?? "");
    }
    // The playground reports no exit code: a panic or fatal error on stderr means the run failed.
    const crashed = (typeof data.Status === "number" && data.Status !== 0) || /^(panic: |fatal error: )/m.test(stderr) || /Program exited: status [1-9]/.test(stdout + stderr);
    return { ok: !crashed, ...(crashed ? { phase: "runtime" as const } : {}), stdout: stdout.replace(/\n?Program exited[^\n]*\n?$/, ""), stderr: cleanGo(stderr), available: true };
  },
};

/** Drops the sandbox's temp paths so errors read like `./prog.go:5:2: ...`. */
const cleanGo = (s: string) =>
  s
    .replace(/^# command-line-arguments\n/m, "")
    .replace(/\/tmp\/sandbox\d+\/src\//g, "./")
    .replace(/\n?Program exited[^\n]*\s*$/, "")
    .trim();
