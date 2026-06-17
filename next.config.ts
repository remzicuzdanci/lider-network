import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Ana site ve admin için tam clickjacking koruması
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

// IT araç sayfaları — destek panelinden iframe olarak açılabilir
const toolHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://destek.lidernetwork.com.tr" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
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
      // Tüm sayfalara varsayılan güvenlik başlıkları
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // IT araç sayfaları: iframe iznini override et
      {
        source: "/blacklist/:path*",
        headers: toolHeaders,
      },
      {
        source: "/threat/:path*",
        headers: toolHeaders,
      },
      {
        source: "/ip/:path*",
        headers: toolHeaders,
      },
      {
        source: "/dns/:path*",
        headers: toolHeaders,
      },
      {
        source: "/password/:path*",
        headers: toolHeaders,
      },
      {
        source: "/uptime/:path*",
        headers: toolHeaders,
      },
      {
        source: "/admin/sistem-durumu/:path*",
        headers: toolHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
