// Turns a short lesson snippet into a complete program for the language's runner.
// Players only see the snippet; full programs (run beats, `check.program`) are never wrapped.
import type { CodeLang } from "../lib/content/types.ts";

const GO_PKGS = ["fmt", "strings", "strconv", "errors", "sort", "slices", "maps", "sync", "time", "context", "math", "os", "unicode", "bytes", "atomic", "cmp", "runtime", "utf8", "fs", "io"];
const GO_PATH: Record<string, string> = { atomic: "sync/atomic", utf8: "unicode/utf8", fs: "io/fs" };

function wrapGo(body: string) {
  const hasPackage = /^\s*package\s+main\b/m.test(body);
  if (hasPackage) return body;
  const used = GO_PKGS.filter((p) => new RegExp(`\\b${p}\\.`).test(body)).map((p) => `"${GO_PATH[p] ?? p}"`);
  const imports = /^\s*import\b/m.test(body) || !used.length ? "" : `import (\n\t${used.join("\n\t")}\n)\n\n`;
  const main = /\bfunc\s+main\s*\(\s*\)/.test(body) ? body : `func main() {\n${body.split("\n").map((l) => "\t" + l).join("\n")}\n}\n`;
  return `package main\n\n${imports}${main}`;
}

const CPP_HEADERS = ["iostream", "string", "string_view", "vector", "array", "map", "unordered_map", "set", "memory", "utility", "algorithm", "numeric", "optional", "variant", "functional", "stdexcept", "ranges", "type_traits", "cstdint"];

function wrapCpp(body: string) {
  const includes = /^\s*#include\b/m.test(body) ? "" : CPP_HEADERS.map((h) => `#include <${h}>`).join("\n") + "\n\n";
  const main = /\bint\s+main\s*\(/.test(body) ? body : `int main() {\n${body.split("\n").map((l) => "    " + l).join("\n")}\n}\n`;
  return includes + main;
}

const CS_USINGS = ["System", "System.Collections.Generic", "System.Linq", "System.Text", "System.Threading.Tasks"];

function wrapCs(body: string) {
  const missing = CS_USINGS.filter((u) => !new RegExp(`^\\s*using\\s+${u.replace(/\./g, "\\.")}\\s*;`, "m").test(body));
  return missing.map((u) => `using ${u};`).join("\n") + (missing.length ? "\n" : "") + body;
}

export function wrapSnippet(lang: CodeLang, body: string): string {
  switch (lang) {
    case "rust":
      if (/\bfn\s+main\s*\(/.test(body)) return `#![allow(unused)]\n${body}`;
      return `#![allow(unused)]\nfn main() {\n${body.split("\n").map((l) => "    " + l).join("\n")}\n}\n`;
    case "go":
      return wrapGo(body);
    case "cpp":
      return wrapCpp(body);
    case "csharp":
      return wrapCs(body);
    default:
      return body; // TS/TSX run as module bodies; Python runs as a script
  }
}
