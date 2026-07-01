import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 gün
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      // ── Eski (locale prefix'siz) sayfalar → yeni locale'li karşılıkları ──────
      { source: "/anasayfa",                permanent: true,  destination: "/tr" },
      { source: "/kurumsal",                permanent: true,  destination: "/tr/hakkimizda" },
      { source: "/vizyonumuz",              permanent: true,  destination: "/tr/hakkimizda" },
      { source: "/kurumsal-bt-hizmetleri-1", permanent: true, destination: "/tr/hizmetler" },
      { source: "/sistem-cozumleri",        permanent: true,  destination: "/tr/sistem-entegrasyonu" },

      // ── Blog: ASCII slug → Türkçe karakter içeren doğru slug ─────────────────
      // (Google linkleri ASCII ile tarıyor, asıl slug Türkçe karakter içeriyor)
      {
        source: "/tr/blog/vmware-nsx-ag-sanallastirma-ve-mikro-segmentasyon",
        destination: "/tr/blog/vmware-nsx-ag-sanallaştirma-ve-mikro-segmentasyon",
        permanent: true,
      },
      {
        source: "/en/blog/vmware-nsx-ag-sanallastirma-ve-mikro-segmentasyon",
        destination: "/en/blog/vmware-nsx-ag-sanallaştirma-ve-mikro-segmentasyon",
        permanent: true,
      },
      {
        source: "/tr/blog/dahua-nvr-yapilandirma-ve-uzaktan-izleme-rehberi",
        destination: "/tr/blog/dahua-nvr-yapılandırma-ve-uzaktan-izleme-rehberi",
        permanent: true,
      },
      {
        source: "/en/blog/dahua-nvr-yapilandirma-ve-uzaktan-izleme-rehberi",
        destination: "/en/blog/dahua-nvr-yapılandırma-ve-uzaktan-izleme-rehberi",
        permanent: true,
      },
      {
        source: "/tr/blog/veeam-immutable-backup-ransomware-korumasi",
        destination: "/tr/blog/veeam-immutable-backup-ransomware-koruması",
        permanent: true,
      },
      {
        source: "/en/blog/veeam-immutable-backup-ransomware-korumasi",
        destination: "/tr/blog/veeam-immutable-backup-ransomware-koruması",
        permanent: true,
      },

      // ── EN blog → TR blog (içerik Türkçe, EN versiyonu kopya sayılıyor) ───────
      { source: "/en/blog/:slug*", permanent: true, destination: "/tr/blog/:slug*" },

      // ── Wix kalıntısı ─────────────────────────────────────────────────────────
      { source: "/_api/:path*", permanent: false, destination: "/tr" },
    ];
  },
  async headers() {
    return [
      // Statik assetler — 1 yıl cache (hash'li dosyalar, değişince URL değişir)
      {
        source: "/_next/static/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Görseller — 30 gün cache
      {
        source: "/images/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      // Tüm sayfalar — güvenlik headerları
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
