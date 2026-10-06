// Shared by the Python Web Worker (player's browser) and the content validator (Node).
// Runs a snippet as "main.py" in Pyodide (CPython compiled to WebAssembly) and captures output.
import type { RunResult } from "./types.ts";

/** Keep in sync with the exact `pyodide` version in package.json (tests/runners.test.ts checks it). */
export const PYODIDE_VERSION = "314.0.7";

/** Minimal slice of the Pyodide API the runner needs. */
export interface PyodideLike {
  runPython(code: string): unknown;
  setStdout(opts: { write: (buf: Uint8Array) => number }): void;
  setStderr(opts: { write: (buf: Uint8Array) => number }): void;
  globals: { get(name: string): (...args: unknown[]) => unknown };
}

// Fresh globals per run, source registered in linecache so tracebacks show the player's lines,
// and the harness's own frame dropped from the traceback.
//
// asyncio: Pyodide's browser event loop can only block (asyncio.run) where WebAssembly stack
// switching exists, which not every browser or Node version has. Snippets do no I/O, so a plain
// CPython loop whose "selector" just sleeps until the next timer behaves the same everywhere.
const HARNESS = `
import sys as _sys, time as _time, traceback as _tb, linecache as _lc, asyncio as _aio
class _BwqSleepSelector:
    def select(self, timeout=None):
        if timeout:
            _time.sleep(timeout)
        return []
    def close(self):
        pass
class _BwqLoop(_aio.BaseEventLoop):
    def __init__(self):
        super().__init__()
        self._selector = _BwqSleepSelector()
    def _process_events(self, event_list):
        pass
    def _write_to_self(self):
        pass
    def run_until_complete(self, future):
        outer = _aio.events._get_running_loop()  # Pyodide's own loop counts as running
        _aio.events._set_running_loop(None)
        try:
            return super().run_until_complete(future)
        finally:
            _aio.events._set_running_loop(outer)
def _bwq_asyncio_run(main, *, debug=None, loop_factory=None):
    loop = _BwqLoop()
    try:
        return loop.run_until_complete(main)
    finally:
        loop.close()
def _bwq_run(src):
    _aio.run = _bwq_asyncio_run
    _aio.new_event_loop = _BwqLoop
    try:
        return _bwq_exec(src)
    finally:
        # print(..., end="") leaves a partial line buffered: flush it into this run's output.
        _sys.stdout.flush()
        _sys.stderr.flush()
def _bwq_exec(src):
    g = {"__name__": "__main__"}
    _lc.cache["main.py"] = (len(src), None, src.splitlines(True), "main.py")
    try:
        exec(compile(src, "main.py", "exec"), g)
    except SystemExit as e:
        return None if e.code in (None, 0) else "SystemExit: " + str(e.code)
    except BaseException as e:
        tb = e.__traceback__.tb_next if e.__traceback__ is not None else None
        return ("S" if isinstance(e, SyntaxError) else "R") + "".join(_tb.format_exception(type(e), e, tb))
    return None
`;

const installed = new WeakSet<object>();

export async function runPython(py: PyodideLike, code: string, maxOutputChars = 20_000): Promise<RunResult> {
  if (!installed.has(py)) {
    py.runPython(HARNESS);
    installed.add(py);
  }
  let stdout = "";
  let stderr = "";
  // Raw byte streams (not line-batched), so output without a final newline is not held back.
  const out = new TextDecoder();
  const err = new TextDecoder();
  py.setStdout({ write: (buf) => ((stdout = stdout.length < maxOutputChars ? stdout + out.decode(buf, { stream: true }) : stdout), buf.length) });
  py.setStderr({ write: (buf) => ((stderr = stderr.length < maxOutputChars ? stderr + err.decode(buf, { stream: true }) : stderr), buf.length) });
  const failure = py.globals.get("_bwq_run")(code) as string | null | undefined;
  if (!failure) return { ok: true, stdout, stderr: stderr.trim(), available: true };
  const syntax = failure.startsWith("S");
  return { ok: false, stdout, stderr: (stderr + failure.replace(/^[SR]/, "")).trim(), available: true, phase: syntax ? "compile" : "runtime" };
}
