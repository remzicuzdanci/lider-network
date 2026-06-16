import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.lidernetwork.com.tr"),
  title: "IP Adresi Sorgulama | Lider Network",
  description:
    "IP adresinizi anında öğrenin. Konum, ISP, ASN, PTR kaydı, VPN ve proxy tespiti — ücretsiz, kayıtsız.",
  keywords: ["ip adresim nedir", "ip sorgulama", "ip konum", "ip isp", "whois ip", "asn sorgulama", "Lider Network"],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://ip.lidernetwork.com.tr" },
  openGraph: {
    type: "website",
    title: "IP Adresi Sorgulama | Lider Network",
    description: "IP adresi, konum, ISP, ASN, PTR ve güvenlik analizi — tek araçta.",
    siteName: "Lider Network",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080d1e",
};

export default function IpLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
