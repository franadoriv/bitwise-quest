// Copies the Python runtime (Pyodide) from node_modules into public/pyodide/<version>/ so the game
// serves it itself (no third-party CDN). Runs on postinstall, predev and prebuild; the output is
// gitignored. Only the files needed to boot CPython with its standard library are copied.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "pyodide");
if (!existsSync(join(src, "package.json"))) {
  console.warn("copy-pyodide: node_modules/pyodide is missing; Python lessons will use offline checks.");
  process.exit(0);
}
const { version } = JSON.parse(readFileSync(join(src, "package.json"), "utf8"));
const out = join(root, "public", "pyodide", version);
mkdirSync(out, { recursive: true });
const files = ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];
let copied = 0;
for (const f of files) {
  if (existsSync(join(out, f))) continue;
  copyFileSync(join(src, f), join(out, f));
  copied++;
}
if (copied) console.log(`copy-pyodide: ${copied} file(s) → public/pyodide/${version}/`);
