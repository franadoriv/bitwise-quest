import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: `Terms of Service | ${BRAND.name}` };
export default function Terms() { return <LegalPage kind="terms" />; }
