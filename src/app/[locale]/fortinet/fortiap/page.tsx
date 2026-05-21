"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Wifi,
  CheckCircle2,
  ArrowRight,
  Zap,
  Radio,
  Lock,
  Eye,
  Phone,
  ChevronRight,
  Cpu,
} from "lucide-react";

const FN_RED = "#EE3124";
const FN_DARK = "#C8102E";

/* ─── Product portfolio ───────────────────────────────────────────────────── */
const apProducts = [
  {
    name: "FortiAP 231K",
    badge: "WiFi 7 — Indoor",
    badgeColor: "#0052ff",
    desc: "Kurumsal iç mekan kullanımı için WiFi 7 (802.11be) destekli yüksek yoğunluklu erişim noktası. Tri-band, 6 GHz desteği.",
    specs: [
      { label: "Standart", value: "WiFi 7 (802.11be)" },
      { label: "Frekans", value: "2.4/5/6 GHz" },
      { label: "Hız", value: "11.5 Gbps" },
      { label: "Anten", value: "4×4 MU-MIMO" },
    ],
    highlight: false,
  },
  {
    name: "FortiAP 432K",
    badge: "WiFi 7 — Önerilen",
    badgeColor: FN_RED,
    desc: "Yüksek performanslı çok kullanıcılı kampüs ortamları için WiFi 7 erişim noktası. Maksimum hız ve kapsama alanı.",
    specs: [
      { label: "Standart", value: "WiFi 7 (802.11be)" },
      { label: "Frekans", value: "2.4/5/6 GHz" },
      { label: "Hız", value: "17.3 Gbps" },
      { label: "Anten", value: "4×4+4×4 MU-MIMO" },
    ],
    highlight: true,
  },
  {
    name: "FortiAP 234K",
    badge: "WiFi 6E — Ekonomik",
    badgeColor: "#059669",
    desc: "Maliyet etkin WiFi 6E çözümü. Yoğun ofis ve eğitim ortamları için ideal, OFDMA ve BSS Coloring desteği.",
    specs: [
      { label: "Standart", value: "WiFi 6E (802.11ax)" },
      { label: "Frekans", value: "2.4/5/6 GHz" },
      { label: "Hız", value: "7.3 Gbps" },
      { label: "Anten", value: "2×2+4×4 MU-MIMO" },
    ],
    highlight: false,
  },
];

/* ─── New gen features ────────────────────────────────────────────────────── */
const genFeatures = [
  {
    icon: Radio,
    title: "AI-Driven Radio Yönetimi",
    desc: "Yapay zeka destekli otomatik kanal seçimi, güç ayarı ve parazit önleme ile maksimum kapsama ve performans.",
    color: "#0052ff",
    tags: ["Auto-RRM", "AI Channel", "6 GHz"],
  },
  {
    icon: Lock,
    title: "Zero Trust Güvenlik",
    desc: "Kablosuz ağa bağlanan her cihaz FortiGuard tehdit istihbaratı ile otomatik doğrulanır ve segmente edilir.",
    color: FN_RED,
    tags: ["ZTNA", "802.1X", "Dinamik VLAN"],
  },
  {
    icon: Eye,
    title: "FortiGuard Entegrasyonu",
    desc: "Gerçek zamanlı kablosuz tehdit tespiti, rogue AP engelleme ve WIDS/WIPS ile kablosuz güvenlik duvarı.",
    color: "#7c3aed",
    tags: ["WIPS", "Rogue AP", "FortiGuard AI"],
  },
  {
    icon: Cpu,
    title: "FortiLink Merkezi Yönetim",
    desc: "FortiGate üzerinden tüm FortiAP'ları tek konsoldan yönetin. RF profilleri, SSID politikaları ve firmware güncellemeleri.",
    color: "#059669",
    tags: ["FortiLink", "Zero-Touch", "Otomatik Güncelleme"],
  },
];

