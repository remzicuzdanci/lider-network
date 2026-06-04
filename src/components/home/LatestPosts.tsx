"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight, Calendar, Clock } from "lucide-react";
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

function isNew(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() < 14 * 24 * 60 * 60 * 1000;
}

export default function LatestPosts() {
  const locale = useLocale();
  const isTr = locale === "tr";

  const latest = [...posts]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);

  return (
    <section
      className="section"
      style={{ backgroundColor: "var(--color-surface)" }}
      aria-labelledby="latest-posts-title"
    >
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
              style={{
                backgroundColor: `${BLUE}12`,
                border: `1px solid ${BLUE}28`,
                color: BLUE,
                fontFamily: "var(--font-family-label)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: BLUE }} />
              {isTr ? "Teknik İçerikler" : "Technical Content"}
            </div>
            <h2
              id="latest-posts-title"
              className="text-3xl sm:text-4xl font-black leading-tight"
              style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
            >
              {isTr ? "Son" : "Latest"}{" "}
              <span style={{ color: BLUE }}>{isTr ? "Makaleler" : "Articles"}</span>
            </h2>
            <p
              className="mt-2 text-sm max-w-md"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              {isTr
                ? "uzman mühendislerimizden Fortinet ve siber güvenlik üzerine güncel teknik bilgiler."
                : "Up-to-date technical insights on Fortinet and cybersecurity from our expert engineers."}
            </p>
          </div>
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 shrink-0"
            style={{
              backgroundColor: `${BLUE}12`,
              border: `1px solid ${BLUE}28`,
              color: BLUE,
              fontFamily: "var(--font-family-label)",
            }}
          >
            {isTr ? "Tüm Makaleler" : "All Articles"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {latest.map((post) => {
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
                  {/* Category + new badge */}
                  <div className="flex items-center gap-2 mb-4">
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
                        className="text-[10px] font-black px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "#EE3124", color: "white", fontFamily: "var(--font-family-label)" }}
                      >
                        YENİ
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className="text-base font-black mb-3 leading-snug group-hover:opacity-80 transition-opacity flex-1"
                    style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
                  >
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p
                    className="text-sm leading-relaxed mb-5 line-clamp-2"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    {post.excerpt}
                  </p>

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between pt-4 mt-auto"
                    style={{ borderTop: `1px solid ${catColor}15` }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs flex items-center gap-1"
                        style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
                      >
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.publishedAt)}
                      </span>
                      <span
                        className="text-xs flex items-center gap-1"
                        style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
                      >
                        <Clock className="w-3 h-3" />
                        {post.readTime} dk
                      </span>
                    </div>
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
      </div>
    </section>
  );
}
