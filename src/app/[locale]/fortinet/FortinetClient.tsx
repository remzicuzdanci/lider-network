"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import {
  Shield,
  Lock,
  Cloud,
  BarChart3,
  Mail,
  Settings,
  Zap,
  Award,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ProductCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  products: string[];
}

/* ─── Constants ───────────────────────────────────────────────────────────── */

/* Official Fortinet product images from fortinet.com CDN */
const IMG_DC   = "https://www.fortinet.com/content/dam/fortinet/images/icons/ngfw/img-model-data-center.png";
const IMG_ENT  = "https://www.fortinet.com/content/dam/fortinet/images/icons/ngfw/img-model-campus.png";
const IMG_SMB  = "https://www.fortinet.com/content/dam/fortinet/images/icons/ngfw/img-model-branch.png";

const productCards: ProductCard[] = [
  {
    title: "Network Security",
    description: "FortiGate NGFW, SD-WAN, FortiSwitch ve Wireless Access Points.",
    icon: Shield,
    products: ["FORTIGATE", "FORTIAP", "FORTISWITCH"],
  },
  {
    title: "Endpoint & Access",
    description: "Uç nokta koruması, EDR/MDR ve Sıfır Güven (Zero Trust) erişimi.",
    icon: Lock,
    products: ["FORTICLIENT", "FORTINAC", "FORTIEDR"],
  },
  {
    title: "Cloud Security",
    description: "AWS, Azure ve GCP için bulut tabanlı güvenlik ve SASE çözümleri.",
    icon: Cloud,
    products: ["FORTIWEB", "FORTICASB", "FORTISASE"],
  },
  {
    title: "SecOps",
    description: "Yapay zeka destekli log analizi, olay yönetimi ve otomasyon.",
    icon: BarChart3,
    products: ["FORTISIEM", "FORTISOAR", "FORTIANALYZER"],
  },
  {
    title: "Email Security",
    description: "Gelişmiş tehdit koruması, spam filtreleme ve veri kaybı önleme.",
    icon: Mail,
    products: ["FORTIMAIL"],
  },
  {
    title: "OT Security",
    description: "Endüstriyel kontrol sistemleri ve kritik altyapılar için koruma.",
    icon: Settings,
    products: ["RUGGED SERIES"],
  },
  {
    title: "DDoS/DC",
    description: "Veri merkezi trafiği koruması ve yüksek hacimli saldırı engelleme.",
    icon: Zap,
    products: ["FORTIDDOS"],
  },
  {
    title: "Services & Licenses",
    description: "FortiGuard abonelikleri ve profesyonel destek hizmetleri.",
    icon: Award,
    products: ["FORTICARE"],
  },
];

const comparisonRows: Array<{
  spec: string;
  f40: string;
  f60: string;
  f100: string;
  f200: string;
  highlight?: boolean;
}> = [
  { spec: "Firewall Throughput", f40: "5 Gbps", f60: "10 Gbps", f100: "20 Gbps", f200: "27 Gbps" },
  { spec: "NGFW Throughput", f40: "600 Mbps", f60: "1 Gbps", f100: "1.6 Gbps", f200: "3 Gbps" },
  { spec: "Threat Protection", f40: "600 Mbps", f60: "700 Mbps", f100: "1 Gbps", f200: "2 Gbps" },
  { spec: "VPN (IPsec)", f40: "4.4 Gbps", f60: "6.5 Gbps", f100: "11.5 Gbps", f200: "13 Gbps" },
  { spec: "Max Oturum", f40: "700K", f60: "1.3M", f100: "2M", f200: "3M" },
  { spec: "Yeni Oturum/sn", f40: "35K", f60: "45K", f100: "56K", f200: "100K" },
  {
    spec: "Kullanım Alanı",
    f40: "Küçük Ofis",
    f60: "KOBİ",
    f100: "Kurumsal Şube",
    f200: "Büyük İşletme",
    highlight: true,
  },
];

/* ─── Form schema ─────────────────────────────────────────────────────────── */

const contactSchema = z.object({
  name: z.string().min(2, "En az 2 karakter giriniz"),
  email: z.string().email("Geçerli bir e-posta giriniz"),
  message: z.string().min(10, "En az 10 karakter giriniz"),
});

type ContactFormData = z.infer<typeof contactSchema>;

