"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import { Settings } from "@/components/ui/Settings";
import { useI18n } from "@/components/ui/I18n";
import { useOrientation } from "@/components/ui/GameFrame";
import { levelFromXp } from "@/lib/game-rules";
import { fx } from "@/lib/fx";
import type { Text } from "@/lib/i18n/text";
import type { MessageKey } from "@/lib/i18n/messages";
import { SaveError } from "@/lib/save/migrate";
import { NAME_MAX, SLOT_COUNT, newSave, type SaveData } from "@/lib/save/schema";
import { deleteSlot, exportSlot, listSlots, readSaveFile, writeSlot, type SlotEntry } from "@/lib/save/store";
import { music, sfx } from "@/lib/sfx";
import { useSave } from "./SaveProvider";

export interface PlanetBadge { slug: string; name: Text; guideSprite: string; color: string }

type Modal =
  | { kind: "name"; slot: number }
  | { kind: "delete"; slot: number; name: string }
  | { kind: "pick"; incoming: SaveData }
  | { kind: "overwrite"; slot: number; name: string; incoming: SaveData }
  | { kind: "message"; text: string };

const ERR: Record<SaveError["code"], MessageKey> = { format: "card.errFormat", checksum: "card.errChecksum", newer: "card.errNewer", corrupt: "card.errCorrupt" };

