"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Shield, Server, Wifi, Monitor, Lock, ArrowRight } from "lucide-react";

const FN_RED = "#EE3124";

export default function FortinetProducts() {
  const locale = useLocale();
  const isTr = locale === "tr";

  const products = [
    {
      icon: Shield,
      name: "FortiGate NGFW",
      desc: isTr
        ? "Yeni Nesil Güvenlik Duvarı. SD-WAN, SSL inceleme, Zero Trust ve yapay zeka destekli tehdit koruması."
        : "Next-Generation Firewall. SD-WAN, SSL inspection, Zero Trust and AI-powered threat protection.",
      href: "fortinet",
      color: FN_RED,
      tags: ["NGFW", "SD-WAN", "Zero Trust"],
      stat: isTr ? "#1 — Gartner MQ Leader 13 Yıl" : "#1 — Gartner MQ Leader 13 Years",
    },
    {
      icon: Server,
      name: "FortiSwitch",
      desc: isTr
        ? "Kurumsal ağ anahtarlaması. FortiLink ile merkezi yönetim, %308 ROI, Zero Trust NAC entegrasyonu."
        : "Enterprise network switching. Centralised management with FortiLink, 308% ROI, Zero Trust NAC integration.",
      href: "fortinet/fortiswitch",
      color: "#C8102E",
      tags: ["NAC", "FortiLink", "308% ROI"],
      stat: isTr ? "598 Gbps — Maks. Throughput" : "598 Gbps — Max Throughput",
    },
    {
      icon: Wifi,
      name: "FortiAP & WiFi 7",
      desc: isTr
        ? "En yeni WiFi 7 standardı, tri-band 6 GHz desteği, AI destekli radyo yönetimi ve Zero Trust kablosuz güvenlik."
        : "Latest WiFi 7 standard, tri-band 6 GHz support, AI-driven radio management and Zero Trust wireless security.",
      href: "fortinet/fortiap",
      color: "#0052ff",
      tags: ["WiFi 7", "6 GHz", "AI-RRM"],
      stat: isTr ? "17.3 Gbps — Maks. Hız" : "17.3 Gbps — Max Speed",
    },
    {
      icon: Monitor,
      name: isTr ? "Yönetim & SOC" : "Management & SOC",
      desc: isTr
        ? "FortiAnalyzer, FortiManager ve FortiSIEM ile merkezi güvenlik operasyonları ve yapay zeka tehdit tespiti."
        : "Centralised security operations and AI threat detection with FortiAnalyzer, FortiManager and FortiSIEM.",
      href: "fortinet/yonetim",
      color: "#0052ff",
      tags: ["FortiSIEM", "SOAR", "70% MTTR"],
      stat: isTr ? "50K EPS — Olay/Saniye" : "50K EPS — Events/Second",
    },
    {
      icon: Lock,
      name: "Endpoint & NAC",
      desc: isTr
        ? "FortiClient, FortiEDR ve FortiNAC ile uçtan uca endpoint koruması, ZTNA ve sıfır güven ağ erişimi."
        : "End-to-end endpoint protection, ZTNA and zero-trust network access with FortiClient, FortiEDR and FortiNAC.",
      href: "fortinet/endpoint",
      color: "#7c3aed",
      tags: ["ZTNA", "EDR", "FortiNAC"],
      stat: isTr ? "%99.9 — Tehdit Tespit Oranı" : "99.9% — Threat Detection Rate",
    },
  ];

  return (
    <section
      className="py-16"
      style={{
        backgroundColor: "rgba(255,255,255,0.015)",
        borderTop: `1px solid rgba(238,49,36,0.1)`,
        borderBottom: `1px solid rgba(238,49,36,0.1)`,
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div
              className="text-xs font-bold mb-2 uppercase tracking-widest"
              style={{ color: FN_RED, fontFamily: "var(--font-family-label)" }}
            >
              {isTr ? "Fortinet Yetkili Partner" : "Fortinet Authorized Partner"}
            </div>
            <h2
              className="text-3xl md:text-4xl font-black"
              style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
            >
              {isTr ? "Tam Fortinet Portföyü" : "Full Fortinet Portfolio"}
            </h2>
          </div>
          <Link
            href={`/${locale}/fortinet`}
            className="inline-flex items-center gap-2 text-sm font-bold transition-colors"
            style={{ color: FN_RED, fontFamily: "var(--font-family-label)" }}
          >
            {isTr ? "Tüm Çözümleri Gör" : "View All Solutions"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product grid — 3 top + 2 bottom */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {products.slice(0, 3).map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.name}
                href={`/${locale}/${p.href}`}
                className="group block p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
                style={{
                  backgroundColor: `${p.color}06`,
                  border: `1px solid ${p.color}18`,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${p.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: p.color }} />
                  </div>
                  <ArrowRight
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: p.color }}
                  />
                </div>

                <h3
                  className="text-lg font-black mb-2"
                  style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
                >
                  {p.name}
                </h3>
                <p
                  className="text-sm mb-4 leading-relaxed"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  {p.desc}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {p.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded font-bold"
                      style={{
                        backgroundColor: `${p.color}12`,
                        color: p.color,
                        border: `1px solid ${p.color}20`,
                        fontFamily: "var(--font-family-label)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div
                  className="text-[10px] font-bold pt-3"
                  style={{
                    color: "var(--color-outline)",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    fontFamily: "var(--font-family-label)",
                  }}
                >
                  {p.stat}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {products.slice(3).map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.name}
                href={`/${locale}/${p.href}`}
                className="group block p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5"
                style={{
                  backgroundColor: `${p.color}06`,
                  border: `1px solid ${p.color}18`,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${p.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: p.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-black mb-1"
                      style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
                    >
                      {p.name}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {p.desc}
                    </p>
                  </div>
                  <ArrowRight
                    className="w-5 h-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: p.color }}
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4 ml-[60px]">
                  {p.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded font-bold"
                      style={{
                        backgroundColor: `${p.color}12`,
                        color: p.color,
                        border: `1px solid ${p.color}20`,
                        fontFamily: "var(--font-family-label)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
