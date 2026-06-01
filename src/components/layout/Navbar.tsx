"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Menu,
  X,
  Shield,
  Globe,
  ChevronDown,
  ShieldCheck,
  Database,
  Cloud,
  Network,
  Settings,
  BarChart3,
  RefreshCw,
  Server,
  Wifi,
  Radio,
  Monitor,
  Lock,
  Zap,
  Building2,
  Handshake,
  FileText,
  Award,
} from "lucide-react";

/* ─── Static data (locale-independent) ─────────────────────────────────── */
const fortinetCategoriesBase = [
  { href: "fortinet", icon: Shield, color: "#EE3124", products: ["FortiGate NGFW", "FortiGate VM", "FortiGate Rugged", "FortiWiFi", "FortiGate CNF"] },
  { href: "fortinet/fortiswitch", icon: Wifi, color: "#C8102E", products: ["FortiSwitch 100", "FortiSwitch 200", "FortiSwitch 400", "FortiSwitch Rugged"] },
  { href: "fortinet/fortiap", icon: Radio, color: "#0052ff", products: ["FortiAP 231K (WiFi 7)", "FortiAP 432K (WiFi 7)", "FortiAP 234K (WiFi 6E)", "FortiExtender"] },
  { href: "fortinet/yonetim", icon: Monitor, color: "#0052ff", products: ["FortiManager", "FortiAnalyzer", "FortiSIEM", "FortiSOAR", "FortiMonitor"] },
  { href: "fortinet/endpoint", icon: Lock, color: "#7c3aed", products: ["FortiClient", "FortiEDR", "FortiSASE", "FortiMail", "FortiNAC"] },
] as const;

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const isTr = locale === "tr";

  const fortinetCategories = [
    { ...fortinetCategoriesBase[0], label: isTr ? "Güvenlik Duvarı" : "Firewall" },
    { ...fortinetCategoriesBase[1], label: "FortiSwitch" },
    { ...fortinetCategoriesBase[2], label: "FortiAP & WiFi 7" },
    { ...fortinetCategoriesBase[3], label: isTr ? "Yönetim & SOC" : "Management & SOC" },
    { ...fortinetCategoriesBase[4], label: isTr ? "Endpoint & Bulut" : "Endpoint & Cloud" },
  ];

  const kurumsal = [
    { href: "hakkimizda", label: isTr ? "Hakkımızda" : "About Us", icon: Building2, desc: isTr ? "Şirket tarihimiz, misyon & vizyon" : "Company history, mission & vision" },
    { href: "cozum-ortaklarimiz", label: isTr ? "Çözüm Ortaklarımız" : "Technology Partners", icon: Handshake, desc: isTr ? "Fortinet, Microsoft, VMware ve daha fazlası" : "Fortinet, Microsoft, VMware and more" },
    { href: "referanslar", label: isTr ? "Referanslarımız" : "References", icon: Award, desc: isTr ? "50+ kurumda tamamlanan başarılı projeler" : "Successful projects at 50+ enterprises" },
    { href: "kvkk", label: isTr ? "KVKK ve Gizlilik" : "Privacy Policy", icon: FileText, desc: isTr ? "Kişisel veri koruma ve gizlilik politikası" : "Personal data protection and privacy policy" },
  ];

  const serviceItems = [
    { href: "siber-guvenlik", label: isTr ? "Siber Güvenlik" : "Cybersecurity", icon: ShieldCheck, desc: "NGFW, EDR, Pentest" },
    { href: "veri-depolama", label: isTr ? "Veri Depolama" : "Data Storage", icon: Database, desc: isTr ? "NAS, SAN, Yedekleme" : "NAS, SAN, Backup" },
    { href: "bulut-cozumleri", label: isTr ? "Bulut Çözümleri" : "Cloud Solutions", icon: Cloud, desc: "Azure, AWS, Hybrid" },
    { href: "ag-entegrasyon", label: isTr ? "Ağ Altyapısı" : "Network Infrastructure", icon: Network, desc: "SD-WAN, Wi-Fi 6" },
    { href: "sistem-entegrasyonu", label: isTr ? "Sistem Entegrasyonu" : "System Integration", icon: Settings, desc: isTr ? "Anahtar teslim projeler" : "Turnkey projects" },
    { href: "bt-danismanligi", label: isTr ? "BT Danışmanlığı" : "IT Consulting", icon: BarChart3, desc: isTr ? "Strateji, Denetim, ROI" : "Strategy, Audit, ROI" },
    { href: "is-surekliligi", label: isTr ? "İş Sürekliliği" : "Business Continuity", icon: RefreshCw, desc: "BCP, DR, Failover" },
    { href: "sanallastirma", label: isTr ? "Sanallaştırma" : "Virtualization", icon: Server, desc: "VMware, VDI, HCI" },
    { href: "zayif-akim", label: isTr ? "Zayıf Akım" : "Low Voltage", icon: Zap, desc: isTr ? "Kamera, Erişim, Otomasyon" : "CCTV, Access, Automation" },
  ];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [fortinetOpen, setFortinetOpen] = useState(false);
  const [kurulsalOpen, setKurulsalOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileFortinetOpen, setMobileFortinetOpen] = useState(false);
  const [mobileKurulsalOpen, setMobileKurulsalOpen] = useState(false);
  const servicesRef = useRef<HTMLLIElement>(null);
  const fortinetRef = useRef<HTMLLIElement>(null);
  const kurulsalRef = useRef<HTMLLIElement>(null);

  const closeAll = () => {
    setServicesOpen(false);
    setFortinetOpen(false);
    setKurulsalOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
      if (fortinetRef.current && !fortinetRef.current.contains(e.target as Node)) {
        setFortinetOpen(false);
      }
      if (kurulsalRef.current && !kurulsalRef.current.contains(e.target as Node)) {
        setKurulsalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const otherLocale = locale === "tr" ? "en" : "tr";
  const otherLocaleLabel = locale === "tr" ? "EN" : "TR";
  const pathname = usePathname();
  const otherLocaleHref = pathname.replace(`/${locale}`, `/${otherLocale}`);

  const isActive = (href: string) => {
    const full = `/${locale}/${href}`;
    if (href === "") return pathname === `/${locale}` || pathname === `/${locale}/`;
    return pathname === full || pathname.startsWith(full + "/");
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: isScrolled
          ? "rgba(16, 20, 21, 0.95)"
          : "rgba(16, 20, 21, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: isScrolled
          ? "1px solid rgba(67, 70, 86, 0.5)"
          : "1px solid transparent",
      }}
    >
      <nav className="container" role="navigation" aria-label="Ana navigasyon">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center group"
            aria-label="Lider Network Ana Sayfa"
          >
            <div
              className="transition-opacity duration-200 opacity-95 group-hover:opacity-100"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 8,
                padding: "4px 14px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Image
                src="/logo.png"
                alt="Lider Network"
                width={120}
                height={44}
                style={{ height: 44, width: "auto", objectFit: "contain", display: "block" }}
                priority
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden lg:flex items-center gap-1" role="list">

            {/* Anasayfa */}
            <li>
              <Link
                href={`/${locale}`}
                className="px-4 py-2 text-sm rounded transition-colors duration-200"
                style={{
                  fontFamily: "var(--font-family-label)",
                  fontWeight: 600,
                  color: isActive("") ? "var(--color-primary)" : "var(--color-on-surface-variant)",
                  backgroundColor: isActive("") ? "rgba(0,82,255,0.08)" : "transparent",
                  borderBottom: isActive("") ? "2px solid var(--color-primary)" : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  closeAll();
                  if (!isActive("")) {
                    (e.currentTarget as HTMLElement).style.color = "var(--color-on-surface)";
                    (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(183, 196, 255, 0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("")) {
                    (e.currentTarget as HTMLElement).style.color = "var(--color-on-surface-variant)";
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  }
                }}
              >
                {t("home")}
              </Link>
            </li>

            {/* Kurumsal — hover dropdown */}
            <li ref={kurulsalRef} className="relative">
              <button
                className="flex items-center gap-1 px-4 py-2 text-sm rounded transition-colors duration-200"
                style={{
                  fontFamily: "var(--font-family-label)",
                  fontWeight: 500,
                  color: kurulsalOpen ? "var(--color-on-surface)" : "var(--color-on-surface-variant)",
                  backgroundColor: kurulsalOpen ? "rgba(183,196,255,0.06)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={() => { setKurulsalOpen(true); setServicesOpen(false); setFortinetOpen(false); }}
                onClick={() => setKurulsalOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={kurulsalOpen}
              >
                {isTr ? "Kurumsal" : "Corporate"}
                <ChevronDown
                  className="w-3.5 h-3.5 transition-transform duration-200"
                  style={{ transform: kurulsalOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  aria-hidden="true"
                />
              </button>

              {kurulsalOpen && (
                <div
                  className="absolute top-full left-1/2 mt-2 w-72 rounded-2xl p-3 shadow-2xl"
                  style={{
                    transform: "translateX(-50%)",
                    backgroundColor: "rgba(16, 20, 21, 0.98)",
                    border: "1px solid rgba(183,196,255,0.15)",
                    backdropFilter: "blur(20px)",
                  }}
                  onMouseLeave={() => setKurulsalOpen(false)}
                >
                  <div className="flex flex-col gap-1">
                    {kurumsal.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={`/${locale}/${item.href}`}
                          className="flex items-start gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-white/5"
                          onClick={() => setKurulsalOpen(false)}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: "rgba(183,196,255,0.08)", border: "1px solid rgba(183,196,255,0.12)" }}
                          >
                            <Icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                          </div>
                          <div>
                            <div
                              className="text-sm font-semibold"
                              style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-family-label)" }}
                            >
                              {item.label}
                            </div>
                            <div
                              className="text-xs mt-0.5"
                              style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
                            >
                              {item.desc}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </li>

            {/* Hizmetler — mega-menu */}
            <li ref={servicesRef} className="relative">
              <button
                className="flex items-center gap-1 px-4 py-2 text-sm rounded transition-colors duration-200"
                style={{
                  fontFamily: "var(--font-family-label)",
                  fontWeight: 500,
                  color: servicesOpen ? "var(--color-on-surface)" : "var(--color-on-surface-variant)",
                  backgroundColor: servicesOpen ? "rgba(183, 196, 255, 0.05)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={() => { setServicesOpen(true); setFortinetOpen(false); setKurulsalOpen(false); }}
                onClick={() => setServicesOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={servicesOpen}
              >
                {t("services")}
                <ChevronDown
                  className="w-3.5 h-3.5 transition-transform duration-200"
                  style={{ transform: servicesOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  aria-hidden="true"
                />
              </button>

              {/* Dropdown */}
              {servicesOpen && (
                <div
                  className="absolute top-full left-1/2 mt-2 w-[520px] rounded-2xl p-4 shadow-2xl"
                  style={{
                    transform: "translateX(-50%)",
                    backgroundColor: "rgba(16, 20, 21, 0.98)",
                    border: "1px solid rgba(67, 70, 86, 0.6)",
                    backdropFilter: "blur(20px)",
                  }}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-3 pb-3" style={{ borderBottom: "1px solid rgba(67,70,86,0.4)" }}>
                    <span
                      className="text-xs font-semibold tracking-widest uppercase"
                      style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
                    >
                      {isTr ? "Uzmanlık Alanları" : "Areas of Expertise"}
                    </span>
                    <Link
                      href={`/${locale}/hizmetler`}
                      className="text-xs transition-colors duration-200"
                      style={{ color: "var(--color-primary)", fontFamily: "var(--font-family-label)" }}
                      onClick={() => setServicesOpen(false)}
                    >
                      {isTr ? "Tümünü Gör →" : "View All →"}
                    </Link>
                  </div>

                  {/* 2-col grid */}
                  <ul className="grid grid-cols-2 gap-1" role="list">
                    {serviceItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link
                            href={`/${locale}/${item.href}`}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group"
                            style={{ color: "var(--color-on-surface-variant)" }}
                            onClick={() => setServicesOpen(false)}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0, 82, 255, 0.08)";
                              (e.currentTarget as HTMLElement).style.color = "var(--color-on-surface)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                              (e.currentTarget as HTMLElement).style.color = "var(--color-on-surface-variant)";
                            }}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: "rgba(0, 82, 255, 0.12)",
                                border: "1px solid rgba(0, 82, 255, 0.2)",
                              }}
                            >
                              <Icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} aria-hidden="true" />
                            </div>
                            <div>
                              <div
                                className="text-sm font-medium leading-tight"
                                style={{ fontFamily: "var(--font-family-label)" }}
                              >
                                {item.label}
                              </div>
                              <div className="text-xs mt-0.5" style={{ color: "var(--color-outline)" }}>
                                {item.desc}
                              </div>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Bottom CTA */}
                  <div
                    className="mt-3 pt-3 flex items-center justify-between"
                    style={{ borderTop: "1px solid rgba(67,70,86,0.4)" }}
                  >
                    <span className="text-xs" style={{ color: "var(--color-outline)" }}>
                      {isTr ? "2006'dan beri kurumsal BT altyapı çözümleri" : "Enterprise IT infrastructure solutions since 2006"}
                    </span>
                    <Link
                      href={`/${locale}/iletisim`}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors duration-200"
                      style={{
                        backgroundColor: "rgba(0, 82, 255, 0.15)",
                        border: "1px solid rgba(0, 82, 255, 0.3)",
                        color: "var(--color-primary)",
                        fontFamily: "var(--font-family-label)",
                        fontWeight: 500,
                      }}
                      onClick={() => setServicesOpen(false)}
                    >
                      {isTr ? "Ücretsiz Analiz Al" : "Get Free Analysis"}
                    </Link>
                  </div>
                </div>
              )}
            </li>

            {/* Fortinet — mega-menu */}
            <li ref={fortinetRef} className="relative">
              <button
                className="flex items-center gap-1 px-4 py-2 text-sm rounded transition-colors duration-200"
                style={{
                  fontFamily: "var(--font-family-label)",
                  fontWeight: 500,
                  color: fortinetOpen ? "#EE3124" : "var(--color-on-surface-variant)",
                  backgroundColor: fortinetOpen ? "rgba(255, 60, 0, 0.06)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={() => { setFortinetOpen(true); setServicesOpen(false); setKurulsalOpen(false); }}
                onClick={() => setFortinetOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={fortinetOpen}
              >
                {t("fortinet")}
                <ChevronDown
                  className="w-3.5 h-3.5 transition-transform duration-200"
                  style={{ transform: fortinetOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  aria-hidden="true"
                />
              </button>

              {fortinetOpen && (
                <div
                  className="absolute top-full left-1/2 mt-2 w-[680px] rounded-2xl p-4 shadow-2xl"
                  style={{
                    transform: "translateX(-50%)",
                    backgroundColor: "rgba(16, 20, 21, 0.98)",
                    border: "1px solid rgba(255, 60, 0, 0.25)",
                    backdropFilter: "blur(20px)",
                  }}
                  onMouseLeave={() => setFortinetOpen(false)}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3 pb-3" style={{ borderBottom: "1px solid rgba(255,60,0,0.15)" }}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: "#EE3124" }}
                      />
                      <span
                        className="text-xs font-bold tracking-widest uppercase"
                        style={{ color: "#EE3124", fontFamily: "var(--font-family-label)" }}
                      >
                        {isTr ? "Fortinet Ürün Ailesi" : "Fortinet Product Family"}
                      </span>
                    </div>
                    <Link
                      href={`/${locale}/fortinet`}
                      className="text-xs transition-colors duration-200"
                      style={{ color: "var(--color-primary)", fontFamily: "var(--font-family-label)" }}
                      onClick={() => setFortinetOpen(false)}
                    >
                      {isTr ? "Tüm Ürünler →" : "All Products →"}
                    </Link>
                  </div>

                  {/* category grid — 3 cols for 5 items */}
                  <div className="grid grid-cols-3 gap-3">
                    {fortinetCategories.map((cat) => {
                      const CatIcon = cat.icon;
                      return (
                        <Link
                          key={cat.label}
                          href={`/${locale}/${cat.href}`}
                          className="block p-3 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                          style={{
                            backgroundColor: `${cat.color}08`,
                            border: `1px solid ${cat.color}18`,
                          }}
                          onClick={() => setFortinetOpen(false)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <CatIcon
                              className="w-3.5 h-3.5 shrink-0"
                              style={{ color: cat.color }}
                              aria-hidden="true"
                            />
                            <span
                              className="text-xs font-bold"
                              style={{ color: cat.color, fontFamily: "var(--font-family-label)" }}
                            >
                              {cat.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {cat.products.map((p) => (
                              <span
                                key={p}
                                className="text-[10px] px-2 py-0.5 rounded font-medium"
                                style={{
                                  backgroundColor: "rgba(255,255,255,0.04)",
                                  color: "var(--color-on-surface-variant)",
                                  border: "1px solid rgba(141,144,162,0.15)",
                                  fontFamily: "var(--font-family-label)",
                                }}
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Footer CTA */}
                  <div
                    className="mt-3 pt-3 flex items-center justify-between"
                    style={{ borderTop: "1px solid rgba(255,60,0,0.12)" }}
                  >
                    <span className="text-xs" style={{ color: "var(--color-outline)" }}>
                      {isTr ? "NSE Sertifikalı Fortinet Uzmanları — 2006'dan beri" : "NSE Certified Fortinet Experts — since 2006"}
                    </span>
                    <Link
                      href={`/${locale}/fortinet`}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-colors duration-200"
                      style={{
                        backgroundColor: "#EE3124",
                        color: "white",
                        fontFamily: "var(--font-family-label)",
                      }}
                      onClick={() => setFortinetOpen(false)}
                    >
                      <Zap className="w-3 h-3" />
                      {isTr ? "Hızlı Teklif Al" : "Quick Quote"}
                    </Link>
                  </div>
                </div>
              )}
            </li>

            {/* Blog */}
            <li>
              <Link
                href={`/${locale}/blog`}
                className="px-4 py-2 text-sm rounded transition-colors duration-200"
                style={{
                  fontFamily: "var(--font-family-label)",
                  fontWeight: 600,
                  color: isActive("blog") ? "var(--color-primary)" : "var(--color-on-surface-variant)",
                  backgroundColor: isActive("blog") ? "rgba(0,82,255,0.08)" : "transparent",
                  borderBottom: isActive("blog") ? "2px solid var(--color-primary)" : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  closeAll();
                  if (!isActive("blog")) {
                    (e.currentTarget as HTMLElement).style.color = "var(--color-on-surface)";
                    (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(183, 196, 255, 0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("blog")) {
                    (e.currentTarget as HTMLElement).style.color = "var(--color-on-surface-variant)";
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  }
                }}
              >
                Blog
              </Link>
            </li>

            {/* İletişim */}
            <li>
              <Link
                href={`/${locale}/iletisim`}
                className="px-4 py-2 text-sm rounded transition-colors duration-200"
                style={{
                  fontFamily: "var(--font-family-label)",
                  fontWeight: 600,
                  color: isActive("iletisim") ? "var(--color-primary)" : "var(--color-on-surface-variant)",
                  backgroundColor: isActive("iletisim") ? "rgba(0,82,255,0.08)" : "transparent",
                  borderBottom: isActive("iletisim") ? "2px solid var(--color-primary)" : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  closeAll();
                  if (!isActive("iletisim")) {
                    (e.currentTarget as HTMLElement).style.color = "var(--color-on-surface)";
                    (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(183, 196, 255, 0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("iletisim")) {
                    (e.currentTarget as HTMLElement).style.color = "var(--color-on-surface-variant)";
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  }
                }}
              >
                {t("contact")}
              </Link>
            </li>
          </ul>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">

            {/* Fortinet Authorized Partner Badge */}
            <Link
              href={`/${locale}/fortinet`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, rgba(238,49,36,.12) 0%, rgba(200,16,46,.08) 100%)",
                border: "1px solid rgba(238,49,36,.35)",
                textDecoration: "none",
              }}
              title="Fortinet Authorized Partner"
            >
              {/* Fortinet "F" shield icon */}
              <div
                className="flex items-center justify-center rounded font-black text-white text-xs shrink-0"
                style={{
                  width: 22, height: 22,
                  background: "linear-gradient(135deg, #EE3124, #C8102E)",
                  fontSize: 11,
                  boxShadow: "0 2px 6px rgba(238,49,36,.4)",
                }}
              >
                F
              </div>
              <div className="flex flex-col leading-none">
                <span
                  className="font-black tracking-tight"
                  style={{ fontSize: 10, color: "#EE3124", fontFamily: "var(--font-family-label)", letterSpacing: ".02em" }}
                >
                  FORTINET
                </span>
                <span
                  className="font-semibold"
                  style={{ fontSize: 9, color: "rgba(238,49,36,.75)", fontFamily: "var(--font-family-label)", letterSpacing: ".04em" }}
                >
                  AUTHORIZED PARTNER
                </span>
              </div>
            </Link>

            <Link
              href={otherLocaleHref}
              className="flex items-center gap-1.5 px-3 py-2 text-xs rounded transition-colors duration-200"
              style={{
                fontFamily: "var(--font-family-label)",
                fontWeight: 500,
                color: "var(--color-outline)",
                border: "1px solid var(--color-outline-variant)",
              }}
              aria-label={`Switch to ${otherLocaleLabel}`}
            >
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              {otherLocaleLabel}
            </Link>
            <Link href={`/${locale}/iletisim`} className="btn-cta text-sm">
              {t("cta")}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded"
            style={{ color: "var(--color-on-surface-variant)" }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label="Menüyü aç/kapat"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            className="lg:hidden py-4 border-t"
            style={{ borderColor: "var(--color-outline-variant)" }}
          >
            <ul className="flex flex-col gap-1" role="list">
              {/* Anasayfa */}
              <li>
                <Link
                  href={`/${locale}`}
                  className="block px-4 py-3 text-sm rounded transition-colors duration-200"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontWeight: 500,
                    color: "var(--color-on-surface-variant)",
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("home")}
                </Link>
              </li>

              {/* Kurumsal accordion */}
              <li>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-sm rounded"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontWeight: 500,
                    color: "var(--color-on-surface-variant)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onClick={() => setMobileKurulsalOpen((v) => !v)}
                >
                  {isTr ? "Kurumsal" : "Corporate"}
                  <ChevronDown
                    className="w-4 h-4 transition-transform duration-200"
                    style={{ transform: mobileKurulsalOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                {mobileKurulsalOpen && (
                  <ul className="ml-4 mb-2 flex flex-col gap-1" role="list">
                    {kurumsal.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link
                            href={`/${locale}/${item.href}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm rounded"
                            style={{ color: "var(--color-outline)" }}
                            onClick={() => { setIsMenuOpen(false); setMobileKurulsalOpen(false); }}
                          >
                            <Icon className="w-4 h-4 shrink-0" style={{ color: "var(--color-primary)" }} />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>

              {/* Hizmetler accordion */}
              <li>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-sm rounded"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontWeight: 500,
                    color: "var(--color-on-surface-variant)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onClick={() => setMobileServicesOpen((v) => !v)}
                >
                  {t("services")}
                  <ChevronDown
                    className="w-4 h-4 transition-transform duration-200"
                    style={{ transform: mobileServicesOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                {mobileServicesOpen && (
                  <ul className="ml-4 mb-2 flex flex-col gap-1" role="list">
                    {serviceItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link
                            href={`/${locale}/${item.href}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm rounded"
                            style={{ color: "var(--color-outline)" }}
                            onClick={() => { setIsMenuOpen(false); setMobileServicesOpen(false); }}
                          >
                            <Icon className="w-4 h-4 shrink-0" style={{ color: "var(--color-primary)" }} aria-hidden="true" />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>

              {/* Fortinet accordion */}
              <li>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-sm rounded"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontWeight: 500,
                    color: "var(--color-on-surface-variant)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onClick={() => setMobileFortinetOpen((v) => !v)}
                >
                  {t("fortinet")}
                  <ChevronDown
                    className="w-4 h-4 transition-transform duration-200"
                    style={{ transform: mobileFortinetOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                {mobileFortinetOpen && (
                  <div className="ml-4 mb-2">
                    <Link
                      href={`/${locale}/fortinet`}
                      className="block px-4 py-2 text-xs font-semibold mb-1"
                      style={{ color: "#EE3124", fontFamily: "var(--font-family-label)" }}
                      onClick={() => { setIsMenuOpen(false); setMobileFortinetOpen(false); }}
                    >
                      {isTr ? "Tüm Fortinet Ürünleri →" : "All Fortinet Products →"}
                    </Link>
                    {fortinetCategories.map((cat) => (
                      <div key={cat.label} className="mb-2">
                        <Link
                          href={`/${locale}/${cat.href}`}
                          className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded transition-colors"
                          style={{ color: cat.color, fontFamily: "var(--font-family-label)" }}
                          onClick={() => { setIsMenuOpen(false); setMobileFortinetOpen(false); }}
                        >
                          {cat.label} →
                        </Link>
                        {cat.products.slice(0, 3).map((p) => (
                          <div
                            key={p}
                            className="px-4 py-1 text-xs"
                            style={{ color: "var(--color-outline)" }}
                          >
                            {p}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </li>

              {/* Blog */}
              <li>
                <Link
                  href={`/${locale}/blog`}
                  className="block px-4 py-3 text-sm rounded"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontWeight: 500,
                    color: "var(--color-on-surface-variant)",
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Blog
                </Link>
              </li>

              {/* İletişim */}
              <li>
                <Link
                  href={`/${locale}/iletisim`}
                  className="block px-4 py-3 text-sm rounded"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    fontWeight: 500,
                    color: "var(--color-on-surface-variant)",
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("contact")}
                </Link>
              </li>
            </ul>

            <div className="flex items-center gap-3 mt-4 px-4">
              <Link
                href={otherLocaleHref}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded"
                style={{
                  fontFamily: "var(--font-family-label)",
                  color: "var(--color-outline)",
                  border: "1px solid var(--color-outline-variant)",
                }}
              >
                <Globe className="w-3.5 h-3.5" />
                {otherLocaleLabel}
              </Link>
              <Link
                href={`/${locale}/iletisim`}
                className="btn-cta text-sm flex-1 justify-center"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("cta")}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
