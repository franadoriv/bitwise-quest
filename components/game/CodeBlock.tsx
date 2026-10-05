"use client";
import { Fragment } from "react";
import { tokenize } from "@/lib/syntax";

export function Highlight({ code, lang }: { code: string; lang: string }) {
  return (
    <>
      {tokenize(code, lang).map((t, i) => (
        <span key={i} className={`tk-${t.kind}`}>{t.text}</span>
      ))}
    </>
  );
}

/** Highlighted code; `___` is replaced by `slot` when provided. */
export function CodeBlock({ code, lang, slot, style }: { code: string; lang: string; slot?: React.ReactNode; style?: React.CSSProperties }) {
  const parts = code.split("___");
  return (
    <pre className="codeblock box dark" style={style}>
      {parts.map((p, i) => (
        <Fragment key={i}>
          <Highlight code={p} lang={lang} />
          {i < parts.length - 1 && slot}
        </Fragment>
      ))}
    </pre>
  );
}
