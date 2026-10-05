"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import { Settings } from "@/components/ui/Settings";
import { useOrientation } from "@/components/ui/GameFrame";
import { useI18n } from "@/components/ui/I18n";
import { BRAND } from "@/lib/brand";
import { fx } from "@/lib/fx";
import { music, sfx } from "@/lib/sfx";

export function TitleScreen({ guides }: { guides: string[] }) {
  const router = useRouter();
  const portrait = useOrientation() === "portrait";
  const { t, tx } = useI18n();
  const logo = useRef<HTMLHeadingElement>(null);
  const started = useRef(false);

  useEffect(() => { music.play("title"); return () => music.stop(); }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".logo-ch", { y: -220, opacity: 0, stagger: 0.05, duration: 0.6, ease: "bounce.out" });
      gsap.from(".logo-sub", { opacity: 0, y: 20, delay: 0.9, duration: 0.4 });
      gsap.fromTo(".walker", { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, delay: 0.7, duration: 0.5, ease: "back.out(2)" });
      gsap.to(".walker", { y: -4, duration: 0.3, repeat: -1, yoyo: true, ease: "steps(1)", stagger: 0.1, delay: 1.6 });
      gsap.to(".tw", { opacity: 0.15, duration: () => 0.4 + Math.random(), repeat: -1, yoyo: true, ease: "steps(1)", stagger: { each: 0.05, from: "random" } });
    });
    return () => ctx.revert();
  }, []);

  const press = () => {
    if (started.current) return;
    started.current = true;
    sfx.unlock();
    sfx.start();
    fx.flash("var(--white)", 0.7);
    fx.burst(logo.current, { count: 30, spread: 200 });
    setTimeout(() => router.push("/saves"), 350);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); press(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="screen" style={{ position: "relative", overflow: "hidden", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 30 }} onClick={press}>
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 3 }} onClick={(e) => e.stopPropagation()}>
        <Settings />
      </div>
      <div aria-hidden style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 70 }).map((_, i) => (
          <span key={i} className="tw" style={{ position: "absolute", left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, width: i % 5 ? 3 : 6, height: i % 5 ? 3 : 6, background: i % 7 ? "var(--p2)" : "var(--gold)" }} />
        ))}
      </div>
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <h1 ref={logo} className="pixel" aria-label={BRAND.name} style={{ fontSize: portrait ? 40 : 76, color: "var(--gold)", textShadow: "6px 6px 0 var(--red), 12px 12px 0 var(--p1)", lineHeight: 1.2 }}>
          {BRAND.logo.split("").map((c, i) => (
            <span key={i} className="logo-ch" style={{ display: "inline-block", minWidth: c === " " ? "0.5em" : undefined }}>{c}</span>
          ))}
        </h1>
        <p className="pixel logo-sub" style={{ fontSize: portrait ? 10 : 13, color: "var(--p3)", marginTop: 16 }}>{tx(BRAND.tagline).toUpperCase()}</p>
      </div>
      <div style={{ display: "flex", gap: portrait ? 18 : 34, alignItems: "flex-end", position: "relative", zIndex: 1 }} aria-hidden>
        <span className="walker"><Sprite name="hero" size={portrait ? 56 : 80} /></span>
        {guides.map((g) => <span key={g} className="walker"><Sprite name={g} size={portrait ? 48 : 68} flip /></span>)}
      </div>
      <button className="pixel blink" style={{ fontSize: portrait ? 14 : 18, color: "var(--white)", position: "relative", zIndex: 1, padding: 12 }} onClick={press}>
        {t("title.pressStart")}
      </button>
    </div>
  );
}
