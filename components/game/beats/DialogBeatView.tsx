"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import type { SpriteName } from "@/components/pixel/sprites";
import type { DialogBeat, EnemyKind } from "@/lib/content/types";
import { sfx } from "@/lib/sfx";
import { CodeBlock } from "../CodeBlock";
import type { BeatCtx } from "./types";

const NAMES = { master: "FERRO", hero: "TÚ", ally: "LUMA" } as const;

export function DialogBeatView({ beat, ctx, enemy, enemyName }: { beat: DialogBeat; ctx: BeatCtx; enemy: EnemyKind; enemyName: string }) {
  const [shown, setShown] = useState(0);
  const done = shown >= beat.text.length;
  const portrait = useRef<HTMLDivElement>(null);
  const finished = useRef(false);

  useEffect(() => {
    setShown(0);
    finished.current = false;
    gsap.fromTo(portrait.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "back.out(2)" });
    const id = setInterval(() => {
      setShown((n) => {
        if (n >= beat.text.length) { clearInterval(id); return n; }
        if (n % 2 === 0) sfx.text();
        return n + 1;
      });
    }, 22);
    return () => clearInterval(id);
  }, [beat]);

  // the speaker hops while talking
  useEffect(() => {
    const el = portrait.current;
    if (done || !el) return;
    const t = gsap.to(el, { y: -3, duration: 0.12, repeat: -1, yoyo: true, ease: "steps(1)" });
    return () => { t.kill(); gsap.set(el, { y: 0 }); };
  }, [done]);

  const advance = () => {
    if (ctx.busy) return;
    if (!done) { setShown(beat.text.length); return; }
    if (finished.current) return;
    finished.current = true;
    sfx.select();
    ctx.solved();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); advance(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const sprite: SpriteName = beat.speaker === "enemy" ? enemy : beat.speaker;
  const name = beat.speaker === "enemy" ? enemyName : NAMES[beat.speaker];

  return (
    <button onClick={advance} className="box dark" style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: 16, textAlign: "left", width: "calc(100% - 8px)", minHeight: 140 }} aria-label="Continuar diálogo">
      <div ref={portrait} style={{ flexShrink: 0, background: "var(--p1)", padding: 6, boxShadow: "0 0 0 4px var(--p3)" }}>
        <Sprite name={sprite} size={72} flip={beat.speaker === "enemy"} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="pixel" style={{ fontSize: 11, color: "var(--gold)", marginBottom: 8 }}>{name}</div>
        <p style={{ fontSize: 20, lineHeight: 1.45, color: "var(--white)", minHeight: "2.9em" }}>{beat.text.slice(0, shown)}</p>
        {beat.code && done && <CodeBlock code={beat.code} lang={ctx.lang} style={{ marginTop: 12 }} />}
        <div className="pixel" style={{ fontSize: 10, textAlign: "right", color: "var(--gold)", marginTop: 6, visibility: done ? "visible" : "hidden" }}>
          <span className="blink">▼</span> TOCA PARA SEGUIR
        </div>
      </div>
    </button>
  );
}
