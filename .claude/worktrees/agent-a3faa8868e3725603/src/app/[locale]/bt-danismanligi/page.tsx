import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, ShieldCheck, TrendingUp, GitMerge, Mail, CheckCircle2, FileText, Phone, Wifi, Globe, Cpu, Wrench, Activity, Key } from "lucide-react";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "BT Danışmanlığı | Stratejik Teknoloji Planlaması - Lider Network",
    description:
      "Lider Network BT danışmanlığı: stratejik teknoloji planlaması, altyapı denetimi, dijital dönüşüm, ISO 27001 uyumluluk ve KVKK süreçleri. Fortinet, Synology sertifikalı uzman ekip.",
    keywords: [
      "BT danışmanlığı",
      "stratejik teknoloji planlaması",
      "dijital dönüşüm",
      "altyapı denetimi",
      "IT danışmanlık",
      "ISO 27001",
      "KVKK danışmanlık",
      "teknoloji yol haritası",
      "IT proje yönetimi",
      "kurumsal BT",
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/bt-danismanligi`,
      languages: {
        tr: `${baseUrl}/tr/bt-danismanligi`,
        en: `${baseUrl}/en/bt-danismanligi`,
      },
    },
    openGraph: {
      title: "BT Danışmanlığı | Lider Network",
      description:
        "Dijital dönüşüm yolculuğunuzda stratejik teknoloji planlaması ve profesyonel BT denetimi ile kurumunuzun teknolojik otoritesini güçlendiriyoruz.",
      url: `${baseUrl}/${locale}/bt-danismanligi`,
    },
  };
}

export default async function BtDanismanligiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "BT Danışmanlığı",
    provider: {
      "@type": "Organization",
      name: "Lider Network Teknoloji",
      url: baseUrl,
    },
    description:
      "Stratejik teknoloji planlaması, altyapı denetimi ve dijital dönüşüm destek hizmetleri.",
    areaServed: "TR",
    serviceType: "IT Consulting",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="pt-24" style={{ backgroundColor: "var(--color-background)" }}>
        {/* Hero Section */}
        <section
          className="relative min-h-[85vh] flex items-center px-5 lg:px-20 overflow-hidden"
        >
          <div
            className="absolute inset-0 z-0 opacity-20"
            aria-hidden="true"
          >
            <div className="absolute inset-0 circuit-pattern" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, var(--color-background))",
              }}
            />
          </div>

          <div className="relative z-10 max-w-[1280px] mx-auto grid md:grid-cols-2 gap-6 items-center w-full">
            <div className="space-y-8">
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
                  className="uppercase tracking-widest"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontSize: "12px",
                    color: "var(--color-primary)",
                  }}
                >
                  Stratejik BT Danışmanlığı
                </span>
              </div>

              <h1
                className="text-5xl lg:text-7xl font-bold leading-none"
                style={{
                  fontFamily: "var(--font-family-headline)",
                  letterSpacing: "-0.02em",
                }}
              >
                Geleceğin Altyapısını{" "}
                <br />
                <span style={{ color: "var(--color-primary)" }}>
                  Bugünden Kurgulayın.
                </span>
              </h1>

              <p
                className="text-lg max-w-xl leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Lider Network, dijital dönüşüm yolculuğunuzda stratejik
                teknoloji planlaması ve profesyonel BT denetimi ile kurumunuzun
                teknolojik otoritesini güçlendirir.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href={`/${locale}/iletisim`}
                  className="btn-brand-blue px-8 py-4 rounded font-bold"
                >
                  Ücretsiz Denetim Başlat
                </Link>
                <Link
                  href={`/${locale}/hizmetler`}
                  className="px-8 py-4 rounded font-bold transition-all"
                  style={{
                    border: "1px solid rgba(141,144,162,0.3)",
                    color: "var(--color-on-surface)",
                  }}
                >
                  Çözümlerimizi İncele
                </Link>
              </div>
            </div>

            <div className="hidden md:block relative">
              <div
                className="p-2 rounded-xl overflow-hidden shadow-2xl aspect-video industrial-border"
                style={{ backgroundColor: "rgba(29,32,34,0.6)", backdropFilter: "blur(12px)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80"
                  alt="BT Danışmanlık Ekibi"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div
                className="absolute -bottom-8 -left-8 p-6 rounded-lg industrial-border max-w-[200px]"
                style={{
                  backgroundColor: "rgba(29,32,34,0.8)",
                  backdropFilter: "blur(12px)",
                  borderColor: "rgba(183,196,255,0.3)",
                }}
              >
                <p
                  className="text-4xl font-bold leading-none"
                  style={{ color: "var(--color-primary)" }}
                >
                  15+
                </p>
                <p
                  className="mt-2 uppercase tracking-widest text-xs"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    color: "var(--color-on-surface-variant)",
                  }}
                >
                  Yıllık Sektörel Tecrübe ve Otorite
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Strategic Roadmap Bento Grid */}
        <section
          className="py-24"
          style={{ backgroundColor: "rgba(29,32,34,0.3)" }}
        >
          <div className="max-w-[1280px] mx-auto px-5 lg:px-20">
            <div className="mb-16 text-center max-w-2xl mx-auto">
              <h2
                className="text-4xl font-semibold mb-4"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Stratejik Yol Haritası
              </h2>
              <p style={{ color: "var(--color-on-surface-variant)" }}>
                Teknolojiyi bir maliyet kalemi olmaktan çıkarıp, işinizi
                büyüten stratejik bir avantaja dönüştürüyoruz.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* BT Denetimi - col-8 */}
              <div
                className="md:col-span-8 industrial-border p-8 rounded-xl flex flex-col justify-between group hover:border-primary/50 transition-all duration-300"
                style={{ backgroundColor: "rgba(29,32,34,0.6)", backdropFilter: "blur(12px)" }}
              >
                <div>
                  <ShieldCheck
                    className="w-10 h-10 mb-6"
                    style={{ color: "var(--color-primary)" }}
                  />
                  <h3
                    className="text-2xl font-semibold mb-4"
                    style={{ fontFamily: "var(--font-family-headline)" }}
                  >
                    BT Sağlık ve Güvenlik Denetimi
                  </h3>
                  <p
                    className="max-w-lg leading-relaxed"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    Mevcut altyapınızdaki zafiyetleri, performans darboğazlarını
                    ve uyumluluk açıklarını derinlemesine analiz ediyor, çözüm
                    odaklı raporlar sunuyoruz.
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <ul className="space-y-2">
                    {["KVKK ve ISO 27001 Uyumluluğu", "Sızma Testleri ve Analiz"].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2"
                        style={{
                          fontFamily: "var(--font-family-label)",
                          fontSize: "12px",
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: "var(--color-primary)" }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <span style={{ color: "var(--color-outline)" }}>→</span>
                </div>
              </div>

              {/* Altyapı Optimizasyonu - col-4 */}
              <div
                className="md:col-span-4 p-8 rounded-xl flex flex-col justify-center"
                style={{ backgroundColor: "#0052ff" }}
              >
                <TrendingUp className="w-10 h-10 mb-4 text-white" />
                <h3
                  className="text-2xl font-semibold mb-4 text-white"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  Altyapı Optimizasyonu
                </h3>
                <p className="leading-relaxed" style={{ color: "rgba(255,255,255,0.9)" }}>
                  Performans kaybı yaşamadan kaynaklarınızı verimli kullanmanızı
                  sağlayan mimari tasarımlar.
                </p>
              </div>

              {/* Proje Yönetimi - col-4 */}
              <div
                className="md:col-span-4 industrial-border p-8 rounded-xl hover:border-primary/30 transition-all"
                style={{ backgroundColor: "rgba(29,32,34,0.6)", backdropFilter: "blur(12px)" }}
              >
                <GitMerge
                  className="w-10 h-10 mb-4"
                  style={{ color: "var(--color-secondary)" }}
                />
                <h3
                  className="text-2xl font-semibold mb-4"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  Proje Yönetimi
                </h3>
                <p style={{ color: "var(--color-on-surface-variant)" }}>
                  Karmaşık BT projelerini zamanında ve bütçe dahilinde yöneterek
                  riskleri minimize ediyoruz.
                </p>
              </div>

              {/* Sertifikalı Uzman - col-8 */}
              <div className="md:col-span-8 relative overflow-hidden rounded-xl industrial-border group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80"
                  alt="Sertifikalı Uzman Kadro"
                  className="absolute inset-0 w-full h-full object-cover brightness-50 group-hover:scale-105 transition-transform duration-700"
                />
                <div
                  className="relative z-10 p-8 h-full flex flex-col justify-end min-h-[300px]"
                  style={{
                    background:
                      "linear-gradient(to top, var(--color-background), rgba(16,20,21,0.4), transparent)",
                  }}
                >
                  <h3
                    className="text-2xl font-semibold mb-2"
                    style={{ fontFamily: "var(--font-family-headline)" }}
                  >
                    Sertifikalı Uzman Kadro
                  </h3>
                  <p
                    className="max-w-md leading-relaxed"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    Fortigate, Synology ve Microsoft sertifikalı mühendislerimizle
                    her ölçekteki işletme için global standartlarda danışmanlık
                    sağlıyoruz.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Sözleşmeli Bakım Hizmeti ──────────────────────────────── */}
        <section className="py-24 px-5 lg:px-20">
          <div className="max-w-[1280px] mx-auto">

            {/* Section header */}
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                style={{
                  backgroundColor: "rgba(0,82,255,0.1)",
                  border: "1px solid rgba(0,82,255,0.2)",
                }}
              >
                <FileText className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                <span
                  className="uppercase tracking-widest text-xs font-semibold"
                  style={{ fontFamily: "var(--font-family-label)", color: "var(--color-primary)" }}
                >
                  Sözleşmeli BT Hizmeti
                </span>
              </div>
              <h2
                className="text-4xl lg:text-5xl font-semibold mb-4"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Bilgisayar Bakım Anlaşması
              </h2>
              <p className="text-lg leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                Kurumunuzun BT altyapısını reaktif değil, <strong className="text-white">proaktif</strong> bir
                yaklaşımla yönetiyoruz. Anlaşmalı müşterilerimizin sistemleri
                hiç durmadan çalışır.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">

              {/* ── Sol: %90 stat + açıklama ── */}
              <div
                className="lg:col-span-2 rounded-2xl p-10 flex flex-col justify-between relative overflow-hidden"
                style={{ backgroundColor: "#0052ff" }}
              >
                {/* Dekoratif arka plan */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  aria-hidden="true"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
                    backgroundSize: "20px 20px",
                  }}
                />
                <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full pointer-events-none" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />
                <div className="absolute -left-8 -bottom-8 w-36 h-36 rounded-full pointer-events-none" style={{ backgroundColor: "rgba(0,0,0,0.15)" }} />

                <div className="relative z-10">
                  <p
                    className="text-8xl font-bold text-white leading-none mb-2"
                    style={{ fontFamily: "var(--font-family-headline)" }}
                  >
                    %90
                  </p>
                  <p
                    className="text-lg font-semibold text-white mb-4 leading-snug"
                  >
                    müşterimiz uzun vadeli bakım anlaşması ile çalışmaktadır.
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.75)", lineHeight: "1.7" }}>
                    Sözleşmeli modelin tercih edilmesinin sebebi basit: sistemler
                    daha az arızalanır, sorunlar oluşmadan önlenir, maliyet
                    öngörülebilir ve sabit kalır.
                  </p>
                </div>

                <div className="relative z-10 mt-10 grid grid-cols-2 gap-4">
                  {[
                    { value: "7/24", label: "Kesintisiz İzleme" },
                    { value: "15+", label: "Yıllık Tecrübe" },
                  ].map(({ value, label }) => (
                    <div
                      key={label}
                      className="rounded-xl p-4"
                      style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                    >
                      <p className="text-2xl font-bold text-white">{value}</p>
                      <p
                        className="text-xs uppercase tracking-widest mt-1"
                        style={{ color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-family-label)" }}
                      >
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Sağ: hizmet listesi ── */}
              <div
                className="lg:col-span-3 rounded-2xl p-8 lg:p-10 industrial-border flex flex-col justify-between"
                style={{ backgroundColor: "rgba(29,32,34,0.6)", backdropFilter: "blur(12px)" }}
              >
                <div>
                  <h3
                    className="text-2xl font-semibold mb-8"
                    style={{ fontFamily: "var(--font-family-headline)" }}
                  >
                    Anlaşma Kapsamındaki Hizmetler
                  </h3>

                  <ul className="space-y-5">
                    {[
                      {
                        icon: ShieldCheck,
                        text: "Bilişim teknolojileri alanında stratejik danışmanlık hizmetleri",
                      },
                      {
                        icon: Wrench,
                        text: "Network sisteminin, bilgisayarların ve çevre birimlerin periyodik bakımları",
                      },
                      {
                        icon: Activity,
                        text: "Sistemin günlük olarak izlenerek kontrol altında tutulması ve raporlama",
                      },
                      {
                        icon: Cpu,
                        text: "Operasyonel iş akışını olumsuz etkileyen tüm yazılım ve donanım sorunlarının çözümü",
                      },
                      {
                        icon: Key,
                        text: "Kullanılan yazılımların kurumsal lisanslama işlemleri",
                      },
                      {
                        icon: Wifi,
                        text: "Olası network sorunlarının giderilmesi ve kesintisiz ağ sürekliliği",
                      },
                      {
                        icon: Globe,
                        text: "İnternet üzerinden sınırsız uzaktan destek ve servis hizmetleri",
                      },
                      {
                        icon: Phone,
                        text: "Telefon ile sınırsız teknik destek hizmetleri",
                      },
                    ].map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-start gap-4">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: "rgba(0,82,255,0.12)", border: "1px solid rgba(0,82,255,0.2)" }}
                        >
                          <Icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} aria-hidden="true" />
                        </div>
                        <span
                          className="text-sm leading-relaxed pt-1.5"
                          style={{ color: "var(--color-on-surface-variant)" }}
                        >
                          {text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-10 pt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ borderTop: "1px solid var(--color-outline-variant)" }}>
                  <Link
                    href={`/${locale}/iletisim`}
                    className="btn-brand-blue px-8 py-3.5 rounded-lg font-bold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Bakım Anlaşması Teklifi Al
                  </Link>
                  <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                    Fiyatlandırma firma büyüklüğüne ve cihaz sayısına göre belirlenir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-5 lg:px-20 text-center">
          <div
            className="max-w-[1280px] mx-auto industrial-border p-16 rounded-2xl relative overflow-hidden"
            style={{ backgroundColor: "rgba(29,32,34,0.6)", backdropFilter: "blur(12px)" }}
          >
            <div
              className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"
              aria-hidden="true"
            >
              <BarChart3 style={{ width: "120px", height: "120px" }} />
            </div>
            <h2
              className="text-4xl font-semibold mb-6"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Altyapınızı Güvence Altına Alın
            </h2>
            <p
              className="text-lg mb-10 leading-relaxed max-w-2xl mx-auto"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Siber tehditler beklemez. Bugün alacağınız stratejik bir karar,
              yarının felaketlerini engelleyebilir. Uzmanlarımızla bir ön
              görüşme planlayın.
            </p>
            <Link
              href={`/${locale}/iletisim`}
              className="inline-block px-10 py-5 rounded-lg font-bold text-lg transition-transform hover:scale-105 text-white"
              style={{
                backgroundColor: "#ff5e07",
                boxShadow: "0 10px 20px rgba(255,94,7,0.2)",
              }}
            >
              Acil BT Denetimi Talep Et
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8 text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
              <span>veya e-posta ile ulaşın:</span>
              <a href="mailto:info@lidernetwork.com.tr" className="flex items-center gap-1.5 font-medium transition-colors hover:opacity-80" style={{ color: "var(--color-primary)" }}>
                <Mail className="w-4 h-4" />
                info@lidernetwork.com.tr
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
