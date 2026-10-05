"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { addPlayTime } from "@/lib/save/progress";
import type { SaveData } from "@/lib/save/schema";
import { getActiveSlot, readSlot, setActiveSlot, writeSlot } from "@/lib/save/store";

interface Ctx {
  ready: boolean;
  slot: number | null;
  save: SaveData | null;
  saving: boolean;
  /** Applies a change and writes it to the active slot (autosave). */
  commit(next: SaveData): Promise<void>;
  load(slot: number): Promise<void>;
  eject(): void;
}

const SaveCtx = createContext<Ctx | null>(null);

export function SaveProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ ready: boolean; slot: number | null; save: SaveData | null }>({ ready: false, slot: null, save: null });
  const [saving, setSaving] = useState(false);
  const saveRef = useRef<SaveData | null>(null);
  saveRef.current = state.save;

  const load = useCallback(async (slot: number) => {
    const save = await readSlot(slot).catch(() => null);
    setActiveSlot(save ? slot : null);
    setState({ ready: true, slot: save ? slot : null, save });
  }, []);

  useEffect(() => {
    const slot = getActiveSlot();
    if (slot) void load(slot);
    else setState({ ready: true, slot: null, save: null });
  }, [load]);

  const commit = useCallback(async (next: SaveData) => {
    const slot = getActiveSlot();
    setState((s) => ({ ...s, save: next }));
    if (!slot) return;
    setSaving(true);
    try {
      await writeSlot(slot, next);
    } finally {
      setTimeout(() => setSaving(false), 600);
    }
  }, []);

  // Play time: credited every minute while a save is loaded and the tab is visible.
  const saveId = state.save?.id;
  useEffect(() => {
    if (!saveId) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === "visible" && saveRef.current) void commit(addPlayTime(saveRef.current, now - last));
      last = now;
    }, 60_000);
    return () => clearInterval(id);
  }, [saveId, commit]);

  const eject = useCallback(() => {
    setActiveSlot(null);
    setState({ ready: true, slot: null, save: null });
  }, []);

  const value = useMemo<Ctx>(() => ({ ...state, saving, commit, load, eject }), [state, saving, commit, load, eject]);
  return <SaveCtx.Provider value={value}>{children}</SaveCtx.Provider>;
}

export function useSave(): Ctx {
  const ctx = useContext(SaveCtx);
  if (!ctx) throw new Error("useSave outside SaveProvider");
  return ctx;
}

/** Renders children only with a loaded save; otherwise sends the player to the memory card. */
export function RequireSave({ children }: { children: (save: SaveData) => React.ReactNode }) {
  const { ready, save } = useSave();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (ready && !save) router.replace(`/saves?next=${encodeURIComponent(path)}`);
  }, [ready, save, router, path]);
  if (!ready || !save) return null;
  return <>{children(save)}</>;
}
