import type { LanguageRunner, RunResult } from "./types";

// Uses the public Rust Playground. Only the player's practice snippet is sent.
// Set BITWISE_RUNNER=off to disable network execution (beats fall back to offline checks).
export const rustPlayground: LanguageRunner = {
  id: "rust-playground",
  async run(code: string): Promise<RunResult> {
    try {
      const res = await fetch("https://play.rust-lang.org/execute", {
        method: "POST",
        headers: { "content-type": "application/json", "user-agent": "bitwise-quest (learning game)" },
        body: JSON.stringify({ channel: "stable", mode: "debug", edition: "2021", crateType: "bin", tests: false, backtrace: false, code }),
        signal: AbortSignal.timeout(15_000),
        redirect: "error",
      });
      if (!res.ok) return { ok: false, stdout: "", stderr: "", available: false };
      // Never trust an upstream blindly: cap what we read and check the shape.
      const text = await res.text();
      if (text.length > 1_000_000) return { ok: false, stdout: "", stderr: "", available: false };
      const data = JSON.parse(text) as { success?: unknown; stdout?: unknown; stderr?: unknown };
      if (typeof data.success !== "boolean") return { ok: false, stdout: "", stderr: "", available: false };
      const stderr = cleanStderr(String(data.stderr ?? ""));
      const phase = data.success ? undefined : /panicked at/.test(stderr) ? "runtime" : "compile";
      return { ok: data.success, stdout: String(data.stdout ?? ""), stderr, available: true, ...(phase ? { phase } : {}) };
    } catch {
      // Timeouts and network errors are reported as "unavailable"; details stay on the server.
      return { ok: false, stdout: "", stderr: "", available: false };
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
