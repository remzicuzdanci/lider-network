"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Monitor,
  CheckCircle2,
  ArrowRight,
  Zap,
  BarChart3,
  Eye,
  Database,
  GitBranch,
  Phone,
  ChevronRight,
  Activity,
  Cpu,
  AlertTriangle,
  PlayCircle,
} from "lucide-react";

const FN_RED = "#EE3124";
const BLUE = "#0052ff";

/* ─── Core products ───────────────────────────────────────────────────────── */
const coreProducts = [
  {
    name: "FortiAnalyzer",
    tagline: "Merkezi Log & Analiz",
    icon: BarChart3,
    color: BLUE,
    desc: "Fortinet Security Fabric genelindeki tüm log verilerini toplar, analiz eder ve gelişmiş raporlar oluşturur. SIEM entegrasyonu ve SOC operasyonları için temel platform.",
    features: [
      "Gerçek zamanlı log korelasyonu ve analizi",
      "FortiGuard tehdit istihbaratı entegrasyonu",
      "Özelleştirilebilir SOC dashboard'ları",
      "Uyumluluk raporları (KVKK, ISO 27001, PCI-DSS)",
      "Yüksek verimli log depolama ve arama",
    ],
    specs: [
      { label: "Log/sn", value: "25.000+" },
      { label: "Depolama", value: "TB ölçekli" },
      { label: "Bağlantı", value: "2000+ cihaz" },
      { label: "Retention", value: "Özelleştirilebilir" },
    ],
  },
  {
    name: "FortiManager",
    tagline: "Merkezi Politika Yönetimi",
    icon: GitBranch,
    color: "#7c3aed",
    desc: "Yüzlerce FortiGate, FortiSwitch ve FortiAP cihazını tek konsoldan yönetin. Politika şablonları, firmware güncellemeleri ve otomatik yapılandırma.",
    features: [
      "Merkezi politika ve nesne yönetimi",
      "Otomatik firmware yönetimi",
      "Role-based access control (RBAC)",
      "SD-WAN orkestrasyon ve yönetim",
      "API entegrasyonu ve otomasyon",
    ],
    specs: [
      { label: "Yönetilen Cihaz", value: "10.000+" },
      { label: "Politika Şablonu", value: "Sınırsız" },
      { label: "API Desteği", value: "REST / JSON" },
      { label: "HA Destek", value: "Aktif-Pasif" },
    ],
  },
  {
    name: "FortiSIEM",
    tagline: "Güvenlik Bilgi & Olay Yönetimi",
    icon: Eye,
    color: FN_RED,
    desc: "Yapay zeka destekli SIEM platformu. Ağ, endpoint, uygulama ve bulut katmanlarından gelen güvenlik olaylarını birleştirerek tehdit tespiti ve müdahaleyi hızlandırır.",
    features: [
      "Çoklu kaynak korelasyonu ve tehdit tespiti",
      "UEBA — Kullanıcı ve varlık davranış analizi",
      "Otomatik olay yanıt (SOAR entegrasyonu)",
      "KVKK ve yasal uyumluluk raporları",
      "Cloud-native ölçeklenebilir mimari",
    ],
    specs: [
      { label: "EPS", value: "50.000+" },
      { label: "Korelasyon", value: "AI Destekli" },
      { label: "MTTR", value: "%70 azalma" },
      { label: "Kapsam", value: "Hibrit/Multi-Cloud" },
    ],
  },
  {
    name: "FortiSOAR",
    tagline: "Güvenlik Orkestrasyonu & Otomasyon",
    icon: PlayCircle,
    color: "#059669",
    desc: "Güvenlik operasyonlarını otomatize edin. Playbook'lar ile tekrarlayan görevleri ortadan kaldırın, SOC analistlerinin verimini %90'a kadar artırın.",
    features: [
      "500+ önceden yapılandırılmış playbook",
      "Drag-and-drop playbook tasarımcısı",
      "Ticket yönetimi ve olay takibi",
      "Üçüncü taraf entegrasyonlar (Splunk, ServiceNow, vb.)",
      "Gerçek zamanlı tehdit zekası besleme",
    ],
    specs: [
      { label: "Playbook", value: "500+" },
      { label: "Entegrasyon", value: "400+ araç" },
      { label: "Verimlilik", value: "%90 artış" },
      { label: "MTTR", value: "Dakikalar" },
    ],
  },
];

