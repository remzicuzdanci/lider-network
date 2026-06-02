import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Timer, Lock, BarChart3, Cloud, RefreshCw, Mail } from "lucide-react";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "İş Sürekliliği ve Felaket Kurtarma | DR Planlaması - Lider Network",
    description:
      "Lider Network iş sürekliliği çözümleri: %99.9 uptime garantisi, 15 dakika RPO, immutable yedekleme, felaket kurtarma (DR) planlaması ve otomatik failover sistemleri.",
    keywords: [
      "iş sürekliliği",
      "felaket kurtarma",
      "disaster recovery",
      "DR planı",
      "uptime garantisi",
      "yedekleme sistemi",
      "immutable backup",
      "otomatik failover",
      "RPO RTO",
      "kesintisiz operasyon",
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/is-surekliligi`,
      languages: {
        tr: `${baseUrl}/tr/is-surekliligi`,
        en: `${baseUrl}/en/is-surekliligi`,
      },
    },
    openGraph: {
      title: "İş Sürekliliği ve Felaket Kurtarma | Lider Network",
      description:
        "%99.9 uptime garantisi ve saniyeler içinde devreye giren felaket kurtarma sistemleriyle operasyonlarınızı koruma altına alın.",
      url: `${baseUrl}/${locale}/is-surekliligi`,
    },
  };
}

export default async function IsSurekliligíPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "İş Sürekliliği ve Felaket Kurtarma",
    provider: {
      "@type": "Organization",
      name: "Lider Network Teknoloji",
      url: baseUrl,
    },
    description:
      "Kritik süreçler için yedekleme, kurtarma mekanizmaları ve kesintisiz operasyon garantisi.",
    areaServed: "TR",
    serviceType: "Business Continuity & Disaster Recovery",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main style={{ backgroundColor: "var(--color-background)" }}>
        {/* Hero Section */}
        <header
          className="relative pt-32 pb-24 md:pt-48 md:pb-40 overflow-hidden circuit-bg"
        >
          <div className="absolute inset-0 z-0 opacity-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=80"
              alt="Sunucu Odası"
              className="w-full h-full object-cover"
            />
          </div>
          <div
            className="absolute inset-0 z-10"
            style={{
              background:
                "linear-gradient(to top, var(--color-background), rgba(16,20,21,0.8), transparent)",
            }}
          />

          <div className="relative z-20 px-5 lg:px-20 max-w-[1280px] mx-auto">
            <div className="flex flex-col items-start gap-6 max-w-3xl">
              <div
                className="flex items-center gap-3 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: "rgba(183,196,255,0.1)",
                  border: "1px solid rgba(183,196,255,0.2)",
                }}
              >
                <span className="flex h-2 w-2 relative">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ backgroundColor: "#10b981" }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ backgroundColor: "#10b981" }}
                  />
                </span>
                <span
                  className="uppercase tracking-widest"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                    color: "var(--color-primary)",
                  }}
                >
                  Sistem Durumu: Aktif & Güvenli
                </span>
              </div>

              <h1
                className="text-5xl lg:text-7xl font-bold text-white leading-tight"
                style={{
                  fontFamily: "var(--font-family-headline)",
                  letterSpacing: "-0.02em",
                }}
              >
                Kesintisiz Operasyon,
                <br />
                <span style={{ color: "var(--color-primary)" }}>
                  Sıfır Veri Kaybı.
                </span>
              </h1>

              <p
                className="text-lg mt-4 leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                İşletmenizin geleceğini tesadüfe bırakmayın. Lider Network ile
                %99.9 uptime garantisi ve saniyeler içinde devreye giren
                felaket kurtarma sistemleriyle operasyonlarınızı koruma altına
                alın.
              </p>

              <div className="flex flex-wrap gap-4 mt-4">
                <Link
                  href={`/${locale}/iletisim`}
                  className="btn-brand-blue px-8 py-4 rounded-lg font-bold"
                >
                  Risk Analizi Başlat
                </Link>
                <Link
                  href={`/${locale}/hizmetler`}
                  className="px-8 py-4 rounded-lg font-bold transition-all"
                  style={{
                    border: "1px solid rgba(141,144,162,0.3)",
                    color: "white",
                  }}
                >
                  DR Planlarımızı İnceleyin
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Uptime Stats Bento Grid */}
        <section className="py-16 px-5 lg:px-20 max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* %99.9 Uptime - col-2 */}
            <div
              className="md:col-span-2 industrial-border p-8 rounded-xl flex flex-col justify-between hover:border-primary/50 transition-colors group"
              style={{ backgroundColor: "#191c1e" }}
            >
              <div>
                <BarChart3
                  className="w-10 h-10 mb-4"
                  style={{ color: "var(--color-primary)" }}
                />
                <h3
                  className="text-2xl font-semibold text-white mb-2"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  %99.9 Uptime
                </h3>
                <p style={{ color: "var(--color-on-surface-variant)" }}>
                  Kritik iş süreçleriniz için endüstri lideri erişilebilirlik
                  standartları sunuyoruz. Kesinti maliyetlerinizi minimize edin.
                </p>
              </div>
              <div
                className="mt-8 pt-4 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(141,144,162,0.2)" }}
              >
                <span
                  className="uppercase tracking-widest"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                    color: "var(--color-primary)",
                  }}
                >
                  SLA Garantisi
                </span>
                <span style={{ color: "var(--color-on-surface-variant)" }}>→</span>
              </div>
            </div>

            {/* 15dk RPO */}
            <div
              className="industrial-border p-8 rounded-xl hover:border-primary/50 transition-colors"
              style={{ backgroundColor: "#191c1e" }}
            >
              <Timer
                className="w-10 h-10 mb-4"
                style={{ color: "var(--color-secondary)" }}
              />
              <h3
                className="text-2xl font-semibold text-white mb-2"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                15dk RPO
              </h3>
              <p style={{ color: "var(--color-on-surface-variant)" }}>
                Veri kaybını geçmişte bırakın. Kritik verileriniz her 15
                dakikada bir senkronize edilir.
              </p>
            </div>

            {/* Immutable */}
            <div
              className="industrial-border p-8 rounded-xl hover:border-primary/50 transition-colors"
              style={{ backgroundColor: "#191c1e" }}
            >
              <Lock
                className="w-10 h-10 mb-4"
                style={{ color: "var(--color-primary)" }}
              />
              <h3
                className="text-2xl font-semibold text-white mb-2"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Immutable
              </h3>
              <p style={{ color: "var(--color-on-surface-variant)" }}>
                Ransomware saldırılarına karşı değiştirilemez yedekleme
                mimarisi ile tam koruma.
              </p>
            </div>
          </div>
        </section>

        {/* DR Strategies Section */}
        <section
          className="py-24 relative overflow-hidden"
          style={{ backgroundColor: "#0b0f10" }}
        >
          <div
            className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none"
            style={{
              background: "linear-gradient(to left, rgba(0,82,255,0.4) 0%, transparent 100%)",
              backgroundImage: "radial-gradient(rgba(0,82,255,0.5) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <span
                    className="uppercase tracking-widest"
                    style={{
                      fontFamily: "var(--font-family-label)",
                      fontSize: "12px",
                      color: "var(--color-primary)",
                    }}
                  >
                    Stratejik Planlama
                  </span>
                  <h2
                    className="text-4xl font-semibold text-white"
                    style={{ fontFamily: "var(--font-family-headline)" }}
                  >
                    İş Sürekliliği Stratejileri
                  </h2>
                  <p
                    className="text-lg leading-relaxed"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    Sadece yedekleme değil, bütünsel bir süreklilik ekosistemi
                    inşa ediyoruz. Riskleri önceden belirliyor ve kriz anında
                    otomatik devreye giren protokoller oluşturuyoruz.
                  </p>
                </div>

                <div className="space-y-6">
                  {[
                    {
                      icon: BarChart3,
                      title: "Risk Analizi",
                      desc: "Altyapınızdaki tüm zayıf noktaları tespit ederek olası felaket senaryolarını haritalandırıyoruz.",
                    },
                    {
                      icon: Cloud,
                      title: "Hibrit Bulut Replikasyonu",
                      desc: "Verilerinizi hem yerel hem de coğrafi olarak yedekli bulut lokasyonlarında eş zamanlı tutuyoruz.",
                    },
                    {
                      icon: RefreshCw,
                      title: "Otomatik Failover",
                      desc: "Birincil sistemlerde arıza oluştuğu anda ikincil sistemler insan müdahalesi olmadan saniyeler içinde devreye girer.",
                    },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div
                      key={title}
                      className="flex gap-4 p-4 rounded-lg transition-colors"
                      style={{
                        backgroundColor: "transparent",
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "rgba(183,196,255,0.2)" }}
                      >
                        <Icon
                          className="w-6 h-6"
                          style={{ color: "var(--color-primary)" }}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-1">{title}</h4>
                        <p
                          className="text-sm"
                          style={{ color: "var(--color-on-surface-variant)" }}
                        >
                          {desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div
                  className="absolute -inset-4 rounded-full pointer-events-none"
                  style={{
                    backgroundColor: "rgba(183,196,255,0.2)",
                    filter: "blur(48px)",
                  }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80"
                  alt="IT Uzmanı Kontrol Merkezi"
                  className="rounded-2xl industrial-border shadow-2xl relative z-10 w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* DR Planning Steps */}
        <section className="py-24 px-5 lg:px-20 max-w-[1280px] mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2
              className="text-4xl font-semibold text-white mb-4"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Disaster Recovery (DR) Planlama
            </h2>
            <p
              className="text-lg leading-relaxed"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Felaket anında ne yapacağınızı bilmek, paniği engeller ve zaman
              kazandırır. Profesyonel DR kılavuzlarımızla her duruma
              hazırlıklıyız.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Tespit ve İhbar",
                desc: "Anormallik tespit edildiği an 7/24 NOC ekibimiz ve sistem yöneticileriniz anında bilgilendirilir.",
                items: ["Gerçek Zamanlı İzleme", "AI Tabanlı Tehdit Analizi"],
              },
              {
                step: "02",
                title: "İzolasyon ve Aktivasyon",
                desc: "Etkilenen bölge izole edilir ve yedekli lokasyonlardaki DR operasyonu anında başlatılır.",
                items: ["Mikro-Segmentasyon", "DR Site Aktivasyonu"],
              },
              {
                step: "03",
                title: "Kurtarma ve Dönüş",
                desc: "Sistem tamamen kurtarılır, tüm hizmetler test edilir ve birincil sisteme kontrollü geri dönüş yapılır.",
                items: ["Veri Doğrulama", "Kademeli Geri Dönüş"],
              },
            ].map(({ step, title, desc, items }) => (
              <div
                key={step}
                className="p-8 rounded-xl transition-all hover:shadow-[0_0_30px_rgba(0,82,255,0.1)]"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid rgba(141,144,162,0.2)",
                }}
              >
                <div
                  className="text-6xl font-bold mb-4"
                  style={{
                    fontFamily: "var(--font-family-headline)",
                    color: "var(--color-primary)",
                  }}
                >
                  {step}
                </div>
                <h4
                  className="text-2xl font-semibold text-white mb-4"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  {title}
                </h4>
                <p
                  className="mb-6 pl-4 leading-relaxed"
                  style={{
                    color: "var(--color-on-surface-variant)",
                    borderLeft: "2px solid var(--color-primary)",
                  }}
                >
                  {desc}
                </p>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: "rgba(0,82,255,0.3)", border: "1px solid #0052ff" }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-5 lg:px-20 max-w-[1280px] mx-auto">
          <div
            className="industrial-border p-16 rounded-2xl text-center relative overflow-hidden"
            style={{ backgroundColor: "#191c1e" }}
          >
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
              style={{
                backgroundColor: "rgba(0,82,255,0.1)",
                filter: "blur(80px)",
              }}
            />
            <div className="relative z-10">
              <h2
                className="text-4xl font-semibold text-white mb-6"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                İşletmenizi Koruma Altına Alın
              </h2>
              <p
                className="text-lg mb-10 max-w-2xl mx-auto leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Ücretsiz iş sürekliliği analizi ve DR planlaması için
                uzmanlarımızla iletişime geçin.
              </p>
              <Link
                href={`/${locale}/iletisim`}
                className="inline-block btn-brand-blue px-10 py-5 rounded-lg font-bold text-lg"
              >
                Ücretsiz Analiz Al
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6 text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                <span>veya doğrudan ulaşın:</span>
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
          </div>
        </section>
      </main>
    </>
  );
}
