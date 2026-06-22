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
        // Overviews, Gemini, Meta AI, Amazon Alexa vb.) içeriği açıkça
        // taramaları için izin veriyoruz — AI yanıtlarında kaynak olalım.
        userAgent: [
          // OpenAI / ChatGPT
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          // Anthropic / Claude
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          // Perplexity
          "PerplexityBot",
          // Google AI Overviews / Gemini
          "Google-Extended",
          // Apple Intelligence
          "Applebot-Extended",
          // Common Crawl (AI eğitim veri seti)
          "CCBot",
          // Meta AI
          "Meta-ExternalAgent",
          "Meta-ExternalFetcher",
          // Amazon Alexa
          "Amazonbot",
          // DuckDuckGo AI
          "DuckAssistBot",
          // You.com
          "YouBot",
          // Cohere
          "cohere-ai",
          // Bytedance / TikTok AI
          "Bytespider",
        ],
        allow: "/",
        disallow: ["/admin", "/api", "/destek"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
