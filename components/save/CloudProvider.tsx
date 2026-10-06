"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { CLOUD_ENABLED, cloudClient, cloudTransport } from "@/lib/cloud/client";
import { CardSync } from "@/lib/cloud/sync";
import { fingerprint, type Conflict } from "@/lib/cloud/model";
import { readReplica, readSetting, writeReplica, writeSetting } from "@/lib/cloud/storage";
import { deleteSlot, getActiveSlot, getStorageScope, listSlots, readSlot, setStorageScope, writeSlot } from "@/lib/save/store";
import { SLOT_COUNT, type SaveData } from "@/lib/save/schema";

type Mode = "local" | "cloud" | null;
export type CloudStatus = "local" | "syncing" | "synced" | "offline" | "conflict";
interface CloudContext {
  ready: boolean; cardReady: boolean; available: boolean; mode: Mode; status: CloudStatus; account: string | null;
  conflicts: Conflict[]; choosing: boolean; loginError: boolean;
  chooseLocal(): void; chooseGoogle(next?: string | null): Promise<void>; showChoice(): void;
  cancelChoice(): void; signOut(): Promise<void>; sync(): Promise<void>;
  resolve(slot: number, choice: "local" | "remote"): Promise<void>;
  bringLocal(): Promise<number>;
}
const Context = createContext<CloudContext | null>(null);
const MODE = "bwq:save-mode";

export function CloudProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [hydrated, setHydrated] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<CloudStatus>("local");
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [choosing, setChoosing] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const engine = useRef<CardSync | null>(null);
  const path = usePathname();
  const pathRef = useRef(path);
  pathRef.current = path;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const user = mode === "cloud" ? session?.user.id ?? null : null;

  const activate = useCallback((next: Mode) => {
    setMode(next);
    if (next) writeSetting(MODE, next);
    setChoosing(false);
  }, []);

  useEffect(() => {
    let alive = true;
    const api = cloudClient();
    const initial = readSetting(MODE);
    if (initial === "local" || initial === "cloud") setMode(initial);
    else if (getActiveSlot()) setMode("local"); // Existing offline saves stay playable.
    if (!api) { setReady(true); return; }
    const { data: { subscription } } = api.auth.onAuthStateChange((event, next) => {
      if (!alive) return;
      setSession(next);
      if (event === "SIGNED_IN" && readSetting(MODE) === "cloud") { activate("cloud"); setLoginError(false); }
      if (event === "SIGNED_OUT") { activate("local"); setStatus("local"); }
    });
    void api.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      setSession(data.session);
      if (error) setLoginError(true);
      setReady(true);
    }).catch(() => { if (alive) { setLoginError(true); setReady(true); } });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [activate]);

  const flush = useCallback(async (pull = true) => {
    const current = engine.current;
    if (!current) return;
    setStatus("syncing");
    try {
      const next = await current.run(pull);
      if (engine.current !== current) return;
      setConflicts(next);
      const pending = getStorageScope() && Array.from({ length: SLOT_COUNT }, (_, i) => i + 1)
        .some((slot) => readReplica(getStorageScope()!, slot).dirty && !current.conflicts.has(slot));
      setStatus(next.length ? "conflict" : pending ? "syncing" : "synced");
      if (pending) {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush(false), 3000);
      }
      window.dispatchEvent(new CustomEvent("bwq:cloud-pulled"));
    } catch {
      if (engine.current === current) setStatus("offline");
    } finally {
      if (engine.current === current) setHydrated(getStorageScope());
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    engine.current?.stop();
    engine.current = null;
    setConflicts([]);
    if (timer.current) clearTimeout(timer.current);
    setStorageScope(user);
    if (!user) { setHydrated(null); setStatus("local"); return; }
    engine.current = new CardSync({
      read: (slot) => readSlot(slot, user),
      apply: (slot, save, generation) => save ? writeSlot(slot, save, user, true, generation) : deleteSlot(slot, user, true, generation),
      replica: (slot) => readReplica(user, slot),
      journal: (slot, replica) => writeReplica(user, slot, replica),
    }, cloudTransport(user));
    void flush();
    const onEdit = (event: Event) => {
      if ((event as CustomEvent<{ user: string }>).detail?.user !== user) return;
      setStatus("syncing");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(false), 3000);
    };
    // Pull when returning to the card; while playing, only upload completed local changes.
    const onOnline = () => void flush(pathRef.current === "/saves");
    const onVisible = () => { if (document.visibilityState === "visible" && pathRef.current === "/saves") void flush(); };
    window.addEventListener("bwq:save-change", onEdit);
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      engine.current?.stop(); engine.current = null;
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener("bwq:save-change", onEdit);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ready, user, flush]);

  useEffect(() => { if (path === "/saves" && user) void flush(); }, [path, user, flush]);

  const chooseGoogle = async (next?: string | null) => {
    const api = cloudClient();
    if (!api) { setLoginError(true); return; }
    setLoginError(false);
    if (session) { activate("cloud"); return; }
    writeSetting(MODE, "cloud");
    const callback = new URL("/auth/callback", window.location.origin);
    // Keep the OAuth redirect identical to the allowlisted URL; remember the game route in this tab.
    try { sessionStorage.setItem("bwq:auth-next", next?.startsWith("/play/") ? next : ""); } catch {}
    try {
      const { error } = await api.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback.href } });
      if (error) setLoginError(true);
    } catch { setLoginError(true); }
  };
  const signOut = async () => {
    // Disconnect locally even while offline, preserving this account's pending saves in its namespace.
    await cloudClient()?.auth.signOut({ scope: "local" }).catch(() => {});
    setSession(null); activate("local"); setStatus("local");
  };
  const resolve = async (slot: number, choice: "local" | "remote") => {
    const current = engine.current;
    const conflict = current?.conflicts.get(slot);
    if (!current || !conflict || !user) return;
    // Keep the losing snapshot recoverable on this device, even when all 15 slots are full.
    const loser = choice === "local" ? conflict.remote.data : await readSlot(slot, user);
    if (loser) writeSetting(`bwq:cloud:${user}:backup:${slot}`, JSON.stringify(loser));
    await current.resolve(slot, choice);
    await flush(false);
  };
  const bringLocal = async () => {
    if (!user || getStorageScope() !== user) return 0;
    const guest = await listSlots(null);
    const cloud = await listSlots(user);
    let copied = 0;
    for (const entry of guest) {
      if (!entry.save || cloud.some((s) => fingerprint(s.save) === fingerprint(entry.save))) continue;
      const target = cloud.find((s) => !s.save && !s.error && !engine.current?.conflicts.has(s.slot));
      if (!target) break;
      await writeSlot(target.slot, entry.save, user);
      (target as { save: SaveData | null }).save = entry.save;
      copied++;
    }
    await flush(false);
    return copied;
  };
  return <Context.Provider value={{
    ready, cardReady: !user || hydrated === user, available: CLOUD_ENABLED, mode, status, account: session?.user.email ?? null, conflicts,
    choosing, loginError, chooseLocal: () => activate("local"), chooseGoogle,
    showChoice: () => setChoosing(true), cancelChoice: () => setChoosing(false), signOut,
    sync: () => flush(), resolve, bringLocal,
  }}>{children}</Context.Provider>;
}

export function useCloud() {
  const value = useContext(Context);
  if (!value) throw new Error("useCloud outside CloudProvider");
  return value;
}
