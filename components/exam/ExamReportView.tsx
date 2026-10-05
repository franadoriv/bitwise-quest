"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { fx, wait } from "@/lib/fx";
import type { ExamReport } from "@/lib/repo";
import { music, sfx } from "@/lib/sfx";
import { useOrientation } from "@/components/ui/GameFrame";
import { useI18n } from "@/components/ui/I18n";

/** Result of an entry exam: score, pass stamp, per-topic breakdown and what to study next. */
export function ExamReportView({ report, lang }: { report: ExamReport | null; lang: string }) {
  const router = useRouter();
  const { t, tx } = useI18n();
  const twoCols = useOrientation() === "landscape" && (report?.topics.length ?? 0) > 5;
  const box = useRef<HTMLDivElement>(null);
  const pctEl = useRef<HTMLSpanElement>(null);
  const stamp = useRef<HTMLDivElement>(null);

  useEffect(() => {
    music.play("map");
    gsap.fromTo(box.current, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" });
    if (!report) return;
    let alive = true;
    (async () => {
      const c = { v: 0 };
      await gsap.to(c, { v: report.pct, duration: 1.1, ease: "power1.out", onUpdate: () => { if (pctEl.current) pctEl.current.textContent = `${Math.round(c.v)}%`; if (Math.random() < 0.3) sfx.blip(Math.round(c.v / 10)); } });
      if (!alive) return;
      gsap.fromTo(".topic-fill", { width: 0 }, { width: (i, el) => (el as HTMLElement).dataset.w + "%", duration: 0.6, stagger: 0.08 });
      await wait(200);
      gsap.fromTo(stamp.current, { scale: 3, rotation: -25, opacity: 0 }, { scale: 1, rotation: -8, opacity: 1, duration: 0.3, ease: "power4.in" });
      await wait(300);
      if (report.passed) { sfx.levelUp(); fx.burst(stamp.current, { count: 40, spread: 200 }); fx.flash("var(--gold)", 0.3); }
      else sfx.gameOver();
    })();
    return () => { alive = false; };
  }, [report]);

  const go = (href: string) => { sfx.select(); router.push(href); router.refresh(); };

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.78)", display: "grid", placeItems: "center", zIndex: 600, padding: 16 }}>
      <div ref={box} className="box dark scroll" style={{ padding: "22px 24px", width: twoCols ? "min(1040px, 100%)" : "min(760px, 100%)", maxHeight: "94%" }}>
        {!report ? (
          <p className="pixel" style={{ fontSize: 12 }}>{t("exam.saveError")}</p>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <div>
                <div className="pixel" style={{ fontSize: 10, color: "var(--p2)" }}>{tx(report.exam.title).toUpperCase()}</div>
                <span ref={pctEl} className="pixel" style={{ fontSize: 56, color: report.passed ? "var(--good)" : "var(--red)", display: "block", marginTop: 8 }}>0%</span>
                <div className="pixel" style={{ fontSize: 10, marginTop: 6 }}>{t("exam.correct", { c: report.correct, t: report.total, pct: report.exam.passPct })}</div>
              </div>
              <div ref={stamp} className="pixel" style={{ opacity: 0, fontSize: 18, padding: "10px 14px", border: `4px solid ${report.passed ? "var(--good)" : "var(--red)"}`, color: report.passed ? "var(--good)" : "var(--red)" }}>
                {report.passed ? t("exam.passed") : t("exam.failed")}
              </div>
            </div>

            <div className="pixel" style={{ fontSize: 10, color: "var(--gold)", margin: "20px 0 10px" }}>{t("exam.byTopic")}</div>
            <div style={{ display: "grid", gap: "8px 28px", gridTemplateColumns: twoCols ? "1fr 1fr" : "1fr" }}>
              {report.topics.map((tp) => {
                const w = Math.round((tp.correct / tp.total) * 100);
                return (
                  <div key={tp.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr) auto", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 17, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={tx(tp.name)}>{tx(tp.name)}</span>
                    <div style={{ height: 10, background: "var(--p1)" }}>
                      <div className="topic-fill" data-w={w} style={{ height: "100%", width: 0, background: w >= 80 ? "var(--good)" : w >= 50 ? "var(--gold)" : "var(--red)" }} />
                    </div>
                    <span className="pixel" style={{ fontSize: 9 }}>{tp.correct}/{tp.total}</span>
                  </div>
                );
              })}
            </div>

            {report.skippedRegions.length > 0 && (
              <p style={{ fontSize: 17, marginTop: 16, color: "var(--good)" }}>{t("exam.skipped", { list: report.skippedRegions.map((r) => tx(r)).join(", ") })}</p>
            )}
            {report.topics.some((x) => x.correct / x.total < 0.8) && (
              <p style={{ fontSize: 17, marginTop: 10 }}>
                {t("exam.reinforce", { list: report.topics.filter((x) => x.correct / x.total < 0.8).slice(0, 3).map((x) => (x.regionName ? `${tx(x.name)} (${tx(x.regionName)})` : tx(x.name))).join(" · ") })}
              </p>
            )}
            <div className="pixel" style={{ fontSize: 9, color: "var(--good)", marginTop: 10 }}>+{report.xpGained} XP</div>
          </>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
          <button className="btn primary" onClick={() => window.location.reload()}>{t("common.repeat")}</button>
          <button className="btn" onClick={() => go(`/play/${lang}/exam`)}>{t("exam.otherLevel")}</button>
          <button className="btn" onClick={() => go(`/play/${lang}`)}>{t("common.map")}</button>
        </div>
      </div>
    </div>
  );
}
