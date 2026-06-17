import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SSL Sertifika Kontrolü — Lider Network",
  description: "Herhangi bir alan adının SSL sertifikasını anında kontrol edin. Geçerlilik, bitiş tarihi, yayıncı ve SAN bilgileri.",
};

export default function SSLLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
