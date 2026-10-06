// Minimal, data-driven syntax highlighter. Add a grammar (and a lexer for non-Rust syntax) per code language.
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
  go: {
    keywords: ["package", "import", "func", "var", "const", "type", "struct", "interface", "map", "chan", "go", "defer", "select", "return", "if", "else", "for", "range", "switch", "case", "default", "break", "continue", "fallthrough", "goto", "nil", "true", "false", "iota"],
    types: ["int", "int8", "int16", "int32", "int64", "uint", "uint8", "uint16", "uint32", "uint64", "uintptr", "float32", "float64", "complex64", "complex128", "byte", "rune", "string", "bool", "error", "any", "comparable"],
  },
  python: {
    keywords: ["def", "class", "return", "if", "elif", "else", "for", "while", "in", "not", "and", "or", "is", "import", "from", "as", "with", "try", "except", "finally", "raise", "yield", "lambda", "pass", "break", "continue", "global", "nonlocal", "async", "await", "del", "assert", "match", "case", "None", "True", "False", "self"],
    types: ["int", "float", "str", "bool", "list", "dict", "set", "tuple", "bytes", "object", "type", "range", "print", "len"],
  },
  cpp: {
    keywords: ["auto", "const", "constexpr", "consteval", "static", "inline", "virtual", "override", "final", "class", "struct", "enum", "union", "namespace", "using", "template", "typename", "public", "private", "protected", "return", "if", "else", "for", "while", "do", "switch", "case", "default", "break", "continue", "new", "delete", "this", "nullptr", "true", "false", "try", "catch", "throw", "noexcept", "operator", "friend", "explicit", "mutable", "decltype", "concept", "requires", "co_await", "co_return", "sizeof", "static_cast", "dynamic_cast", "reinterpret_cast", "const_cast"],
    types: ["int", "long", "short", "char", "bool", "float", "double", "void", "unsigned", "signed", "size_t", "std", "string", "vector", "map", "unordered_map", "set", "unique_ptr", "shared_ptr", "weak_ptr", "optional", "variant", "string_view", "array", "pair", "tuple", "cout", "endl"],
  },
  csharp: {
    keywords: ["using", "namespace", "class", "struct", "record", "interface", "enum", "public", "private", "protected", "internal", "static", "readonly", "const", "sealed", "abstract", "virtual", "override", "new", "return", "if", "else", "for", "foreach", "in", "while", "do", "switch", "case", "default", "break", "continue", "try", "catch", "finally", "throw", "async", "await", "var", "this", "base", "null", "true", "false", "is", "as", "out", "ref", "params", "get", "set", "init", "with", "where", "yield", "lock", "event", "delegate", "operator", "typeof", "nameof", "when", "and", "or", "not", "required"],
    types: ["int", "long", "short", "byte", "char", "bool", "float", "double", "decimal", "string", "object", "void", "dynamic", "uint", "ulong"],
  },
  ruby: {
    keywords: ["def", "end", "class", "module", "if", "elsif", "else", "unless", "while", "until", "for", "in", "do", "return", "yield", "begin", "rescue", "ensure", "raise", "case", "when", "then", "self", "super", "nil", "true", "false", "and", "or", "not", "lambda", "proc", "attr_accessor", "attr_reader", "attr_writer", "include", "extend", "require", "private", "protected", "public", "next", "break", "redo", "retry", "alias", "defined?", "loop"],
    types: ["Integer", "Float", "String", "Symbol", "Array", "Hash", "Proc", "Struct", "Comparable", "Enumerable", "Kernel", "Object", "NilClass", "puts", "p", "print"],
  },
  zig: {
    keywords: ["const", "var", "fn", "pub", "return", "if", "else", "while", "for", "switch", "break", "continue", "defer", "errdefer", "try", "catch", "orelse", "unreachable", "struct", "enum", "union", "error", "comptime", "inline", "test", "and", "or", "null", "undefined", "true", "false", "async", "await", "export", "extern", "packed", "threadlocal", "noreturn", "anytype"],
    types: ["u8", "u16", "u32", "u64", "u128", "usize", "i8", "i16", "i32", "i64", "i128", "isize", "f16", "f32", "f64", "bool", "void", "type", "anyerror", "comptime_int", "comptime_float"],
  },
  haskell: {
    keywords: ["module", "import", "qualified", "as", "hiding", "where", "let", "in", "do", "case", "of", "if", "then", "else", "data", "newtype", "type", "class", "instance", "deriving", "forall", "infixl", "infixr", "infix", "otherwise"],
    types: ["Int", "Integer", "Double", "Float", "Bool", "Char", "String", "Maybe", "Either", "IO", "Just", "Nothing", "Left", "Right", "True", "False"],
  },
  rust: {
    keywords: ["fn", "let", "mut", "if", "else", "match", "loop", "while", "for", "in", "return", "struct", "enum", "impl", "trait", "pub", "use", "mod", "move", "ref", "as", "where", "self", "Self", "true", "false", "const", "static", "dyn", "async", "await"],
    types: ["i8", "i16", "i32", "i64", "i128", "isize", "u8", "u16", "u32", "u64", "u128", "usize", "f32", "f64", "bool", "char", "str", "String", "Vec", "Option", "Result", "Box", "Rc", "Arc"],
  },
};

