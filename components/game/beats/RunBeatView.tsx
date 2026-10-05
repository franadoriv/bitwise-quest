"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { RunBeat } from "@/lib/content/types";
import { fx } from "@/lib/fx";
import { sfx } from "@/lib/sfx";
import { Highlight } from "../CodeBlock";
import type { BeatCtx } from "./types";
import { useI18n } from "@/components/ui/I18n";

const offlinePass = (fallback: string | string[] | undefined, code: string) =>
  (Array.isArray(fallback) ? fallback : fallback ? [fallback] : []).some((re) => new RegExp(re).test(code));

type Result = { kind: "ok" | "compile" | "output" | "offline-ok" | "offline-bad" | "busy"; stdout: string; stderr: string; retry?: number };

/** Real code, real compiler. Highlighted textarea overlay + a lively "compiling" bar. */
export function RunBeatView({ beat, ctx }: { beat: RunBeat; ctx: BeatCtx }) {
  const { t, tx } = useI18n();
  const [code, setCode] = useState(beat.starter);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const solvedRef = useRef(false);

  useEffect(() => { setCode(beat.starter); setResult(null); solvedRef.current = false; }, [beat]);

  const run = async () => {
    if (running || ctx.busy || solvedRef.current) return;
    setRunning(true);
    setResult(null);
    sfx.select();
    ctx.stage?.heroSay(t("run.compilingSay"));
    const tween = gsap.fromTo(bar.current, { width: "0%" }, { width: "92%", duration: 4, ease: "power2.out" });
    const beep = setInterval(() => sfx.blip(Math.floor(Math.random() * 8)), 260);
    let res: Result;
    try {
      const r = await fetch("/api/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ language: ctx.lang, code }) });
      if (r.status === 429 || r.status === 503) {
        // Quota hit: not the player's fault, so no penalty — just ask them to wait.
        res = { kind: "busy", stdout: "", stderr: "", retry: Number(r.headers.get("retry-after") ?? "5") || 5 };
        throw res;
      }
      const data = (await r.json()) as { ok: boolean; stdout: string; stderr: string; available: boolean };
      if (!data.available) {
        res = { kind: offlinePass(beat.fallback, code) ? "offline-ok" : "offline-bad", stdout: "", stderr: "" };
      } else if (!data.ok) res = { kind: "compile", stdout: data.stdout, stderr: data.stderr };
      else res = { kind: data.stdout.includes(beat.expect) ? "ok" : "output", stdout: data.stdout, stderr: "" };
    } catch (e) {
      res = (e as Result)?.kind === "busy" ? (e as Result) : { kind: offlinePass(beat.fallback, code) ? "offline-ok" : "offline-bad", stdout: "", stderr: "" };
    }
    clearInterval(beep);
    tween.kill();
    gsap.to(bar.current, { width: "100%", duration: 0.15 });
    setResult(res);
    setRunning(false);
    requestAnimationFrame(() => {
      if (res.kind === "busy") return;
      if (res.kind === "ok" || res.kind === "offline-ok") {
        solvedRef.current = true;
        res.stdout.split("\n").filter(Boolean).slice(0, 3).forEach((l) => ctx.print(l));
        ctx.solved(resultRef.current);
      } else {
        fx.shake(resultRef.current, 8);
        ctx.wrong(resultRef.current);
      }
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const t = e.currentTarget;
      const { selectionStart: s, selectionEnd: en } = t;
      const next = code.slice(0, s) + "    " + code.slice(en);
      setCode(next);
      requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 4; });
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void run();
    } else if (e.key.length === 1) sfx.key();
  };

  const good = result?.kind === "ok" || result?.kind === "offline-ok";
  const busy = result?.kind === "busy";

  return (
    <div className="beat-split">
      <p className="pixel beat-prompt" style={{ fontSize: 12, margin: "4px 4px 12px" }}>▶ {tx(beat.prompt)}</p>
      <div className="box dark" style={{ position: "relative" }}>
        <pre ref={pre} aria-hidden className="codeblock" style={{ margin: 0, minHeight: 160, pointerEvents: "none" }}>
          <Highlight code={code + "\n"} lang={ctx.lang} />
        </pre>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={onKeyDown}
          onScroll={(e) => { if (pre.current) { pre.current.scrollTop = e.currentTarget.scrollTop; pre.current.scrollLeft = e.currentTarget.scrollLeft; } }}
          spellCheck={false}
          autoCapitalize="off"
          aria-label={t("run.editor")}
          className="codeblock"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent", color: "transparent", caretColor: "var(--gold)", border: 0, outline: "none", resize: "none" }}
        />
      </div>
      <div className="beat-side">
      <div style={{ height: 8, background: "var(--p1)", margin: "10px 4px 0", visibility: running || result ? "visible" : "hidden" }}>
        <div ref={bar} style={{ height: "100%", width: 0, background: good ? "var(--good)" : result ? "var(--red)" : "var(--gold)" }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn primary" onClick={run} disabled={running || solvedRef.current}>{running ? t("run.compiling") : t("run.run")}</button>
        <button className="btn small" onClick={() => { setCode(beat.starter); setResult(null); sfx.select(); }} disabled={running}>{t("run.reset")}</button>
        <span className="pixel" style={{ fontSize: 9, color: "var(--p2)" }}>{t("run.shortcut")}</span>
      </div>
      {result && (
        <div ref={resultRef} className="box dark" style={{ padding: 12, marginTop: 12, boxShadow: `0 0 0 4px ${good ? "var(--good)" : busy ? "var(--gold)" : "var(--red)"}` }}>
          <div className="pixel" style={{ fontSize: 11, color: good ? "var(--good)" : busy ? "var(--gold)" : "var(--red)", marginBottom: 6 }}>
            {result.kind === "busy" && t("run.busy", { secs: result.retry ?? 5 })}
            {result.kind === "ok" && t("run.ok")}
            {result.kind === "offline-ok" && t("run.offlineOk")}
            {result.kind === "offline-bad" && t("run.offlineBad")}
            {result.kind === "compile" && t("run.compileError")}
            {result.kind === "output" && t("run.wrongOutput", { expect: beat.expect })}
          </div>
          {(result.stderr || result.stdout) && (
            <pre className="code" style={{ fontSize: 18, lineHeight: 1.1, whiteSpace: "pre-wrap", maxHeight: 180, overflow: "auto", color: result.stderr ? "#ffb4a8" : "var(--white)" }}>
              {(result.stderr || result.stdout).split("\n").slice(0, 14).join("\n")}
            </pre>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
