import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowLeft, Calendar, Clock, Tag, ArrowRight } from "lucide-react";
import { posts, categories, getPost, getRelatedPosts } from "@/data/blog";
import { serviceForCategory } from "@/lib/content-links";

const baseUrl = "https://www.lidernetwork.com.tr";
const BLUE = "#0052ff";

export async function generateStaticParams() {
  return posts.flatMap((p) => [
    { locale: "tr", slug: p.slug },
    { locale: "en", slug: p.slug },
  ]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} | Lider Network Blog`,
    description: post.excerpt,
    keywords: post.tags,
    alternates: {
      // Blog içerikleri Türkçe — canonical her zaman /tr/ işaret eder
      canonical: `${baseUrl}/tr/blog/${slug}`,
      languages: {
        tr: `${baseUrl}/tr/blog/${slug}`,
        "x-default": `${baseUrl}/tr/blog/${slug}`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${baseUrl}/tr/blog/${slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      tags: post.tags,
    },
  };
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    const d = new Date(dateStr);
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const post = getPost(slug);

  if (!post) notFound();

  const related = getRelatedPosts(slug, 3);
  const catLabel = categories.find((c) => c.id === post.category)?.label ?? "";
  const color = post.categoryColor;
  const service = serviceForCategory(post.category);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: "Lider Network" },
    publisher: {
      "@type": "Organization",
      name: "Lider Network",
      logo: { "@type": "ImageObject", url: `${baseUrl}/logo.png` },
    },
    keywords: post.tags.join(", "),
    url: `${baseUrl}/${locale}/blog/${slug}`,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: `${baseUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${baseUrl}/${locale}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${baseUrl}/${locale}/blog/${slug}` },
    ],
  };

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-background)", color: "var(--color-on-surface)" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        className="relative pt-28 pb-12 overflow-hidden circuit-bg"
        style={{ borderBottom: "1px solid rgba(183,196,255,0.08)" }}
      >
        <div
          className="absolute top-0 right-0 w-[500px] h-[300px] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, ${color}18 0%, transparent 70%)`,
            filter: "blur(80px)",
          }}
        />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-8 text-xs" style={{ color: "var(--color-outline)" }}>
            <Link href={`/${locale}`} className="hover:text-white transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <Link href={`/${locale}/blog`} className="hover:text-white transition-colors">Blog</Link>
            <span>/</span>
            <span style={{ color: "var(--color-primary)" }} className="truncate max-w-[200px]">
              {post.title}
            </span>
          </nav>

          {/* Category + meta */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: `${color}18`,
                color,
                border: `1px solid ${color}30`,
                fontFamily: "var(--font-family-label)",
              }}
            >
              {catLabel}
            </span>
            <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--color-outline)" }}>
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--color-outline)" }}>
              <Clock className="w-3.5 h-3.5" />
              {post.readTime} dakika okuma
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-4xl md:text-5xl font-black leading-tight mb-5"
            style={{ fontFamily: "var(--font-family-headline)" }}
          >
            {post.title}
          </h1>

          {/* Excerpt */}
          <p
            className="text-lg leading-relaxed mb-6 max-w-3xl"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            {post.excerpt}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "var(--color-outline)",
                  fontFamily: "var(--font-family-label)",
                }}
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTENT ───────────────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">

            {/* Article content */}
            <article
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-6">

                {/* CTA Card */}
                <div
                  className="rounded-2xl p-6"
                  style={{
                    backgroundColor: `${color}08`,
                    border: `1px solid ${color}20`,
                  }}
                >
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color, fontFamily: "var(--font-family-label)" }}
                  >
                    Lider Network
                  </div>
                  <h3
                    className="text-base font-black mb-3 leading-snug"
                    style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
                  >
                    Bu konuda danışmak ister misiniz?
                  </h3>
                  <p
                    className="text-xs leading-relaxed mb-4"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    uzman mühendislerimiz altyapınızı ücretsiz analiz eder.
                  </p>
                  <Link
                    href={`/${locale}/iletisim`}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{
                      background: `linear-gradient(135deg, ${color}, ${color}bb)`,
                      boxShadow: `0 4px 16px ${color}30`,
                      fontFamily: "var(--font-family-label)",
                    }}
                  >
                    Ücretsiz Analiz Al
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* İlgili Hizmet (blog -> hizmet iç linki) */}
                <div
                  className="rounded-2xl p-5"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
                  >
                    İlgili Hizmet
                  </div>
                  <Link
                    href={`/${locale}/${service.slug}`}
                    className="flex items-center justify-between gap-2 text-sm font-bold transition-colors hover:opacity-80"
                    style={{ color }}
                  >
                    {service.label}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Tags */}
                <div
                  className="rounded-2xl p-5"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
                  >
                    Etiketler
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: `${color}10`,
                          color,
                          border: `1px solid ${color}20`,
                          fontFamily: "var(--font-family-label)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── RELATED POSTS ─────────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section
          className="py-12"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="max-w-4xl mx-auto px-6">
            <h2
              className="text-2xl font-black mb-6"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              İlgili Makaleler
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/${locale}/blog/${rp.slug}`}
                  className="group block rounded-xl p-5 transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    backgroundColor: `${rp.categoryColor}06`,
                    border: `1px solid ${rp.categoryColor}18`,
                  }}
                >
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded mb-3 inline-block"
                    style={{
                      backgroundColor: `${rp.categoryColor}18`,
                      color: rp.categoryColor,
                      fontFamily: "var(--font-family-label)",
                    }}
                  >
                    {categories.find((c) => c.id === rp.category)?.label}
                  </span>
                  <h3
                    className="text-sm font-bold leading-snug mb-2 group-hover:opacity-80 transition-opacity"
                    style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
                  >
                    {rp.title}
                  </h3>
                  <span
                    className="text-xs font-bold flex items-center gap-1 group-hover:gap-1.5 transition-all"
                    style={{ color: rp.categoryColor }}
                  >
                    Oku <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BACK + CTA ────────────────────────────────────────────────────── */}
      <section
        className="py-10"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-white"
            style={{ color: "var(--color-outline)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Tüm Makaleler
          </Link>
          <Link
            href={`/${locale}/iletisim`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${BLUE}, #0040cc)`,
              boxShadow: `0 4px 16px rgba(0,82,255,0.3)`,
              fontFamily: "var(--font-family-label)",
            }}
          >
            Ücretsiz Altyapı Analizi
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
