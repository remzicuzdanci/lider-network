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
    // Araç subdomain'leri — bu hostlardan gelen istekler iframe olarak açılabilir
    const toolHosts = [
      "threat.lidernetwork.com.tr",
      "blacklist.lidernetwork.com.tr",
      "ip.lidernetwork.com.tr",
      "dns.lidernetwork.com.tr",
      "password.lidernetwork.com.tr",
      "uptime.lidernetwork.com.tr",
    ];

    return [
      // Tüm sayfalara varsayılan güvenlik başlıkları
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Her araç subdomain'i için hostname bazlı iframe izni (path ne olursa olsun)
      ...toolHosts.map((host) => ({
        source: "/(.*)",
        has: [{ type: "host" as const, value: host }],
        headers: toolHeaders,
      })),
      // Admin sistem-durumu sayfası da iframe olarak açılabilir
      {
        source: "/admin/sistem-durumu",
        headers: toolHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
