import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { MapPin, Phone, Mail, Clock, ShoppingCart, Headphones, Linkedin } from "lucide-react";
import ContactForm from "@/components/ui/ContactForm";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  return {
    title: isTr
      ? "İletişim - Ücretsiz BT Altyapı Analizi"
      : "Contact - Free IT Infrastructure Analysis",
    description: isTr
      ? "Lider Network uzman ekibiyle iletişime geçin. Fortinet NGFW, kurumsal ağ güvenliği ve BT altyapı çözümleri için ücretsiz analiz ve teklif alın. İstanbul, 7/24 destek."
      : "Contact Lider Network expert team. Get a free analysis and quote for Fortinet NGFW, enterprise network security and IT infrastructure solutions. Istanbul, 24/7 support.",
    alternates: {
      canonical: `${baseUrl}/${locale}/iletisim`,
      languages: {
        tr: `${baseUrl}/tr/iletisim`,
        en: `${baseUrl}/en/contact`,
      },
    },
    openGraph: {
      title: isTr
        ? "İletişim | Lider Network"
        : "Contact | Lider Network",
      description: isTr
        ? "Ücretsiz altyapı analizi için bize ulaşın. Fortinet ve enterprise ağ güvenliği çözümleri için uzman desteği."
        : "Contact us for a free infrastructure analysis. Expert support for Fortinet and enterprise network security solutions.",
      url: `${baseUrl}/${locale}/iletisim`,
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("contact");
  const isTr = locale === "tr";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isTr ? "Anasayfa" : "Home",
        item: `${baseUrl}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isTr ? "İletişim" : "Contact",
        item: `${baseUrl}/${locale}/iletisim`,
      },
    ],
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Lider Network Teknoloji",
    url: baseUrl,
    telephone: "+90-312-232-02-88",
    email: "info@lidernetwork.com.tr",
    address: {
      "@type": "PostalAddress",
      addressCountry: "TR",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative min-h-[72vh] flex items-end overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80"
            alt=""
            aria-hidden={true}
            fill
            className="object-cover"
            sizes="100vw"
            style={{ opacity: 0.25 }}
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,82,255,0.35) 0%, rgba(5,5,5,0.75) 50%, rgba(5,5,5,1) 100%)",
            }}
          />
          {/* Subtle circuit pattern */}
          <div className="absolute inset-0 circuit-bg opacity-30" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full px-5 lg:px-20 max-w-[1280px] mx-auto pt-36 pb-16">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol
              className="flex items-center gap-2 text-xs"
              style={{ color: "var(--color-outline)" }}
            >
              <li>
                <a href={`/${locale}`} style={{ color: "var(--color-outline)" }}>
                  {isTr ? "Anasayfa" : "Home"}
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li style={{ color: "var(--color-primary)" }}>
                {isTr ? "İletişim" : "Contact"}
              </li>
            </ol>
          </nav>

          <div className="max-w-2xl mb-16">
            {/* Live indicator */}
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-2 w-2 relative">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: "#10b981" }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: "#10b981" }}
                />
              </span>
              <span
                className="uppercase tracking-widest"
                style={{
                  fontFamily: "var(--font-family-label)",
                  fontSize: "12px",
                  color: "#10b981",
                }}
              >
                {isTr ? "7/24 Destek Aktif" : "24/7 Support Active"}
              </span>
            </div>

            <h1
              id="contact-page-title"
              className="text-5xl lg:text-7xl font-bold mb-6 leading-tight text-white"
              style={{
                fontFamily: "var(--font-family-headline)",
                letterSpacing: "-0.02em",
              }}
            >
              {t("title")}
            </h1>
            <p
              className="text-lg leading-relaxed max-w-xl"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              {t("subtitle")}
            </p>
          </div>

          {/* ── Quick Contact Channel Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sales */}
            <a
              href="mailto:satis@lidernetwork.com.tr"
              className="group p-6 rounded-xl industrial-border transition-all duration-300 hover:border-primary/60 hover:-translate-y-1"
              style={{ backgroundColor: "rgba(18,18,20,0.85)", backdropFilter: "blur(12px)" }}
            >
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(0,82,255,0.15)" }}
              >
                <ShoppingCart className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
              </div>
              <p
                className="text-xs uppercase tracking-widest mb-1 font-semibold"
                style={{ fontFamily: "var(--font-family-label)", color: "var(--color-outline)" }}
              >
                {isTr ? "Satış & Teklif" : "Sales & Quote"}
              </p>
              <p className="text-sm font-medium text-white">satis@lidernetwork.com.tr</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: "var(--color-primary)" }}>
                sales@lidernetwork.com.tr
              </p>
            </a>

            {/* General Info — highlighted */}
            <a
              href="mailto:info@lidernetwork.com.tr"
              className="group p-6 rounded-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
              style={{ backgroundColor: "#0052ff" }}
            >
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
                  backgroundSize: "16px 16px",
                }}
              />
              <div className="relative z-10">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <p
                  className="text-xs uppercase tracking-widest mb-1 font-semibold"
                  style={{ fontFamily: "var(--font-family-label)", color: "rgba(255,255,255,0.7)" }}
                >
                  {isTr ? "Genel Bilgi" : "General Info"}
                </p>
                <p className="text-sm font-medium text-white">info@lidernetwork.com.tr</p>
              </div>
            </a>

            {/* Phone */}
            <a
              href="tel:+903122320288"
              className="group p-6 rounded-xl industrial-border transition-all duration-300 hover:border-primary/60 hover:-translate-y-1"
              style={{ backgroundColor: "rgba(18,18,20,0.85)", backdropFilter: "blur(12px)" }}
            >
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(0,82,255,0.15)" }}
              >
                <Headphones className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
              </div>
              <p
                className="text-xs uppercase tracking-widest mb-1 font-semibold"
                style={{ fontFamily: "var(--font-family-label)", color: "var(--color-outline)" }}
              >
                {isTr ? "Telefon Destek" : "Phone Support"}
              </p>
              <p className="text-sm font-medium text-white">{t("info.phoneValue")}</p>
              <p
                className="text-xs mt-2"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                {isTr ? "Hft içi 08:30 – 17:30" : "Weekdays 08:30 – 17:30"}
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <section
        className="py-24 px-5 lg:px-20"
        style={{ backgroundColor: "var(--color-background)" }}
        aria-label={isTr ? "İletişim içeriği" : "Contact content"}
      >
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 xl:gap-16">

            {/* ── Left sidebar ── */}
            <aside className="lg:col-span-1 space-y-6">
              <div>
                <h2
                  className="text-2xl font-semibold mb-2"
                  style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
                >
                  {isTr ? "İletişim Bilgileri" : "Contact Information"}
                </h2>
                <div
                  className="h-0.5 w-12 rounded-full"
                  style={{ backgroundColor: "var(--color-primary)" }}
                />
              </div>

              {/* Address */}
              <div
                className="p-5 rounded-xl group transition-all hover:border-primary/40"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-outline-variant)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(0,82,255,0.1)" }}
                  >
                    <MapPin className="w-5 h-5" style={{ color: "var(--color-primary)" }} aria-hidden="true" />
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ fontFamily: "var(--font-family-label)", color: "var(--color-outline)" }}
                    >
                      {t("info.address")}
                    </p>
                    <a
                      href="https://maps.google.com/?q=Lider+Network+Teknoloji+İstanbul"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm leading-relaxed transition-colors"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {t("info.addressValue")}
                    </a>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div
                className="p-5 rounded-xl transition-all hover:border-primary/40"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-outline-variant)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(0,82,255,0.1)" }}
                  >
                    <Phone className="w-5 h-5" style={{ color: "var(--color-primary)" }} aria-hidden="true" />
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ fontFamily: "var(--font-family-label)", color: "var(--color-outline)" }}
                    >
                      {t("info.phone")}
                    </p>
                    <a
                      href="tel:+903122320288"
                      className="text-sm font-medium transition-colors"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {t("info.phoneValue")}
                    </a>
                  </div>
                </div>
              </div>

              {/* Emails — two separate cards */}
              <div
                className="p-5 rounded-xl transition-all hover:border-primary/40"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-outline-variant)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(0,82,255,0.1)" }}
                  >
                    <Mail className="w-5 h-5" style={{ color: "var(--color-primary)" }} aria-hidden="true" />
                  </div>
                  <div className="space-y-2 w-full">
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ fontFamily: "var(--font-family-label)", color: "var(--color-outline)" }}
                    >
                      {isTr ? "E-posta" : "Email"}
                    </p>
                    <div className="space-y-1">
                      <div>
                        <span className="text-xs" style={{ color: "var(--color-outline)" }}>
                          {isTr ? "Genel" : "General"}:{" "}
                        </span>
                        <a
                          href="mailto:info@lidernetwork.com.tr"
                          className="text-sm transition-colors hover:text-white"
                          style={{ color: "var(--color-on-surface-variant)" }}
                        >
                          info@lidernetwork.com.tr
                        </a>
                      </div>
                      <div>
                        <span className="text-xs" style={{ color: "var(--color-outline)" }}>
                          {isTr ? "Satış" : "Sales"}/{isTr ? "Teklif" : "Quote"}:{" "}
                        </span>
                        <a
                          href="mailto:satis@lidernetwork.com.tr"
                          className="text-sm transition-colors hover:text-white"
                          style={{ color: "var(--color-primary)" }}
                        >
                          satis@lidernetwork.com.tr
                        </a>
                      </div>
                      <div>
                        <a
                          href="mailto:sales@lidernetwork.com.tr"
                          className="text-sm transition-colors hover:text-white"
                          style={{ color: "var(--color-primary)" }}
                        >
                          sales@lidernetwork.com.tr
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div
                className="p-5 rounded-xl transition-all hover:border-primary/40"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-outline-variant)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(0,82,255,0.1)" }}
                  >
                    <Clock className="w-5 h-5" style={{ color: "var(--color-primary)" }} aria-hidden="true" />
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ fontFamily: "var(--font-family-label)", color: "var(--color-outline)" }}
                    >
                      {t("info.hours")}
                    </p>
                    <span
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {t("info.hoursValue")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div
                className="p-5 rounded-xl"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-outline-variant)",
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{ fontFamily: "var(--font-family-label)", color: "var(--color-outline)" }}
                >
                  {isTr ? "Sosyal Medya" : "Social Media"}
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://www.linkedin.com/company/lider-network-teknoloji-information-technologies/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5"
                    style={{
                      backgroundColor: "rgba(10,102,194,0.15)",
                      color: "#0a66c2",
                      border: "1px solid rgba(10,102,194,0.25)",
                    }}
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                </div>
              </div>
            </aside>

            {/* ── Contact Form ── */}
            <div className="lg:col-span-2">
              <div
                className="p-8 lg:p-10 rounded-2xl industrial-border"
                style={{
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <div className="mb-8">
                  <h2
                    className="text-2xl font-semibold mb-2"
                    style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
                  >
                    {isTr ? "Bize Mesaj Gönderin" : "Send Us a Message"}
                  </h2>
                  <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                    {isTr
                      ? "Uzman ekibimiz en geç 1 iş günü içinde geri dönecektir."
                      : "Our expert team will get back to you within 1 business day."}
                  </p>
                </div>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ─────────────────────────────────────────────── */}
      <section
        className="py-12 px-5 lg:px-20"
        style={{ backgroundColor: "rgba(18,18,20,0.6)", borderTop: "1px solid var(--color-outline-variant)" }}
      >
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: "15+", label: isTr ? "Yıllık Tecrübe" : "Years Experience" },
              { value: "99.9%", label: isTr ? "Uptime Garantisi" : "Uptime Guarantee" },
              { value: "15 Dak.", label: isTr ? "Müdahale Süresi" : "Response Time" },
              { value: "7/24", label: isTr ? "Teknik Destek" : "Technical Support" },
            ].map(({ value, label }) => (
              <div key={label} className="py-4">
                <p
                  className="text-3xl font-bold mb-1"
                  style={{ color: "var(--color-primary)" }}
                >
                  {value}
                </p>
                <p
                  className="text-xs uppercase tracking-widest opacity-60"
                  style={{ fontFamily: "var(--font-family-label)" }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
