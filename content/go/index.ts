import type { LanguagePack } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { gopherVillage } from "./regions/gopher-village.ts";
import { sliceForest } from "./regions/slice-forest.ts";
import { interfaceCastle } from "./regions/interface-castle.ts";
import { channelTower } from "./regions/channel-tower.ts";
import { exams } from "./exams.ts";
import { topics } from "./topics.ts";
import { planet } from "./planet.ts";

// Planet Concurra: Go. Exercises compile and run on the official Go Playground (via /api/run).
export const go: LanguagePack = {
  slug: "go",
  name: "GO",
  tagline: L("Simple concurrency with goroutines", "Concurrencia simple con goroutines", "goroutine でシンプルな並行処理"),
  color: "#0099db",
  status: "active",
  runner: "go-playground",
  codeLang: "go",
  planet: planet,
  regions: [gopherVillage, sliceForest, interfaceCastle, channelTower],
  topics,
  exams,
};
