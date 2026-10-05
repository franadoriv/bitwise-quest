"use client";
import { useEffect, useRef, useState } from "react";
import type { TypeBeat } from "@/lib/content/types";
import { fx } from "@/lib/fx";
import { sfx } from "@/lib/sfx";
import { CodeBlock } from "../CodeBlock";
import type { BeatCtx } from "./types";

/** Type the token. Every correct character gives instant feedback. */
export function TypeBeatView({ beat, ctx }: { beat: TypeBeat; ctx: BeatCtx }) {
  const [value, setValue] = useState("");
  const [done, setDone] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const prefixOk = beat.answer.startsWith(value);

  useEffect(() => { input.current?.focus(); }, [beat]);

  const onChange = (v: string) => {
    if (done || ctx.busy) return;
    v = v.replace(/\s+/g, " ").trimStart();
    if (v.length > value.length) {
      if (beat.answer.startsWith(v)) {
        sfx.blip(v.length * 2);
        fx.burst(input.current, { count: 4, spread: 26, size: 4 });
      } else {
        sfx.key();
        fx.shake(input.current, 4);
      }
    }
    setValue(v);
    if (v === beat.answer) {
      setDone(true);
      ctx.solved(input.current);
    }
  };

  const check = () => {
    if (done || ctx.busy) return;
    if (value.trim() === beat.answer) { setDone(true); ctx.solved(input.current); return; }
    fx.shake(input.current, 10);
    ctx.wrong(input.current);
  };

  const width = `${Math.max(beat.answer.length, value.length) + 1}ch`;
  const slot = (
    <input
      ref={input}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") check(); }}
      spellCheck={false}
      autoCapitalize="off"
      autoComplete="off"
      aria-label="Escribe el código que falta"
      placeholder={"_".repeat(beat.answer.length)}
      className={`slot ${done ? "ok" : value && !prefixOk ? "bad" : ""}`}
      style={{ width, font: "inherit", border: 0, outline: "none", borderBottom: "3px solid var(--gold)" }}
    />
  );

  return (
    <div className="beat-split">
      <p className="pixel beat-prompt" style={{ fontSize: 12, margin: "4px 4px 12px" }}>▶ {beat.prompt}</p>
      <CodeBlock code={beat.code} lang={ctx.lang} slot={slot} />
      <div className="beat-side" style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn primary" onClick={check} disabled={done}>COMPROBAR ⏎</button>
        <span className="pixel" style={{ fontSize: 10, color: "var(--p2)" }}>
          {beat.answer.length} CARACTERES · {value.length}/{beat.answer.length}
        </span>
      </div>
    </div>
  );
}
