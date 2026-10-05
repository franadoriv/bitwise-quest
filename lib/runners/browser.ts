"use client";
import type { RunResult } from "./types";

/** Runners that execute in the player's browser instead of the server. */
export { BROWSER_RUNNER_IDS as BROWSER_RUNNERS } from "./ids";

/** Runs JS/TS (and JSX/TSX with React) in a disposable Web Worker with a hard timeout. */
export function runInBrowser(code: string, opts: { jsx: boolean; timeoutMs?: number }): Promise<RunResult> {
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./js-worker.ts", import.meta.url), { type: "module" });
    } catch {
      resolve({ ok: false, stdout: "", stderr: "", available: false });
      return;
    }
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ ok: false, stdout: "", stderr: "Timed out after 3 s (infinite loop?)", available: true });
    }, opts.timeoutMs ?? 3000);
    worker.onmessage = (e: MessageEvent<RunResult>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = () => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, stdout: "", stderr: "", available: false });
    };
    worker.postMessage({ code, jsx: opts.jsx });
  });
}
