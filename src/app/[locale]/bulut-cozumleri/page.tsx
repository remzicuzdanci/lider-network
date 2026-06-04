import type { Metadata } from "next";
import Link from "next/link";
import { Cloud, Shield, Network, Mail } from "lucide-react";
import FaqSection from "@/components/seo/FaqSection";
import RelatedArticles from "@/components/seo/RelatedArticles";
import { bulutFaqs } from "@/lib/service-faqs";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Bulut Çözümleri | Azure, AWS, Hibrit Bulut - Lider Network",
    description:
      "Lider Network ile kurumsal bulut hizmetleri: Microsoft Azure, AWS yönetimi, hibrit bulut mimarisi, Zero-Trust güvenlik ve %99.9 uptime garantisi. Ölçeklenebilir ve güvenli bulut altyapısı.",
    keywords: [
      "bulut çözümleri",
      "Azure yönetimi",
      "AWS yönetimi",
      "hibrit bulut",
      "cloud migration",
      "bulut güvenliği",
      "SASE",
      "Zero Trust bulut",
      "bulut danışmanlık",
      "managed cloud",
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/bulut-cozumleri`,
      languages: {
        tr: `${baseUrl}/tr/bulut-cozumleri`,
        en: `${baseUrl}/en/bulut-cozumleri`,
      },
    },
    openGraph: {
      title: "Bulut Çözümleri | Azure & AWS Yönetimi - Lider Network",
      description:
        "Modern işletmeler için ölçeklenebilir, güvenli bulut altyapıları. Karmaşıklığı yönetiyoruz, siz sadece işinizi büyütüyorsunuz.",
      url: `${baseUrl}/${locale}/bulut-cozumleri`,
    },
  };
}

export default async function BulutCozumleriPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Bulut Çözümleri",
    provider: {
      "@type": "Organization",
      name: "Lider Network Teknoloji",
      url: baseUrl,
    },
    description:
      "Azure ve AWS ekosisteminde derin uzmanlıkla hibrit ve özel bulut altyapısı kurulumu ve yönetimi.",
    areaServed: "TR",
    serviceType: "Cloud Solutions",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="pt-24">
        {/* Hero Section */}
        <section
          className="relative min-h-[80vh] flex items-center overflow-hidden"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(0,82,255,0.1) 0%, rgba(16,20,21,0) 70%)",
            }}
          />
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center relative z-10 w-full">
            <div className="space-y-8">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border"
                style={{
                  backgroundColor: "rgba(183,196,255,0.05)",
                  borderColor: "rgba(183,196,255,0.2)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: "var(--color-primary)" }}
                />
                <span
                  className="uppercase tracking-widest"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                    color: "var(--color-primary)",
                  }}
                >
                  Enterprise Cloud 2.0
                </span>
              </div>

              <h1
                className="text-5xl lg:text-6xl font-bold leading-tight"
                style={{
                  fontFamily: "var(--font-family-headline)",
                  letterSpacing: "-0.02em",
                }}
              >
                Bulutun Esnekliği,
                <br />
                <span style={{ color: "var(--color-primary)" }}>
                  Lider&apos;in Gücüyle
                </span>{" "}
                Birleşiyor
              </h1>

              <p
                className="text-lg max-w-xl leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Modern işletmeler için ölçeklenebilir, güvenli ve yüksek
                performanslı bulut altyapıları. Karmaşıklığı yönetiyoruz, siz
                sadece işinizi büyütüyorsunuz.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href={`/${locale}/iletisim`}
                  className="btn-brand-blue px-8 py-4 rounded-lg font-bold flex items-center gap-2"
                >
                  Danışmanlık Al →
                </Link>
                <Link
                  href={`/${locale}/hizmetler`}
                  className="px-8 py-4 rounded-lg font-bold transition-colors"
                  style={{
                    border: "1px solid rgba(141,144,162,0.3)",
                    color: "var(--color-on-surface)",
                  }}
                >
                  Çözümlerimizi İnceleyin
                </Link>
              </div>
            </div>

            {/* Cloud Visual */}
            <div className="relative aspect-square flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: "radial-gradient(ellipse at 40% 40%, rgba(0,82,255,0.15) 0%, rgba(0,120,212,0.08) 40%, transparent 70%)",
                  border: "1px solid rgba(0,82,255,0.15)",
                }}
              />
              <svg viewBox="0 0 400 400" className="w-full h-full p-6" xmlns="http://www.w3.org/2000/svg">
                {/* Outer ring */}
                <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(0,82,255,0.12)" strokeWidth="1" strokeDasharray="6 4" />
                <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(0,82,255,0.08)" strokeWidth="1" strokeDasharray="4 6" />
                {/* Center cloud node */}
                <circle cx="200" cy="200" r="48" fill="rgba(0,82,255,0.18)" stroke="rgba(0,82,255,0.4)" strokeWidth="1.5" />
                <text x="200" y="194" textAnchor="middle" fill="#0052ff" fontSize="11" fontWeight="700" fontFamily="monospace">CLOUD</text>
                <text x="200" y="210" textAnchor="middle" fill="rgba(0,82,255,0.7)" fontSize="9" fontFamily="monospace">PLATFORM</text>
                {/* Azure node */}
                <circle cx="100" cy="120" r="34" fill="rgba(0,120,212,0.15)" stroke="rgba(0,120,212,0.5)" strokeWidth="1.5" />
                <text x="100" y="116" textAnchor="middle" fill="#0078d4" fontSize="9" fontWeight="700" fontFamily="monospace">AZURE</text>
                <text x="100" y="129" textAnchor="middle" fill="rgba(0,120,212,0.7)" fontSize="7.5" fontFamily="monospace">Microsoft</text>
                <line x1="132" y1="141" x2="162" y2="167" stroke="rgba(0,120,212,0.3)" strokeWidth="1" strokeDasharray="3 3" />
                {/* AWS node */}
                <circle cx="310" cy="120" r="34" fill="rgba(255,153,0,0.1)" stroke="rgba(255,153,0,0.5)" strokeWidth="1.5" />
                <text x="310" y="116" textAnchor="middle" fill="#ff9900" fontSize="9" fontWeight="700" fontFamily="monospace">AWS</text>
                <text x="310" y="129" textAnchor="middle" fill="rgba(255,153,0,0.7)" fontSize="7.5" fontFamily="monospace">Amazon</text>
                <line x1="278" y1="141" x2="238" y2="167" stroke="rgba(255,153,0,0.3)" strokeWidth="1" strokeDasharray="3 3" />
                {/* On-Premise node */}
                <circle cx="110" cy="300" r="30" fill="rgba(5,150,105,0.1)" stroke="rgba(5,150,105,0.4)" strokeWidth="1.5" />
                <text x="110" y="297" textAnchor="middle" fill="#059669" fontSize="8" fontWeight="700" fontFamily="monospace">ON-PREM</text>
                <text x="110" y="309" textAnchor="middle" fill="rgba(5,150,105,0.7)" fontSize="7" fontFamily="monospace">Datacenter</text>
                <line x1="138" y1="282" x2="168" y2="240" stroke="rgba(5,150,105,0.3)" strokeWidth="1" strokeDasharray="3 3" />
                {/* FortiSASE node */}
                <circle cx="300" cy="300" r="30" fill="rgba(238,49,36,0.1)" stroke="rgba(238,49,36,0.35)" strokeWidth="1.5" />
                <text x="300" y="297" textAnchor="middle" fill="#EE3124" fontSize="8" fontWeight="700" fontFamily="monospace">SASE</text>
                <text x="300" y="309" textAnchor="middle" fill="rgba(238,49,36,0.7)" fontSize="7" fontFamily="monospace">FortiSASE</text>
                <line x1="272" y1="282" x2="240" y2="242" stroke="rgba(238,49,36,0.25)" strokeWidth="1" strokeDasharray="3 3" />
                {/* Pulse dots */}
                <circle cx="100" cy="120" r="40" fill="none" stroke="rgba(0,120,212,0.2)" strokeWidth="0.5">
                  <animate attributeName="r" values="34;44;34" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="310" cy="120" r="40" fill="none" stroke="rgba(255,153,0,0.2)" strokeWidth="0.5">
                  <animate attributeName="r" values="34;44;34" dur="3.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="3.5s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
          </div>
        </section>

        {/* Azure & AWS Section */}
        <section
          className="py-24"
          style={{ backgroundColor: "#0b0f10" }}
        >
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
              <div className="max-w-2xl">
                <h2
                  className="text-4xl font-semibold mb-4"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  Küresel Standartlarda Yönetim
                </h2>
                <p
                  className="text-lg"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Azure ve AWS ekosistemlerinde derin uzmanlık ile
                  altyapınızı optimize ediyoruz.
                </p>
              </div>
              <div className="flex gap-4 items-center">
                <span
                  className="px-4 py-2 rounded font-bold uppercase tracking-widest text-xs"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    backgroundColor: "rgba(0,82,255,0.2)",
                    color: "var(--color-primary)",
                    border: "1px solid rgba(0,82,255,0.3)",
                  }}
                >
                  Azure Partner
                </span>
                <span
                  className="px-4 py-2 rounded font-bold uppercase tracking-widest text-xs"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    backgroundColor: "rgba(255,153,0,0.15)",
                    color: "#ff9900",
                    border: "1px solid rgba(255,153,0,0.3)",
                  }}
                >
                  AWS Partner
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Card */}
              <div
                className="industrial-border rounded-xl overflow-hidden group transition-all hover:border-primary/50"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                {/* Dashboard Visual */}
                <div
                  className="aspect-video overflow-hidden relative flex flex-col justify-between p-5"
                  style={{
                    background: "linear-gradient(135deg, #0d1117 0%, #0c1a2e 50%, #0d1117 100%)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Top bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 opacity-70" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500 opacity-70" />
                      <div className="w-2 h-2 rounded-full bg-green-500 opacity-70" />
                      <span className="ml-2 text-xs font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>cloud-management-portal</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ backgroundColor: "rgba(0,120,212,0.2)", color: "#0078d4", border: "1px solid rgba(0,120,212,0.3)" }}>Azure</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ backgroundColor: "rgba(255,153,0,0.15)", color: "#ff9900", border: "1px solid rgba(255,153,0,0.3)" }}>AWS</span>
                    </div>
                  </div>
                  {/* Metric bars */}
                  <div className="space-y-2.5 mt-3">
                    {[
                      { label: "CPU Kullanımı", pct: 42, color: "#0078d4" },
                      { label: "Depolama", pct: 67, color: "#ff9900" },
                      { label: "Ağ Trafiği", pct: 28, color: "#059669" },
                      { label: "Güvenlik Skoru", pct: 94, color: "#0052ff" },
                    ].map(({ label, pct, color }) => (
                      <div key={label}>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
                          <span className="text-[10px] font-bold font-mono" style={{ color }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.8 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Bottom status */}
                  <div className="flex items-center gap-3 mt-3">
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: "#22c55e" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                      Tüm sistemler çevrimiçi
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>7/24 izleme aktif</span>
                  </div>
                </div>
                <div className="p-8">
                  <div
                    className="flex items-center gap-3 mb-4"
                    style={{ color: "var(--color-primary)" }}
                  >
                    <Cloud className="w-5 h-5" />
                    <span
                      className="uppercase tracking-widest"
                      style={{
                        fontFamily: "var(--font-family-label)",
                        fontSize: "12px",
                      }}
                    >
                      Azure & AWS Management
                    </span>
                  </div>
                  <h3
                    className="text-2xl font-semibold mb-4"
                    style={{ fontFamily: "var(--font-family-headline)" }}
                  >
                    Uçtan Uca Platform Yönetimi
                  </h3>
                  <p
                    className="mb-6 leading-relaxed"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    Maliyet optimizasyonu, otomatik ölçeklendirme ve 7/24
                    izleme ile bulut yatırımınızın karşılığını alın.
                  </p>
                  <Link
                    href={`/${locale}/iletisim`}
                    className="inline-flex items-center gap-2 font-bold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Detayları Keşfet →
                  </Link>
                </div>
              </div>

              {/* Secondary Cards */}
              <div className="grid grid-rows-2 gap-6">
                {[
                  {
                    icon: Shield,
                    title: "Gelişmiş Bulut Güvenliği",
                    desc: "Zero-Trust mimarisiyle verilerinizi tehditlere karşı tam koruma altına alıyoruz.",
                    tags: ["FW", "IAM", "SOC"],
                  },
                  {
                    icon: Network,
                    title: "Hibrit Bulut Stratejileri",
                    desc: "On-premise sistemlerinizle bulut arasındaki köprüyü kusursuz kuruyoruz.",
                    progress: 67,
                  },
                ].map(({ icon: Icon, title, desc, tags, progress }) => (
                  <div
                    key={title}
                    className="industrial-border p-8 rounded-xl flex flex-col justify-between transition-colors"
                    style={{ backgroundColor: "rgba(29,32,34,0.6)" }}
                  >
                    <div>
                      <Icon
                        className="w-8 h-8 mb-2"
                        style={{ color: "var(--color-primary)" }}
                      />
                      <h3
                        className="text-xl font-semibold mb-2"
                        style={{ fontFamily: "var(--font-family-headline)" }}
                      >
                        {title}
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        {desc}
                      </p>
                    </div>
                    {tags && (
                      <div className="mt-4 flex -space-x-2">
                        {tags.map((tag) => (
                          <div
                            key={tag}
                            className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs text-white font-bold"
                            style={{
                              backgroundColor: "#0052ff",
                              borderColor: "var(--color-surface)",
                            }}
                          >
                            {tag}
                          </div>
                        ))}
                      </div>
                    )}
                    {progress && (
                      <div
                        className="mt-4 h-2 w-full rounded-full overflow-hidden"
                        style={{ backgroundColor: "rgba(141,144,162,0.1)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: "var(--color-primary)",
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 relative">
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                value: "99.9%",
                title: "Uptime Garantisi",
                desc: "Kritik iş yükleriniz için kesintisiz çalışma taahhüdü veriyoruz.",
              },
              {
                value: "24/7",
                title: "Aktif İzleme",
                desc: "Siber tehditlere karşı sürekli monitoring ve anında müdahale.",
              },
              {
                value: "60%",
                title: "Maliyet Tasarrufu",
                desc: "Akıllı kaynak yönetimi ile bulut faturalarınızda ciddi azalma.",
              },
            ].map(({ value, title, desc }) => (
              <div
                key={title}
                className="p-8 space-y-4"
                style={{ borderLeft: "1px solid rgba(183,196,255,0.3)" }}
              >
                <span
                  className="text-5xl font-bold"
                  style={{
                    fontFamily: "var(--font-family-headline)",
                    color: "var(--color-primary)",
                  }}
                >
                  {value}
                </span>
                <h4 className="text-lg font-bold">{title}</h4>
                <p style={{ color: "var(--color-on-surface-variant)" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
          <div
            className="absolute inset-0 -z-10 opacity-5 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(#b7c4ff 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </section>

        {/* CTA Section */}
        <section className="py-16 px-5 lg:px-20">
          <div
            className="max-w-[1280px] mx-auto rounded-2xl p-16 text-center relative overflow-hidden"
            style={{ backgroundColor: "#0052ff" }}
          >
            <div className="relative z-10 max-w-3xl mx-auto space-y-4">
              <h2
                className="text-4xl font-semibold text-white"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Altyapınızı Geleceğe Taşıyalım
              </h2>
              <p className="text-lg" style={{ color: "rgba(255,255,255,0.8)" }}>
                Ücretsiz bulut denetimi ve yol haritası için uzmanlarımızla
                görüşün.
              </p>
              <div className="pt-4">
                <Link
                  href={`/${locale}/iletisim`}
                  className="inline-block bg-white font-bold text-lg px-10 py-5 rounded-lg transition-transform hover:scale-105"
                  style={{ color: "#0052ff" }}
                >
                  Ücretsiz Randevu Al
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                <span>veya doğrudan ulaşın:</span>
                <a href="mailto:satis@lidernetwork.com.tr" className="flex items-center gap-1.5 font-medium text-white transition-opacity hover:opacity-80">
                  <Mail className="w-4 h-4" />
                  satis@lidernetwork.com.tr
                </a>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
                <a href="mailto:sales@lidernetwork.com.tr" className="flex items-center gap-1.5 font-medium text-white transition-opacity hover:opacity-80">
                  <Mail className="w-4 h-4" />
                  sales@lidernetwork.com.tr
                </a>
              </div>
            </div>
            <div
              className="absolute top-0 right-0 w-96 h-96 -mr-48 -mt-48 rounded-full pointer-events-none"
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                filter: "blur(100px)",
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-96 h-96 -ml-48 -mb-48 rounded-full pointer-events-none"
              style={{
                backgroundColor: "rgba(0,0,0,0.2)",
                filter: "blur(100px)",
              }}
            />
          </div>
        </section>

        <FaqSection items={bulutFaqs} />
        <RelatedArticles serviceSlug="bulut-cozumleri" locale={locale} />
      </main>
    </>
  );
}
