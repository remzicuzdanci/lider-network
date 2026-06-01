"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { CheckCircle2, ArrowRight, Zap, Shield, Wifi, Monitor, Lock } from "lucide-react";

/* Fortinet official brand red */
const FN_RED = "#EE3124";
const FN_RED_DARK = "#C8102E";


const fabricNodes = [
  { label: "FortiGate", icon: Shield, top: "10%", left: "50%", size: "lg" },
  { label: "FortiAnalyzer", icon: Monitor, top: "35%", left: "20%", size: "md" },
  { label: "FortiManager", icon: Monitor, top: "35%", left: "80%", size: "md" },
  { label: "FortiSwitch", icon: Wifi, top: "65%", left: "15%", size: "sm" },
  { label: "FortiEDR", icon: Lock, top: "65%", left: "50%", size: "sm" },
  { label: "FortiAP", icon: Wifi, top: "65%", left: "82%", size: "sm" },
];

export default function FortinetHighlight() {
  const locale = useLocale();
  const isTr = locale === "tr";

  const capabilities = isTr
    ? [
        "FortiGate NGFW — Derin Paket İncelemesi & AI Tehdit Analizi",
        "SD-WAN & Zero Trust Network Access (ZTNA)",
        "FortiManager + FortiAnalyzer — Merkezi Yönetim",
        "FortiEDR & FortiSASE — Bulut Tabanlı Uç Nokta Koruması",
        "FortiSwitch + FortiAP — Entegre Ağ Altyapısı",
        "FortiGuard Threat Intelligence — 7/24 Güncelleme",
      ]
    : [
        "FortiGate NGFW — Deep Packet Inspection & AI Threat Analysis",
        "SD-WAN & Zero Trust Network Access (ZTNA)",
        "FortiManager + FortiAnalyzer — Centralised Management",
        "FortiEDR & FortiSASE — Cloud-Based Endpoint Protection",
        "FortiSwitch + FortiAP — Integrated Network Infrastructure",
        "FortiGuard Threat Intelligence — 24/7 Updates",
      ];

  const stats = [
    { value: "#1", label: isTr ? "Küresel NGFW Piyasa Lideri" : "Global NGFW Market Leader" },
    { value: "50%+", label: isTr ? "Küresel Pazar Payı" : "Global Market Share" },
    { value: "NSE", label: isTr ? "Sertifikalı Mühendisler" : "Certified Engineers" },
    { value: "500+", label: isTr ? "Tamamlanan Kurulum" : "Completed Installations" },
  ];

  return (
    <section
      className="relative overflow-hidden py-20 lg:py-28"
      aria-labelledby="fortinet-highlight-title"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Subtle left-side red glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: `radial-gradient(ellipse 50% 65% at -5% 50%, ${FN_RED}14 0%, transparent 65%)`,
        }}
      />
      {/* Faint grid */}
      <div className="absolute inset-0 pointer-events-none circuit-pattern opacity-20" aria-hidden="true" />

      <div className="container relative z-10">
        {/* ── Badge row ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase"
            style={{
              backgroundColor: `${FN_RED}12`,
              border: `1px solid ${FN_RED}35`,
              color: FN_RED,
              fontFamily: "var(--font-family-label)",
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: FN_RED }} />
            {isTr ? "Fortinet Yetkili Partner" : "Fortinet Authorized Partner"}
          </div>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: "rgba(0, 82, 255, 0.08)",
              border: "1px solid rgba(0, 82, 255, 0.20)",
              color: "var(--color-primary)",
              fontFamily: "var(--font-family-label)",
            }}
          >
            <Shield className="w-3 h-3" aria-hidden="true" />
            {isTr ? "NSE Sertifikalı Ekip" : "NSE Certified Team"}
          </div>
        </div>

        {/* ── Main 2-col grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT — Text */}
          <div>
            {/* Brand mark — official Fortinet logo */}
            <div className="mb-6">
              <Image
                src="/Fortinet-logo-rgb-white-red.png"
                alt="Fortinet"
                width={280}
                height={68}
                style={{ objectFit: "contain", display: "block", marginBottom: "8px" }}
                priority
              />
              <div
                className="text-xs font-semibold tracking-[0.35em] uppercase"
                style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
              >
                Security Fabric Platform
              </div>
            </div>

            <h2
              id="fortinet-highlight-title"
              className="text-2xl sm:text-3xl font-bold mb-4 leading-snug"
              style={{
                fontFamily: "var(--font-family-headline)",
                color: "var(--color-on-surface)",
              }}
            >
              {isTr ? (
                <>Türkiye&apos;nin En Kapsamlı{" "}
                <span style={{ color: "var(--color-primary)" }}>FortiGate Partner</span>{" "}
                Deneyimi</>
              ) : (
                <>Turkey&apos;s Most Comprehensive{" "}
                <span style={{ color: "var(--color-primary)" }}>FortiGate Partner</span>{" "}
                Experience</>
              )}
            </h2>

            <p
              className="text-base mb-8 leading-relaxed"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              {isTr
                ? "2006'dan bu yana Fortinet Security Fabric ekosistemini kurumsal müşterilerimize tasarlıyor, kuruyoruz ve yönetiyoruz. NGFW'den SASE'ye, NOC'tan SOC'a tam kapsamlı güvenlik mimarisi."
                : "Since 2006 we design, deploy and manage the Fortinet Security Fabric ecosystem for enterprise clients. Full-scope security architecture from NGFW to SASE, NOC to SOC."}
            </p>

            {/* Capabilities */}
            <ul className="flex flex-col gap-2.5 mb-8" role="list">
              {capabilities.map((cap) => (
                <li
                  key={cap}
                  className="flex items-start gap-2.5 text-sm"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  <CheckCircle2
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: FN_RED }}
                    aria-hidden="true"
                  />
                  {cap}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/${locale}/fortinet`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${FN_RED} 0%, ${FN_RED_DARK} 100%)`,
                  fontFamily: "var(--font-family-label)",
                  boxShadow: `0 4px 20px ${FN_RED}35`,
                }}
              >
                <Zap className="w-4 h-4" aria-hidden="true" />
                {isTr ? "Tüm Fortinet Çözümleri" : "All Fortinet Solutions"}
              </Link>
              <Link
                href={`/${locale}/iletisim`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:bg-white/5"
                style={{
                  border: "1px solid var(--color-outline-variant)",
                  color: "var(--color-on-surface-variant)",
                  fontFamily: "var(--font-family-label)",
                }}
              >
                {isTr ? "Ücretsiz Analiz Al" : "Get Free Analysis"}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* RIGHT — Security Fabric visual */}
          <div className="relative flex items-center justify-center min-h-[380px]" aria-hidden="true">

            {/* Outer ring glow */}
            <div
              className="absolute inset-0 rounded-3xl blur-3xl pointer-events-none"
              style={{ background: `radial-gradient(ellipse at center, ${FN_RED}18 0%, transparent 70%)` }}
            />

            {/* Card backdrop */}
            <div
              className="relative w-full max-w-md h-80 rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "#0f1315",
                border: `1px solid ${FN_RED}28`,
              }}
            >
              {/* Circuit overlay */}
              <div className="absolute inset-0 circuit-pattern opacity-30" />

              {/* Central FortiGate node */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${FN_RED} 0%, ${FN_RED_DARK} 100%)`,
                    boxShadow: `0 0 40px ${FN_RED}50`,
                  }}
                >
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div
                  className="text-sm font-black tracking-wider"
                  style={{ color: FN_RED, fontFamily: "var(--font-family-headline)" }}
                >
                  FortiGate NGFW
                </div>

                {/* Connection lines simulation */}
                <div className="flex items-center gap-2 mt-2">
                  {[
                    { label: "FortiAnalyzer", icon: Monitor },
                    { label: "FortiManager", icon: Monitor },
                    { label: "FortiSwitch", icon: Wifi },
                    { label: "FortiEDR", icon: Lock },
                  ].map(({ label, icon: Icon }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} />
                      <span className="text-[9px] whitespace-nowrap" style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}>
                        {label.replace("Forti", "")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top-right badge */}
              <div
                className="absolute top-4 right-4 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                style={{
                  backgroundColor: `${FN_RED}18`,
                  border: `1px solid ${FN_RED}30`,
                  color: FN_RED,
                  fontFamily: "var(--font-family-label)",
                }}
              >
                Security Fabric
              </div>

              {/* Bottom-left gartner badge */}
              <div
                className="absolute bottom-4 left-4 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  backgroundColor: "rgba(0,82,255,0.12)",
                  border: "1px solid rgba(0,82,255,0.25)",
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-family-label)",
                }}
              >
                {isTr ? "Gartner MQ Leader — 13 yıl üst üste" : "Gartner MQ Leader — 13 consecutive years"}
              </div>
            </div>
          </div>
        </div>

        {/* ── Product chips ─────────────────────────────────────────── */}
        <div className="mt-10 flex flex-wrap gap-2">
          {[
            "FortiGate", "FortiAnalyzer", "FortiManager", "FortiSwitch",
            "FortiAP", "FortiEDR", "FortiSIEM", "FortiSOAR", "FortiSASE", "FortiMail",
          ].map((name, i) => (
            <span
              key={name}
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{
                backgroundColor: i === 0 ? `${FN_RED}14` : "rgba(141,144,162,0.06)",
                border: i === 0 ? `1px solid ${FN_RED}30` : "1px solid rgba(141,144,162,0.18)",
                color: i === 0 ? FN_RED : "var(--color-outline)",
                fontFamily: "var(--font-family-label)",
              }}
            >
              {name}
            </span>
          ))}
          <span
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{
              backgroundColor: "transparent",
              border: "1px dashed rgba(141,144,162,0.25)",
              color: "var(--color-outline)",
              fontFamily: "var(--font-family-label)",
            }}
          >
            {isTr ? "+50 daha →" : "+50 more →"}
          </span>
        </div>

        {/* ── Stats bar ─────────────────────────────────────────────── */}
        <div
          className="mt-8 rounded-2xl p-6 grid grid-cols-2 lg:grid-cols-4 gap-6"
          style={{
            backgroundColor: `${FN_RED}06`,
            border: `1px solid ${FN_RED}16`,
          }}
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div
                className="text-2xl font-black mb-1"
                style={{ fontFamily: "var(--font-family-headline)", color: FN_RED }}
              >
                {s.value}
              </div>
              <div className="text-xs" style={{ color: "var(--color-outline)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
