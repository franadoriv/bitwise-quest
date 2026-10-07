"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import type { SpriteName } from "@/components/pixel/sprites";
import { Settings } from "@/components/ui/Settings";
import { useOrientation } from "@/components/ui/GameFrame";
import type { LanguageView, PracticeItem, PracticeKind, PracticeLevel } from "@/lib/repo";
import { fx } from "@/lib/fx";
import { music, sfx } from "@/lib/sfx";
import { useI18n } from "@/components/ui/I18n";
import { RequireSave } from "@/components/save/SaveProvider";
import { PlayerChip } from "@/components/save/PlayerChip";
import type { SaveData } from "@/lib/save/schema";

const KINDS: { id: PracticeKind | "all"; label: "practice.all" | "practice.code" | "practice.trace" | "practice.debug"; sprite?: SpriteName }[] = [
  { id: "all", label: "practice.all" },
  { id: "code", label: "practice.code", sprite: "scroll" },
  { id: "trace", label: "practice.trace", sprite: "book" },
  { id: "debug", label: "practice.debug", sprite: "bulb" },
];
const LEVELS: { id: PracticeLevel | "all"; label: "practice.all" | "exam.junior" | "exam.mid" | "exam.senior" | "practice.boss"; color: string }[] = [
  { id: "all", label: "practice.all", color: "var(--white)" },
  { id: "junior", label: "exam.junior", color: "var(--good)" },
  { id: "mid", label: "exam.mid", color: "var(--gold)" },
  { id: "senior", label: "exam.senior", color: "var(--red)" },
  { id: "boss", label: "practice.boss", color: "var(--p3)" },
];
const SPRITE: Record<PracticeKind, SpriteName> = { code: "scroll", trace: "book", debug: "bulb" };
const PREFS = "bwq:practice";

export function PracticeRoom(props: { language: LanguageView; items: PracticeItem[] }) {
  return <RequireSave>{(save) => <Room {...props} save={save} />}</RequireSave>;
}

/**
 * The practice room: every coding task, trace table and debugging task of a world, filterable by
 * kind and level, playable in the IDE or on paper. Results come from the save (by task slug).
 */
