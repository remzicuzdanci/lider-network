import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin, Phone, Mail, Clock, CheckCircle, Building2,
  Heart, Landmark, GraduationCap, Factory, Shield, ArrowRight,
} from "lucide-react";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Ankara Fortinet Yetkili Partner | Siber Güvenlik & BT Altyapı — Lider Network",
    description:
      "Lider Network, Ankara'nın önde gelen Fortinet Yetkili Partner'ıdır. 2006'dan bu yana kamu kurumları, finans, sağlık ve üretim sektörlerine kurumsal siber güvenlik, FortiGate ve Synology çözümleri sunuyoruz.",
    keywords: [
      "Ankara Fortinet yetkili partner",
      "Ankara siber güvenlik firması",
      "Ankara BT altyapı şirketi",
      "Ankara FortiGate satış destek",
      "Ankara Synology partner",
      "Ankara ağ güvenliği",
      "Ankara NGFW",
      "Ankara IT çözümleri",
      "Çankaya BT firması",
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/ankara-fortinet-partner`,
      languages: {
        tr: `${baseUrl}/tr/ankara-fortinet-partner`,
        en: `${baseUrl}/en/ankara-fortinet-partner`,
      },
    },
    openGraph: {
      title: "Ankara Fortinet Yetkili Partner — Lider Network",
      description:
        "Ankara merkezli, 20 yıllık deneyimli Fortinet ve Synology yetkili partner. Kurumsal siber güvenlik ve BT altyapı çözümleri.",
      url: `${baseUrl}/${locale}/ankara-fortinet-partner`,
    },
  };
}

export default async function AnkaraPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}/tr/ankara-fortinet-partner#local`,
    name: "Lider Network Teknoloji — Ankara Fortinet Partner",
    description:
      "Ankara merkezli Fortinet Yetkili Partner. Kurumsal siber güvenlik, FortiGate, Synology ve ağ altyapısı çözümleri.",
    url: `${baseUrl}/${locale}/ankara-fortinet-partner`,
    telephone: "+90-312-232-02-88",
    email: "info@lidernetwork.com.tr",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Birlik Mh. 448. Cd No:119/2",
      addressLocality: "Çankaya",
      addressRegion: "Ankara",
      postalCode: "06610",
      addressCountry: "TR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 39.9185,
      longitude: 32.8637,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:30",
        closes: "17:30",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday"],
        opens: "08:30",
        closes: "13:00",
      },
    ],
    areaServed: {
      "@type": "City",
      name: "Ankara",
    },
    brand: {
      "@type": "Brand",
      name: "Fortinet Yetkili Partner",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Ankara BT ve Siber Güvenlik Çözümleri",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "FortiGate NGFW Satış ve Kurulum" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Synology NAS ve Depolama" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Siber Güvenlik Danışmanlığı" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Ağ Altyapısı Tasarımı" } },
      ],
    },
  };

  const sectors = [
    { icon: Landmark, label: "Kamu & E-Devlet", href: `/${locale}/sektorler/kamu` },
    { icon: Heart, label: "Sağlık & Hastane", href: `/${locale}/sektorler/saglik` },
    { icon: Building2, label: "Finans & Bankacılık", href: `/${locale}/sektorler/finans` },
    { icon: GraduationCap, label: "Eğitim & Üniversite", href: `/${locale}/sektorler/egitim` },
    { icon: Factory, label: "Üretim & Sanayi", href: `/${locale}/sektorler/uretim` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="pt-20">
        {/* Hero */}
        <section
          className="relative overflow-hidden py-28 px-5 lg:px-20"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          <div
            className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              backgroundColor: "rgba(0,82,255,0.07)",
              filter: "blur(120px)",
            }}
          />

          <div className="relative z-10 max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-7">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
                style={{
                  backgroundColor: "rgba(0,82,255,0.08)",
                  borderColor: "rgba(0,82,255,0.25)",
                }}
              >
                <MapPin className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} />
                <span
                  className="uppercase tracking-[0.18em]"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontSize: "11px",
                    color: "var(--color-primary)",
                  }}
                >
                  Ankara, Türkiye
                </span>
              </div>

              <h1
                className="text-5xl lg:text-6xl font-bold leading-tight"
                style={{
                  fontFamily: "var(--font-family-headline)",
                  letterSpacing: "-0.02em",
                }}
              >
                Ankara'nın{" "}
                <span style={{ color: "var(--color-primary)" }}>
                  Fortinet Yetkili
                </span>{" "}
                BT Partneri
              </h1>

              <p
                className="text-lg leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Lider Network, 2006'dan bu yana Ankara merkezli faaliyet gösteren,
                Fortinet Yetkili Partner statüsüne sahip kurumsal BT firmasıdır.
                Kamu kurumlarından özel sektöre, üniversitelerden sağlık kuruluşlarına
                Ankara'nın geniş bir yelpazesine FortiGate, Synology ve çeşitli
                BT altyapı çözümleri sunuyoruz.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href={`/${locale}/iletisim`}
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-lg font-bold uppercase tracking-widest transition-all"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "white",
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                  }}
                >
                  Proje Görüşmesi Ayarla
                  <ArrowRight className="w-4 h-4" />
                </Link>
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

            {/* Contact Card */}
            <div
              className="industrial-border rounded-2xl p-8 space-y-5"
              style={{ backgroundColor: "#191c1e" }}
            >
              <h2
                className="text-xl font-semibold text-white mb-6"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Ankara Ofisimiz
              </h2>

              {[
                {
                  icon: MapPin,
                  label: "Adres",
                  value: "Birlik Mh. 448. Cd No:119/2, Çankaya / Ankara",
                  href: "https://maps.google.com/?q=Lider+Network+Ankara",
                },
                {
                  icon: Phone,
                  label: "Telefon",
                  value: "+90 312 232 02 88",
                  href: "tel:+903122320288",
                },
                {
                  icon: Mail,
                  label: "E-posta",
                  value: "info@lidernetwork.com.tr",
                  href: "mailto:info@lidernetwork.com.tr",
                },
                {
                  icon: Clock,
                  label: "Çalışma Saatleri",
                  value: "Hft içi 08:30–17:30 | Cumartesi 08:30–13:00",
                  href: null,
                },
              ].map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(0,82,255,0.12)" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                  </div>
                  <div>
                    <p
                      className="text-xs uppercase tracking-wider mb-0.5"
                      style={{
                        fontFamily: "var(--font-family-label)",
                        color: "var(--color-on-surface-variant)",
                      }}
                    >
                      {label}
                    </p>
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-sm text-white hover:opacity-75 transition-opacity"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm text-white">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section
          className="py-12 border-y"
          style={{
            backgroundColor: "#0b0f10",
            borderColor: "rgba(141,144,162,0.15)",
          }}
        >
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: "2006", label: "Kuruluş Yılı", sub: "Ankara'da 20 yıl" },
                { value: "500+", label: "Aktif Proje", sub: "Tüm Türkiye" },
                { value: "Fortinet", label: "Yetkili Partner", sub: "Resmi sertifikasyon" },
                { value: "7/24", label: "Teknik Destek", sub: "Ankara & uzaktan" },
              ].map(({ value, label, sub }) => (
                <div key={label}>
                  <div
                    className="text-3xl lg:text-4xl font-bold mb-1"
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
        </section>

        {/* Why Local Partner */}
        <section className="py-20 px-5 lg:px-20 max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <span
                className="uppercase tracking-[0.2em] text-xs mb-4 block"
                style={{
                  fontFamily: "var(--font-family-label)",
                  color: "var(--color-on-surface-variant)",
                }}
              >
                Yerel Partner Avantajı
              </span>
              <h2
                className="text-3xl lg:text-4xl font-bold text-white mb-8"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Ankara'da Yerinde{" "}
                <span style={{ color: "var(--color-primary)" }}>
                  Hızlı Müdahale
                </span>
              </h2>

              <div className="space-y-5">
                {[
                  {
                    title: "Sahaya İnebilme Hızı",
                    desc: "Kritik bir arızada uzaktan destek yetmediğinde, Ankara içinde saatler içinde sahaya ineriz. Yerli partner'ın en büyük avantajı budur.",
                  },
                  {
                    title: "Kamu Sektörü Deneyimi",
                    desc: "Ankara'nın kamu ağırlıklı yapısını iyi biliriz. BTK, USOM gereksinimleri ve e-devlet altyapıları konusunda derin deneyimimiz var.",
                  },
                  {
                    title: "Yerel Fatura ve Sözleşme",
                    desc: "Türkçe sözleşme, yerel banka havalesi, e-fatura ve KDV konularında tam uyum. Kamu alımı süreçlerinde deneyimli.",
                  },
                  {
                    title: "Uzun Vadeli İlişki",
                    desc: "Proje satış-kurulum-destek döngüsünü tek çatı altında yönetiyoruz. Müşterilerimizi yıllarca tanıyan mühendislerimiz var.",
                  },
                  {
                    title: "Tüm Türkiye'ye Ulaşım",
                    desc: "Ankara merkezli olmakla birlikte tüm Türkiye'de uzaktan ve yerinde destek sunuyoruz. Sahaya inme gereken durumlarda çözüm ortaklarımızla hizmet veririz.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <CheckCircle
                      className="w-5 h-5 shrink-0 mt-0.5"
                      style={{ color: "var(--color-primary)" }}
                    />
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

            {/* Çözümler */}
            <div>
              <span
                className="uppercase tracking-[0.2em] text-xs mb-4 block"
                style={{
                  fontFamily: "var(--font-family-label)",
                  color: "var(--color-on-surface-variant)",
                }}
              >
                Ankara'da Sunduğumuz Çözümler
              </span>

              <div className="space-y-3">
                {[
                  {
                    title: "FortiGate NGFW Satış & Kurulum",
                    desc: "Tüm FortiGate modellerinin temin, kurulum, konfigürasyon ve devreye alma hizmeti. Ankara içi yerinde ekip.",
                  },
                  {
                    title: "Synology NAS & Depolama",
                    desc: "Kurumsal NAS, all-flash depolama ve yedekleme sistemleri. Fiziksel kurulum ve DSM yapılandırması dahil.",
                  },
                  {
                    title: "Ağ Altyapısı Tasarımı",
                    desc: "Kampüs, şube ve veri merkezi ağ mimarisi tasarımı, switch/AP temin ve kurulum.",
                  },
                  {
                    title: "Siber Güvenlik Danışmanlığı",
                    desc: "Güvenlik değerlendirmesi, sızma testi koordinasyonu, KVKK & BTK uyumluluk analizi.",
                  },
                  {
                    title: "Lisans & Bakım Yönetimi",
                    desc: "FortiCare, FortiGuard ve Synology lisanslarının takibi ve yenilenmesi.",
                  },
                  {
                    title: "7/24 Teknik Destek",
                    desc: "Kritik sistemler için 7/24 uzaktan destek, iş saatlerinde Ankara'da yerinde müdahale.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="industrial-border rounded-xl p-5"
                    style={{ backgroundColor: "#191c1e" }}
                  >
                    <h3
                      className="text-sm font-semibold text-white mb-1.5"
                      style={{ fontFamily: "var(--font-family-headline)" }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Ankara Sektörleri */}
        <section
          className="py-16 border-t"
          style={{ borderColor: "rgba(141,144,162,0.15)" }}
        >
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto">
            <div className="mb-10">
              <span
                className="uppercase tracking-[0.2em] text-xs mb-4 block"
                style={{
                  fontFamily: "var(--font-family-label)",
                  color: "var(--color-on-surface-variant)",
                }}
              >
                Ankara'da Hizmet Verdiğimiz Sektörler
              </span>
              <h2
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Her Sektöre{" "}
                <span style={{ color: "var(--color-primary)" }}>Özel Uzmanlık</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {sectors.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="group industrial-border rounded-xl p-5 text-center flex flex-col items-center gap-3 transition-all hover:-translate-y-0.5"
                  style={{ backgroundColor: "#191c1e" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(0,82,255,0.12)" }}
                  >
                    <Icon
                      className="w-5 h-5 transition-colors"
                      style={{ color: "var(--color-primary)" }}
                    />
                  </div>
                  <span
                    className="text-xs font-semibold text-white text-center leading-snug"
                    style={{ fontFamily: "var(--font-family-label)" }}
                  >
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="py-20 border-t"
          style={{ borderColor: "rgba(141,144,162,0.15)", backgroundColor: "#0b0f10" }}
        >
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6" style={{ color: "var(--color-primary)" }} />
                  <span
                    className="uppercase tracking-[0.18em] text-xs"
                    style={{
                      fontFamily: "var(--font-family-label)",
                      color: "var(--color-primary)",
                    }}
                  >
                    Fortinet Yetkili Partner
                  </span>
                </div>
                <h2
                  className="text-3xl lg:text-4xl font-bold text-white mb-4"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  Ankara'daki BT Projeniz İçin Hazırız
                </h2>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Ağ güvenliği, veri depolama veya BT altyapısı konularında
                  ihtiyacınızı anlatan bir e-posta yeterli. Kısa süre içinde
                  teknik ekibimizden dönüş alırsınız.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/${locale}/iletisim`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-bold uppercase tracking-widest transition-all text-center"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "white",
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                  }}
                >
                  İletişime Geç
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="mailto:info@lidernetwork.com.tr"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-bold uppercase tracking-widest"
                  style={{
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                  }}
                >
                  <Mail className="w-4 h-4" />
                  E-posta Gönder
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
