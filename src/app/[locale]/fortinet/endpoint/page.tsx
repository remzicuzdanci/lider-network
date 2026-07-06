"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Lock,
  Shield,
  CheckCircle2,
  ArrowRight,
  Zap,
  Monitor,
  Eye,
  Cpu,
  Network,
  Phone,
  ChevronRight,
  Users,
  Globe,
} from "lucide-react";

const FN_RED = "#EE3124";
const PURPLE = "#7c3aed";

/* ─── Protection modules ──────────────────────────────────────────────────── */
const modules = [
  {
    name: "ZTNA",
    fullName: "Zero Trust Network Access",
    icon: Lock,
    color: PURPLE,
    desc: "Kimliği doğrulanmamış hiçbir kullanıcı veya cihaz kaynaklara erişemez. Uygulama bazlı mikro-segmentasyon ve sürekli doğrulama.",
    features: [
      "Uygulama başına erişim kontrolü",
      "Cihaz durum sürekli doğrulama",
      "Kimlik tabanlı politika uygulaması",
      "FortiGate ile tam entegrasyon",
    ],
    tags: ["ZTNA", "Mikro-Segmentasyon", "Sıfır Güven"],
  },
  {
    name: "NAC Kontrolü",
    fullName: "FortiNAC — Network Access Control",
    icon: Network,
    color: "#0052ff",
    desc: "Ağa bağlanan her cihazı otomatik olarak tanımlar, sınıflandırır ve güvenlik politikasına göre dinamik VLAN'a yönlendirir.",
    features: [
      "Otomatik cihaz keşfi ve envanteri",
      "802.1X ve MAC kimlik doğrulama",
      "BYOD politika uygulaması",
      "IoT cihaz segmentasyonu",
    ],
    tags: ["FortiNAC", "802.1X", "BYOD", "IoT"],
  },
  {
    name: "EDR / XDR",
    fullName: "FortiEDR — Endpoint Detection & Response",
    icon: Eye,
    color: FN_RED,
    desc: "Yapay zeka destekli endpoint koruma, gerçek zamanlı tehdit tespiti ve otomatik müdahale. Fidye yazılımı ve sıfır-gün saldırılarına karşı..",
    features: [
      "AI destekli davranış analizi",
      "Gerçek zamanlı fidye yazılımı koruması",
      "Tehdit avlama (Threat Hunting)",
      "Otomatik karantina ve düzeltme",
    ],
    tags: ["FortiEDR", "Ransomware", "AI", "Threat Hunting"],
  },
  {
    name: "SASE",
    fullName: "FortiSASE — Secure Access Service Edge",
    icon: Globe,
    color: "#059669",
    desc: "Uzak kullanıcılar ve şubeler için bulut tabanlı güvenlik. SSL inceleme, CASB, SWG ve ZTNA tek platformda.",
    features: [
      "Bulut tabanlı NGFW ve SSL inceleme",
      "CASB ve Shadow IT görünürlüğü",
      "Güvenli web geçidi (SWG)",
      "SD-WAN ve ZTNA entegrasyonu",
    ],
    tags: ["SASE", "CASB", "SWG", "Bulut Güvenlik"],
  },
];

/* ─── Compatibility / Technical data ─────────────────────────────────────── */
const techSpecs = [
  { category: "İşletim Sistemi Desteği", items: ["Windows 7/10/11", "macOS 10.14+", "Linux (RHEL, CentOS, Ubuntu)", "iOS / Android"] },
  { category: "Güvenlik Yetenekleri", items: ["Next-Gen Antivirus (NGAV)", "Davranışsal analiz (ML)", "Güvenlik açığı taraması", "Uygulama kontrolü"] },
  { category: "Yönetim", items: ["FortiEMS merkezi yönetim", "FortiManager entegrasyonu", "API otomasyonu", "SIEM entegrasyonu"] },
  { category: "Uyumluluk", items: ["KVKK uyumluluk raporlama", "ISO 27001 kontrolleri", "PCI-DSS endpoint güvenlik", "SOC 2 Type II"] },
];

