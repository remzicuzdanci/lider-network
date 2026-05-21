import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  ChevronRight,
  Server,
  Cloud,
  Wifi,
  Database,
  Camera,
  Network,
} from "lucide-react";
import { PartnerLogo } from "@/components/ui/PartnerLogo";

const baseUrl = "https://www.lidernetwork.com.tr";
const BLUE   = "#0052ff";
const FN_RED = "#EE3124";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";
  return {
    title: isTr
      ? "Çözüm Ortaklarımız | Lider Network — 6 Kategoride 35+ Teknoloji Partneri"
      : "Solution Partners | Lider Network — 35+ Technology Partners in 6 Categories",
    description: isTr
      ? "Fortinet, Cisco, Microsoft, VMware, Dell, HPE, Veeam, Synology ve daha fazlası. 6 teknoloji kategorisinde dünya liderlerinin çözümlerini sunuyoruz."
      : "Fortinet, Cisco, Microsoft, VMware, Dell, HPE, Veeam, Synology and more. World-leading solutions across 6 technology categories.",
    alternates: { canonical: `${baseUrl}/${locale}/cozum-ortaklarimiz` },
    openGraph: {
      title: isTr ? "Çözüm Ortaklarımız | Lider Network" : "Solution Partners | Lider Network",
      url: `${baseUrl}/${locale}/cozum-ortaklarimiz`,
    },
  };
}

/* ─── Teknoloji kategorileri ─────────────────────────────────────────────── */
const categories = [
  {
    id: "siber-guvenlik",
    title: "Siber Güvenlik",       titleEn: "Cybersecurity",
    icon: Shield,                  color: "#EE3124",
    desc: "NGFW, EDR, XDR, SIEM ve tehdit istihbaratı",
    descEn: "NGFW, EDR, XDR, SIEM and threat intelligence",
    partners: [
      { name: "Fortinet",    abbr: "FN",  slug: "fortinet",    color: "#EE3124" },
      { name: "Cisco",       abbr: "Csc", slug: "cisco",       color: "#1BA0D7" },
      { name: "Trend Micro", abbr: "TM",  slug: "trendmicro",  color: "#d71921" },
      { name: "ESET",        abbr: "ES",  slug: "eset",        color: "#52a827" },
      { name: "Bitdefender", abbr: "BD",  slug: "bitdefender", color: "#ed1c24" },
      { name: "CrowdStrike", abbr: "CS",  slug: "crowdstrike", color: "#e02020" },
      { name: "SentinelOne", abbr: "S1",  slug: "sentinelone", color: "#7e2beb" },
      { name: "Splunk",      abbr: "Sp",  slug: "splunk",      color: "#f58220" },
    ],
  },
  {
    id: "sunucu-veri-merkezi",
    title: "Sunucu & Veri Merkezi", titleEn: "Server & Data Center",
    icon: Server,                   color: "#2563eb",
    desc: "Rack sunucu, depolama ve hiperkonverge altyapı",
    descEn: "Rack servers, storage and hyperconverged infrastructure",
    partners: [
      { name: "Dell Technologies", abbr: "Dell", slug: "dell",        color: "#007db8" },
      { name: "HPE",               abbr: "HPE",  slug: "hpe",         color: "#00b388" },
      { name: "Lenovo",            abbr: "Lnv",  slug: "lenovo",      color: "#e2231a" },
      { name: "IBM",               abbr: "IBM",  slug: "ibm",         color: "#006699" },
      { name: "Supermicro",        abbr: "SMC",  slug: null,          color: "#cc0000" },
      { name: "Pure Storage",      abbr: "Pure", slug: null,          color: "#f07020" },
      { name: "NetApp",            abbr: "NtA",  slug: "netapp",      color: "#0067c5" },
    ],
  },
  {
    id: "cloud-sanallastirma",
    title: "Cloud & Sanallaştırma", titleEn: "Cloud & Virtualization",
    icon: Cloud,                     color: "#7c3aed",
    desc: "Hibrit bulut, hypervisor ve konteyner platformları",
    descEn: "Hybrid cloud, hypervisor and container platforms",
    partners: [
      { name: "Microsoft",           abbr: "MS",  slug: "microsoft",        color: "#737373" },
      { name: "VMware",              abbr: "VM",  slug: "vmware",           color: "#607cdc" },
      { name: "Citrix",              abbr: "Ctx", slug: "citrix",           color: "#1e4b91" },
      { name: "Nutanix",             abbr: "Ntx", slug: "nutanix",          color: "#024da1" },
      { name: "Amazon Web Services", abbr: "AWS", slug: "amazonwebservices",color: "#ff9900" },
      { name: "Google Cloud",        abbr: "GCP", slug: "googlecloud",      color: "#4285f4" },
      { name: "Microsoft Azure",     abbr: "Az",  slug: "microsoftazure",   color: "#0078d4" },
    ],
  },
  {
    id: "network-wireless",
    title: "Network & Wireless", titleEn: "Network & Wireless",
    icon: Wifi,                   color: "#0891b2",
    desc: "Kurumsal ağ, anahtarlama ve kablosuz çözümler",
    descEn: "Enterprise networking, switching and wireless solutions",
    partners: [
      { name: "Aruba Networks",   abbr: "Arb", slug: null,      color: "#f96302" },
      { name: "Juniper Networks", abbr: "Jnp", slug: null,      color: "#84b135" },
      { name: "Ruijie Networks",  abbr: "Rjc", slug: null,      color: "#e4001b" },
      { name: "Ruckus Networks",  abbr: "Rck", slug: null,      color: "#005eb8" },
      { name: "Ubiquiti",         abbr: "Ubq", slug: "ubiquiti",color: "#0559c9" },
    ],
  },
  {
    id: "yedekleme-veri-koruma",
    title: "Yedekleme & Veri Koruma", titleEn: "Backup & Data Protection",
    icon: Database,                    color: "#059669",
    desc: "Yedekleme, felaket kurtarma ve veri koruma",
    descEn: "Backup, disaster recovery and data protection",
    partners: [
      { name: "Veeam",     abbr: "Vem", slug: "veeam",    color: "#00b336" },
      { name: "Synology",  abbr: "Syn", slug: "synology", color: "#1c82ad" },
      { name: "Acronis",   abbr: "Acr", slug: "acronis",  color: "#ef2929" },
      { name: "Commvault", abbr: "Cmv", slug: null,       color: "#00539b" },
      { name: "Veritas",   abbr: "Vrt", slug: null,       color: "#c8a217" },
    ],
  },
  {
    id: "kamera-guvenlik",
    title: "Kamera & Fiziksel Güvenlik", titleEn: "Camera & Physical Security",
    icon: Camera,                         color: "#64748b",
    desc: "IP kamera, NVR, VMS ve erişim kontrolü",
    descEn: "IP camera, NVR, VMS and access control systems",
    partners: [
      { name: "Hikvision",           abbr: "Hkv", slug: null,    color: "#cc0000" },
      { name: "Dahua Technology",    abbr: "Dah", slug: null,    color: "#e63946" },
      { name: "Axis Communications", abbr: "Axs", slug: null,    color: "#003057" },
      { name: "Bosch Security",      abbr: "Bch", slug: "bosch", color: "#ea0016" },
    ],
  },
];

