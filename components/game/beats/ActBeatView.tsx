"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { ActBeat, Text } from "@/lib/content/types";
import { useI18n } from "@/components/ui/I18n";
import { fx, wait } from "@/lib/fx";
import { sfx } from "@/lib/sfx";
import { Highlight } from "../CodeBlock";
import type { BeatCtx } from "./types";

/** "Learn by doing": each button writes a line of code and the world reacts to it. */
export function ActBeatView({ beat, ctx }: { beat: ActBeat; ctx: BeatCtx }) {
  const [step, setStep] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const [typing, setTyping] = useState("");
  const [running, setRunning] = useState(false);
  const { t, tx } = useI18n();
  const [error, setError] = useState<{ compiler: string; plain: Text } | null>(null);
  const errRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const finished = step >= beat.steps.length;

  useEffect(() => {
    if (!btnRef.current) return;
    const t = gsap.to(btnRef.current, { scale: 1.06, duration: 0.4, repeat: -1, yoyo: true, ease: "steps(2)" });
    return () => { t.kill(); };
  }, [step, running]);

  const press = async () => {
    if (running || finished) return;
    const s = beat.steps[step];
    setRunning(true);
    setError(null);
    sfx.select();
    if (s.line) {
      for (let i = 1; i <= s.line.length; i++) {
        setTyping(s.line.slice(0, i));
        if (i % 2) sfx.key();
        await wait(14);
      }
      setLines((l) => [...l, s.line!]);
      setTyping("");
    }
    await ctx.stage?.run(s.effects);
    if (s.output) ctx.print(s.output);
    if (s.error) {
      setError(s.error);
      sfx.wrong();
      await wait(30);
      fx.shake(errRef.current, 8);
      fx.flash("var(--red)", 0.25);
    } else {
      ctx.tick(btnRef.current);
    }
    setStep((n) => n + 1);
    setRunning(false);
  };

  return (
    <div className="beat-split">
      <p className="pixel beat-prompt" style={{ fontSize: 12, margin: "4px 4px 12px", color: "var(--p3)" }}>▶ {tx(beat.prompt)}</p>
      <pre className="codeblock box dark" style={{ minHeight: 70 }}>
        {lines.map((l, i) => (
          <div key={i}><Highlight code={l} lang={ctx.lang} /></div>
        ))}
        <div>
          <Highlight code={typing} lang={ctx.lang} />
          <span className="blink" style={{ color: "var(--gold)" }}>█</span>
        </div>
      </pre>
      <div className="beat-side">
      {error && (
        <div ref={errRef} className="box" style={{ background: "var(--red)", color: "var(--white)", padding: 12, marginTop: 12 }}>
          <div className="code" style={{ fontSize: 19, lineHeight: 1.1, wordBreak: "break-word" }}>{error.compiler}</div>
          <div style={{ fontSize: 18, marginTop: 6 }}>{t("act.watch")} {tx(error.plain)}</div>
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, alignItems: "center" }}>
        {beat.steps.map((s, i) => (
          <button
            key={i}
            ref={i === step && !running ? btnRef : undefined}
            className={`btn ${i === step ? "primary" : ""}`}
            disabled={i !== step || running}
            onClick={press}
          >
            {i < step ? "✓ " : ""}{tx(s.label)}
          </button>
        ))}
        {finished && (
          <button ref={btnRef} className="btn good" onClick={() => { if (!ctx.busy) { sfx.select(); ctx.solved(); } }}>
            {t("act.understood")}
          </button>
        )}
      </div>
      </div>
    </div>
  );
}
