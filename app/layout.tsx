import type { Metadata, Viewport } from "next";
import { DotGothic16, Press_Start_2P, VT323 } from "next/font/google";
import { GameFrame } from "@/components/ui/GameFrame";
import { Providers } from "@/components/ui/Providers";
import "./globals.css";

const press = Press_Start_2P({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-press" });
const dot = DotGothic16({ weight: "400", subsets: ["latin"], variable: "--font-dot" });
const vt = VT323({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-vt" });

export const metadata: Metadata = {
  title: "Bit Forge",
  description: "Aprende lenguajes de programación jugando un arcade retro.",
};

export const viewport: Viewport = { themeColor: "#2a1206", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-palette="orange" className={`${press.variable} ${dot.variable} ${vt.variable}`}>
      <body>
        <Providers>
          <GameFrame>{children}</GameFrame>
        </Providers>
      </body>
    </html>
  );
}
