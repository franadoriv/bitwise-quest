// Minimal, data-driven syntax highlighter. Add a grammar per language slug.
export type TokenKind = "kw" | "type" | "str" | "num" | "com" | "mac" | "fn" | "life" | "punct" | "plain";

interface Grammar {
  keywords: string[];
  types: string[];
}

const GRAMMARS: Record<string, Grammar> = {
  rust: {
    keywords: ["fn", "let", "mut", "if", "else", "match", "loop", "while", "for", "in", "return", "struct", "enum", "impl", "trait", "pub", "use", "mod", "move", "ref", "as", "where", "self", "Self", "true", "false", "const", "static", "dyn", "async", "await"],
    types: ["i8", "i16", "i32", "i64", "i128", "isize", "u8", "u16", "u32", "u64", "u128", "usize", "f32", "f64", "bool", "char", "str", "String", "Vec", "Option", "Result", "Box", "Rc", "Arc"],
  },
};

const RE = /(\/\/.*$)|("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])'(?!\w))|('[a-z_]\w*)|(\b\d+(?:\.\d+)?\b)|(\b[a-z_]\w*!)|(\b[A-Za-z_]\w*\b)|([^\sA-Za-z0-9_]+)|(\s+)/gm;

export function tokenize(code: string, lang = "rust"): { kind: TokenKind; text: string }[] {
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
