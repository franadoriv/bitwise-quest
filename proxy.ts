import { NextResponse, type NextRequest } from "next/server";
import { clientKey, rateLimitHeaders } from "@/lib/security/http";
import { guards } from "@/lib/security/policies";
import { supabaseOrigin } from "@/lib/cloud/model";

// Runs before every page request: per-client rate limit and a per-request nonce for a strict
// Content-Security-Policy. API routes enforce their own (stricter) quotas in their handlers.
export function proxy(request: NextRequest) {
  const decision = guards.pagesPerClient.take(clientKey(request.headers));
  if (!decision.ok) {
    return new NextResponse("Too many requests. Please slow down.", {
      status: 429,
      headers: { ...rateLimitHeaders(decision), "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const dev = process.env.NODE_ENV === "development";
  // Only the configured HTTPS project is allowed; no wildcard Supabase or third-party scripts.
  const cloud = supabaseOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const csp = [
    "default-src 'self'",
    // Next.js injects the nonce into its own scripts; 'strict-dynamic' lets those load their chunks.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // React style={} props render as inline style attributes, so styles allow 'unsafe-inline' (no script risk).
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${cloud ? ` ${cloud}` : ""}${dev ? " ws: wss:" : ""}`,
    "media-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|pyodide/|favicon.ico|icon.svg).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
