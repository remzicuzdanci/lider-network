import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2, Heart, Landmark, GraduationCap, Factory, ShoppingCart,
  AlertTriangle, CheckCircle, ArrowLeft, Mail, Phone,
} from "lucide-react";
import { sectors, getSector } from "@/data/sectors";

const baseUrl = "https://www.lidernetwork.com.tr";

const sectorIcons: Record<string, React.ElementType> = {
  finans: Building2,
  saglik: Heart,
  kamu: Landmark,
  egitim: GraduationCap,
  uretim: Factory,
  perakende: ShoppingCart,
};

export async function generateStaticParams() {
  return sectors.map((s) => ({ sector: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; sector: string }>;
}): Promise<Metadata> {
  const { locale, sector: sectorSlug } = await params;
  const sector = getSector(sectorSlug);
  if (!sector) return {};

  return {
    title: sector.metaTitle,
    description: sector.metaDescription,
    keywords: sector.keywords,
    alternates: {
      canonical: `${baseUrl}/${locale}/sektorler/${sector.slug}`,
      languages: {
        tr: `${baseUrl}/tr/sektorler/${sector.slug}`,
        en: `${baseUrl}/en/sektorler/${sector.slug}`,
      },
    },
    openGraph: {
      title: sector.metaTitle,
      description: sector.metaDescription,
      url: `${baseUrl}/${locale}/sektorler/${sector.slug}`,
    },
  };
}

export default async function SectorDetailPage({
  params,
}: {
  params: Promise<{ locale: string; sector: string }>;
}) {
  const { locale, sector: sectorSlug } = await params;
  const sector = getSector(sectorSlug);

  if (!sector) notFound();

  const Icon = sectorIcons[sector.slug] ?? Building2;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${sector.title} BT Çözümleri`,
    provider: {
      "@type": "Organization",
      name: "Lider Network Teknoloji",
      url: baseUrl,
    },
    description: sector.metaDescription,
    areaServed: "TR",
    serviceType: "IT Infrastructure & Cybersecurity",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="pt-20">
        {/* Hero */}
        <section
          className="relative min-h-[75vh] flex items-center overflow-hidden"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sector.heroImage}
              alt={sector.title}
              className="w-full h-full object-cover opacity-30"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, var(--color-background) 0%, rgba(16,20,21,0.85) 55%, transparent 100%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, var(--color-background) 0%, transparent 50%)",
              }}
            />
          </div>

          <div className="relative z-10 w-full px-5 lg:px-20 max-w-[1280px] mx-auto">
            {/* Breadcrumb */}
            <Link
              href={`/${locale}/sektorler`}
              className="inline-flex items-center gap-2 mb-8 text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Tüm Sektörler
            </Link>

            <div className="max-w-3xl space-y-6">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
                style={{
                  backgroundColor: `${sector.accentColor}12`,
                  borderColor: `${sector.accentColor}35`,
                }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: sector.accentColor }} />
                <span
                  className="uppercase tracking-[0.18em]"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontSize: "11px",
                    color: sector.accentColor,
                  }}
                >
                  {sector.badge}
                </span>
              </div>

              <h1
                className="text-5xl lg:text-7xl font-bold leading-tight"
                style={{
                  fontFamily: "var(--font-family-headline)",
                  letterSpacing: "-0.02em",
                }}
              >
                {sector.title}
                <br />
                <span style={{ color: sector.accentColor }}>{sector.subtitle}</span>
              </h1>

              <p
                className="text-lg max-w-2xl leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                {sector.excerpt}
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href={`/${locale}/iletisim`}
                  className="px-8 py-4 rounded-lg font-bold uppercase tracking-widest transition-all"
                  style={{
                    backgroundColor: sector.accentColor,
                    color: "white",
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                    boxShadow: `0 0 24px ${sector.accentColor}35`,
                  }}
                >
                  Çözüm Talebi
                </Link>
                <a
                  href="tel:+903122320288"
                  className="px-8 py-4 rounded-lg font-bold uppercase tracking-widest transition-all"
                  style={{
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                  }}
                >
                  Hemen Ara
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section
          className="py-10 border-y"
          style={{
            backgroundColor: "#0b0f10",
            borderColor: "rgba(141,144,162,0.15)",
          }}
        >
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {sector.stats.map(({ value, label }) => (
                <div key={label}>
                  <div
                    className="text-3xl lg:text-4xl font-bold mb-1"
                    style={{
                      fontFamily: "var(--font-family-headline)",
                      color: sector.accentColor,
                    }}
                  >
                    {value}
                  </div>
                  <div
                    className="uppercase tracking-widest"
                    style={{
                      fontFamily: "var(--font-family-label)",
                      fontSize: "11px",
                      color: "var(--color-on-surface-variant)",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section className="py-20 px-5 lg:px-20 max-w-[1280px] mx-auto">
          <div className="mb-12">
            <span
              className="uppercase tracking-[0.2em] text-xs mb-4 block"
              style={{
                fontFamily: "var(--font-family-label)",
                color: "var(--color-on-surface-variant)",
              }}
            >
              Sektörünüzün Zorlukları
            </span>
            <h2
              className="text-3xl lg:text-4xl font-bold text-white"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              {sector.title} Sektöründe{" "}
              <span style={{ color: sector.accentColor }}>Kritik Riskler</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sector.painPoints.map((point, i) => (
              <div
                key={i}
                className="industrial-border rounded-xl p-7"
                style={{ backgroundColor: "#191c1e" }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: "rgba(220,38,38,0.12)" }}
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <h3
                      className="text-base font-semibold text-white mb-2"
                      style={{ fontFamily: "var(--font-family-headline)" }}
                    >
                      {point.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {point.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Solutions */}
        <section
          className="py-20 border-t"
          style={{ borderColor: "rgba(141,144,162,0.15)" }}
        >
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto">
            <div className="mb-12">
              <span
                className="uppercase tracking-[0.2em] text-xs mb-4 block"
                style={{
                  fontFamily: "var(--font-family-label)",
                  color: "var(--color-on-surface-variant)",
                }}
              >
                Lider Network Çözümleri
              </span>
              <h2
                className="text-3xl lg:text-4xl font-bold text-white"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                {sector.title} İçin{" "}
                <span style={{ color: sector.accentColor }}>Özel Çözümler</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sector.solutions.map((solution, i) => (
                <div
                  key={i}
                  className="industrial-border rounded-xl p-7 flex flex-col"
                  style={{ backgroundColor: "#191c1e" }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${sector.accentColor}18` }}
                    >
                      <CheckCircle
                        className="w-4 h-4"
                        style={{ color: sector.accentColor }}
                      />
                    </div>
                    <h3
                      className="text-base font-semibold text-white leading-snug"
                      style={{ fontFamily: "var(--font-family-headline)" }}
                    >
                      {solution.title}
                    </h3>
                  </div>

                  <p
                    className="text-sm leading-relaxed mb-5"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    {solution.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {solution.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-1 rounded"
                        style={{
                          backgroundColor: `${sector.accentColor}12`,
                          color: sector.accentColor,
                          fontFamily: "var(--font-family-label)",
                          border: `1px solid ${sector.accentColor}25`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section
          className="py-14 border-y"
          style={{
            backgroundColor: "#0b0f10",
            borderColor: "rgba(141,144,162,0.15)",
          }}
        >
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="shrink-0">
                <p
                  className="uppercase tracking-[0.2em] text-xs mb-2"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    color: "var(--color-on-surface-variant)",
                  }}
                >
                  Uyumluluk Kapsamı
                </p>
                <h3
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  Desteklenen Standartlar
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {sector.compliance.map((item) => (
                  <span
                    key={item}
                    className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{
                      backgroundColor: "#191c1e",
                      border: "1px solid rgba(141,144,162,0.2)",
                      color: "var(--color-on-surface)",
                      fontFamily: "var(--font-family-label)",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-5 lg:px-20 max-w-[1280px] mx-auto relative overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              backgroundColor: `${sector.accentColor}08`,
              filter: "blur(120px)",
            }}
          />
          <div className="relative z-10 max-w-2xl">
            <h2
              className="text-4xl lg:text-5xl font-semibold text-white mb-6"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              {sector.title} İçin Özel Teklif Alın
            </h2>
            <p
              className="text-lg mb-10 leading-relaxed"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Teknik ekibimiz {sector.title.toLowerCase()} sektörünüzün gereksinimlerini
              değerlendirerek ihtiyacınıza uygun çözüm mimarisi tasarlar.
              Ücretsiz danışmanlık görüşmesi için iletişime geçin.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/${locale}/iletisim`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold uppercase tracking-widest transition-all"
                style={{
                  backgroundColor: sector.accentColor,
                  color: "white",
                  fontFamily: "var(--font-family-label)",
                  fontSize: "12px",
                }}
              >
                Teklif İste
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
              <a
                href="tel:+903122320288"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold uppercase tracking-widest"
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "white",
                  fontFamily: "var(--font-family-label)",
                  fontSize: "12px",
                }}
              >
                <Phone className="w-4 h-4" />
                +90 312 232 02 88
              </a>
              <a
                href="mailto:satis@lidernetwork.com.tr"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold uppercase tracking-widest"
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "white",
                  fontFamily: "var(--font-family-label)",
                  fontSize: "12px",
                }}
              >
                <Mail className="w-4 h-4" />
                E-posta Gönder
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
