"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { format, type MessageKey, type Vars } from "@/lib/i18n/messages";
import { tx as resolve, type Locale, type Text } from "@/lib/i18n/text";

const Ctx = createContext<{ locale: Locale; setLocale(l: Locale): void }>({ locale: "en", setLocale: () => {} });

export function I18nProvider({ initial, children }: { initial: Locale; children: React.ReactNode }) {
  const [locale, setState] = useState<Locale>(initial);
  const setLocale = useCallback((l: Locale) => {
    document.cookie = `locale=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
    setState(l);
  }, []);
  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** t(key, vars) for UI strings, tx(text) for localized content. */
export function useI18n() {
  const { locale, setLocale } = useContext(Ctx);
  const t = useCallback((key: MessageKey, vars?: Vars) => format(locale, key, vars), [locale]);
  const tx = useCallback((text: Text | undefined | null) => resolve(text, locale), [locale]);
  return { locale, setLocale, t, tx };
}
