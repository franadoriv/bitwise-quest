import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PYODIDE_VERSION, runPython, type PyodideLike } from "../lib/runners/py-core.ts";
import { wrapSnippet } from "../scripts/snippet-wrap.ts";
import { tokenize } from "../lib/syntax.ts";

test("PYODIDE_VERSION matches the installed pyodide package", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { dependencies: Record<string, string> };
  assert.equal(pkg.dependencies.pyodide, PYODIDE_VERSION);
});

let py: Promise<PyodideLike> | null = null;
const pyodide = () => (py ??= import("pyodide").then((m) => (m as unknown as { loadPyodide: () => Promise<PyodideLike> }).loadPyodide()));

test("Python runner: stdout, clean tracebacks, syntax errors and asyncio", { timeout: 60_000 }, async () => {
  const p = await pyodide();
  assert.deepEqual(await runPython(p, "print(sorted({3, 1, 2}))"), { ok: true, stdout: "[1, 2, 3]\n", stderr: "", available: true });

  const ke = await runPython(p, "def f():\n    return {}['k']\nf()");
  assert.equal(ke.ok, false);
  assert.equal(ke.phase, "runtime");
  assert.match(ke.stderr, /File "main.py", line 2, in f\n\s+return \{\}\['k'\]/);
  assert.match(ke.stderr, /KeyError: 'k'$/);
  assert.doesNotMatch(ke.stderr, /_bwq_run/);

  const se = await runPython(p, "print('a'\n");
  assert.equal(se.phase, "compile");
  assert.match(se.stderr, /SyntaxError/);

  const aio = await runPython(p, "import asyncio\nasync def f():\n    await asyncio.sleep(0)\n    return 7\nprint(asyncio.run(f()))");
  assert.equal(aio.stdout, "7\n");
  // Timers, gather order, timeouts and tasks work without WebAssembly stack switching.
  const timers = await runPython(p, [
    "import asyncio",
    "async def w(n, d):",
    "    await asyncio.sleep(d)",
    "    print('done', n)",
    "    return n",
    "async def main():",
    "    print(await asyncio.gather(w(1, 0.03), w(2, 0.01)))",
    "    try:",
    "        await asyncio.wait_for(asyncio.sleep(1), 0.01)",
    "    except TimeoutError:",
    "        print('timeout')",
    "    print(await asyncio.create_task(w(3, 0)))",
    "asyncio.run(main())",
  ].join("\n"));
  assert.equal(timers.stdout, "done 2\ndone 1\n[1, 2]\ntimeout\ndone 3\n3\n");

  // A partial last line is flushed into its own run, not the next one.
  assert.equal((await runPython(p, 'print("ping", end=" ")')).stdout, "ping ");
  assert.equal((await runPython(p, 'print("next")')).stdout, "next\n");

  // Each run gets fresh globals.
  await runPython(p, "leak = 1");
  assert.match((await runPython(p, "print(leak)")).stderr, /NameError/);
});

