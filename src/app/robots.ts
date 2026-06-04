import { MetadataRoute } from "next";

const baseUrl = "https://www.lidernetwork.com.tr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Tüm arama motorları — admin/destek/api hariç her şey taranabilir
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/destek"],
      },
      {
        // AI yanıt motorlarına (ChatGPT, Claude, Perplexity, Google AI
        // Overviews, Gemini) içeriği açıkça taramaları için izin veriyoruz —
        // böylece AI yanıtlarında kaynak olarak gösterilebiliriz.
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-Web",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
        ],
        allow: "/",
        disallow: ["/admin", "/api", "/destek"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
