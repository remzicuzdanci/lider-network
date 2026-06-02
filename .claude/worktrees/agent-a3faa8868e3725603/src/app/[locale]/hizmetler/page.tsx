import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Shield,
  Database,
  Cloud,
  Network,
  Settings,
  BarChart3,
  RefreshCw,
  Server,
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  return {
    title: isTr
      ? "Hizmetler - Siber Güvenlik, Ağ ve Veri Depolama Çözümleri"
      : "Services - Cybersecurity, Network & Data Storage Solutions",
    description: isTr
      ? "Lider Network hizmetleri: NGFW, SD-WAN, NAS, penetrasyon testi, bulut, sanallaştırma, iş sürekliliği ve BT danışmanlığı. Fortinet ve Synology çözümleri."
      : "Lider Network services: NGFW, SD-WAN, NAS, penetration testing, cloud, virtualization, business continuity and IT consulting. Fortinet and Synology solutions.",
    alternates: {
      canonical: `${baseUrl}/${locale}/hizmetler`,
      languages: {
        tr: `${baseUrl}/tr/hizmetler`,
        en: `${baseUrl}/en/services`,
      },
    },
    openGraph: {
      title: isTr
        ? "Hizmetler | Lider Network"
        : "Services | Lider Network",
      description: isTr
        ? "Enterprise BT altyapı hizmetleri. Siber güvenlik, ağ, depolama ve bulut çözümleri."
        : "Enterprise IT infrastructure services. Cybersecurity, network, storage and cloud solutions.",
      url: `${baseUrl}/${locale}/hizmetler`,
    },
  };
}

const serviceKeys = [
  "security",
  "storage",
  "cloud",
  "network",
  "integration",
  "consulting",
  "continuity",
  "virtualization",
  "lowVoltage",
] as const;

const serviceRoutes: Record<string, string> = {
  security: "siber-guvenlik",
  storage: "veri-depolama",
  cloud: "bulut-cozumleri",
  network: "ag-entegrasyon",
  integration: "sistem-entegrasyonu",
  consulting: "bt-danismanligi",
  continuity: "is-surekliligi",
  virtualization: "sanallastirma",
  lowVoltage: "zayif-akim",
};

const serviceIcons = [
  Shield,
  Database,
  Cloud,
  Network,
  Settings,
  BarChart3,
  RefreshCw,
  Server,
  Zap,
];

