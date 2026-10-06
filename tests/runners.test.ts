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
