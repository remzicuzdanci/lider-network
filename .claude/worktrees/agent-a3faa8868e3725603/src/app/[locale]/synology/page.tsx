import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  HardDrive,
  Shield,
  Camera,
  Users,
  ArrowRight,
  CheckCircle2,
  Award,
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
      ? "Synology Çözümleri - NAS Sistemleri, Active Backup, Surveillance Station"
      : "Synology Solutions - NAS Systems, Active Backup, Surveillance Station",
    description: isTr
      ? "Lider Network Synology Yetkili Partner. NAS sistemleri, Active Backup, Surveillance Station kurulum ve destek. Kurumsal veri depolama ve yönetim çözümleri. İstanbul."
      : "Lider Network Synology Authorized Partner. NAS systems, Active Backup, Surveillance Station installation and support. Enterprise data storage and management solutions.",
    alternates: {
      canonical: `${baseUrl}/${locale}/synology`,
      languages: {
        tr: `${baseUrl}/tr/synology`,
        en: `${baseUrl}/en/synology`,
      },
    },
    openGraph: {
      title: isTr
        ? "Synology Yetkili Partner | Lider Network"
        : "Synology Authorized Partner | Lider Network",
      description: isTr
        ? "Synology NAS, backup ve gözetim çözümleri için yetkili partner."
        : "Authorized partner for Synology NAS, backup and surveillance solutions.",
      url: `${baseUrl}/${locale}/synology`,
    },
  };
}

const products = [
  {
    key: "nas",
    icon: HardDrive,
    color: "#b7c4ff",
    features: [
      "Yüksek Kapasite RAID Dizileri",
      "Hot-Swap Disk Desteği",
      "HA (High Availability) Küme",
      "SSD Cache Hızlandırma",
      "iSCSI ve NFS Desteği",
      "Anlık Snapshot",
    ],
  },
  {
    key: "backup",
    icon: Shield,
    color: "#7aa0ff",
    features: [
      "Fiziksel Sunucu Yedekleme",
      "Sanal Makine Yedekleme",
      "Microsoft 365 Yedekleme",
      "Google Workspace Yedekleme",
      "Uç Nokta Yedekleme",
      "Çoğaltma ve DR",
    ],
  },
  {
    key: "surveillance",
    icon: Camera,
    color: "#9ab0ff",
    features: [
      "IP Kamera Yönetimi",
      "Hareket Algılama",
      "E-Map ve Harita Görünümü",
      "Çoklu Monitor Desteği",
      "Video Analitik",
      "Uzaktan İzleme",
    ],
  },
  {
    key: "office",
    icon: Users,
    color: "#c4d0ff",
    features: [
      "Dosya Paylaşım ve Senkronizasyon",
      "Online Ofis Araçları",
      "Şirket Takvimi",
      "Mesajlaşma ve Video",
      "Erişim Kontrolü",
      "Audit Log",
    ],
  },
];

