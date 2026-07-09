import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Heart, Landmark, GraduationCap, Factory, ShoppingCart } from "lucide-react";
import { sectors } from "@/data/sectors";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Sektörel Çözümler | Finans, Sağlık, Kamu, Üretim — Lider Network",
    description:
      "Lider Network, finans, sağlık, kamu, eğitim, üretim ve perakende sektörlerine özel kurumsal siber güvenlik, ağ altyapısı ve veri depolama çözümleri sunar.",
    keywords: [
      "sektörel BT çözümleri",
      "finans siber güvenlik",
      "sağlık BT altyapısı",
      "kamu siber güvenlik",
      "üretim OT güvenliği",
      "eğitim kampüs ağı",
      "perakende PCI-DSS",
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/sektorler`,
      languages: {
        tr: `${baseUrl}/tr/sektorler`,
        en: `${baseUrl}/en/sektorler`,
      },
    },
    openGraph: {
      title: "Sektörel BT ve Güvenlik Çözümleri — Lider Network",
      description:
        "Her sektörün kendine özgü düzenleyici gereksinimleri ve operasyonel riskleri vardır. Lider Network, sektörünüzü anlayan çözümler sunar.",
      url: `${baseUrl}/${locale}/sektorler`,
    },
  };
}

const sectorIcons: Record<string, React.ElementType> = {
  finans: Building2,
  saglik: Heart,
  kamu: Landmark,
  egitim: GraduationCap,
  uretim: Factory,
  perakende: ShoppingCart,
};

export default async function SektorlerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Sektörel BT ve Güvenlik Çözümleri",
    description:
      "Finans, sağlık, kamu, eğitim, üretim ve perakende sektörlerine özel kurumsal BT çözümleri.",
    url: `${baseUrl}/${locale}/sektorler`,
    provider: {
      "@type": "Organization",
      name: "Lider Network Teknoloji",
      url: baseUrl,
    },
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
          className="py-24 px-5 lg:px-20 max-w-[1280px] mx-auto"
          style={{ borderBottom: "1px solid rgba(141,144,162,0.15)" }}
        >
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-8"
              style={{
                backgroundColor: "rgba(0,82,255,0.08)",
                borderColor: "rgba(0,82,255,0.25)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "var(--color-primary)" }}
              />
              <span
                className="uppercase tracking-[0.2em]"
                style={{
                  fontFamily: "var(--font-family-label)",
                  fontSize: "11px",
                  color: "var(--color-primary)",
                }}
              >
                Sektörel Uzmanlık
              </span>
            </div>

            <h1
              className="text-5xl lg:text-6xl font-bold leading-tight mb-6"
              style={{
                fontFamily: "var(--font-family-headline)",
                letterSpacing: "-0.02em",
                color: "var(--color-on-surface)",
              }}
            >
              Sektörünüzü Anlayan{" "}
              <span style={{ color: "var(--color-primary)" }}>BT Çözümleri</span>
            </h1>

            <p
              className="text-lg leading-relaxed max-w-2xl"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Her sektörün kendine özgü düzenleyici gereksinimleri, operasyonel riskleri
              ve kritik sistemleri vardır. Lider Network olarak sektörünüzün dilini konuşuyor,
              size özel çözümler tasarlıyoruz. FortiGate ve Synology ürün ailesiyle
              finans'tan üretime, sağlıktan kamuya kapsamlı BT partnerliği sağlıyoruz.
            </p>
          </div>
        </section>

        {/* Sector Grid */}
        <section className="py-16 px-5 lg:px-20 max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sectors.map((sector) => {
              const Icon = sectorIcons[sector.slug] ?? Building2;
              return (
                <Link
                  key={sector.slug}
                  href={`/${locale}/sektorler/${sector.slug}`}
                  className="group industrial-border rounded-xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1"
                  style={{
                    backgroundColor: "#191c1e",
                    minHeight: 280,
                  }}
                >
                  <div>
                    {/* Badge */}
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold mb-5"
                      style={{
                        backgroundColor: `${sector.accentColor}18`,
                        color: sector.accentColor,
                        fontFamily: "var(--font-family-label)",
                        border: `1px solid ${sector.accentColor}30`,
                      }}
                    >
                      {sector.badge}
                    </div>

                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center mb-5"
                      style={{ backgroundColor: `${sector.accentColor}15` }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: sector.accentColor }}
                      />
                    </div>

                    <h2
                      className="text-xl font-semibold text-white mb-3"
                      style={{ fontFamily: "var(--font-family-headline)" }}
                    >
                      {sector.title}
                    </h2>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {sector.excerpt}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center gap-2">
                    <span
                      className="text-sm font-semibold transition-all duration-200 group-hover:gap-3"
                      style={{
                        fontFamily: "var(--font-family-label)",
                        color: sector.accentColor,
                      }}
                    >
                      Çözümleri İncele
                    </span>
                    <ArrowRight
                      className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                      style={{ color: sector.accentColor }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Why Industry-Specific */}
        <section
          className="py-16 border-y"
          style={{
            backgroundColor: "#0b0f10",
            borderColor: "rgba(141,144,162,0.15)",
          }}
        >
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2
                  className="text-4xl font-bold text-white mb-6"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  Genel Çözüm Yok,{" "}
                  <span style={{ color: "var(--color-primary)" }}>
                    Sektöre Özel Yaklaşım
                  </span>
                </h2>
                <p
                  className="text-base leading-relaxed mb-8"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Bir hastane ile bir fabrika aynı güvenlik risklerini taşımaz. Bir üniversite
                  kampüsü ile bir perakende zincirinin BT gereksinimleri birbirinden farklıdır.
                  Lider Network, her sektörün regülatif yükümlülüklerini, operasyonel kısıtlarını
                  ve teknoloji altyapısını anlayarak çözüm tasarlar.
                </p>

                <div className="space-y-4">
                  {[
                    "Sektörünüze ait regülasyonları biliriz (BDDK, KVKK, BTK, PCI-DSS...)",
                    "Sektörünüzde kullanılan sistemleri ve protokolleri destekleriz",
                    "Uygulama öncesinde sektör özelinde risk değerlendirmesi yaparız",
                    "Sektörel referanslarımızla kanıtlanmış deneyim sunarız",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: "rgba(0,82,255,0.15)" }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: "var(--color-primary)" }}
                        />
                      </div>
                      <span
                        className="text-sm"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "20+", label: "Yıllık Deneyim", sub: "2006'dan bu yana" },
                  { value: "500+", label: "Aktif Proje", sub: "Farklı sektörlerde" },
                  { value: "6", label: "Hedef Sektör", sub: "Uzman ekipler" },
                  { value: "7/24", label: "Teknik Destek", sub: "Kesintisiz hizmet" },
                ].map(({ value, label, sub }) => (
                  <div
                    key={label}
                    className="industrial-border rounded-xl p-6 text-center"
                    style={{ backgroundColor: "#191c1e" }}
                  >
                    <div
                      className="text-4xl font-bold mb-1"
                      style={{
                        fontFamily: "var(--font-family-headline)",
                        color: "var(--color-primary)",
                      }}
                    >
                      {value}
                    </div>
                    <div
                      className="text-sm font-semibold text-white mb-0.5"
                      style={{ fontFamily: "var(--font-family-label)" }}
                    >
                      {label}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-5 lg:px-20 max-w-[1280px] mx-auto text-center relative overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{
              backgroundColor: "rgba(0,82,255,0.08)",
              filter: "blur(100px)",
            }}
          />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2
              className="text-4xl lg:text-5xl font-semibold text-white mb-6"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Sektörünüz Hangi Çözümü Gerektiriyor?
            </h2>
            <p
              className="text-lg mb-10 leading-relaxed"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Teknik ekibimiz sektörünüzün gereksinimlerini değerlendirerek
              size en uygun FortiGate ve Synology çözüm mimarisini tasarlar.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={`/${locale}/iletisim`}
                className="px-8 py-4 rounded-lg font-bold uppercase tracking-widest transition-all"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "white",
                  fontFamily: "var(--font-family-label)",
                  fontSize: "12px",
                }}
              >
                Uzmanla Görüş
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
                +90 312 232 02 88
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
