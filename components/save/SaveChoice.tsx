"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import { Settings } from "@/components/ui/Settings";
import { LegalLinks } from "@/components/ui/LegalLinks";
import { useI18n } from "@/components/ui/I18n";
import { BRAND } from "@/lib/brand";
import { music, sfx } from "@/lib/sfx";
import { useCloud } from "./CloudProvider";

declare global { interface Window { render_game_to_text?: () => string } }

export function SaveChoice() {
  const cloud = useCloud();
  const { t } = useI18n();
  const next = useSearchParams().get("next");
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<"local" | "cloud" | null>(null);
  useEffect(() => {
    const previous = window.render_game_to_text;
    window.render_game_to_text = () => JSON.stringify({ screen: "save-choice", cloudAvailable: cloud.available, busy, selected });
    return () => { window.render_game_to_text = previous; };
  }, [cloud.available, busy, selected]);
  useEffect(() => {
    music.play("card");
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap.fromTo(".save-choice-heading", { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.3, clearProps: "transform" });
        gsap.fromTo(".save-option", { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.45, ease: "back.out(1.5)", clearProps: "transform" });
      }, root);
      return () => context.revert();
    });
    return () => { media.revert(); music.stop(); };
  }, []);
  const choose = async (option: "local" | "cloud") => {
    if (busy) return;
    sfx.select(); setSelected(option); setBusy(true);
    if (option === "cloud") { await cloud.chooseGoogle(next); setBusy(false); return; }
    sfx.coin();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await new Promise<void>((done) => gsap.to(root.current?.querySelector('[data-option="local"]') ?? {}, {
        scale: 1.025, duration: 0.12, repeat: 1, yoyo: true, onComplete: done,
      }));
    }
    cloud.chooseLocal();
  };
  return <div ref={root} className="screen save-choice" data-save-choice>
    <header className="save-choice-nav">
      <button className="btn small" onClick={() => cloud.choosing ? cloud.cancelChoice() : router.push("/")}>◀ {t("card.back")}</button>
      <span className="pixel latin save-brand">{BRAND.logo}</span><Settings />
    </header>
    <main className="scroll save-choice-main">
      <div className="save-choice-heading">
        <span className="pixel save-eyebrow">{t("cloud.setup")}</span>
        <h1 className="pixel">{t("cloud.chooseTitle")}</h1><p>{t("cloud.chooseHint")}</p>
      </div>
      <div className="save-options">
        <button className={`save-option box dark ${selected === "cloud" ? "selected" : ""}`} data-option="cloud"
          disabled={busy || !cloud.available} onMouseEnter={() => sfx.hover()} onClick={() => void choose("cloud")}>
          <span className="pixel save-option-number">01 <span>{t("cloud.cloudTag")}</span></span>
          <span className="save-art cloud-art" aria-hidden>
            <span className="save-orbit" /><Sprite name="cloudCard" size={100} className="save-hardware" />
            <span className="save-packet packet-one" /><span className="save-packet packet-two" /><span className="save-packet packet-three" />
          </span>
          <h2 className="pixel">{t("cloud.cloudTitle")}</h2><p className="save-description">{t("cloud.cloudHint")}</p>
          <span className="save-note">{t("cloud.cloudNote")}</span>
          <span className="btn primary save-option-action">{busy && selected === "cloud" ? t("cloud.connecting") : t("cloud.google")}</span>
        </button>
        <button className={`save-option box dark ${selected === "local" ? "selected" : ""}`} data-option="local"
          disabled={busy} onMouseEnter={() => sfx.hover()} onClick={() => void choose("local")}>
          <span className="pixel save-option-number">02 <span>{t("cloud.localTag")}</span></span>
          <span className="save-art local-art" aria-hidden><Sprite name="localCard" size={100} className="save-hardware" /><span className="save-local-led" /></span>
          <h2 className="pixel">{t("cloud.localTitle")}</h2><p className="save-description">{t("cloud.localHint")}</p>
          <span className="save-note save-warning">{t("cloud.localWarning")}</span>
          <span className="btn save-option-action">{t("cloud.localButton")}</span>
        </button>
      </div>
      {(!cloud.available || cloud.loginError) && <p role="alert" className="save-login-error">{t(cloud.available ? "cloud.loginError" : "cloud.notConfigured")}</p>}
      <p className="save-choice-foot">{t("cloud.changeLater")}</p>
      <LegalLinks />
    </main>
  </div>;
}

export function SaveGate({ children }: { children: React.ReactNode }) {
  const { ready, cardReady, mode, account, choosing } = useCloud();
  const { t } = useI18n();
  if (!ready) return <div className="screen save-loading"><Sprite name="localCard" size={80} /><p className="pixel">{t("common.loading")}</p></div>;
  if (!mode || choosing || (mode === "cloud" && !account)) return <SaveChoice />;
  if (!cardReady) return <div className="screen save-loading"><Sprite name="cloudCard" size={80} /><p className="pixel">{t("cloud.status.syncing")}</p></div>;
  return <>{children}</>;
}