export default async function SynologyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("synology");

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
        name: "Synology",
        item: `${baseUrl}/${locale}/synology`,
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
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(183, 196, 255, 0.05) 0%, transparent 50%), linear-gradient(rgba(0, 82, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 82, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 60px 60px, 60px 60px",
        }}
        aria-labelledby="synology-page-title"
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
              <li style={{ color: "var(--color-primary)" }}>Synology</li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            {/* Partner Badge */}
            <div
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: "rgba(183, 196, 255, 0.08)",
                border: "1px solid rgba(183, 196, 255, 0.2)",
                fontFamily: "var(--font-family-label)",
              }}
            >
              <Award
                className="w-3.5 h-3.5"
                style={{ color: "var(--color-primary)" }}
                aria-hidden="true"
              />
              <span style={{ color: "var(--color-primary)" }}>
                Synology Yetkili Partner
              </span>
              <span style={{ color: "var(--color-outline)" }}>
                · Solution Provider
              </span>
            </div>

            <h1
              id="synology-page-title"
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

      {/* Products */}
      <section className="section" aria-labelledby="synology-products-title">
        <div className="container">
          <h2
            id="synology-products-title"
            className="text-3xl font-bold mb-12"
            style={{
              fontFamily: "var(--font-family-headline)",
              color: "var(--color-on-surface)",
            }}
          >
            {t("products.title")}
          </h2>

          <ul
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            role="list"
          >
            {products.map((product) => {
              const Icon = product.icon;
              return (
                <li key={product.key}>
                  <article
                    className="card-glow h-full p-8 rounded-xl"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-outline-variant)",
                      borderRadius: "var(--radius-card)",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center mb-5"
                      style={{
                        backgroundColor: `${product.color}15`,
                        border: `1px solid ${product.color}30`,
                      }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: product.color }}
                        aria-hidden="true"
                      />
                    </div>
                    <h3
                      className="text-xl font-semibold mb-2"
                      style={{
                        fontFamily: "var(--font-family-headline)",
                        color: "var(--color-on-surface)",
                      }}
                    >
                      {t(`products.${product.key}.title` as any)}
                    </h3>
                    <p
                      className="text-sm mb-5 leading-relaxed"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {t(`products.${product.key}.description` as any)}
                    </p>
                    <ul className="grid grid-cols-2 gap-2" role="list">
                      {product.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-xs"
                          style={{ color: "var(--color-on-surface-variant)" }}
                        >
                          <CheckCircle2
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: product.color }}
                            aria-hidden="true"
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Use Cases */}
      <section
        className="section circuit-bg"
        aria-labelledby="synology-usecases-title"
      >
        <div className="container">
          <h2
            id="synology-usecases-title"
            className="text-3xl font-bold mb-12 text-center"
            style={{
              fontFamily: "var(--font-family-headline)",
              color: "var(--color-on-surface)",
            }}
          >
            {locale === "tr" ? "Kullanım Senaryoları" : "Use Cases"}
          </h2>
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            role="list"
          >
            {[
              {
                title: locale === "tr" ? "KOBİ Depolama" : "SMB Storage",
                desc:
                  locale === "tr"
                    ? "Küçük ve orta ölçekli işletmeler için uygun maliyetli merkezi depolama."
                    : "Cost-effective centralized storage for small and medium-sized businesses.",
              },
              {
                title: locale === "tr" ? "Kurumsal Yedekleme" : "Enterprise Backup",
                desc:
                  locale === "tr"
                    ? "Kritik verilerin otomatik yedeklenmesi ve felaket kurtarma planlaması."
                    : "Automatic backup of critical data and disaster recovery planning.",
              },
              {
                title: locale === "tr" ? "Medya Sunucusu" : "Media Server",
                desc:
                  locale === "tr"
                    ? "Yüksek çözünürlüklü video ve içerik yönetim platformu."
                    : "High-resolution video and content management platform.",
              },
              {
                title: locale === "tr" ? "IP Kamera Sistemi" : "IP Camera System",
                desc:
                  locale === "tr"
                    ? "Güvenli ve ölçeklenebilir kurumsal gözetim altyapısı."
                    : "Secure and scalable enterprise surveillance infrastructure.",
              },
              {
                title: locale === "tr" ? "Hibrit Bulut" : "Hybrid Cloud",
                desc:
                  locale === "tr"
                    ? "On-premise NAS ile bulut depolamayı sorunsuz entegre edin."
                    : "Seamlessly integrate on-premise NAS with cloud storage.",
              },
              {
                title: locale === "tr" ? "DR/BCP Çözümü" : "DR/BCP Solution",
                desc:
                  locale === "tr"
                    ? "Uzak lokasyona replikasyon ile iş sürekliliği güvencesi."
                    : "Business continuity assurance with remote location replication.",
              },
            ].map((item) => (
              <li key={item.title}>
                <article
                  className="p-6 rounded-xl h-full"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-outline-variant)",
                    borderRadius: "var(--radius-card)",
                  }}
                >
                  <h3
                    className="font-semibold mb-2"
                    style={{
                      fontFamily: "var(--font-family-headline)",
                      color: "var(--color-on-surface)",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    {item.desc}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section
        className="section"
        style={{ backgroundColor: "var(--color-surface)" }}
        aria-label="Synology Teklif"
      >
        <div className="container">
          <div
            className="p-10 rounded-2xl text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(183, 196, 255, 0.08) 0%, transparent 100%)",
              border: "1px solid rgba(183, 196, 255, 0.15)",
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
                ? "Synology NAS Çözümünüzü Tasarlayalım"
                : "Let's Design Your Synology NAS Solution"}
            </h2>
            <p
              className="text-base mb-8 max-w-xl mx-auto"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              {locale === "tr"
                ? "Veri depolama ihtiyacınıza özel Synology NAS yapılandırması için uzmanlarımızla görüşün."
                : "Consult with our experts for a Synology NAS configuration tailored to your data storage needs."}
            </p>
            <Link href={`/${locale}/iletisim`} className="btn-primary text-sm px-8 py-3">
              {locale === "tr" ? "Teklif İste" : "Request Quote"}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
