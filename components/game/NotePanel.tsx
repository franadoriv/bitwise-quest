"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import { useI18n } from "@/components/ui/I18n";
import type { NoteDef } from "@/lib/content/types";
import { sfx } from "@/lib/sfx";
import { CodeBlock } from "./CodeBlock";

/**
 * The "guidebook": the long explanation of the idea behind the current question, opened from the
 * "📖" button at any time. The question waits underneath (its timer paused) and resumes on close.
 */
export function NotePanel({ notes, initialId, lang, guideSprite, cost, onClose }: {
  notes: NoteDef[];
  initialId?: string;
  lang: string;
  guideSprite: string;
  /** What opening it cost: shown so the player knows a second read is free. */
  cost: "charged" | "free" | null;
  onClose(): void;
}) {
  const { t, tx } = useI18n();
  const [id, setId] = useState(initialId && notes.some((n) => n.id === initialId) ? initialId : notes[0]?.id);
  const note = notes.find((n) => n.id === id) ?? notes[0];
  const box = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const book = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  useEffect(() => {
    sfx.whoosh();
    gsap.fromTo(box.current, { y: 60, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.8)" });
    const flap = gsap.to(book.current, { y: -3, duration: 0.3, repeat: -1, yoyo: true, ease: "steps(2)" });
    return () => { flap.kill(); };
  }, []);

  useEffect(() => {
    if (body.current) {
      body.current.scrollTop = 0;
      gsap.fromTo(body.current.children, { x: -10, opacity: 0 }, { x: 0, opacity: 1, duration: 0.2, stagger: 0.04, ease: "steps(3)" });
    }
  }, [id]);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    sfx.select();
    gsap.to(box.current, { y: 40, opacity: 0, duration: 0.18, ease: "power2.in", onComplete: onClose });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!note) return null;
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 640, padding: 12 }} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      {/* flex (not grid) so maxHeight resolves against the screen and long notes scroll inside */}
      <div ref={box} className="box dark" role="dialog" aria-modal="true" aria-labelledby="note-title" style={{ width: "min(880px, 100%)", maxHeight: "100%", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        <header style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 16px", borderBottom: "3px solid var(--p1)" }}>
          <div ref={book}><Sprite name="book" size={32} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pixel" style={{ fontSize: 9, color: "var(--p2)" }}>{t("note.title")}</div>
            <div id="note-title" className="pixel" style={{ fontSize: 13, color: "var(--gold)", marginTop: 4 }}>{tx(note.title)}</div>
          </div>
          <Sprite name={guideSprite} size={40} />
        </header>

        {notes.length > 1 && (
          <nav style={{ display: "flex", gap: 6, padding: "8px 16px 0", flexWrap: "wrap" }}>
            {notes.map((n) => (
              <button key={n.id} className={`btn small ${n.id === note.id ? "primary" : ""}`} onClick={() => { sfx.select(); setId(n.id); }} style={{ textTransform: "none" }}>
                {tx(n.title)}
              </button>
            ))}
          </nav>
        )}

        <div ref={body} className="scroll" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", minHeight: 0, flex: "1 1 auto" }}>
          {note.blocks.map((b, i) =>
            b.t === "p" ? (
              <p key={i} style={{ fontSize: 19, lineHeight: 1.35, margin: 0 }}>{tx(b.text)}</p>
            ) : (
              <div key={i}>
                {b.caption && <div className="pixel" style={{ fontSize: 9, color: "var(--p3)", marginBottom: 6 }}>{tx(b.caption)}</div>}
                <CodeBlock code={b.code} lang={lang} style={{ margin: 0 }} />
                {b.output != null && (
                  <div style={{ background: "var(--p0)", boxShadow: "0 0 0 2px var(--p2)", padding: "6px 10px", marginTop: 4 }}>
                    <div className="pixel" style={{ fontSize: 7, color: "var(--p2)", marginBottom: 2 }}>{t("note.output")}</div>
                    <pre className="code" style={{ margin: 0, color: "var(--good)", fontSize: 18, whiteSpace: "pre-wrap" }}>{b.output}</pre>
                  </div>
                )}
              </div>
            ),
          )}
        </div>

        <footer style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 16px", borderTop: "3px solid var(--p1)", flexWrap: "wrap" }}>
          <span className="pixel blink-soft" style={{ fontSize: 9, color: "var(--p3)", display: "flex", alignItems: "center", gap: 6 }}>
            <Sprite name="clock" size={16} /> {t("note.paused")}
          </span>
          {cost && <span className="pixel" style={{ fontSize: 9, color: cost === "charged" ? "var(--red)" : "var(--good)" }}>{cost === "charged" ? t("lesson.explainCost") : t("lesson.explainFree")}</span>}
          <div style={{ flex: 1 }} />
          <button className="btn primary" onClick={close} autoFocus>{t("note.back")}</button>
        </footer>
      </div>
    </div>
  );
}
