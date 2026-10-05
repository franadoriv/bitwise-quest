import { connection } from "next/server";
import { TitleScreen } from "@/components/title/TitleScreen";
import { getLanguages, getPlayer } from "@/lib/repo";

export default async function Home() {
  await connection();
  return <TitleScreen languages={getLanguages()} player={getPlayer()} />;
}
