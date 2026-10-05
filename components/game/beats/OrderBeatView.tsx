"use client";
import { useMemo, useRef, useState } from "react";
import type { OrderBeat } from "@/lib/content/types";
import { fx } from "@/lib/fx";
import { sfx } from "@/lib/sfx";
import { Highlight } from "../CodeBlock";
import { shuffle, type BeatCtx } from "./types";

export function OrderBeatView({ beat, ctx, seed }: { beat: OrderBeat; ctx: BeatCtx; seed: number }) {
  const pool = useMemo(() => {
    let s = shuffle(beat.lines, seed);
    if (s.every((x, i) => x.i === i)) s = [...s.slice(1), s[0]];
    return s;
  }, [beat, seed]);
  const [placed, setPlaced] = useState<number[]>([]);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const rows = useRef<(HTMLDivElement | null)[]>([]);

  const tap = (orig: number, pos: number) => {
    if (ctx.busy || placed.includes(orig)) return;
    const expected = placed.length;
    if (beat.lines[orig] === beat.lines[expected]) {
      const next = [...placed, orig];
      setPlaced(next);
      sfx.correct(next.length);
      requestAnimationFrame(() => {
        fx.burst(rows.current[expected], { count: 6, spread: 40 });
        fx.pop(rows.current[expected], 1.08);
      });
      if (next.length === beat.lines.length) ctx.solved(rows.current[expected]);
      else ctx.tick(null);
    } else {
      fx.shake(btns.current[pos], 8);
      ctx.wrong(btns.current[pos]);
    }
  };

  return (
    <div className="beat-split">
      <p className="pixel beat-prompt" style={{ fontSize: 12, margin: "4px 4px 12px" }}>▶ {beat.prompt}</p>
      <div className="codeblock box dark">
        {beat.lines.map((_, i) => (
          <div key={i} ref={(el) => { rows.current[i] = el; }} style={{ minHeight: "1.15em", opacity: i < placed.length ? 1 : 0.35 }}>
            {i < placed.length ? <Highlight code={beat.lines[placed[i]]} lang={ctx.lang} /> : <span style={{ color: "var(--p1)" }}>{i === placed.length ? "▸ ..." : "  ..."}</span>}
          </div>
        ))}
      </div>
      <div className="beat-side" style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 14 }}>
        {pool.map(({ v, i }, pos) =>
          placed.includes(i) ? null : (
            <button
              key={i}
              ref={(el) => { btns.current[pos] = el; }}
              className="btn"
              onMouseEnter={() => sfx.hover()}
              onClick={() => tap(i, pos)}
              style={{ fontFamily: "var(--font-code)", fontSize: 21, textAlign: "left", whiteSpace: "pre", overflowX: "auto", padding: "6px 12px" }}
            >
              {v}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
