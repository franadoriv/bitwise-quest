// Batch type-checking of TypeScript/TSX snippets with the real TypeScript compiler (strict mode).
// Used by the content validator: one Program for all snippets, so verification stays fast.
import ts from "typescript";
import path from "node:path";

export interface Snippet { id: string; code: string; tsx: boolean }

const OPTIONS: ts.CompilerOptions = {
  strict: true,
  noEmit: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
  jsx: ts.JsxEmit.React,
  esModuleInterop: true,
  allowSyntheticDefaultImports: true,
  skipLibCheck: true,
  types: [],
  noUnusedLocals: false,
  noUnusedParameters: false,
};

/** Returns the diagnostics (formatted, first line only) for each snippet id; empty array = type-checks. */
export function typecheck(snippets: Snippet[]): Map<string, string[]> {
  const dir = path.join(process.cwd(), ".snippets");
  const files = new Map<string, Snippet>();
  for (const s of snippets) files.set(path.join(dir, `${s.id}.${s.tsx ? "tsx" : "ts"}`), s);
  const host = ts.createCompilerHost(OPTIONS);
  const getSourceFile = host.getSourceFile.bind(host);
  host.fileExists = (f) => files.has(f) || ts.sys.fileExists(f);
  host.readFile = (f) => (files.has(f) ? `${files.get(f)!.code}\nexport {};\n` : ts.sys.readFile(f));
  host.getSourceFile = (f, lang, onError, create) =>
    files.has(f) ? ts.createSourceFile(f, `${files.get(f)!.code}\nexport {};\n`, lang, true) : getSourceFile(f, lang, onError, create);
  const program = ts.createProgram([...files.keys()], OPTIONS, host);
  const result = new Map<string, string[]>(snippets.map((s) => [s.id, []]));
  for (const d of ts.getPreEmitDiagnostics(program)) {
    const s = d.file && files.get(d.file.fileName);
    if (!s) continue;
    const line = d.file && d.start != null ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 0;
    result.get(s.id)!.push(`TS${d.code} (line ${line}): ${ts.flattenDiagnosticMessageText(d.messageText, "\n").split("\n")[0]}`);
  }
  return result;
}
