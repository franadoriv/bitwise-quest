import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: `Privacy Policy | ${BRAND.name}` };
export default function Privacy() { return <LegalPage kind="privacy" />; }
