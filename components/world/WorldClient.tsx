"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import { Settings } from "@/components/ui/Settings";
import { useOrientation } from "@/components/ui/GameFrame";
import type { WorldView } from "@/lib/repo";
import { fx } from "@/lib/fx";
import { music, sfx } from "@/lib/sfx";

const WorldMap3D = dynamic(() => import("./WorldMap3D").then((m) => m.WorldMap3D), {
  ssr: false,
  loading: () => <div className="pixel blink" style={{ display: "grid", placeItems: "center", height: "100%", fontSize: 12 }}>CARGANDO MUNDO...</div>,
});

export function WorldClient({ world }: { world: WorldView }) {
  const router = useRouter();
  const portrait = useOrientation() === "portrait";
  const { regions, player, language } = world;
  const lastUnlocked = Math.max(0, regions.reduce((acc, r, i) => (r.unlocked ? i : acc), 0));
  const [selected, setSelected] = useState(lastUnlocked);
  const [showIntro, setShowIntro] = useState(world.isNew);
  const panel = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const region = regions[selected];
  const mapRegions = useMemo(
    () => regions.map((r) => ({ name: r.name, theme: r.theme, unlocked: r.unlocked, completed: r.completed, soon: r.status === "soon" })),
    [regions],
  );
  const nextLesson = region.lessons.find((l) => l.unlocked && !l.completed);

  useEffect(() => {
    music.play("map");
    return () => music.stop();
  }, []);

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
        <Link href="/" className="btn small" onClick={() => sfx.select()}>◀ {language.name}</Link>
        <div className="pixel" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10 }}>
          <span style={{ color: "var(--gold)" }}>NV {player.level}</span>
          <div style={{ width: 90, height: 8, background: "var(--p1)", boxShadow: "0 0 0 2px var(--p3)" }} title={`${player.levelCurrent}/${player.levelNeeded} XP`}>
            <div style={{ width: `${pct}%`, height: "100%", background: "var(--good)" }} />
          </div>
        </div>
        <span className="pixel" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}><Sprite name="coin" size={16} /> {player.coins}</span>
        <span className="pixel" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4, color: player.streak ? "var(--gold)" : "var(--p2)" }} title="Racha de días">
          <Sprite name="flame" size={16} /> {player.streak} {player.streak === 1 ? "DÍA" : "DÍAS"}
        </span>
        <div style={{ flex: 1 }} />
        <Link href={`/play/${language.slug}/exam`} className="btn small" onClick={() => sfx.select()}>PRUEBA DE INGRESO</Link>
        {world.reviewDue > 0 && (
          <Link href={`/play/${language.slug}/review`} className="btn danger small blink-soft" onClick={() => sfx.select()}>
            ⚔ BUGS ERRANTES ({world.reviewDue})
          </Link>
        )}
        <Settings />
      </header>

      {/* MAP */}
      <div style={{ flex: 1, minHeight: 0, position: "relative", margin: "0 16px" }} className="box">
        <WorldMap3D regions={mapRegions} selected={selected} onSelect={select} />
        <div style={{ position: "absolute", left: 8, bottom: 8, display: "flex", gap: 4 }}>
          <button className="btn small" onClick={() => select(Math.max(0, selected - 1))} aria-label="Región anterior">◀</button>
          <button className="btn small" onClick={() => select(Math.min(regions.length - 1, selected + 1))} aria-label="Región siguiente">▶</button>
        </div>
      </div>

      {/* REGION PANEL */}
      <main ref={panel} className="scroll" style={{ padding: "14px 16px 18px", width: "100%", flex: "0 0 auto", maxHeight: portrait ? "48%" : "40%" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <h1 className="pixel" style={{ fontSize: 18, color: "var(--gold)" }}>{region.name.toUpperCase()}</h1>
          <span style={{ fontSize: 18, color: "var(--p2)" }}>{region.subtitle}</span>
        </div>

        {region.status === "soon" ? (
          <div className="box dark" style={{ padding: 20, display: "flex", gap: 16, alignItems: "center" }}>
            <Sprite name="lock" size={40} />
            <p style={{ fontSize: 19 }}>Esta región está en construcción. Ferro está forjando nuevos retos. ¡Vuelve pronto!</p>
          </div>
        ) : !region.unlocked ? (
          <div className="box dark" style={{ padding: 20, display: "flex", gap: 16, alignItems: "center" }}>
            <Sprite name="lock" size={40} />
            <p style={{ fontSize: 19 }}>Derrota al jefe de la región anterior para abrir el camino.</p>
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
                    <span>{l.mode === "boss" ? "☠ JEFE" : `${selected + 1}-${i + 1}`}</span>
                    {!l.unlocked && <Sprite name="lock" size={14} />}
                    {isNext && <span>▶ JUGAR</span>}
                  </span>
                  <span style={{ fontSize: 11, lineHeight: 1.5 }}>{l.title}</span>
                  <span style={{ display: "flex", gap: 2, alignItems: "center" }}>
                    {l.skipped ? (
                      <span style={{ fontSize: 8 }}>SALTADA</span>
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
              <Sprite name="master" size={72} />
              <div>
                <div className="pixel" style={{ fontSize: 11, color: "var(--gold)", marginBottom: 6 }}>FERRO</div>
                <p style={{ fontSize: 19 }}>¡Bienvenido al reino de {language.name}! ¿Es tu primera vez con este lenguaje?</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button className="btn primary" onClick={() => { setShowIntro(false); start(regions[0].lessons[0].slug); }}>SOY NOVATO · ENSÉÑAME DESDE CERO</button>
              <button className="btn" onClick={() => { sfx.start(); router.push(`/play/${language.slug}/exam`); }}>YA SÉ ALGO · PRUEBA DE INGRESO</button>
              <button className="btn small" onClick={() => { sfx.select(); setShowIntro(false); }}>SOLO QUIERO MIRAR EL MAPA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
