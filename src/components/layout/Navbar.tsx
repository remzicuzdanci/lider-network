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
  Headphones,
  Search,
  Wrench,
  KeyRound,
  BanIcon,
  Activity,
} from "lucide-react";

const IT_TOOLS = [
  { label: "Threat Portal",    labelEn: "Threat Portal",    sub: "USOM tehdit istihbaratı",    subEn: "USOM threat intelligence", href: "https://threat.lidernetwork.com.tr",    color: "#4f7cff", Icon: Shield },
  { label: "Kara Liste",       labelEn: "Blacklist Check",  sub: "IP / domain kara liste",     subEn: "IP / domain blacklist",    href: "https://blacklist.lidernetwork.com.tr", color: "#ef4444", Icon: BanIcon },
  { label: "IP Analiz",        labelEn: "IP Analysis",      sub: "Konum & itibar analizi",     subEn: "Location & reputation",    href: "https://ip.lidernetwork.com.tr",        color: "#10b981", Icon: Globe },
  { label: "DNS Checker",      labelEn: "DNS Checker",      sub: "DNS, SPF/DKIM, SSL, WHOIS",  subEn: "DNS, SPF/DKIM, SSL, WHOIS",href: "https://dns.lidernetwork.com.tr",       color: "#f59e0b", Icon: Search },
  { label: "Şifre Oluşturucu", labelEn: "Password Gen",     sub: "Güvenli şifre üretici",      subEn: "Secure password creator",  href: "https://password.lidernetwork.com.tr",  color: "#8b5cf6", Icon: KeyRound },
  { label: "Site Kontrol",     labelEn: "Site Monitor",     sub: "Erişilebilirlik kontrolü",   subEn: "Availability check",       href: "https://uptime.lidernetwork.com.tr",    color: "#06b6d4", Icon: Activity },
  { label: "SSL Kontrolü",    labelEn: "SSL Checker",      sub: "Sertifika geçerlilik",       subEn: "Certificate validity",     href: "https://ssl.lidernetwork.com.tr",       color: "#a78bfa", Icon: Lock },
  { label: "Subnet Hesap",    labelEn: "Subnet Calc",      sub: "IP/CIDR hesaplayıcı",        subEn: "IP/CIDR calculator",       href: "https://subnet.lidernetwork.com.tr",    color: "#34d399", Icon: Network },
] as const;

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
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileFortinetOpen, setMobileFortinetOpen] = useState(false);
  const [mobileKurulsalOpen, setMobileKurulsalOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const servicesRef = useRef<HTMLLIElement>(null);
  const fortinetRef = useRef<HTMLLIElement>(null);
  const kurulsalRef = useRef<HTMLLIElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  const closeAll = () => {
    setServicesOpen(false);
    setFortinetOpen(false);
    setKurulsalOpen(false);
    setToolsOpen(false);
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
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
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
                width={160}
                height={58}
                style={{ height: 58, width: "auto", objectFit: "contain", display: "block" }}
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
                      {isTr ? "Fortinet Yetkili Partner — 2006'dan beri" : "Fortinet Authorized Partner — since 2006"}
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

            {/* IT Araçları pill — dropdown */}
            <div ref={toolsRef} className="relative">
              <button
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded transition-all duration-200"
                style={{
                  fontFamily: "var(--font-family-label)",
                  fontWeight: 500,
                  color: "#06b6d4",
                  border: `1px solid ${toolsOpen ? "rgba(6,182,212,0.6)" : "rgba(6,182,212,0.3)"}`,
                  backgroundColor: toolsOpen ? "rgba(6,182,212,0.14)" : "rgba(6,182,212,0.06)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  setToolsOpen(true); setServicesOpen(false); setFortinetOpen(false); setKurulsalOpen(false);
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(6,182,212,0.6)";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(6,182,212,0.14)";
                }}
                onMouseLeave={(e) => {
                  if (!toolsOpen) {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(6,182,212,0.3)";
                    (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(6,182,212,0.06)";
                  }
                }}
                onClick={() => setToolsOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={toolsOpen}
              >
                <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
                {isTr ? "IT Araçları" : "IT Tools"}
                <ChevronDown className="w-3 h-3 transition-transform duration-200" style={{ transform: toolsOpen ? "rotate(180deg)" : "rotate(0deg)" }} aria-hidden="true" />
              </button>

              {toolsOpen && (
                <div
                  className="absolute top-full right-0 mt-2 w-[480px] rounded-2xl p-4 shadow-2xl"
                  style={{
                    backgroundColor: "rgba(16,20,21,0.98)",
                    border: "1px solid rgba(6,182,212,0.25)",
                    backdropFilter: "blur(20px)",
                  }}
                  onMouseLeave={() => setToolsOpen(false)}
                >
                  <div className="flex items-center gap-2 mb-3 pb-3" style={{ borderBottom: "1px solid rgba(6,182,212,0.15)" }}>
                    <Wrench className="w-3.5 h-3.5" style={{ color: "#06b6d4" }} />
                    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#06b6d4", fontFamily: "var(--font-family-label)" }}>
                      {isTr ? "Ücretsiz IT Güvenlik Araçları" : "Free IT Security Tools"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {IT_TOOLS.map((tool) => {
                      const Icon = tool.Icon;
                      return (
                        <a
                          key={tool.href}
                          href={tool.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150"
                          style={{ textDecoration: "none", color: "var(--color-on-surface-variant)", border: `1px solid ${tool.color}18` }}
                          onClick={() => setToolsOpen(false)}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = `${tool.color}12`; (e.currentTarget as HTMLElement).style.borderColor = `${tool.color}40`; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = `${tool.color}18`; }}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${tool.color}18`, border: `1px solid ${tool.color}30` }}>
                            <Icon className="w-4 h-4" style={{ color: tool.color }} aria-hidden="true" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-family-label)" }}>{isTr ? tool.label : tool.labelEn}</div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--color-outline)" }}>{isTr ? tool.sub : tool.subEn}</div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Fortinet Partner Badge */}
            <Link
              href={`/${locale}/fortinet`}
              className="transition-all duration-200 hover:scale-105"
              style={{ textDecoration: "none", display: "flex", alignItems: "center" }}
              title="Fortinet Partner"
            >
              <div style={{
                background: "#fff",
                borderRadius: "8px",
                padding: "2px 4px",
                display: "flex",
                alignItems: "center",
                boxShadow: "0 2px 10px rgba(0,0,0,.28)",
              }}>
                <Image
                  src="/fort-removebg-preview.png"
                  alt="Fortinet Authorized Partner"
                  width={180}
                  height={52}
                  quality={100}
                  style={{ objectFit: "contain", display: "block", height: 48, width: "auto" }}
                />
              </div>
            </Link>

            {/* Destek Portalı küçük link */}
            <a
              href="https://destek.lidernetwork.com.tr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-xs rounded transition-all duration-200"
              style={{
                fontFamily: "var(--font-family-label)",
                fontWeight: 500,
                color: "var(--color-primary)",
                border: "1px solid rgba(0,82,255,0.3)",
                backgroundColor: "rgba(0,82,255,0.06)",
                textDecoration: "none",
              }}
              title={isTr ? "Müşteri Destek Portalı" : "Customer Support Portal"}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,82,255,0.14)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,82,255,0.6)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,82,255,0.06)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,82,255,0.3)";
              }}
            >
              <Headphones className="w-3.5 h-3.5" aria-hidden="true" />
              {isTr ? "Destek" : "Support"}
            </a>

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

              {/* IT Araçları accordion */}
              <li>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-sm rounded"
                  style={{ fontFamily: "var(--font-family-label)", fontWeight: 500, color: "var(--color-on-surface-variant)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  onClick={() => setMobileToolsOpen((v) => !v)}
                >
                  <span className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" style={{ color: "#06b6d4" }} />
                    {isTr ? "IT Araçları" : "IT Tools"}
                  </span>
                  <ChevronDown className="w-4 h-4 transition-transform duration-200" style={{ transform: mobileToolsOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>
                {mobileToolsOpen && (
                  <ul className="ml-4 mb-2 flex flex-col gap-1" role="list">
                    {IT_TOOLS.map((tool) => {
                      const Icon = tool.Icon;
                      return (
                        <li key={tool.href}>
                          <a
                            href={tool.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 text-sm rounded"
                            style={{ color: tool.color, textDecoration: "none" }}
                            onClick={() => { setIsMenuOpen(false); setMobileToolsOpen(false); }}
                          >
                            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                            {isTr ? tool.label : tool.labelEn}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>

              {/* Blog */}
              <li>
                <Link
                  href={`/${locale}/blog`}
                  className="block px-4 py-3 text-sm rounded"
                  style={{ fontFamily: "var(--font-family-label)", fontWeight: 500, color: "var(--color-on-surface-variant)" }}
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

            {/* Mobil — Destek Portalı */}
            <div className="px-4 mt-2">
              <a
                href="https://destek.lidernetwork.com.tr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full px-4 py-3 text-sm rounded"
                style={{
                  fontFamily: "var(--font-family-label)",
                  fontWeight: 600,
                  color: "var(--color-primary)",
                  border: "1px solid rgba(0,82,255,0.3)",
                  backgroundColor: "rgba(0,82,255,0.06)",
                  textDecoration: "none",
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                <Headphones className="w-4 h-4" aria-hidden="true" />
                {isTr ? "Destek Portalı" : "Support Portal"}
              </a>
            </div>

            <div className="flex items-center gap-3 mt-3 px-4">
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
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
