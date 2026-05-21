import { MetadataRoute } from "next";

const baseUrl = "https://www.lidernetwork.com.tr";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["tr", "en"];

  const pages = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/hizmetler", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/fortinet", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/synology", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/hakkimizda", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/iletisim", priority: 0.8, changeFrequency: "yearly" as const },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of pages) {
      const localePath = locale === "tr" ? "" : "/en";
      const pagePath = page.path;

      // Map Turkish paths to English for EN locale
      let enPath = pagePath;
      if (locale === "en") {
        const pathMap: Record<string, string> = {
          "/hizmetler": "/services",
          "/hakkimizda": "/about",
          "/iletisim": "/contact",
        };
        enPath = pathMap[pagePath] || pagePath;
      }

      entries.push({
        url: `${baseUrl}/${locale}${enPath}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: {
            tr: `${baseUrl}/tr${pagePath}`,
            en: `${baseUrl}/en${enPath}`,
          },
        },
      });
    }
  }

  return entries;
}
