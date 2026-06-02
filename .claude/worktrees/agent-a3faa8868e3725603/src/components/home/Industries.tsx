"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";

const BLUE = "#0052ff";

const industries = [
  {
    icon: "🛡️",
    tr: { name: "Savunma & Kamu", desc: "Jandarma, Donanma, Valilik — yüksek güvenlikli ağ altyapısı" },
    en: { name: "Defence & Public", desc: "High-security network infrastructure for government & defence" },
    color: "#EE3124",
    refs: ["Jandarma", "Donanma", "Ankara Valiliği"],
  },
  {
    icon: "🏥",
    tr: { name: "Sağlık", desc: "Hassas veri koruması, HIPAA uyumlu ağ segmentasyonu" },
    en: { name: "Healthcare", desc: "Sensitive data protection & HIPAA-compliant network segmentation" },
    color: "#10b981",
    refs: ["Sami Ulus Hastanesi"],
  },
  {
    icon: "🏭",
    tr: { name: "Üretim & Sanayi", desc: "OT/IT entegrasyonu, saha ağları ve endüstriyel güvenlik" },
    en: { name: "Manufacturing", desc: "OT/IT integration, field networks and industrial security" },
    color: "#f59e0b",
    refs: ["Panda Alüminyum", "KSE Maden", "Universal Mine"],
  },
  {
    icon: "🎓",
    tr: { name: "Eğitim", desc: "Kampüs ağları, WiFi altyapısı, öğrenci ağ yönetimi" },
    en: { name: "Education", desc: "Campus networks, WiFi infrastructure, student network management" },
    color: "#8b5cf6",
    refs: ["Gazi Üniversitesi", "Kırıkkale Üniversitesi"],
  },
  {
    icon: "⚡",
    tr: { name: "Enerji", desc: "SCADA güvenliği, kritik altyapı koruması, saha iletişimi" },
    en: { name: "Energy", desc: "SCADA security, critical infrastructure protection, field communications" },
    color: "#eab308",
    refs: ["Ulusoy Enerji"],
  },
  {
    icon: "🏢",
    tr: { name: "Kurumsal & Finans", desc: "Zero Trust mimari, uyumluluk, çok lokasyonlu ağ yönetimi" },
    en: { name: "Corporate & Finance", desc: "Zero Trust architecture, compliance, multi-site network management" },
    color: "#0052ff",
    refs: ["Roche", "KIA", "Alo Sigortam"],
  },
  {
    icon: "🏨",
    tr: { name: "Turizm & Otelcilik", desc: "Misafir WiFi, POS güvenliği, merkezi yönetim" },
    en: { name: "Tourism & Hospitality", desc: "Guest WiFi, POS security, centralised management" },
    color: "#f97316",
    refs: ["Midi Hotel", "Ultra Turizm"],
  },
  {
    icon: "🏗️",
    tr: { name: "İnşaat & Gayrimenkul", desc: "Şantiye ağları, LTE yedekleme, proje bazlı altyapı" },
    en: { name: "Construction & Real Estate", desc: "Site networks, LTE failover, project-based infrastructure" },
    color: "#64748b",
    refs: ["Koza İnşaat", "Usta İnşaat"],
  },
];

export default function Industries() {
  const locale = useLocale();
  const isTr = locale === "tr";

  return (
    <section
      className="py-20"
      style={{ backgroundColor: "var(--color-background)" }}
      aria-labelledby="industries-title"
    >
      <div className="container">
        {/* Header */}
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{
              backgroundColor: `${BLUE}12`,
              border: `1px solid ${BLUE}28`,
              color: BLUE,
              fontFamily: "var(--font-family-label)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BLUE }} />
            {isTr ? "Sektörel Uzmanlık" : "Industry Expertise"}
          </div>
          <h2
            id="industries-title"
            className="text-3xl sm:text-4xl font-black mb-4"
            style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
          >
            {isTr ? "Her Sektöre" : "Solutions For"}{" "}
            <span style={{ color: BLUE }}>{isTr ? "Özel Çözümler" : "Every Industry"}</span>
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: "var(--color-on-surface-variant)" }}>
            {isTr
              ? "Farklı sektörlerin kendine özgü güvenlik ve altyapı gereksinimlerini anlıyor, sektörünüze özel çözümler sunuyoruz."
              : "We understand the unique security and infrastructure requirements of each industry and deliver tailored solutions."}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {industries.map((ind) => {
            const data = isTr ? ind.tr : ind.en;
            return (
              <div
                key={ind.tr.name}
                className="group relative p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default"
                style={{
                  backgroundColor: `${ind.color}07`,
                  border: `1px solid ${ind.color}18`,
                }}
              >
                {/* Icon */}
                <div className="text-3xl mb-3" aria-hidden="true">{ind.icon}</div>

                {/* Name */}
                <h3
                  className="text-sm font-black mb-1.5 leading-snug"
                  style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
                >
                  {data.name}
                </h3>

                {/* Desc */}
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  {data.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            href={`/${locale}/referanslar`}
            className="inline-flex items-center gap-2 text-sm font-bold transition-all hover:gap-3"
            style={{ color: BLUE, fontFamily: "var(--font-family-label)" }}
          >
            {isTr ? "Tüm referanslarımızı inceleyin" : "Browse all our references"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