/* ─── SOC capabilities ────────────────────────────────────────────────────── */
const socCapabilities = [
  {
    icon: Activity,
    title: "7/24 SOC İzleme",
    desc: "Kesintisiz güvenlik izleme, anlık alarm yönetimi ve önceliklendirilmiş olay müdahalesi.",
    color: FN_RED,
  },
  {
    icon: AlertTriangle,
    title: "Tehdit Avcılığı",
    desc: "Proaktif tehdit avcılığı (threat hunting) ile ağınızdaki gizli tehditleri ve APT'leri tespit edin.",
    color: "#f59e0b",
  },
  {
    icon: Database,
    title: "Log Yönetimi",
    desc: "KVKK ve ISO 27001 uyumlu merkezi log arşivleme, saklama ve yasal raporlama.",
    color: BLUE,
  },
  {
    icon: Cpu,
    title: "AI Tehdit Tespiti",
    desc: "Makine öğrenmesi ve davranış analizi ile sıfır-gün tehditleri ve bilinmeyen saldırıları tespit edin.",
    color: "#7c3aed",
  },
];

/* ─── Technology strategy items ──────────────────────────────────────────── */
const strategyItems = [
  "Fortinet Security Fabric bütünleşik güvenlik mimarisi",
  "FortiGuard AI-powered tehdit istihbaratı entegrasyonu",
  "KVKK, ISO 27001, PCI-DSS uyumluluk otomasyonu",
  "SD-WAN ve Zero Trust Network Access (ZTNA) entegrasyonu",
  "Bulut (AWS, Azure, GCP) ve şirket içi hibrit SOC",
  "uzman Fortinet mühendis ekibi",
];

