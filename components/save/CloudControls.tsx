"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/ui/I18n";
import { useCloud } from "./CloudProvider";
import { downloadSave } from "@/lib/save/store";
import { levelFromXp } from "@/lib/game-rules";

export function CloudStatus({ compact = false }: { compact?: boolean }) {
  const { mode, status } = useCloud();
  const { t } = useI18n();
  const router = useRouter();
  const state = mode === "cloud" ? status : "local";
  return <button className={`cloud-status ${compact ? "compact" : ""}`} onClick={() => router.push("/saves")}
    title={t(`cloud.status.${state}`)} aria-label={t(`cloud.status.${state}`)}>
    <span aria-hidden className={`cloud-led ${state}`} /><span className="pixel" role="status">{t(`cloud.status.${state}`)}</span>
  </button>;
}

export function CloudControls() {
  const cloud = useCloud();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const action = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await fn(); } catch { setNotice(t("cloud.status.offline")); } finally { setBusy(false); }
  };
  const conflict = cloud.conflicts[0];
  useEffect(() => {
    if (!conflict) return;
    const previous = document.activeElement;
    dialog.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, [conflict?.slot]);
  return <>
    <div className="cloud-toolbar">
      <CloudStatus />
      {cloud.mode === "cloud" ? <>
        <span className="cloud-account" title={cloud.account ?? undefined}>{cloud.account}</span>
        <button className="btn small" disabled={busy || cloud.status === "syncing"} onClick={() => void action(cloud.sync)}>{t("cloud.sync")}</button>
        <button className="btn small" disabled={busy || cloud.status === "syncing"} onClick={() => void action(async () => {
          const copied = await cloud.bringLocal(); setNotice(t("cloud.copied", { n: copied }));
        })}>{t("cloud.bringLocal")}</button>
        <button className="btn small" disabled={busy} onClick={cloud.showChoice}>{t("cloud.switchMode")}</button>
        <button className="btn small" disabled={busy} onClick={() => void action(cloud.signOut)}>{t("cloud.signOut")}</button>
      </> : <>
        <span className="cloud-local-reminder">{t("cloud.localReminder")}</span>
        <button className="btn small" onClick={cloud.showChoice}>{t("cloud.connect")}</button>
      </>}
    </div>
    {notice && <div className="cloud-notice" role="status">{notice}<button className="btn small" onClick={() => setNotice(null)}>{t("card.confirm")}</button></div>}
    {conflict && <div ref={dialog} className="cloud-conflict-overlay" role="dialog" aria-modal="true" aria-labelledby="cloud-conflict-title" onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const buttons = [...(dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <section className="box dark cloud-conflict scroll">
        <span className="pixel save-eyebrow">{t("cloud.conflictTag", { slot: conflict.slot })}</span>
        <h2 className="pixel" id="cloud-conflict-title">{t("cloud.conflictTitle")}</h2><p>{t("cloud.conflictHint")}</p>
        <div className="cloud-conflict-versions">
          {(["local", "remote"] as const).map((choice) => {
            const save = choice === "local" ? conflict.local : conflict.remote.data;
            return <article key={choice} className="cloud-conflict-version">
              <h3 className="pixel">{t(choice === "local" ? "cloud.thisDevice" : "cloud.inCloud")}</h3>
              <p>{save ? `${save.player.name} · ${t("card.level", { n: levelFromXp(save.stats.xp) })}` : t("cloud.deleted")}</p>
              {save && <p>{t("cloud.playMinutes", { n: Math.floor(save.player.playMs / 60_000) })}</p>}
              <button className="btn small" disabled={!save || busy} onClick={() => save && void action(() => downloadSave(save))}>{t("card.export")}</button>
              <button className="btn primary" disabled={busy} onClick={() => void action(() => cloud.resolve(conflict.slot, choice))}>
                {t(choice === "local" ? "cloud.keepLocal" : "cloud.keepCloud")}
              </button>
            </article>;
          })}
        </div>
        <p className="save-note">{t("cloud.conflictBackup")}</p>
      </section>
    </div>}
  </>;
}
