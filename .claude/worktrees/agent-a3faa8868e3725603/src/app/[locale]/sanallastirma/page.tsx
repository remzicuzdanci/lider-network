import type { Metadata } from "next";
import Link from "next/link";
import { Server, Monitor, BarChart3, Zap, Mail } from "lucide-react";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Sanallaştırma Çözümleri | VMware, Hyper-V, VDI - Lider Network",
    description:
      "Lider Network sanallaştırma hizmetleri: VMware vSphere, Proxmox, Microsoft Hyper-V sunucu sanallaştırma, VDI masaüstü sanallaştırma. Donanım maliyetlerini %60'a kadar düşürün.",
    keywords: [
      "sanallaştırma",
      "VMware vSphere",
      "Hyper-V",
      "Proxmox",
      "VDI",
      "sunucu sanallaştırma",
      "masaüstü sanallaştırma",
      "uygulama sanallaştırma",
      "altyapı maliyeti",
      "hypervisor",
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/sanallastirma`,
      languages: {
        tr: `${baseUrl}/tr/sanallastirma`,
        en: `${baseUrl}/en/sanallastirma`,
      },
    },
    openGraph: {
      title: "Sanallaştırma Çözümleri | VMware & Hyper-V - Lider Network",
      description:
        "Veri merkezinizi modern, yazılım tanımlı bir altyapıya dönüştürün. Sunucu, masaüstü ve uygulama sanallaştırma ile kaynaklarınızı %100 verimlilikle yönetin.",
      url: `${baseUrl}/${locale}/sanallastirma`,
    },
  };
}

export default async function SanallastirmaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Sanallaştırma Çözümleri",
    provider: {
      "@type": "Organization",
      name: "Lider Network Teknoloji",
      url: baseUrl,
    },
    description:
      "Sunucu, masaüstü ve uygulama sanallaştırma çözümleriyle altyapı maliyetlerini düşürün.",
    areaServed: "TR",
    serviceType: "Virtualization",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main
        className="circuit-bg pt-24"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center px-5 lg:px-20 overflow-hidden">
          <div className="max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-center z-10">
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
                  Geleceğin Altyapısı
                </span>
              </div>

              <h1
                className="text-5xl lg:text-7xl font-bold leading-none"
                style={{
                  fontFamily: "var(--font-family-headline)",
                  letterSpacing: "-0.02em",
                }}
              >
                Lider Network
                <br />
                <span style={{ color: "var(--color-primary)" }}>
                  Sanallaştırma
                </span>
              </h1>

              <p
                className="text-lg max-w-xl leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Veri merkezinizi modern, yazılım tanımlı bir altyapıya
                dönüştürün. Sunucu, masaüstü ve uygulama sanallaştırma ile
                kaynaklarınızı %100 verimlilikle yönetin.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href={`/${locale}/iletisim`}
                  className="btn-brand-blue px-8 py-4 rounded font-bold transition-all"
                >
                  Çözümleri Keşfedin
                </Link>
                <Link
                  href={`/${locale}/hizmetler`}
                  className="px-8 py-4 rounded font-bold transition-all"
                  style={{
                    border: "1px solid rgba(141,144,162,0.3)",
                    color: "var(--color-on-surface)",
                  }}
                >
                  Teknik Dokümantasyon
                </Link>
              </div>
            </div>

            {/* Server Rack Image */}
            <div className="relative hidden lg:block">
              <div
                className="absolute -inset-10 rounded-full pointer-events-none"
                style={{
                  backgroundColor: "rgba(183,196,255,0.2)",
                  filter: "blur(120px)",
                }}
              />
              <div
                className="p-4 rounded-xl industrial-border relative overflow-hidden"
                style={{
                  backgroundColor: "rgba(29,32,34,0.6)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 0 30px rgba(0,82,255,0.15)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1597852074816-d933c7d2b988?auto=format&fit=crop&w=800&q=80"
                  alt="Sunucu Rafı Sanallaştırma"
                  className="rounded-lg opacity-80 grayscale hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div
                className="absolute -bottom-6 -left-6 p-6 rounded-lg industrial-border max-w-[200px]"
                style={{
                  backgroundColor: "rgba(29,32,34,0.8)",
                  backdropFilter: "blur(12px)",
                  borderColor: "rgba(0,82,255,0.3)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap
                    className="w-5 h-5"
                    style={{ color: "var(--color-primary)" }}
                  />
                  <span
                    className="uppercase font-bold tracking-tighter"
                    style={{
                      fontFamily: "var(--font-family-label)",
                      fontSize: "11px",
                      color: "var(--color-primary)",
                    }}
                  >
                    Performans
                  </span>
                </div>
                <div className="text-2xl font-black">99.9%</div>
                <div
                  className="text-xs"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Çalışma Süresi Garantisi
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Virtualization Layers Bento Grid */}
        <section className="py-24 px-5 lg:px-20 max-w-[1280px] mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-semibold mb-4"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Sanallaştırma Katmanları
            </h2>
            <div
              className="w-24 h-1 mx-auto"
              style={{ backgroundColor: "var(--color-primary)" }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Sunucu Sanallaştırma - col-8 */}
            <div
              className="md:col-span-8 industrial-border p-8 rounded-xl group hover:border-primary/50 transition-all duration-500 relative overflow-hidden"
              style={{
                backgroundColor: "rgba(18,18,20,0.8)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"
                aria-hidden="true"
              >
                <Server style={{ width: "120px", height: "120px" }} />
              </div>
              <div className="relative z-10">
                <div
                  className="w-12 h-12 flex items-center justify-center rounded mb-6 border"
                  style={{
                    backgroundColor: "rgba(183,196,255,0.1)",
                    borderColor: "rgba(183,196,255,0.2)",
                  }}
                >
                  <Server
                    className="w-6 h-6"
                    style={{ color: "var(--color-primary)" }}
                  />
                </div>
                <h3
                  className="text-2xl font-semibold mb-4"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  Sunucu Sanallaştırma
                </h3>
                <p
                  className="max-w-2xl mb-8 leading-relaxed"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Donanım maliyetlerini %60&apos;a varan oranlarda düşürün.
                  VMware vSphere ve Microsoft Hyper-V çözümlerimizle iş
                  yüklerinizi dinamik olarak ölçeklendirin. Yüksek
                  erişilebilirlik (HA) ve felaket kurtarma senaryoları ile iş
                  sürekliliğini en üst seviyeye taşıyın.
                </p>
                <div className="flex gap-4">
                  {["vSphere", "Proxmox", "Hyper-V"].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded text-xs font-bold uppercase tracking-widest"
                      style={{
                        backgroundColor: "var(--color-surface-high)",
                        color: "var(--color-on-surface-variant)",
                        border: "1px solid rgba(141,144,162,0.3)",
                        fontFamily: "var(--font-family-label)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* VDI - col-4 */}
            <div
              className="md:col-span-4 industrial-border p-8 rounded-xl hover:bg-primary/5 transition-all duration-300"
              style={{
                backgroundColor: "rgba(18,18,20,0.8)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                className="w-12 h-12 flex items-center justify-center rounded mb-6 border"
                style={{
                  backgroundColor: "rgba(255,94,7,0.1)",
                  borderColor: "rgba(255,94,7,0.2)",
                }}
              >
                <Monitor className="w-6 h-6" style={{ color: "#ff5e07" }} />
              </div>
              <h3
                className="text-2xl font-semibold mb-4"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                VDI (Masaüstü)
              </h3>
              <p
                className="leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Personelinize dilediği yerden, dilediği cihazla güvenli erişim
                sağlayın. Merkezi yönetim ile güvenlik açıklarını kapatın ve IT
                operasyonlarını basitleştirin.
              </p>
              <div
                className="mt-8 pt-8"
                style={{ borderTop: "1px solid rgba(141,144,162,0.3)" }}
              >
                <Link
                  href={`/${locale}/iletisim`}
                  className="flex items-center gap-2 font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  Detaylı İncele →
                </Link>
              </div>
            </div>

            {/* Kaynak Verimliliği - col-4 */}
            <div
              className="md:col-span-4 industrial-border p-8 rounded-xl flex flex-col justify-between"
              style={{
                backgroundColor: "rgba(18,18,20,0.8)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div>
                <div
                  className="w-12 h-12 flex items-center justify-center rounded mb-6 border"
                  style={{
                    backgroundColor: "rgba(183,196,255,0.1)",
                    borderColor: "rgba(183,196,255,0.2)",
                  }}
                >
                  <BarChart3
                    className="w-6 h-6"
                    style={{ color: "var(--color-primary)" }}
                  />
                </div>
                <h3
                  className="text-2xl font-semibold mb-4"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  Kaynak Verimliliği
                </h3>
                <p style={{ color: "var(--color-on-surface-variant)" }}>
                  Atıl kapasiteyi minimize edin. CPU, RAM ve Depolama
                  kaynaklarını gerçek zamanlı analizlerle otomatik olarak
                  paylaştırın.
                </p>
              </div>
              <div className="mt-8">
                <div className="space-y-3">
                  {[
                    { label: "CPU Kullanımı", pct: 78 },
                    { label: "RAM Verimliliği", pct: 85 },
                    { label: "Depolama Tasarrufu", pct: 60 },
                  ].map(({ label, pct }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1 uppercase font-bold"
                        style={{
                          fontFamily: "var(--font-family-label)",
                          color: "var(--color-on-surface-variant)",
                        }}
                      >
                        <span>{label}</span>
                        <span style={{ color: "var(--color-primary)" }}>{pct}%</span>
                      </div>
                      <div
                        className="h-1 w-full rounded-full overflow-hidden"
                        style={{ backgroundColor: "rgba(141,144,162,0.2)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: "var(--color-primary)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Benefits - col-8 */}
            <div
              className="md:col-span-8 industrial-border p-8 rounded-xl"
              style={{
                backgroundColor: "rgba(18,18,20,0.8)",
                backdropFilter: "blur(12px)",
              }}
            >
              <h3
                className="text-2xl font-semibold mb-8"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Sanallaştırmanın Avantajları
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Zap, title: "%60 Maliyet Azalması", desc: "Fiziksel sunucu sayısını dramatik biçimde düşürün" },
                  { icon: Server, title: "Yüksek Erişilebilirlik", desc: "HA clustering ile kesintisiz hizmet garantisi" },
                  { icon: BarChart3, title: "Anlık Ölçeklendirme", desc: "İş yüküne göre dinamik kaynak tahsisi" },
                  { icon: Monitor, title: "Hızlı Kurtarma", desc: "Snapshot ve clone ile dakikalar içinde geri yükleme" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <Icon
                      className="w-6 h-6 mt-1 shrink-0"
                      style={{ color: "var(--color-primary)" }}
                    />
                    <div>
                      <h4 className="font-bold mb-1">{title}</h4>
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
          </div>
        </section>

        {/* Stats Bar */}
        <section
          className="py-16 border-y"
          style={{
            backgroundColor: "#0b0f10",
            borderColor: "rgba(141,144,162,0.2)",
          }}
        >
          <div className="px-5 lg:px-20 max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "%60", label: "Donanım Maliyeti Azalması" },
              { value: "99.9%", label: "HA Uptime Garantisi" },
              { value: "15dk", label: "VM Klonlama Süresi" },
              { value: "3x", label: "Performans Artışı" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div
                  className="text-4xl font-bold mb-2"
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
                    fontSize: "11px",
                    color: "var(--color-on-surface-variant)",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-5 lg:px-20 max-w-[1280px] mx-auto text-center">
          <div
            className="industrial-border p-16 rounded-2xl relative overflow-hidden"
            style={{ backgroundColor: "#191c1e" }}
          >
            <div
              className="absolute inset-0 circuit-pattern opacity-5 pointer-events-none"
              aria-hidden="true"
            />
            <div className="relative z-10">
              <h2
                className="text-4xl font-semibold mb-6"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Altyapınızı Modernize Edin
              </h2>
              <p
                className="text-lg mb-10 max-w-2xl mx-auto leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Sanallaştırma ile donanım maliyetlerinizi düşürün, esnekliği
                artırın ve iş sürekliliğinizi güvence altına alın. Ücretsiz
                değerlendirme için bize ulaşın.
              </p>
              <Link
                href={`/${locale}/iletisim`}
                className="inline-block btn-brand-blue px-10 py-5 rounded-lg font-bold text-lg"
              >
                Ücretsiz Değerlendirme Al
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
