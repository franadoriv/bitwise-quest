"use client";
import Link from "next/link";
import { useI18n } from "./I18n";
import { Settings } from "./Settings";
import { LegalLinks } from "./LegalLinks";
import { BRAND } from "@/lib/brand";
import { LEGAL } from "@/lib/legal";
import type { MessageKey } from "@/lib/i18n/messages";

const sections = {
  privacy: ["local", "cloud", "code", "providers", "retention", "rights", "security"],
  terms: ["service", "saves", "use", "ownership", "availability", "changes"],
} as const;

export function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const { t } = useI18n();
  const vars = { brand: BRAND.name, operator: LEGAL.operator };
  return <div className="screen legal-page">
    <header className="legal-nav">
      <Link className="btn small" href="/">◀ {t("legal.home")}</Link>
      <span className="pixel latin legal-brand">{BRAND.logo}</span>
      <Settings />
    </header>
    <main className="scroll legal-scroll" tabIndex={0} aria-label={t(`legal.${kind}`)}>
      <article className="legal-article">
        <p className="pixel legal-eyebrow">{BRAND.logo}</p>
        <h1 className="pixel">{t(`legal.${kind}`)}</h1>
        <p className="legal-date">{t("legal.updated", { date: LEGAL.updated })}</p>
        <p className="legal-intro">{t(`legal.${kind}.intro`, vars)}</p>
        {sections[kind].map((section) => <section key={section}>
          <h2>{t(`legal.${kind}.${section}.title` as MessageKey)}</h2>
          <p>{t(`legal.${kind}.${section}.body` as MessageKey, vars)}</p>
          {kind === "privacy" && section === "providers" && <ul className="legal-providers">
            <li><a href="https://policies.google.com/privacy">Google</a></li>
            <li><a href="https://supabase.com/privacy">Supabase</a></li>
            <li><a href="https://vercel.com/legal/privacy-notice">Vercel</a></li>
            <li><a href="https://play.rust-lang.org/">Rust Playground</a></li>
            <li><a href="https://go.dev/play/">Go Playground</a></li>
            <li><a href="https://godbolt.org/">Compiler Explorer</a></li>
          </ul>}
        </section>)}
        <section>
          <h2>{t("legal.contact")}</h2>
          <p>{t("legal.contactBody", vars)} {LEGAL.email && <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>}</p>
        </section>
        <footer><LegalLinks /></footer>
      </article>
    </main>
  </div>;
}