/* ─── Why Lider reasons ───────────────────────────────────────────────────── */
const whyLider = [
  {
    icon: Shield,
    title: "Sertifikalı Uzmanlık",
    desc: "uzman Fortinet mühendis ekibi ile endpoint güvenlik tasarımı ve implementasyonu.",
  },
  {
    icon: Cpu,
    title: "Hızlı Devreye Alma",
    desc: "Mevcut altyapınızla uyumlu, minimum kesinti ile FortiClient ve FortiNAC kurulum ve yapılandırması.",
  },
  {
    icon: Monitor,
    title: "7/24 İzleme",
    desc: "FortiAnalyzer ile endpoint güvenlik olaylarının sürekli izlenmesi ve hızlı müdahale.",
  },
  {
    icon: Users,
    title: "Kullanıcı Eğitimi",
    desc: "Son kullanıcı farkındalık eğitimleri ve güvenlik kültürü oluşturma programları.",
  },
];

export default function EndpointPage() {
  const locale = useLocale();

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-background)", color: "var(--color-on-surface)" }}
    >
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative pt-28 pb-20 overflow-hidden circuit-bg"
        style={{ borderBottom: `1px solid rgba(124,58,237,0.2)` }}
      >
        <div
          className="absolute top-0 right-0 w-[700px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)`,
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, ${FN_RED}08 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 mb-6 text-xs" style={{ color: "var(--color-outline)" }}>
                <Link href={`/${locale}`} className="hover:text-white transition-colors">Ana Sayfa</Link>
                <ChevronRight className="w-3 h-3" />
                <Link href={`/${locale}/fortinet`} className="hover:text-white transition-colors">Fortinet</Link>
                <ChevronRight className="w-3 h-3" />
                <span style={{ color: PURPLE }}>Endpoint & NAC</span>
              </div>

              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
                style={{
                  backgroundColor: "rgba(124,58,237,0.12)",
                  border: "1px solid rgba(124,58,237,0.3)",
                  color: "#c084fc",
                  fontFamily: "var(--font-family-label)",
                }}
              >
                <Lock className="w-3.5 h-3.5" />
                FortiClient · FortiEDR · FortiNAC · FortiSASE
              </div>

              <h1
                className="text-5xl md:text-6xl font-black mb-6 leading-tight"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Fortinet Endpoint ve
                <br />
                <span style={{ color: PURPLE }}>NAC</span>{" "}
                <span style={{ color: FN_RED }}>Mükemmeliyeti</span>
              </h1>

              <p
                className="text-lg md:text-xl mb-8 max-w-xl leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                ZTNA, FortiNAC, FortiEDR ve FortiSASE ile uçtan uca endpoint güvenliği sağlayın.
                Yapay zeka destekli tehdit tespiti ve otomatik müdahale ile sıfır güven mimarisini hayata geçirin.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href={`/${locale}/iletisim`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${PURPLE}, #6d28d9)`,
                    fontFamily: "var(--font-family-label)",
                    boxShadow: `0 0 24px ${PURPLE}40`,
                  }}
                >
                  <Zap className="w-4 h-4" />
                  Demo Talep Et
                </Link>
                <Link
                  href={`/${locale}/fortinet/yonetim`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:bg-white/10"
                  style={{
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "var(--color-on-surface-variant)",
                    fontFamily: "var(--font-family-label)",
                  }}
                >
                  SOC Çözümleri
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                {[
                  { v: "ZTNA", l: "Sıfır Güven Mimarisi" },
                  { v: "%99.9", l: "Tehdit Tespit Oranı" },
                  { v: "AI/ML", l: "Davranış Analizi" },
                  { v: "Çapraz OS", l: "Win / Mac / Linux" },
                ].map((s) => (
                  <div key={s.v}>
                    <div className="text-2xl font-black" style={{ color: PURPLE, fontFamily: "var(--font-family-headline)" }}>
                      {s.v}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}>
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Endpoint visual */}
            <div className="hidden lg:block">
              <div
                className="rounded-2xl p-6 circuit-pattern"
                style={{
                  backgroundColor: "#0a0d10",
                  border: "1px solid rgba(124,58,237,0.25)",
                  boxShadow: "0 0 60px rgba(124,58,237,0.1)",
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between mb-5 pb-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div>
                    <div className="text-xs font-bold mb-0.5" style={{ color: PURPLE, fontFamily: "var(--font-family-label)" }}>
                      FortiEDR — Endpoint Koruma
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--color-outline)" }}>
                      Gerçek zamanlı tehdit izleme
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px]" style={{ color: "var(--color-outline)" }}>KORUNAN</span>
                  </div>
                </div>

                {/* Protection metrics */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: "Korunan Cihaz", value: "1,247", color: PURPLE },
                    { label: "Engellenen Tehdit", value: "3,891", color: FN_RED },
                    { label: "Günlük Tarama", value: "24/7", color: "#059669" },
                    { label: "Tehdit Tespiti", value: "%99.9", color: "#0052ff" },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="p-3 rounded-xl text-center"
                      style={{ backgroundColor: `${m.color}10`, border: `1px solid ${m.color}20` }}
                    >
                      <div className="text-lg font-black" style={{ color: m.color, fontFamily: "var(--font-family-headline)" }}>
                        {m.value}
                      </div>
                      <div className="text-[9px] font-bold" style={{ color: m.color, fontFamily: "var(--font-family-label)" }}>
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent threats */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold mb-2" style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}>
                    SON BLOKLAR
                  </div>
                  {[
                    { time: "09:14:22", msg: "Ransomware girişimi engellendi", type: "crit" },
                    { time: "09:12:05", msg: "Şüpheli PowerShell komutu bloklandı", type: "warn" },
                    { time: "09:10:31", msg: "Kimlik avı bağlantısı engellendi", type: "warn" },
                    { time: "09:08:17", msg: "USB cihazı politikaya aykırı", type: "info" },
                  ].map((ev) => (
                    <div
                      key={ev.time}
                      className="flex items-center gap-3 p-2.5 rounded-lg"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: ev.type === "crit" ? FN_RED : ev.type === "warn" ? "#f59e0b" : PURPLE,
                        }}
                      />
                      <div className="text-[9px] font-mono flex-1 truncate" style={{ color: "var(--color-on-surface-variant)" }}>
                        {ev.msg}
                      </div>
                      <div className="text-[9px] shrink-0" style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}>
                        {ev.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROTECTION MODULES ───────────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <div
            className="text-xs font-bold mb-3 uppercase tracking-widest"
            style={{ color: PURPLE, fontFamily: "var(--font-family-label)" }}
          >
            Koruma Modülleri
          </div>
          <h2
            className="text-3xl md:text-4xl font-black"
            style={{ fontFamily: "var(--font-family-headline)" }}
          >
            Gelişmiş Koruma Modülleri
          </h2>
          <p className="text-base mt-3 max-w-2xl" style={{ color: "var(--color-on-surface-variant)" }}>
            Birbiriyle tam entegre çalışan, katmanlı güvenlik mimarisi sunan Fortinet endpoint çözümleri.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.name}
                className="p-6 rounded-2xl card-glow transition-all duration-300 hover:scale-[1.01]"
                style={{
                  backgroundColor: `${mod.color}06`,
                  border: `1px solid ${mod.color}20`,
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${mod.color}18` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: mod.color }} />
                  </div>
                  <div>
                    <div
                      className="text-xs font-bold mb-0.5"
                      style={{ color: mod.color, fontFamily: "var(--font-family-label)" }}
                    >
                      {mod.name}
                    </div>
                    <h3
                      className="text-lg font-black"
                      style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
                    >
                      {mod.fullName}
                    </h3>
                  </div>
                </div>

                <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                  {mod.desc}
                </p>

                <div className="grid grid-cols-1 gap-2 mb-4">
                  {mod.features.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: mod.color }} />
                      <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {mod.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded font-bold"
                      style={{
                        backgroundColor: `${mod.color}15`,
                        color: mod.color,
                        border: `1px solid ${mod.color}25`,
                        fontFamily: "var(--font-family-label)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── TECH SPECS ───────────────────────────────────────────────────── */}
      <section
        className="py-16"
        style={{ backgroundColor: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10">
            <div
              className="text-xs font-bold mb-3 uppercase tracking-widest"
              style={{ color: PURPLE, fontFamily: "var(--font-family-label)" }}
            >
              Teknik Detaylar
            </div>
            <h2
              className="text-3xl md:text-4xl font-black"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Teknik Özellikler & Uyumluluk
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {techSpecs.map((cat) => (
              <div
                key={cat.category}
                className="p-5 rounded-2xl"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="text-xs font-bold mb-4"
                  style={{ color: PURPLE, fontFamily: "var(--font-family-label)" }}
                >
                  {cat.category}
                </div>
                <div className="space-y-2">
                  {cat.items.map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: PURPLE }} />
                      <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY LIDER ────────────────────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <div
            className="text-xs font-bold mb-3 uppercase tracking-widest"
            style={{ color: PURPLE, fontFamily: "var(--font-family-label)" }}
          >
            Neden Lider Network?
          </div>
          <h2
            className="text-3xl md:text-4xl font-black"
            style={{ fontFamily: "var(--font-family-headline)" }}
          >
            Endpoint Güvenliğinde
            <br />
            <span style={{ color: PURPLE }}>Güvenilir Ortağınız</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {whyLider.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-5 rounded-2xl"
                style={{
                  backgroundColor: `${PURPLE}06`,
                  border: `1px solid ${PURPLE}18`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${PURPLE}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: PURPLE }} />
                </div>
                <h3 className="font-bold text-sm mb-2" style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-family-headline)" }}>
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Additional checklist */}
        <div
          className="mt-8 p-6 rounded-2xl"
          style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              "Fortinet Yetkili Partner",
              "Mevcut güvenlik altyapısıyla entegrasyon",
              "Proje bazlı ve SLA'lı managed hizmet seçeneği",
              "KVKK uyumluluk denetimi ve raporlama",
              "Kullanıcı farkındalık eğitimi dahil tam paket",
              "2006'dan bu yana kurumsal güvenlik deneyimi",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: PURPLE }} />
                <span className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ───────────────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{
          background: `linear-gradient(135deg, ${PURPLE}12, ${FN_RED}10)`,
          borderTop: `1px solid ${PURPLE}20`,
        }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div
            className="text-xs font-bold mb-4 uppercase tracking-widest"
            style={{ color: PURPLE, fontFamily: "var(--font-family-label)" }}
          >
            Fortinet Yetkili Partner — Endpoint Uzmanı
          </div>
          <h2
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ fontFamily: "var(--font-family-headline)" }}
          >
            Ağınızı Bugün{" "}
            <span style={{ color: FN_RED }}>Güvence Altına Alın</span>
          </h2>
          <p
            className="text-base mb-8 max-w-xl mx-auto"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            FortiClient, FortiEDR ve FortiNAC için ücretsiz güvenlik değerlendirmesi ve POC planlayın.
            Mevcut endpoint güvenliğinizi analiz edip en uygun çözümü tasarlayalım.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={`/${locale}/iletisim`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${PURPLE}, #6d28d9)`,
                fontFamily: "var(--font-family-label)",
                boxShadow: `0 0 24px ${PURPLE}40`,
              }}
            >
              <Zap className="w-4 h-4" />
              Ücretsiz Değerlendirme Al
            </Link>
            <a
              href="tel:+903122320288"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all hover:bg-white/10"
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                color: "var(--color-on-surface-variant)",
                fontFamily: "var(--font-family-label)",
              }}
            >
              <Phone className="w-4 h-4" />
              Hemen Ara
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
