import type { Metadata } from "next";
import Link from "next/link";
import { Database, ShieldCheck, Cloud, HardDrive, RefreshCw, BookOpen, Mail } from "lucide-react";
import FaqSection from "@/components/seo/FaqSection";
import RelatedArticles from "@/components/seo/RelatedArticles";
import { veriDepolamaFaqs } from "@/lib/service-faqs";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Veri Depolama ve Yedekleme Çözümleri | Synology, NVMe - Lider Network",
    description:
      "Lider Network kurumsal veri depolama: Synology NAS, NVMe All-Flash depolama, felaket kurtarma (DR), AES-256 şifreleme ve %99.99 uptime garantisi. KVKK uyumlu yedekleme çözümleri.",
    keywords: [
      "veri depolama",
      "Synology NAS",
      "NVMe depolama",
      "felaket kurtarma",
      "disaster recovery",
      "yedekleme sistemi",
      "veri yedekleme",
      "AES-256",
      "KVKK uyumluluk",
      "kurumsal depolama",
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/veri-depolama`,
      languages: {
        tr: `${baseUrl}/tr/veri-depolama`,
        en: `${baseUrl}/en/veri-depolama`,
      },
    },
    openGraph: {
      title: "Veri Depolama ve Yedekleme | Lider Network",
      description:
        "NVMe depolama, gerçek zamanlı yedekleme ve felaket kurtarma ile iş sürekliliğinizi güvence altına alın.",
      url: `${baseUrl}/${locale}/veri-depolama`,
    },
  };
}

export default async function VeriDepolamaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Veri Depolama ve Yedekleme Hizmetleri",
    provider: {
      "@type": "Organization",
      name: "Lider Network Teknoloji",
      url: baseUrl,
    },
    description:
      "Kurumsal düzeyde NVMe depolama, gerçek zamanlı yedekleme ve felaket kurtarma çözümleri.",
    areaServed: "TR",
    serviceType: "Data Storage & Backup",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main>
        {/* Hero Section */}
        <header
          className="relative min-h-[90vh] flex items-center pt-24 overflow-hidden"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=80"
              alt="Veri Merkezi Altyapısı"
              className="w-full h-full object-cover grayscale opacity-40"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(5,5,5,0.4), rgba(16,20,21,1))",
              }}
            />
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(#8d90a2 0.5px, transparent 0.5px)",
                backgroundSize: "24px 24px",
              }}
            />
          </div>

          <div className="relative z-10 px-5 lg:px-20 max-w-[1280px] mx-auto w-full">
            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: "#10b981" }}
                />
                <span
                  className="uppercase tracking-widest"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                    color: "var(--color-primary)",
                  }}
                >
                  Global Veri Koruma Standartları
                </span>
              </div>

              <h1
                className="text-5xl lg:text-7xl font-bold mb-8 leading-tight"
                style={{
                  fontFamily: "var(--font-family-headline)",
                  letterSpacing: "-0.02em",
                }}
              >
                Verileriniz En Değerli Hazineniz,{" "}
                <span style={{ color: "var(--color-primary)" }}>
                  Onları Bizimle Güvenceye Alın
                </span>
              </h1>

              <p
                className="text-lg mb-10 max-w-2xl leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Kurumsal düzeyde NVMe depolama, gerçek zamanlı yedekleme ve
                felaket kurtarma senaryolarıyla iş sürekliliğinizi %99.999
                oranında garanti altına alıyoruz.
              </p>

              <div className="flex flex-col sm:flex-row gap-6">
                <Link
                  href={`/${locale}/iletisim`}
                  className="btn-brand-blue px-10 py-4 rounded-lg font-bold text-base"
                >
                  Hemen Danışın
                </Link>
                <Link
                  href={`/${locale}/synology`}
                  className="px-10 py-4 rounded-lg font-bold text-base transition-all"
                  style={{
                    border: "1px solid rgba(141,144,162,0.4)",
                    backgroundColor: "rgba(16,20,21,0.4)",
                    color: "var(--color-on-surface)",
                  }}
                >
                  Synology Çözümleri
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Status Bar */}
        <div
          className="py-6 border-y"
          style={{
            backgroundColor: "#191c1e",
            borderColor: "rgba(141,144,162,0.1)",
          }}
        >
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            {[
              { label: "Çalışma Süresi", value: "99.99%" },
              { label: "Yedekleme Sıklığı", value: "15 Dakika" },
              { label: "Toplam Depolama", value: "25 PB+" },
              { label: "Güvenlik Protokolü", value: "AES-256" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p
                  className="uppercase tracking-widest mb-1"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontSize: "11px",
                    color: "var(--color-on-surface-variant)",
                  }}
                >
                  {label}
                </p>
                <p
                  className="text-3xl font-semibold"
                  style={{
                    fontFamily: "var(--font-family-headline)",
                    color: "var(--color-primary)",
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Core Services Bento Grid */}
        <section className="py-24 px-5 lg:px-20 max-w-[1280px] mx-auto">
          <div className="mb-20 text-center">
            <h2
              className="text-4xl lg:text-5xl font-semibold mb-4"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Uçtan Uca Veri Mimari Çözümleri
            </h2>
            <div
              className="w-24 h-1 mx-auto"
              style={{ backgroundColor: "var(--color-primary)" }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* High Performance Storage - col-8 */}
            <div
              className="md:col-span-8 industrial-border p-8 rounded-xl relative overflow-hidden group"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <div className="relative z-10">
                <HardDrive
                  className="w-12 h-12 mb-6"
                  style={{ color: "var(--color-primary)" }}
                />
                <h3
                  className="text-3xl font-semibold mb-4"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  Yüksek Performanslı Depolama
                </h3>
                <p
                  className="max-w-lg mb-8 leading-relaxed"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Düşük gecikme süreli NVMe ve All-Flash dizileri ile kritik iş
                  yüklerinizi hızlandırın. Synology ve Forti-Storage
                  mimarileriyle hibrit bulut entegrasyonu.
                </p>
                <div className="flex gap-4">
                  {["NVMe Gen5", "Multi-Tiering", "10GbE"].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded text-xs font-bold uppercase tracking-widest"
                      style={{
                        backgroundColor: "rgba(183,196,255,0.1)",
                        color: "var(--color-primary)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div
                className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                aria-hidden="true"
              >
                <Database
                  style={{ width: "200px", height: "200px" }}
                />
              </div>
            </div>

            {/* Data Integrity - col-4 */}
            <div
              className="md:col-span-4 industrial-border p-8 rounded-xl flex flex-col justify-between"
              style={{ backgroundColor: "#191c1e" }}
            >
              <div>
                <ShieldCheck
                  className="w-12 h-12 mb-6"
                  style={{ color: "var(--color-primary)" }}
                />
                <h3
                  className="text-2xl font-semibold mb-4"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  Veri Bütünlüğü
                </h3>
                <p style={{ color: "var(--color-on-surface-variant)" }}>
                  Otomatik veri onarımı (Self-healing) ve Bit rot korumasıyla
                  verilerinizin her bitini koruyoruz.
                </p>
              </div>
              <div
                className="mt-8 pt-8"
                style={{ borderTop: "1px solid rgba(141,144,162,0.2)" }}
              >
                <ul className="space-y-3">
                  {["CRC Kontrolü", "Anlık Görüntüleme (Snapshot)", "WORM Depolama"].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2"
                      style={{
                        fontFamily: "var(--font-family-label)",
                        fontSize: "12px",
                      }}
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
            </div>

            {/* Disaster Recovery - col-5 */}
            <div
              className="md:col-span-5 industrial-border p-8 rounded-xl"
              style={{ backgroundColor: "#191c1e" }}
            >
              <RefreshCw
                className="w-12 h-12 mb-6"
                style={{ color: "var(--color-secondary)" }}
              />
              <h3
                className="text-2xl font-semibold mb-4"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Felaket Kurtarma (DR)
              </h3>
              <p
                className="mb-6 leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Olası bir sistem arızasında veya saldırıda dakikalar içinde
                işinize geri dönün. Coğrafi yedeklilik ve siber-dayanıklılık.
              </p>
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: "rgba(147,0,10,0.1)",
                  border: "1px solid rgba(255,180,171,0.2)",
                }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-tighter mb-1"
                  style={{ color: "#ffb4ab" }}
                >
                  7/24 Aktif SOC Merkezi Desteği
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Kriz anında anında müdahale ekibimiz devreye girer
                </p>
              </div>
            </div>

            {/* Smart Archiving - col-7 */}
            <div
              className="md:col-span-7 industrial-border p-8 rounded-xl overflow-hidden group"
              style={{ backgroundColor: "#272a2c" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <BookOpen
                    className="w-12 h-12 mb-6"
                    style={{ color: "var(--color-primary)" }}
                  />
                  <h3
                    className="text-2xl font-semibold mb-4"
                    style={{ fontFamily: "var(--font-family-headline)" }}
                  >
                    Akıllı Arşivleme
                  </h3>
                  <p
                    className="mb-4 leading-relaxed"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    Regülasyonlara uygun (KVKK/GDPR), uzun vadeli ve düşük
                    maliyetli veri saklama çözümleri.
                  </p>
                </div>
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80"
                    alt="Profesyonel Sunucu Rafları"
                    className="rounded-lg shadow-2xl grayscale brightness-75 group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Integration Section */}
        <section
          className="py-24 border-y"
          style={{
            backgroundColor: "#0b0f10",
            borderColor: "rgba(141,144,162,0.1)",
          }}
        >
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2
                className="text-4xl font-semibold mb-8 leading-tight"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Fiziksel Güvenlik ve{" "}
                <br />
                <span style={{ color: "var(--color-secondary)" }}>
                  Siber Kalkan Entegrasyonu
                </span>
              </h2>
              <div className="space-y-8">
                {[
                  {
                    title: "End-to-End Şifreleme",
                    desc: "Verileriniz hem transfer edilirken hem de diskte saklanırken en üst düzey AES-256 şifreleme ile korunur.",
                  },
                  {
                    title: "Yedekli Ağ Yapısı",
                    desc: "LACP ve 40GbE portları ile kesintisiz veri trafiği ve otomatik failover mekanizmaları.",
                  },
                  {
                    title: "Immutable Yedekleme",
                    desc: "Ransomware saldırılarına karşı değiştirilemez yedekleme mimarisi ile tam koruma garantisi.",
                  },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-6">
                    <div
                      className="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#0052ff" }}
                    >
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-2">{title}</h4>
                      <p style={{ color: "var(--color-on-surface-variant)" }}>
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div
                className="p-1 rounded-2xl border shadow-2xl"
                style={{ borderColor: "rgba(141,144,162,0.2)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80"
                  alt="Ağ Altyapısı Detayları"
                  className="rounded-xl w-full"
                />
              </div>
              <div
                className="absolute -top-4 -right-4 p-4 rounded-xl border flex items-center gap-3"
                style={{
                  backgroundColor: "rgba(29,32,34,0.8)",
                  backdropFilter: "blur(12px)",
                  borderColor: "rgba(0,82,255,0.3)",
                }}
              >
                <span
                  className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"
                />
                <span
                  className="text-xs uppercase font-bold text-white"
                  style={{ fontFamily: "var(--font-family-label)" }}
                >
                  Live Monitoring: Active
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-5">
          <div className="max-w-3xl mx-auto px-10 py-20 rounded-3xl relative overflow-hidden text-center"
            style={{ backgroundColor: "#0052ff" }}
          >
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative z-10">
              <h2
                className="text-4xl font-semibold text-white mb-6"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Geleceğinizi Riske Atmayın
              </h2>
              <p className="text-lg mb-10" style={{ color: "rgba(255,255,255,0.8)" }}>
                Ücretsiz bir altyapı denetimi için hemen bugün uzmanlarımızla
                iletişime geçin.
              </p>
              <Link
                href={`/${locale}/iletisim`}
                className="inline-block bg-white font-bold text-lg px-12 py-5 rounded-lg transition-all hover:-translate-y-1"
                style={{ color: "#0052ff" }}
              >
                ÜCRETSİZ AUDİT AL
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-8 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                <span>veya doğrudan ulaşın:</span>
                <a href="mailto:satis@lidernetwork.com.tr" className="flex items-center gap-1.5 font-medium transition-opacity hover:opacity-80 text-white">
                  <Mail className="w-4 h-4" />
                  satis@lidernetwork.com.tr
                </a>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
                <a href="mailto:sales@lidernetwork.com.tr" className="flex items-center gap-1.5 font-medium transition-opacity hover:opacity-80 text-white">
                  <Mail className="w-4 h-4" />
                  sales@lidernetwork.com.tr
                </a>
              </div>
            </div>
          </div>
        </section>

        <FaqSection items={veriDepolamaFaqs} />
        <RelatedArticles serviceSlug="veri-depolama" locale={locale} />
      </main>
    </>
  );
}