export default function YonetimSOCPage() {
  const locale = useLocale();

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-background)", color: "var(--color-on-surface)" }}
    >
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative pt-28 pb-20 overflow-hidden circuit-bg"
        style={{ borderBottom: `1px solid rgba(0,82,255,0.15)` }}
      >
        {/* Background glows */}
        <div
          className="absolute top-0 right-0 w-[700px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, rgba(0,82,255,0.1) 0%, transparent 70%)`,
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
                <span style={{ color: BLUE }}>Yönetim & SOC</span>
              </div>

              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
                style={{
                  backgroundColor: "rgba(0,82,255,0.12)",
                  border: "1px solid rgba(0,82,255,0.3)",
                  color: "#60a5fa",
                  fontFamily: "var(--font-family-label)",
                }}
              >
                <Monitor className="w-3.5 h-3.5" />
                FortiAnalyzer · FortiManager · FortiSIEM · FortiSOAR
              </div>

              <h1
                className="text-5xl md:text-6xl font-black mb-6 leading-tight"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Merkezi Kontrol ve
                <br />
                <span style={{ color: BLUE }}>Uçtan Uca</span>
                <br />
                <span style={{ color: FN_RED }}>Görünürlük</span>
              </h1>

              <p
                className="text-lg md:text-xl mb-8 max-w-xl leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                FortiAnalyzer, FortiManager ve FortiSIEM ile güvenlik operasyonlarınızı tek platformda
                birleştirin. Yapay zeka destekli tehdit tespiti, %70 daha hızlı müdahale.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href={`/${locale}/iletisim`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${BLUE}, #0040cc)`,
                    fontFamily: "var(--font-family-label)",
                    boxShadow: `0 0 24px rgba(0,82,255,0.4)`,
                  }}
                >
                  <Zap className="w-4 h-4" />
                  SOC Danışmanlığı Al
                </Link>
                <Link
                  href={`/${locale}/fortinet`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:bg-white/10"
                  style={{
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "var(--color-on-surface-variant)",
                    fontFamily: "var(--font-family-label)",
                  }}
                >
                  FortiGate ile Entegrasyon
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6">
                {[
                  { v: "50K EPS", l: "Olay/Saniye Kapasitesi" },
                  { v: "%70", l: "MTTR Azalması" },
                  { v: "500+", l: "Hazır Playbook" },
                  { v: "7/24", l: "SOC İzleme" },
                ].map((s) => (
                  <div key={s.v}>
                    <div className="text-2xl font-black" style={{ color: BLUE, fontFamily: "var(--font-family-headline)" }}>
                      {s.v}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}>
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard visual */}
            <div className="hidden lg:block">
              <div
                className="rounded-2xl p-6 circuit-pattern"
                style={{
                  backgroundColor: "#0a0d10",
                  border: "1px solid rgba(0,82,255,0.25)",
                  boxShadow: "0 0 60px rgba(0,82,255,0.1)",
                }}
              >
                {/* Dashboard header */}
                <div
                  className="flex items-center justify-between mb-5 pb-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div>
                    <div className="text-xs font-bold mb-0.5" style={{ color: BLUE, fontFamily: "var(--font-family-label)" }}>
                      FortiAnalyzer — SOC Dashboard
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--color-outline)" }}>
                      Canlı güvenlik izleme
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px]" style={{ color: "var(--color-outline)" }}>CANLI</span>
                  </div>
                </div>

                {/* Fake metrics */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Aktif Alarm", value: "3", color: FN_RED, sub: "Yüksek Öncelik" },
                    { label: "İzlenen Cihaz", value: "247", color: BLUE, sub: "Çevrimiçi" },
                    { label: "Log/dk", value: "18K", color: "#059669", sub: "Normal" },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="p-3 rounded-xl text-center"
                      style={{ backgroundColor: `${m.color}10`, border: `1px solid ${m.color}20` }}
                    >
                      <div className="text-xl font-black" style={{ color: m.color, fontFamily: "var(--font-family-headline)" }}>
                        {m.value}
                      </div>
                      <div className="text-[9px] font-bold" style={{ color: m.color, fontFamily: "var(--font-family-label)" }}>
                        {m.label}
                      </div>
                      <div className="text-[9px]" style={{ color: "var(--color-outline)" }}>{m.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Fake event log */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold mb-2" style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}>
                    SON OLAYLAR
                  </div>
                  {[
                    { time: "14:32:01", msg: "Brute force girişimi engellendi", type: "warn", src: "192.168.1.45" },
                    { time: "14:31:44", msg: "Yeni cihaz ağa katıldı", type: "info", src: "10.0.0.132" },
                    { time: "14:30:17", msg: "Malware imzası tespit edildi", type: "crit", src: "172.16.5.22" },
                    { time: "14:29:55", msg: "Politika güncellendi: FortiGate-01", type: "ok", src: "Admin" },
                  ].map((ev) => (
                    <div
                      key={ev.time}
                      className="flex items-center gap-3 p-2.5 rounded-lg"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: ev.type === "crit" ? FN_RED : ev.type === "warn" ? "#f59e0b" : ev.type === "ok" ? "#059669" : BLUE,
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

      {/* ─── SOC CAPABILITIES ─────────────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {socCapabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="p-5 rounded-2xl card-glow"
                style={{
                  backgroundColor: `${cap.color}08`,
                  border: `1px solid ${cap.color}20`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${cap.color}18` }}
                >
                  <Icon className="w-5 h-5" style={{ color: cap.color }} />
                </div>
                <h3 className="font-bold text-sm mb-2" style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-family-headline)" }}>
                  {cap.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                  {cap.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── CORE PRODUCTS ────────────────────────────────────────────────── */}
      <section
        className="py-16"
        style={{ backgroundColor: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10">
            <div
              className="text-xs font-bold mb-3 uppercase tracking-widest"
              style={{ color: BLUE, fontFamily: "var(--font-family-label)" }}
            >
              Fortinet Güvenlik Ekosistemi
            </div>
            <h2
              className="text-3xl md:text-4xl font-black"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Yönetim & SOC Platformları
            </h2>
            <p className="text-base mt-3 max-w-2xl" style={{ color: "var(--color-on-surface-variant)" }}>
              Birbirleriyle tam entegre çalışan Fortinet yönetim ve güvenlik operasyonu platformları.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coreProducts.map((product) => {
              const Icon = product.icon;
              return (
                <div
                  key={product.name}
                  className="p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01]"
                  style={{
                    backgroundColor: `${product.color}06`,
                    border: `1px solid ${product.color}20`,
                  }}
                >
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${product.color}18` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: product.color }} />
                    </div>
                    <div>
                      <div
                        className="text-xs font-bold mb-0.5"
                        style={{ color: product.color, fontFamily: "var(--font-family-label)" }}
                      >
                        {product.tagline}
                      </div>
                      <h3
                        className="text-xl font-black"
                        style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
                      >
                        {product.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                    {product.desc}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {product.features.map((f) => (
                      <div key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: product.color }} />
                        <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {product.specs.map((spec) => (
                      <div
                        key={spec.label}
                        className="p-2.5 rounded-xl text-center"
                        style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <div className="text-sm font-black mb-0.5" style={{ color: product.color, fontFamily: "var(--font-family-label)" }}>
                          {spec.value}
                        </div>
                        <div className="text-[9px] leading-tight" style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}>
                          {spec.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CORPORATE STRATEGY ───────────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Dark visual panel */}
          <div
            className="rounded-2xl p-8 circuit-pattern relative overflow-hidden"
            style={{
              backgroundColor: "#0f1315",
              border: "1px solid rgba(0,82,255,0.2)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 70% 30%, rgba(0,82,255,0.12) 0%, transparent 60%)`,
              }}
            />
            <div className="relative z-10">
              <div
                className="text-xs font-bold mb-4 uppercase tracking-widest"
                style={{ color: BLUE, fontFamily: "var(--font-family-label)" }}
              >
                Profesyonel SOC Operasyonları
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: "Olay Tespiti", value: "< 1 dk", color: "#4ade80" },
                  { label: "Analiz Süresi", value: "< 5 dk", color: BLUE },
                  { label: "Müdahale Süresi", value: "< 15 dk", color: "#f59e0b" },
                  { label: "Yanlış Pozitif", value: "< %5", color: "#a78bfa" },
                  { label: "Uptime SLA", value: "%99.9", color: FN_RED },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>{m.label}</span>
                    <span className="text-sm font-bold" style={{ color: m.color, fontFamily: "var(--font-family-label)" }}>
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div
              className="text-xs font-bold mb-3 uppercase tracking-widest"
              style={{ color: BLUE, fontFamily: "var(--font-family-label)" }}
            >
              Kurumsal Teknoloji Stratejisi
            </div>
            <h2
              className="text-3xl md:text-4xl font-black mb-6"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Neden Lider Network
              <br />
              <span style={{ color: BLUE }}>SOC Çözümleri?</span>
            </h2>
            <div className="space-y-4">
              {strategyItems.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: BLUE }} />
                  <span className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ───────────────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{
          background: `linear-gradient(135deg, rgba(0,82,255,0.12), ${FN_RED}10)`,
          borderTop: "1px solid rgba(0,82,255,0.2)",
        }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div
            className="text-xs font-bold mb-4 uppercase tracking-widest"
            style={{ color: BLUE, fontFamily: "var(--font-family-label)" }}
          >
            Fortinet Yetkili Partner — SOC Uzmanı
          </div>
          <h2
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ fontFamily: "var(--font-family-headline)" }}
          >
            Siber Güvenliğinizi
            <br />
            <span style={{ color: FN_RED }}>Bir Üst Seviyeye Taşıyın</span>
          </h2>
          <p
            className="text-base mb-8 max-w-xl mx-auto"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            FortiAnalyzer, FortiManager ve FortiSIEM için ücretsiz demo ve POC planlayın.
            uzman SOC uzmanlarımız mevcut altyapınızı analiz eder.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={`/${locale}/iletisim`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${BLUE}, #0040cc)`,
                fontFamily: "var(--font-family-label)",
                boxShadow: "0 0 24px rgba(0,82,255,0.4)",
              }}
            >
              <Zap className="w-4 h-4" />
              Ücretsiz Demo Al
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
