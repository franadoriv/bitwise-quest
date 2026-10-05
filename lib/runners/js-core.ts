// JavaScript/TypeScript execution core, shared by the browser Web Worker (the game) and Node
// (content verification), so a snippet prints exactly the same thing in both.
//
// - TS/TSX/JSX is stripped and modules converted with sucrase (types are NOT checked here; type
//   claims in content are verified at authoring time with the real TypeScript compiler).
// - console output is captured and formatted like Node's util.inspect for short values.
// - Timers are tracked so the run ends when the program and its pending timers finish.
// - Infinite synchronous loops cannot be interrupted from inside: the browser terminates the worker
//   from the outside after a timeout.
import { transform } from "sucrase";

export interface JsRunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  available: true;
  timedOut?: boolean;
}

export function compileJs(code: string, jsx: boolean): string {
  return transform(code, {
    transforms: jsx ? ["typescript", "jsx", "imports"] : ["typescript", "imports"],
    jsxRuntime: "classic",
    production: true,
    disableESTransforms: true,
  }).code;
}

// ─── Node-like value formatting ─────────────────────────────────────────────
const IDENT = /^[A-Za-z_$][\w$]*$/;

function fmtKey(k: string) {
  return IDENT.test(k) ? k : `'${k}'`;
}

export function inspect(v: unknown, depth = 0, seen = new Set<unknown>()): string {
  if (typeof v === "string") return depth === 0 ? v : `'${v.replace(/'/g, "\\'")}'`;
  if (typeof v === "number") return Object.is(v, -0) ? "-0" : String(v);
  if (typeof v === "bigint") return `${v}n`;
  if (v === undefined) return "undefined";
  if (v === null) return "null";
  if (typeof v === "boolean") return String(v);
  if (typeof v === "symbol") return v.toString();
  if (typeof v === "function") {
    if (/^class\s/.test(Function.prototype.toString.call(v))) return `[class ${v.name || "(anonymous)"}]`;
    return v.name ? `[Function: ${v.name}]` : "[Function (anonymous)]";
  }
  const inner = (x: unknown) => inspect(x, depth + 1, seen);
  if (seen.has(v)) return "[Circular *1]";
  if (depth > 2) return Array.isArray(v) ? "[Array]" : "[Object]";
  seen.add(v);
  try {
    if (v instanceof Error) return `${v.name}: ${v.message}`;
    if (v instanceof Date) return isNaN(v.getTime()) ? "Invalid Date" : v.toISOString();
    if (v instanceof RegExp) return String(v);
    if (v instanceof Promise) return "Promise { <pending> }";
    if (Array.isArray(v)) {
      if (v.length === 0) return "[]";
      const items: string[] = [];
      let holes = 0;
      for (let i = 0; i < v.length; i++) {
        if (!(i in v)) { holes++; continue; }
        if (holes) { items.push(`<${holes} empty item${holes > 1 ? "s" : ""}>`); holes = 0; }
        items.push(inner(v[i]));
      }
      if (holes) items.push(`<${holes} empty item${holes > 1 ? "s" : ""}>`);
      return `[ ${items.join(", ")} ]`;
    }
    if (v instanceof Map) {
      if (v.size === 0) return "Map(0) {}";
      return `Map(${v.size}) { ${[...v].map(([k, x]) => `${inner(k)} => ${inner(x)}`).join(", ")} }`;
    }
    if (v instanceof Set) {
      if (v.size === 0) return "Set(0) {}";
      return `Set(${v.size}) { ${[...v].map(inner).join(", ")} }`;
    }
    const proto = Object.getPrototypeOf(v);
    const name = proto && proto !== Object.prototype && proto.constructor?.name ? `${proto.constructor.name} ` : proto === null ? "[Object: null prototype] " : "";
    const keys = Object.keys(v as object);
    if (keys.length === 0) return `${name}{}`;
    return `${name}{ ${keys.map((k) => `${fmtKey(k)}: ${inner((v as Record<string, unknown>)[k])}`).join(", ")} }`;
  } finally {
    seen.delete(v);
  }
}

