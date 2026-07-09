import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield, RefreshCw, AlertTriangle, CheckCircle,
  Clock, Mail, Phone, XCircle, Zap,
} from "lucide-react";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Lisans Yenileme | FortiGate, FortiCare, Synology — Lider Network",
    description:
      "Fortinet FortiGuard, FortiCare ve Synology C2 lisanslarınızı zamanında yenileyin. Güvenlik açığı riski taşımadan, destek kesintisiz. Lider Network yetkili partner.",
    keywords: [
      "FortiGate lisans yenileme",
      "FortiCare yenileme",
      "FortiGuard abonelik",
      "Synology C2 lisans",
      "Fortinet lisans Türkiye",
      "firewall lisans yenileme",
      "güvenlik lisansı",
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/lisans-yenileme`,
      languages: {
        tr: `${baseUrl}/tr/lisans-yenileme`,
        en: `${baseUrl}/en/lisans-yenileme`,
      },
    },
    openGraph: {
      title: "Lisans Yenileme | FortiGate ve Synology — Lider Network",
      description:
        "Fortinet ve Synology lisanslarınızı süresi dolmadan yenileyin. Güvenlik korumasında boşluk bırakmayın.",
      url: `${baseUrl}/${locale}/lisans-yenileme`,
    },
  };
}

const products = [
  {
    name: "FortiGuard Güvenlik Abonelikleri",
    description:
      "FortiGate cihazınızın gerçek tehdit korumasının kaynağı. IPS imzaları, antivirus, web filtreleme, uygulama kontrolü ve zararlı yazılım koruma hizmetleri FortiGuard bulutundan beslenir.",
    services: [
      "IPS & Antivirus imza güncellemeleri",
      "Web Filtreleme & DNS Güvenliği",
      "Uygulama Kontrolü güncellemeleri",
      "Anti-spam & E-posta koruması",
      "FortiSandbox Bulut entegrasyonu",
      "IoT & OT tehdit istihbaratı",
    ],
    color: "#EE3124",
    icon: Shield,
    warning: "Süresi dolan FortiGuard aboneliği; IPS imzaları, web filtreleme ve antivirus güncellemelerini durdurur. Cihaz çalışmaya devam eder ancak aktif tehdit koruması olmaz.",
  },
  {
    name: "FortiCare Teknik Destek",
    description:
      "Fortinet'in doğrudan teknik desteği, donanım değişim garantisi ve yazılım güncelleme hakları. Kritik bir arızada üretici desteğine erişim için FortiCare aktif olmalıdır.",
    services: [
      "7/24 Fortinet teknik destek erişimi",
      "Donanım değişim garantisi (NBD / 4H seçenekleri)",
      "FortiOS yazılım güncelleme hakkı",
      "Firmware yükseltme desteği",
      "Online case yönetim portalı",
      "Kritik yama bildirimleri",
    ],
    color: "#0052ff",
    icon: RefreshCw,
    warning: "FortiCare süresi dolduğunda yazılım güncelleme hakları ve üretici teknik desteği kesilir. Yeni çıkan kritik güvenlik yamalarına erişilemez.",
  },
  {
    name: "Synology C2 & Lisans Abonelikleri",
    description:
      "Synology'nin bulut yedekleme, kimlik yönetimi ve kurumsal uygulama hizmetleri için abonelik lisansları. NAS sistemlerinizin eksiksiz işlevselliği için gereklidir.",
    services: [
      "C2 Backup — Bulut yedekleme depolama",
      "C2 Identity — SSO ve kullanıcı yönetimi",
      "C2 Surveillance — Bulut kamera yönetimi",
      "Active Backup paket lisansları",
      "Synology MailPlus lisansları",
      "VPN Plus Server lisansları",
    ],
    color: "#B5121B",
    icon: Zap,
    warning: "Synology C2 aboneliği biterken yedekler durur, bulut senkronizasyonu kesilir. Veri kaybı riski doğmadan yenileme yapılmalıdır.",
  },
];

const timeline = [
  {
    days: "90+ gün önce",
    status: "ideal",
    title: "Planlı Yenileme",
    description: "En avantajlı fiyatla yenileme, kesintisiz hizmet, migrasyon veya yükseltme planlaması için yeterli süre.",
    color: "#059669",
  },
  {
    days: "30-90 gün önce",
    status: "good",
    title: "Zamanında Yenileme",
    description: "Standart yenileme penceresi. Fiyat ve teslimat süresi normaldir. Herhangi bir risk taşımaz.",
    color: "#0052ff",
  },
  {
    days: "0-30 gün önce",
    status: "warning",
    title: "Acil Yenileme",
    description: "Hâlâ korunmaktasınız ancak lisans bitiş tarihi yaklaşıyor. Yenileme işlemini hemen başlatmak gerekir.",
    color: "#f59e0b",
  },
  {
    days: "Süresi dolmuş",
    status: "danger",
    title: "Kritik: Koruma Yok",
    description: "IPS imzaları, antivirus güncellemeleri ve üretici desteği kesilmiştir. Cihaz saldırılara karşı savunmasızdır.",
    color: "#dc2626",
  },
];

export default async function LisansYenilemePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Fortinet ve Synology Lisans Yenileme",
    provider: {
      "@type": "Organization",
      name: "Lider Network Teknoloji",
      url: baseUrl,
    },
    description:
      "FortiGuard, FortiCare ve Synology lisans aboneliklerinin yenilenmesi hizmeti.",
    areaServed: "TR",
    serviceType: "License Renewal",
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
                style={{
                  backgroundColor: "rgba(245,158,11,0.1)",
                  borderColor: "rgba(245,158,11,0.3)",
                }}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span
                  className="uppercase tracking-[0.18em]"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontSize: "11px",
                    color: "#f59e0b",
                  }}
                >
                  Lisans Yönetimi
                </span>
              </div>

              <h1
                className="text-5xl lg:text-6xl font-bold leading-tight"
                style={{
                  fontFamily: "var(--font-family-headline)",
                  letterSpacing: "-0.02em",
                }}
              >
                Lisansınız Ne Zaman{" "}
                <span style={{ color: "#f59e0b" }}>Sona Eriyor?</span>
              </h1>

              <p
                className="text-lg leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Fortinet FortiGuard, FortiCare ve Synology aboneliklerinde yaşanan
                bir lisans süresi dolumu; güvenlik korumanızı, teknik desteğinizi
                ve yazılım güncelleme haklarınızı anında keser. Bunu önceden planlamak
                hem güvenliğinizi hem de bütçenizi korur.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="mailto:lisans@lidernetwork.com.tr"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-lg font-bold uppercase tracking-widest transition-all"
                  style={{
                    backgroundColor: "#f59e0b",
                    color: "#0b0f10",
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                  }}
                >
                  <Mail className="w-4 h-4" />
                  Lisans Sorgula
                </a>
                <a
                  href="tel:+903122320288"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-lg font-bold uppercase tracking-widest"
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
              </div>
            </div>

            {/* Timeline Card */}
            <div className="space-y-3">
              {timeline.map((item) => (
                <div
                  key={item.days}
                  className="industrial-border rounded-xl p-5 flex items-start gap-4"
                  style={{ backgroundColor: "#191c1e" }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span
                        className="text-sm font-semibold text-white"
                        style={{ fontFamily: "var(--font-family-headline)" }}
                      >
                        {item.title}
                      </span>
                      <span
                        className="text-xs shrink-0 px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${item.color}18`,
                          color: item.color,
                          fontFamily: "var(--font-family-label)",
                        }}
                      >
                        {item.days}
                      </span>
                    </div>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="py-20 px-5 lg:px-20 max-w-[1280px] mx-auto">
          <div className="mb-12">
            <span
              className="uppercase tracking-[0.2em] text-xs mb-4 block"
              style={{
                fontFamily: "var(--font-family-label)",
                color: "var(--color-on-surface-variant)",
              }}
            >
              Yenileme Kapsamı
            </span>
            <h2
              className="text-3xl lg:text-4xl font-bold text-white"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Hangi Lisansları Yönetiyoruz?
            </h2>
          </div>

          <div className="space-y-6">
            {products.map((product) => {
              const Icon = product.icon;
              return (
                <div
                  key={product.name}
                  className="industrial-border rounded-xl overflow-hidden"
                  style={{ backgroundColor: "#191c1e" }}
                >
                  <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left */}
                    <div className="lg:col-span-1">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: `${product.color}18` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: product.color }} />
                      </div>
                      <h3
                        className="text-xl font-semibold text-white mb-3"
                        style={{ fontFamily: "var(--font-family-headline)" }}
                      >
                        {product.name}
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        {product.description}
                      </p>
                    </div>

                    {/* Services */}
                    <div className="lg:col-span-1">
                      <p
                        className="text-xs uppercase tracking-widest mb-4"
                        style={{
                          fontFamily: "var(--font-family-label)",
                          color: "var(--color-on-surface-variant)",
                        }}
                      >
                        Kapsam
                      </p>
                      <ul className="space-y-2.5">
                        {product.services.map((s) => (
                          <li key={s} className="flex items-start gap-2.5">
                            <CheckCircle
                              className="w-4 h-4 shrink-0 mt-0.5"
                              style={{ color: product.color }}
                            />
                            <span
                              className="text-sm"
                              style={{ color: "var(--color-on-surface-variant)" }}
                            >
                              {s}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Warning */}
                    <div className="lg:col-span-1">
                      <div
                        className="rounded-xl p-5 h-full flex flex-col justify-between"
                        style={{
                          backgroundColor: "rgba(220,38,38,0.07)",
                          border: "1px solid rgba(220,38,38,0.2)",
                        }}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span
                              className="text-xs font-semibold text-red-400 uppercase tracking-wider"
                              style={{ fontFamily: "var(--font-family-label)" }}
                            >
                              Süresi Dolarsa
                            </span>
                          </div>
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: "var(--color-on-surface-variant)" }}
                          >
                            {product.warning}
                          </p>
                        </div>
                        <a
                          href="mailto:lisans@lidernetwork.com.tr"
                          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold"
                          style={{
                            color: product.color,
                            fontFamily: "var(--font-family-label)",
                          }}
                        >
                          Yenileme Talebi →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why Lider Network */}
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
                  className="text-3xl lg:text-4xl font-bold text-white mb-6"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  Neden Lider Network Üzerinden{" "}
                  <span style={{ color: "var(--color-primary)" }}>Yenileme?</span>
                </h2>
                <p
                  className="text-base leading-relaxed mb-8"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Lisans yenilemenizi doğrudan Fortinet veya Synology portalından
                  yapabilirsiniz; ancak yetkili partner olarak Lider Network üzerinden
                  yapmanın somut avantajları vardır.
                </p>
                <div className="space-y-4">
                  {[
                    {
                      title: "Portföy Takibi",
                      desc: "Birden fazla cihaz veya aboneliğinizin sona erme tarihlerini takip eder, sizi önceden bilgilendiririz.",
                    },
                    {
                      title: "Yerel Fiyatlandırma ve Fatura",
                      desc: "Türkiye'de yerel fatura, uygun döviz kuru ve vergi avantajıyla lisans yenilemesi.",
                    },
                    {
                      title: "Aktivasyon Desteği",
                      desc: "Yenileme sonrası lisans aktivasyonunu biz yönetiriz. Cihazınızda kesinti yaşanmaz.",
                    },
                    {
                      title: "Toplu İndirim İmkânı",
                      desc: "Birden fazla ürün veya çok yıllı lisans alımlarında özel fiyatlandırma.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: "rgba(0,82,255,0.15)" }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: "var(--color-primary)" }}
                        />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white">
                          {item.title}
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: "var(--color-on-surface-variant)" }}
                        >
                          {" "}— {item.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="industrial-border rounded-2xl p-8"
                style={{ backgroundColor: "#191c1e" }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3
                    className="text-lg font-semibold text-white"
                    style={{ fontFamily: "var(--font-family-headline)" }}
                  >
                    Lisansınızı Öğrenmek İster misiniz?
                  </h3>
                </div>

                <p
                  className="text-sm leading-relaxed mb-6"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  FortiGate cihazınızın seri numarasını veya Synology C2 hesap
                  bilgilerinizi iletmeniz yeterli. Aktif lisanslarınızı, sona erme
                  tarihlerini ve yenileme maliyetini size bildirelim.
                </p>

                <div className="space-y-3">
                  <a
                    href="mailto:lisans@lidernetwork.com.tr"
                    className="flex items-center gap-3 p-4 rounded-xl transition-all hover:opacity-80"
                    style={{
                      backgroundColor: "rgba(0,82,255,0.1)",
                      border: "1px solid rgba(0,82,255,0.25)",
                    }}
                  >
                    <Mail className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                    <div>
                      <div
                        className="text-xs uppercase tracking-wider mb-0.5"
                        style={{
                          fontFamily: "var(--font-family-label)",
                          color: "var(--color-on-surface-variant)",
                        }}
                      >
                        E-posta
                      </div>
                      <div className="text-sm font-semibold text-white">
                        lisans@lidernetwork.com.tr
                      </div>
                    </div>
                  </a>

                  <a
                    href="tel:+903122320288"
                    className="flex items-center gap-3 p-4 rounded-xl transition-all hover:opacity-80"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(141,144,162,0.2)",
                    }}
                  >
                    <Phone className="w-5 h-5" style={{ color: "var(--color-on-surface-variant)" }} />
                    <div>
                      <div
                        className="text-xs uppercase tracking-wider mb-0.5"
                        style={{
                          fontFamily: "var(--font-family-label)",
                          color: "var(--color-on-surface-variant)",
                        }}
                      >
                        Telefon
                      </div>
                      <div className="text-sm font-semibold text-white">
                        +90 312 232 02 88
                      </div>
                    </div>
                  </a>
                </div>

                <p
                  className="text-xs mt-5"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Mesai saatleri: Hafta içi 08:30–17:30 | Cumartesi 08:30–13:00
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-5 lg:px-20 max-w-[1280px] mx-auto text-center relative overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{
              backgroundColor: "rgba(245,158,11,0.06)",
              filter: "blur(100px)",
            }}
          />
          <div className="relative z-10 max-w-xl mx-auto">
            <h2
              className="text-3xl lg:text-4xl font-semibold text-white mb-5"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Bugün Harekete Geçin
            </h2>
            <p
              className="text-base mb-8 leading-relaxed"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Güvenlik korumanızda tek günlük bir boşluk bile risk taşır. Lisans
              yenileme sürecinizi başlatın, ekibimiz size yol göstersin.
            </p>
            <Link
              href={`/${locale}/iletisim`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold uppercase tracking-widest transition-all"
              style={{
                backgroundColor: "#f59e0b",
                color: "#0b0f10",
                fontFamily: "var(--font-family-label)",
                fontSize: "12px",
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Lisans Yenileme Başlat
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
