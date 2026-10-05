"use client";
import { useMemo, useRef, useState } from "react";
import type { PickBeat, PredictBeat } from "@/lib/content/types";
import { fx, wait } from "@/lib/fx";
import { sfx } from "@/lib/sfx";
import { CodeBlock } from "../CodeBlock";
import { shuffle, type BeatCtx } from "./types";
import { useI18n } from "@/components/ui/I18n";

/** Handles both "pick" (fill the slot) and "predict" (choose the outcome). */
export function ChoiceBeatView({ beat, ctx, seed }: { beat: PickBeat | PredictBeat; ctx: BeatCtx; seed: number }) {
  const { tx } = useI18n();
  const options = useMemo(() => shuffle(beat.options, seed + beat.options.length), [beat, seed]);
  const [disabled, setDisabled] = useState<number[]>([]);
  const [slot, setSlot] = useState<{ text: string; state: "empty" | "filled" | "ok" | "bad" }>({ text: "", state: "empty" });
  const [okIdx, setOkIdx] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const slotRef = useRef<HTMLSpanElement>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);

  const choose = async (orig: number, pos: number) => {
    if (busy || ctx.busy || okIdx != null || disabled.includes(orig)) return;
    setBusy(true);
    sfx.select();
    const btn = btns.current[pos];
    const correct = orig === beat.answer;
    if (beat.kind === "pick") {
      await fx.fly(btn, slotRef.current, tx(beat.options[orig]));
      setSlot({ text: tx(beat.options[orig]), state: correct ? "ok" : "bad" });
      await wait(20);
      fx.pop(slotRef.current, 1.4);
    }
    if (correct) {
      setOkIdx(orig);
      if (beat.kind === "predict" && beat.output) ctx.print(beat.output);
      ctx.solved(beat.kind === "pick" ? slotRef.current : btn);
    } else {
      setDisabled((d) => [...d, orig]);
      fx.shake(beat.kind === "pick" ? slotRef.current : btn, 10);
      ctx.wrong(btn);
      if (beat.kind === "pick") {
        await wait(650);
        setSlot({ text: "", state: "empty" });
      }
    }
    setBusy(false);
  };

  const slotEl = (
    <span ref={slotRef} className={`slot ${slot.state}`}>
      {slot.text || "???"}
    </span>
  );

  return (
    <div className="beat-split">
      <p className="pixel beat-prompt" style={{ fontSize: 12, margin: "4px 4px 12px" }}>▶ {tx(beat.prompt)}</p>
      <CodeBlock code={beat.code} lang={ctx.lang} slot={beat.kind === "pick" ? slotEl : undefined} />
      <div className="beat-side" style={{ display: "grid", gridTemplateColumns: `repeat(${options.length > 3 || options.some((o) => tx(o.v).length > 18) ? 2 : options.length}, 1fr)`, gap: 6, marginTop: 14 }}>
        {options.map(({ v, i }, pos) => {
          const isOk = okIdx === i;
          const isBad = disabled.includes(i);
          return (
            <button
              key={i}
              ref={(el) => { btns.current[pos] = el; }}
              className={`btn ${isOk ? "good" : isBad ? "danger" : ""}`}
              style={{ fontFamily: beat.kind === "pick" ? "var(--font-code)" : "var(--font-body)", fontSize: beat.kind === "pick" ? 24 : 17, padding: "10px 12px", textTransform: "none" }}
              onMouseEnter={() => sfx.hover()}
              disabled={isBad}
              onClick={() => choose(i, pos)}
            >
              {isBad ? "✗ " : isOk ? "✓ " : ""}{tx(v)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