/* ─── Comparison table ────────────────────────────────────────────────────── */
const compRows = [
  ["WiFi Standart", "802.11be (WiFi 7)", "802.11be (WiFi 7)", "802.11ax (WiFi 6E)"],
  ["Max Hız", "11.5 Gbps", "17.3 Gbps", "7.3 Gbps"],
  ["Frekans Bantları", "Tri-band (2.4/5/6)", "Tri-band (2.4/5/6)", "Tri-band (2.4/5/6)"],
  ["Spatial Streams", "4×4 MU-MIMO", "4×4+4×4 MU-MIMO", "2×2+4×4 MU-MIMO"],
  ["OFDMA", "DL/UL", "DL/UL", "DL/UL"],
  ["IoT Radyo", "BLE 5.0", "BLE 5.0 + Zigbee", "BLE 5.0"],
  ["PoE Standart", "802.3bt (PoE++)", "802.3bt (PoE++)", "802.3at (PoE+)"],
  ["Hedef Kullanım", "Kurumsal İç Mekan", "Kampüs / Yoğun Alan", "Ekonomik / Ofis"],
];

export default function FortiAPPage() {
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
        <div
          className="absolute top-0 right-1/4 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, rgba(0,82,255,0.12) 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[400px] h-[300px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, ${FN_RED}10 0%, transparent 70%)`,
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
                <span style={{ color: FN_RED }}>FortiAP</span>
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
                <Wifi className="w-3.5 h-3.5" />
                WiFi 7 — En Yeni Nesil Kablosuz
              </div>

              <h1
                className="text-5xl md:text-6xl font-black mb-6 leading-tight"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Wi-Fi 7 Devrimi
                <br />
                <span style={{ color: FN_RED }}>FortiAP ile Başlıyor</span>
              </h1>

              <p
                className="text-lg md:text-xl mb-8 max-w-xl leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                FortiAP, yapay zeka destekli radyo yönetimi ve Zero Trust güvenliği ile kurumsal
                kablosuz ağınızı bir üst seviyeye taşır. 17.3 Gbps'e kadar hız, tri-band 6 GHz destek.
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
                  href={`/${locale}/fortinet/fortiswitch`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:bg-white/10"
                  style={{
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "var(--color-on-surface-variant)",
                    fontFamily: "var(--font-family-label)",
                  }}
                >
                  FortiSwitch ile Birleştir
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                {[
                  { v: "17.3 Gbps", l: "Maks. Hız (WiFi 7)" },
                  { v: "6 GHz", l: "Tri-Band Destek" },
                  { v: "AI-RRM", l: "Akıllı Radyo Yönetimi" },
                  { v: "Zero Trust", l: "Kablosuz Güvenlik" },
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

            {/* Hero visual */}
            <div className="hidden lg:flex justify-center">
              <div
                className="relative w-80 h-80 rounded-full flex items-center justify-center circuit-pattern"
                style={{
                  backgroundColor: "#0f1315",
                  border: `2px solid ${FN_RED}20`,
                  boxShadow: `0 0 60px ${FN_RED}15, 0 0 120px rgba(0,82,255,0.1)`,
                }}
              >
                {/* Center icon */}
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center"
                  style={{
                    background: `radial-gradient(circle, ${FN_RED}30 0%, ${FN_RED}10 100%)`,
                    border: `2px solid ${FN_RED}40`,
                  }}
                >
                  <Wifi className="w-14 h-14" style={{ color: FN_RED }} />
                </div>

                {/* Orbit rings */}
                <div
                  className="absolute inset-6 rounded-full border animate-pulse"
                  style={{ borderColor: `${FN_RED}15` }}
                />
                <div
                  className="absolute inset-12 rounded-full border"
                  style={{ borderColor: "rgba(0,82,255,0.2)" }}
                />

                {/* Floating labels */}
                {[
                  { label: "WiFi 7", top: "8%", left: "50%", color: FN_RED },
                  { label: "6 GHz", top: "50%", left: "92%", color: "#60a5fa" },
                  { label: "MU-MIMO", top: "88%", left: "50%", color: "#a78bfa" },
                  { label: "AI-RRM", top: "50%", left: "5%", color: "#34d399" },
                ].map((node) => (
                  <div
                    key={node.label}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                    style={{
                      top: node.top,
                      left: node.left,
                      backgroundColor: `${node.color}15`,
                      border: `1px solid ${node.color}30`,
                      color: node.color,
                      fontFamily: "var(--font-family-label)",
                    }}
                  >
                    {node.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NEW GEN FEATURES ─────────────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <div
            className="text-xs font-bold mb-3 uppercase tracking-widest"
            style={{ color: FN_RED, fontFamily: "var(--font-family-label)" }}
          >
            Yeni Nesil Güvenli Altyapı
          </div>
          <h2
            className="text-3xl md:text-4xl font-black"
            style={{ fontFamily: "var(--font-family-headline)" }}
          >
            Akıllı Kablosuz Güvenlik Özellikleri
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {genFeatures.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="p-6 rounded-2xl card-glow"
                style={{
                  backgroundColor: `${f.color}06`,
                  border: `1px solid ${f.color}18`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${f.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: f.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base mb-2" style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-family-headline)" }}>
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--color-on-surface-variant)" }}>
                      {f.desc}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {f.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded font-bold"
                          style={{
                            backgroundColor: `${f.color}15`,
                            color: f.color,
                            border: `1px solid ${f.color}25`,
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
            );
          })}
        </div>
      </section>

      {/* ─── PRODUCT PORTFOLIO ────────────────────────────────────────────── */}
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
              Ürün Portföyü
            </div>
            <h2
              className="text-3xl md:text-4xl font-black"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              FortiAP Modelleri
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {apProducts.map((ap) => (
              <div
                key={ap.name}
                className="p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: ap.highlight ? `${FN_RED}08` : "rgba(255,255,255,0.03)",
                  border: ap.highlight ? `1px solid ${FN_RED}30` : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: ap.highlight ? `0 0 30px ${FN_RED}10` : "none",
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div
                      className="text-xs font-bold mb-1"
                      style={{ color: ap.badgeColor, fontFamily: "var(--font-family-label)" }}
                    >
                      {ap.badge}
                    </div>
                    <h3
                      className="text-xl font-black"
                      style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
                    >
                      {ap.name}
                    </h3>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${ap.badgeColor}15` }}
                  >
                    <Wifi className="w-5 h-5" style={{ color: ap.badgeColor }} />
                  </div>
                </div>

                <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                  {ap.desc}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {ap.specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="p-2.5 rounded-xl"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="text-[10px] mb-0.5" style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}>
                        {spec.label}
                      </div>
                      <div className="text-xs font-bold" style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-family-label)" }}>
                        {spec.value}
                      </div>
                    </div>
                  ))}
                </div>

                {ap.highlight && (
                  <div
                    className="mt-4 text-center py-2 rounded-xl text-xs font-bold"
                    style={{
                      backgroundColor: `${FN_RED}18`,
                      color: FN_RED,
                      border: `1px solid ${FN_RED}30`,
                      fontFamily: "var(--font-family-label)",
                    }}
                  >
                    ★ En Çok Tercih Edilen
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPARISON TABLE ─────────────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-6">
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
            Model Karşılaştırması
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "rgba(238,49,36,0.08)", borderBottom: "1px solid rgba(238,49,36,0.2)" }}>
                {["Özellik", "FortiAP 231K", "FortiAP 432K", "FortiAP 234K"].map((h, i) => (
                  <th
                    key={h}
                    className="px-5 py-4 text-left font-bold"
                    style={{
                      color: i === 2 ? FN_RED : i === 0 ? "var(--color-outline)" : "var(--color-on-surface)",
                      fontFamily: "var(--font-family-label)",
                    }}
                  >
                    {h}
                    {i === 2 && (
                      <span
                        className="ml-2 text-[10px] px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${FN_RED}20`, color: FN_RED }}
                      >
                        Önerilen
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compRows.map((row, ri) => (
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
                        color: ci === 0 ? "var(--color-outline)" : ci === 2 ? "#fca5a5" : "var(--color-on-surface-variant)",
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
      </section>

      {/* ─── WHY LIDER ────────────────────────────────────────────────────── */}
      <section
        className="py-16"
        style={{ backgroundColor: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
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
                Kablosuz Ağda
                <br />
                <span style={{ color: FN_RED }}>Güvenilir Çözüm Ortağı</span>
              </h2>
              <div className="space-y-4">
                {[
                  "Fortinet NSE sertifikalı kablosuz ağ uzmanları",
                  "RF site survey ve kapsama alanı optimizasyonu",
                  "FortiGate + FortiAP + FortiSwitch bütünleşik tasarım",
                  "Zero-touch provisioning ile hızlı devreye alma",
                  "7/24 uzaktan izleme ve müdahale",
                  "2006'dan bu yana kurumsal WiFi deneyimi",
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

            {/* Stats card */}
            <div
              className="rounded-2xl p-8 circuit-pattern"
              style={{
                backgroundColor: "#0f1315",
                border: "1px solid rgba(0,82,255,0.2)",
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  { v: "WiFi 7", l: "En Yeni Standart", color: FN_RED },
                  { v: "17.3 Gbps", l: "Maks. Bant Genişliği", color: "#60a5fa" },
                  { v: "6 GHz", l: "Tri-Band Destek", color: "#a78bfa" },
                  { v: "AI-RRM", l: "Akıllı Radyo", color: "#34d399" },
                  { v: "Zero Trust", l: "Kablosuz Güvenlik", color: "#f59e0b" },
                  { v: "7/24", l: "İzleme & Destek", color: FN_RED },
                ].map((s) => (
                  <div
                    key={s.v}
                    className="p-4 rounded-xl text-center"
                    style={{
                      backgroundColor: `${s.color}08`,
                      border: `1px solid ${s.color}20`,
                    }}
                  >
                    <div className="text-xl font-black mb-1" style={{ color: s.color, fontFamily: "var(--font-family-headline)" }}>
                      {s.v}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}>
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
          background: `linear-gradient(135deg, ${FN_RED}15, rgba(0,82,255,0.12))`,
          borderTop: `1px solid ${FN_RED}20`,
        }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div
            className="text-xs font-bold mb-4 uppercase tracking-widest"
            style={{ color: FN_RED, fontFamily: "var(--font-family-label)" }}
          >
            Fortinet Yetkili Partner
          </div>
          <h2
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ fontFamily: "var(--font-family-headline)" }}
          >
            Ağınızı Güvene Almaya
            <br />
            <span style={{ color: FN_RED }}>Hazır mısınız?</span>
          </h2>
          <p
            className="text-base mb-8 max-w-xl mx-auto"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            FortiAP WiFi 7 çözümleri için ücretsiz RF site survey ve kapsama analizi alın.
            NSE sertifikalı kablosuz ağ uzmanlarımız en kısa sürede dönüş yapar.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={`/${locale}/iletisim`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${FN_RED}, ${FN_DARK})`,
                fontFamily: "var(--font-family-label)",
                boxShadow: `0 0 24px ${FN_RED}40`,
              }}
            >
              <Zap className="w-4 h-4" />
              Ücretsiz Analiz Al
            </Link>
            <Link
              href={`/${locale}/fortinet/fortiswitch`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all hover:bg-white/10"
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                color: "var(--color-on-surface-variant)",
                fontFamily: "var(--font-family-label)",
              }}
            >
              FortiSwitch Çözümleri
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
