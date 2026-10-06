// Web Worker that runs a player's JS/TS/React snippet off the main thread, in the player's own
// browser (never on the server). The page terminates the worker on timeout (infinite loops).
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { executeJs } from "./js-core";

const usesThree = (code: string) => /\bfrom\s*["']three["']|\brequire\(\s*["']three["']\s*\)/.test(code);

self.onmessage = async (e: MessageEvent<{ code: string; jsx: boolean }>) => {
  const modules: Record<string, unknown> = { react: React, "react-dom/server": ReactDOMServer };
  // three.js is big, so it is only loaded for snippets that import it (math & scene graph; no GPU here).
  if (usesThree(e.data.code)) modules.three = await import("three");
  const result = await executeJs(e.data.code, { jsx: e.data.jsx, modules, timeoutMs: 2500 });
  (self as unknown as Worker).postMessage(result);
};
