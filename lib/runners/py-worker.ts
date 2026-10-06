// Long-lived Web Worker that runs the player's Python in their own browser (never on the server).
// Pyodide is self-hosted under /pyodide/<version>/ (copied from node_modules by scripts/copy-pyodide.mjs).
// The page terminates and recreates this worker when a run exceeds its time limit.
import { PYODIDE_VERSION, runPython, type PyodideLike } from "./py-core";

type LoadFn = (opts: { indexURL: string }) => Promise<PyodideLike>;

// The bundler boots this worker as a classic script, and Pyodide refuses classic workers (it
// would use importScripts). Every chunk is already loaded, so hide importScripts: Pyodide then
// loads its modules with import(), which classic workers support.
(self as unknown as { importScripts?: unknown }).importScripts = undefined;

const base = new URL(`/pyodide/${PYODIDE_VERSION}/`, self.location.origin).href;
const ready: Promise<PyodideLike | null> = import(/* webpackIgnore: true */ /* turbopackIgnore: true */ `${base}pyodide.mjs`)
  .then((m: { loadPyodide: LoadFn }) => m.loadPyodide({ indexURL: base }))
  .catch((e: unknown) => {
    console.error("Python runtime failed to load:", e);
    return null;
  });

void ready.then((py) => (self as unknown as Worker).postMessage({ type: "ready", ok: !!py }));

self.onmessage = async (e: MessageEvent<{ id: number; code: string }>) => {
  const py = await ready;
  const result = py
    ? await runPython(py, e.data.code).catch(() => ({ ok: false, stdout: "", stderr: "", available: false }))
    : { ok: false, stdout: "", stderr: "", available: false };
  (self as unknown as Worker).postMessage({ type: "result", id: e.data.id, result });
};
