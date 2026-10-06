"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CodeTaskBeat, DebugBeat } from "@/lib/content/types";
import { fx } from "@/lib/fx";
import { sfx } from "@/lib/sfx";
import { useI18n } from "@/components/ui/I18n";
import type { TaskRef } from "@/lib/coding/client";
import { Highlight } from "../CodeBlock";
import { CodeTaskView } from "./CodeTaskView";
import type { BeatCtx } from "./types";

/**
 * Debugging task, in two steps: tap the buggy line (as in a code review), then fix the code. The fix
 * is judged by the tests like a coding task, so any correct fix passes. Missing the line halves the
 * points (some bugs accept more than one line: `alsoLines`); the right line is then shown and the fix
 * can still be made.
 */
export function DebugView({ beat, ctx, task, exam }: { beat: DebugBeat; ctx: BeatCtx; task: TaskRef | null; exam: boolean }) {
  const { t, tx } = useI18n();
  const [picked, setPicked] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const lines = beat.code.split("\n");
  const fair = (n: number) => n === beat.bugLine || !!beat.alsoLines?.includes(n);
  const found = picked != null && fair(picked);

  useEffect(() => { setPicked(null); }, [beat]);

  // The fix step is an ordinary coding task that starts from the buggy code.
  const fix = useMemo<CodeTaskBeat>(
    () => ({ kind: "code", prompt: beat.prompt, brief: beat.brief, starter: beat.code, tests: beat.tests, mode: beat.mode, hiddenCount: beat.hiddenCount, explain: beat.explain }),
    [beat],
  );

  const pick = (n: number, el: HTMLElement) => {
    if (picked != null || ctx.busy) return;
    setPicked(n);
    if (fair(n)) { sfx.correct(0); fx.burst(el, { count: 10 }); }
    else { sfx.wrong(); fx.shake(box.current, 6); ctx.discount?.(0.5); }
  };

  if (picked != null) {
    return (
      <div>
        <div className="pixel" style={{ fontSize: 10, color: found ? "var(--good)" : "var(--gold)", margin: "0 4px 8px" }}>
          {found ? t("debug.foundIt") : t("debug.missed", { line: beat.bugLine })}
        </div>
        <CodeTaskView beat={fix} ctx={ctx} task={task} exam={exam} />
      </div>
    );
  }

  return (
    <div className="beat-split">
      <div>
        <p className="pixel beat-prompt" style={{ fontSize: 12, margin: "4px 4px 8px" }}>▶ {tx(beat.prompt)}</p>
        <div className="box dark" style={{ padding: 12 }}>
          <p style={{ fontSize: 17, lineHeight: 1.3, margin: 0, whiteSpace: "pre-line" }}>{tx(beat.brief)}</p>
        </div>
        <div className="pixel blink-soft" style={{ fontSize: 10, color: "var(--gold)", margin: "12px 4px 0" }}>{t("debug.find")}</div>
      </div>
      <div className="beat-side">
        <div ref={box} className="codeblock" role="listbox" aria-label={t("debug.find")} style={{ display: "flex", flexDirection: "column", padding: 6 }}>
          {lines.map((l, i) => (
            <button
              key={i}
              role="option"
              aria-selected={false}
              aria-label={t("debug.line", { n: i + 1 })}
              onClick={(e) => pick(i + 1, e.currentTarget)}
              onMouseEnter={() => sfx.hover()}
              className="debug-line"
              style={{ display: "flex", textAlign: "left", background: "transparent", border: 0, padding: "1px 4px", font: "inherit", color: "inherit", cursor: "pointer" }}
            >
              <span style={{ color: "var(--p2)", width: "2.5ch", flex: "none", textAlign: "right", marginRight: "1ch" }}>{i + 1}</span>
              <span style={{ whiteSpace: "pre" }}><Highlight code={l || " "} lang={ctx.lang} /></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
