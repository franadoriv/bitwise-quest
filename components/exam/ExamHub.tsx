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

const LEVEL: Record<string, { label: string; sprite: SpriteName; color: string }> = {
  junior: { label: "JUNIOR", sprite: "slime", color: "var(--good)" },
  mid: { label: "SEMI SENIOR", sprite: "golem", color: "var(--gold)" },
  senior: { label: "SENIOR", sprite: "dragon", color: "var(--red)" },
};

export function ExamHub({ language, exams }: { language: LanguageView; exams: ExamSummary[] }) {
  const router = useRouter();
  const portrait = useOrientation() === "portrait";

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
        <Link href={`/play/${language.slug}`} className="btn small" onClick={() => sfx.select()}>◀ MAPA</Link>
        <div style={{ flex: 1 }} />
        <Settings />
      </header>
      <main className="scroll" style={{ flex: 1, minHeight: 0, padding: "8px 24px 24px" }}>
        <h1 className="pixel" style={{ fontSize: portrait ? 18 : 26, color: "var(--gold)" }}>PRUEBA DE INGRESO · {language.name}</h1>
        <p style={{ fontSize: 19, margin: "10px 0 22px", maxWidth: 820 }}>
          Simula la evaluación técnica que hacen las empresas al contratar para puestos con {language.name}. Las preguntas cambian en cada intento y al final verás tu desempeño por tema.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${portrait ? 1 : Math.max(1, exams.length)}, 1fr)`, gap: 16 }}>
          {exams.map((e) => {
            const lv = LEVEL[e.level] ?? LEVEL.junior;
            return (
              <div key={e.slug} className="exam-card box dark" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Sprite name={lv.sprite} size={48} flip />
                  <div>
                    <div className="pixel" style={{ fontSize: 10, color: lv.color }}>{lv.label}</div>
                    <div className="pixel" style={{ fontSize: 13, marginTop: 6 }}>{e.title}</div>
                  </div>
                </div>
                <p style={{ fontSize: 17, lineHeight: 1.35, flex: 1 }}>{e.description}</p>
                <div className="pixel" style={{ fontSize: 9, lineHeight: 2, color: "var(--p2)" }}>
                  {e.count} PREGUNTAS · {e.secondsPerQuestion}s C/U<br />APRUEBA CON {e.passPct}% · BANCO DE {e.bankSize}
                </div>
                <div className="pixel" style={{ fontSize: 9, minHeight: 14, color: e.best?.passed ? "var(--good)" : "var(--p2)" }}>
                  {e.best ? `MEJOR: ${e.best.pct}% ${e.best.passed ? "· APROBADO" : ""} · ${e.attempts} INTENTO${e.attempts === 1 ? "" : "S"}` : "SIN INTENTOS"}
                </div>
                <button className="btn primary" onClick={(ev) => start(e.slug, ev.currentTarget)} onMouseEnter={() => sfx.hover()}>
                  ▶ COMENZAR
                </button>
              </div>
            );
          })}
        </div>
        <p className="pixel" style={{ fontSize: 9, color: "var(--p2)", marginTop: 20, lineHeight: 1.8 }}>
          SI DOMINAS LOS TEMAS DE UNA REGIÓN (≥80%), SE MARCA COMO SALTADA EN EL MAPA.
        </p>
      </main>
    </div>
  );
}
