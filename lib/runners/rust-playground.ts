import type { LanguageRunner, RunResult } from "./types";

// Uses the public Rust Playground. Only the player's practice snippet is sent.
// Set BITFORGE_RUNNER=off to disable network execution (beats fall back to offline checks).
export const rustPlayground: LanguageRunner = {
  id: "rust-playground",
  async run(code: string): Promise<RunResult> {
    try {
      const res = await fetch("https://play.rust-lang.org/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channel: "stable", mode: "debug", edition: "2021", crateType: "bin", tests: false, backtrace: false, code }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) return { ok: false, stdout: "", stderr: `runner HTTP ${res.status}`, available: false };
      const data = (await res.json()) as { success: boolean; stdout: string; stderr: string };
      return { ok: data.success, stdout: data.stdout ?? "", stderr: cleanStderr(data.stderr ?? ""), available: true };
    } catch (e) {
      return { ok: false, stdout: "", stderr: String(e), available: false };
    }
  },
};

/** Drops cargo noise and keeps the compiler diagnostics. */
function cleanStderr(s: string) {
  return s
    .split("\n")
    .filter((l) => !/^\s*(Compiling|Finished|Running|warning: unused|Blocking)/.test(l))
    .join("\n")
    .trim();
}
