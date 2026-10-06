import type { RunResult } from "./types.ts";

export const UNAVAILABLE: RunResult = { ok: false, stdout: "", stderr: "", available: false };
const USER_AGENT = "bitwise-quest (learning game)";

/**
 * POSTs to an upstream sandbox and returns parsed JSON, or null on any failure
 * (timeout, redirect, non-2xx, oversized or malformed body). Details stay on the server.
 */
export async function postJson(url: string, body: string, contentType: string, timeoutMs = 15_000): Promise<unknown> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": contentType, accept: "application/json", "user-agent": USER_AGENT },
      body,
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "error",
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.length > 1_000_000) return null;
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
