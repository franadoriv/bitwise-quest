"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cloudRow, MAX_CLOUD_BYTES, supabaseOrigin } from "./model.ts";
import type { CloudTransport } from "./sync.ts";
import { SLOT_COUNT } from "../save/schema.ts";

export const CLOUD_ORIGIN = supabaseOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const CLOUD_ENABLED = !!CLOUD_ORIGIN && !!key?.startsWith("sb_publishable_");
let client: SupabaseClient | null = null;
export function cloudClient(): SupabaseClient | null {
  if (!CLOUD_ENABLED || typeof window === "undefined") return null;
  return client ??= createClient(CLOUD_ORIGIN!, key!, {
    auth: { flowType: "pkce", detectSessionInUrl: false, persistSession: true, autoRefreshToken: true },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(15_000) }) },
  });
}

export function cloudTransport(user: string): CloudTransport {
  const api = cloudClient();
  if (!api) throw new Error("cloud_not_configured");
  return {
    async list() {
      const { data, error } = await api.from("cloud_saves").select("slot,revision,data").eq("user_id", user).order("slot").limit(SLOT_COUNT);
      if (error) throw new Error("cloud_unavailable");
      return (data ?? []).map(cloudRow);
    },
    async write(slot, revision, save) {
      if (new TextEncoder().encode(JSON.stringify(save)).length > MAX_CLOUD_BYTES) throw new Error("cloud_save_too_large");
      const { data, error } = await api.rpc("sync_cloud_save", { p_slot: slot, p_expected_revision: revision, p_data: save });
      if (error) throw new Error("cloud_unavailable");
      return data?.[0] ? cloudRow(data[0]) : null;
    },
  };
}

// Deduplicates React Strict Mode mounts: an OAuth code can only be exchanged once.
let exchange: { code: string; result: Promise<void> } | null = null;
export function finishGoogleLogin(code: string): Promise<void> {
  if (exchange?.code === code) return exchange.result;
  const api = cloudClient();
  if (!api) return Promise.reject(new Error("cloud_not_configured"));
  const result = api.auth.exchangeCodeForSession(code).then(({ error }) => { if (error) throw new Error("login_failed"); });
  exchange = { code, result };
  return result;
}
