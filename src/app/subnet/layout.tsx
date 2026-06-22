import type { Metadata, Viewport } from "next";

const BASE = "https://subnet.lidernetwork.com.tr";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: "Subnet Hesaplayıcı | Lider Network",
  description: "IP/CIDR subnet hesaplayıcı: Network adresi, broadcast, kullanılabilir host aralığı, netmask, wildcard ve binary gösterim. IPv4 için ücretsiz online subnet aracı.",
  keywords: ["subnet hesaplayıcı", "cidr hesaplama", "subnet calculator", "network adresi", "broadcast adresi", "netmask hesaplama", "ip aralığı hesaplama", "subnetting", "Lider Network"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
  alternates: { canonical: BASE },
  openGraph: {
    type: "website",
    url: BASE,
    title: "Subnet Hesaplayıcı | Lider Network",
    description: "IP/CIDR subnet hesaplayıcı: network, broadcast, host aralığı, netmask ve binary gösterim — ücretsiz.",
    siteName: "Lider Network",
    images: [{ url: "https://www.lidernetwork.com.tr/og-image.png", width: 1200, height: 630, alt: "Subnet Hesaplayıcı - Lider Network" }],
  },
  twitter: { card: "summary_large_image", site: "@lidernetwork" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e27",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Subnet Hesaplayıcı",
  url: BASE,
  description: "IP adresi ve CIDR notasyonunu girerek network adresi, broadcast, kullanılabilir host aralığı, netmask ve wildcard bilgilerini anında hesaplayın.",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  inLanguage: "tr-TR",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
  author: { "@type": "Organization", name: "Lider Network", url: "https://www.lidernetwork.com.tr" },
  featureList: ["CIDR subnet hesaplama", "Network ve broadcast adresi", "Kullanılabilir host aralığı", "Netmask ve wildcard mask", "Binary gösterim", "Host sayısı hesaplama"],
};

export default function SubnetLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
