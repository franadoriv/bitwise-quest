"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import { useI18n } from "@/components/ui/I18n";
import { useOrientation } from "@/components/ui/GameFrame";
import type { LanguageView } from "@/lib/repo";
import { fx } from "@/lib/fx";
import { sfx } from "@/lib/sfx";

export interface Destination { language: LanguageView; done: number; total: number }

/**
 * "Where to land?": shown when a planet or moon is tapped. The background dims, the planet and each of
 * its framework moons are offered as cards; hovering one previews it with the camera, choosing one
 * closes the modal and the landing dive starts.
 */
export function DestinationModal({ planet, moons, highlight, onHighlight, onChoose, onClose }: {
  planet: Destination;
  moons: Destination[];
  /** null: the planet; otherwise a moon index. */
  highlight: number | null;
  onHighlight(moon: number | null): void;
  onChoose(moon: number | null): void;
  onClose(): void;
}) {
  const { t, tx } = useI18n();
  const portrait = useOrientation() === "portrait";
  const dim = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const leaving = useRef(false);
  const all = [planet, ...moons];
  const idxOf = (h: number | null) => (h == null ? 0 : h + 1);

  useEffect(() => {
    sfx.whoosh();
    gsap.fromTo(dim.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" });
    gsap.fromTo(box.current, { y: 30, scale: 0.85, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.32, ease: "back.out(2)" });
    if (list.current) gsap.fromTo(list.current.children, { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, stagger: 0.06, delay: 0.1, ease: "back.out(2)" });
  }, []);

  /** Fade the dim and the modal away, then run `then` (choose = start the landing dive). */
  const leave = (then: () => void) => {
    if (leaving.current) return;
    leaving.current = true;
    gsap.to(box.current, { y: 20, scale: 0.92, opacity: 0, duration: 0.2, ease: "power2.in" });
    gsap.to(dim.current, { opacity: 0, duration: 0.28, ease: "power1.in", onComplete: then });
  };
  const choose = (i: number) => {
    const d = all[i];
    if (d.language.status !== "active") { sfx.wrong(); fx.shake(cards.current[i] ?? null, 6); return; }
    sfx.select();
    fx.pop(cards.current[i] ?? null, 1.06);
    leave(() => onChoose(i === 0 ? null : i - 1));
  };
  const close = () => { sfx.select(); leave(onClose); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cur = idxOf(highlight);
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); choose(cur); }
      const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (step) {
        e.preventDefault();
        e.stopPropagation();
        const next = Math.max(0, Math.min(all.length - 1, cur + step));
        if (next !== cur) { sfx.hover(); onHighlight(next === 0 ? null : next - 1); }
      }
    };
    // capture: the galaxy's own arrow keys must not fire while choosing
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  return (
    <div ref={dim} style={{ position: "absolute", inset: 0, background: "rgba(8,4,16,.62)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 650, padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={box} className="box dark" role="dialog" aria-modal="true" aria-labelledby="dest-title" style={{ width: portrait ? "100%" : 560, maxHeight: "100%", overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div id="dest-title" className="pixel" style={{ fontSize: 15, color: "var(--gold)" }}>{t("galaxy.chooseTitle")}</div>
          <button className="btn small" onClick={close} aria-label={t("galaxy.close")}>✕</button>
        </div>
        <div ref={list} role="listbox" aria-activedescendant={`dest-${idxOf(highlight)}`} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {all.map((d, i) => {
            const active = idxOf(highlight) === i;
            const isMoon = i > 0;
            const locked = d.language.status !== "active";
            return (
              <button
                key={d.language.slug}
                id={`dest-${i}`}
                ref={(el) => { cards.current[i] = el; }}
                role="option"
                aria-selected={active}
                className={`btn ${active ? "primary" : ""}`}
                onMouseEnter={() => { if (!active) { sfx.hover(); onHighlight(isMoon ? i - 1 : null); } }}
                onFocus={() => { if (!active) onHighlight(isMoon ? i - 1 : null); }}
                onClick={() => choose(i)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: isMoon ? "8px 12px" : "12px 14px", marginLeft: isMoon ? 22 : 0, textAlign: "left", textTransform: "none", opacity: locked ? 0.55 : 1, boxShadow: active ? "0 0 0 3px var(--gold)" : undefined }}
              >
                <Sprite name={locked ? "lock" : d.language.planet.guide.sprite} size={isMoon ? 32 : 44} />
                <span style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                  <span className="pixel" style={{ fontSize: isMoon ? 10 : 12 }}>{tx(d.language.planet.name)}</span>
                  <span style={{ fontSize: 15, fontFamily: "var(--font-body)" }}>
                    {t(isMoon ? "galaxy.moonKind" : "galaxy.planetKind")} · {d.language.name}
                  </span>
                </span>
                <span className="pixel" style={{ fontSize: 9, color: locked ? "var(--p1)" : "var(--p0)", whiteSpace: "nowrap" }}>
                  {locked ? t("common.soon") : `${d.done}/${d.total}`}
                </span>
              </button>
            );
          })}
        </div>
        {/* keyboard shortcuts: not useful on touch screens */}
        {!portrait && <div className="pixel" style={{ fontSize: 8, color: "var(--p2)" }}>{t("galaxy.chooseHint")}</div>}
      </div>
    </div>
  );
}
