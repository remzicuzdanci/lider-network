"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { CheckCircle2 } from "lucide-react";

const FN_RED = "#EE3124";

export default function Partners() {
  const locale = useLocale();
  const isTr = locale === "tr";

  const partners = [
    {
      name: "Microsoft",
      badge: "Azure Solutions Partner",
      color: "#00a4ef",
      borderColor: "rgba(0, 164, 239, 0.22)",
      bgColor: "rgba(0, 164, 239, 0.05)",
      capabilities: isTr
        ? ["Azure Altyapı Yönetimi", "Hibrit Bulut Tasarımı", "Microsoft 365", "Azure AD & Security"]
        : ["Azure Infrastructure Management", "Hybrid Cloud Design", "Microsoft 365", "Azure AD & Security"],
      description: isTr
        ? "Azure tabanlı bulut migrasyonu ve altyapı yönetim hizmetleri."
        : "Azure-based cloud migration and infrastructure management services.",
    },
    {
      name: "VMware",
      badge: "Solution Provider",
      color: "#607cdc",
      borderColor: "rgba(96, 124, 220, 0.22)",
      bgColor: "rgba(96, 124, 220, 0.05)",
      capabilities: isTr
        ? ["vSphere & ESXi", "NSX-T Ağ Sanallaştırma", "VDI / Horizon", "HCI & vSAN"]
        : ["vSphere & ESXi", "NSX-T Network Virtualization", "VDI / Horizon", "HCI & vSAN"],
      description: isTr
        ? "Kurumsal sanallaştırma ve SDN altyapısı çözümleri."
        : "Enterprise virtualization and SDN infrastructure solutions.",
    },
    {
      name: "Veeam",
      badge: "Gold Partner",
      color: "#00b336",
      borderColor: "rgba(0, 179, 54, 0.22)",
      bgColor: "rgba(0, 179, 54, 0.05)",
      capabilities: isTr
        ? ["Backup & Replication", "Disaster Recovery", "Immutable Yedekleme", "Cloud Backup"]
        : ["Backup & Replication", "Disaster Recovery", "Immutable Backup", "Cloud Backup"],
      description: isTr
        ? "Kurumsal veri koruma ve felaket kurtarma çözümleri."
        : "Enterprise data protection and disaster recovery solutions.",
    },
  ];

  const trustStats = [
    { value: "2006", label: isTr ? "Kuruluş Yılı" : "Founded" },
    { value: "500+", label: isTr ? "Tamamlanan Proje" : "Completed Projects" },
    { value: "7/24", label: isTr ? "Teknik Destek" : "Technical Support" },
    { value: "ISO", label: isTr ? "Güvenlik Standartları" : "Security Standards" },
  ];

  return (
    <section
      className="section circuit-bg"
      id="ekosistem"
      aria-labelledby="ecosystem-title"
    >
      <div className="container">
        {/* Section Header */}
        <header className="text-center mb-14">
          <h2
            id="ecosystem-title"
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{
              fontFamily: "var(--font-family-headline)",
              color: "var(--color-on-surface)",
            }}
          >
            {isTr ? (
              <>Güvenilir Teknoloji{" "}
              <span style={{ color: "var(--color-primary)" }}>Ekosistemi</span></>
            ) : (
              <>Trusted Technology{" "}
              <span style={{ color: "var(--color-primary)" }}>Ecosystem</span></>
            )}
          </h2>
          <p
            className="text-base max-w-xl mx-auto"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            {isTr
              ? "Dünya lideri teknoloji markalarıyla stratejik ortaklıklar — bulut, sanallaştırma ve veri korumada doğru çözümleri sunuyoruz."
              : "Strategic partnerships with world-leading technology brands — delivering the right solutions in cloud, virtualisation and data protection."}
          </p>
        </header>

        {/* Fortinet mention — compact row (not duplicated hero) */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-2xl mb-8"
          style={{
            backgroundColor: `${FN_RED}08`,
            border: `1px solid ${FN_RED}22`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="text-lg font-black tracking-tight"
              style={{ fontFamily: "var(--font-family-headline)", color: FN_RED }}
            >
              FORTINET
            </div>
            <span
              className="text-xs px-2.5 py-1 rounded font-semibold"
              style={{
                backgroundColor: `${FN_RED}14`,
                border: `1px solid ${FN_RED}28`,
                color: FN_RED,
                fontFamily: "var(--font-family-label)",
              }}
            >
              {isTr ? "Fortinet Yetkili Partner" : "Fortinet Authorized Partner"}
            </span>
          </div>
          <Link
            href={`/${locale}/fortinet`}
            className="text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ color: FN_RED, fontFamily: "var(--font-family-label)" }}
          >
            {isTr
              ? "FortiGate, FortiAnalyzer, FortiManager, FortiSwitch, FortiEDR → Tüm ürünler"
              : "FortiGate, FortiAnalyzer, FortiManager, FortiSwitch, FortiEDR → All products"}
          </Link>
        </div>

        {/* Partners 3-col */}
        <ul
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10"
          role="list"
          aria-label="Teknoloji ortakları"
        >
          {partners.map((p) => (
            <li key={p.name}>
              <article
                className="card-glow h-full p-6 rounded-xl"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-outline-variant)",
                  borderRadius: "var(--radius-card)",
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="text-xl font-bold tracking-tight"
                    style={{ fontFamily: "var(--font-family-headline)", color: p.color }}
                  >
                    {p.name}
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: p.bgColor,
                      border: `1px solid ${p.borderColor}`,
                      color: p.color,
                      fontFamily: "var(--font-family-label)",
                      fontWeight: 500,
                    }}
                  >
                    {p.badge}
                  </span>
                </div>
                <p
                  className="text-xs mb-4 leading-relaxed"
                  style={{ color: "var(--color-outline)" }}
                >
                  {p.description}
                </p>
                <ul className="flex flex-col gap-1.5" role="list">
                  {p.capabilities.map((cap) => (
                    <li
                      key={cap}
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      <CheckCircle2
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: p.color }}
                        aria-hidden="true"
                      />
                      {cap}
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ul>

        {/* Trust Stats */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: "rgba(0, 82, 255, 0.05)",
            border: "1px solid rgba(0, 82, 255, 0.15)",
          }}
        >
          <ul
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            role="list"
            aria-label="Güven göstergeleri"
          >
            {trustStats.map((s) => (
              <li key={s.label} className="text-center">
                <div
                  className="text-2xl font-bold mb-1"
                  style={{
                    fontFamily: "var(--font-family-headline)",
                    color: "var(--color-primary)",
                  }}
                >
                  {s.value}
                </div>
                <div className="text-xs" style={{ color: "var(--color-outline)" }}>
                  {s.label}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
