import type { Metadata, Viewport } from "next";

const BASE = "https://ssl.lidernetwork.com.tr";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: "SSL Sertifika Kontrolü | Lider Network",
  description: "Herhangi bir alan adının SSL/TLS sertifikasını anında kontrol edin. Geçerlilik tarihi, yayıncı (CA), SAN kayıtları, sertifika zinciri ve güvenlik notu — ücretsiz.",
  keywords: ["ssl kontrol", "ssl sertifika sorgulama", "tls sertifika kontrolü", "ssl bitiş tarihi", "ssl geçerlilik kontrolü", "https sertifika", "ssl checker", "Lider Network"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
  alternates: { canonical: BASE },
  openGraph: {
    type: "website",
    url: BASE,
    title: "SSL Sertifika Kontrolü | Lider Network",
    description: "Alan adının SSL sertifikasını kontrol et: geçerlilik, bitiş tarihi, yayıncı ve SAN bilgileri — ücretsiz.",
    siteName: "Lider Network",
    images: [{ url: "https://www.lidernetwork.com.tr/og-image.png", width: 1200, height: 630, alt: "SSL Sertifika Kontrolü - Lider Network" }],
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
  name: "SSL Sertifika Kontrolü",
  url: BASE,
  description: "Alan adınızın SSL/TLS sertifikasını anında kontrol edin: geçerlilik tarihi, yayıncı CA, SAN kayıtları ve sertifika zinciri.",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  inLanguage: "tr-TR",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
  author: { "@type": "Organization", name: "Lider Network", url: "https://www.lidernetwork.com.tr" },
  featureList: ["SSL/TLS sertifika geçerlilik kontrolü", "Sertifika bitiş tarihi uyarısı", "Yayıncı (CA) bilgisi", "SAN (Subject Alternative Name) listesi", "Sertifika zinciri analizi"],
};

export default function SSLLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
