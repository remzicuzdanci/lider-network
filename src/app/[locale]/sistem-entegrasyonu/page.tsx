import type { Metadata } from "next";
import Link from "next/link";
import { Network, Layers, Code, ShieldCheck, Zap, Mail } from "lucide-react";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Sistem Entegrasyonu | Anahtar Teslim IT Projeleri - Lider Network",
    description:
      "Lider Network sistem entegrasyonu: donanım entegrasyonu, yazılım katmanları, API yönetimi, ISO 27001 uyumluluk ve KVKK veri maskeleme. Uçtan uca anahtar teslim teknoloji altyapı projeleri.",
    keywords: [
      "sistem entegrasyonu",
      "IT entegrasyonu",
      "anahtar teslim proje",
      "ISO 27001",
      "API yönetimi",
      "kurumsal entegrasyon",
      "KVKK veri maskeleme",
      "donanım entegrasyonu",
      "yazılım entegrasyonu",
      "teknoloji altyapı",
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/sistem-entegrasyonu`,
      languages: {
        tr: `${baseUrl}/tr/sistem-entegrasyonu`,
        en: `${baseUrl}/en/sistem-entegrasyonu`,
      },
    },
    openGraph: {
      title: "Sistem Entegrasyonu | Lider Network",
      description:
        "Karmaşık IT altyapılarınızı tek bir merkezden siber güvenlik protokolleriyle tam uyumlu hale getiriyoruz.",
      url: `${baseUrl}/${locale}/sistem-entegrasyonu`,
    },
  };
}

export default async function SistemEntegrasyonuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Sistem Entegrasyonu Hizmetleri",
    provider: {
      "@type": "Organization",
      name: "Lider Network Teknoloji",
      url: baseUrl,
    },
    description:
      "Uçtan uca anahtar teslim teknoloji altyapı projeleri ve kurumsal entegrasyon hizmetleri.",
    areaServed: "TR",
    serviceType: "System Integration",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main
        className="relative"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
          <div className="absolute inset-0 z-0 opacity-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=80"
              alt="Veri Merkezi Koridoru"
              className="w-full h-full object-cover grayscale"
            />
          </div>
          <div
            className="absolute inset-0 z-10"
            style={{
              background:
                "linear-gradient(to right, var(--color-background) 0%, rgba(16,20,21,0.8) 60%, transparent 100%)",
            }}
          />

          <div className="relative z-20 px-5 lg:px-20 max-w-[1280px] mx-auto w-full">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-6">
                <span
                  className="w-12 h-px"
                  style={{ backgroundColor: "var(--color-primary)" }}
                />
                <span
                  className="uppercase tracking-[0.2em]"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                    color: "var(--color-primary)",
                  }}
                >
                  Sistem Entegrasyonu
                </span>
              </div>

              <h1
                className="text-5xl lg:text-7xl font-bold mb-6 leading-tight"
                style={{
                  fontFamily: "var(--font-family-headline)",
                  letterSpacing: "-0.02em",
                }}
              >
                Kusursuz Entegrasyon,
                <br />
                <span style={{ color: "var(--color-primary)" }}>
                  Tam Uyum.
                </span>
              </h1>

              <p
                className="text-lg mb-10 leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Karmaşık IT altyapılarınızı tek bir merkezden, siber güvenlik
                protokolleriyle tam uyumlu hale getiriyoruz. Donanımdan yazılım
                katmanlarına kadar her noktada kesintisiz performans.
              </p>

              <div className="flex flex-col md:flex-row gap-4">
                <Link
                  href={`/${locale}/iletisim`}
                  className="btn-brand-blue px-8 py-4 rounded font-bold flex items-center justify-center gap-2"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                    letterSpacing: "0.05em",
                  }}
                >
                  KEŞFEDIN →
                </Link>
                <Link
                  href={`/${locale}/hizmetler`}
                  className="px-8 py-4 rounded font-bold uppercase tracking-widest transition-colors"
                  style={{
                    border: "1px solid rgba(141,144,162,0.3)",
                    color: "var(--color-on-surface)",
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                  }}
                >
                  TEKNİK DETAYLAR
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-24 px-5 lg:px-20 max-w-[1280px] mx-auto circuit-pattern">
          <div className="text-center mb-20">
            <h2
              className="text-4xl font-semibold mb-4"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Hizmet Kapasitemiz
            </h2>
            <p
              className="max-w-xl mx-auto"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Modern altyapı gereksinimleriniz için bütünsel entegrasyon
              çözümleri sunuyoruz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Network,
                title: "Donanım Entegrasyonu",
                desc: "Fortigate, Juniper ve Cisco altyapılarınızın fiziksel ve mantıksal katmanlarda tam uyumla yapılandırılması.",
              },
              {
                icon: Layers,
                title: "Yazılım Katmanları",
                desc: "Sanallaştırma, konteynerizasyon ve işletim sistemi seviyesinde güvenli haberleşme mimarileri.",
              },
              {
                icon: Code,
                title: "API Yönetimi",
                desc: "Mikroservisler arası güvenli veri transferi ve API Gateway yapılandırmalarıyla tam kontrol.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-8 rounded hover:border-primary/50 transition-all duration-500 group"
                style={{
                  backgroundColor: "#121214",
                  border: "1px solid #232326",
                }}
              >
                <div
                  className="w-12 h-12 rounded flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors"
                  style={{ backgroundColor: "rgba(183,196,255,0.1)" }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: "var(--color-primary)" }}
                  />
                </div>
                <h3
                  className="text-2xl font-semibold mb-4"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  {title}
                </h3>
                <div
                  className="h-px w-full mb-6"
                  style={{ backgroundColor: "rgba(141,144,162,0.3)" }}
                />
                <p style={{ color: "var(--color-on-surface-variant)" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Infrastructure Visual */}
        <section
          className="py-24"
          style={{ backgroundColor: "#0b0f10" }}
        >
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative rounded-xl overflow-hidden shadow-2xl industrial-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80"
                alt="Ağ Altyapısı Detayları"
                className="w-full h-auto aspect-video object-cover"
              />
              <div
                className="absolute top-4 right-4 px-3 py-1 rounded flex items-center gap-2"
                style={{
                  backgroundColor: "rgba(16,20,21,0.8)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: "#10b981" }}
                />
                <span
                  className="text-xs uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-family-label)" }}
                >
                  Live Monitoring Active
                </span>
              </div>
            </div>

            <div>
              <h2
                className="text-4xl font-semibold mb-6"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Güvenlik Standartlarımız
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: ShieldCheck,
                    title: "ISO 27001 Uyumluluğu",
                    desc: "Bilgi güvenliği yönetim sistemlerinizde uluslararası standartlara tam uyum sağlıyoruz.",
                  },
                  {
                    icon: Layers,
                    title: "KVKK Veri Maskeleme",
                    desc: "Sistem entegrasyonu sırasında kişisel verilerin korunması için gelişmiş maskeleme yöntemleri.",
                  },
                  {
                    icon: Zap,
                    title: "Düşük Gecikme Süresi",
                    desc: "Ağ trafik yönetimi ile maksimum güvenlik sağlarken performanstan ödün vermeyen yapılar.",
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <Icon
                      className="w-6 h-6 shrink-0 mt-1"
                      style={{ color: "var(--color-primary)" }}
                    />
                    <div>
                      <h4 className="font-bold text-lg mb-1">{title}</h4>
                      <p style={{ color: "var(--color-on-surface-variant)" }}>
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-5 lg:px-20 max-w-[1280px] mx-auto">
          <div
            className="rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
            style={{ backgroundColor: "#121214", border: "1px solid #232326" }}
          >
            <div className="p-8 md:p-16">
              <h2
                className="text-4xl font-semibold mb-6"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Güvenlik Denetimi Başlatın
              </h2>
              <p
                className="mb-10 leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Mevcut altyapınızın entegrasyon seviyesini ve güvenlik açıklarını
                analiz etmek için uzmanlarımızla iletişime geçin.
              </p>
              <Link
                href={`/${locale}/iletisim`}
                className="inline-block w-full text-center py-4 rounded font-bold uppercase tracking-widest text-white transition-all hover:brightness-110"
                style={{
                  backgroundColor: "#ff5e07",
                  fontFamily: "var(--font-family-label)",
                  fontSize: "12px",
                }}
              >
                Acil Denetim Talebi Gönder
              </Link>
              <div className="flex flex-wrap items-center gap-3 mt-6 text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                <span>veya doğrudan:</span>
                <a href="mailto:satis@lidernetwork.com.tr" className="flex items-center gap-1.5 font-medium transition-colors hover:opacity-80" style={{ color: "var(--color-primary)" }}>
                  <Mail className="w-4 h-4" />
                  satis@lidernetwork.com.tr
                </a>
                <span style={{ color: "var(--color-outline)" }}>·</span>
                <a href="mailto:sales@lidernetwork.com.tr" className="flex items-center gap-1.5 font-medium transition-colors hover:opacity-80" style={{ color: "var(--color-primary)" }}>
                  <Mail className="w-4 h-4" />
                  sales@lidernetwork.com.tr
                </a>
              </div>
            </div>
            <div
              className="relative hidden md:block"
              style={{ backgroundColor: "#0b0f10" }}
            >
              <div
                className="absolute inset-0 circuit-pattern opacity-20"
                aria-hidden="true"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p
                    className="text-6xl font-bold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    15+
                  </p>
                  <p
                    className="mt-2 uppercase tracking-widest"
                    style={{
                      fontFamily: "var(--font-family-label)",
                      fontSize: "12px",
                      color: "var(--color-on-surface-variant)",
                    }}
                  >
                    Yıllık Sektörel Tecrübe
                  </p>
                  <p
                    className="mt-4 text-4xl font-bold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    500+
                  </p>
                  <p
                    className="mt-2 uppercase tracking-widest"
                    style={{
                      fontFamily: "var(--font-family-label)",
                      fontSize: "12px",
                      color: "var(--color-on-surface-variant)",
                    }}
                  >
                    Tamamlanan Proje
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
