import type { Metadata } from "next";
import DesktekClient from "./DesktekClient";

export const metadata: Metadata = {
  title: "Destek Merkezi | Lider Network",
  description: "Teknik destek talebi oluşturun veya mevcut talebinizi takip edin.",
  robots: { index: false },
};

export default function DesktekPage() {
  return <DesktekClient />;
}
