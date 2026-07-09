import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle, Phone, Mail, ArrowRight } from "lucide-react";
import { allProducts, getBrand, getProduct } from "@/data/products";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateStaticParams() {
  return allProducts.flatMap((p) => [
    { locale: "tr", brand: p.brandSlug, model: p.slug },
    { locale: "en", brand: p.brandSlug, model: p.slug },
  ]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; brand: string; model: string }>;
}): Promise<Metadata> {
  const { locale, brand: brandSlug, model: modelSlug } = await params;
  const product = getProduct(brandSlug, modelSlug);
  if (!product) return {};
  return {
    title: product.metaTitle,
    description: product.metaDescription,
    keywords: product.keywords,
    alternates: {
      canonical: `${baseUrl}/${locale}/urunler/${brandSlug}/${modelSlug}`,
      languages: {
        tr: `${baseUrl}/tr/urunler/${brandSlug}/${modelSlug}`,
        en: `${baseUrl}/en/urunler/${brandSlug}/${modelSlug}`,
      },
    },
    openGraph: {
      title: product.metaTitle,
      description: product.metaDescription,
      url: `${baseUrl}/${locale}/urunler/${brandSlug}/${modelSlug}`,
    },
  };
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ locale: string; brand: string; model: string }>;
}) {
  const { locale, brand: brandSlug, model: modelSlug } = await params;
  const product = getProduct(brandSlug, modelSlug);
  if (!product) notFound();

  const brand = getBrand(brandSlug);
  const accentColor = brand?.accentColor ?? "var(--color-primary)";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.metaDescription,
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Lider Network Teknoloji",
        url: baseUrl,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="pt-20">
        {/* Breadcrumb + Hero */}
        <section
          className="py-14 px-5 lg:px-20 max-w-[1280px] mx-auto"
          style={{ borderBottom: "1px solid rgba(141,144,162,0.15)" }}
        >
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-8 text-xs flex-wrap" style={{ color: "var(--color-on-surface-variant)" }}>
            <Link href={`/${locale}/urunler`} className="hover:opacity-75">Ürünler</Link>
            <span>/</span>
            <Link href={`/${locale}/urunler/${brandSlug}`} className="hover:opacity-75">{product.brand}</Link>
            <span>/</span>
            <span className="text-white">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{
                    backgroundColor: `${accentColor}12`,
                    color: accentColor,
                    border: `1px solid ${accentColor}25`,
                    fontFamily: "var(--font-family-label)",
                  }}
                >
                  {product.category} — {product.series}
                </span>
                {product.badge && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{
                      backgroundColor: `${accentColor}18`,
                      color: accentColor,
                      fontFamily: "var(--font-family-label)",
                    }}
                  >
                    {product.badge}
                  </span>
                )}
                {product.isNew && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{
                      backgroundColor: "rgba(16,185,129,0.12)",
                      color: "#10b981",
                      fontFamily: "var(--font-family-label)",
                    }}
                  >
                    Yeni Nesil
                  </span>
                )}
              </div>

              <h1
                className="text-4xl lg:text-5xl font-bold text-white mb-4"
                style={{ fontFamily: "var(--font-family-headline)", letterSpacing: "-0.02em" }}
              >
                {product.name}
              </h1>
              <p className="text-lg leading-relaxed mb-6" style={{ color: "var(--color-on-surface-variant)" }}>
                {product.description}
              </p>

              {/* Hedef Kitle */}
              <div className="flex flex-wrap gap-2 mb-8">
                {product.targetAudience.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: "rgba(141,144,162,0.1)",
                      border: "1px solid rgba(141,144,162,0.2)",
                      color: "var(--color-on-surface-variant)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* CTA Butonları */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/iletisim`}
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-lg font-bold uppercase tracking-widest"
                  style={{
                    backgroundColor: accentColor,
                    color: "white",
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                  }}
                >
                  Teklif Al
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="tel:+903122320288"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-lg font-bold uppercase tracking-widest"
                  style={{
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                  }}
                >
                  <Phone className="w-4 h-4" />
                  Hemen Ara
                </a>
              </div>
            </div>

            {/* Teknik Özellikler */}
            <div
              className="industrial-border rounded-2xl p-6"
              style={{ backgroundColor: "#191c1e" }}
            >
              <h2
                className="text-sm font-semibold mb-5 uppercase tracking-wider"
                style={{
                  fontFamily: "var(--font-family-label)",
                  color: "var(--color-on-surface-variant)",
                }}
              >
                Teknik Özellikler
              </h2>
              <div className="divide-y" style={{ borderColor: "rgba(141,144,162,0.1)" }}>
                {product.specs.map((spec) => (
                  <div key={spec.label} className="flex items-center justify-between gap-4 py-3">
                    <span className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                      {spec.label}
                    </span>
                    <span
                      className="text-sm font-semibold text-right"
                      style={{ color: "white" }}
                    >
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="mt-5 pt-5 border-t text-xs"
                style={{
                  borderColor: "rgba(141,144,162,0.1)",
                  color: "var(--color-on-surface-variant)",
                }}
              >
                * Teknik özellikler üretici firma tarafından güncelleniyor olabilir. Güncel datasheet için iletişime geçin.
              </div>
            </div>
          </div>
        </section>

        {/* Öne Çıkan Özellikler */}
        {product.highlights.length > 0 && (
          <section className="py-14 px-5 lg:px-20 max-w-[1280px] mx-auto">
            <h2
              className="text-2xl font-bold text-white mb-8"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Öne Çıkan{" "}
              <span style={{ color: accentColor }}>Özellikler</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.highlights.map((h, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 industrial-border rounded-xl p-5"
                  style={{ backgroundColor: "#191c1e" }}
                >
                  <CheckCircle
                    className="w-5 h-5 shrink-0 mt-0.5"
                    style={{ color: accentColor }}
                  />
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                    {h}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* İletişim CTA */}
        <section
          className="py-14 border-t"
          style={{ borderColor: "rgba(141,144,162,0.15)", backgroundColor: "#0b0f10" }}
        >
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2
                className="text-2xl lg:text-3xl font-bold text-white mb-3"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                {product.name} için Teklif Alın
              </h2>
              <p className="text-base" style={{ color: "var(--color-on-surface-variant)" }}>
                Ankara merkezli {product.brand} yetkili partneriyiz. Fiyat teklifi, teknik
                danışmanlık, kurulum ve sonrası destek için iletişime geçin.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/${locale}/iletisim`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-bold uppercase tracking-widest text-xs"
                style={{
                  backgroundColor: accentColor,
                  color: "white",
                  fontFamily: "var(--font-family-label)",
                }}
              >
                Teklif Formu
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="mailto:info@lidernetwork.com.tr"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-bold uppercase tracking-widest text-xs"
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "white",
                  fontFamily: "var(--font-family-label)",
                }}
              >
                <Mail className="w-4 h-4" />
                E-posta
              </a>
              <a
                href="tel:+903122320288"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-bold uppercase tracking-widest text-xs"
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "white",
                  fontFamily: "var(--font-family-label)",
                }}
              >
                <Phone className="w-4 h-4" />
                Telefon
              </a>
            </div>
          </div>
        </section>

        {/* Geri dön */}
        <div className="py-6 px-5 lg:px-20 max-w-[1280px] mx-auto">
          <Link
            href={`/${locale}/urunler/${brandSlug}`}
            className="inline-flex items-center gap-2 text-sm hover:opacity-75 transition-opacity"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            {product.brand} Ürünlerine Dön
          </Link>
        </div>
      </main>
    </>
  );
}
