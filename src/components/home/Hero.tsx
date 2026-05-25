"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import {
  ArrowRight,
  Shield,
  Wifi,
  Server,
  Cloud,
  Monitor,
  Lock,
} from "lucide-react";

const FN_RED = "#EE3124";
const BLUE   = "#0052ff";

export default function Hero() {
  const locale = useLocale();
  const isTr = locale === "tr";
  const [active, setActive] = useState(0);
  const isPaused = useRef(false);

  const slides = [
    {
      bg: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=80",
      badge: isTr ? "Siber Güvenlik" : "Cybersecurity",
      badgeColor: FN_RED,
      headline: isTr ? "Sıfır Güven," : "Zero Trust,",
      headline2: isTr ? "Maksimum Koruma" : "Maximum Protection",
      product: "FortiGate NGFW",
      productIcon: Shield,
      desc: isTr
        ? "Dünyanın #1 NGFW çözümüyle ağınızı uçtan uca koruyun. AI destekli tehdit tespiti, SD-WAN ve Zero Trust mimarisi."
        : "Protect your network end-to-end with the world's #1 NGFW. AI-powered threat detection, SD-WAN and Zero Trust architecture.",
      stats: [
        { v: "#1", l: "Gartner MQ" },
        { v: isTr ? "13 Yıl" : "13 Years", l: isTr ? "Lider Konum" : "Market Leader" },
        { v: "99.9%", l: isTr ? "Tehdit Tespiti" : "Threat Detection" },
      ],
    },
    {
      bg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1920&q=80",
      badge: isTr ? "Ağ Altyapısı" : "Network Infrastructure",
      badgeColor: BLUE,
      headline: isTr ? "Entegre Ağ," : "Integrated Network,",
      headline2: isTr ? "Akıllı Altyapı" : "Smart Infrastructure",
      product: "FortiSwitch & FortiAP",
      productIcon: Wifi,
      desc: isTr
        ? "FortiLink yönetimli kurumsal switching ve WiFi 7 erişim noktalarıyla ağınızı geleceğe hazırlayın."
        : "Future-proof your network with FortiLink-managed enterprise switching and WiFi 7 access points.",
      stats: [
        { v: "WiFi 7", l: isTr ? "En Yeni Nesil" : "Latest Gen" },
        { v: "308%", l: "ROI" },
        { v: "17.3G", l: isTr ? "Max Hız" : "Max Speed" },
      ],
    },
    {
      bg: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1920&q=80",
      badge: isTr ? "Veri Merkezi" : "Data Center",
      badgeColor: "#7c3aed",
      headline: isTr ? "Enterprise Veri," : "Enterprise Data,",
      headline2: isTr ? "Yüksek Performans" : "High Performance",
      product: isTr ? "Sunucu & Depolama" : "Server & Storage",
      productIcon: Server,
      desc: isTr
        ? "Dell, HP ve Synology iş birliğiyle yüksek erişilebilirlikli veri merkezi ve NAS çözümleri."
        : "High-availability data center and NAS solutions in partnership with Dell, HP and Synology.",
      stats: [
        { v: "99.99%", l: "Uptime" },
        { v: "HA", l: isTr ? "Kümeleme" : "Clustering" },
        { v: "DR", l: isTr ? "Felaket Kurtarma" : "Disaster Recovery" },
      ],
    },
    {
      bg: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80",
      badge: isTr ? "Bulut Çözümleri" : "Cloud Solutions",
      badgeColor: "#059669",
      headline: isTr ? "Hibrit Bulut," : "Hybrid Cloud,",
      headline2: isTr ? "Tam Kontrol" : "Full Control",
      product: "Azure & AWS & SASE",
      productIcon: Cloud,
      desc: isTr
        ? "Microsoft Azure ve AWS altyapısıyla hibrit bulut geçişi, FortiSASE ile bulutta sıfır güven güvenliği."
        : "Hybrid cloud migration with Microsoft Azure and AWS infrastructure, zero-trust cloud security with FortiSASE.",
      stats: [
        { v: "Azure", l: "CSP Partner" },
        { v: "SASE", l: "Fortinet" },
        { v: "Zero", l: "Trust Ready" },
      ],
    },
    {
      bg: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80",
      badge: "SOC & SIEM",
      badgeColor: "#f59e0b",
      headline: isTr ? "Merkezi SOC," : "Central SOC,",
      headline2: isTr ? "Anlık Görünürlük" : "Real-Time Visibility",
      product: "FortiSIEM & FortiSOAR",
      productIcon: Monitor,
      desc: isTr
        ? "FortiAnalyzer, FortiSIEM ve FortiSOAR ile merkezi log yönetimi, yapay zeka tehdit analizi ve otomatik yanıt."
        : "Centralised log management, AI threat analysis and automated response with FortiAnalyzer, FortiSIEM and FortiSOAR.",
      stats: [
        { v: "50K", l: isTr ? "EPS Kapasitesi" : "EPS Capacity" },
        { v: "70%", l: isTr ? "MTTR Azalma" : "MTTR Reduction" },
        { v: "AI", l: isTr ? "Tehdit Analizi" : "Threat Analysis" },
      ],
    },
    {
      bg: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1920&q=80",
      badge: isTr ? "Endpoint Koruması" : "Endpoint Protection",
      badgeColor: "#c026d3",
      headline: isTr ? "Endpoint'ten" : "From Endpoint",
      headline2: isTr ? "Buluta Güvenlik" : "to Cloud Security",
      product: "FortiEDR & FortiClient",
      productIcon: Lock,
      desc: isTr
        ? "FortiEDR ile gerçek zamanlı endpoint koruması, FortiClient ZTNA ile sıfır güven uzaktan erişim."
        : "Real-time endpoint protection with FortiEDR, zero-trust remote access with FortiClient ZTNA.",
      stats: [
        { v: "ZTNA", l: "Zero Trust" },
        { v: "EDR", l: "Endpoint" },
        { v: "7/24", l: isTr ? "İzleme" : "Monitoring" },
      ],
    },
  ];

  useEffect(() => {
    const t = setInterval(() => {
      if (!isPaused.current) {
        setActive((s) => (s + 1) % slides.length);
      }
    }, 5500);
    return () => clearInterval(t);
  }, [slides.length]);

  const slide = slides[active];
  const Icon  = slide.productIcon;
  const color = slide.badgeColor;

  return (
    <section
      className="relative min-h-[90vh] flex items-center pt-24 overflow-hidden"
      aria-label="Hero bölümü"
      onMouseEnter={() => { isPaused.current = true; }}
      onMouseLeave={() => { isPaused.current = false; }}
    >
      {/* ── Background images ───────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        {slides.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: i === active ? 1 : 0 }}
          >
            <Image
              src={s.bg}
              alt={s.product}
              fill
              className="object-cover"
              sizes="100vw"
              priority={i === 0}
            />
          </div>
        ))}

        {/* Strong left-weighted overlay so text is always readable */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,12,14,0.97) 0%, rgba(10,12,14,0.92) 45%, rgba(10,12,14,0.60) 70%, rgba(10,12,14,0.25) 100%)",
          }}
        />
        {/* Subtle circuit pattern */}
        <div className="absolute inset-0 circuit-pattern opacity-[0.08]" aria-hidden="true" />
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full px-5 lg:px-20 max-w-[1280px] mx-auto py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* LEFT — text */}
          <div>
            {/* Category badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6 transition-all duration-500"
              style={{
                backgroundColor: `${color}18`,
                border: `1px solid ${color}40`,
                color,
                fontFamily: "var(--font-family-label)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: color }}
              />
              {slide.badge}
            </div>

            {/* Headline */}
            <h1
              className="text-5xl lg:text-7xl font-bold mb-6 leading-tight"
              style={{ fontFamily: "var(--font-family-headline)", letterSpacing: "-0.02em" }}
            >
              {slide.headline}
              <br />
              <span style={{ color }}>{slide.headline2}</span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-lg mb-10 max-w-lg leading-relaxed"
              style={{ color: "var(--color-on-surface-variant)", lineHeight: "1.75" }}
            >
              {slide.desc}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-10">
              <Link
                href={`/${locale}/iletisim`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-white transition-all duration-200 hover:scale-105 hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                  boxShadow: `0 4px 28px ${color}45`,
                  fontFamily: "var(--font-family-label)",
                }}
              >
                {isTr ? "Ücretsiz Analiz Al" : "Get Free Analysis"}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                href={`/${locale}/hizmetler`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:bg-white/5"
                style={{
                  border: "1px solid rgba(255,255,255,0.16)",
                  color: "var(--color-on-surface-variant)",
                  fontFamily: "var(--font-family-label)",
                }}
              >
                {isTr ? "Tüm Çözümler" : "All Solutions"}
              </Link>
            </div>

            {/* Slide selector — clickable topic tabs */}
            <div className="flex flex-wrap gap-2">
              {slides.map((s, i) => {
                const SI = s.productIcon;
                return (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                    style={{
                      backgroundColor: i === active ? `${s.badgeColor}20` : "rgba(255,255,255,0.04)",
                      border: i === active ? `1px solid ${s.badgeColor}50` : "1px solid rgba(255,255,255,0.07)",
                      color: i === active ? s.badgeColor : "var(--color-outline)",
                      fontFamily: "var(--font-family-label)",
                    }}
                  >
                    <SI className="w-3 h-3" aria-hidden="true" />
                    {s.badge}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT — Product info card (desktop only) */}
          <div className="hidden lg:flex justify-end items-center">
            <div
              className="w-[400px] rounded-2xl p-7 transition-all duration-500"
              style={{
                backgroundColor: "rgba(12,15,18,0.82)",
                border: `1px solid ${color}28`,
                backdropFilter: "blur(24px)",
                boxShadow: `0 0 80px ${color}10, 0 0 0 1px rgba(255,255,255,0.04)`,
              }}
            >
              {/* Icon */}
              <div
                className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: `linear-gradient(135deg, ${color}28, ${color}12)`,
                  border: `1px solid ${color}35`,
                  boxShadow: `0 0 32px ${color}20`,
                }}
              >
                <Icon className="w-9 h-9" style={{ color }} aria-hidden="true" />
              </div>

              {/* Category label */}
              <div
                className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1"
                style={{ color, fontFamily: "var(--font-family-label)" }}
              >
                {slide.badge}
              </div>

              {/* Product name */}
              <h2
                className="text-[22px] font-black mb-3 leading-snug"
                style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
              >
                {slide.product}
              </h2>

              {/* Description */}
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                {slide.desc}
              </p>

              {/* Stats row */}
              <div
                className="grid grid-cols-3 gap-2 pt-5 mb-5"
                style={{ borderTop: `1px solid ${color}18` }}
              >
                {slide.stats.map((st) => (
                  <div key={st.l} className="text-center">
                    <div
                      className="text-lg font-black leading-none mb-1"
                      style={{ color, fontFamily: "var(--font-family-headline)" }}
                    >
                      {st.v}
                    </div>
                    <div
                      className="text-[10px] leading-tight"
                      style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
                    >
                      {st.l}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="flex gap-1">
                {slides.map((_, i) => (
                  <div
                    key={i}
                    className="h-[3px] rounded-full transition-all duration-500 flex-1"
                    style={{
                      backgroundColor: i === active ? color : `${color}22`,
                    }}
                  />
                ))}
              </div>

              {/* Bottom label */}
              <div
                className="mt-3 text-[10px] text-right"
                style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
              >
                {active + 1} / {slides.length} — {isTr ? "Lider Network Çözümleri" : "Lider Network Solutions"}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
