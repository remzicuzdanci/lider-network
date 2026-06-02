"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Shield, Database, Cloud, Network,
  Settings, BarChart3, RefreshCw, Server,
} from "lucide-react";

export default function Services() {
  const locale = useLocale();
  const isTr = locale === "tr";

  const services = [
    {
      icon: Shield,
      title: isTr ? "Siber Güvenlik" : "Cybersecurity",
      description: isTr
        ? "Yeni nesil güvenlik duvarları (NGFW), sızma testleri ve yapay zeka destekli tehdit analizi ile tam koruma."
        : "Full protection with next-generation firewalls (NGFW), penetration testing and AI-powered threat analysis.",
      href: "siber-guvenlik",
    },
    {
      icon: Database,
      title: isTr ? "Veri Depolama" : "Data Storage",
      description: isTr
        ? "Yüksek performanslı depolama sistemleri ve felaket kurtarma (DR) senaryoları ile verilerinizi güvende tutun."
        : "Keep your data safe with high-performance storage systems and disaster recovery (DR) scenarios.",
      href: "veri-depolama",
    },
    {
      icon: Cloud,
      title: isTr ? "Bulut Çözümler" : "Cloud Solutions",
      description: isTr
        ? "Azure/AWS entegrasyonuyla hibrit ve özel bulut altyapısı kurulumu ve yönetimi."
        : "Hybrid and private cloud infrastructure setup and management with Azure/AWS integration.",
      href: "bulut-cozumleri",
    },
    {
      icon: Network,
      title: isTr ? "Ağ Altyapısı" : "Network Infrastructure",
      description: isTr
        ? "Kablolu/kablosuz enterprise ağlar, SD-WAN, switching ve routing sistemleri."
        : "Wired/wireless enterprise networks, SD-WAN, switching and routing systems.",
      href: "ag-entegrasyon",
    },
    {
      icon: Settings,
      title: isTr ? "Sistem Entegrasyonu" : "System Integration",
      description: isTr
        ? "Uçtan uca anahtar teslim teknoloji altyapı projeleri ve kurumsal entegrasyon hizmetleri."
        : "End-to-end turnkey technology infrastructure projects and enterprise integration services.",
      href: "sistem-entegrasyonu",
    },
    {
      icon: BarChart3,
      title: isTr ? "BT Danışmanlığı" : "IT Consulting",
      description: isTr
        ? "Stratejik teknoloji planlaması, altyapı denetimi ve dijital dönüşüm destek hizmetleri."
        : "Strategic technology planning, infrastructure auditing and digital transformation support services.",
      href: "bt-danismanligi",
    },
    {
      icon: RefreshCw,
      title: isTr ? "İş Sürekliliği" : "Business Continuity",
      description: isTr
        ? "Kritik süreçler için yedekleme, kurtarma mekanizmaları ve kesintisiz operasyon garantisi."
        : "Backup, recovery mechanisms and uninterrupted operation guarantees for critical processes.",
      href: "is-surekliligi",
    },
    {
      icon: Server,
      title: isTr ? "Sanallaştırma" : "Virtualization",
      description: isTr
        ? "Sunucu, masaüstü ve uygulama sanallaştırma çözümleriyle altyapı maliyetlerini düşürün."
        : "Reduce infrastructure costs with server, desktop and application virtualization solutions.",
      href: "sanallastirma",
    },
  ];

  return (
    <section
      className="py-16 border-y"
      id="hizmetler"
      style={{
        backgroundColor: "#191c1e",
        borderColor: "rgba(141,144,162,0.1)",
      }}
      aria-labelledby="services-title"
    >
      <div className="w-full px-5 lg:px-20 max-w-[1280px] mx-auto">
        {/* Section Header */}
        <header className="text-center mb-16">
          <span
            className="uppercase tracking-widest mb-4 block"
            style={{
              color: "var(--color-primary)",
              fontFamily: "var(--font-family-label)",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            {isTr ? "Uçtan Uca Yetkinlik" : "End-to-End Expertise"}
          </span>
          <h2
            id="services-title"
            className="text-4xl lg:text-5xl font-semibold mb-4"
            style={{
              fontFamily: "var(--font-family-headline)",
              letterSpacing: "-0.01em",
            }}
          >
            {isTr ? "Uzmanlık Alanlarımız" : "Our Areas of Expertise"}
          </h2>
          <p
            className="max-w-2xl mx-auto text-base"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            {isTr
              ? "Modern işletmelerin teknolojik ihtiyaçlarını karşılamak üzere tasarlanmış, global standartlarda BT servisleri ve altyapı çözümleri."
              : "IT services and infrastructure solutions designed to global standards, meeting the technology needs of modern enterprises."}
          </p>
        </header>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.title}
                href={`/${locale}/${service.href}`}
                className="industrial-border p-8 group relative overflow-hidden transition-all duration-300 block"
                style={{ backgroundColor: "var(--color-background)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,82,255,0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(141,144,162,0.2)";
                }}
              >
                {/* Ghost background icon */}
                <div
                  className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity text-6xl select-none pointer-events-none"
                  aria-hidden="true"
                >
                  <Icon className="w-20 h-20" style={{ color: "var(--color-on-surface)" }} />
                </div>

                {/* Main icon */}
                <Icon
                  className="w-12 h-12 mb-6 transition-transform duration-300 group-hover:scale-110"
                  style={{ color: "var(--color-primary)" }}
                  aria-hidden="true"
                />

                <h3
                  className="font-bold text-xl mb-4"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  {service.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  {service.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
