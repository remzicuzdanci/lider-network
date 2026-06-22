import type { Metadata, Viewport } from "next";

const BASE = "https://password.lidernetwork.com.tr";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: "Güçlü Şifre Oluşturucu | Lider Network",
  description: "Güvenli, rastgele ve güçlü şifreler anında oluşturun. Uzunluk, büyük/küçük harf, rakam ve sembol ayarları ile özelleştirilebilir ücretsiz şifre üretici.",
  keywords: ["şifre oluşturucu", "güvenli şifre", "rastgele şifre", "password generator", "güçlü şifre üretici", "online şifre oluştur", "şifre oluşturma aracı", "Lider Network"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
  alternates: { canonical: BASE },
  openGraph: {
    type: "website",
    url: BASE,
    title: "Güçlü Şifre Oluşturucu | Lider Network",
    description: "Güvenli ve rastgele şifreler anında oluşturun. Ücretsiz, kayıtsız.",
    siteName: "Lider Network",
    images: [{ url: "https://www.lidernetwork.com.tr/og-image.png", width: 1200, height: 630, alt: "Şifre Oluşturucu - Lider Network" }],
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
  "@type": "WebApplication",
  name: "Güçlü Şifre Oluşturucu",
  url: BASE,
  description: "Uzunluk, büyük/küçük harf, rakam ve sembol seçenekleriyle güvenli ve rastgele şifreler oluşturun.",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  inLanguage: "tr-TR",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
  author: { "@type": "Organization", name: "Lider Network", url: "https://www.lidernetwork.com.tr" },
  featureList: ["Rastgele güçlü şifre üretimi", "Özelleştirilebilir uzunluk", "Büyük/küçük harf, rakam, sembol seçimi", "Şifre güç göstergesi", "Tek tıkla kopyalama"],
};

export default function PasswordLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
