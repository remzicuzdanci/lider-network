import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Hanken_Grotesk, Inter, Geist } from "next/font/google";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import ITToolsWidget from "@/components/ui/ITToolsWidget";
import BackToTop from "@/components/ui/BackToTop";
import CookieBanner from "@/components/ui/CookieBanner";
import "../globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist",
  display: "swap",
});

const baseUrl = "https://www.lidernetwork.com.tr";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Lider Network - Fortinet Yetkili Partner | Siber Güvenlik ve BT Altyapı Çözümleri",
    template: "%s | Lider Network - Fortinet Yetkili Partner",
  },
  description:
    "Lider Network, 2006'dan beri Fortinet Yetkili Partner olarak enterprise siber güvenlik, ağ altyapısı ve veri depolama çözümleri sunar. 500+ başarılı proje, 7/24 destek.",
  keywords: [
    "Fortinet yetkili partner",
    "siber güvenlik",
    "ağ altyapısı",
    "FortiGate",
    "NGFW",
    "SD-WAN",
    "veri depolama",
    "BT altyapı",
    "network security",
    "İstanbul BT çözümleri",
  ],
  authors: [{ name: "Lider Network" }],
  creator: "Lider Network",
  publisher: "Lider Network",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    alternateLocale: "en_US",
    siteName: "Lider Network",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lider Network - Fortinet Yetkili Partner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lidernetwork",
    creator: "@lidernetwork",
  },
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: "/logo.png",
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  // NOT: Buraya statik 'canonical' KOYMA. Layout metadata'sı tüm alt sayfalara
  // miras geçer; sabit bir canonical, kendi canonical'ı olmayan sayfaların
  // (Fortinet alt sayfaları, blog index vb.) ana sayfanın kopyası gibi
  // görünmesine ve indekslenmemesine yol açar. Her sayfa kendi canonical'ını verir.
  alternates: {
    languages: {
      tr: `${baseUrl}/tr`,
      en: `${baseUrl}/en`,
      "x-default": `${baseUrl}/tr`,
    },
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Lider Network",
  url: baseUrl,
  logo: `${baseUrl}/logo.png`,
  description:
    "2006'dan beri Fortinet Yetkili Partner olarak enterprise düzeyde siber güvenlik, ağ altyapısı ve veri depolama çözümleri.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Birlik Mh. 448. Cd No:119/2",
    addressLocality: "Çankaya",
    addressRegion: "Ankara",
    postalCode: "06610",
    addressCountry: "TR",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+90-312-232-02-88",
    contactType: "customer service",
    availableLanguage: ["Turkish", "English"],
  },
  sameAs: [
    "https://www.linkedin.com/company/lider-network-teknoloji-information-technologies/",
    "https://cloud.google.com/find-a-partner/partner/lider-network-teknoloji-dan%C4%B1%C5%9Fmanl%C4%B1k-ltd-%C5%9Eti",
  ],
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${baseUrl}/#local-business`,
  name: "Lider Network",
  image: `${baseUrl}/og-image.png`,
  url: baseUrl,
  telephone: "+90-312-232-02-88",
  email: "info@lidernetwork.com.tr",
  priceRange: "$$$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Birlik Mh. 448. Cd No:119/2",
    addressLocality: "Çankaya",
    addressRegion: "Ankara",
    postalCode: "06610",
    addressCountry: "TR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 39.9185,
    longitude: 32.8637,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "18:00",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${baseUrl}/#website`,
  url: baseUrl,
  name: "Lider Network",
  alternateName: ["Lider Network Teknoloji", "Lidernetwork"],
  inLanguage: "tr-TR",
  publisher: { "@id": `${baseUrl}/#local-business` },
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "tr" | "en")) {
    notFound();
  }

  const messages = await getMessages({ locale });

  // Hide main site chrome on the destek subdomain
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isDestekSubdomain = host.startsWith("destek.");

  return (
    <html lang={locale} className={`${hankenGrotesk.variable} ${inter.variable} ${geist.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#101415" />
        {!isDestekSubdomain && (
          <>
            <link rel="alternate" hrefLang="tr" href={`${baseUrl}/tr`} />
            <link rel="alternate" hrefLang="en" href={`${baseUrl}/en`} />
            <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/tr`} />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
          </>
        )}
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {isDestekSubdomain ? (
            /* Destek subdomain: clean layout, no site chrome */
            <main id="main-content" style={{ minHeight: "100vh", background: "var(--color-background)" }}>
              {children}
            </main>
          ) : (
            /* Main site: full layout with Navbar + Footer */
            <>
              <Navbar />
              <main id="main-content">{children}</main>
              <Footer />
              <ITToolsWidget />
              <WhatsAppButton />
              <BackToTop />
              <CookieBanner />
            </>
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
