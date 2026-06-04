import type { Metadata } from "next";
import Link from "next/link";
import { Shield, CheckCircle, AlertTriangle, Network, Mail } from "lucide-react";
import FaqSection from "@/components/seo/FaqSection";
import { siberGuvenlikFaqs } from "@/lib/service-faqs";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Siber Güvenlik Çözümleri | Sızma Testi, NGFW, SOC - Lider Network",
    description:
      "Lider Network ile 24/7 siber güvenlik hizmetleri: FortiGate NGFW, uç nokta güvenliği (EDR), sızma testleri, KVKK uyumluluk ve Zero-Trust ağ mimarisi. Ankara ve İstanbul'da uzman ekip.",
    keywords: [
      "siber güvenlik",
      "NGFW",
      "FortiGate",
      "sızma testi",
      "pentest",
      "EDR",
      "Zero Trust",
      "KVKK",
      "SOC",
      "güvenlik denetimi",
      "Türkiye siber güvenlik firması",
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/siber-guvenlik`,
      languages: {
        tr: `${baseUrl}/tr/siber-guvenlik`,
        en: `${baseUrl}/en/siber-guvenlik`,
      },
    },
    openGraph: {
      title: "Siber Güvenlik Çözümleri | Lider Network",
      description:
        "24/7 SOC, sızma testleri ve yapay zeka destekli tehdit analiziyle işletmenizi uçtan uca koruyoruz.",
      url: `${baseUrl}/${locale}/siber-guvenlik`,
    },
  };
}

export default async function SiberGuvenlikPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Siber Güvenlik Hizmetleri",
    provider: {
      "@type": "Organization",
      name: "Lider Network Teknoloji",
      url: baseUrl,
    },
    description:
      "Kurumsal düzeyde siber güvenlik: NGFW, EDR, sızma testleri, SOC izleme ve KVKK uyumluluk hizmetleri.",
    areaServed: "TR",
    serviceType: "Cybersecurity",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="pt-20">
        {/* Hero Section */}
        <section
          className="relative min-h-[85vh] flex items-center overflow-hidden"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1920&q=80"
              alt="Siber Güvenlik Altyapısı"
              className="w-full h-full object-cover opacity-40"
            />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to right, var(--color-background) 0%, rgba(16,20,21,0.8) 50%, transparent 100%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to top, var(--color-background) 0%, transparent 50%)",
              }}
            />
          </div>

          <div className="relative z-10 w-full px-5 lg:px-20 max-w-[1280px] mx-auto">
            <div className="max-w-3xl space-y-8">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border"
                style={{
                  backgroundColor: "rgba(183,196,255,0.1)",
                  borderColor: "rgba(183,196,255,0.2)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
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
                  Kurumsal Koruma Kalkanı
                </span>
              </div>

              <h1
                className="text-5xl lg:text-7xl font-bold leading-tight"
                style={{
                  fontFamily: "var(--font-family-headline)",
                  letterSpacing: "-0.02em",
                }}
              >
                Geleceğin Siber Tehditlerine{" "}
                <span style={{ color: "#0052ff" }}>Bugün Hazır Olun</span>
              </h1>

              <p
                className="text-lg max-w-2xl leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Lider Network, FortiGate ve Synology gibi dünya lideri
                altyapılarla verilerinizi, ağınızı ve itibarınızı 7/24
                kesintisiz koruma altına alır.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href={`/${locale}/iletisim`}
                  className="px-8 py-4 rounded font-bold uppercase tracking-widest transition-all"
                  style={{
                    backgroundColor: "#ff5e07",
                    color: "white",
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                    boxShadow: "0 0 20px rgba(255,94,7,0.3)",
                  }}
                >
                  ACİL GÜVENLİK DENETİMİ
                </Link>
                <Link
                  href={`/${locale}/hizmetler`}
                  className="px-8 py-4 rounded font-bold uppercase tracking-widest transition-all"
                  style={{
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "white",
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                  }}
                >
                  ÇÖZÜMLERİMİZİ İNCELEYİN
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Section */}
        <section className="py-16 px-5 lg:px-20 max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* 24/7 Monitoring - col-7 */}
            <div
              className="md:col-span-7 industrial-border p-8 rounded-xl relative overflow-hidden"
              style={{ backgroundColor: "#191c1e" }}
            >
              <div className="circuit-pattern absolute inset-0 opacity-5" />
              <div className="relative z-10">
                <Shield
                  className="w-10 h-10 mb-4"
                  style={{ color: "var(--color-primary)" }}
                />
                <h2
                  className="text-3xl font-semibold text-white mb-4"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  24/7 Aktif Tehdit İzleme
                </h2>
                <p
                  className="mb-6 leading-relaxed"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Global SOC merkezimiz üzerinden ağ trafiğinizi anlık olarak
                  analiz ediyor, henüz gerçekleşmeden potansiyel saldırıları
                  bertaraf ediyoruz.
                </p>
                <div className="space-y-3">
                  {[
                    "AI Tabanlı Anomali Tespiti",
                    "Otonom Müdahale Protokolleri",
                    "FortiGuard Threat Intelligence",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 p-3 rounded"
                      style={{
                        backgroundColor: "rgba(16,20,21,0.5)",
                        border: "1px solid rgba(141,144,162,0.2)",
                      }}
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      <span
                        style={{
                          fontFamily: "var(--font-family-label)",
                          fontSize: "12px",
                        }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* KVKK - col-5 */}
            <div
              className="md:col-span-5 industrial-border p-8 rounded-xl flex flex-col justify-between"
              style={{ backgroundColor: "#272a2c" }}
            >
              <div>
                <AlertTriangle
                  className="w-10 h-10 mb-4"
                  style={{ color: "var(--color-primary)" }}
                />
                <h2
                  className="text-3xl font-semibold text-white mb-4"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  KVKK Uyumluluk
                </h2>
                <p style={{ color: "var(--color-on-surface-variant)" }}>
                  Veri güvenliği sadece teknik değil, aynı zamanda hukuki bir
                  gerekliliktir. Kurumunuzu KVKK süreçlerine tam uyumlu hale
                  getiriyoruz.
                </p>
              </div>
              <div className="mt-8">
                <Link
                  href={`/${locale}/iletisim`}
                  className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest"
                  style={{ color: "var(--color-primary)" }}
                >
                  Detaylı Bilgi →
                </Link>
              </div>
            </div>

            {/* EDR Full Width */}
            <div className="md:col-span-12 relative h-[400px] rounded-xl overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1920&q=80"
                alt="Uç Nokta Güvenliği EDR"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(16,20,21,0.9) 0%, rgba(16,20,21,0.4) 50%, transparent 100%)",
                }}
              />
              <div className="absolute bottom-0 left-0 p-8 md:p-12">
                <div className="max-w-2xl">
                  <h3
                    className="text-3xl font-semibold text-white mb-2"
                    style={{ fontFamily: "var(--font-family-headline)" }}
                  >
                    Uç Nokta Güvenliği (EDR)
                  </h3>
                  <p
                    className="mb-6 leading-relaxed"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    Uzaktan çalışan personellerinizden sunucu parkurunuza kadar
                    her bağlantı noktasını yeni nesil EDR çözümleri ile
                    zırhlıyoruz.
                  </p>
                  <Link
                    href={`/${locale}/iletisim`}
                    className="px-6 py-3 rounded font-bold uppercase tracking-widest text-sm"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "#002682",
                      fontFamily: "var(--font-family-label)",
                    }}
                  >
                    ÇÖZÜM DETAYLARI
                  </Link>
                </div>
              </div>
            </div>

            {/* Sızma Testleri - col-6 */}
            <div
              className="md:col-span-6 industrial-border p-8 rounded-xl hover:border-primary/50 transition-all duration-300"
              style={{ backgroundColor: "#0b0f10" }}
            >
              <div className="flex items-start justify-between mb-6">
                <Shield
                  className="w-10 h-10"
                  style={{ color: "var(--color-primary)" }}
                />
                <span
                  className="px-3 py-1 rounded text-xs font-bold uppercase tracking-tighter"
                  style={{
                    backgroundColor: "#93000a",
                    color: "#ffdad6",
                  }}
                >
                  Kritik Servis
                </span>
              </div>
              <h3
                className="text-2xl font-semibold text-white mb-4"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Sızma Testleri (Pentest)
              </h3>
              <p style={{ color: "var(--color-on-surface-variant)" }}>
                Saldırganlar bulmadan önce biz buluyoruz. Beyaz şapkalı hacker
                ekibimizle sistemlerinizin zayıf halkalarını raporluyor ve
                kapatıyoruz.
              </p>
              <div className="mt-8">
                <div
                  className="h-1 w-full rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--color-surface-high)" }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: "85%",
                      backgroundColor: "var(--color-primary)",
                    }}
                  />
                </div>
                <div className="mt-2 text-right">
                  <span
                    style={{
                      fontFamily: "var(--font-family-label)",
                      fontSize: "12px",
                      color: "var(--color-primary)",
                    }}
                  >
                    85% Güvenlik Artışı
                  </span>
                </div>
              </div>
            </div>

            {/* Ağ Yönetimi - col-6 */}
            <div
              className="md:col-span-6 industrial-border p-8 rounded-xl hover:border-primary/50 transition-all duration-300"
              style={{ backgroundColor: "#0b0f10" }}
            >
              <Network
                className="w-10 h-10 mb-6"
                style={{ color: "var(--color-primary)" }}
              />
              <h3
                className="text-2xl font-semibold text-white mb-4"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Gelişmiş Ağ Yönetimi
              </h3>
              <p
                className="mb-6"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Zero-Trust (Sıfır Güven) mimarisi ile ağınızı bölümlendiriyor,
                yetkisiz erişimleri henüz ilk adımda engelliyoruz.
              </p>
              <ul className="space-y-2">
                {["Micro-Segmentation", "SD-WAN Deployment", "SASE Mimarisi"].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section
          className="py-16 border-y"
          style={{
            backgroundColor: "#0b0f10",
            borderColor: "rgba(141,144,162,0.2)",
          }}
        >
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "500+", label: "Aktif Proje" },
                { value: "99.9%", label: "Çalışma Süresi" },
                { value: "15dk", label: "Müdahale Süresi" },
                { value: "24/7", label: "SOC Desteği" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div
                    className="text-5xl font-bold mb-2"
                    style={{
                      fontFamily: "var(--font-family-headline)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {value}
                  </div>
                  <div
                    className="uppercase tracking-widest"
                    style={{
                      fontFamily: "var(--font-family-label)",
                      fontSize: "12px",
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

        {/* CTA Section */}
        <section className="py-24 px-5 lg:px-20 max-w-[1280px] mx-auto text-center relative overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              backgroundColor: "rgba(0,82,255,0.1)",
              filter: "blur(120px)",
            }}
          />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2
              className="text-4xl lg:text-5xl font-semibold text-white mb-6"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Dijital Varlıklarınızı Şansa Bırakmayın
            </h2>
            <p
              className="text-lg mb-10 leading-relaxed"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Ücretsiz güvenlik analizi ve altyapı danışmanlığı için uzman
              ekibimizle iletişime geçin.
            </p>
            <Link
              href={`/${locale}/iletisim`}
              className="btn-brand-blue inline-flex items-center gap-3 px-10 py-5 rounded-lg font-bold text-base"
            >
              ANALİZ BAŞLAT
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8 text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
              <span>veya doğrudan ulaşın:</span>
              <a href="mailto:satis@lidernetwork.com.tr" className="flex items-center gap-1.5 font-medium transition-colors hover:opacity-80" style={{ color: "var(--color-primary)" }}>
                <Mail className="w-4 h-4" />
                satis@lidernetwork.com.tr
              </a>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
              <a href="mailto:sales@lidernetwork.com.tr" className="flex items-center gap-1.5 font-medium transition-colors hover:opacity-80" style={{ color: "var(--color-primary)" }}>
                <Mail className="w-4 h-4" />
                sales@lidernetwork.com.tr
              </a>
            </div>
          </div>
        </section>

        <FaqSection items={siberGuvenlikFaqs} />
      </main>
    </>
  );
}
