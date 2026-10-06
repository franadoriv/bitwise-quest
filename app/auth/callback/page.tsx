"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { finishGoogleLogin } from "@/lib/cloud/client";
import { callbackDestination } from "@/lib/cloud/model";
import { useI18n } from "@/components/ui/I18n";
import { Sprite } from "@/components/pixel/Sprite";

export default function AuthCallback() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    const params = new URL(window.location.href).searchParams;
    const code = params.get("code");
    if (!code || params.has("error")) { setError(true); return; }
    let next = params.get("next");
    try { next ??= sessionStorage.getItem("bwq:auth-next"); } catch {}
    void finishGoogleLogin(code).then(() => {
      if (alive) {
        try { sessionStorage.removeItem("bwq:auth-next"); } catch {}
        router.replace(callbackDestination(next));
      }
    }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [router]);
  return <div className="screen save-loading">
    <Sprite name="cloudCard" size={100} /><h1 className="pixel">{t(error ? "cloud.loginError" : "cloud.connecting")}</h1>
    {error && <button className="btn primary" onClick={() => router.replace("/saves")}>{t("card.back")}</button>}
  </div>;
}