function Room({ language, items, save }: { language: LanguageView; items: PracticeItem[]; save: SaveData }) {
  const router = useRouter();
  const portrait = useOrientation() === "portrait";
  const { t, tx } = useI18n();
  const [kind, setKind] = useState<PracticeKind | "all">("all");
  const [level, setLevel] = useState<PracticeLevel | "all">("all");
  const [paper, setPaper] = useState(false);
  const rec = save.langs[language.slug]?.practice ?? {};

  // Filters are a per-viewer convenience: remembered in this browser only.
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREFS) ?? "{}");
      if (KINDS.some((k) => k.id === p.kind)) setKind(p.kind);
      if (LEVELS.some((l) => l.id === p.level)) setLevel(p.level);
      if (typeof p.paper === "boolean") setPaper(p.paper);
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem(PREFS, JSON.stringify({ kind, level, paper })); } catch {} }, [kind, level, paper]);

  useEffect(() => {
    music.play("card");
    return () => music.stop();
  }, []);

  const shown = useMemo(
    () => items.filter((i) => (kind === "all" || i.kind === kind) && (level === "all" || i.level === level)),
    [items, kind, level],
  );
  useEffect(() => {
    gsap.fromTo(".practice-card", { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.02, duration: 0.25, ease: "back.out(2)" });
  }, [shown]);

  const solved = items.filter((i) => rec[i.slug]?.solvedAt).length;
  const onPaper = items.filter((i) => rec[i.slug]?.paperAt).length;

  const start = (item: PracticeItem, el: Element) => {
    sfx.start();
    fx.burst(el, { count: 16 });
    const asPaper = paper && item.kind !== "trace";
    setTimeout(() => router.push(`/play/${language.slug}/practice/${item.slug}${asPaper ? "?paper=1" : ""}`), 250);
  };

  const chip = (active: boolean) => `btn small ${active ? "primary" : ""}`;

  return (
    <div className="screen">
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
        <Link href={`/play/${language.slug}`} className="btn small" onClick={() => sfx.select()}>{t("common.backToMap")}</Link>
        <PlayerChip />
        <div style={{ flex: 1 }} />
        <Settings />
      </header>
      <main className="scroll" style={{ flex: 1, minHeight: 0, padding: "8px 24px 24px" }}>
        <h1 className="pixel" style={{ fontSize: portrait ? 18 : 26, color: "var(--gold)" }}>{t("practice.title")} · {language.name}</h1>
        <p style={{ fontSize: 19, margin: "10px 0 8px", maxWidth: 820 }}>{t("practice.intro")}</p>
        <div className="pixel" style={{ fontSize: 10, color: "var(--good)", marginBottom: 14 }}>
          {t("practice.progress", { n: solved, total: items.length, paper: onPaper })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          <div role="group" aria-label={t("practice.code")} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {KINDS.map((k) => (
              <button key={k.id} className={chip(kind === k.id)} aria-pressed={kind === k.id} onClick={() => { sfx.select(); setKind(k.id); }} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {k.sprite && <Sprite name={k.sprite} size={14} />} {t(k.label)}
              </button>
            ))}
          </div>
          <div role="group" aria-label={t("practice.boss")} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {LEVELS.map((l) => (
              <button key={l.id} className={chip(level === l.id)} aria-pressed={level === l.id} onClick={() => { sfx.select(); setLevel(l.id); }} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {l.id !== "all" && <span aria-hidden style={{ width: 10, height: 10, background: l.color, boxShadow: "0 0 0 2px var(--p0)" }} />}
                {t(l.label)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div role="radiogroup" style={{ display: "flex", gap: 0 }}>
              <button role="radio" aria-checked={!paper} className={chip(!paper)} onClick={() => { sfx.select(); setPaper(false); }}>{t("practice.ide")}</button>
              <button role="radio" aria-checked={paper} className={chip(paper)} onClick={() => { sfx.select(); setPaper(true); }}>{t("practice.paper")}</button>
            </div>
            <span style={{ fontSize: 16, color: "var(--p3)" }}>{paper ? t("practice.paperHint") : ""}</span>
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="pixel" style={{ fontSize: 10, color: "var(--p2)" }}>{t("practice.none")}</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${portrait ? 1 : 3}, minmax(0, 1fr))`, gap: 10 }}>
            {shown.map((item) => {
              const r = rec[item.slug];
              const lv = LEVELS.find((l) => l.id === item.level)!;
              return (
                <button
                  key={item.slug}
                  className="practice-card box dark"
                  onClick={(e) => start(item, e.currentTarget)}
                  onMouseEnter={() => sfx.hover()}
                  style={{ padding: 12, display: "flex", gap: 10, alignItems: "flex-start", textAlign: "left", cursor: "pointer", color: "inherit", font: "inherit", border: 0, boxShadow: r?.paperAt ? "0 0 0 3px var(--good)" : r?.solvedAt ? "0 0 0 3px var(--p3)" : undefined }}
                >
                  <Sprite name={SPRITE[item.kind]} size={28} />
                  <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: 1 }}>
                    <span className="pixel" style={{ fontSize: 8, color: lv.color }}>
                      {t(lv.label)} · {t(KINDS.find((k) => k.id === item.kind)!.label)}{item.mode === "paper" ? ` · ${t("practice.paper")}` : ""}
                    </span>
                    <span style={{ fontSize: 17, lineHeight: 1.2 }}>{tx(item.prompt)}</span>
                    <span style={{ fontSize: 14, color: "var(--p3)" }}>{tx(item.where)}</span>
                  </span>
                  {r?.solvedAt && (
                    <span title={t(r.paperAt ? "practice.badgePaper" : "practice.badgeSolved")} aria-label={t(r.paperAt ? "practice.badgePaper" : "practice.badgeSolved")}>
                      <Sprite name="star" size={18} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
