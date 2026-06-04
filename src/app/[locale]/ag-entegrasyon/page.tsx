import type { Metadata } from "next";
import Link from "next/link";
import { Network, Wifi, Settings, Server, Mail } from "lucide-react";
import FaqSection from "@/components/seo/FaqSection";
import RelatedArticles from "@/components/seo/RelatedArticles";
import { agEntegrasyonFaqs } from "@/lib/service-faqs";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Ağ Altyapısı ve Sistem Entegrasyonu | SD-WAN, WiFi 6 - Lider Network",
    description:
      "Lider Network ağ çözümleri: SD-WAN, kurumsal WiFi 6/6E, yönetilen ağ hizmetleri (NOC), switching ve routing. Kablolu/kablosuz enterprise ağ altyapısı ve 7/24 izleme.",
    keywords: [
      "ağ altyapısı",
      "SD-WAN",
      "WiFi 6",
      "NOC yönetimi",
      "kurumsal WiFi",
      "ağ entegrasyonu",
      "switching routing",
      "network yönetimi",
      "SASE",
      "ağ güvenliği",
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/ag-entegrasyon`,
      languages: {
        tr: `${baseUrl}/tr/ag-entegrasyon`,
        en: `${baseUrl}/en/ag-entegrasyon`,
      },
    },
    openGraph: {
      title: "Ağ Altyapısı Çözümleri | SD-WAN & WiFi 6 - Lider Network",
      description:
        "Yüksek performanslı network altyapıları ve uçtan uca sistem entegrasyonu ile dijital dönüşümünüzü güvenle tamamlayın.",
      url: `${baseUrl}/${locale}/ag-entegrasyon`,
    },
  };
}

export default async function AgEntegrasyonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Ağ Altyapısı ve Sistem Entegrasyonu",
    provider: {
      "@type": "Organization",
      name: "Lider Network Teknoloji",
      url: baseUrl,
    },
    description:
      "Kablolu/kablosuz enterprise ağlar, SD-WAN, switching ve routing sistemleri ile 7/24 ağ yönetimi.",
    areaServed: "TR",
    serviceType: "Network Infrastructure",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main
        className="circuit-bg"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-24 overflow-hidden">
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1920&q=80"
              alt="Ağ Altyapısı"
              className="w-full h-full object-cover opacity-40 scale-105"
            />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(180deg, rgba(5,5,5,0) 0%, rgba(5,5,5,1) 100%)",
              }}
            />
          </div>

          <div className="relative z-10 w-full px-5 lg:px-20 max-w-[1280px] mx-auto">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
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
                  Global Ağ Entegrasyon Lideri
                </span>
              </div>

              <h1
                className="text-5xl lg:text-7xl font-bold mb-8 leading-tight text-white"
                style={{
                  fontFamily: "var(--font-family-headline)",
                  letterSpacing: "-0.02em",
                }}
              >
                Kusursuz Bağlantı,
                <br />
                <span style={{ color: "#0052ff" }}>
                  Kesintisiz İş Sürekliliği
                </span>
              </h1>

              <p
                className="text-lg mb-10 max-w-xl leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Yüksek performanslı network altyapıları ve uçtan uca sistem
                entegrasyonu ile dijital dönüşümünüzü güvenle tamamlayın.
              </p>

              <div className="flex flex-wrap gap-6">
                <Link
                  href={`/${locale}/iletisim`}
                  className="btn-brand-blue px-8 py-4 rounded-lg font-bold"
                >
                  Hemen Başlayın
                </Link>
                <Link
                  href={`/${locale}/hizmetler`}
                  className="px-8 py-4 rounded-lg font-bold transition-all"
                  style={{
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "white",
                  }}
                >
                  Vaka Çalışmaları
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Solutions Bento Grid */}
        <section className="py-24 px-5 lg:px-20 max-w-[1280px] mx-auto">
          <div className="text-center mb-24">
            <h2
              className="text-4xl lg:text-5xl font-semibold mb-4"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Ağ ve Sistem Çözümlerimiz
            </h2>
            <div
              className="h-1 w-24 mx-auto"
              style={{ backgroundColor: "var(--color-primary)" }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* SD-WAN - col-8 */}
            <div
              className="md:col-span-8 group relative overflow-hidden industrial-border p-10 rounded-xl transition-all duration-500 hover:border-primary/50"
              style={{ backgroundColor: "rgba(18,18,20,0.8)", backdropFilter: "blur(12px)" }}
            >
              <div className="flex flex-col md:flex-row gap-10 items-center">
                <div className="flex-1">
                  <div
                    className="flex items-center gap-2 mb-4"
                    style={{ color: "var(--color-primary)" }}
                  >
                    <Network className="w-5 h-5" />
                    <span
                      className="uppercase tracking-widest"
                      style={{
                        fontFamily: "var(--font-family-label)",
                        fontSize: "12px",
                      }}
                    >
                      Yeni Nesil Bağlantı
                    </span>
                  </div>
                  <h3
                    className="text-3xl font-semibold mb-4 text-white"
                    style={{ fontFamily: "var(--font-family-headline)" }}
                  >
                    SD-WAN Çözümleri
                  </h3>
                  <p
                    className="mb-6 leading-relaxed"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    Karmaşık ağ yapılarını basitleştiren, uygulama performansını
                    optimize eden ve operasyonel maliyetleri düşüren akıllı
                    SD-WAN mimarileri tasarlıyoruz. Şubeler arası güvenli ve
                    hızlı veri transferi için modern standartları belirliyoruz.
                  </p>
                  <ul className="space-y-3">
                    {["Dinamik Trafik Yönetimi", "Entegre SASE Güvenliği", "Otomatik Failover"].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2"
                        style={{ color: "var(--color-on-surface)" }}
                      >
                        <span
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: "rgba(0,82,255,0.3)", border: "1px solid #0052ff" }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 w-full h-64 relative rounded-lg overflow-hidden industrial-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d8?auto=format&fit=crop&w=800&q=80"
                    alt="SD-WAN Ağ Altyapısı"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
              </div>
            </div>

            {/* Wireless - col-4 */}
            <div
              className="md:col-span-4 industrial-border p-10 rounded-xl hover:border-primary/50 transition-all duration-500 group"
              style={{ backgroundColor: "rgba(18,18,20,0.8)", backdropFilter: "blur(12px)" }}
            >
              <div
                className="h-16 w-16 rounded-lg flex items-center justify-center mb-8 transition-colors duration-300"
                style={{
                  backgroundColor: "rgba(183,196,255,0.1)",
                  color: "var(--color-primary)",
                }}
              >
                <Wifi className="w-8 h-8" />
              </div>
              <h3
                className="text-2xl font-semibold mb-4 text-white"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Kurumsal WiFi
              </h3>
              <p
                className="mb-6 leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Yüksek yoğunluklu alanlar için Wi-Fi 6 ve 6E standartlarında
                kesintisiz ve güvenli kablosuz ağ projeleri.
              </p>
              <Link
                href={`/${locale}/iletisim`}
                className="flex items-center gap-2 font-bold"
                style={{ color: "var(--color-primary)" }}
              >
                Detaylı İncele →
              </Link>
            </div>

            {/* System Integration - col-4 */}
            <div
              className="md:col-span-4 industrial-border p-10 rounded-xl hover:border-primary/50 transition-all duration-500 group"
              style={{ backgroundColor: "rgba(18,18,20,0.8)", backdropFilter: "blur(12px)" }}
            >
              <div
                className="h-16 w-16 rounded-lg flex items-center justify-center mb-8 transition-colors duration-300"
                style={{
                  backgroundColor: "rgba(183,196,255,0.1)",
                  color: "var(--color-primary)",
                }}
              >
                <Settings className="w-8 h-8" />
              </div>
              <h3
                className="text-2xl font-semibold mb-4 text-white"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Sistem Entegrasyonu
              </h3>
              <p
                className="mb-6 leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Donanım ve yazılım bileşenlerinin tek bir uyumlu ekosistem
                olarak çalışmasını sağlayan stratejik entegrasyonlar.
              </p>
              <Link
                href={`/${locale}/sistem-entegrasyonu`}
                className="flex items-center gap-2 font-bold"
                style={{ color: "var(--color-primary)" }}
              >
                Stratejileri Gör →
              </Link>
            </div>

            {/* NOC - col-8 */}
            <div
              className="md:col-span-8 industrial-border p-10 rounded-xl hover:border-primary/50 transition-all duration-500 relative overflow-hidden"
              style={{ backgroundColor: "rgba(18,18,20,0.8)", backdropFilter: "blur(12px)" }}
            >
              <div
                className="absolute right-0 top-0 opacity-10 -mr-16 -mt-16 pointer-events-none"
                aria-hidden="true"
              >
                <Server style={{ width: "200px", height: "200px" }} />
              </div>
              <div className="relative z-10">
                <h3
                  className="text-2xl font-semibold mb-4 text-white"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  Yönetilen Ağ Hizmetleri (NOC)
                </h3>
                <p
                  className="max-w-2xl mb-8 leading-relaxed"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Ağ altyapınızı 7/24 izliyor, olası kesintileri henüz
                  oluşmadan tespit ediyoruz. Proaktif bakım ve hızlı müdahale
                  ekibimizle operasyonlarınız hiçbir zaman durmaz.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { value: "99.9%", label: "Uptime Garantisi" },
                    { value: "15 Dak.", label: "Müdahale Süresi" },
                    { value: "End-to-End", label: "Şifreleme" },
                    { value: "Scalable", label: "Ölçeklenebilir" },
                  ].map(({ value, label }) => (
                    <div
                      key={label}
                      className="p-4 rounded-lg industrial-border"
                      style={{ backgroundColor: "var(--color-surface)" }}
                    >
                      <div
                        className="font-bold text-xl mb-1"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {value}
                      </div>
                      <div
                        className="text-xs uppercase tracking-widest opacity-60"
                        style={{ fontFamily: "var(--font-family-label)" }}
                      >
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,82,255,0.1)" }}
          />
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto relative z-10">
            <div
              className="industrial-border p-12 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-10"
              style={{
                backgroundColor: "rgba(18,18,20,0.8)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="text-center md:text-left">
                <h2
                  className="text-4xl font-semibold mb-4"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  Ağ Altyapınız Geleceğe Hazır mı?
                </h2>
                <p
                  className="text-lg"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Uzmanlarımızdan ücretsiz ağ denetimi ve verimlilik raporu
                  talep edin.
                </p>
              </div>
              <Link
                href={`/${locale}/iletisim`}
                className="px-10 py-5 rounded-lg font-bold text-lg transition-all shrink-0 text-white"
                style={{
                  backgroundColor: "#ff5e07",
                  boxShadow: "0 0 30px rgba(255,92,0,0.3)",
                }}
              >
                Ücretsiz Analiz Al
              </Link>
            </div>
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
        </section>

        <FaqSection items={agEntegrasyonFaqs} />
        <RelatedArticles serviceSlug="ag-entegrasyon" locale={locale} />
      </main>
    </>
  );
}
