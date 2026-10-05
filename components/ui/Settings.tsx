"use client";
import { useEffect, useState } from "react";
import { DEFAULT_PALETTE, PALETTE_ORDER, applyPalette, currentPalette, type PaletteId } from "@/lib/palette";
import { audioPrefs, sfx } from "@/lib/sfx";
import { useI18n } from "@/components/ui/I18n";
import { LOCALES, LOCALE_NAMES, LOCALE_SHORT } from "@/lib/i18n/text";

/** Palette + audio toggles, used in every HUD. */
export function Settings() {
  const { t, locale, setLocale } = useI18n();
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
    try { localStorage.setItem("bwq:palette", next); } catch {}
    setPalette(next);
    sfx.select();
    window.dispatchEvent(new CustomEvent("bwq:palette", { detail: next }));
  };

  const nextLocale = () => {
    const next = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];
    setLocale(next);
    sfx.select();
  };

  return (
    <div style={{ display: "flex", gap: 4 }}>
      <button className="btn small" onClick={nextLocale} title={`${t("settings.language")}: ${LOCALE_NAMES[locale]}`} aria-label={`${t("settings.language")}: ${LOCALE_NAMES[locale]}`}>
        {LOCALE_SHORT[locale]}
      </button>
      <button className="btn small" onClick={toggle} title={t("settings.palette")} aria-label={t("settings.palette")}>
        {({ orange: "ORG", gb: "GB", nes: "NES" } as const)[palette]}
      </button>
      <button className="btn small" onClick={() => { audioPrefs.setSfx(!snd); setSnd(!snd); sfx.select(); }} aria-label={t("settings.sfx")} title={t("settings.sfx")}>
        {snd ? "SFX" : "sfx"}
        {!snd && <span aria-hidden> ×</span>}
      </button>
      <button className="btn small" onClick={() => { audioPrefs.setMusic(!mus); setMus(!mus); sfx.select(); }} aria-label={t("settings.music")} title={t("settings.music")}>
        {mus ? "♪" : "♪×"}
      </button>
    </div>
  );
}
