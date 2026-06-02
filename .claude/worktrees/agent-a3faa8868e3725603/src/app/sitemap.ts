import { MetadataRoute } from "next";
import { posts } from "@/data/blog";

const baseUrl = "https://www.lidernetwork.com.tr";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["tr", "en"];

  const staticPages = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/hizmetler", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/fortinet", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/fortinet/fortiswitch", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/fortinet/fortiap", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/fortinet/yonetim", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/fortinet/endpoint", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/siber-guvenlik", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/ag-entegrasyon", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/bulut-cozumleri", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/veri-depolama", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/bt-danismanligi", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/is-surekliligi", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/sanallastirma", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/synology", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/sistem-entegrasyonu", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/zayif-akim", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/hakkimizda", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/referanslar", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/cozum-ortaklarimiz", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/blog", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/iletisim", priority: 0.8, changeFrequency: "yearly" as const },
    { path: "/kvkk", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages — both locales
  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${baseUrl}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: {
            tr: `${baseUrl}/tr${page.path}`,
            en: `${baseUrl}/en${page.path}`,
          },
        },
      });
    }
  }

  // Blog posts — both locales
  for (const post of posts) {
    const postDate = new Date(post.publishedAt);
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}/blog/${post.slug}`,
        lastModified: postDate,
        changeFrequency: "monthly" as const,
        priority: post.featured ? 0.85 : 0.75,
        alternates: {
          languages: {
            tr: `${baseUrl}/tr/blog/${post.slug}`,
            en: `${baseUrl}/en/blog/${post.slug}`,
          },
        },
      });
    }
  }

  return entries;
}
