import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { articlesForService } from "@/lib/content-links";

/**
 * Hizmet sayfalarında "İlgili Yazılar" bölümü.
 * Hizmet -> blog iç linkleri kurarak blog yazılarının Google tarafından
 * keşfedilip indekslenmesini hızlandırır (güçlü sayfadan link akışı).
 */
export default function RelatedArticles({
  serviceSlug,
  locale,
  title = "İlgili Yazılar",
}: {
  serviceSlug: string;
  locale: string;
  title?: string;
}) {
  const articles = articlesForService(serviceSlug, 3);
  if (!articles.length) return null;

  return (
    <section
      className="py-16 px-5 lg:px-20"
      style={{ backgroundColor: "var(--color-background)", borderTop: "1px solid rgba(141,144,162,0.15)" }}
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <h2
            className="text-2xl lg:text-3xl font-semibold text-white"
            style={{ fontFamily: "var(--font-family-headline)" }}
          >
            {title}
          </h2>
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-1.5 text-sm font-bold transition-colors hover:opacity-80"
            style={{ color: "var(--color-primary)" }}
          >
            Tüm Blog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {articles.map((p) => (
            <Link
              key={p.slug}
              href={`/${locale}/blog/${p.slug}`}
              className="group block rounded-xl p-6 transition-all duration-200 hover:scale-[1.02]"
              style={{
                backgroundColor: `${p.categoryColor}08`,
                border: `1px solid ${p.categoryColor}20`,
              }}
            >
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded mb-3 inline-block uppercase tracking-wider"
                style={{
                  backgroundColor: `${p.categoryColor}18`,
                  color: p.categoryColor,
                  fontFamily: "var(--font-family-label)",
                }}
              >
                {p.readTime} dk okuma
              </span>
              <h3
                className="text-base font-bold leading-snug mb-3 text-white group-hover:opacity-80 transition-opacity"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                {p.title}
              </h3>
              <p
                className="text-sm leading-relaxed line-clamp-2"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                {p.excerpt}
              </p>
              <span
                className="mt-4 text-xs font-bold flex items-center gap-1 group-hover:gap-1.5 transition-all"
                style={{ color: p.categoryColor }}
              >
                Devamını Oku <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
