"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import { useI18n } from "@/components/ui/I18n";
import { useOrientation } from "@/components/ui/GameFrame";
import type { MessageKey } from "@/lib/i18n/messages";
import { TIMER_MODES, type TimerMode } from "@/lib/game-rules";
import { fx } from "@/lib/fx";
import { sfx } from "@/lib/sfx";

const MODES: { mode: TimerMode; icon: string; label: MessageKey }[] = [
  { mode: "off", icon: "timerOff", label: "timer.off" },
  { mode: "relaxed", icon: "turtle", label: "timer.relaxed" },
  { mode: "normal", icon: "runner", label: "timer.normal" },
  { mode: "fast", icon: "bolt", label: "timer.fast" },
];

/**
 * Asked before every lesson (the last choice comes preselected, so one tap starts): play without a
 * timer, or with a relaxed, normal or fast one. Faster timers pay a bigger speed bonus.
 * `baseSeconds` is the lesson's typical time per question at "normal".
 */
export function TimerModal({ boss, initial, baseSeconds, onStart }: { boss: boolean; initial: TimerMode; baseSeconds: number; onStart(mode: TimerMode): void }) {
  const { t } = useI18n();
  const portrait = useOrientation() === "portrait";
  const [sel, setSel] = useState<TimerMode>(boss && initial === "off" ? "normal" : initial);
  const box = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const clock = useRef<HTMLDivElement>(null);
  const cards = useRef<Partial<Record<TimerMode, HTMLButtonElement | null>>>({});
  const startBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    sfx.whoosh();
    gsap.fromTo(box.current, { y: 40, scale: 0.7, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" });
    if (grid.current) gsap.fromTo(grid.current.children, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.07, delay: 0.15, ease: "back.out(2.5)" });
    const tick = gsap.to(clock.current, { rotation: 14, duration: 0.25, repeat: -1, yoyo: true, ease: "steps(2)" });
    const pulse = gsap.to(startBtn.current, { scale: 1.05, duration: 0.45, repeat: -1, yoyo: true, ease: "steps(2)" });
    return () => { tick.kill(); pulse.kill(); };
  }, []);

  const choose = (mode: TimerMode) => {
    const card = cards.current[mode];
    if (boss && mode === "off") { sfx.wrong(); fx.shake(card ?? null, 6); return; }
    if (mode !== sel) sfx.select();
    setSel(mode);
    fx.pop(card ?? null, 1.08);
  };
  const start = () => {
    sfx.start();
    fx.burst(startBtn.current, { count: 14 });
    gsap.to(box.current, { scale: 0.85, opacity: 0, duration: 0.2, ease: "power2.in", onComplete: () => onStart(sel) });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 4) choose(MODES[n - 1].mode);
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); start(); }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const i = MODES.findIndex((m) => m.mode === sel) + (e.key === "ArrowRight" ? 1 : -1);
        if (i >= 0 && i < MODES.length) choose(MODES[i].mode);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.72)", display: "grid", placeItems: "center", zIndex: 650, padding: 16 }}>
      <div ref={box} className="box dark" role="dialog" aria-modal="true" aria-labelledby="timer-title" style={{ width: portrait ? "100%" : 600, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div ref={clock} style={{ flex: "0 0 auto" }}><Sprite name="clock" size={48} /></div>
          <div>
            <div id="timer-title" className="pixel" style={{ fontSize: 16, color: "var(--gold)", marginBottom: 6 }}>{t("timer.title")}</div>
            <p style={{ fontSize: 18, margin: 0 }}>{t("timer.pitch")}</p>
          </div>
        </div>

        <div ref={grid} role="radiogroup" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {MODES.map(({ mode, icon, label }, i) => {
            const active = sel === mode;
            const locked = boss && mode === "off";
            const seconds = Math.round(baseSeconds * TIMER_MODES[mode].scale);
            return (
              <button
                key={mode}
                ref={(el) => { cards.current[mode] = el; }}
                role="radio"
                aria-checked={active}
                className={`btn ${active ? "primary" : ""}`}
                onClick={() => choose(mode)}
                onMouseEnter={() => sfx.hover()}
                style={{ display: "flex", gap: 10, alignItems: "center", textAlign: "left", padding: 12, textTransform: "none", opacity: locked ? 0.45 : 1, boxShadow: active ? "0 0 0 3px var(--gold)" : undefined }}
              >
                <Sprite name={locked ? "lock" : icon} size={32} />
                <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span className="pixel" style={{ fontSize: 11 }}>{i + 1}. {t(label)}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.15, fontFamily: "var(--font-body)" }}>
                    {locked ? t("timer.bossNote") : mode === "off" ? t("timer.offDesc") : <>{t("timer.seconds", { n: seconds })}<br />{t("timer.bonus", { n: TIMER_MODES[mode].bonus })}</>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <button ref={startBtn} className="btn primary" onClick={start} style={{ fontSize: 16, padding: "14px 20px", display: "flex", gap: 10, alignItems: "center", justifyContent: "center" }}>
          <Sprite name={MODES.find((m) => m.mode === sel)!.icon} size={22} /> {t("timer.start")}
        </button>
      </div>
    </div>
  );
}
