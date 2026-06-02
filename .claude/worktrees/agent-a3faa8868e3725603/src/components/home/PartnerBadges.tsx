"use client";

import { useLocale } from "next-intl";
import { Shield, CheckCircle2 } from "lucide-react";

const partners = [
  {
    name: "Fortinet",
    badge: "Authorized Partner",
    level: "NSE Sertifikalı",
    color: "#EE3124",
    icon: "🔴",
  },
  {
    name: "Microsoft",
    badge: "Cloud Solution Provider",
    level: "Azure Partner",
    color: "#00a4ef",
    icon: "🔵",
  },
  {
    name: "Veeam",
    badge: "Gold Partner",
    level: "Backup & Recovery",
    color: "#00b336",
    icon: "🟢",
  },
  {
    name: "VMware",
    badge: "Solution Provider",
    level: "vSphere Uzmanı",
    color: "#607cdc",
    icon: "🟣",
  },
  {
    name: "Dell Technologies",
    badge: "Solution Partner",
    level: "Server & Storage",
    color: "#0076ce",
    icon: "🔵",
  },
  {
    name: "HPE",
    badge: "Partner Ready",
    level: "ProLiant & Networking",
    color: "#01a982",
    icon: "🟢",
  },
];

export default function PartnerBadges() {
  const locale = useLocale();
  const isTr = locale === "tr";

  return (
    <section
      className="py-12"
      style={{
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
      aria-label={isTr ? "Teknoloji ortakları" : "Technology partners"}
    >
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.18em] mb-1"
              style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
            >
              {isTr ? "Yetkili Teknoloji Ortaklıkları" : "Authorized Technology Partnerships"}
            </p>
            <h2
              className="text-xl font-black"
              style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
            >
              {isTr ? "Sertifikalı Partner Ağı" : "Certified Partner Network"}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-outline)" }}>
            <Shield className="w-4 h-4" style={{ color: "#00b336" }} />
            <span style={{ fontFamily: "var(--font-family-label)" }}>
              {isTr ? "Tüm sertifikalar güncel ve aktif" : "All certifications current and active"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {partners.map((p) => (
            <div
              key={p.name}
              className="flex flex-col items-center text-center p-4 rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              style={{
                backgroundColor: `${p.color}07`,
                border: `1px solid ${p.color}1a`,
              }}
            >
              {/* Brand name */}
              <div
                className="text-sm font-black mb-1"
                style={{ color: p.color, fontFamily: "var(--font-family-headline)" }}
              >
                {p.name}
              </div>

              {/* Badge level */}
              <div
                className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
                style={{
                  backgroundColor: `${p.color}15`,
                  color: p.color,
                  border: `1px solid ${p.color}25`,
                  fontFamily: "var(--font-family-label)",
                }}
              >
                {p.badge}
              </div>

              {/* Specialty */}
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: p.color }} />
                <span
                  className="text-[10px]"
                  style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
                >
                  {p.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