/* ─── JSON-LD ─────────────────────────────────────────────────────────────── */

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "FortiGate NGFW",
  brand: { "@type": "Brand", name: "Fortinet" },
  description:
    "Yapay zeka destekli güvenlik hizmetleri ve hibrit ağ mimarileri için optimize edilmiş FortiGate NGFW çözümleri.",
  offers: {
    "@type": "Offer",
    seller: { "@type": "Organization", name: "Lider Network" },
  },
};

/* ─── Hero ───────────────────────────────────────────────────────────────── */

const FN_RED = "#EE3124";

const heroStats = [
  { value: "#1", sub: "Küresel NGFW", label: "Dünya Lideri" },
  { value: "%50+", sub: "Pazar Payı", label: "Deployed Firewall" },
  { value: "13 Yıl", sub: "Gartner MQ", label: "Üst Üste Lider" },
  { value: "%91", sub: "Tavsiye Oranı", label: "Gartner Peer Insights" },
];

function HeroSection() {
  return (
    <section
      className="circuit-bg relative overflow-hidden pt-32 pb-0"
      aria-labelledby="fortinet-hero-title"
    >
      {/* Red left glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: `radial-gradient(ellipse 45% 60% at 0% 40%, ${FN_RED}18 0%, transparent 65%)`,
        }}
      />

      <div className="container relative z-10">
        <div className="flex flex-col lg:flex-row items-start gap-12 pb-16">
          {/* Left */}
          <div className="flex-1 min-w-0 pt-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: `${FN_RED}12`,
                  border: `1px solid ${FN_RED}35`,
                }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: FN_RED }} />
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: FN_RED, fontFamily: "var(--font-family-label)" }}
                >
                  Fortinet Yetkili Partner
                </span>
              </div>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: "rgba(34,197,94,0.10)",
                  border: "1px solid rgba(34,197,94,0.25)",
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e" }} />
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#22c55e", fontFamily: "var(--font-family-label)" }}
                >
                  Gartner Magic Quadrant Leader
                </span>
              </div>
            </div>

            {/* H1 */}
            <h1
              id="fortinet-hero-title"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 leading-tight"
              style={{ color: "var(--color-on-surface)" }}
            >
              Fortinet{" "}
              <span style={{ color: FN_RED }}>FortiGate</span>
              <br />
              <span style={{ color: "var(--color-primary)" }}>
                Yeni Nesil Güvenlik
              </span>
            </h1>

            <p
              className="text-base sm:text-lg mb-8 max-w-xl leading-relaxed"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              AI destekli FortiGuard threat intelligence ve patentli ASIC işlemcilerle
              güçlendirilen FortiGate NGFW — ağınızı veri merkezinden uzak ofise,
              buluttan OT ortamlarına kadar her noktada koruma altına alır.
            </p>

            {/* Feature chips */}
            <div className="flex flex-wrap gap-2 mb-8">
              {["AI-Powered IPS", "SSL/TLS İncelemesi", "SD-WAN Entegre", "Zero Trust", "FortiGuard Aboneliği"].map((f) => (
                <span
                  key={f}
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(141,144,162,0.2)",
                    color: "var(--color-on-surface-variant)",
                    fontFamily: "var(--font-family-label)",
                  }}
                >
                  {f}
                </span>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3">
              <a
                href="#iletisim"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm text-white transition-all duration-200 hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${FN_RED} 0%, #C8102E 100%)`,
                  fontFamily: "var(--font-family-label)",
                  boxShadow: `0 4px 20px ${FN_RED}40`,
                }}
              >
                <Zap className="w-4 h-4" />
                Ücretsiz Analiz İsteyin
              </a>
              <a
                href="#tam-portfoy"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:bg-white/5"
                style={{
                  border: "1px solid var(--color-outline-variant)",
                  color: "var(--color-on-surface)",
                  fontFamily: "var(--font-family-label)",
                }}
              >
                Ürün Portföyü
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right — hardware images stacked */}
          <div className="flex-1 flex flex-col items-center gap-4 relative pt-4">
            {/* Glow */}
            <div
              className="absolute inset-0 blur-3xl pointer-events-none"
              aria-hidden="true"
              style={{
                background: `radial-gradient(ellipse at center, ${FN_RED}18 0%, transparent 70%)`,
              }}
            />

            {/* Enterprise: FortiGate 601F */}
            <div className="relative z-10 w-full">
              <div
                className="text-[10px] font-semibold mb-1.5 ml-1"
                style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
              >
                ENTERPRISE — FortiGate 600F Serisi
              </div>
              <div
                className="rounded-xl overflow-hidden p-3"
                style={{
                  backgroundColor: "#f8f8f8",
                  border: `1px solid ${FN_RED}25`,
                }}
              >
                <Image
                  src={IMG_ENT}
                  alt="FortiGate 601F — Enterprise NGFW"
                  width={560}
                  height={120}
                  unoptimized
                  priority
                  className="w-full object-contain"
                />
              </div>
            </div>

            {/* Data Center: Large chassis */}
            <div className="relative z-10 w-full">
              <div
                className="text-[10px] font-semibold mb-1.5 ml-1"
                style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
              >
                DATA CENTER — FortiGate 7000 Serisi
              </div>
              <div
                className="rounded-xl overflow-hidden p-3"
                style={{
                  backgroundColor: "#f8f8f8",
                  border: `1px solid ${FN_RED}20`,
                }}
              >
                <Image
                  src={IMG_DC}
                  alt="FortiGate 7000 — Data Center Chassis"
                  width={560}
                  height={140}
                  unoptimized
                  className="w-full object-contain"
                />
              </div>
            </div>

            {/* SMB: FortiGate 71F */}
            <div className="relative z-10 w-full">
              <div
                className="text-[10px] font-semibold mb-1.5 ml-1"
                style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
              >
                SMB / ŞUBE OFİS — FortiGate 70F Serisi
              </div>
              <div
                className="rounded-xl overflow-hidden p-3"
                style={{
                  backgroundColor: "#f8f8f8",
                  border: `1px solid ${FN_RED}20`,
                }}
              >
                <Image
                  src={IMG_SMB}
                  alt="FortiGate 71F — SMB & Branch Office"
                  width={560}
                  height={100}
                  unoptimized
                  className="w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-px mb-0"
          style={{ backgroundColor: "var(--color-outline-variant)" }}
        >
          {heroStats.map((s) => (
            <div
              key={s.value}
              className="flex flex-col items-center justify-center gap-1 py-6 px-4 text-center"
              style={{ backgroundColor: "var(--color-background)" }}
            >
              <div
                className="text-2xl font-black"
                style={{ fontFamily: "var(--font-family-headline)", color: FN_RED }}
              >
                {s.value}
              </div>
              <div
                className="text-xs font-semibold"
                style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-family-label)" }}
              >
                {s.sub}
              </div>
              <div className="text-[10px]" style={{ color: "var(--color-outline)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Product Portfolio ──────────────────────────────────────────────────── */

function ProductPortfolio() {
  return (
    <section className="py-20" aria-labelledby="portfolio-title">
      <div className="container">
        <h2
          id="portfolio-title"
          className="text-3xl font-bold mb-2"
          style={{ color: "var(--color-on-surface)" }}
        >
          Fortinet Ürün Portföyü
        </h2>
        <p
          className="text-sm mb-10"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          Uçtan uca güvenlik ekosistemi
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {productCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className="p-5 rounded-xl transition-all duration-200 cursor-default"
                style={{
                  backgroundColor: "#1d2022",
                  border: "1px solid rgba(141, 144, 162, 0.2)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(0, 82, 255, 0.50)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(141, 144, 162, 0.2)";
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: "rgba(0, 82, 255, 0.12)",
                    border: "1px solid rgba(0, 82, 255, 0.25)",
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: "var(--color-primary)" }}
                  />
                </div>

                <h3
                  className="text-sm font-bold mb-2"
                  style={{
                    color: "var(--color-on-surface)",
                    fontFamily: "var(--font-family-headline)",
                  }}
                >
                  {card.title}
                </h3>
                <p
                  className="text-xs leading-relaxed mb-4"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  {card.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {card.products.map((p) => (
                    <span
                      key={p}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "rgba(183, 196, 255, 0.08)",
                        color: "var(--color-primary)",
                        border: "1px solid rgba(183, 196, 255, 0.15)",
                        fontFamily: "var(--font-family-label)",
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Full Product Family ─────────────────────────────────────────────────── */

const fullProductFamilies = [
  {
    category: "Güvenlik Duvarı / Firewall Çözümleri",
    color: "#EE3124",
    products: [
      { name: "FortiGate", desc: "Next Generation Firewall (NGFW)" },
      { name: "FortiGate Rugged", desc: "Endüstriyel / OT Firewall" },
      { name: "FortiWiFi", desc: "Dahili Wi-Fi özellikli firewall" },
      { name: "FortiGate VM", desc: "Sanal firewall çözümleri" },
      { name: "FortiGate CNF", desc: "Cloud-native firewall" },
    ],
  },
  {
    category: "Switch Çözümleri",
    color: "#EE3124",
    products: [
      { name: "FortiSwitch", desc: "Managed Switch ailesi" },
      { name: "FortiSwitch Rugged", desc: "Endüstriyel switch çözümleri" },
    ],
  },
  {
    category: "Kablosuz Ağ / Wireless Çözümleri",
    color: "#C8102E",
    products: [
      { name: "FortiAP", desc: "Access Point çözümleri" },
      { name: "FortiExtender", desc: "LTE / 5G WAN çözümleri" },
    ],
  },
  {
    category: "Merkezi Yönetim ve Loglama",
    color: "#0052ff",
    products: [
      { name: "FortiManager", desc: "Merkezi cihaz yönetimi" },
      { name: "FortiAnalyzer", desc: "Log yönetimi ve raporlama" },
      { name: "FortiMonitor", desc: "Sistem ve performans izleme" },
      { name: "FortiPortal", desc: "MSSP müşteri portalı" },
    ],
  },
  {
    category: "Endpoint ve İstemci Güvenliği",
    color: "#7c3aed",
    products: [
      { name: "FortiClient", desc: "Endpoint Security & VPN" },
      { name: "FortiEDR", desc: "EDR çözümü" },
      { name: "FortiXDR", desc: "XDR platformu" },
      { name: "FortiSASE", desc: "SASE çözümü" },
      { name: "FortiCASB", desc: "CASB çözümü" },
      { name: "FortiIsolator", desc: "Browser isolation çözümü" },
    ],
  },
  {
    category: "NAC ve Zero Trust",
    color: "#0891b2",
    products: [
      { name: "FortiNAC", desc: "NAC çözümü" },
      { name: "FortiAuthenticator", desc: "Kimlik doğrulama / MFA" },
      { name: "FortiToken", desc: "MFA token çözümleri" },
      { name: "FortiPAM", desc: "PAM çözümü" },
      { name: "FortiTrust Identity", desc: "Identity Security" },
    ],
  },
  {
    category: "E-posta ve Veri Güvenliği",
    color: "#059669",
    products: [
      { name: "FortiMail", desc: "Mail güvenliği" },
      { name: "FortiDLP", desc: "Veri sızıntısı önleme" },
      { name: "FortiWeb", desc: "WAF çözümü" },
      { name: "FortiADC", desc: "ADC / Load Balancer" },
    ],
  },
  {
    category: "SIEM / SOC / Operasyon",
    color: "#d97706",
    products: [
      { name: "FortiSIEM", desc: "SIEM çözümü" },
      { name: "FortiSOAR", desc: "SOAR platformu" },
      { name: "FortiAI", desc: "Yapay zeka destekli güvenlik" },
      { name: "FortiRecon", desc: "Attack surface monitoring" },
      { name: "FortiDeceptor", desc: "Deception security" },
    ],
  },
  {
    category: "DDoS ve Veri Merkezi Güvenliği",
    color: "#dc2626",
    products: [
      { name: "FortiDDoS", desc: "DDoS koruma" },
      { name: "FortiSandbox", desc: "Sandbox analizi" },
      { name: "FortiProxy", desc: "Secure Web Gateway" },
      { name: "FortiWAN", desc: "WAN optimizasyonu" },
    ],
  },
  {
    category: "OT / Endüstriyel Güvenlik",
    color: "#78716c",
    products: [
      { name: "FortiSRA", desc: "Secure Remote Access" },
      { name: "FortiSwitch Rugged", desc: "Endüstriyel switch" },
      { name: "FortiGate Rugged", desc: "Endüstriyel firewall" },
      { name: "FortiNDR", desc: "Network Detection & Response" },
    ],
  },
  {
    category: "Bulut Güvenliği",
    color: "#0ea5e9",
    products: [
      { name: "FortiCNAPP", desc: "Cloud-Native Application Protection" },
      { name: "FortiCNP", desc: "Cloud Native Protection" },
      { name: "FortiDevSec", desc: "DevSecOps entegrasyonu" },
    ],
  },
  {
    category: "Servisler ve Lisanslar",
    color: "#22c55e",
    products: [
      { name: "FortiGuard Services", desc: "Threat Intelligence abonelikleri" },
      { name: "FortiCare", desc: "Profesyonel destek ve bakım" },
      { name: "FortiCloud", desc: "Bulut tabanlı yönetim portalı" },
    ],
  },
];

function FullProductFamily() {
  return (
    <section
      id="tam-portfoy"
      className="py-20"
      style={{ backgroundColor: "rgba(16,20,21,0.95)" }}
      aria-labelledby="full-product-title"
    >
      <div className="container">
        {/* Header */}
        <div className="mb-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 tracking-widest uppercase"
            style={{
              backgroundColor: "rgba(255, 60, 0, 0.10)",
              border: "1px solid rgba(255, 60, 0, 0.25)",
              color: "#EE3124",
              fontFamily: "var(--font-family-label)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#EE3124" }} />
            Tam Portföy
          </div>
          <h2
            id="full-product-title"
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{
              fontFamily: "var(--font-family-headline)",
              color: "var(--color-on-surface)",
            }}
          >
            Fortinet Ürün ve{" "}
            <span style={{ color: "#EE3124" }}>Çözüm Aileleri</span>
          </h2>
          <p
            className="text-base max-w-2xl"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            Fortinet Security Fabric platformunun tam ekosistemi — ağ güvenliğinden
            bulut korumasına, endpoint&apos;ten OT güvenliğine tüm bileşenler.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {fullProductFamilies.map((family) => (
            <article
              key={family.category}
              className="p-5 rounded-xl transition-all duration-200"
              style={{
                backgroundColor: "var(--color-surface)",
                border: `1px solid rgba(141,144,162,0.18)`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${family.color}40`;
                (e.currentTarget as HTMLElement).style.backgroundColor = `${family.color}06`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(141,144,162,0.18)";
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface)";
              }}
            >
              {/* Category header */}
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: family.color }}
                />
                <h3
                  className="text-xs font-bold tracking-wide uppercase"
                  style={{
                    color: family.color,
                    fontFamily: "var(--font-family-label)",
                  }}
                >
                  {family.category}
                </h3>
              </div>

              {/* Products */}
              <ul className="flex flex-col gap-2" role="list">
                {family.products.map((p) => (
                  <li key={p.name} className="flex items-start gap-2.5">
                    <div
                      className="w-1 h-1 rounded-full mt-2 shrink-0"
                      style={{ backgroundColor: family.color, opacity: 0.6 }}
                    />
                    <div>
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color: "var(--color-on-surface)",
                          fontFamily: "var(--font-family-label)",
                        }}
                      >
                        {p.name}
                      </span>
                      <span
                        className="text-xs ml-1.5"
                        style={{ color: "var(--color-outline)" }}
                      >
                        — {p.desc}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className="mt-10 p-6 rounded-2xl text-center"
          style={{
            backgroundColor: "rgba(255,60,0,0.06)",
            border: "1px solid rgba(255,60,0,0.18)",
          }}
        >
          <p
            className="text-sm mb-4"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            Projenize uygun Fortinet çözümünü birlikte belirleyelim.
            NSE sertifikalı mühendislerimiz sizin için analiz yapsın.
          </p>
          <a
            href="#iletisim"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm text-white transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: "#EE3124",
              fontFamily: "var(--font-family-label)",
              boxShadow: "0 4px 20px rgba(255,60,0,0.30)",
            }}
          >
            Ücretsiz Fortinet Değerlendirmesi Al
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── Bento Grid ─────────────────────────────────────────────────────────── */

function BentoGrid() {
  return (
    <section className="py-12" aria-labelledby="bento-title">
      <div className="container">
        <h2
          id="bento-title"
          className="text-2xl font-bold mb-8"
          style={{ color: "var(--color-on-surface)" }}
        >
          Fortinet Ürün Detayları
        </h2>

        {/* Row 1 */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          {/* FortiGate NGFW – col-span-8 */}
          <article
            className="col-span-12 lg:col-span-8 p-6 rounded-xl transition-all duration-200 cursor-default"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid rgba(67, 70, 86, 0.30)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(183, 196, 255, 0.50)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(67, 70, 86, 0.30)";
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-widest"
                style={{
                  backgroundColor: "rgba(0, 82, 255, 0.12)",
                  color: "var(--color-primary)",
                  border: "1px solid rgba(0, 82, 255, 0.30)",
                  fontFamily: "var(--font-family-label)",
                }}
              >
                Endüstri Standardı
              </span>
            </div>

            <h3
              className="text-xl font-bold mb-4"
              style={{ color: "var(--color-on-surface)" }}
            >
              FortiGate NGFW
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                "Derin Paket İncelemesi",
                "SSL/TLS Denetimi",
                "Uygulama Kontrolü",
                "Saldırı Önleme (IPS)",
              ].map((feat) => (
                <div
                  key={feat}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  <CheckCircle2
                    className="w-4 h-4 shrink-0"
                    style={{ color: "var(--color-primary)" }}
                  />
                  {feat}
                </div>
              ))}
            </div>

            <a
              href="#"
              className="inline-flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{
                color: "var(--color-primary)",
                fontFamily: "var(--font-family-label)",
              }}
            >
              Detayları İncele <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </article>

          {/* Rugged Series – col-span-4 */}
          <article
            className="col-span-12 lg:col-span-4 p-6 rounded-xl"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid rgba(67, 70, 86, 0.30)",
            }}
          >
            <h3
              className="text-lg font-bold mb-3"
              style={{ color: "var(--color-on-surface)" }}
            >
              Rugged Serisi
            </h3>
            <p
              className="text-sm leading-relaxed mb-5"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Zorlu endüstriyel ortamlar ve OT güvenliği için tasarlanmış
              dayanıklı donanımlar.
            </p>

            <div
              className="mb-2 flex justify-between text-xs"
              style={{ color: "var(--color-outline)" }}
            >
              <span>Isı Dayanımı</span>
              <span>-40°C to +75°C</span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden mb-5"
              style={{ backgroundColor: "var(--color-outline-variant)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: "85%",
                  backgroundColor: "var(--color-primary-container)",
                }}
              />
            </div>

            <a
              href="#"
              className="inline-flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{
                color: "var(--color-primary)",
                fontFamily: "var(--font-family-label)",
              }}
            >
              OT Çözümleri <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </article>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-12 gap-4">
          {/* FortiGate VM & CNF – col-span-6 */}
          <article
            className="col-span-12 lg:col-span-6 p-6 rounded-xl"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid rgba(67, 70, 86, 0.30)",
            }}
          >
            <h3
              className="text-lg font-bold mb-3"
              style={{ color: "var(--color-on-surface)" }}
            >
              FortiGate VM &amp; CNF
            </h3>
            <p
              className="text-sm leading-relaxed mb-5"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Bulut tabanlı iş yüklerinizi korumak için sanallaştırılmış (VM)
              veya konteyner tabanlı (CNF) güvenlik çözümleri. AWS, Azure ve
              Google Cloud uyumlu.
            </p>
            <div className="flex flex-wrap gap-2">
              {["API Entegrasyonu", "Otomasyon Hazır"].map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: "rgba(183, 196, 255, 0.08)",
                    color: "var(--color-primary)",
                    border: "1px solid rgba(183, 196, 255, 0.18)",
                    fontFamily: "var(--font-family-label)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>

          {/* Security Fabric – col-span-6 */}
          <article
            className="col-span-12 lg:col-span-6 p-6 rounded-xl flex items-center gap-6 overflow-hidden"
            style={{
              backgroundColor: "rgba(0, 82, 255, 0.10)",
              border: "1px solid rgba(183, 196, 255, 0.20)",
            }}
          >
            <div className="flex-1 min-w-0">
              <h3
                className="text-lg font-bold mb-3"
                style={{ color: "var(--color-on-surface)" }}
              >
                Security Fabric
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Cihazların birbiriyle konuştuğu, tehditlerin anında tüm ağda
                engellendiği tam entegre bir ekosistem.
              </p>
            </div>

            {/* Spinning circle */}
            <div
              className="relative shrink-0 w-20 h-20"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 rounded-full border-2 border-dashed animate-spin"
                style={{
                  borderColor: "rgba(183, 196, 255, 0.35)",
                  animationDuration: "6s",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield
                  className="w-8 h-8"
                  style={{ color: "var(--color-primary)" }}
                />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ─── Comparison Table ───────────────────────────────────────────────────── */

function ComparisonTable() {
  return (
    <section
      id="belgeler"
      className="py-20"
      style={{ backgroundColor: "rgba(16, 20, 21, 0.80)" }}
      aria-labelledby="comparison-title"
    >
      <div className="container">
        <h2
          id="comparison-title"
          className="text-3xl font-bold mb-3"
          style={{ color: "var(--color-on-surface)" }}
        >
          Model Karşılaştırma Tablosu
        </h2>
        <p
          className="text-sm mb-10"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          İhtiyaçlarınıza en uygun donanımı seçmek için teknik verileri
          karşılaştırın.
        </p>

        <div
          className="overflow-x-auto rounded-xl"
          style={{ border: "1px solid var(--color-outline-variant)" }}
        >
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr style={{ backgroundColor: "var(--color-surface)" }}>
                {[
                  "Teknik Özellik",
                  "FortiGate 40F",
                  "FortiGate 60F",
                  "FortiGate 100F",
                  "FortiGate 200F",
                ].map((col, i) => (
                  <th
                    key={col}
                    className="px-5 py-4 text-left font-semibold"
                    style={{
                      color:
                        i === 4
                          ? "var(--color-secondary-container)"
                          : "var(--color-on-surface)",
                      fontFamily: "var(--font-family-label)",
                      borderBottom: "1px solid var(--color-outline-variant)",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr
                  key={row.spec}
                  style={{
                    backgroundColor: row.highlight
                      ? "rgba(183, 196, 255, 0.05)"
                      : idx % 2 === 0
                      ? "transparent"
                      : "rgba(29, 32, 34, 0.50)",
                    borderBottom:
                      idx < comparisonRows.length - 1
                        ? "1px solid rgba(67, 70, 86, 0.40)"
                        : "none",
                  }}
                >
                  <td
                    className="px-5 py-3.5 font-medium"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    {row.spec}
                  </td>
                  <td
                    className="px-5 py-3.5"
                    style={{ color: "var(--color-on-surface)" }}
                  >
                    {row.f40}
                  </td>
                  <td
                    className="px-5 py-3.5"
                    style={{ color: "var(--color-on-surface)" }}
                  >
                    {row.f60}
                  </td>
                  <td
                    className="px-5 py-3.5"
                    style={{ color: "var(--color-on-surface)" }}
                  >
                    {row.f100}
                  </td>
                  <td
                    className="px-5 py-3.5 font-semibold"
                    style={{ color: "var(--color-secondary-container)" }}
                  >
                    {row.f200}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA + Form ─────────────────────────────────────────────────────────── */

function CTASection() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, company: "-" }),
      });
      if (!res.ok) throw new Error("server");
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  };

  return (
    <section
      id="iletisim"
      className="py-20"
      aria-labelledby="cta-title"
    >
      <div className="container">
        <div
          className="relative overflow-hidden rounded-2xl p-8 lg:p-12"
          style={{ backgroundColor: "var(--color-primary-container)" }}
        >
          {/* Ghost icon */}
          <div
            className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 pointer-events-none select-none"
            aria-hidden="true"
          >
            <Shield
              style={{
                width: 280,
                height: 280,
                color: "rgba(255, 255, 255, 0.08)",
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-start">
            {/* Left */}
            <div className="flex-1 min-w-0">
              <h2
                id="cta-title"
                className="text-3xl sm:text-4xl font-bold mb-4 text-white leading-tight"
              >
                Ağ Güvenliğiniz Şansa Bırakılamaz
              </h2>
              <p
                className="text-base mb-8 leading-relaxed"
                style={{ color: "rgba(255, 255, 255, 0.80)" }}
              >
                Uzman ekiplerimizle ağınızı analiz edelim, en uygun Fortinet
                konfigürasyonu birlikte belirleyelim.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#iletisim"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm transition-all duration-200 hover:opacity-90"
                  style={{
                    backgroundColor: "white",
                    color: "var(--color-primary-container)",
                    fontFamily: "var(--font-family-label)",
                  }}
                >
                  Acil Denetim Talebi
                </a>
                <a
                  href="tel:+90"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm text-white transition-all duration-200 hover:bg-white/10"
                  style={{
                    border: "1px solid rgba(255, 255, 255, 0.60)",
                    fontFamily: "var(--font-family-label)",
                  }}
                >
                  Satış Ekibine Ulaşın
                </a>
              </div>
            </div>

            {/* Right – form */}
            <div
              className="w-full lg:w-96 shrink-0 p-6 rounded-xl backdrop-blur-md"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.10)",
                border: "1px solid rgba(255, 255, 255, 0.20)",
              }}
            >
              <h3
                className="text-lg font-bold text-white mb-5"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                Bize Yazın
              </h3>

              {status === "success" ? (
                <div className="text-center py-8">
                  <CheckCircle2
                    className="w-12 h-12 mx-auto mb-3"
                    style={{ color: "#22c55e" }}
                  />
                  <p className="text-white font-semibold text-lg mb-1">
                    Mesajınız iletildi!
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "rgba(255, 255, 255, 0.70)" }}
                  >
                    En kısa sürede size geri döneceğiz.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                  className="flex flex-col gap-4"
                >
                  {/* Ad Soyad */}
                  <div>
                    <input
                      {...register("name")}
                      type="text"
                      placeholder="Ad Soyad"
                      className="w-full text-sm rounded px-4 py-2.5 outline-none transition-colors placeholder:text-white/40 text-white"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.12)",
                        border: errors.name
                          ? "1px solid #ef4444"
                          : "1px solid rgba(255, 255, 255, 0.20)",
                      }}
                    />
                    {errors.name && (
                      <p className="text-xs mt-1" style={{ color: "#fca5a5" }}>
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Kurumsal E-posta */}
                  <div>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="Kurumsal E-posta"
                      className="w-full text-sm rounded px-4 py-2.5 outline-none transition-colors placeholder:text-white/40 text-white"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.12)",
                        border: errors.email
                          ? "1px solid #ef4444"
                          : "1px solid rgba(255, 255, 255, 0.20)",
                      }}
                    />
                    {errors.email && (
                      <p className="text-xs mt-1" style={{ color: "#fca5a5" }}>
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Mesaj */}
                  <div>
                    <textarea
                      {...register("message")}
                      rows={4}
                      placeholder="Mesaj"
                      className="w-full text-sm rounded px-4 py-2.5 outline-none transition-colors resize-none placeholder:text-white/40 text-white"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.12)",
                        border: errors.message
                          ? "1px solid #ef4444"
                          : "1px solid rgba(255, 255, 255, 0.20)",
                      }}
                    />
                    {errors.message && (
                      <p className="text-xs mt-1" style={{ color: "#fca5a5" }}>
                        {errors.message.message}
                      </p>
                    )}
                  </div>

                  {status === "error" && (
                    <p className="text-xs" style={{ color: "#fca5a5" }}>
                      Bir hata oluştu. Lütfen tekrar deneyiniz.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full py-3 rounded font-bold text-sm uppercase tracking-widest text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60 active:scale-95"
                    style={{
                      backgroundColor: "#EE3124",
                      fontFamily: "var(--font-family-label)",
                    }}
                  >
                    {status === "loading" ? "Gönderiliyor..." : "GÖNDER"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Sticky Button ──────────────────────────────────────────────────────── */

function StickyQuoteButton() {
  return (
    <a
      href="#iletisim"
      className="fixed bottom-8 right-8 z-50 inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm text-white shadow-2xl transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95"
      style={{
        backgroundColor: "#ff5e07",
        fontFamily: "var(--font-family-label)",
        boxShadow: "0 8px 32px rgba(255, 94, 7, 0.40)",
      }}
    >
      <Zap className="w-4 h-4" aria-hidden="true" />
      HIZLI TEKLİF
    </a>
  );
}

/* ─── Root export ────────────────────────────────────────────────────────── */

export default function FortinetClient() {
  const locale = useLocale();
  // locale is available for future i18n expansions
  void locale;

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <HeroSection />
      <ProductPortfolio />
      <FullProductFamily />
      <BentoGrid />
      <ComparisonTable />
      <CTASection />
      <StickyQuoteButton />
    </>
  );
}
