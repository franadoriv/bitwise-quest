"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { CodeTaskBeat, CodeLang } from "@/lib/content/types";
import { fx } from "@/lib/fx";
import { sfx } from "@/lib/sfx";
import { Sprite } from "@/components/pixel/Sprite";
import { useI18n } from "@/components/ui/I18n";
import { runTask, type TaskRef, type TaskRun } from "@/lib/coding/client";
import { warmPython } from "@/lib/runners/browser";
import { Highlight } from "../CodeBlock";
import type { BeatCtx } from "./types";

/**
 * A coding task: implement it from the brief; the engine runs visible and hidden tests on the real
 * toolchain, so any implementation that produces the right results passes.
 * - "ide": run the tests as often as you like; passing all of them solves the task.
 * - "paper" (exams): plain editor, no paste, one submission judged by the tests.
 * Failing runs never cost a heart in lessons; in exams a failed paper submission (or giving up) is a miss.
 */
export function CodeTaskView({ beat, ctx, task, exam }: { beat: CodeTaskBeat; ctx: BeatCtx; task: TaskRef | null; exam: boolean }) {
  const { t, tx } = useI18n();
  const paper = exam && beat.mode === "paper";
  const [code, setCode] = useState(beat.starter);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TaskRun | null>(null);
  const [submitted, setSubmitted] = useState(false);
  // Paper tests forgive one slip: after a compile error the player gets one chance to proofread.
  const [proofread, setProofread] = useState<"unused" | "active" | "used">("unused");
  const pre = useRef<HTMLPreElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const visible = beat.tests.filter((x) => !x.hidden);
  const total = visible.length + (beat.hiddenCount ?? beat.tests.filter((x) => x.hidden).length);

  useEffect(() => { setCode(beat.starter); setResult(null); setSubmitted(false); setProofread("unused"); done.current = false; }, [beat]);
  useEffect(() => { if (ctx.runner === "py-browser") warmPython(); }, [ctx.runner]);

  const run = async () => {
    if (running || ctx.busy || done.current || (paper && submitted)) return;
    setRunning(true);
    setResult(null);
    sfx.select();
    ctx.stage?.heroSay(t("run.compilingSay"));
    const tween = gsap.fromTo(bar.current, { width: "0%" }, { width: "90%", duration: 5, ease: "power2.out" });
    const beep = setInterval(() => sfx.blip(Math.floor(Math.random() * 8)), 260);
    const r = await runTask({ beat, code, pack: ctx.pack, runner: ctx.runner, lang: ctx.lang as CodeLang, task });
    clearInterval(beep);
    tween.kill();
    gsap.to(bar.current, { width: "100%", duration: 0.15 });
    setRunning(false);
    setResult(r);
    const canProofread = paper && r.available && !r.busy && r.compileError && proofread === "unused";
    if (paper && r.available && !r.busy) setSubmitted(!canProofread);
    if (canProofread) setProofread("active");
    else if (proofread === "active") setProofread("used");
    requestAnimationFrame(() => {
      if (r.busy || !r.available) return;
      const all = r.passed === total && total > 0;
      // Celebrate each passing test with a little burst, then judge.
      panel.current?.querySelectorAll("[data-pass='1']").forEach((el, i) => setTimeout(() => { sfx.coin(); fx.burst(el, { count: 6, spread: 24 }); }, 80 * i));
      if (all) {
        done.current = true;
        setTimeout(() => ctx.solved(panel.current), 120 + 80 * r.passed);
      } else {
        fx.shake(panel.current, 6);
        sfx.wrong();
        // A miss only when the attempt is final: a paper submission in an exam (after its one proofread).
        if (paper && !canProofread) { done.current = true; setTimeout(() => ctx.wrong(panel.current), 900); }
      }
    });
  };

  const giveUp = () => {
    if (done.current) return;
    done.current = true;
    sfx.select();
    ctx.wrong(panel.current);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: s, selectionEnd: en } = el;
      setCode(code.slice(0, s) + "    " + code.slice(en));
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 4; });
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void run();
    } else if (e.key.length === 1) sfx.key();
  };

  const allPass = !!result && result.passed === total && total > 0;

  return (
    <div className="beat-split">
      <div>
        <p className="pixel beat-prompt" style={{ fontSize: 12, margin: "4px 4px 8px" }}>▶ {tx(beat.prompt)}</p>
        <div className="box dark" style={{ padding: 12, marginBottom: 10 }}>
          <div className="pixel" style={{ fontSize: 9, color: "var(--gold)", marginBottom: 6 }}>{t("task.brief")}</div>
          <p style={{ fontSize: 17, lineHeight: 1.3, margin: 0, whiteSpace: "pre-line" }}>{tx(beat.brief)}</p>
          {visible.length > 0 && (
            <>
              <div className="pixel" style={{ fontSize: 9, color: "var(--gold)", margin: "10px 0 4px" }}>{t("task.examples")}</div>
              {visible.map((x, i) => (
                <div key={i} className="code" style={{ fontSize: 17, lineHeight: 1.1 }}>
                  <Highlight code={x.run} lang={ctx.lang} /> <span style={{ color: "var(--p2)" }}>→</span> <span style={{ color: "var(--good)" }}>{x.expect}</span>
                </div>
              ))}
            </>
          )}
          <div className="pixel" style={{ fontSize: 8, color: "var(--p3)", marginTop: 8 }}>
            {paper ? t("task.paperRules") : t("task.anyWay", { n: total, hidden: total - visible.length })}
          </div>
        </div>
        <div className={`box ${paper ? "" : "dark"}`} style={{ position: "relative", background: paper ? "var(--white)" : undefined }}>
          {!paper && (
            <pre ref={pre} aria-hidden className="codeblock" style={{ margin: 0, minHeight: 200, pointerEvents: "none" }}>
              <Highlight code={code + "\n"} lang={ctx.lang} />
            </pre>
          )}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={(e) => { if (paper) { e.preventDefault(); sfx.wrong(); fx.float(e.currentTarget, t("task.noPaste"), "var(--red)", 13); } }}
            onDrop={(e) => { if (paper) e.preventDefault(); }}
            onScroll={(e) => { if (pre.current) { pre.current.scrollTop = e.currentTarget.scrollTop; pre.current.scrollLeft = e.currentTarget.scrollLeft; } }}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label={t("run.editor")}
            readOnly={submitted}
            className="codeblock"
            style={paper
              ? { width: "100%", minHeight: 240, background: "transparent", color: "var(--p0)", caretColor: "var(--p0)", border: 0, outline: "none", resize: "vertical", display: "block" }
              : { position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent", color: "transparent", caretColor: "var(--gold)", border: 0, outline: "none", resize: "none" }}
          />
        </div>
      </div>

      <div className="beat-side">
        <div style={{ height: 8, background: "var(--p1)", margin: "10px 4px 0", visibility: running || result ? "visible" : "hidden" }}>
          <div ref={bar} style={{ height: "100%", width: 0, background: allPass ? "var(--good)" : result ? "var(--red)" : "var(--gold)" }} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn primary" onClick={run} disabled={running || done.current || submitted}>
            {running ? t("task.running") : paper ? t("task.submit") : t("task.run")}
          </button>
          {!paper && <button className="btn small" onClick={() => { setCode(beat.starter); setResult(null); sfx.select(); }} disabled={running}>{t("run.reset")}</button>}
          {exam && !paper && !done.current && <button className="btn small" onClick={giveUp} disabled={running}>{t("task.giveUp")}</button>}
          {!paper && <span className="pixel" style={{ fontSize: 9, color: "var(--p2)" }}>{t("run.shortcut")}</span>}
        </div>

        {result && (
          <div ref={panel} className="box dark" style={{ padding: 12, marginTop: 12, boxShadow: `0 0 0 4px ${allPass ? "var(--good)" : result.busy || !result.available ? "var(--gold)" : "var(--red)"}` }}>
            {result.busy ? (
              <div className="pixel" style={{ fontSize: 10, color: "var(--gold)" }}>{t("run.busy", { secs: result.busy })}</div>
            ) : !result.available ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span className="pixel" style={{ fontSize: 10, color: "var(--gold)" }}>{t("task.offline")}</span>
                <button className="btn small" onClick={() => { if (!done.current) { done.current = true; (ctx.skip ?? ctx.solved)(); } }}>{t("task.continue")}</button>
              </div>
            ) : (
              <>
                {proofread === "active" && <div className="pixel blink-soft" style={{ fontSize: 9, color: "var(--gold)", marginBottom: 6 }}>{t("task.proofread")}</div>}
                <div className="pixel" style={{ fontSize: 11, color: allPass ? "var(--good)" : "var(--red)", marginBottom: 8 }}>
                  {allPass ? t("task.allPass") : result.compileError ? t("task.compileError") : t("task.passed", { n: result.passed, total })}
                </div>
                {result.stderr && (
                  <pre className="code" style={{ fontSize: 16, lineHeight: 1.1, whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto", color: "#ffb4a8", margin: "0 0 8px" }}>
                    {result.stderr.split("\n").slice(0, 10).join("\n")}
                  </pre>
                )}
                {!result.compileError && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 220, overflowY: "auto" }}>
                    {result.tests.map((x, i) => (
                      <div key={i} data-pass={x.pass ? "1" : "0"} style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: 16 }}>
                        <span className="pixel" style={{ fontSize: 10, color: x.pass ? "var(--good)" : "var(--red)", width: 14 }}>{x.pass ? "✓" : "✗"}</span>
                        {x.hidden ? (
                          <span style={{ color: "var(--p3)" }}><Sprite name="lock" size={12} /> {t("task.hidden")}</span>
                        ) : (
                          <span className="code" style={{ minWidth: 0 }}>
                            <Highlight code={x.run ?? ""} lang={ctx.lang} />
                            {!x.pass && <span style={{ color: "var(--p3)" }}> · {t("task.expected")} <b style={{ color: "var(--good)" }}>{x.expect}</b> · {t("task.got")} <b style={{ color: "#ffb4a8" }}>{x.got || "∅"}</b></span>}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
