import type { Metadata, Viewport } from "next";

const BASE = "https://dns.lidernetwork.com.tr";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: "DNS Sorgulama & Domain Aracı | Lider Network",
  description:
    "Ücretsiz DNS sorgulama aracı: A, MX, TXT, NS kayıtları, WHOIS, SPF/DKIM/DMARC mail ayarları, SSL sertifika kontrolü ve DNS propagasyon. Lider Network tarafından.",
  keywords: ["DNS sorgulama", "DNS kayıt kontrol", "WHOIS sorgu", "MX kayıt", "SPF DKIM DMARC", "SSL kontrol", "DNS propagasyon", "domain sorgulama", "Lider Network"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
  alternates: { canonical: BASE },
  openGraph: {
    type: "website",
    url: BASE,
    title: "DNS Sorgulama & Domain Aracı | Lider Network",
    description: "A/MX/TXT/NS, WHOIS, SPF/DKIM/DMARC, SSL ve DNS propagasyon — tek araçta, ücretsiz.",
    siteName: "Lider Network",
    images: [{ url: "https://www.lidernetwork.com.tr/og-image.png", width: 1200, height: 630, alt: "DNS Sorgulama - Lider Network" }],
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
  name: "DNS Sorgulama & Domain Aracı",
  url: BASE,
  description: "A, MX, TXT, NS DNS kayıtları; WHOIS; SPF/DKIM/DMARC doğrulama; SSL sertifika ve DNS propagasyon kontrolü — tek araçta ücretsiz.",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  inLanguage: "tr-TR",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
  author: { "@type": "Organization", name: "Lider Network", url: "https://www.lidernetwork.com.tr" },
  featureList: ["DNS kayıt sorgulama (A/MX/TXT/NS/CNAME/SOA)", "WHOIS domain sorgusu", "SPF/DKIM/DMARC doğrulama", "SSL sertifika kontrolü", "DNS propagasyon testi"],
};

export default function DnsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