const serviceFeatures: Record<string, string[]> = {
  security: [
    "Next-Generation Firewall (NGFW)",
    "Penetrasyon Testi ve Güvenlik Denetimi",
    "AI Destekli Tehdit Analizi",
    "Endpoint Detection & Response (EDR)",
    "Zero Trust Network Access (ZTNA)",
    "SOC Hizmetleri",
  ],
  storage: [
    "NAS ve SAN Sistemleri",
    "Yedekleme ve Replikasyon",
    "Felaket Kurtarma (DR) Planlaması",
    "RAID Yapılandırması",
    "Kapasite Planlama",
    "Performans Optimizasyonu",
  ],
  cloud: [
    "Azure Altyapı Yönetimi",
    "AWS Çözümleri",
    "Hibrit Bulut Tasarımı",
    "Cloud Migration",
    "Maliyet Optimizasyonu",
    "Cloud Security",
  ],
  network: [
    "SD-WAN Tasarım ve Deployment",
    "Kampüs ve WAN Ağları",
    "Wi-Fi 6 Çözümleri",
    "Ağ Segmentasyonu",
    "Network Monitoring",
    "QoS Yapılandırması",
  ],
  integration: [
    "Anahtar Teslim Proje Yönetimi",
    "Sistem Mimari Tasarımı",
    "Mevcut Altyapı Entegrasyonu",
    "Test ve Kabul Süreçleri",
    "Devreye Alma ve Eğitim",
    "Dokümantasyon",
  ],
  consulting: [
    "Altyapı Denetimi ve Raporlama",
    "Stratejik Teknoloji Planlaması",
    "Bütçe ve ROI Analizi",
    "Teknoloji Roadmap",
    "Risk Değerlendirmesi",
    "Uyumluluk Danışmanlığı",
  ],
  continuity: [
    "BCP (Business Continuity Plan)",
    "RTO ve RPO Optimizasyonu",
    "Yedekleme Testi",
    "Otomatik Failover",
    "7/24 İzleme",
    "Olay Müdahale Planı",
  ],
  virtualization: [
    "VMware ve Hyper-V",
    "VDI (Virtual Desktop Infrastructure)",
    "Uygulama Sanallaştırma",
    "Konteyner Yönetimi",
    "HCI (Hyper-Converged Infrastructure)",
    "Kaynak Optimizasyonu",
  ],
  lowVoltage: [
    "Yapısal Kablolama (Cat6/Cat6A/Fiber)",
    "IP Kamera ve CCTV Sistemleri",
    "Erişim Kontrol ve Biyometrik",
    "Yangın Algılama ve İhbar",
    "Ses Yayın ve IP Telefon",
    "Bina Otomasyon Sistemleri (BAS)",
  ],
};

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("services");

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "tr" ? "Anasayfa" : "Home",
        item: `${baseUrl}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: locale === "tr" ? "Hizmetler" : "Services",
        item: `${baseUrl}/${locale}/hizmetler`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Hero */}
      <section
        className="pt-32 pb-16 circuit-bg"
        aria-labelledby="services-page-title"
      >
        <div className="container">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol
              className="flex items-center gap-2 text-xs"
              style={{ color: "var(--color-outline)" }}
            >
              <li>
                <a href={`/${locale}`} style={{ color: "var(--color-outline)" }}>
                  {locale === "tr" ? "Anasayfa" : "Home"}
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li style={{ color: "var(--color-primary)" }}>
                {locale === "tr" ? "Hizmetler" : "Services"}
              </li>
            </ol>
          </nav>
          <div className="max-w-2xl">
            <h1
              id="services-page-title"
              className="text-4xl sm:text-5xl font-bold mb-4"
              style={{
                fontFamily: "var(--font-family-headline)",
                color: "var(--color-on-surface)",
              }}
            >
              {t("title")}
            </h1>
            <p
              className="text-lg"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              {t("subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section" aria-label="Hizmet listesi">
        <div className="container">
          <ul
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            role="list"
          >
            {serviceKeys.map((key, index) => {
              const Icon = serviceIcons[index];
              const features = serviceFeatures[key] || [];

              return (
                <li key={key}>
                  <article
                    className="card-glow h-full p-8 rounded-xl"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-outline-variant)",
                      borderRadius: "var(--radius-card)",
                    }}
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: "rgba(0, 82, 255, 0.1)",
                          border: "1px solid rgba(0, 82, 255, 0.2)",
                        }}
                      >
                        <Icon
                          className="w-6 h-6"
                          style={{ color: "var(--color-primary)" }}
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <h2
                          className="text-xl font-semibold mb-2"
                          style={{
                            fontFamily: "var(--font-family-headline)",
                            color: "var(--color-on-surface)",
                          }}
                        >
                          {t(`items.${key}.title`)}
                        </h2>
                        <p
                          className="text-sm leading-relaxed"
                          style={{
                            color: "var(--color-on-surface-variant)",
                          }}
                        >
                          {t(`items.${key}.description`)}
                        </p>
                      </div>
                    </div>

                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6" role="list">
                      {features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm"
                          style={{
                            color: "var(--color-on-surface-variant)",
                          }}
                        >
                          <CheckCircle2
                            className="w-4 h-4 shrink-0"
                            style={{ color: "var(--color-primary)" }}
                            aria-hidden="true"
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center gap-4">
                      <Link
                        href={`/${locale}/${serviceRoutes[key]}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
                        style={{
                          fontFamily: "var(--font-family-label)",
                          color: "var(--color-primary)",
                        }}
                      >
                        {locale === "tr" ? "Detaylar" : "Details"}
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                      <Link
                        href={`/${locale}/iletisim`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
                        style={{
                          fontFamily: "var(--font-family-label)",
                          color: "var(--color-outline)",
                        }}
                      >
                        {locale === "tr" ? "Teklif Al" : "Get Quote"}
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section
        className="section"
        style={{ backgroundColor: "var(--color-surface)" }}
        aria-label="İletişim"
      >
        <div className="container">
          <div
            className="p-10 rounded-2xl text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 82, 255, 0.1) 0%, transparent 100%)",
              border: "1px solid rgba(0, 82, 255, 0.15)",
            }}
          >
            <h2
              className="text-2xl sm:text-3xl font-bold mb-4"
              style={{
                fontFamily: "var(--font-family-headline)",
                color: "var(--color-on-surface)",
              }}
            >
              {locale === "tr"
                ? "İhtiyacınıza Özel Çözüm Tasarlayalım"
                : "Let's Design a Custom Solution for Your Needs"}
            </h2>
            <p
              className="text-base mb-8 max-w-xl mx-auto"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              {locale === "tr"
                ? "Uzman ekibimiz, işletmenize özel altyapı analizi yaparak en uygun çözümleri sunar."
                : "Our expert team analyzes your business infrastructure to offer the most suitable solutions."}
            </p>
            <Link href={`/${locale}/iletisim`} className="btn-cta text-sm px-8 py-3">
              {locale === "tr" ? "Ücretsiz Analiz Al" : "Get Free Analysis"}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
