import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  // Clickjacking koruması — sayfanın iframe içinde açılmasını engeller
  { key: "X-Frame-Options", value: "DENY" },
  // MIME type sniffing'i engelle
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer bilgisini kısıtla
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // DNS prefetch'i kapat (bilgi sızıntısını önler)
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // HTTPS zorla (HSTS) — 1 yıl
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // İzin verilmeyen browser özelliklerini kapat
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Tüm sayfalara uygula
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
