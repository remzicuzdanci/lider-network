import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.lidernetwork.com.tr"),
  title: "Tehdit İstihbaratı Feed | Lider Network",
  description: "SGB/USOM zararlı bağlantı listelerini FortiGate External Connector ile uyumlu TXT feed formatında sunan ücretsiz servis. Domain, IP ve URL listeleri saatlik güncellenir.",
  keywords: ["tehdit istihbaratı", "FortiGate external connector", "USOM zararlı bağlantı", "SGB feed", "threat intelligence", "DNSBL", "Lider Network"],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://threat.lidernetwork.com.tr" },
  openGraph: {
    type: "website",
    title: "Tehdit İstihbaratı Feed | Lider Network",
    description: "SGB/USOM zararlı domain, IP ve URL listelerini FortiGate External Connector formatında sunar. Saatlik güncelleme.",
    siteName: "Lider Network",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080c1f",
};

export default function ThreatLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
