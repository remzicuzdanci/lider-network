import type { Metadata } from "next";
import Link from "next/link";
import {
  Network,
  Camera,
  Lock,
  Flame,
  Volume2,
  Building2,
  Zap,
  Video,
  Mail,
  CheckCircle2,
  Shield,
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
      ? "Zayıf Akım Sistemleri | Kamera, Erişim Kontrol, Yapısal Kablolama - Lider Network"
      : "Low Voltage Systems | CCTV, Access Control, Structured Cabling - Lider Network",
    description: isTr
      ? "Lider Network zayıf akım sistemleri: yapısal kablolama, IP kamera ve CCTV, erişim kontrol, yangın algılama, ses yayın, bina otomasyonu ve video konferans. Anahtar teslim proje yönetimi."
      : "Lider Network low voltage systems: structured cabling, IP camera & CCTV, access control, fire detection, PA systems, building automation and video conferencing. Turnkey project management.",
    keywords: isTr
      ? [
          "zayıf akım sistemleri",
          "yapısal kablolama",
          "IP kamera",
          "CCTV",
          "erişim kontrol",
          "yangın algılama",
          "bina otomasyonu",
          "ses yayın sistemleri",
          "video konferans",
          "fiber optik kablolama",
        ]
      : [
          "low voltage systems",
          "structured cabling",
          "IP camera",
          "CCTV",
          "access control",
          "fire detection",
          "building automation",
          "PA systems",
          "video conferencing",
          "fiber optic cabling",
        ],
    alternates: {
      canonical: `${baseUrl}/${locale}/zayif-akim`,
      languages: {
        tr: `${baseUrl}/tr/zayif-akim`,
        en: `${baseUrl}/en/zayif-akim`,
      },
    },
    openGraph: {
      title: isTr
        ? "Zayıf Akım Sistemleri | Lider Network"
        : "Low Voltage Systems | Lider Network",
      description: isTr
        ? "Yapısal kablolama, güvenlik kameraları, erişim kontrol ve bina otomasyonu dahil uçtan uca zayıf akım altyapı çözümleri."
        : "End-to-end low voltage infrastructure solutions including structured cabling, security cameras, access control and building automation.",
      url: `${baseUrl}/${locale}/zayif-akim`,
    },
  };
}

