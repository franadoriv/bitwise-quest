import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The game draws its own full-screen UI; the dev indicator would overlap the HUD.
  devIndicators: false,
};

export default nextConfig;
