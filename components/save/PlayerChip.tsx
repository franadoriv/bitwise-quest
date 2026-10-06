"use client";
import { levelFromXp } from "@/lib/game-rules";
import { useI18n } from "@/components/ui/I18n";
import { useSave } from "./SaveProvider";
import { CloudStatus } from "./CloudControls";

/** Player name + level, with a blinking memory-card light while autosaving. */
export function PlayerChip() {
  const { save, saving } = useSave();
  const { t } = useI18n();
  if (!save) return null;
  return (
    <div className="pixel" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10 }} title={saving ? t("card.saving") : undefined}>
      <span aria-hidden className={saving ? "blink" : undefined} style={{ width: 10, height: 10, background: saving ? "var(--red)" : "var(--p1)", boxShadow: "0 0 0 2px var(--p0)" }} />
      <span style={{ color: "var(--gold)" }}>{save.player.name}</span>
      <span>{t("common.level")} {levelFromXp(save.stats.xp)}</span>
      <CloudStatus compact />
    </div>
  );
}
