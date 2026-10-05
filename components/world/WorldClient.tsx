"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import { Settings } from "@/components/ui/Settings";
import { useOrientation } from "@/components/ui/GameFrame";
import { useI18n } from "@/components/ui/I18n";

function WorldLoading() {
  const { t } = useI18n();
  return <div className="pixel blink" style={{ display: "grid", placeItems: "center", height: "100%", fontSize: 12 }}>{t("world.loading")}</div>;
}
import type { LanguageView } from "@/lib/repo";
import { RequireSave, useSave } from "@/components/save/SaveProvider";
import { PlayerChip } from "@/components/save/PlayerChip";
import { levelProgress } from "@/lib/game-rules";
import { markLanded, worldState, type WorldContent } from "@/lib/save/progress";
import type { SaveData } from "@/lib/save/schema";
import { fx } from "@/lib/fx";
import { music, sfx } from "@/lib/sfx";

const WorldMap3D = dynamic(() => import("./WorldMap3D").then((m) => m.WorldMap3D), {
  ssr: false,
  loading: () => <WorldLoading />,
});

type Content = WorldContent & { language: LanguageView };

export function WorldClient({ content }: { content: Content }) {
  return <RequireSave>{(save) => <World content={content} save={save} />}</RequireSave>;
}

function World({ content, save }: { content: Content; save: SaveData }) {
  const router = useRouter();
  const portrait = useOrientation() === "portrait";
  const { t, tx } = useI18n();
  const { commit } = useSave();
  const language = content.language;
  const guide = language.planet.guide;
  const world = useMemo(() => worldState(content, save.langs[language.slug]), [content, save, language.slug]);
  const { regions } = world;
  const lp = levelProgress(save.stats.xp);
  const player = { level: lp.level, levelCurrent: lp.current, levelNeeded: lp.needed, coins: save.stats.coins, streak: save.stats.streak };
  const lastUnlocked = Math.max(0, regions.reduce((acc, r, i) => (r.unlocked ? i : acc), 0));
  const [selected, setSelected] = useState(lastUnlocked);
  const [showIntro, setShowIntro] = useState(!save.langs[language.slug]?.landedAt);
  const closeIntro = () => { setShowIntro(false); void commit(markLanded(save, language.slug)); };
  const panel = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const region = regions[selected];
  const mapRegions = useMemo(
    () => regions.map((r) => ({ name: tx(r.name), theme: r.theme, unlocked: r.unlocked, completed: r.completed, soon: r.status === "soon" })),
    [regions, tx],
  );
  const nextLesson = region.lessons.find((l) => l.unlocked && !l.completed);

  useEffect(() => {
    music.play(`map:${language.slug}`);
    return () => music.stop();
  }, [language.slug]);

  useEffect(() => {
    gsap.fromTo(panel.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "back.out(2)" });
  }, [selected]);

  useEffect(() => {
    if (!nextRef.current) return;
    const t = gsap.to(nextRef.current, { y: -4, duration: 0.35, repeat: -1, yoyo: true, ease: "steps(2)" });
    return () => { t.kill(); };
  }, [selected, nextLesson?.slug]);

  const select = (i: number) => {
    if (i === selected) return;
    sfx.select();
    setSelected(i);
  };

  const start = (slug: string, el?: Element | null) => {
    sfx.start();
    fx.burst(el ?? null, { count: 20 });
    fx.flash("var(--white)", 0.5);
    setTimeout(() => router.push(`/play/${language.slug}/lesson/${slug}`), 250);
  };

  const pct = Math.round((player.levelCurrent / Math.max(1, player.levelNeeded)) * 100);

  return (
    <div className="screen">
      {/* HUD */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", flexWrap: "wrap", zIndex: 2 }}>
        <Link href="/galaxy" className="btn small" onClick={() => sfx.select()}>{t("world.toGalaxy")}</Link>
        <PlayerChip />
        <div className="pixel" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10 }}>
          <div style={{ width: 90, height: 8, background: "var(--p1)", boxShadow: "0 0 0 2px var(--p3)" }} title={`${player.levelCurrent}/${player.levelNeeded} XP`}>
            <div style={{ width: `${pct}%`, height: "100%", background: "var(--good)" }} />
          </div>
        </div>
        <span className="pixel" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}><Sprite name="coin" size={16} /> {player.coins}</span>
        <span className="pixel" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4, color: player.streak ? "var(--gold)" : "var(--p2)" }} title={t("world.streak")}>
          <Sprite name="flame" size={16} /> {t(player.streak === 1 ? "world.day" : "world.days", { n: player.streak })}
        </span>
        <div style={{ flex: 1 }} />
        <Link href={`/play/${language.slug}/exam`} className="btn small" onClick={() => sfx.select()}>{t("world.exam")}</Link>
        {world.reviewDue > 0 && (
          <Link href={`/play/${language.slug}/review`} className="btn danger small blink-soft" onClick={() => sfx.select()}>
            {t("world.review", { n: world.reviewDue })}
          </Link>
        )}
        <Settings />
      </header>

      {/* MAP */}
      <div style={{ flex: 1, minHeight: 0, position: "relative", margin: "0 16px" }} className="box">
        <WorldMap3D regions={mapRegions} selected={selected} onSelect={select} />
        <div style={{ position: "absolute", left: 8, bottom: 8, display: "flex", gap: 4 }}>
          <button className="btn small" onClick={() => select(Math.max(0, selected - 1))} aria-label={t("world.prevRegion")}>◀</button>
          <button className="btn small" onClick={() => select(Math.min(regions.length - 1, selected + 1))} aria-label={t("world.nextRegion")}>▶</button>
        </div>
      </div>

      {/* REGION PANEL */}
      <main ref={panel} className="scroll" style={{ padding: "14px 16px 18px", width: "100%", flex: "0 0 auto", maxHeight: portrait ? "48%" : "40%" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <h1 className="pixel" style={{ fontSize: 18, color: "var(--gold)" }}>{tx(region.name).toUpperCase()}</h1>
          <span style={{ fontSize: 18, color: "var(--p2)" }}>{tx(region.subtitle)}</span>
        </div>

        {region.status === "soon" ? (
          <div className="box dark" style={{ padding: 20, display: "flex", gap: 16, alignItems: "center" }}>
            <Sprite name="lock" size={40} />
            <p style={{ fontSize: 19 }}>{t("world.soonRegion", { name: tx(guide.name) })}</p>
          </div>
        ) : !region.unlocked ? (
          <div className="box dark" style={{ padding: 20, display: "flex", gap: 16, alignItems: "center" }}>
            <Sprite name="lock" size={40} />
            <p style={{ fontSize: 19 }}>{t("world.lockedRegion")}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${portrait ? 2 : 4}, 1fr)`, gap: 10 }}>
            {region.lessons.map((l, i) => {
              const isNext = l.slug === nextLesson?.slug;
              return (
                <button
                  key={l.slug}
                  ref={isNext ? nextRef : undefined}
                  className={`btn ${isNext ? "primary" : l.mode === "boss" ? "danger" : ""}`}
                  disabled={!l.unlocked}
                  onMouseEnter={() => l.unlocked && sfx.hover()}
                  onClick={(e) => start(l.slug, e.currentTarget)}
                  style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 8, padding: 14, minHeight: 96 }}
                >
                  <span style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 9, opacity: 0.8 }}>
                    <span>{l.mode === "boss" ? t("world.boss") : `${selected + 1}-${i + 1}`}</span>
                    {!l.unlocked && <Sprite name="lock" size={14} />}
                    {isNext && <span>{t("world.playNext")}</span>}
                  </span>
                  <span style={{ fontSize: 11, lineHeight: 1.5 }}>{tx(l.title)}</span>
                  <span style={{ display: "flex", gap: 2, alignItems: "center" }}>
                    {l.skipped ? (
                      <span style={{ fontSize: 8 }}>{t("world.skipped")}</span>
                    ) : (
                      [0, 1, 2].map((s) => <Sprite key={s} name={s < l.stars ? "star" : "starEmpty"} size={14} />)
                    )}
                    {l.mastery != null && <span style={{ fontSize: 8, marginLeft: "auto" }}>{l.mastery}%</span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {showIntro && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", display: "grid", placeItems: "center", zIndex: 600, padding: 16 }}>
          <div className="box dark" style={{ padding: 24, maxWidth: 520, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <Sprite name={guide.sprite} size={72} />
              <div>
                <div className="pixel" style={{ fontSize: 11, color: "var(--gold)", marginBottom: 6 }}>{tx(guide.name).toUpperCase()}</div>
                <p style={{ fontSize: 19 }}>{t("world.landing", { planet: tx(language.planet.name), player: save.player.name, guide: tx(guide.name), lang: language.name })}</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button className="btn primary" onClick={() => { closeIntro(); start(regions[0].lessons[0].slug); }}>{t("world.newbie")}</button>
              <button className="btn" onClick={() => { sfx.start(); closeIntro(); router.push(`/play/${language.slug}/exam`); }}>{t("world.knowSome")}</button>
              <button className="btn small" onClick={() => { sfx.select(); closeIntro(); }}>{t("world.justLook")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
