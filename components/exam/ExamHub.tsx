"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import type { SpriteName } from "@/components/pixel/sprites";
import { Settings } from "@/components/ui/Settings";
import { useOrientation } from "@/components/ui/GameFrame";
import type { ExamSummary, LanguageView } from "@/lib/repo";
import { fx } from "@/lib/fx";
import { music, sfx } from "@/lib/sfx";
import { useI18n } from "@/components/ui/I18n";
import { RequireSave } from "@/components/save/SaveProvider";
import { PlayerChip } from "@/components/save/PlayerChip";
import type { SaveData } from "@/lib/save/schema";

const LEVEL: Record<string, { label: "exam.junior" | "exam.mid" | "exam.senior"; sprite: SpriteName; color: string }> = {
  junior: { label: "exam.junior", sprite: "slime", color: "var(--good)" },
  mid: { label: "exam.mid", sprite: "golem", color: "var(--gold)" },
  senior: { label: "exam.senior", sprite: "dragon", color: "var(--red)" },
};

export function ExamHub(props: { language: LanguageView; exams: ExamSummary[] }) {
  return <RequireSave>{(save) => <Hub {...props} save={save} />}</RequireSave>;
}

function Hub({ language, exams, save }: { language: LanguageView; exams: ExamSummary[]; save: SaveData }) {
  const router = useRouter();
  const portrait = useOrientation() === "portrait";
  const { t, tx } = useI18n();
  const rec = (slug: string) => save.langs[language.slug]?.exams[slug];

  useEffect(() => {
    music.play("map");
    gsap.fromTo(".exam-card", { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.4, ease: "back.out(2)" });
    return () => music.stop();
  }, []);

  const start = (slug: string, el: Element) => {
    sfx.start();
    fx.burst(el, { count: 24 });
    fx.flash("var(--white)", 0.4);
    setTimeout(() => router.push(`/play/${language.slug}/exam/${slug}`), 300);
  };

  return (
    <div className="screen">
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
        <Link href={`/play/${language.slug}`} className="btn small" onClick={() => sfx.select()}>{t("common.backToMap")}</Link>
        <PlayerChip />
        <div style={{ flex: 1 }} />
        <Settings />
      </header>
      <main className="scroll" style={{ flex: 1, minHeight: 0, padding: "8px 24px 24px" }}>
        <h1 className="pixel" style={{ fontSize: portrait ? 18 : 26, color: "var(--gold)" }}>{t("exam.title", { lang: language.name })}</h1>
        <p style={{ fontSize: 19, margin: "10px 0 22px", maxWidth: 820 }}>
          {t("exam.intro", { lang: language.name })}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${portrait ? 1 : Math.max(1, exams.length)}, 1fr)`, gap: 16 }}>
          {exams.map((e) => {
            const lv = LEVEL[e.level] ?? LEVEL.junior;
            return (
              <div key={e.slug} className="exam-card box dark" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Sprite name={lv.sprite} size={48} flip />
                  <div>
                    <div className="pixel" style={{ fontSize: 10, color: lv.color }}>{t(lv.label)}</div>
                    <div className="pixel" style={{ fontSize: 13, marginTop: 6 }}>{tx(e.title)}</div>
                  </div>
                </div>
                <p style={{ fontSize: 17, lineHeight: 1.35, flex: 1 }}>{tx(e.description)}</p>
                <div className="pixel" style={{ fontSize: 9, lineHeight: 2, color: "var(--p2)" }}>
                  {t("exam.meta1", { count: e.count, secs: e.secondsPerQuestion })}<br />{t("exam.meta2", { pct: e.passPct, bank: e.bankSize })}
                </div>
                <div className="pixel" style={{ fontSize: 9, minHeight: 14, color: rec(e.slug)?.passed ? "var(--good)" : "var(--p2)" }}>
                  {rec(e.slug) ? t("exam.best", { pct: rec(e.slug)!.bestPct, passed: rec(e.slug)!.passed ? t("exam.passedTag") : "", n: rec(e.slug)!.attempts }) : t("exam.noAttempts")}
                </div>
                <button className="btn primary" onClick={(ev) => start(e.slug, ev.currentTarget)} onMouseEnter={() => sfx.hover()}>
                  {t("exam.start")}
                </button>
              </div>
            );
          })}
        </div>
        <p className="pixel" style={{ fontSize: 9, color: "var(--p2)", marginTop: 20, lineHeight: 1.8 }}>
          {t("exam.skipNote")}
        </p>
      </main>
    </div>
  );
}
