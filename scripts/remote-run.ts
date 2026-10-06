// Runs verification programs for the validator: Go, C++ and C# on the same public sandboxes the game
// uses (results cached in .snippets/ so re-runs are fast and polite), Python in Pyodide inside Node.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import type { CodeLang } from "../lib/content/types.ts";
import type { LanguageRunner, RunResult } from "../lib/runners/types.ts";
import { goPlayground } from "../lib/runners/go-playground.ts";
import { godboltCpp, godboltCsharp, godboltHaskell, godboltRuby, godboltZig } from "../lib/runners/godbolt.ts";
import { runPython, type PyodideLike } from "../lib/runners/py-core.ts";

const REMOTE: Partial<Record<CodeLang, { runner: LanguageRunner; parallel: number }>> = {
  go: { runner: goPlayground, parallel: 3 },
  cpp: { runner: godboltCpp, parallel: 2 },
  csharp: { runner: godboltCsharp, parallel: 2 },
  zig: { runner: godboltZig, parallel: 2 },
  haskell: { runner: godboltHaskell, parallel: 2 },
  ruby: { runner: godboltRuby, parallel: 2 },
};

const CACHE_DIR = ".snippets";
const cacheFile = (lang: string) => `${CACHE_DIR}/cache-${lang}.json`;

function loadCache(lang: string): Record<string, RunResult> {
  try {
    return existsSync(cacheFile(lang)) ? (JSON.parse(readFileSync(cacheFile(lang), "utf8")) as Record<string, RunResult>) : {};
  } catch {
    return {};
  }
}

let pyodide: Promise<PyodideLike> | null = null;
async function python(): Promise<PyodideLike> {
  pyodide ??= import("pyodide").then((m) => (m as unknown as { loadPyodide: () => Promise<PyodideLike> }).loadPyodide());
  return pyodide;
}

export const VERIFIABLE_LANGS: CodeLang[] = ["go", "cpp", "csharp", "zig", "haskell", "ruby", "python"];

/** Runs every program (in order), returning one result per program. Unavailable runs are not cached. */
export async function runAll(lang: CodeLang, programs: string[], onProgress?: (done: number) => void): Promise<RunResult[]> {
  const results: RunResult[] = new Array(programs.length);
  if (lang === "python") {
    const py = await python();
    for (const [i, p] of programs.entries()) {
      results[i] = await runPython(py, p);
      onProgress?.(i + 1);
    }
    return results;
  }
  const remote = REMOTE[lang];
  if (!remote) throw new Error(`no verifier for ${lang}`);
  const cache = loadCache(lang);
  const key = (p: string) => createHash("sha256").update(p).digest("hex").slice(0, 32);
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < programs.length) {
      const i = next++;
      const k = key(programs[i]);
      let r = cache[k];
      // Public sandboxes rate-limit bursts: back off and retry before calling it unavailable.
      for (let attempt = 0; !r && attempt < 4; attempt++) {
        if (attempt) await new Promise((res) => setTimeout(res, 3000 * 2 ** (attempt - 1)));
        const got = await remote.runner.run(programs[i]);
        if (got.available) cache[k] = r = got;
        else if (attempt === 3) r = got;
      }
      results[i] = r;
      onProgress?.(++done);
    }
  };
  await Promise.all(Array.from({ length: remote.parallel }, worker));
  // Several validators may run at once: merge with what is on disk, then swap the file atomically.
  mkdirSync(CACHE_DIR, { recursive: true });
  const tmp = `${cacheFile(lang)}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify({ ...loadCache(lang), ...cache }));
  renameSync(tmp, cacheFile(lang));
  return results;
}
