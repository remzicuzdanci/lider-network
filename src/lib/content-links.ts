import { posts, type BlogPost } from "@/data/blog";

/**
 * Blog kategorileri ↔ hizmet sayfaları eşleştirmesi.
 * İç link ağı kurarak Google'ın sayfaları keşfetmesini/indekslemesini
 * hızlandırmak için kullanılır (blog → hizmet ve hizmet → blog).
 */

export interface ServiceRef {
  slug: string; // /tr/<slug>
  label: string;
}

// Blog kategorisi -> ana hizmet sayfası
const CATEGORY_TO_SERVICE: Record<string, ServiceRef> = {
  "siber-guvenlik":    { slug: "siber-guvenlik",  label: "Siber Güvenlik" },
  "soc-yonetim":       { slug: "siber-guvenlik",  label: "Siber Güvenlik" },
  "bitdefender":       { slug: "siber-guvenlik",  label: "Siber Güvenlik" },
  "iso-uyumluluk":     { slug: "siber-guvenlik",  label: "Siber Güvenlik" },
  "fortigate-ngfw":    { slug: "fortinet",        label: "Fortinet Çözümleri" },
  "ag-teknolojileri":  { slug: "ag-entegrasyon",  label: "Ağ Entegrasyonu" },
  "network-temelleri": { slug: "ag-entegrasyon",  label: "Ağ Entegrasyonu" },
  "guvenlik-kamera":   { slug: "zayif-akim",      label: "Zayıf Akım Sistemleri" },
  "cloud-sase":        { slug: "bulut-cozumleri", label: "Bulut Çözümleri" },
  "microsoft":         { slug: "bulut-cozumleri", label: "Bulut Çözümleri" },
  "google-workspace":  { slug: "bulut-cozumleri", label: "Bulut Çözümleri" },
  "windows-server":    { slug: "sistem-entegrasyonu", label: "Sistem Entegrasyonu" },
  "windows-11":        { slug: "sistem-entegrasyonu", label: "Sistem Entegrasyonu" },
  "synology":          { slug: "veri-depolama",   label: "Veri Depolama" },
  "qnap":              { slug: "veri-depolama",   label: "Veri Depolama" },
  "hpe":               { slug: "veri-depolama",   label: "Veri Depolama" },
  "veeam":             { slug: "is-surekliligi",  label: "İş Sürekliliği" },
  "vmware":            { slug: "sanallastirma",   label: "Sanallaştırma" },
};

const DEFAULT_SERVICE: ServiceRef = { slug: "hizmetler", label: "Tüm Hizmetler" };

/** Bir blog yazısının ait olduğu hizmet sayfası (blog -> hizmet linki). */
export function serviceForCategory(category: string): ServiceRef {
  return CATEGORY_TO_SERVICE[category] ?? DEFAULT_SERVICE;
}

// Hizmet sayfası slug -> ilgili blog kategorileri (hizmet -> blog linki)
const SERVICE_TO_CATEGORIES: Record<string, string[]> = {
  "siber-guvenlik":      ["siber-guvenlik", "soc-yonetim", "bitdefender", "iso-uyumluluk"],
  "fortinet":            ["fortigate-ngfw", "ag-teknolojileri"],
  "ag-entegrasyon":      ["ag-teknolojileri", "network-temelleri"],
  "bulut-cozumleri":     ["cloud-sase", "microsoft", "google-workspace"],
  "veri-depolama":       ["synology", "qnap", "hpe", "veeam"],
  "sistem-entegrasyonu": ["windows-server", "windows-11"],
  "sanallastirma":       ["vmware"],
  "is-surekliligi":      ["veeam"],
  "zayif-akim":          ["guvenlik-kamera"],
};

/** Bir hizmet sayfası için ilgili blog yazıları (hizmet -> blog linki). */
export function articlesForService(serviceSlug: string, limit = 3): BlogPost[] {
  const cats = SERVICE_TO_CATEGORIES[serviceSlug] ?? [];
  if (!cats.length) return [];
  return posts
    .filter((p) => cats.includes(p.category))
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, limit);
}
