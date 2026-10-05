// Localized text shared by content packs (run directly by Node) and the UI.
// No imports here on purpose: this file is loaded by scripts/ without a bundler.

export const LOCALES = ["en", "es", "ja"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_NAMES: Record<Locale, string> = { en: "English", es: "Español", ja: "日本語" };
/** Short label for the in-game language button. */
export const LOCALE_SHORT: Record<Locale, string> = { en: "EN", es: "ES", ja: "日本" };

/** Prose shown to the player, in every supported locale. */
export type Localized = Record<Locale, string>;

/** A plain string is language-neutral (code, numbers, identifiers). Prose must be Localized. */
export type Text = string | Localized;

export const isLocalized = (t: unknown): t is Localized =>
  typeof t === "object" && t !== null && LOCALES.every((l) => typeof (t as Record<string, unknown>)[l] === "string");

/** Resolves a Text for a locale, falling back to English. */
export function tx(t: Text | undefined | null, locale: Locale): string {
  if (t == null) return "";
  if (typeof t === "string") return t;
  return t[locale] || t.en;
}

/** Compact constructor for content files: L("Hello", "Hola", "こんにちは"). */
export const L = (en: string, es: string, ja: string): Localized => ({ en, es, ja });

export const isLocale = (v: unknown): v is Locale => typeof v === "string" && (LOCALES as readonly string[]).includes(v);

/** Picks the best supported locale from an Accept-Language header or navigator.languages. */
export function negotiateLocale(langs: string | readonly string[] | undefined | null): Locale {
  const list = typeof langs === "string" ? langs.split(",").map((s) => s.split(";")[0].trim()) : [...(langs ?? [])];
  for (const l of list) {
    const base = l.toLowerCase().slice(0, 2);
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
