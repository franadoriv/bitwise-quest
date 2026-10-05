"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import { Settings } from "@/components/ui/Settings";
import { useOrientation } from "@/components/ui/GameFrame";
import type { LanguageView, PlayerView } from "@/lib/repo";
import { fx } from "@/lib/fx";
import { music, sfx } from "@/lib/sfx";

export function TitleScreen({ languages, player }: { languages: LanguageView[]; player: PlayerView }) {
  const router = useRouter();
  const portrait = useOrientation() === "portrait";
  const [stage, setStage] = useState<"title" | "select">("title");
  const [cursor, setCursor] = useState(0);
  const logo = useRef<HTMLHeadingElement>(null);
  const actors = useRef<HTMLDivElement>(null);
  const carts = useRef<HTMLDivElement>(null);
  const stars = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".logo-ch", { y: -220, opacity: 0, stagger: 0.06, duration: 0.6, ease: "bounce.out" });
      gsap.from(".logo-sub", { opacity: 0, y: 20, delay: 0.9, duration: 0.4 });
      gsap.fromTo(".walk-hero", { x: -120 }, { x: 0, duration: 1.2, delay: 0.6, ease: "steps(12)" });
      gsap.fromTo(".walk-master", { x: 120 }, { x: 0, duration: 1.2, delay: 0.8, ease: "steps(12)" });
      gsap.to(".walk-hero, .walk-master", { y: -4, duration: 0.3, repeat: -1, yoyo: true, ease: "steps(1)", delay: 2 });
      gsap.to(".tw", { opacity: 0.15, duration: () => 0.4 + Math.random(), repeat: -1, yoyo: true, ease: "steps(1)", stagger: { each: 0.05, from: "random" } });
    });
    return () => ctx.revert();
  }, []);

  const press = () => {
    if (stage !== "title") return;
    sfx.unlock();
    sfx.start();
    fx.flash("var(--white)", 0.7);
    fx.burst(logo.current, { count: 30, spread: 200 });
    setStage("select");
    music.play("map");
  };

  useEffect(() => {
    if (stage !== "select") return;
    gsap.fromTo(".cart", { y: 80, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.4, ease: "back.out(2)" });
  }, [stage]);

  const choose = (i: number) => {
    const l = languages[i];
    const el = carts.current?.children[i] ?? null;
    if (l.status !== "active") {
      sfx.wrong();
      fx.shake(el, 8);
      fx.float(el, "¡PRONTO!", "var(--red)");
      return;
    }
    sfx.start();
    fx.burst(el, { count: 24 });
    gsap.to(el, { y: -30, scale: 1.1, duration: 0.25, yoyo: true, repeat: 1 });
    setTimeout(() => router.push(`/play/${l.slug}`), 450);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stage === "title" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); press(); return; }
      if (stage !== "select") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { setCursor((c) => (c + 1) % languages.length); sfx.blip(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { setCursor((c) => (c - 1 + languages.length) % languages.length); sfx.blip(); }
      if (e.key === "Enter") choose(cursor);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => () => music.stop(), []);

  return (
    <div className="screen" style={{ position: "relative", overflow: "hidden", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: stage === "select" ? 18 : 28 }} onClick={stage === "title" ? press : undefined}>
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 3 }} onClick={(e) => e.stopPropagation()}>
        <Settings />
      </div>
      <div ref={stars} aria-hidden style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <span key={i} className="tw" style={{ position: "absolute", left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, width: i % 5 ? 3 : 6, height: i % 5 ? 3 : 6, background: i % 7 ? "var(--p2)" : "var(--gold)" }} />
        ))}
      </div>

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <h1 ref={logo} className="pixel" aria-label="Bit Forge" style={{ fontSize: portrait ? 46 : 84, color: "var(--gold)", textShadow: "6px 6px 0 var(--red), 12px 12px 0 var(--p1)", lineHeight: 1.2 }}>
          {"BIT FORGE".split("").map((c, i) => (
            <span key={i} className="logo-ch" style={{ display: "inline-block", minWidth: c === " " ? "0.5em" : undefined }}>{c}</span>
          ))}
        </h1>
        <p className="pixel logo-sub" style={{ fontSize: portrait ? 10 : 13, color: "var(--p3)", marginTop: 16 }}>
          APRENDE LENGUAJES · JUGANDO
        </p>
      </div>

      <div ref={actors} style={{ display: "flex", gap: 40, alignItems: "flex-end", position: "relative", zIndex: 1 }} aria-hidden>
        <span className="walk-hero"><Sprite name="hero" size={portrait ? 64 : 88} /></span>
        <span className="walk-master"><Sprite name="master" size={portrait ? 64 : 88} flip /></span>
      </div>

      {stage === "title" ? (
        <button className="pixel blink" style={{ fontSize: portrait ? 14 : 18, color: "var(--white)", position: "relative", zIndex: 1, padding: 12 }} onClick={press}>
          ▶ PRESS START
        </button>
      ) : (
        <div style={{ position: "relative", zIndex: 1, width: "min(900px, 100%)" }}>
          <p className="pixel" style={{ fontSize: 11, textAlign: "center", marginBottom: 14, color: "var(--p2)" }}>
            ELIGE UN CARTUCHO {player.xp > 0 && <span style={{ color: "var(--gold)" }}>· NV {player.level} · {player.coins} ORO</span>}
          </p>
          <div ref={carts} style={{ display: "grid", gridTemplateColumns: `repeat(${portrait ? 2 : 4}, 1fr)`, gap: 14 }}>
            {languages.map((l, i) => (
              <button
                key={l.slug}
                className="cart box"
                onMouseEnter={() => { setCursor(i); sfx.hover(); }}
                onClick={() => choose(i)}
                style={{ padding: 0, textAlign: "left", opacity: l.status === "active" ? 1 : 0.55, outline: cursor === i ? "4px solid var(--gold)" : "none", outlineOffset: 6, cursor: "pointer" }}
              >
                <div style={{ height: 14, background: l.color }} />
                <div style={{ padding: "14px 12px 16px" }}>
                  <div className="pixel" style={{ fontSize: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {l.name}
                    {l.status !== "active" && <Sprite name="lock" size={18} />}
                  </div>
                  <p style={{ fontSize: 16, marginTop: 8, minHeight: 44, lineHeight: 1.3 }}>{l.tagline}</p>
                  <div className="pixel" style={{ fontSize: 9, marginTop: 8, color: l.status === "active" ? "var(--red)" : "var(--p1)" }}>
                    {l.status === "active" ? (cursor === i ? "▶ JUGAR" : "JUGAR") : "PRONTO"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
