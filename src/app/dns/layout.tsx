import type { Metadata, Viewport } from "next";

const baseUrl = "https://dns.lidernetwork.com.tr";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.lidernetwork.com.tr"),
  title: "DNS Sorgulama & Domain Aracı | Lider Network",
  description:
    "Ücretsiz DNS sorgulama aracı: A, MX, TXT, NS kayıtları, WHOIS, SPF/DKIM/DMARC mail ayarları, SSL sertifika kontrolü ve DNS propagasyon. Lider Network tarafından.",
  keywords: ["DNS sorgulama", "DNS kayıt kontrol", "WHOIS sorgu", "MX kayıt", "SPF DKIM DMARC", "SSL kontrol", "DNS propagasyon", "Lider Network"],
  robots: { index: true, follow: true },
  alternates: { canonical: baseUrl },
  openGraph: {
    type: "website",
    title: "DNS Sorgulama & Domain Aracı | Lider Network",
    description: "A/MX/TXT/NS, WHOIS, SPF/DKIM/DMARC, SSL ve DNS propagasyon — tek araçta, ücretsiz.",
    siteName: "Lider Network",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e27",
};

export default function DnsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
