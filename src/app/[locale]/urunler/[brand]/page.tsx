import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { brands, getBrand, getProductsByBrand } from "@/data/products";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateStaticParams() {
  return brands.flatMap((b) => [
    { locale: "tr", brand: b.slug },
    { locale: "en", brand: b.slug },
  ]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; brand: string }>;
}): Promise<Metadata> {
  const { locale, brand: brandSlug } = await params;
  const brand = getBrand(brandSlug);
  if (!brand) return {};
  return {
    title: `${brand.name} Ürünleri | Tüm Modeller — Lider Network`,
    description: `${brand.name} yetkili partner olarak tüm ${brand.name} ürün portföyünü sunuyoruz. ${brand.description}`,
    alternates: {
      canonical: `${baseUrl}/${locale}/urunler/${brand.slug}`,
    },
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ locale: string; brand: string }>;
}) {
  const { locale, brand: brandSlug } = await params;
  const brand = getBrand(brandSlug);
  if (!brand) notFound();

  const products = getProductsByBrand(brandSlug);

  // Kategorilere göre grupla
  const byCategory = brand.categories.map((cat) => ({
    ...cat,
    items: products.filter((p) => p.categorySlug === cat.slug),
  })).filter((c) => c.items.length > 0);

  return (
    <main className="pt-20">
      {/* Hero */}
      <section
        className="py-16 px-5 lg:px-20 max-w-[1280px] mx-auto"
        style={{ borderBottom: "1px solid rgba(141,144,162,0.15)" }}
      >
        <Link
          href={`/${locale}/urunler`}
          className="inline-flex items-center gap-2 mb-8 text-sm hover:opacity-75 transition-opacity"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Tüm Markalar
        </Link>

        <div className="flex items-start gap-5">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${brand.accentColor}15`, border: `1px solid ${brand.accentColor}25` }}
          >
            <span
              className="text-lg font-bold"
              style={{ color: brand.accentColor, fontFamily: "var(--font-family-headline)" }}
            >
              {brand.name.slice(0, 2)}
            </span>
          </div>
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
              style={{
                backgroundColor: `${brand.accentColor}12`,
                color: brand.accentColor,
                border: `1px solid ${brand.accentColor}25`,
                fontFamily: "var(--font-family-label)",
              }}
            >
              Yetkili Partner
            </div>
            <h1
              className="text-4xl lg:text-5xl font-bold text-white mb-3"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              {brand.name} Ürünleri
            </h1>
            <p className="text-base max-w-2xl" style={{ color: "var(--color-on-surface-variant)" }}>
              {brand.description}
            </p>
          </div>
        </div>
      </section>

      {/* Kategoriler ve Ürünler */}
      {byCategory.map((cat) => (
        <section
          key={cat.slug}
          className="py-12 px-5 lg:px-20 max-w-[1280px] mx-auto"
          style={{ borderBottom: "1px solid rgba(141,144,162,0.08)" }}
        >
          <h2
            className="text-xl font-bold text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "var(--font-family-headline)" }}
          >
            <span
              className="w-1 h-6 rounded-full"
              style={{ backgroundColor: brand.accentColor }}
            />
            {cat.label}
            <span
              className="text-sm font-normal px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${brand.accentColor}12`,
                color: brand.accentColor,
                fontFamily: "var(--font-family-label)",
              }}
            >
              {cat.items.length} model
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cat.items.map((product) => (
              <Link
                key={product.slug}
                href={`/${locale}/urunler/${brandSlug}/${product.slug}`}
                className="group industrial-border rounded-xl p-5 flex flex-col justify-between transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: "#191c1e" }}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {product.badge && (
                        <span
                          className="text-xs px-2 py-0.5 rounded font-semibold"
                          style={{
                            backgroundColor: `${brand.accentColor}18`,
                            color: brand.accentColor,
                            fontFamily: "var(--font-family-label)",
                          }}
                        >
                          {product.badge}
                        </span>
                      )}
                      {product.isNew && (
                        <span
                          className="text-xs px-2 py-0.5 rounded font-semibold"
                          style={{
                            backgroundColor: "rgba(5,150,105,0.15)",
                            color: "#10b981",
                            fontFamily: "var(--font-family-label)",
                          }}
                        >
                          Yeni
                        </span>
                      )}
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-family-label)" }}
                    >
                      {product.series}
                    </span>
                  </div>

                  <h3
                    className="text-base font-semibold text-white mb-2"
                    style={{ fontFamily: "var(--font-family-headline)" }}
                  >
                    {product.name}
                  </h3>
                  <p
                    className="text-xs leading-relaxed mb-4 line-clamp-2"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    {product.description}
                  </p>

                  {/* İlk 3 spec */}
                  <div className="space-y-1.5">
                    {product.specs.slice(0, 3).map((spec) => (
                      <div key={spec.label} className="flex items-center justify-between gap-2">
                        <span
                          className="text-xs"
                          style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-family-label)" }}
                        >
                          {spec.label}
                        </span>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: brand.accentColor }}
                        >
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {product.targetAudience.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: "rgba(141,144,162,0.1)",
                          color: "var(--color-on-surface-variant)",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <ArrowRight
                    className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                    style={{ color: brand.accentColor }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="py-14 px-5 lg:px-20 max-w-[1280px] mx-auto">
        <div
          className="industrial-border rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ backgroundColor: "#191c1e" }}
        >
          <div className="flex items-center gap-4">
            <Star className="w-8 h-8 shrink-0" style={{ color: brand.accentColor }} />
            <div>
              <h2
                className="text-lg font-bold text-white mb-1"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                {brand.name} Yetkili Partner
              </h2>
              <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                Fiyat teklifi, teknik danışmanlık ve kurulum için iletişime geçin.
              </p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href={`/${locale}/iletisim`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-xs"
              style={{
                backgroundColor: brand.accentColor,
                color: "white",
                fontFamily: "var(--font-family-label)",
              }}
            >
              Teklif Al
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href="tel:+903122320288"
              className="inline-flex items-center px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-xs"
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
                fontFamily: "var(--font-family-label)",
              }}
            >
              Ara
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
