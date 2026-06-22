import type { Metadata, Viewport } from "next";

const BASE = "https://uptime.lidernetwork.com.tr";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: "Servis Durumu | Lider Network",
  description: "Lider Network servislerinin anlık durumunu takip edin. Tehdit feed, destek portalı, IP sorgu ve diğer servislerin erişilebilirliği gerçek zamanlı izlenir.",
  keywords: ["servis durumu", "uptime monitoring", "sistem durumu", "status page", "servis erişilebilirlik", "Lider Network uptime", "Lider Network"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
  alternates: { canonical: BASE },
  openGraph: {
    type: "website",
    url: BASE,
    title: "Servis Durumu | Lider Network",
    description: "Lider Network servislerinin anlık erişilebilirlik durumu — gerçek zamanlı.",
    siteName: "Lider Network",
    images: [{ url: "https://www.lidernetwork.com.tr/og-image.png", width: 1200, height: 630, alt: "Servis Durumu - Lider Network" }],
  },
  twitter: { card: "summary_large_image", site: "@lidernetwork" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070d1c",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Lider Network Servis Durumu",
  url: BASE,
  description: "Lider Network platformlarının (tehdit feed, destek portalı, IP sorgu vb.) anlık çalışma durumu ve erişilebilirlik sayfası.",
  inLanguage: "tr-TR",
  isAccessibleForFree: true,
  author: { "@type": "Organization", name: "Lider Network", url: "https://www.lidernetwork.com.tr" },
};

export default function UptimeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
