"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Linkedin,
} from "lucide-react";

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: `/${locale}`, label: t("nav.home") },
    { href: `/${locale}/hizmetler`, label: t("nav.services") },
    { href: `/${locale}/fortinet`, label: t("nav.fortinet") },
    { href: `/${locale}/hakkimizda`, label: t("nav.about") },
    { href: `/${locale}/iletisim`, label: t("nav.contact") },
    { href: "https://destek.lidernetwork.com.tr", label: locale === "tr" ? "🎧 Destek Portalı" : "🎧 Support Portal", external: true },
  ];

  const solutions = [
    { href: `/${locale}/siber-guvenlik`, label: locale === "tr" ? "Siber Güvenlik" : "Cybersecurity" },
    { href: `/${locale}/veri-depolama`, label: locale === "tr" ? "Veri Depolama" : "Data Storage" },
    { href: `/${locale}/bulut-cozumleri`, label: locale === "tr" ? "Bulut Çözümleri" : "Cloud Solutions" },
    { href: `/${locale}/ag-entegrasyon`, label: locale === "tr" ? "Ağ Altyapısı" : "Network Infrastructure" },
    { href: `/${locale}/bt-danismanligi`, label: locale === "tr" ? "BT Danışmanlığı" : "IT Consulting" },
    { href: `/${locale}/sanallastirma`, label: locale === "tr" ? "Sanallaştırma" : "Virtualization" },
  ];

  return (
    <footer
      role="contentinfo"
      style={{
        backgroundColor: "var(--color-surface)",
        borderTop: "1px solid var(--color-outline-variant)",
      }}
    >
      <div className="container">
        {/* Main Footer */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link
              href={`/${locale}`}
              className="flex items-start mb-5"
              aria-label="Lider Network"
            >
              <div
                className="transition-opacity duration-200 opacity-90 hover:opacity-100"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 8,
                  padding: "6px 16px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <Image
                  src="/logo.png"
                  alt="Lider Network"
                  width={130}
                  height={52}
                  style={{ height: 52, width: "auto", objectFit: "contain", display: "block" }}
                />
              </div>
            </Link>
            <p
              className="text-sm leading-relaxed mb-6"
              style={{ color: "var(--color-outline)" }}
            >
              {t("footer.description")}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                {
                  href: "https://www.linkedin.com/company/lider-network-teknoloji-information-technologies/",
                  icon: Linkedin,
                  label: "LinkedIn",
                },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded flex items-center justify-center transition-colors duration-200"
                  style={{
                    border: "1px solid var(--color-outline-variant)",
                    color: "var(--color-outline)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = "var(--color-primary)";
                    el.style.color = "var(--color-primary)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = "var(--color-outline-variant)";
                    el.style.color = "var(--color-outline)";
                  }}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3
              className="text-sm font-semibold mb-4"
              style={{
                fontFamily: "var(--font-family-label)",
                color: "var(--color-on-surface)",
              }}
            >
              {t("footer.quickLinks")}
            </h3>
            <ul className="flex flex-col gap-2" role="list">
              {quickLinks.map((link) => (
                <li key={link.href + link.label}>
                  {"external" in link && link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm transition-colors duration-200"
                      style={{ color: "var(--color-primary)" }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.opacity = "0.75";
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.opacity = "1";
                      }}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm transition-colors duration-200"
                      style={{ color: "var(--color-outline)" }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.color =
                          "var(--color-primary)";
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.color =
                          "var(--color-outline)";
                      }}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3
              className="text-sm font-semibold mb-4"
              style={{
                fontFamily: "var(--font-family-label)",
                color: "var(--color-on-surface)",
              }}
            >
              {t("footer.solutions")}
            </h3>
            <ul className="flex flex-col gap-2" role="list">
              {solutions.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200"
                    style={{ color: "var(--color-outline)" }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.color =
                        "var(--color-primary)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.color =
                        "var(--color-outline)";
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3
              className="text-sm font-semibold mb-4"
              style={{
                fontFamily: "var(--font-family-label)",
                color: "var(--color-on-surface)",
              }}
            >
              {t("footer.contactUs")}
            </h3>
            <address className="not-italic flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <MapPin
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: "var(--color-primary)" }}
                  aria-hidden="true"
                />
                <span
                  className="text-sm"
                  style={{ color: "var(--color-outline)" }}
                >
                  {t("contact.info.addressValue")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone
                  className="w-4 h-4 shrink-0"
                  style={{ color: "var(--color-primary)" }}
                  aria-hidden="true"
                />
                <a
                  href="tel:+903122320288"
                  className="text-sm transition-colors duration-200"
                  style={{ color: "var(--color-outline)" }}
                >
                  {t("contact.info.phoneValue")}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail
                  className="w-4 h-4 shrink-0"
                  style={{ color: "var(--color-primary)" }}
                  aria-hidden="true"
                />
                <a
                  href="mailto:info@lidernetwork.com.tr"
                  className="text-sm transition-colors duration-200"
                  style={{ color: "var(--color-outline)" }}
                >
                  {t("contact.info.emailValue")}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Clock
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: "var(--color-primary)" }}
                  aria-hidden="true"
                />
                <span
                  className="text-sm"
                  style={{ color: "var(--color-outline)" }}
                >
                  {t("contact.info.hoursValue")}
                </span>
              </div>
            </address>
          </div>
        </div>

        {/* Footer Bottom */}
        <div
          className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{
            borderTop: "1px solid var(--color-outline-variant)",
            color: "var(--color-outline)",
          }}
        >
          <p>
            &copy; {currentYear} Lider Network. {t("footer.allRights")}
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link
              href={`/${locale}/kvkk`}
              className="transition-colors duration-200 hover:text-white"
              style={{ color: "var(--color-outline)" }}
            >
              KVKK & Gizlilik
            </Link>
            <Link
              href={`/${locale}/cozum-ortaklarimiz`}
              className="transition-colors duration-200 hover:text-white"
              style={{ color: "var(--color-outline)" }}
            >
              Çözüm Ortakları
            </Link>
            <Link
              href={`/${locale}/hakkimizda`}
              className="transition-colors duration-200 hover:text-white"
              style={{ color: "var(--color-outline)" }}
            >
              {locale === "tr" ? "Hakkımızda" : "About Us"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