test("snippet wrapper completes Go, C++ and C# programs", () => {
  const go = wrapSnippet("go", 'x := []int{1}\nfmt.Println(strings.ToUpper("a"), x)');
  assert.match(go, /^package main\n\nimport \(\n\t"fmt"\n\t"strings"\n\)\n\nfunc main\(\) \{\n\tx := /);
  assert.equal(wrapSnippet("go", "package main\nfunc main() {}"), "package main\nfunc main() {}");
  assert.doesNotMatch(wrapSnippet("go", "x := 1\n_ = x"), /import/);

  const cpp = wrapSnippet("cpp", 'std::cout << "hi";');
  assert.match(cpp, /#include <iostream>/);
  assert.match(cpp, /int main\(\) \{\n {4}std::cout/);
  assert.equal(wrapSnippet("cpp", "#include <cstdio>\nint main() {}"), "#include <cstdio>\nint main() {}");

  const cs = wrapSnippet("csharp", 'using System;\nConsole.WriteLine(1);');
  assert.equal(cs.match(/using System;/g)?.length, 1);
  assert.match(cs, /using System\.Linq;/);

  assert.match(wrapSnippet("zig", 'std.debug.print("hi\\n", .{});'), /^const std = @import\("std"\);\n\npub fn main\(\) !void \{\n {4}std\.debug/);
  assert.equal(wrapSnippet("haskell", "print 1"), "main :: IO ()\nmain = do\n  print 1\n");
  assert.equal(wrapSnippet("haskell", "main = print 1"), "main = print 1");
});

test("highlighter knows every code language", () => {
  const kinds = (code: string, lang: string) => tokenize(code, lang).filter((t) => t.kind !== "plain" && t.kind !== "punct").map((t) => `${t.kind}:${t.text}`);
  assert.deepEqual(kinds("func f() { defer g() }", "go"), ["kw:func", "fn:f", "kw:defer", "fn:g"]);
  assert.deepEqual(kinds("def f(): # hi", "python"), ["kw:def", "fn:f", "com:# hi"]);
  assert.deepEqual(kinds("#include <map>\nauto x = nullptr;", "cpp"), ["mac:#include <map>", "kw:auto", "kw:nullptr"]);
  assert.deepEqual(kinds('var s = $"a{b}";', "csharp"), ["kw:var", 'str:$"a{b}"']);
  assert.deepEqual(kinds("const x = @import(\"std\");", "zig"), ["kw:const", "mac:@import", 'str:"std"']);
  assert.deepEqual(kinds("f x' = 'a' -- c", "haskell"), ["str:'a'", "com:-- c"]);
  assert.deepEqual(kinds('def hi = puts "a#{@n}" # c\nh = { k: :v }', "ruby"), ["kw:def", "type:puts", 'str:"a#{@n}"', "com:# c", "mac::v"]);
});

test("coding tasks: the harness wraps the player's code and reads each test back", async () => {
  const { buildTaskProgram, parseTaskResults, MARK } = await import("../lib/coding/harness.ts");
  const tests = [{ run: "print(f(1))", expect: "2" }, { run: "print(f(2))", expect: "4", hidden: true }];
  const py = buildTaskProgram("python", "def f(x):\n    return x * 2", tests);
  assert.match(py, /^def f\(x\):[\s\S]*print\("@@BWQ#0"\)\nprint\(f\(1\)\)[\s\S]*print\("@@BWQ#end"\)\n$/);

  // C#: using lines stay first, then the test statements, then the player's types.
  const cs = buildTaskProgram("csharp", "using System;\n\nstatic class K { public static int F(int x) => x; }", [{ run: "Console.WriteLine(K.F(1));", expect: "1" }]);
  assert.ok(cs.indexOf("using System;") < cs.indexOf(MARK) && cs.indexOf(MARK) < cs.indexOf("static class K"));

  const ok = parseTaskResults(`debug line\n${MARK}0\n2\n${MARK}1\n4\n${MARK}end\n`, tests);
  assert.deepEqual(ok.results.map((r) => r.pass), [true, true]);
  assert.equal(ok.finished, true);
  // The program crashed during the second test: it never reached the end mark.
  const crashed = parseTaskResults(`${MARK}0\n2\n${MARK}1\n`, tests);
  assert.deepEqual(crashed.results.map((r) => [r.pass, r.reached]), [[true, true], [false, false]]);
  assert.equal(crashed.finished, false);
  const wrong = parseTaskResults(`${MARK}0\n3\n${MARK}1\n4\n${MARK}end`, tests);
  assert.deepEqual(wrong.results.map((r) => r.pass), [false, true]);
});

test("trace tables: cells are judged one by one, loosely spaced, given cells skipped", async () => {
  const { judgeTrace, traceStdout } = await import("../lib/coding/trace.ts");
  const rows = [
    { label: "i = 0", cells: ["0", "[1, 2]"], given: [0] },
    { label: "i = 1", cells: ["1", "[1, 2, 3]"] },
  ];
  assert.equal(traceStdout(rows), "0 | [1, 2]\n1 | [1, 2, 3]");
  const ok = judgeTrace(rows, [["", " [1,  2] "], ["1", "[1, 2, 3]"]]);
  assert.equal(ok.all, true); // " [1,  2] " is trimmed and its double space collapsed
  const r = judgeTrace(rows, [["", "[1, 2]"], ["1", "[1, 2, 4]"]]);
  assert.deepEqual(r.cells, [[true, true], [true, false]]);
  assert.equal(r.right, 2);
  assert.equal(r.total, 3);
  assert.equal(judgeTrace(rows, [["x", "[1, 2]"], [" 1 ", "[1, 2, 3]"]]).all, true);
});
