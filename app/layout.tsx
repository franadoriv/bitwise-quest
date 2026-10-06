import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { DotGothic16, Press_Start_2P, VT323 } from "next/font/google";
import { GameFrame } from "@/components/ui/GameFrame";
import { Providers } from "@/components/ui/Providers";
import { I18nProvider } from "@/components/ui/I18n";
import { SaveProvider } from "@/components/save/SaveProvider";
import { BRAND } from "@/lib/brand";
import { isLocale, negotiateLocale } from "@/lib/i18n/text";
import "./globals.css";

const press = Press_Start_2P({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-press" });
// DotGothic16 covers Japanese; the other pixel fonts fall back to it for kana/kanji.
const dot = DotGothic16({ weight: "400", subsets: ["latin"], variable: "--font-dot" });
const vt = VT323({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-vt" });

export const metadata: Metadata = {
  title: BRAND.name,
  description: "A retro arcade game for learning programming languages by playing. First cartridge: Rust.",
};

// The game draws its own 16:9 frame scaled to the screen, so page zoom is disabled (pinch and
// double-tap); text inside the frame scales with it.
export const viewport: Viewport = { themeColor: "#2a1206", width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: "cover" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const saved = (await cookies()).get("locale")?.value;
  const locale = isLocale(saved) ? saved : negotiateLocale((await headers()).get("accept-language"));
  return (
    <html lang={locale} data-palette="orange" className={`${press.variable} ${dot.variable} ${vt.variable}`}>
      <body>
        <I18nProvider initial={locale}>
          <SaveProvider>
            <Providers>
              <GameFrame>{children}</GameFrame>
            </Providers>
          </SaveProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