const RE = /(\/\/.*$)|("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])'(?!\w))|('[a-z_]\w*)|(\b\d+(?:\.\d+)?\b)|(\b[a-z_]\w*!)|(\b[A-Za-z_]\w*\b)|([^\sA-Za-z0-9_]+)|(\s+)/gm;

// C-family/Python tokenizer: groups are (comment)(string)(macro line/decorator)(number)(identifier)(punct)(space).
const TAIL = String.raw`(\b\d[\d_']*(?:\.\d+)?(?:[eE][+-]?\d+)?[a-zA-Z]*\b)|(\b[A-Za-z_$][\w$]*\b)|([^\sA-Za-z0-9_$"'` + "`" + String.raw`]+)|(\s+)`;
const NONE = "(?!)()"; // no macro group for this language
const lexer = (comment: string, string: string, macro: string) => new RegExp(`(${comment})|(${string})|${macro === NONE ? NONE : `(${macro})`}|${TAIL}`, "gm");
const BT = "`";
const LEXERS: Record<string, RegExp> = {
  ts: lexer(String.raw`\/\/.*$`, String.raw`"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|` + BT + String.raw`(?:\\.|[^` + BT + String.raw`\\])*` + BT, NONE),
  go: lexer(String.raw`\/\/.*$`, String.raw`"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|` + BT + "[^" + BT + "]*" + BT, NONE),
  cpp: lexer(String.raw`\/\/.*$`, String.raw`(?:u8|[uUL])?"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'`, String.raw`^[ \t]*#[ \t]*\w+.*$`),
  csharp: lexer(String.raw`\/\/.*$`, String.raw`\$?@?"(?:\\.|""|[^"\\])*"|'(?:\\.|[^'\\])*'`, String.raw`^[ \t]*#[ \t]*\w+.*$`),
  python: lexer("#.*$", String.raw`(?:[rRbBfFuU]{1,2})?(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')`, String.raw`^[ \t]*@[\w.]+`),
};
LEXERS.tsx = LEXERS.ts;
// Ruby: # comments; :symbols, @ivars and $globals highlighted as macros (no ?a char literals).
LEXERS.ruby = lexer("#(?!\\{).*$", String.raw`"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'`, String.raw`(?<![\w:]):[A-Za-z_]\w*[?!]?|@@?[A-Za-z_]\w*|\$[A-Za-z_]\w*`);
LEXERS.zig = lexer(String.raw`\/\/.*$`, String.raw`\\\\.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'`, String.raw`@[A-Za-z_]\w*`);
// Haskell: -- and {- -} comments; a quote after an identifier is a prime (x'), not a char literal.
LEXERS.haskell = lexer(String.raw`--.*$|\{-[\s\S]*?-\}`, String.raw`"(?:\\.|[^"\\])*"|(?<![\w'])'(?:\\.|[^'\\])'`, String.raw`^[ \t]*\{-#[\s\S]*?#-\}`);

function tokenizeC(code: string, g: Grammar, re: RegExp): { kind: TokenKind; text: string }[] {
  const out: { kind: TokenKind; text: string }[] = [];
  let m: RegExpExecArray | null;
  let last = 0;
  re.lastIndex = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push({ kind: "plain", text: code.slice(last, m.index) });
    last = re.lastIndex;
    const [text, com, str, mac, num, ident, punct] = m;
    if (com) out.push({ kind: "com", text });
    else if (str) out.push({ kind: "str", text });
    else if (mac) out.push({ kind: "mac", text });
    else if (num) out.push({ kind: "num", text });
    else if (ident) {
      if (g.keywords.includes(text)) out.push({ kind: "kw", text });
      else if (g.types.includes(text) || /^[A-Z]/.test(text)) out.push({ kind: "type", text });
      else if (code[re.lastIndex] === "(") out.push({ kind: "fn", text });
      else out.push({ kind: "plain", text });
    } else if (punct) out.push({ kind: "punct", text });
    else out.push({ kind: "plain", text });
  }
  if (last < code.length) out.push({ kind: "plain", text: code.slice(last) });
  return out;
}

export function tokenize(code: string, lang = "rust"): { kind: TokenKind; text: string }[] {
  if (LEXERS[lang] && GRAMMARS[lang]) return tokenizeC(code, GRAMMARS[lang], LEXERS[lang]);
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
