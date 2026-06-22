import type { Metadata, Viewport } from "next";

const BASE = "https://ip.lidernetwork.com.tr";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: "IP Adresi Sorgulama | Lider Network",
  description:
    "IP adresinizi anında öğrenin. Konum, ISP, ASN, PTR kaydı, VPN ve proxy tespiti — ücretsiz, kayıtsız. Lider Network tarafından sunulan ücretsiz ağ aracı.",
  keywords: ["ip adresim nedir", "ip sorgulama", "ip konum", "ip isp", "whois ip", "asn sorgulama", "vpn tespiti", "proxy tespit", "ip analiz", "Lider Network"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
  alternates: { canonical: BASE },
  openGraph: {
    type: "website",
    url: BASE,
    title: "IP Adresi Sorgulama | Lider Network",
    description: "IP adresi, konum, ISP, ASN, PTR ve güvenlik analizi — tek araçta, ücretsiz.",
    siteName: "Lider Network",
    images: [{ url: "https://www.lidernetwork.com.tr/og-image.png", width: 1200, height: 630, alt: "IP Sorgulama - Lider Network" }],
  },
  twitter: { card: "summary_large_image", site: "@lidernetwork" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080d1e",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "IP Adresi Sorgulama",
  url: BASE,
  description: "IP adresinizin konumunu, ISP bilgisini, ASN'ini, PTR kaydını ve VPN/proxy durumunu anında sorgulayın.",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  inLanguage: "tr-TR",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
  author: { "@type": "Organization", name: "Lider Network", url: "https://www.lidernetwork.com.tr" },
  featureList: ["IP konum tespiti", "ISP ve ASN bilgisi", "PTR/rDNS sorgusu", "VPN ve proxy tespiti", "IPv4 ve IPv6 desteği"],
};

export default function IpLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
