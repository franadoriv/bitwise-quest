import { connection } from "next/server";
import { TitleScreen } from "@/components/title/TitleScreen";
import { getLanguages } from "@/lib/repo";

export default async function Home() {
  await connection();
  return <TitleScreen guides={getLanguages().filter((l) => !l.parent).map((l) => l.planet.guide.sprite)} />;
}
