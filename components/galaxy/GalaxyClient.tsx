"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import { Settings } from "@/components/ui/Settings";
import { useI18n } from "@/components/ui/I18n";
import { useOrientation } from "@/components/ui/GameFrame";
import { RequireSave, useSave } from "@/components/save/SaveProvider";
import { PlayerChip } from "@/components/save/PlayerChip";
import type { LanguageView } from "@/lib/repo";
import { fx } from "@/lib/fx";
import { music, sfx } from "@/lib/sfx";

const Galaxy3D = dynamic(() => import("./Galaxy3D").then((m) => m.Galaxy3D), { ssr: false });

export interface MoonEntry { language: LanguageView; lessonSlugs: string[] }
export interface PlanetEntry extends MoonEntry { moons: MoonEntry[] }

export function GalaxyClient({ planets }: { planets: PlanetEntry[] }) {
  return <RequireSave>{() => <Galaxy planets={planets} />}</RequireSave>;
}

function Galaxy({ planets }: { planets: PlanetEntry[] }) {
  const { t, tx } = useI18n();
  const portrait = useOrientation() === "portrait";
  const router = useRouter();
  const { save, eject } = useSave();
  const startIdx = Math.max(0, planets.findIndex((p) => p.language.slug === save?.lastLang));
  const [selected, setSelected] = useState(startIdx);
  const panel = useRef<HTMLDivElement>(null);
  const cur = planets[selected];
  const lang = cur.language;
  const done = cur.lessonSlugs.filter((s) => save?.langs[lang.slug]?.lessons[s]?.doneAt).length;

  const meshes = useMemo(
    () => planets.map((p) => ({ slug: p.language.slug, label: tx(p.language.planet.name), surface: p.language.planet.colors.surface, accent: p.language.planet.colors.accent, ring: p.language.planet.colors.ring, moons: p.language.planet.moons, locked: p.language.status !== "active", frameworkMoons: p.moons.map((m) => ({ color: m.language.planet.colors.accent, locked: m.language.status !== "active" })) })),
    [planets, tx],
  );

  useEffect(() => { music.play("galaxy"); return () => music.stop(); }, []);
  useEffect(() => { gsap.fromTo(panel.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "back.out(2)" }); }, [selected]);

  const select = (i: number) => { if (i === selected || i < 0 || i >= planets.length) return; sfx.whoosh(); setSelected(i); };
  const land = (el: Element | null, target: LanguageView = lang) => {
    if (target.status !== "active") { sfx.wrong(); fx.shake(el, 8); return; }
    sfx.start();
    fx.flash("var(--white)", 0.6);
    setTimeout(() => router.push(`/play/${target.slug}`), 300);
  };
  const doneIn = (m: MoonEntry) => m.lessonSlugs.filter((s) => save?.langs[m.language.slug]?.lessons[s]?.doneAt).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") select(selected + 1);
      if (e.key === "ArrowLeft") select(selected - 1);
      if (e.key === "Enter") land(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="screen">
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", zIndex: 2 }}>
        <PlayerChip />
        <h1 className="pixel" style={{ fontSize: portrait ? 12 : 15, color: "var(--gold)" }}>{t("galaxy.title")}</h1>
        <div style={{ flex: 1 }} />
        <button className="btn small" onClick={() => { sfx.select(); eject(); router.push("/saves"); }}>{t("card.switch")}</button>
        <Settings />
      </header>
      <div style={{ flex: 1, minHeight: 0, position: "relative", margin: "0 16px" }} className="box">
        <Galaxy3D planets={meshes} selected={selected} onSelect={select} />
        <div style={{ position: "absolute", left: 8, bottom: 8, display: "flex", gap: 4 }}>
          <button className="btn small" onClick={() => select(selected - 1)} aria-label={t("galaxy.prev")}>◀</button>
          <button className="btn small" onClick={() => select(selected + 1)} aria-label={t("galaxy.next")}>▶</button>
        </div>
      </div>
      <main ref={panel} className="scroll" style={{ padding: "12px 16px 16px", flex: "0 0 auto", maxHeight: portrait ? "52%" : "40%" }}>
        <div style={{ display: "grid", gridTemplateColumns: portrait ? "1fr" : "auto 1fr auto", gap: 18, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ background: "var(--p1)", padding: 6, boxShadow: "0 0 0 4px var(--p3)" }}><Sprite name={lang.planet.guide.sprite} size={64} /></div>
            <div>
              <div className="pixel" style={{ fontSize: 9, color: "var(--p2)" }}>{t("galaxy.guide")}</div>
              <div className="pixel" style={{ fontSize: 13, color: "var(--gold)", marginTop: 4 }}>{tx(lang.planet.guide.name)}</div>
              <div style={{ fontSize: 15, marginTop: 2 }}>{tx(lang.planet.guide.title)}</div>
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
              <span className="pixel" style={{ fontSize: 18, color: "var(--gold)" }}>{tx(lang.planet.name).toUpperCase()}</span>
              <span className="pixel" style={{ fontSize: 9, color: "var(--p2)" }}>{t("galaxy.language")}: {lang.name}</span>
              {lang.status === "active" && <span className="pixel" style={{ fontSize: 9, color: "var(--good)" }}>{t("galaxy.progress", { done, total: cur.lessonSlugs.length })}</span>}
            </div>
            <p style={{ fontSize: 17, lineHeight: 1.35, marginTop: 6 }}>{tx(lang.planet.story)}</p>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
              <span className="pixel" style={{ fontSize: 8, color: "var(--p2)" }}>{t("galaxy.bugs")}</span>
              {lang.planet.bugs.map((b) => <Sprite key={b} name={b} size={28} />)}
              {cur.moons.length > 0 && <span className="pixel" style={{ fontSize: 8, color: "var(--p2)", marginLeft: 14 }}>{t("galaxy.moons")}</span>}
              {cur.moons.map((m) => (
                <button
                  key={m.language.slug}
                  className={`btn small ${m.language.status === "active" ? "good" : ""}`}
                  onClick={(e) => land(e.currentTarget, m.language)}
                  title={tx(m.language.planet.story)}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Sprite name={m.language.planet.guide.sprite} size={18} />
                  {tx(m.language.planet.name)} · {m.language.name}
                  {m.language.status === "active" ? ` · ${doneIn(m)}/${m.lessonSlugs.length}` : ` · ${t("common.soon")}`}
                </button>
              ))}
            </div>
          </div>
          <button className={`btn ${lang.status === "active" ? "primary" : ""}`} disabled={lang.status !== "active"} onClick={(e) => land(e.currentTarget)} style={{ fontSize: 14, padding: "14px 20px" }}>
            {lang.status === "active" ? t("galaxy.land") : t("galaxy.locked")}
          </button>
        </div>
      </main>
    </div>
  );
}
