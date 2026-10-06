"use client";
import type { RunResult } from "./types";

/** Runners that execute in the player's browser instead of the server. */
export { BROWSER_RUNNER_IDS as BROWSER_RUNNERS } from "./ids";

const UNAVAILABLE: RunResult = { ok: false, stdout: "", stderr: "", available: false };

/** Runs JS/TS (and JSX/TSX with React) in a disposable Web Worker with a hard timeout. */
export function runInBrowser(code: string, opts: { jsx: boolean; timeoutMs?: number }): Promise<RunResult> {
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./js-worker.ts", import.meta.url), { type: "module" });
    } catch {
      resolve(UNAVAILABLE);
      return;
    }
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ ok: false, stdout: "", stderr: "Timed out after 3 s (infinite loop?)", available: true, phase: "runtime" });
    }, opts.timeoutMs ?? 3000);
    worker.onmessage = (e: MessageEvent<RunResult>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = () => {
      clearTimeout(timer);
      worker.terminate();
      resolve(UNAVAILABLE);
    };
    worker.postMessage({ code, jsx: opts.jsx });
  });
}

// Python: loading CPython (≈12 MB, cached by the browser) takes a few seconds, so one worker is kept
// warm and reused. The time limit starts once the interpreter is ready.
let py: { worker: Worker; ready: Promise<boolean> } | null = null;
let nextId = 1;

function pythonWorker() {
  if (py) return py;
  const worker = new Worker(new URL("./py-worker.ts", import.meta.url), { type: "module" });
  const ready = new Promise<boolean>((resolve) => {
    const onReady = (e: MessageEvent<{ type: string; ok?: boolean }>) => {
      if (e.data.type !== "ready") return;
      worker.removeEventListener("message", onReady);
      resolve(!!e.data.ok);
    };
    worker.addEventListener("message", onReady);
    worker.addEventListener("error", () => resolve(false), { once: true });
  });
  py = { worker, ready };
  return py;
}

function resetPython() {
  py?.worker.terminate();
  py = null;
}

/** Starts loading Python in the background (call when a Python lesson opens). */
export function warmPython() {
  try {
    pythonWorker();
  } catch {
    /* worker unsupported: runs will fall back to offline checks */
  }
}

export async function runPythonInBrowser(code: string, timeoutMs = 5000): Promise<RunResult> {
  let w: ReturnType<typeof pythonWorker>;
  try {
    w = pythonWorker();
  } catch {
    return UNAVAILABLE;
  }
  if (!(await w.ready)) {
    resetPython();
    return UNAVAILABLE;
  }
  const id = nextId++;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      w.worker.removeEventListener("message", onMessage);
      resetPython(); // the interpreter is stuck in the loop: throw it away
      resolve({ ok: false, stdout: "", stderr: `Timed out after ${timeoutMs / 1000} s (infinite loop?)`, available: true, phase: "runtime" });
    }, timeoutMs);
    const onMessage = (e: MessageEvent<{ type: string; id?: number; result?: RunResult }>) => {
      if (e.data.type !== "result" || e.data.id !== id || !e.data.result) return;
      clearTimeout(timer);
      w.worker.removeEventListener("message", onMessage);
      resolve(e.data.result);
    };
    w.worker.addEventListener("message", onMessage);
    w.worker.postMessage({ id, code });
  });
}
