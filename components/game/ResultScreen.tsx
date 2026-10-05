"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import { levelProgress } from "@/lib/game-rules";
import { fx, wait } from "@/lib/fx";
import type { LessonPlay } from "@/lib/repo";
import type { Reward } from "@/lib/save/progress";
import { music, sfx } from "@/lib/sfx";
import { useI18n } from "@/components/ui/I18n";

/** Staggered reward reveal: stars → stats → XP bar → coins → level up. */
export function ResultScreen({ play, score, maxCombo, mistakes, reward }: {
  play: LessonPlay; score: number; maxCombo: number; mistakes: number; reward: Reward | null;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const starEls = useRef<(HTMLSpanElement | null)[]>([]);
  const xpBar = useRef<HTMLDivElement>(null);
  const xpText = useRef<HTMLSpanElement>(null);
  const coinText = useRef<HTMLSpanElement>(null);
  const [levelUp, setLevelUp] = useState(false);
  const [ready, setReady] = useState(false);
  const stars = reward?.stars ?? (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);
  const map = `/play/${play.languageSlug}`;

  useEffect(() => {
    music.play("map");
    let alive = true;
    (async () => {
      gsap.fromTo(box.current, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" });
      await wait(400);
      for (let i = 0; i < 3; i++) {
        const el = starEls.current[i];
        if (!alive || !el) break;
        if (i < stars) {
          sfx.star(i);
          gsap.fromTo(el, { scale: 3, rotation: -90, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.35, ease: "back.out(3)" });
          fx.burst(el, { count: 12, spread: 60 });
        } else {
          gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 });
        }
        await wait(320);
      }
      if (reward && alive) {
        const before = reward.xpAfter - reward.xpGained;
        const from = levelProgress(before);
        const to = levelProgress(reward.xpAfter);
        const counter = { xp: 0, coins: 0 };
        gsap.to(counter, {
          xp: reward.xpGained,
          coins: reward.coinsGained,
          duration: 1,
          ease: "power1.out",
          onUpdate: () => {
            if (xpText.current) xpText.current.textContent = `+${Math.round(counter.xp)}`;
            if (coinText.current) coinText.current.textContent = `+${Math.round(counter.coins)}`;
            if (Math.random() < 0.3) sfx.coin();
          },
        });
        gsap.fromTo(xpBar.current, { width: `${from.ratio * 100}%` }, { width: `${(to.level > from.level ? 1 : to.ratio) * 100}%`, duration: 1, ease: "power2.out" });
        await wait(1100);
        if (to.level > from.level && alive) {
          setLevelUp(true);
          sfx.levelUp();
          fx.flash("var(--gold)", 0.4);
          fx.burst(null, { count: 40, spread: 220 });
          void fx.banner(t("result.levelUp", { n: to.level }), { size: 34, hold: 0.8, color: "var(--good)" });
          gsap.fromTo(xpBar.current, { width: "0%" }, { width: `${to.ratio * 100}%`, duration: 0.6, delay: 0.3 });
        }
      }
      if (alive) setReady(true);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reward]);

  const go = (href: string) => { sfx.select(); router.push(href); router.refresh(); };

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.72)", display: "grid", placeItems: "center", zIndex: 600, padding: 16 }}>
      <div ref={box} className="box dark" style={{ padding: "28px 24px", textAlign: "center", width: "min(460px, 100%)" }}>
        {(
          <>
            <div className="pixel" style={{ fontSize: 18, color: "var(--gold)", marginBottom: 18 }}>
              {play.mode === "review" ? t("result.review") : play.mode === "boss" ? t("result.victory") : t("result.clear")}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} ref={(el) => { starEls.current[i] = el; }} style={{ opacity: 0, display: "inline-block" }}>
                  <Sprite name={i < stars ? "star" : "starEmpty"} size={48} />
                </span>
              ))}
            </div>
            <div className="pixel" style={{ fontSize: 10, display: "grid", gridTemplateColumns: "1fr auto", gap: "10px 16px", textAlign: "left", marginBottom: 18 }}>
              <span style={{ color: "var(--p2)" }}>{t("common.score")}</span><span>{score}</span>
              <span style={{ color: "var(--p2)" }}>{t("common.maxCombo")}</span><span>x{maxCombo}</span>
              <span style={{ color: "var(--p2)" }}>{t("common.mistakes")}</span><span style={{ color: mistakes ? "var(--red)" : "var(--good)" }}>{mistakes}</span>
            </div>
            {reward && (
              <div style={{ marginBottom: 20 }}>
                <div className="pixel" style={{ fontSize: 10, display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>{t("common.level")} {reward.levelAfter} {levelUp && <span style={{ color: "var(--good)" }}>▲</span>}</span>
                  <span style={{ color: "var(--good)" }}>XP <span ref={xpText}>+0</span></span>
                  <span style={{ color: "var(--gold)" }}><Sprite name="coin" size={14} /> <span ref={coinText}>+0</span></span>
                </div>
                <div style={{ height: 12, background: "var(--p1)", boxShadow: "0 0 0 3px var(--p3)" }}>
                  <div ref={xpBar} style={{ height: "100%", width: 0, background: "var(--good)" }} />
                </div>
              </div>
            )}
          </>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", opacity: ready ? 1 : 0.3, pointerEvents: ready ? "auto" : "none" }}>
          {reward?.nextLesson && play.mode !== "review" && (
            <button className="btn primary" onClick={() => go(`${map}/lesson/${reward.nextLesson}`)}>{t("common.next")}</button>
          )}
          <button className="btn" onClick={() => go(map)}>{t("common.map")}</button>
          {play.mode !== "review" && (
            <button className="btn small" onClick={() => window.location.reload()}>{t("common.repeat")}</button>
          )}
        </div>
      </div>
    </div>
  );
}