export function MemoryCard({ planets }: { planets: PlanetBadge[] }) {
  const { t, tx, locale } = useI18n();
  const portrait = useOrientation() === "portrait";
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { load } = useSave();
  const [slots, setSlots] = useState<SlotEntry[]>([]);
  const [cursor, setCursor] = useState(0);
  const [modal, setModal] = useState<Modal | null>(null);
  const [name, setName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cols = portrait ? 3 : 5;

  const refresh = useCallback(async () => setSlots(await listSlots()), []);
  useEffect(() => {
    void refresh();
    music.play("card");
    const onChange = () => void refresh();
    window.addEventListener("bwq:slots", onChange);
    return () => { window.removeEventListener("bwq:slots", onChange); music.stop(); };
  }, [refresh]);

  useEffect(() => {
    if (slots.length) gsap.fromTo(".mc-block", { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.025, duration: 0.25, ease: "back.out(2)" });
  }, [slots.length]);

  const used = slots.filter((s) => s.save).length;
  const current = slots[cursor];
  const planetOf = (save: SaveData) => planets.find((p) => p.slug === save.lastLang) ?? null;
  const fmtDate = (ms: number) => new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(ms);
  const fmtTime = (ms: number) => { const m = Math.floor(ms / 60000); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`; };

  const go = async (slot: number) => {
    sfx.start();
    fx.flash("var(--white)", 0.5);
    await load(slot);
    router.push(next && next.startsWith("/play/") ? next : "/galaxy");
  };

  const act = (i = cursor) => {
    const s = slots[i];
    if (!s || modal) return;
    setCursor(i);
    if (s.save) void go(s.slot);
    else { sfx.select(); setName(""); setModal({ kind: "name", slot: s.slot }); }
  };

  const createGame = async () => {
    if (modal?.kind !== "name" || !name.trim()) return;
    await writeSlot(modal.slot, newSave(name));
    setModal(null);
    await go(modal.slot);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const incoming = await readSaveFile(file);
      sfx.coin();
      setModal({ kind: "pick", incoming });
    } catch (e) {
      sfx.wrong();
      setModal({ kind: "message", text: t(e instanceof SaveError ? ERR[e.code] : "card.errCorrupt") });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const pickTarget = async (s: SlotEntry) => {
    if (modal?.kind !== "pick") return;
    if (s.save) { sfx.wrong(); setModal({ kind: "overwrite", slot: s.slot, name: s.save.player.name, incoming: modal.incoming }); return; }
    await importInto(s.slot, modal.incoming);
  };

  const importInto = async (slot: number, save: SaveData) => {
    await writeSlot(slot, save);
    sfx.levelUp();
    setCursor(slot - 1);
    setModal(null);
    const el = gridRef.current?.children[slot - 1] ?? null;
    fx.burst(el, { count: 24 });
    fx.float(el, t("card.imported", { slot }), "var(--good)");
  };

  // keyboard: arrows move, Enter acts, Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modal) { if (e.key === "Escape") setModal(null); return; }
      const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
      if (d) { e.preventDefault(); setCursor((c) => Math.min(SLOT_COUNT - 1, Math.max(0, c + d))); sfx.blip(); }
      if (e.key === "Enter") act();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const picking = modal?.kind === "pick";

  return (
    <div className="screen">
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", flexWrap: "wrap" }}>
        <button className="btn small" onClick={() => { sfx.select(); router.push("/"); }}>◀ {t("card.back")}</button>
        <div>
          <h1 className="pixel" style={{ fontSize: portrait ? 15 : 20, color: "var(--gold)" }}>{t("card.title")}</h1>
          <div className="pixel" style={{ fontSize: 9, color: "var(--p2)", marginTop: 4 }}>{t("card.subtitle", { used, total: SLOT_COUNT })}</div>
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn small" onClick={() => fileRef.current?.click()}>⇪ {t("card.import")}</button>
        <input ref={fileRef} type="file" accept=".bwq,application/octet-stream" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
        <Settings />
      </header>

      {picking && (
        <div className="pixel blink-soft" style={{ textAlign: "center", fontSize: 11, color: "var(--gold)", padding: "0 16px 6px" }}>
          {t("card.pickSlot", { name: modal.incoming.player.name })} · <span style={{ color: "var(--p2)" }}>{t("card.pickSlotHint")}</span>
          <button className="btn small" style={{ marginLeft: 10 }} onClick={() => setModal(null)}>{t("card.cancel")}</button>
        </div>
      )}

      <main className="scroll" style={{ flex: 1, minHeight: 0, padding: "6px 16px 12px" }}>
        <div ref={gridRef} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
          {slots.map((s, i) => {
            const sel = i === cursor;
            const p = s.save ? planetOf(s.save) : null;
            return (
              <button
                key={s.slot}
                className="mc-block box"
                onMouseEnter={() => { if (!modal || picking) { setCursor(i); sfx.hover(); } }}
                onClick={() => (picking ? void pickTarget(s) : act(i))}
                aria-label={`Slot ${s.slot}`}
                style={{
                  padding: 10, textAlign: "left", minHeight: portrait ? 118 : 132, cursor: "pointer",
                  background: s.save ? "var(--p3)" : "var(--p1)", color: s.save ? "var(--p0)" : "var(--p2)",
                  outline: sel ? "4px solid var(--gold)" : picking ? `3px dashed ${s.save ? "var(--red)" : "var(--good)"}` : "none", outlineOffset: 4,
                  display: "flex", flexDirection: "column", gap: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="pixel" style={{ fontSize: 10 }}>{String(s.slot).padStart(2, "0")}</span>
                  {s.save && <Sprite name={p?.guideSprite ?? "hero"} size={30} />}
                </div>
                {s.save ? (
                  <>
                    <span className="pixel" style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.save.player.name}</span>
                    <span className="pixel" style={{ fontSize: 9 }}>{t("card.level", { n: levelFromXp(s.save.stats.xp) })} · {p ? tx(p.name) : "—"}</span>
                    <span style={{ fontSize: 14 }}>{t("card.played", { time: fmtTime(s.save.player.playMs) })}</span>
                    <span style={{ fontSize: 13, opacity: 0.75 }}>{fmtDate(s.save.player.updatedAt)}</span>
                  </>
                ) : (
                  <span className="pixel" style={{ fontSize: 10, margin: "auto", color: s.error ? "var(--red)" : undefined }}>
                    {s.error ? t("card.corrupt") : t("card.empty")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {!picking && current && (
        <footer style={{ display: "flex", gap: 8, padding: "8px 16px 14px", justifyContent: "center", flexWrap: "wrap" }}>
          {current.save ? (
            <>
              <button className="btn primary" onClick={() => act()}>{t("card.continue")}</button>
              <button className="btn" onClick={async () => { await exportSlot(current.slot); sfx.coin(); fx.float(gridRef.current?.children[cursor] ?? null, t("card.exported"), "var(--good)"); }}>⇩ {t("card.export")}</button>
              <button className="btn danger" onClick={() => { sfx.wrong(); setModal({ kind: "delete", slot: current.slot, name: current.save!.player.name }); }}>{t("card.delete")}</button>
            </>
          ) : current.error ? (
            <button className="btn danger" onClick={() => { sfx.wrong(); setModal({ kind: "delete", slot: current.slot, name: t("card.corrupt") }); }}>{t("card.delete")}</button>
          ) : (
            <button className="btn primary" onClick={() => act()}>{t("card.newGame")}</button>
          )}
        </footer>
      )}

      {modal && modal.kind !== "pick" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.72)", display: "grid", placeItems: "center", zIndex: 600, padding: 16 }}>
          <div className="box dark" style={{ padding: 24, width: "min(560px, 100%)", display: "flex", flexDirection: "column", gap: 16 }}>
            {modal.kind === "name" && (
              <form onSubmit={(e) => { e.preventDefault(); void createGame(); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <Sprite name="hero" size={64} />
                  <p style={{ fontSize: 20 }}>{t("card.askName")}</p>
                </div>
                <input
                  autoFocus
                  value={name}
                  maxLength={NAME_MAX}
                  onChange={(e) => { setName(e.target.value); sfx.key(); }}
                  placeholder={t("card.namePlaceholder")}
                  aria-label={t("card.namePlaceholder")}
                  className="pixel"
                  style={{ fontSize: 18, padding: "12px 14px", background: "var(--p0)", color: "var(--gold)", border: "4px solid var(--p2)", outline: "none", textTransform: "uppercase" }}
                />
                <div className="pixel" style={{ fontSize: 9, color: "var(--p2)", textAlign: "right" }}>{name.length}/{NAME_MAX}</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button type="button" className="btn" onClick={() => setModal(null)}>{t("card.cancel")}</button>
                  <button type="submit" className="btn primary" disabled={!name.trim()}>{t("card.start")}</button>
                </div>
              </form>
            )}
            {modal.kind === "delete" && (
              <>
                <p style={{ fontSize: 19 }}>{t("card.deleteWarn", { name: modal.name, slot: modal.slot })}</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button className="btn" onClick={() => setModal(null)}>{t("card.cancel")}</button>
                  <button className="btn danger" onClick={() => { deleteSlot(modal.slot); sfx.drop(); setModal(null); }}>{t("card.delete")}</button>
                </div>
              </>
            )}
            {modal.kind === "overwrite" && (
              <>
                <p style={{ fontSize: 19, color: "var(--gold)" }}>⚠ {t("card.overwriteWarn", { slot: modal.slot, name: modal.name, newName: modal.incoming.player.name })}</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button className="btn" onClick={() => setModal({ kind: "pick", incoming: modal.incoming })}>{t("card.cancel")}</button>
                  <button className="btn danger" onClick={() => void importInto(modal.slot, modal.incoming)}>{t("card.confirm")}</button>
                </div>
              </>
            )}
            {modal.kind === "message" && (
              <>
                <p style={{ fontSize: 19 }}>{modal.text}</p>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn primary" onClick={() => setModal(null)}>OK</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
