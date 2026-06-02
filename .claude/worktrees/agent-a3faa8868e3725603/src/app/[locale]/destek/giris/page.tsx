import type { Metadata } from "next";
import GirisClient from "./GirisClient";

export const metadata: Metadata = {
  title: "Müşteri Girişi | Lider Network Destek",
  robots: { index: false },
};

export default function GirisPage() {
  return <GirisClient />;
}
