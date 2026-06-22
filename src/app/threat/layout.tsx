import type { Metadata, Viewport } from "next";

const BASE = "https://threat.lidernetwork.com.tr";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: "Tehdit İstihbaratı Feed | Lider Network",
  description: "SGB/USOM zararlı bağlantı listelerini FortiGate External Connector ile uyumlu TXT feed formatında sunan ücretsiz servis. Domain, IP ve URL listeleri saatlik güncellenir.",
  keywords: ["tehdit istihbaratı", "threat intelligence feed", "FortiGate external connector", "USOM zararlı bağlantı", "SGB feed", "zararlı IP listesi", "zararlı domain listesi", "Lider Network"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
  alternates: { canonical: BASE },
  openGraph: {
    type: "website",
    url: BASE,
    title: "Tehdit İstihbaratı Feed | Lider Network",
    description: "SGB/USOM zararlı domain, IP ve URL listelerini FortiGate External Connector formatında sunar. Saatlik güncelleme. Ücretsiz.",
    siteName: "Lider Network",
    images: [{ url: "https://www.lidernetwork.com.tr/og-image.png", width: 1200, height: 630, alt: "Tehdit İstihbaratı Feed - Lider Network" }],
  },
  twitter: { card: "summary_large_image", site: "@lidernetwork" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080c1f",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Tehdit İstihbaratı Feed",
  url: BASE,
  description: "SGB/USOM zararlı bağlantı listelerini FortiGate External Connector ile uyumlu TXT feed olarak sunar. Domain, IP ve URL listeleri saatlik güncellenir.",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  inLanguage: "tr-TR",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
  author: { "@type": "Organization", name: "Lider Network", url: "https://www.lidernetwork.com.tr" },
  featureList: ["USOM zararlı URL feed", "SGB domain/IP listeleri", "FortiGate External Connector uyumlu TXT format", "Saatlik otomatik güncelleme", "Ücretsiz tehdit istihbaratı"],
};

export default function ThreatLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
