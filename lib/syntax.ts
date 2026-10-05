// Minimal, data-driven syntax highlighter. Add a grammar per language slug.
export type TokenKind = "kw" | "type" | "str" | "num" | "com" | "mac" | "fn" | "life" | "punct" | "plain";

interface Grammar {
  keywords: string[];
  types: string[];
}

const TS: Grammar = {
  keywords: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "do", "of", "in", "new", "class", "extends", "implements", "interface", "type", "enum", "import", "export", "from", "default", "as", "async", "await", "yield", "try", "catch", "finally", "throw", "switch", "case", "break", "continue", "typeof", "instanceof", "keyof", "infer", "readonly", "public", "private", "protected", "static", "this", "super", "null", "undefined", "true", "false", "void", "satisfies", "declare", "abstract", "delete", "get", "set"],
  types: ["string", "number", "boolean", "bigint", "symbol", "any", "unknown", "never", "object", "Array", "Promise", "Record", "Partial", "Pick", "Omit", "Readonly", "ReturnType", "Map", "Set", "Date", "Error"],
};

const GRAMMARS: Record<string, Grammar> = {
  ts: TS,
  tsx: TS,
  rust: {
    keywords: ["fn", "let", "mut", "if", "else", "match", "loop", "while", "for", "in", "return", "struct", "enum", "impl", "trait", "pub", "use", "mod", "move", "ref", "as", "where", "self", "Self", "true", "false", "const", "static", "dyn", "async", "await"],
    types: ["i8", "i16", "i32", "i64", "i128", "isize", "u8", "u16", "u32", "u64", "u128", "usize", "f32", "f64", "bool", "char", "str", "String", "Vec", "Option", "Result", "Box", "Rc", "Arc"],
  },
};

const RE = /(\/\/.*$)|("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])'(?!\w))|('[a-z_]\w*)|(\b\d+(?:\.\d+)?\b)|(\b[a-z_]\w*!)|(\b[A-Za-z_]\w*\b)|([^\sA-Za-z0-9_]+)|(\s+)/gm;

const RE_TS = /(\/\/.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d[\d_]*(?:\.\d+)?n?\b)|(\b[A-Za-z_$][\w$]*\b)|([^\sA-Za-z0-9_$"'`]+)|(\s+)/gm;

function tokenizeTs(code: string, g: Grammar): { kind: TokenKind; text: string }[] {
  const out: { kind: TokenKind; text: string }[] = [];
  let m: RegExpExecArray | null;
  let last = 0;
  RE_TS.lastIndex = 0;
  while ((m = RE_TS.exec(code))) {
    if (m.index > last) out.push({ kind: "plain", text: code.slice(last, m.index) });
    last = RE_TS.lastIndex;
    const [text, com, str, num, ident, punct] = m;
    if (com) out.push({ kind: "com", text });
    else if (str) out.push({ kind: "str", text });
    else if (num) out.push({ kind: "num", text });
    else if (ident) {
      if (g.keywords.includes(text)) out.push({ kind: "kw", text });
      else if (g.types.includes(text) || /^[A-Z]/.test(text)) out.push({ kind: "type", text });
      else if (code[RE_TS.lastIndex] === "(") out.push({ kind: "fn", text });
      else out.push({ kind: "plain", text });
    } else if (punct) out.push({ kind: "punct", text });
    else out.push({ kind: "plain", text });
  }
  if (last < code.length) out.push({ kind: "plain", text: code.slice(last) });
  return out;
}

export function tokenize(code: string, lang = "rust"): { kind: TokenKind; text: string }[] {
  if (lang === "ts" || lang === "tsx") return tokenizeTs(code, GRAMMARS[lang]);
  const g = GRAMMARS[lang] ?? GRAMMARS.rust;
  const out: { kind: TokenKind; text: string }[] = [];
  let m: RegExpExecArray | null;
  let last = 0;
  RE.lastIndex = 0;
  while ((m = RE.exec(code))) {
    if (m.index > last) out.push({ kind: "plain", text: code.slice(last, m.index) });
    last = RE.lastIndex;
    const [text, com, str, chr, life, num, mac, ident, punct] = m;
    if (com) out.push({ kind: "com", text });
    else if (str || chr) out.push({ kind: "str", text });
    else if (life) out.push({ kind: "life", text });
    else if (num) out.push({ kind: "num", text });
    else if (mac) out.push({ kind: "mac", text });
    else if (ident) {
      if (g.keywords.includes(text)) out.push({ kind: "kw", text });
      else if (g.types.includes(text) || /^[A-Z]/.test(text)) out.push({ kind: "type", text });
      else if (code[RE.lastIndex] === "(") out.push({ kind: "fn", text });
      else out.push({ kind: "plain", text });
    } else if (punct) out.push({ kind: "punct", text });
    else out.push({ kind: "plain", text });
  }
  if (last < code.length) out.push({ kind: "plain", text: code.slice(last) });
  return out;
}
