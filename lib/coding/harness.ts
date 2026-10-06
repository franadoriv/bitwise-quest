// Coding tasks: turns a player's code plus the task's tests into one program for the language's
// runner, and reads each test's result back from its output. Shared by the server (/api/run), the
// browser runners and the content validator, so it has no imports beyond types.
import type { CodeLang, CodeTest } from "../content/types.ts";

/** Printed alone on a line before each test's output ("@@BWQ#3") and once at the end ("@@BWQ#end"). */
export const MARK = "@@BWQ#";

interface Driver {
  /** Code placed before the player's code (e.g. a header the driver needs). */
  head?: string;
  /** Where the driver goes: after the player's code (a main function) or before it (C# top-level statements). */
  order: "after" | "before";
  open: string;
  close: string;
  indent: string;
  mark(label: string): string;
}

const DRIVERS: Record<CodeLang, Driver> = {
  ts: { order: "after", open: "", close: "", indent: "", mark: (l) => `console.log(${JSON.stringify(MARK + l)});` },
  tsx: { order: "after", open: "", close: "", indent: "", mark: (l) => `console.log(${JSON.stringify(MARK + l)});` },
  python: { order: "after", open: "", close: "", indent: "", mark: (l) => `print(${JSON.stringify(MARK + l)})` },
  ruby: { order: "after", open: "", close: "", indent: "", mark: (l) => `puts ${JSON.stringify(MARK + l)}` },
  rust: { order: "after", open: "fn main() {", close: "}", indent: "    ", mark: (l) => `println!("${MARK}${l}");` },
  // the player's file has `package main` and imports fmt; the driver keeps fmt used either way
  go: { order: "after", open: "func main() {\n\tvar _ = fmt.Sprint", close: "}", indent: "\t", mark: (l) => `fmt.Println("${MARK}${l}")` },
  cpp: { head: "#include <iostream>", order: "after", open: "int main() {", close: "}", indent: "    ", mark: (l) => `std::cout << "${MARK}${l}" << std::endl;` },
  csharp: { order: "before", open: "", close: "", indent: "", mark: (l) => `System.Console.WriteLine("${MARK}${l}");` },
  zig: { order: "after", open: "pub fn main() !void {", close: "}", indent: "    ", mark: (l) => `std.debug.print("${MARK}${l}\\n", .{});` },
  haskell: { order: "after", open: "main :: IO ()\nmain = do", close: "", indent: "  ", mark: (l) => `putStrLn "${MARK}${l}"` },
};

const indentLines = (code: string, indent: string) => code.split("\n").map((l) => (l.trim() ? indent + l : l)).join("\n");

/** The full program: the player's code and a driver that runs every test between markers. */
export function buildTaskProgram(lang: CodeLang, code: string, tests: CodeTest[]): string {
  const d = DRIVERS[lang];
  const body = [
    ...tests.flatMap((t, i) => [d.mark(String(i)), t.run]),
    d.mark("end"),
  ].map((l) => indentLines(l, d.indent)).join("\n");
  const driver = [d.open, body, d.close].filter(Boolean).join("\n");
  if (d.order === "before") {
    // C#: `using` lines must stay first, then the top-level test statements, then the player's types.
    const lines = code.split("\n");
    let i = 0;
    while (i < lines.length && (/^\s*using\s+[\w.]+\s*;\s*$/.test(lines[i]) || !lines[i].trim())) i++;
    return [lines.slice(0, i).join("\n"), driver, lines.slice(i).join("\n")].filter((s) => s.trim()).join("\n\n") + "\n";
  }
  return [d.head, code.trimEnd(), driver].filter(Boolean).join("\n\n") + "\n";
}

export interface TestResult {
  pass: boolean;
  /** What the test printed (empty when the program stopped before reaching it). */
  got: string;
  /** False when the program crashed or stopped before this test. */
  reached: boolean;
}

/** Reads the output between markers. `finished` is false when the program never reached the end mark. */
export function parseTaskResults(stdout: string, tests: CodeTest[]): { results: TestResult[]; finished: boolean } {
  const seg = new Map<string, string[]>();
  let current: string | null = null;
  for (const line of stdout.replace(/\r/g, "").split("\n")) {
    if (line.startsWith(MARK)) {
      current = line.slice(MARK.length).trim();
      seg.set(current, []);
    } else if (current != null) seg.get(current)!.push(line);
  }
  const results = tests.map((t, i) => {
    const lines = seg.get(String(i));
    const got = (lines ?? []).join("\n").trim();
    // A test "reached" the next mark (or the end) only if the program kept going after it.
    const next = i + 1 < tests.length ? String(i + 1) : "end";
    const reached = !!lines && seg.has(next);
    return { pass: reached && got === t.expect.trim(), got, reached };
  });
  return { results, finished: seg.has("end") };
}
