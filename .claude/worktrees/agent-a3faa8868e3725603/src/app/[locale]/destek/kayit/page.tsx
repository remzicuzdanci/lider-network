import type { Metadata } from "next";
import KayitClient from "./KayitClient";

export const metadata: Metadata = {
  title: "Kayıt Ol | Lider Network Destek",
  robots: { index: false },
};

export default function KayitPage() {
  return <KayitClient />;
}
