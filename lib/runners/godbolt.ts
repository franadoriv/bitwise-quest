import type { LanguageRunner, RunResult } from "./types.ts";
import { postJson, UNAVAILABLE } from "./http.ts";

// Compiler Explorer (godbolt.org) compiles and executes the player's snippet in its sandbox.
type Line = { text?: unknown };
type Reply = { code?: unknown; stdout?: unknown; stderr?: unknown; didExecute?: unknown; buildResult?: { code?: unknown; stderr?: unknown; stdout?: unknown } };

const lines = (v: unknown) => (Array.isArray(v) ? (v as Line[]).map((l) => String(l?.text ?? "")).join("\n") : "");

/** Optional per-language step that decides what counts as program output (see Zig). */
type Split = (out: { stdout: string; stderr: string; ok: boolean }) => { stdout: string; stderr: string; phase?: "compile" | "runtime" };

function godbolt(id: string, compiler: string, lang: string, userArguments: string, clean: (s: string) => string, split?: Split, timeoutMs = 20_000): LanguageRunner {
  return {
    id,
    async run(code: string): Promise<RunResult> {
      const body = JSON.stringify({
        source: code,
        options: {
          userArguments,
          executeParameters: { args: [], stdin: "" },
          compilerOptions: { executorRequest: true },
          filters: { execute: true },
          tools: [],
          libraries: [],
        },
        lang,
        allowStoreCodeDebug: false,
      });
      const data = (await postJson(`https://godbolt.org/api/compiler/${compiler}/compile`, body, "application/json", timeoutMs)) as Reply | null;
      if (!data || typeof data.code !== "number") return UNAVAILABLE;
      const build = data.buildResult;
      if (build && typeof build.code === "number" && build.code !== 0) {
        return { ok: false, stdout: "", stderr: clean(lines(build.stderr) || lines(build.stdout)) || "Compilation failed", available: true, phase: "compile" };
      }
      const ok = data.code === 0;
      const raw = { stdout: lines(data.stdout), stderr: lines(data.stderr), ok };
      const out: ReturnType<Split> = split ? split(raw) : raw;
      const stdoutText = out.stdout ? out.stdout + "\n" : "";
      return { ok, stdout: stdoutText, stderr: clean(out.stderr), available: true, ...(ok ? {} : { phase: out.phase ?? ("runtime" as const) }) };
    },
  };
}

// eslint-disable-next-line no-control-regex
const stripAnsi = (s: string) => s.replace(/\u001b\[[0-9;]*[A-Za-z]/g, "");

const cleanCpp = (s: string) =>
  stripAnsi(s)
    .split("\n")
    .map((l) => l.replace(/^(?:<source>|(?:\/app\/)?(?:example|output)\.cpp):/, "main.cpp:"))
    .filter((l) => !/^Compiler returned:/.test(l))
    .join("\n")
    .trim();

const cleanCs = (s: string) =>
  stripAnsi(s)
    .split("\n")
    .filter((l) => !/^(Compiler returned:|\s*Determining projects|\s*Restored|\s*All projects are up-to-date|Build FAILED|\s*\d+ (Warning|Error)\(s\)|Time Elapsed|MSBuild version|\s*$)/.test(l))
    .filter((l) => !/^Program terminated with signal/.test(l))
    .map((l) => l.replace(/^(?:<source>|.*?[\\/]?(?:example|Program)\.cs)\(/, "Program.cs(").replace(/ in \/app\/example\.cs:line /, " in Program.cs:line ").replace(/\s*\[[^\]]*\.csproj\]\s*$/, ""))
    .filter((l, i, all) => all.indexOf(l) === i)
    .join("\n")
    .trim();

const cleanZig = (s: string) => {
  const all = stripAnsi(s).split("\n");
  // Keep the panic and the player's frames; drop the standard library's startup frames.
  const end = all.findIndex((l) => /^(\/cefs\/|\?\?\?:|Program terminated with signal)/.test(l));
  return (end === -1 ? all : all.slice(0, end))
    .map((l) => l.replace(/(?:\/app\/|\.\/)?example\.zig/g, "main.zig").replace(/ 0x[0-9a-f]+ in /, " in "))
    .filter((l) => !/^(Compiler returned:|Build failed$)/.test(l))
    .join("\n")
    .trim();
};

/**
 * Zig programs usually print with std.debug.print, which writes to stderr. Everything printed before
 * a panic (or before an error returned from main, "error: Name") is program output; the panic or
 * error and its trace are the error.
 */
const splitZig: Split = ({ stdout, stderr, ok }) => {
  const panic = stderr.search(/thread \d+ panic: |^panic: /m);
  const returned = ok ? -1 : stderr.search(/^error: [A-Za-z_]\w*$/m);
  const at = panic !== -1 ? panic : returned;
  const printed = at === -1 ? stderr : stderr.slice(0, at);
  return { stdout: [stdout, printed.replace(/\n$/, "")].filter(Boolean).join("\n"), stderr: at === -1 ? "" : stderr.slice(at) };
};

const cleanHaskell = (s: string) =>
  stripAnsi(s)
    .split("\n")
    .map((l) => l.replace(/^<source>:/, "Main.hs:").replace(/^output\.s: /, "").replace(/^\/app\/example\.hs:/, "Main.hs:"))
    .filter((l) => !/^(Compiler returned:|Build failed$|\[1 of \d\]|Linking )/.test(l))
    .join("\n")
    .trim();

/** Ruby has no build step: a SyntaxError surfaces when the script starts, so report it as a compile error. */
const splitRuby: Split = ({ stdout, stderr, ok }) => {
  if (ok || !/\(SyntaxError\)/.test(stderr)) return { stdout, stderr };
  const at = stderr.search(/^.*syntax errors? found/m);
  return { stdout, stderr: at === -1 ? stderr : stderr.slice(at), phase: "compile" };
};

const cleanRuby = (s: string) =>
  stripAnsi(s)
    .split("\n")
    .map((l) => l.replace(/\/app\/(?:output\.s|example\.rb)/g, "main.rb"))
    .filter((l) => !/^(Compiler returned:|Program terminated with signal)/.test(l))
    .join("\n")
    .trim();

export const godboltCpp = godbolt("godbolt-cpp", "g142", "c++", "-std=c++20 -O1", cleanCpp);
export const godboltCsharp = godbolt("godbolt-csharp", "dotnet100csharpcoreclr", "csharp", "", cleanCs);
export const godboltZig = godbolt("godbolt-zig", "z0152", "zig", "", cleanZig, splitZig, 30_000);
export const godboltHaskell = godbolt("godbolt-haskell", "ghc984", "haskell", "", cleanHaskell);
export const godboltRuby = godbolt("godbolt-ruby", "ruby347", "ruby", "", cleanRuby, splitRuby);