export const formatArgs = (args: unknown[]) => args.map((a) => inspect(a)).join(" ");

// ─── execution ──────────────────────────────────────────────────────────────
export async function executeJs(
  code: string,
  opts: { jsx?: boolean; modules?: Record<string, unknown>; timeoutMs?: number; maxOutputChars?: number } = {},
): Promise<JsRunResult> {
  const out: string[] = [];
  const err: string[] = [];
  const max = opts.maxOutputChars ?? 8000;
  let size = 0;
  const push = (arr: string[], line: string) => {
    if (size > max) return;
    size += line.length + 1;
    arr.push(size > max ? "… (output truncated)" : line);
  };
  const consoleShim = {
    log: (...a: unknown[]) => push(out, formatArgs(a)),
    info: (...a: unknown[]) => push(out, formatArgs(a)),
    debug: (...a: unknown[]) => push(out, formatArgs(a)),
    warn: (...a: unknown[]) => push(err, formatArgs(a)),
    error: (...a: unknown[]) => push(err, formatArgs(a)),
  };

  // timers: real timers underneath, tracked so we know when the program is done
  const realSet = globalThis.setTimeout;
  const realClear = globalThis.clearTimeout;
  const pending = new Map<unknown, "t" | "i">();
  const setT = (fn: (...a: unknown[]) => void, ms?: number, ...a: unknown[]) => {
    const id = realSet(() => { pending.delete(id); fn(...a); }, ms);
    pending.set(id, "t");
    return id;
  };
  const clearT = (id: unknown) => { pending.delete(id); realClear(id as ReturnType<typeof setTimeout>); };
  const setI = (fn: (...a: unknown[]) => void, ms?: number, ...a: unknown[]) => {
    const id = globalThis.setInterval(() => fn(...a), ms);
    pending.set(id, "i");
    return id;
  };
  const clearI = (id: unknown) => { pending.delete(id); globalThis.clearInterval(id as ReturnType<typeof setInterval>); };

  const modules = opts.modules ?? {};
  const requireShim = (name: string) => {
    if (name in modules) return modules[name];
    throw new Error(`Cannot find module '${name}'`);
  };

  let compiled: string;
  try {
    compiled = compileJs(code, !!opts.jsx);
  } catch (e) {
    return { ok: false, stdout: "", stderr: `SyntaxError: ${(e as Error).message}`, available: true };
  }

  const deadline = Date.now() + (opts.timeoutMs ?? 2500);
  let ok = true;
  let timedOut = false;
  try {
    const module = { exports: {} as Record<string, unknown> };
    const fn = new Function(
      // `process` and `global` are shadowed so Node (verification) behaves like the browser worker (the game).
      "require", "module", "exports", "console", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "process", "global", "setImmediate",
      `return (async () => {\n${compiled}\n})();`,
    );
    await fn(requireShim, module, module.exports, consoleShim, setT, clearT, setI, clearI, undefined, undefined, undefined);
    // let pending timers and their promise chains settle
    while (pending.size > 0 && Date.now() < deadline) await new Promise((r) => realSet(r, 2));
    if (pending.size > 0) {
      timedOut = true;
      for (const [id, kind] of pending) (kind === "t" ? clearT : clearI)(id);
    }
    await new Promise((r) => realSet(r, 0));
  } catch (e) {
    ok = false;
    const x = e as Error;
    push(err, x && typeof x === "object" && "name" in x ? `${x.name}: ${x.message}` : `Uncaught ${inspect(e, 1)}`);
  }
  return { ok: ok && !timedOut, stdout: out.join("\n"), stderr: timedOut ? [...err, "Timed out: timers still pending"].join("\n") : err.join("\n"), available: true, timedOut };
}
