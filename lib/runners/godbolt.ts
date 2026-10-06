import type { LanguageRunner, RunResult } from "./types.ts";
import { postJson, UNAVAILABLE } from "./http.ts";

// Compiler Explorer (godbolt.org) compiles and executes the player's snippet in its sandbox.
type Line = { text?: unknown };
type Reply = { code?: unknown; stdout?: unknown; stderr?: unknown; didExecute?: unknown; buildResult?: { code?: unknown; stderr?: unknown; stdout?: unknown } };

const lines = (v: unknown) => (Array.isArray(v) ? (v as Line[]).map((l) => String(l?.text ?? "")).join("\n") : "");

function godbolt(id: string, compiler: string, lang: string, userArguments: string, clean: (s: string) => string): LanguageRunner {
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
      const data = (await postJson(`https://godbolt.org/api/compiler/${compiler}/compile`, body, "application/json", 20_000)) as Reply | null;
      if (!data || typeof data.code !== "number") return UNAVAILABLE;
      const build = data.buildResult;
      if (build && typeof build.code === "number" && build.code !== 0) {
        return { ok: false, stdout: "", stderr: clean(lines(build.stderr) || lines(build.stdout)) || "Compilation failed", available: true, phase: "compile" };
      }
      const stdout = lines(data.stdout);
      const stdoutText = stdout ? stdout + "\n" : "";
      const ok = data.code === 0;
      return { ok, stdout: stdoutText, stderr: clean(lines(data.stderr)), available: true, ...(ok ? {} : { phase: "runtime" as const }) };
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

export const godboltCpp = godbolt("godbolt-cpp", "g142", "c++", "-std=c++20 -O1", cleanCpp);
export const godboltCsharp = godbolt("godbolt-csharp", "dotnet100csharpcoreclr", "csharp", "", cleanCs);
