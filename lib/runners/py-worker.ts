// Long-lived Web Worker that runs the player's Python in their own browser (never on the server).
// Pyodide is self-hosted under /pyodide/<version>/ (copied from node_modules by scripts/copy-pyodide.mjs).
// The page terminates and recreates this worker when a run exceeds its time limit.
import { PYODIDE_VERSION, runPython, type PyodideLike } from "./py-core";

type LoadFn = (opts: { indexURL: string }) => Promise<PyodideLike>;
export type PyWorkerMessage =
  | { type: "progress"; phase: "download" | "boot"; loaded: number; total: number }
  | { type: "ready"; ok: boolean }
  | { type: "result"; id: number; result: unknown };

const post = (m: PyWorkerMessage) => (self as unknown as Worker).postMessage(m);

// The bundler boots this worker as a classic script, and Pyodide refuses classic workers (it
// would use importScripts). Every chunk is already loaded, so hide importScripts: Pyodide then
// loads its modules with import(), which classic workers support.
(self as unknown as { importScripts?: unknown }).importScripts = undefined;

const base = new URL(`/pyodide/${PYODIDE_VERSION}/`, self.location.origin).href;
/** Files Pyodide fetches while booting, with fallback sizes for when Content-Length is missing. */
const FILES: [string, number][] = [
  ["pyodide.asm.wasm", 9_600_000],
  ["python_stdlib.zip", 2_500_000],
  ["pyodide.asm.mjs", 1_250_000],
  ["pyodide-lock.json", 120_000],
  ["pyodide.mjs", 18_000],
];

/**
 * Downloads the runtime first, reporting byte progress for the loading screen. The files are
 * served as immutable, so Pyodide's own requests right after are answered by the HTTP cache.
 */
async function prefetch() {
  const responses = await Promise.all(FILES.map(([f]) => fetch(base + f)));
  if (responses.some((r) => !r.ok)) throw new Error("runtime files unavailable");
  const total = responses.reduce((sum, r, i) => sum + (Number(r.headers.get("content-length")) || FILES[i][1]), 0);
  let loaded = 0;
  let last = 0;
  const report = (force = false) => {
    const now = Date.now();
    if (force || now - last > 80) {
      last = now;
      post({ type: "progress", phase: "download", loaded: Math.min(loaded, total), total });
    }
  };
  report(true);
  await Promise.all(
    responses.map(async (r) => {
      const reader = r.body?.getReader();
      if (!reader) return;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        loaded += value.byteLength;
        report();
      }
    }),
  );
  post({ type: "progress", phase: "download", loaded: total, total });
}

const ready: Promise<PyodideLike | null> = prefetch()
  .then(() => {
    post({ type: "progress", phase: "boot", loaded: 0, total: 1 });
    return import(/* webpackIgnore: true */ /* turbopackIgnore: true */ `${base}pyodide.mjs`) as Promise<{ loadPyodide: LoadFn }>;
  })
  .then((m) => m.loadPyodide({ indexURL: base }))
  .catch((e: unknown) => {
    console.error("Python runtime failed to load:", e);
    return null;
  });

void ready.then((py) => post({ type: "ready", ok: !!py }));

self.onmessage = async (e: MessageEvent<{ id: number; code: string }>) => {
  const py = await ready;
  const result = py
    ? await runPython(py, e.data.code).catch(() => ({ ok: false, stdout: "", stderr: "", available: false }))
    : { ok: false, stdout: "", stderr: "", available: false };
  post({ type: "result", id: e.data.id, result });
};