export default async function ZayifAkimPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isTr = locale === "tr";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: isTr ? "Zayıf Akım Sistemleri" : "Low Voltage Systems",
    provider: {
      "@type": "Organization",
      name: "Lider Network Teknoloji",
      url: baseUrl,
    },
    description: isTr
      ? "Yapısal kablolama, IP kamera, erişim kontrol, yangın algılama ve bina otomasyonu dahil kapsamlı zayıf akım sistem çözümleri."
      : "Comprehensive low voltage system solutions including structured cabling, IP cameras, access control, fire detection and building automation.",
    areaServed: "TR",
    serviceType: "Low Voltage Systems",
  };

  /* ── Localised content ──────────────────────────────────────────── */

  const cabling = {
    badge:    isTr ? "Altyapı Temeli"              : "Infrastructure Foundation",
    title:    isTr ? "Yapısal Kablolama"            : "Structured Cabling",
    desc:     isTr
      ? "Cat6, Cat6A ve fiber optik altyapılar dahil tüm yapısal kablolama sistemlerini standartlara uygun biçimde kuruyoruz. Veri, ses ve görüntü iletimini tek altyapı üzerinde yönetebilmenizi sağlıyoruz."
      : "We install all structured cabling systems — including Cat6, Cat6A and fiber optic — in full compliance with standards, enabling you to manage data, voice and video transmission over a single unified infrastructure.",
    features: isTr
      ? ["Cat6 / Cat6A Bakır Kablolama", "Tek ve Çok Modlu Fiber Optik", "Patch Panel ve Rack Organizasyonu", "Kablo Testleri ve Sertifikasyon"]
      : ["Cat6 / Cat6A Copper Cabling", "Single & Multimode Fiber Optic", "Patch Panel & Rack Organization", "Cable Testing & Certification"],
  };

  const camera = {
    title:   isTr ? "IP Kamera & CCTV"          : "IP Camera & CCTV",
    desc:    isTr
      ? "Bina içi/dışı gözetleme, hareket algılama ve uzaktan izleme özellikli IP kamera sistemleri."
      : "Indoor/outdoor surveillance with motion detection and remote monitoring — scalable IP camera systems for any facility.",
    cta:     isTr ? "Teklif Al →"                : "Get Quote →",
  };

  const access = {
    title:   isTr ? "Erişim Kontrol"             : "Access Control",
    desc:    isTr
      ? "Kartlı geçiş, biyometrik okuyucu ve PIN girişli kapı kontrol sistemleri. Yetki seviyeli, zamanlı erişim yönetimi."
      : "Card, biometric and PIN-based door control systems with time-scheduled, role-based access management.",
    features: isTr
      ? ["Kartlı ve Biyometrik Sistemler", "Turnike ve Bariyer", "Ziyaretçi Yönetimi"]
      : ["Card & Biometric Systems", "Turnstile & Barrier", "Visitor Management"],
  };

  const fire = {
    badge:   isTr ? "Zorunlu Sistem"             : "Mandatory System",
    title:   isTr ? "Yangın Algılama ve İhbar"   : "Fire Detection & Alarm",
    desc:    isTr
      ? "Adresli ve konvansiyonel yangın ihbar panelleri, duman dedektörleri, siren ve ışıklı uyarı sistemleri. Standartlara uygun kurulum ve bakım."
      : "Addressable and conventional fire alarm panels, smoke detectors, sirens and visual warning systems. Standards-compliant installation and maintenance.",
  };

  const audio = {
    title:   isTr ? "Ses Yayın Sistemleri"       : "PA & Audio Systems",
    desc:    isTr
      ? "Bölgesel anons, arka plan müziği ve acil yönlendirme dahil IP tabanlı ve geleneksel PA sistemleri."
      : "IP-based and conventional PA systems for zone announcements, background music and emergency evacuation guidance.",
    features: isTr
      ? ["IP Anons Sistemleri", "Acil Tahliye Sesi", "Çok Bölgeli Yayın"]
      : ["IP Announcement Systems", "Emergency Evacuation Audio", "Multi-Zone Broadcasting"],
  };

  const bms = {
    badge:   isTr ? "Akıllı Bina"               : "Smart Building",
    title:   isTr ? "Bina Otomasyon Sistemleri" : "Building Automation Systems",
    desc:    isTr
      ? "HVAC, aydınlatma, enerji yönetimi ve güvenlik sistemlerinin tek bir merkezi platform üzerinden otomatik olarak yönetilmesini sağlıyoruz. Binayı akıllı hale getirirken enerji tüketimini de optimize ediyoruz."
      : "We centralize HVAC, lighting, energy management and security into a single automated platform — making buildings smarter while optimizing energy consumption.",
    metrics: [
      { value: isTr ? "Merkezi" : "Central",   label: isTr ? "Yönetim Paneli"   : "Management Panel" },
      { value: "HVAC",                          label: isTr ? "İklim Kontrolü"   : "Climate Control"  },
      { value: isTr ? "%30↓" : "30%↓",         label: isTr ? "Enerji Tasarrufu" : "Energy Savings"   },
      { value: "BACnet",                        label: isTr ? "Standart Protokol": "Standard Protocol" },
    ],
  };

  const videoConf = {
    title:   isTr ? "Video Konferans"            : "Video Conferencing",
    desc:    isTr
      ? "Toplantı odası ekipmanları, PTZ kameralar, mikrofon dizileri ve akıllı ekranlar dahil kurumsal video konferans çözümleri."
      : "Enterprise video conferencing solutions including meeting room equipment, PTZ cameras, microphone arrays and interactive displays.",
    features: isTr
      ? ["Zoom/Teams Entegrasyonu", "PTZ Kamera Sistemleri", "Akıllı Toplantı Odaları"]
      : ["Zoom / Teams Integration", "PTZ Camera Systems", "Smart Meeting Rooms"],
  };

  const fiber = {
    title:   isTr ? "Fiber Optik Omurga Altyapısı" : "Fiber Optic Backbone Infrastructure",
    desc:    isTr
      ? "Bina içi ve kampüs genelinde yüksek bant genişliği gerektiren uygulamalar için tek modlu ve çok modlu fiber optik kablolama. Füzyon kaynak, OTDR testi ve belgelendirme ile eksiksiz teslimat."
      : "Single-mode and multimode fiber optic cabling for high-bandwidth applications across buildings and campuses. Complete delivery with fusion splicing, OTDR testing and full documentation.",
    tags: isTr
      ? ["Tek Modlu (OS2)", "Çok Modlu (OM3/OM4)", "Füzyon Kaynak", "OTDR Testi", "Kampüs Fiber Ağı", "FTTx Çözümleri"]
      : ["Single-Mode (OS2)", "Multimode (OM3/OM4)", "Fusion Splicing", "OTDR Testing", "Campus Fiber Network", "FTTx Solutions"],
  };

  const whyUs = {
    title:    isTr ? "Neden Lider Network?"  : "Why Lider Network?",
    features: isTr
      ? [
          "Proje öncesi sahada etüt ve ön fizibilite",
          "Yetkili markaların sertifikalı kurulum garantisi",
          "Test, devreye alma ve kullanıcı eğitimi dahil",
          "Bakım sözleşmesi ve 7/24 arıza desteği",
          "Tek iletişim noktası, çok sistemli yönetim",
        ]
      : [
          "On-site survey and feasibility study before the project",
          "Certified installation guarantee from authorised brands",
          "Testing, commissioning and user training included",
          "Maintenance contract and 24/7 breakdown support",
          "Single point of contact for multi-system management",
        ],
  };

  const cta = {
    title:   isTr ? "Projenizi Birlikte Tasarlayalım"                                            : "Let's Design Your Project Together",
    subtitle: isTr
      ? "Sahada etüt, teknik şartname ve fiyatlandırma için uzmanlarımızla iletişime geçin."
      : "Contact our experts for an on-site assessment, technical specification and pricing.",
    btn:     isTr ? "Ücretsiz Etüt Talep Et"   : "Request Free Assessment",
    or:      isTr ? "veya doğrudan:"            : "or directly:",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main style={{ backgroundColor: "var(--color-background)" }}>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center pt-24 overflow-hidden">
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1920&q=80"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
              style={{ opacity: 0.35 }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(5,5,5,0.6) 0%, rgba(5,5,5,0.85) 60%, rgba(5,5,5,1) 100%)",
              }}
            />
            <div className="absolute inset-0 circuit-bg opacity-20" aria-hidden="true" />
          </div>

          <div className="relative z-10 w-full px-5 lg:px-20 max-w-[1280px] mx-auto">
            <div className="max-w-3xl">
              {/* Live badge */}
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#10b981" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "#10b981" }} />
                </span>
                <span
                  className="uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-family-label)", fontSize: "12px", color: "var(--color-primary)" }}
                >
                  {isTr ? "Anahtar Teslim Zayıf Akım Projeleri" : "Turnkey Low Voltage Projects"}
                </span>
              </div>

              <h1
                className="text-5xl lg:text-7xl font-bold mb-8 leading-tight text-white"
                style={{ fontFamily: "var(--font-family-headline)", letterSpacing: "-0.02em" }}
              >
                {isTr ? (
                  <>Akıllı Binaların<br /><span style={{ color: "#0052ff" }}>Sinir Sistemi</span></>
                ) : (
                  <>The Nervous System<br /><span style={{ color: "#0052ff" }}>of Smart Buildings</span></>
                )}
              </h1>

              <p className="text-lg mb-10 max-w-2xl leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                {isTr
                  ? "Yapısal kablolama altyapısından güvenlik kameralarına, erişim kontrolden yangın algılamaya — modern yapıların tüm zayıf akım sistemlerini tek elden tasarlıyor, kuruyoruz ve servis ediyoruz."
                  : "From structured cabling to security cameras, from access control to fire detection — we design, install and service every low voltage system in modern buildings under one roof."}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href={`/${locale}/iletisim`} className="btn-brand-blue px-8 py-4 rounded-lg font-bold">
                  {isTr ? "Proje Teklifi Al" : "Get Project Quote"}
                </Link>
                <Link
                  href={`/${locale}/hizmetler`}
                  className="px-8 py-4 rounded-lg font-bold transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.2)", color: "white" }}
                >
                  {isTr ? "Tüm Hizmetler" : "All Services"}
                </Link>
              </div>

              {/* Stats strip */}
              <div className="flex flex-wrap gap-10 mt-14 pt-10" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                {[
                  { value: "500+", label: isTr ? "Tamamlanan Proje"  : "Completed Projects" },
                  { value: "15+",  label: isTr ? "Yıllık Tecrübe"    : "Years Experience"   },
                  { value: "7/24", label: isTr ? "Teknik Servis"     : "Technical Service"  },
                  { value: "100%", label: isTr ? "Anahtar Teslim"    : "Turnkey Delivery"   },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-family-headline)" }}>{value}</p>
                    <p className="text-xs uppercase tracking-widest mt-1 opacity-50" style={{ fontFamily: "var(--font-family-label)" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SERVICES BENTO GRID ───────────────────────────────────────── */}
        <section className="py-24 px-5 lg:px-20 max-w-[1280px] mx-auto">
          <div className="text-center mb-20">
            <h2
              className="text-4xl lg:text-5xl font-semibold mb-4"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              {isTr ? "Zayıf Akım Hizmetlerimiz" : "Our Low Voltage Services"}
            </h2>
            <div className="h-1 w-24 mx-auto" style={{ backgroundColor: "var(--color-primary)" }} />
            <p className="mt-6 text-lg max-w-xl mx-auto leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
              {isTr
                ? "Her sistem birbiriyle entegre çalışacak şekilde tasarlanır; bakımı ve yönetimi de dahil olmak üzere tam destek sağlarız."
                : "Every system is designed to work seamlessly with the others — we provide full support including ongoing maintenance and management."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* ── Structured Cabling — col-8 ── */}
            <div
              className="md:col-span-8 group relative overflow-hidden industrial-border p-10 rounded-2xl transition-all duration-500 hover:border-primary/50"
              style={{ backgroundColor: "rgba(18,18,20,0.9)", backdropFilter: "blur(12px)" }}
            >
              <div className="flex flex-col lg:flex-row gap-10 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-5" style={{ color: "var(--color-primary)" }}>
                    <Network className="w-5 h-5" />
                    <span className="uppercase tracking-widest" style={{ fontFamily: "var(--font-family-label)", fontSize: "12px" }}>
                      {cabling.badge}
                    </span>
                  </div>
                  <h3 className="text-3xl font-semibold mb-4 text-white" style={{ fontFamily: "var(--font-family-headline)" }}>
                    {cabling.title}
                  </h3>
                  <p className="mb-6 leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                    {cabling.desc}
                  </p>
                  <ul className="space-y-3">
                    {cabling.features.map((item) => (
                      <li key={item} className="flex items-center gap-3" style={{ color: "var(--color-on-surface)" }}>
                        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--color-primary)" }} />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="lg:w-56 w-full h-48 rounded-xl overflow-hidden industrial-border shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80"
                    alt={isTr ? "Yapısal Kablolama" : "Structured Cabling"}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
              </div>
            </div>

            {/* ── IP Camera — col-4 ── */}
            <div
              className="md:col-span-4 relative overflow-hidden rounded-2xl industrial-border group transition-all duration-500 hover:border-primary/50"
              style={{ backgroundColor: "rgba(18,18,20,0.9)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80"
                alt={isTr ? "Güvenlik Kamerası" : "Security Camera"}
                className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-500"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(5,5,5,0.98) 40%, rgba(5,5,5,0.4) 100%)" }} />
              <div className="relative z-10 p-8 h-full flex flex-col justify-end min-h-[280px]">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "rgba(0,82,255,0.2)", border: "1px solid rgba(0,82,255,0.3)" }}
                >
                  <Camera className="w-6 h-6" style={{ color: "var(--color-primary)" }} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white" style={{ fontFamily: "var(--font-family-headline)" }}>
                  {camera.title}
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-on-surface-variant)" }}>
                  {camera.desc}
                </p>
                <Link href={`/${locale}/iletisim`} className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
                  {camera.cta}
                </Link>
              </div>
            </div>

            {/* ── Access Control — col-4 ── */}
            <div
              className="md:col-span-4 industrial-border p-8 rounded-2xl hover:border-primary/50 transition-all duration-500"
              style={{ backgroundColor: "rgba(18,18,20,0.9)", backdropFilter: "blur(12px)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: "rgba(0,82,255,0.15)", border: "1px solid rgba(0,82,255,0.25)" }}
              >
                <Lock className="w-6 h-6" style={{ color: "var(--color-primary)" }} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white" style={{ fontFamily: "var(--font-family-headline)" }}>
                {access.title}
              </h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--color-on-surface-variant)" }}>
                {access.desc}
              </p>
              <ul className="space-y-2">
                {access.features.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs" style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-family-label)" }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--color-primary)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Fire Detection — col-4 ── */}
            <div
              className="md:col-span-4 p-8 rounded-2xl transition-all duration-500 relative overflow-hidden"
              style={{ backgroundColor: "#1a0800" }}
            >
              <div
                className="absolute inset-0 opacity-10"
                aria-hidden="true"
                style={{ background: "radial-gradient(circle at top right, rgba(255,94,7,0.8), transparent 60%)" }}
              />
              <div className="relative z-10">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: "rgba(255,94,7,0.2)", border: "1px solid rgba(255,94,7,0.3)" }}
                >
                  <Flame className="w-6 h-6" style={{ color: "#ff5e07" }} />
                </div>
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold mb-4"
                  style={{ backgroundColor: "rgba(255,94,7,0.15)", color: "#ff5e07", fontFamily: "var(--font-family-label)" }}
                >
                  {fire.badge}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white" style={{ fontFamily: "var(--font-family-headline)" }}>
                  {fire.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {fire.desc}
                </p>
              </div>
            </div>

            {/* ── PA / Audio — col-4 ── */}
            <div
              className="md:col-span-4 industrial-border p-8 rounded-2xl hover:border-primary/50 transition-all duration-500"
              style={{ backgroundColor: "rgba(18,18,20,0.9)", backdropFilter: "blur(12px)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: "rgba(0,82,255,0.15)", border: "1px solid rgba(0,82,255,0.25)" }}
              >
                <Volume2 className="w-6 h-6" style={{ color: "var(--color-primary)" }} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white" style={{ fontFamily: "var(--font-family-headline)" }}>
                {audio.title}
              </h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--color-on-surface-variant)" }}>
                {audio.desc}
              </p>
              <ul className="space-y-2">
                {audio.features.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs" style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-family-label)" }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--color-primary)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Building Automation — col-8 ── */}
            <div
              className="md:col-span-8 industrial-border p-10 rounded-2xl hover:border-primary/50 transition-all duration-500 relative overflow-hidden"
              style={{ backgroundColor: "rgba(18,18,20,0.9)", backdropFilter: "blur(12px)" }}
            >
              <div
                className="absolute right-0 top-0 opacity-5 pointer-events-none"
                aria-hidden="true"
                style={{ transform: "translate(30%, -20%)" }}
              >
                <Building2 style={{ width: "280px", height: "280px" }} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4" style={{ color: "var(--color-primary)" }}>
                  <Building2 className="w-5 h-5" />
                  <span className="uppercase tracking-widest" style={{ fontFamily: "var(--font-family-label)", fontSize: "12px" }}>
                    {bms.badge}
                  </span>
                </div>
                <h3 className="text-3xl font-semibold mb-4 text-white" style={{ fontFamily: "var(--font-family-headline)" }}>
                  {bms.title}
                </h3>
                <p className="mb-8 leading-relaxed max-w-lg" style={{ color: "var(--color-on-surface-variant)" }}>
                  {bms.desc}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {bms.metrics.map(({ value, label }) => (
                    <div key={label} className="p-4 rounded-xl industrial-border text-center" style={{ backgroundColor: "var(--color-surface)" }}>
                      <p className="font-bold text-lg mb-1" style={{ color: "var(--color-primary)" }}>{value}</p>
                      <p className="text-xs uppercase tracking-widest opacity-60" style={{ fontFamily: "var(--font-family-label)" }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Video Conferencing — col-4 ── */}
            <div
              className="md:col-span-4 industrial-border p-8 rounded-2xl hover:border-primary/50 transition-all duration-500"
              style={{ backgroundColor: "#0052ff" }}
            >
              <Video className="w-10 h-10 mb-6 text-white" />
              <h3 className="text-xl font-semibold mb-3 text-white" style={{ fontFamily: "var(--font-family-headline)" }}>
                {videoConf.title}
              </h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.85)" }}>
                {videoConf.desc}
              </p>
              <ul className="space-y-2">
                {videoConf.features.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs font-medium text-white" style={{ fontFamily: "var(--font-family-label)" }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-white opacity-70" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Fiber Optic — col-8 ── */}
            <div
              className="md:col-span-8 industrial-border p-10 rounded-2xl hover:border-primary/50 transition-all duration-500"
              style={{ backgroundColor: "rgba(18,18,20,0.9)", backdropFilter: "blur(12px)" }}
            >
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(0,82,255,0.15)", border: "1px solid rgba(0,82,255,0.25)" }}
                >
                  <Zap className="w-8 h-8" style={{ color: "var(--color-primary)" }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3 text-white" style={{ fontFamily: "var(--font-family-headline)" }}>
                    {fiber.title}
                  </h3>
                  <p className="leading-relaxed mb-6" style={{ color: "var(--color-on-surface-variant)" }}>
                    {fiber.desc}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {fiber.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded text-xs font-semibold"
                        style={{
                          backgroundColor: "rgba(0,82,255,0.12)",
                          color: "var(--color-primary)",
                          border: "1px solid rgba(0,82,255,0.2)",
                          fontFamily: "var(--font-family-label)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Why Lider Network — col-4 ── */}
            <div
              className="md:col-span-4 industrial-border p-8 rounded-2xl hover:border-primary/50 transition-all duration-500"
              style={{ backgroundColor: "rgba(18,18,20,0.9)", backdropFilter: "blur(12px)" }}
            >
              <Shield className="w-8 h-8 mb-6" style={{ color: "var(--color-primary)" }} />
              <h3 className="text-xl font-semibold mb-4 text-white" style={{ fontFamily: "var(--font-family-headline)" }}>
                {whyUs.title}
              </h3>
              <ul className="space-y-4">
                {whyUs.features.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--color-primary)" }} />
                    <span className="text-sm leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="py-16 px-5 lg:px-20 relative overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,82,255,0.07)" }} />
          <div className="max-w-[1280px] mx-auto relative z-10">
            <div
              className="industrial-border p-12 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-10"
              style={{ backgroundColor: "rgba(18,18,20,0.85)", backdropFilter: "blur(12px)" }}
            >
              <div className="text-center md:text-left">
                <h2 className="text-4xl font-semibold mb-4" style={{ fontFamily: "var(--font-family-headline)" }}>
                  {cta.title}
                </h2>
                <p className="text-lg" style={{ color: "var(--color-on-surface-variant)" }}>
                  {cta.subtitle}
                </p>
              </div>
              <div className="flex flex-col items-center gap-4 shrink-0">
                <Link
                  href={`/${locale}/iletisim`}
                  className="px-10 py-5 rounded-lg font-bold text-lg transition-all text-white whitespace-nowrap"
                  style={{ backgroundColor: "#ff5e07", boxShadow: "0 0 30px rgba(255,92,0,0.3)" }}
                >
                  {cta.btn}
                </Link>
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                  <span>{cta.or}</span>
                  <a href="mailto:satis@lidernetwork.com.tr" className="flex items-center gap-1.5 font-medium hover:opacity-80 transition-opacity" style={{ color: "var(--color-primary)" }}>
                    <Mail className="w-4 h-4" />
                    satis@lidernetwork.com.tr
                  </a>
                  <span style={{ color: "var(--color-outline)" }}>·</span>
                  <a href="mailto:sales@lidernetwork.com.tr" className="flex items-center gap-1.5 font-medium hover:opacity-80 transition-opacity" style={{ color: "var(--color-primary)" }}>
                    <Mail className="w-4 h-4" />
                    sales@lidernetwork.com.tr
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
