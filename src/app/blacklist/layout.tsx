import type { Metadata, Viewport } from "next";

const BASE = "https://blacklist.lidernetwork.com.tr";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: "IP Kara Liste Sorgulama | Lider Network",
  description: "IP adresinizin 30+ spam ve kara listede (DNSBL/RBL) olup olmadığını anında kontrol edin. Spamhaus, SpamCop, Barracuda, SORBS ve daha fazlası. Ücretsiz.",
  keywords: ["ip kara liste", "blacklist sorgu", "spam liste kontrol", "DNSBL", "RBL sorgu", "ip itibar", "Spamhaus", "SpamCop", "Barracuda", "SORBS", "mail blacklist", "Lider Network"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
  alternates: { canonical: BASE },
  openGraph: {
    type: "website",
    url: BASE,
    title: "IP Kara Liste Sorgulama | Lider Network",
    description: "30+ DNSBL/RBL listesinde IP itibar kontrolü — Spamhaus, Barracuda, SpamCop ve daha fazlası. Ücretsiz.",
    siteName: "Lider Network",
    images: [{ url: "https://www.lidernetwork.com.tr/og-image.png", width: 1200, height: 630, alt: "IP Blacklist Sorgulama - Lider Network" }],
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
  name: "IP Kara Liste Sorgulama (DNSBL/RBL)",
  url: BASE,
  description: "IP adresinizin 30'dan fazla spam ve kara listede yer alıp almadığını anında kontrol edin. Spamhaus, SpamCop, Barracuda, SORBS dahil.",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  inLanguage: "tr-TR",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
  author: { "@type": "Organization", name: "Lider Network", url: "https://www.lidernetwork.com.tr" },
  featureList: ["30+ DNSBL/RBL listesi kontrolü", "Spamhaus ZEN sorgusu", "Barracuda BRBL kontrolü", "SpamCop sorgusu", "Anlık IP itibar analizi"],
};

export default function BlacklistLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
