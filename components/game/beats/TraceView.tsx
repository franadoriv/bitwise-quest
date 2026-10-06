"use client";
import { useEffect, useRef, useState } from "react";
import type { TraceBeat } from "@/lib/content/types";
import { fx } from "@/lib/fx";
import { sfx } from "@/lib/sfx";
import { useI18n } from "@/components/ui/I18n";
import { judgeTrace } from "@/lib/coding/trace";
import { Highlight } from "../CodeBlock";
import type { BeatCtx } from "./types";

/**
 * Trace table: dry-run the code and fill the value of each column at each row, as on a written test.
 * Nothing runs; each cell is judged on its own. In exams one check is final; in lessons the player
 * can correct the red cells and check again (only the first miss costs).
 */
export function TraceView({ beat, ctx, exam }: { beat: TraceBeat; ctx: BeatCtx; exam: boolean }) {
  const { t, tx } = useI18n();
  const blank = () => beat.rows.map((r) => r.cells.map((v, ci) => (r.given?.includes(ci) ? v : "")));
  const [answers, setAnswers] = useState<string[][]>(blank);
  const [marks, setMarks] = useState<(boolean | null)[][] | null>(null);
  // The verdict of the last check (not recomputed while typing, so edits don't reveal answers).
  const [result, setResult] = useState<{ right: number; total: number; all: boolean } | null>(null);
  const [done, setDone] = useState(false);
  const table = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => { setAnswers(blank()); setMarks(null); setResult(null); setDone(false); first.current?.focus(); }, [beat]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (ri: number, ci: number, v: string) => {
    if (done) return;
    sfx.key();
    setAnswers((a) => a.map((row, r) => (r === ri ? row.map((c, k) => (k === ci ? v : c)) : row)));
    if (marks) setMarks((m) => m && m.map((row, r) => (r === ri ? row.map((c, k) => (k === ci ? null : c)) : row)));
  };

  const check = () => {
    if (done || ctx.busy) return;
    const r = judgeTrace(beat.rows, answers);
    setMarks(r.cells);
    setResult(r);
    if (r.all) {
      setDone(true);
      table.current?.querySelectorAll("input").forEach((el, i) => setTimeout(() => fx.burst(el, { count: 4, spread: 18, size: 4 }), 40 * i));
      setTimeout(() => ctx.solved(table.current), 200);
      return;
    }
    fx.shake(table.current, 8);
    if (exam) setDone(true);
    ctx.wrong(table.current);
  };

  const lines = beat.code.split("\n");

  return (
    <div className="beat-split">
      <div>
        <p className="pixel beat-prompt" style={{ fontSize: 12, margin: "4px 4px 8px" }}>▶ {tx(beat.prompt)}</p>
        <pre className="codeblock" style={{ margin: 0 }}>
          {lines.map((l, i) => (
            <div key={i} style={{ display: "flex" }}>
              <span style={{ color: "var(--p2)", width: "2.5ch", flex: "none", textAlign: "right", marginRight: "1ch", userSelect: "none" }}>{i + 1}</span>
              <span><Highlight code={l || " "} lang={ctx.lang} /></span>
            </div>
          ))}
        </pre>
      </div>
      <div className="beat-side">
        <div className="pixel" style={{ fontSize: 9, color: "var(--gold)", margin: "4px 0 6px" }}>{t("trace.title")}</div>
        <p style={{ fontSize: 16, lineHeight: 1.25, margin: "0 0 8px" }}>{beat.brief ? tx(beat.brief) : t("trace.rules")}</p>
        <div ref={table} className="box dark" style={{ padding: 8, overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th className="pixel" style={{ fontSize: 8, color: "var(--p3)", textAlign: "left", padding: 4 }}>{t("trace.when")}</th>
                {beat.columns.map((c) => <th key={c} className="code" style={{ fontSize: 17, color: "var(--gold)", textAlign: "left", padding: 4 }}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {beat.rows.map((r, ri) => (
                <tr key={ri} style={{ borderTop: "2px solid var(--p1)" }}>
                  <td className="code" style={{ fontSize: 16, padding: 4, color: "var(--p3)", whiteSpace: "nowrap" }}>{tx(r.label)}</td>
                  {r.cells.map((_, ci) => {
                    const given = r.given?.includes(ci);
                    const bad = marks?.[ri][ci] === false;
                    const good = marks?.[ri][ci] === true;
                    return (
                      <td key={ci} style={{ padding: 3 }}>
                        <input
                          ref={ri === 0 && ci === (r.given?.includes(0) ? 1 : 0) ? first : undefined}
                          value={answers[ri]?.[ci] ?? ""}
                          readOnly={given || done}
                          onChange={(e) => set(ri, ci, e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") check(); }}
                          spellCheck={false}
                          autoCapitalize="off"
                          autoComplete="off"
                          aria-label={t("trace.cell", { row: ri + 1, col: beat.columns[ci] })}
                          className="code"
                          style={{
                            width: "100%", minWidth: "6ch", font: "inherit", fontSize: 17, padding: "2px 6px", border: 0, outline: "none",
                            background: given ? "transparent" : "var(--p0)",
                            color: given ? "var(--p3)" : bad ? "#ffb4a8" : good ? "var(--good)" : "var(--white)",
                            boxShadow: given ? undefined : `0 0 0 2px ${bad ? "var(--red)" : good ? "var(--good)" : "var(--p2)"}`,
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn primary" onClick={check} disabled={done}>{t("trace.check")}</button>
          {result && (
            <span className="pixel" style={{ fontSize: 10, color: result.all ? "var(--good)" : "var(--red)" }}>
              {result.all ? t("trace.allRight") : t("trace.right", { n: result.right, total: result.total })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
