"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Shield,
  CheckCircle2,
  ArrowRight,
  Zap,
  Network,
  Server,
  Cpu,
  Activity,
  Phone,
  ChevronRight,
} from "lucide-react";

const FN_RED = "#EE3124";
const FN_DARK = "#C8102E";

/* ─── Switch series data ──────────────────────────────────────────────────── */
const switchSeries = [
  {
    name: "100 Serisi",
    badge: "Küçük İşletme",
    badgeColor: "#4ade80",
    desc: "Küçük ve orta ölçekli işletmeler için maliyet etkin, yönetimli katman-2 anahtarlar. FortiLink ile merkezi yönetim.",
    specs: [
      { label: "Port Sayısı", value: "8–48 port" },
      { label: "PoE Güç", value: "185W" },
      { label: "Uplink", value: "4× SFP" },
      { label: "Throughput", value: "104 Gbps" },
    ],
    products: ["FortiSwitch 108F-PoE", "FortiSwitch 124F", "FortiSwitch 148F-PoE"],
    highlight: false,
  },
  {
    name: "200 Serisi",
    badge: "Önerilen",
    badgeColor: "#0052ff",
    desc: "Kurumsal dağıtım katmanı için yüksek performanslı, tam yönetimli katman-2/3 anahtarlar. Gelişmiş QoS ve VLAN desteği.",
    specs: [
      { label: "Port Sayısı", value: "24–48 port" },
      { label: "PoE Güç", value: "740W" },
      { label: "Uplink", value: "4× SFP+" },
      { label: "Throughput", value: "176 Gbps" },
    ],
    products: ["FortiSwitch 224E-PoE", "FortiSwitch 248E-PoE", "FortiSwitch 248E-FPOE"],
    highlight: true,
  },
  {
    name: "400 Serisi",
    badge: "Kurumsal",
    badgeColor: FN_RED,
    desc: "Veri merkezi ve çekirdek ağ için 10GbE/25GbE destekli, yüksek yoğunluklu kurumsal anahtarlama çözümleri.",
    specs: [
      { label: "Port Sayısı", value: "48 port" },
      { label: "PoE Güç", value: "1440W" },
      { label: "Uplink", value: "6× QSFP+" },
      { label: "Throughput", value: "598 Gbps" },
    ],
    products: ["FortiSwitch 424E-Fiber", "FortiSwitch 448E", "FortiSwitch 448E-PoE"],
    highlight: false,
  },
  {
    name: "Rugged Serisi",
    badge: "Endüstriyel",
    badgeColor: "#f59e0b",
    desc: "Sert endüstriyel ortamlar için tasarlanmış, geniş sıcaklık aralığı (-40°C ila +75°C) ve DIN ray montaj seçenekli anahtarlar.",
    specs: [
      { label: "Sıcaklık Aralığı", value: "-40 ~ +75°C" },
      { label: "Koruma Sınıfı", value: "IP40" },
      { label: "Montaj", value: "DIN Ray / Duvar" },
      { label: "PoE Güç", value: "240W" },
    ],
    products: ["FortiSwitch 112D-POE", "FortiSwitch 224D-FPOE"],
    highlight: false,
  },
];

/* ─── Comparison table ────────────────────────────────────────────────────── */
const compMatrix = {
  headers: ["Özellik", "100 Serisi", "200 Serisi", "400 Serisi"],
  rows: [
    ["Port Sayısı", "8–48 GbE", "24–48 GbE", "48 GbE + 10G"],
    ["PoE Bütçesi", "185W", "740W", "1440W"],
    ["Uplink", "4× SFP", "4× SFP+", "6× QSFP+"],
    ["Katman", "L2", "L2/L3", "L3"],
    ["Stacking", "FortiLink", "FortiLink", "FortiLink + HW"],
    ["VLAN", "4096", "4096", "4096"],
    ["Throughput", "104 Gbps", "176 Gbps", "598 Gbps"],
    ["Kullanım Alanı", "SMB / Şube", "Kampüs / Dağıtım", "Veri Merkezi / Çekirdek"],
  ],
};

/* ─── Key features ────────────────────────────────────────────────────────── */
const keyFeatures = [
  {
    icon: Shield,
    title: "FortiLink Entegrasyonu",
    desc: "FortiGate üzerinden tek konsoldan tüm switch'lerin merkezi yönetimi ve güvenlik politika uygulaması.",
    color: FN_RED,
  },
  {
    icon: Network,
    title: "Zero Trust NAC",
    desc: "802.1X kimlik doğrulama ve dinamik VLAN ataması ile ağa bağlanan her cihazın otomatik segmentasyonu.",
    color: "#0052ff",
  },
  {
    icon: Cpu,
    title: "FortiGuard Entegrasyonu",
    desc: "Gerçek zamanlı tehdit istihbaratı ile switch düzeyinde güvenlik politikası uygulama ve anormallik tespiti.",
    color: "#7c3aed",
  },
  {
    icon: Activity,
    title: "%308 ROI",
    desc: "Forrester araştırmasına göre FortiSwitch dağıtımları 3 yılda %308 yatırım getirisi ve 9 aylık geri ödeme süresi sağlıyor.",
    color: "#059669",
  },
];

