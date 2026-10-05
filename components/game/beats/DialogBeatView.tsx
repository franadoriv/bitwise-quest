"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import type { SpriteName } from "@/components/pixel/sprites";
import type { DialogBeat, EnemyKind } from "@/lib/content/types";
import { sfx } from "@/lib/sfx";
import { useI18n } from "@/components/ui/I18n";
import type { Text } from "@/lib/i18n/text";
import { CodeBlock } from "../CodeBlock";
import type { BeatCtx } from "./types";

const ALLY = { en: "LUMA", es: "LUMA", ja: "ルマ" } as const;

export function DialogBeatView({ beat, ctx, enemy, enemyName, guide }: { beat: DialogBeat; ctx: BeatCtx; enemy: EnemyKind; enemyName: Text; guide: { name: Text; sprite: string } }) {
  const { t, tx } = useI18n();
  const text = tx(beat.text);
  const [shown, setShown] = useState(0);
  const done = shown >= text.length;
  const portrait = useRef<HTMLDivElement>(null);
  const finished = useRef(false);

  useEffect(() => {
    setShown(0);
    finished.current = false;
    gsap.fromTo(portrait.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "back.out(2)" });
    const id = setInterval(() => {
      setShown((n) => {
        if (n >= text.length) { clearInterval(id); return n; }
        if (n % 2 === 0) sfx.text();
        return n + 1;
      });
    }, 22);
    return () => clearInterval(id);
  }, [beat, text]);

  // the speaker hops while talking
  useEffect(() => {
    const el = portrait.current;
    if (done || !el) return;
    const t = gsap.to(el, { y: -3, duration: 0.12, repeat: -1, yoyo: true, ease: "steps(1)" });
    return () => { t.kill(); gsap.set(el, { y: 0 }); };
  }, [done]);

  const advance = () => {
    if (ctx.busy) return;
    if (!done) { setShown(text.length); return; }
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

  const sprite: SpriteName = beat.speaker === "enemy" ? enemy : beat.speaker === "master" ? guide.sprite : beat.speaker;
  const name = beat.speaker === "enemy" ? tx(enemyName) : beat.speaker === "hero" ? t("dialog.you") : beat.speaker === "master" ? tx(guide.name).toUpperCase() : tx(ALLY);

  return (
    <button onClick={advance} className="box dark" style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: 16, textAlign: "left", width: "calc(100% - 8px)", minHeight: 140 }} aria-label={t("dialog.continue")}>
      <div ref={portrait} style={{ flexShrink: 0, background: "var(--p1)", padding: 6, boxShadow: "0 0 0 4px var(--p3)" }}>
        <Sprite name={sprite} size={72} flip={beat.speaker === "enemy"} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="pixel" style={{ fontSize: 11, color: "var(--gold)", marginBottom: 8 }}>{name}</div>
        <p style={{ fontSize: 20, lineHeight: 1.45, color: "var(--white)", minHeight: "2.9em" }}>{text.slice(0, shown)}</p>
        {beat.code && done && <CodeBlock code={beat.code} lang={ctx.lang} style={{ marginTop: 12 }} />}
        <div className="pixel" style={{ fontSize: 10, textAlign: "right", color: "var(--gold)", marginTop: 6, visibility: done ? "visible" : "hidden" }}>
          <span className="blink">▼</span> {t("dialog.tap")}
        </div>
      </div>
    </button>
  );
}
