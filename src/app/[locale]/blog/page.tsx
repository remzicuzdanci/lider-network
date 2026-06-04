"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Calendar, Clock, ArrowRight, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { posts, categories, categoryColorMap } from "@/data/blog";

const BLUE = "#0052ff";
const POSTS_PER_PAGE = 9;
const NEW_DAYS = 14; // days to show "YENİ" badge

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

function isNew(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() < NEW_DAYS * 24 * 60 * 60 * 1000;
}

export default function BlogPage() {
  const locale = useLocale();
  const [activeCategory, setActiveCategory] = useState("tumu");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const sortedPosts = useMemo(
    () =>
      [...posts].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      ),
    []
  );

  const featured = sortedPosts.find((p) => p.featured);

  const filtered = useMemo(() => {
    let result = sortedPosts;
    if (activeCategory !== "tumu") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [sortedPosts, activeCategory, searchQuery]);

  // Exclude featured post from grid when on page 1, all-category, no search
  const showFeatured = featured && activeCategory === "tumu" && !searchQuery.trim();
  const gridPosts = showFeatured ? filtered.filter((p) => !p.featured) : filtered;

  const totalPages = Math.max(1, Math.ceil(gridPosts.length / POSTS_PER_PAGE));
  const paginated = gridPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

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
              uzman içerikler. uzman mühendislerimizden güncel teknik bilgiler.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* ── FEATURED POST ─────────────────────────────────────────────── */}
        {showFeatured && featured && (
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
                  {isNew(featured.publishedAt) && (
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#EE3124", color: "white", fontFamily: "var(--font-family-label)" }}
                    >
                      YENİ
                    </span>
                  )}
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

        {/* ── SEARCH + CATEGORY FILTER ──────────────────────────────────── */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "var(--color-outline)" }}
            />
            <input
              type="search"
              placeholder="Makale, konu veya etiket ara..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--color-on-surface)",
                fontFamily: "var(--font-family-label)",
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = `${BLUE}60`;
                (e.target as HTMLInputElement).style.backgroundColor = "rgba(255,255,255,0.07)";
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.target as HTMLInputElement).style.backgroundColor = "rgba(255,255,255,0.05)";
              }}
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const color = cat.id === "tumu" ? BLUE : (categoryColorMap[cat.id] ?? BLUE);
              const isActive = activeCategory === cat.id;
              const count = cat.id === "tumu" ? posts.length : posts.filter((p) => p.category === cat.id).length;
              if (count === 0 && cat.id !== "tumu") return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? `${color}18` : "rgba(255,255,255,0.04)",
                    border: isActive ? `1px solid ${color}45` : "1px solid rgba(255,255,255,0.07)",
                    color: isActive ? color : "var(--color-outline)",
                    fontFamily: "var(--font-family-label)",
                  }}
                >
                  {cat.label}
                  <span className="ml-1.5 text-xs" style={{ opacity: 0.7 }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search result info */}
        {searchQuery.trim() && (
          <p className="text-sm mb-6" style={{ color: "var(--color-outline)" }}>
            <span style={{ color: "var(--color-on-surface)" }}>
              &ldquo;{searchQuery}&rdquo;
            </span>{" "}
            için {filtered.length} sonuç bulundu
          </p>
        )}

        {/* ── POST GRID ─────────────────────────────────────────────────── */}
        {paginated.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map((post) => {
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
                      <div className="flex items-center gap-2">
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
                        {isNew(post.publishedAt) && (
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse"
                            style={{ backgroundColor: "#EE3124", color: "white", fontFamily: "var(--font-family-label)" }}
                          >
                            YENİ
                          </span>
                        )}
                      </div>
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
        ) : (
          <div className="text-center py-20">
            <p className="text-lg font-semibold mb-2" style={{ color: "var(--color-on-surface)" }}>
              Sonuç bulunamadı
            </p>
            <p className="text-sm" style={{ color: "var(--color-outline)" }}>
              Farklı bir arama terimi veya kategori deneyin.
            </p>
          </div>
        )}

        {/* ── PAGINATION ────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: currentPage === 1 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: currentPage === 1 ? "var(--color-outline)" : "var(--color-on-surface)",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.5 : 1,
                fontFamily: "var(--font-family-label)",
              }}
            >
              <ChevronLeft className="w-4 h-4" /> Önceki
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className="w-9 h-9 rounded-xl text-sm font-bold transition-all"
                style={{
                  backgroundColor: page === currentPage ? BLUE : "rgba(255,255,255,0.04)",
                  border: page === currentPage ? `1px solid ${BLUE}` : "1px solid rgba(255,255,255,0.08)",
                  color: page === currentPage ? "white" : "var(--color-outline)",
                  fontFamily: "var(--font-family-label)",
                }}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: currentPage === totalPages ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: currentPage === totalPages ? "var(--color-outline)" : "var(--color-on-surface)",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                opacity: currentPage === totalPages ? 0.5 : 1,
                fontFamily: "var(--font-family-label)",
              }}
            >
              Sonraki <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

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