export default function FortiSwitchPage() {
  const locale = useLocale();

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-background)", color: "var(--color-on-surface)" }}
    >
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative pt-28 pb-20 overflow-hidden circuit-bg"
        style={{ borderBottom: `1px solid rgba(238,49,36,0.15)` }}
      >
        {/* Background glow */}
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, ${FN_RED}14 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 text-xs" style={{ color: "var(--color-outline)" }}>
              <Link href={`/${locale}`} className="hover:text-white transition-colors">Ana Sayfa</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/${locale}/fortinet`} className="hover:text-white transition-colors">Fortinet</Link>
              <ChevronRight className="w-3 h-3" />
              <span style={{ color: FN_RED }}>FortiSwitch</span>
            </div>

            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
              style={{
                backgroundColor: `${FN_RED}18`,
                border: `1px solid ${FN_RED}35`,
                color: FN_RED,
                fontFamily: "var(--font-family-label)",
              }}
            >
              <Server className="w-3.5 h-3.5" />
              Fortinet Yetkili Partner — Switch & Wireless
            </div>

            <h1
              className="text-5xl md:text-6xl font-black mb-6 leading-tight"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Kusursuz Performans,
              <br />
              <span style={{ color: FN_RED }}>Güvenli Erişim</span>
            </h1>

            <p
              className="text-lg md:text-xl mb-8 max-w-2xl leading-relaxed"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              FortiSwitch, FortiGate ile tam entegre çalışan akıllı katman anahtarları ile kurumsal ağınızı
              yönetin. Zero Trust NAC, FortiLink merkezi yönetimi ve %308 ROI garantisi.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                href={`/${locale}/iletisim`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${FN_RED}, ${FN_DARK})`,
                  fontFamily: "var(--font-family-label)",
                  boxShadow: `0 0 24px ${FN_RED}40`,
                }}
              >
                <Zap className="w-4 h-4" />
                Teklif Al
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
                FortiGate ile Karşılaştır
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Hero stats */}
            <div className="flex flex-wrap gap-6">
              {[
                { v: "%308", l: "3 Yıllık ROI" },
                { v: "598 Gbps", l: "Maks. Throughput" },
                { v: "FortiLink", l: "Merkezi Yönetim" },
                { v: "Zero Trust", l: "NAC Entegrasyonu" },
              ].map((s) => (
                <div key={s.v}>
                  <div className="text-2xl font-black" style={{ color: FN_RED, fontFamily: "var(--font-family-headline)" }}>
                    {s.v}
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}>
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── KEY FEATURES ─────────────────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {keyFeatures.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="p-5 rounded-2xl card-glow"
                style={{
                  backgroundColor: `${f.color}08`,
                  border: `1px solid ${f.color}20`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${f.color}18` }}
                >
                  <Icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-sm mb-2" style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-family-headline)" }}>
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── SWITCH SERIES ────────────────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <div
            className="text-xs font-bold mb-3 uppercase tracking-widest"
            style={{ color: FN_RED, fontFamily: "var(--font-family-label)" }}
          >
            Ürün Ailesi
          </div>
          <h2
            className="text-3xl md:text-4xl font-black"
            style={{ fontFamily: "var(--font-family-headline)" }}
          >
            FortiSwitch Serileri
          </h2>
          <p className="text-base mt-3 max-w-2xl" style={{ color: "var(--color-on-surface-variant)" }}>
            Küçük şubeden veri merkezine kadar her ölçekte kurumsal ağ anahtarlama çözümleri.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {switchSeries.map((series) => (
            <div
              key={series.name}
              className="p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01]"
              style={{
                backgroundColor: series.highlight
                  ? "rgba(0,82,255,0.06)"
                  : "rgba(255,255,255,0.03)",
                border: series.highlight
                  ? "1px solid rgba(0,82,255,0.3)"
                  : "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3
                    className="text-xl font-black mb-1"
                    style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
                  >
                    {series.name}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                    {series.desc}
                  </p>
                </div>
                <span
                  className="shrink-0 ml-4 px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: `${series.badgeColor}18`,
                    color: series.badgeColor,
                    border: `1px solid ${series.badgeColor}30`,
                    fontFamily: "var(--font-family-label)",
                  }}
                >
                  {series.badge}
                </span>
              </div>

              {/* Specs grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {series.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="text-xs mb-0.5" style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}>
                      {spec.label}
                    </div>
                    <div className="text-sm font-bold" style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-family-label)" }}>
                      {spec.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Products */}
              <div className="flex flex-wrap gap-2">
                {series.products.map((p) => (
                  <span
                    key={p}
                    className="text-xs px-3 py-1 rounded-lg font-medium"
                    style={{
                      backgroundColor: series.highlight ? "rgba(0,82,255,0.12)" : "rgba(255,255,255,0.05)",
                      color: series.highlight ? "#60a5fa" : "var(--color-on-surface-variant)",
                      border: series.highlight ? "1px solid rgba(0,82,255,0.2)" : "1px solid rgba(255,255,255,0.08)",
                      fontFamily: "var(--font-family-label)",
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── COMPARISON TABLE ─────────────────────────────────────────────── */}
      <section
        className="py-16"
        style={{ backgroundColor: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10">
            <div
              className="text-xs font-bold mb-3 uppercase tracking-widest"
              style={{ color: FN_RED, fontFamily: "var(--font-family-label)" }}
            >
              Teknik Karşılaştırma
            </div>
            <h2
              className="text-3xl md:text-4xl font-black"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Teknik Karşılaştırma Matrisi
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "rgba(238,49,36,0.08)", borderBottom: "1px solid rgba(238,49,36,0.2)" }}>
                  {compMatrix.headers.map((h, i) => (
                    <th
                      key={h}
                      className="px-5 py-4 text-left font-bold"
                      style={{
                        color: i === 0 ? "var(--color-outline)" : i === 2 ? "#60a5fa" : "var(--color-on-surface)",
                        fontFamily: "var(--font-family-label)",
                      }}
                    >
                      {h}
                      {i === 2 && (
                        <span
                          className="ml-2 text-[10px] px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: "rgba(0,82,255,0.2)", color: "#60a5fa" }}
                        >
                          Önerilen
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compMatrix.rows.map((row, ri) => (
                  <tr
                    key={ri}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      backgroundColor: ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                    }}
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="px-5 py-3"
                        style={{
                          color: ci === 0 ? "var(--color-outline)" : ci === 2 ? "#93c5fd" : "var(--color-on-surface-variant)",
                          fontFamily: "var(--font-family-label)",
                          fontWeight: ci === 2 ? 600 : 400,
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── WHY LIDER ────────────────────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div
              className="text-xs font-bold mb-3 uppercase tracking-widest"
              style={{ color: FN_RED, fontFamily: "var(--font-family-label)" }}
            >
              Neden Lider Network?
            </div>
            <h2
              className="text-3xl md:text-4xl font-black mb-6"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              FortiSwitch için
              <br />
              <span style={{ color: FN_RED }}>Uzman Ortağınız</span>
            </h2>
            <div className="space-y-4">
              {[
                "Fortinet Yetkili Partner",
                "Ağ tasarımı, kurulum ve devreye alma dahil anahtar teslim proje",
                "7/24 teknik destek ve uzaktan yönetim hizmetleri",
                "FortiGate + FortiSwitch + FortiAP bütünleşik mimari tasarımı",
                "2006'dan bu yana kurumsal ağ altyapısı deneyimi",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: FN_RED }} />
                  <span className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual card */}
          <div
            className="rounded-2xl p-8 circuit-pattern relative overflow-hidden"
            style={{
              backgroundColor: "#0f1315",
              border: "1px solid rgba(238,49,36,0.2)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 30% 50%, ${FN_RED}12 0%, transparent 60%)`,
              }}
            />
            <div className="relative z-10 text-center">
              <div
                className="text-6xl font-black mb-2"
                style={{ color: FN_RED, fontFamily: "var(--font-family-headline)" }}
              >
                %308
              </div>
              <div
                className="text-base font-bold mb-1"
                style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-family-headline)" }}
              >
                3 Yıllık ROI
              </div>
              <div
                className="text-xs mb-8"
                style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
              >
                Forrester Araştırması — FortiSwitch TEI Raporu
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { v: "9 Ay", l: "Geri Ödeme Süresi" },
                  { v: "$1.4M", l: "3 Yıl Net Kazanç" },
                  { v: "%65", l: "Yönetim Tasarrufu" },
                ].map((s) => (
                  <div key={s.v} className="text-center">
                    <div
                      className="text-xl font-black"
                      style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-family-headline)" }}
                    >
                      {s.v}
                    </div>
                    <div
                      className="text-[10px] leading-tight"
                      style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
                    >
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ───────────────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{
          background: `linear-gradient(135deg, #0052ff18, ${FN_RED}15)`,
          borderTop: "1px solid rgba(0,82,255,0.2)",
          borderBottom: "1px solid rgba(0,82,255,0.2)",
        }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div
            className="text-xs font-bold mb-4 uppercase tracking-widest"
            style={{ color: "#60a5fa", fontFamily: "var(--font-family-label)" }}
          >
            Fortinet Yetkili Partner
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
            FortiSwitch çözümleri için ücretsiz ağ analizi ve kişiselleştirilmiş teklif alın.
            uzman mühendislerimiz 1 iş günü içinde dönüş yapar.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={`/${locale}/iletisim`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, #0052ff, #0040cc)`,
                fontFamily: "var(--font-family-label)",
                boxShadow: "0 0 24px rgba(0,82,255,0.4)",
              }}
            >
              <Zap className="w-4 h-4" />
              Ücretsiz Teklif Al
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
