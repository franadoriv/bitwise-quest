"use client";
import { useEffect, useState } from "react";
import { DEFAULT_PALETTE, PALETTE_ORDER, applyPalette, currentPalette, type PaletteId } from "@/lib/palette";
import { audioPrefs, sfx } from "@/lib/sfx";

/** Palette + audio toggles, used in every HUD. */
export function Settings() {
  const [palette, setPalette] = useState<PaletteId>(DEFAULT_PALETTE);
  const [snd, setSnd] = useState(true);
  const [mus, setMus] = useState(true);
  useEffect(() => {
    setPalette(currentPalette());
    setSnd(audioPrefs.sfx);
    setMus(audioPrefs.music);
  }, []);

  const toggle = () => {
    const next = PALETTE_ORDER[(PALETTE_ORDER.indexOf(palette) + 1) % PALETTE_ORDER.length];
    applyPalette(next);
    try { localStorage.setItem("bf:palette", next); } catch {}
    setPalette(next);
    sfx.select();
    window.dispatchEvent(new CustomEvent("bf:palette", { detail: next }));
  };

  return (
    <div style={{ display: "flex", gap: 4 }}>
      <button className="btn small" onClick={toggle} title="Cambiar paleta" aria-label="Cambiar paleta">
        {({ orange: "NRJ", gb: "GB", nes: "NES" } as const)[palette]}
      </button>
      <button className="btn small" onClick={() => { audioPrefs.setSfx(!snd); setSnd(!snd); sfx.select(); }} aria-label="Efectos de sonido" title="Efectos">
        {snd ? "SFX" : "sfx"}
        {!snd && <span aria-hidden> ×</span>}
      </button>
      <button className="btn small" onClick={() => { audioPrefs.setMusic(!mus); setMus(!mus); sfx.select(); }} aria-label="Música" title="Música">
        {mus ? "♪" : "♪×"}
      </button>
    </div>
  );
}
