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
      { source: "/anasayfa",                 permanent: true, destination: "/tr" },
      { source: "/kurumsal",                 permanent: true, destination: "/tr/hakkimizda" },
      { source: "/misyonumuz",               permanent: true, destination: "/tr/hakkimizda" },
      { source: "/vizyonumuz",               permanent: true, destination: "/tr/hakkimizda" },
      { source: "/kurumsal-bt-hizmetleri-1", permanent: true, destination: "/tr/hizmetler" },
      { source: "/sistem-cozumleri",         permanent: true, destination: "/tr/sistem-entegrasyonu" },
      { source: "/sistem-%C3%A7%C3%B6z%C3%BCmleri", permanent: true, destination: "/tr/sistem-entegrasyonu" },
      { source: "/yaz%C4%B1l%C4%B1m-%C3%A7%C3%B6z%C3%BCmleri", permanent: true, destination: "/tr/hizmetler" },
      { source: "/gizlilik-politikam%C4%B1z", permanent: true, destination: "/tr/kvkk" },
      { source: "/depolama-%C3%A7%C3%B6z%C3%BCmleri", permanent: true, destination: "/tr/veri-depolama" },
      { source: "/yedekleme-%C3%A7%C3%B6z%C3%BCmleri", permanent: true, destination: "/tr/veri-depolama" },

      // ── Blog: Türkçe char slug → ASCII slug (doğru yön: karakter içeren → ASCII) ─
      { source: "/tr/blog/vmware-nsx-ag-sanallaştirma-ve-mikro-segmentasyon",     permanent: true, destination: "/tr/blog/vmware-nsx-ag-sanallastirma-ve-mikro-segmentasyon" },
      { source: "/tr/blog/windows-server-hyper-v-sanallaştirma-kurulum-ve-yonetim", permanent: true, destination: "/tr/blog/windows-server-hyper-v-sanallastirma-kurulum-ve-yonetim" },
      { source: "/tr/blog/dahua-nvr-yapılandırma-ve-uzaktan-izleme-rehberi",      permanent: true, destination: "/tr/blog/dahua-nvr-yapilandirma-ve-uzaktan-izleme-rehberi" },
      { source: "/tr/blog/veeam-immutable-backup-ransomware-koruması",            permanent: true, destination: "/tr/blog/veeam-immutable-backup-ransomware-korumasi" },

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
