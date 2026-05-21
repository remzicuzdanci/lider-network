import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Hanken_Grotesk, Inter, Geist } from "next/font/google";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
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
        <link rel="alternate" hrefLang="tr" href={`${baseUrl}/tr`} />
        <link rel="alternate" hrefLang="en" href={`${baseUrl}/en`} />
        <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/tr`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Navbar />
          <main id="main-content">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
