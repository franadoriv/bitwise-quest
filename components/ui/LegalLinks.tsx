"use client";
import Link from "next/link";
import { useI18n } from "./I18n";

export function LegalLinks() {
  const { t } = useI18n();
  return <nav className="legal-links" aria-label={t("legal.links")}>
    <Link href="/privacy">{t("legal.privacy")}</Link>
    <span aria-hidden>·</span>
    <Link href="/terms">{t("legal.terms")}</Link>
  </nav>;
}
