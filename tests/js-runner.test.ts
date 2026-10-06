// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { executeJs, inspect } from "../lib/runners/js-core.ts";

test("formats values like Node for short outputs", () => {
  assert.equal(inspect([1, "a", [2]]), "[ 1, 'a', [ 2 ] ]");
  assert.equal(inspect({ a: 1, "b-c": [] }), "{ a: 1, 'b-c': [] }");
  assert.equal(inspect(new Map([["k", 1]])), "Map(1) { 'k' => 1 }");
  assert.equal(inspect(new Set([1, 2])), "Set(2) { 1, 2 }");
  assert.equal(inspect(undefined), "undefined");
  assert.equal(inspect(-0), "-0");
  assert.equal(inspect(BigInt(10)), "10n");
  class P { x = 1; }
  assert.equal(inspect(new P()), "P { x: 1 }");
});

test("runs TypeScript and captures console output", async () => {
  const r = await executeJs("const xs: number[] = [1, 2, 3];\nconsole.log(xs.map((x) => x * 2), typeof xs);");
  assert.deepEqual(r, { ok: true, stdout: "[ 2, 4, 6 ] object", stderr: "", available: true, timedOut: false });
});

test("event loop order: sync, microtasks, then timers", async () => {
  const r = await executeJs(`
    console.log("A");
    setTimeout(() => console.log("D"), 0);
    Promise.resolve().then(() => console.log("C"));
    console.log("B");`);
  assert.equal(r.stdout, "A\nB\nC\nD");
});

test("async/await and top-level await work", async () => {
  const r = await executeJs("const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));\nawait wait(10);\nconsole.log('done');");
  assert.equal(r.stdout, "done");
});

test("runtime errors are reported, not thrown", async () => {
  const r = await executeJs("const o: any = undefined;\no.x;");
  assert.equal(r.ok, false);
  assert.match(r.stderr, /^TypeError: /);
});

test("syntax errors are reported", async () => {
  const r = await executeJs("const = 1;");
  assert.equal(r.ok, false);
  assert.match(r.stderr, /SyntaxError/);
});

test("React components render to static markup", async () => {
  const code = `import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
function Hello({ name }: { name: string }) { return <h1 className="t">Hi {name}</h1>; }
console.log(renderToStaticMarkup(<Hello name="Ada" />));`;
  const r = await executeJs(code, { jsx: true, modules: { react: React, "react-dom/server": ReactDOMServer } });
  assert.equal(r.stdout, '<h1 class="t">Hi Ada</h1>');
});

test("pending intervals time out", async () => {
  const r = await executeJs("setInterval(() => {}, 5);", { timeoutMs: 50 });
  assert.equal(r.timedOut, true);
  assert.equal(r.ok, false);
});

test("Node-only globals are hidden so verification matches the browser", async () => {
  const r = await executeJs("console.log(typeof process, typeof setImmediate, typeof global);");
  assert.equal(r.stdout, "undefined undefined undefined");
});

test("a promise that never settles times out and keeps the output so far", async () => {
  const r = await executeJs('console.log("before");\nawait new Promise(() => {});\nconsole.log("after");', { timeoutMs: 80 });
  assert.equal(r.timedOut, true);
  assert.equal(r.ok, false);
  assert.equal(r.stdout, "before");
});