export default async function PartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isTr = locale === "tr";

  // Toplam partner sayısı
  const total = categories.reduce((s, c) => s + c.partners.length, 0);

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-background)", color: "var(--color-on-surface)" }}
    >
      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section
        className="relative pt-28 pb-20 circuit-bg overflow-hidden"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="absolute top-0 right-0 w-[700px] h-[500px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(ellipse, ${BLUE}10 0%, transparent 70%)`, filter: "blur(100px)" }}
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-8 text-xs" style={{ color: "var(--color-outline)" }}>
            <Link href={`/${locale}`} className="hover:text-white transition-colors">{isTr ? "Ana Sayfa" : "Home"}</Link>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: "var(--color-primary)" }}>{isTr ? "Çözüm Ortaklarımız" : "Solution Partners"}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
                style={{ backgroundColor: `${FN_RED}18`, border: `1px solid ${FN_RED}30`, color: FN_RED, fontFamily: "var(--font-family-label)" }}
              >
                <Network className="w-3.5 h-3.5" />
                {isTr ? "Teknoloji Ekosistemi" : "Technology Ecosystem"}
              </div>

              <h1
                className="text-5xl md:text-6xl font-black mb-6 leading-tight"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                {isTr
                  ? (<>Güvenilir <span style={{ color: BLUE }}>Teknoloji<br />Ekosistemi</span></>)
                  : (<>Trusted <span style={{ color: BLUE }}>Technology<br />Ecosystem</span></>)}
              </h1>

              <p className="text-lg leading-relaxed mb-8 max-w-xl" style={{ color: "var(--color-on-surface-variant)" }}>
                {isTr
                  ? "Siber güvenlikten veri merkezine, buluttan fiziksel güvenliğe kadar 6 kategoride dünya liderlerinin çözümlerini kurumunuza özel olarak tasarlayıp uyguluyoruz."
                  : "From cybersecurity to data centers, cloud to physical security — we design and implement world-leading solutions across 6 categories, tailored for your organization."}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                {[
                  { v: "6",          l: isTr ? "Teknoloji Kategorisi" : "Technology Categories" },
                  { v: `${total}+`,  l: isTr ? "Teknoloji Partneri"   : "Technology Partners" },
                  { v: "18+",        l: isTr ? "Yıllık Deneyim"       : "Years of Experience" },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="text-3xl font-black" style={{ color: BLUE, fontFamily: "var(--font-family-headline)" }}>{s.v}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kategori ikonları */}
            <div className="grid grid-cols-3 gap-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <a
                    key={cat.id}
                    href={`#${cat.id}`}
                    className="p-4 rounded-2xl text-center transition-all duration-200 hover:scale-[1.04] no-underline"
                    style={{ backgroundColor: `${cat.color}08`, border: `1px solid ${cat.color}20` }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${cat.color}18` }}>
                      <Icon className="w-5 h-5" style={{ color: cat.color }} />
                    </div>
                    <div className="text-xs font-bold leading-tight" style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-family-label)" }}>
                      {isTr ? cat.title : cat.titleEn}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "var(--color-outline)" }}>
                      {cat.partners.length} {isTr ? "partner" : "partners"}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── KATEGORİLER ─────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="space-y-16">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} id={cat.id}>
                  {/* Kategori başlığı */}
                  <div className="flex items-center gap-4 mb-8">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}15`, border: `1px solid ${cat.color}25` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1">
                      <h2
                        className="text-2xl font-black leading-none mb-1"
                        style={{ fontFamily: "var(--font-family-headline)" }}
                      >
                        {isTr ? cat.title : cat.titleEn}
                      </h2>
                      <p className="text-sm" style={{ color: "var(--color-outline)" }}>
                        {isTr ? cat.desc : cat.descEn}
                      </p>
                    </div>
                    <div className="h-px flex-1" style={{ backgroundColor: `${cat.color}20` }} />
                  </div>

                  {/* Partner logoları */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {cat.partners.map((p) => (
                      <div
                        key={p.name}
                        className="flex flex-col items-center gap-3 p-5 rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-default"
                        style={{
                          backgroundColor: `${p.color}07`,
                          border: `1px solid ${p.color}20`,
                        }}
                      >
                        <PartnerLogo slug={p.slug} abbr={p.abbr} color={p.color} size={60} />
                        <span
                          className="text-xs font-bold text-center leading-tight"
                          style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-family-label)" }}
                        >
                          {p.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{
          background: `linear-gradient(135deg, rgba(0,82,255,0.08), ${FN_RED}06)`,
          borderTop: "1px solid rgba(0,82,255,0.12)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ fontFamily: "var(--font-family-headline)" }}
          >
            {isTr
              ? (<>Doğru Teknolojiyle <span style={{ color: BLUE }}>Doğru Çözüm</span></>)
              : (<>Right Technology, <span style={{ color: BLUE }}>Right Solution</span></>)}
          </h2>
          <p className="text-base mb-8 max-w-xl mx-auto leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
            {isTr
              ? "Hangi teknolojiyi kullanırsanız kullanın, sertifikalı mühendislerimiz en iyi çözümü tasarlar ve uygular."
              : "Whatever technology you use, our certified engineers design and implement the best solution."}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={`/${locale}/iletisim`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${BLUE}, #0040cc)`, fontFamily: "var(--font-family-label)", boxShadow: "0 0 24px rgba(0,82,255,0.35)" }}
            >
              {isTr ? "Ücretsiz Danışmanlık Al" : "Get Free Consulting"}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/${locale}/fortinet`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all hover:bg-white/10"
              style={{ border: "1px solid rgba(255,255,255,0.15)", color: "var(--color-on-surface-variant)", fontFamily: "var(--font-family-label)" }}
            >
              {isTr ? "Fortinet Çözümleri" : "Fortinet Solutions"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
