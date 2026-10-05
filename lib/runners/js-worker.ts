// Web Worker that runs a player's JS/TS/React snippet off the main thread, in the player's own
// browser (never on the server). The page terminates the worker on timeout (infinite loops).
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { executeJs } from "./js-core";

const modules = { react: React, "react-dom/server": ReactDOMServer };

self.onmessage = async (e: MessageEvent<{ code: string; jsx: boolean }>) => {
  const result = await executeJs(e.data.code, { jsx: e.data.jsx, modules, timeoutMs: 2500 });
  (self as unknown as Worker).postMessage(result);
};
