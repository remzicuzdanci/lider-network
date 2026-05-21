"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react";
import { posts, categories, categoryColorMap } from "@/data/blog";

const BLUE = "#0052ff";

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

export default function BlogPage() {
  const locale = useLocale();
  const [activeCategory, setActiveCategory] = useState("tumu");

  const filtered =
    activeCategory === "tumu"
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  const featured = posts.find((p) => p.featured);

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-background)", color: "var(--color-on-surface)" }}
    >
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        className="relative pt-28 pb-16 overflow-hidden circuit-bg"
        style={{ borderBottom: "1px solid rgba(183,196,255,0.08)" }}
      >
        <div
          className="absolute top-0 right-0 w-[500px] h-[350px] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, rgba(0,82,255,0.1) 0%, transparent 70%)`,
            filter: "blur(80px)",
          }}
        />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-8 text-xs" style={{ color: "var(--color-outline)" }}>
            <Link href={`/${locale}`} className="hover:text-white transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <span style={{ color: "var(--color-primary)" }}>Blog</span>
          </nav>

          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
              style={{
                backgroundColor: `${BLUE}14`,
                border: `1px solid ${BLUE}30`,
                color: BLUE,
                fontFamily: "var(--font-family-label)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: BLUE }} />
              Fortinet & Siber Güvenlik Blogu
            </div>
            <h1
              className="text-5xl font-black mb-4 leading-tight"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Blog &{" "}
              <span style={{ color: BLUE }}>Teknik Makaleler</span>
            </h1>
            <p className="text-base leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
              Fortinet çözümleri, siber güvenlik trendleri ve BT altyapısı hakkında
              uzman içerikler. NSE sertifikalı mühendislerimizden güncel teknik bilgiler.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* ── FEATURED POST ─────────────────────────────────────────────── */}
        {featured && activeCategory === "tumu" && (
          <div className="mb-12">
            <div
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
            >
              Öne Çıkan Makale
            </div>
            <Link
              href={`/${locale}/blog/${featured.slug}`}
              className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01]"
              style={{
                backgroundColor: `${featured.categoryColor}08`,
                border: `1px solid ${featured.categoryColor}20`,
              }}
            >
              <div className="p-8 md:p-10">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: `${featured.categoryColor}18`,
                      color: featured.categoryColor,
                      border: `1px solid ${featured.categoryColor}30`,
                      fontFamily: "var(--font-family-label)",
                    }}
                  >
                    {categories.find((c) => c.id === featured.category)?.label}
                  </span>
                  <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-outline)" }}>
                    <Calendar className="w-3 h-3" />
                    {formatDate(featured.publishedAt)}
                  </span>
                  <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-outline)" }}>
                    <Clock className="w-3 h-3" />
                    {featured.readTime} dk okuma
                  </span>
                </div>

                <h2
                  className="text-3xl md:text-4xl font-black mb-3 leading-tight group-hover:text-blue-400 transition-colors"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  {featured.title}
                </h2>
                <p
                  className="text-base leading-relaxed mb-5 max-w-3xl"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  {featured.excerpt}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  {featured.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        color: "var(--color-outline)",
                        fontFamily: "var(--font-family-label)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                  <span
                    className="ml-auto inline-flex items-center gap-1.5 text-sm font-bold group-hover:gap-2.5 transition-all"
                    style={{ color: featured.categoryColor }}
                  >
                    Makaleyi Oku
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* ── CATEGORY FILTER ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => {
            const color = cat.id === "tumu" ? BLUE : (categoryColorMap[cat.id] ?? BLUE);
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                style={{
                  backgroundColor: isActive ? `${color}18` : "rgba(255,255,255,0.04)",
                  border: isActive ? `1px solid ${color}45` : "1px solid rgba(255,255,255,0.07)",
                  color: isActive ? color : "var(--color-outline)",
                  fontFamily: "var(--font-family-label)",
                }}
              >
                {cat.label}
                <span
                  className="ml-1.5 text-xs"
                  style={{ opacity: 0.7 }}
                >
                  ({cat.id === "tumu" ? posts.length : posts.filter((p) => p.category === cat.id).length})
                </span>
              </button>
            );
          })}
        </div>

        {/* ── POST GRID ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered
            .filter((p) => !(p.featured && activeCategory === "tumu"))
            .map((post) => {
              const catColor = categoryColorMap[post.category] ?? BLUE;
              const catLabel = categories.find((c) => c.id === post.category)?.label ?? "";
              return (
                <Link
                  key={post.slug}
                  href={`/${locale}/blog/${post.slug}`}
                  className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
                  style={{
                    backgroundColor: `${catColor}06`,
                    border: `1px solid ${catColor}18`,
                  }}
                >
                  <div className="p-6 flex flex-col flex-1">
                    {/* Category + meta */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: `${catColor}18`,
                          color: catColor,
                          border: `1px solid ${catColor}28`,
                          fontFamily: "var(--font-family-label)",
                        }}
                      >
                        {catLabel}
                      </span>
                      <span
                        className="text-[11px] flex items-center gap-1"
                        style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
                      >
                        <Clock className="w-3 h-3" />
                        {post.readTime} dk
                      </span>
                    </div>

                    {/* Title */}
                    <h2
                      className="text-lg font-black mb-3 leading-snug group-hover:opacity-80 transition-opacity flex-1"
                      style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
                    >
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p
                      className="text-sm leading-relaxed mb-5 line-clamp-3"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {post.excerpt}
                    </p>

                    {/* Footer */}
                    <div
                      className="flex items-center justify-between pt-4 mt-auto"
                      style={{ borderTop: `1px solid ${catColor}15` }}
                    >
                      <span
                        className="text-xs flex items-center gap-1"
                        style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
                      >
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.publishedAt)}
                      </span>
                      <span
                        className="text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all"
                        style={{ color: catColor }}
                      >
                        Oku <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <div
          className="mt-16 rounded-2xl p-8 text-center"
          style={{
            background: `linear-gradient(135deg, rgba(0,82,255,0.08), rgba(238,49,36,0.05))`,
            border: "1px solid rgba(0,82,255,0.15)",
          }}
        >
          <h2
            className="text-2xl font-black mb-3"
            style={{ fontFamily: "var(--font-family-headline)" }}
          >
            Projenizi Konuşalım
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--color-on-surface-variant)" }}>
            Fortinet çözümleri ve siber güvenlik altyapınız için ücretsiz analiz ve teklif.
          </p>
          <Link
            href={`/${locale}/iletisim`}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${BLUE}, #0040cc)`,
              boxShadow: `0 4px 20px rgba(0,82,255,0.3)`,
              fontFamily: "var(--font-family-label)",
            }}
          >
            Ücretsiz Analiz Al
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </main>
  );
}
