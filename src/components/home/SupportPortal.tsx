"use client";

import { useLocale } from "next-intl";
import {
  Headphones,
  TicketCheck,
  Clock,
  Bell,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Gauge,
} from "lucide-react";

export default function SupportPortal() {
  const locale = useLocale();
  const isTr = locale === "tr";

  const features = [
    {
      icon: TicketCheck,
      title: isTr ? "Çevrimiçi Talep Yönetimi" : "Online Ticket Management",
      desc: isTr
        ? "Destek taleplerinizi web üzerinden açın, takip edin ve geçmiş kayıtlarınıza ulaşın."
        : "Open support tickets online, track them in real time, and access your history.",
    },
    {
      icon: Clock,
      title: isTr ? "7/24 Erişim" : "24/7 Access",
      desc: isTr
        ? "Mesai saati gözetmeksizin sistem üzerinden talep oluşturun, ekibimiz ilgilenir."
        : "Submit requests any time — our team responds according to your SLA.",
    },
    {
      icon: Bell,
      title: isTr ? "Anlık E-posta Bildirimleri" : "Instant Email Notifications",
      desc: isTr
        ? "Talebinizin her adımında otomatik bildirimler alın, süreci takip edin."
        : "Get automatic notifications at every step — never wonder about your ticket's status.",
    },
    {
      icon: Gauge,
      title: isTr ? "SLA Garantisi" : "SLA Guarantee",
      desc: isTr
        ? "Öncelik seviyenize göre tanımlı yanıt süreleri ve çözüm taahhütleriyle güvenli hizmet."
        : "Defined response and resolution times per priority — backed by our SLA commitment.",
    },
  ];

  return (
    <section
      className="section"
      style={{ backgroundColor: "var(--color-background)" }}
      aria-labelledby="support-portal-title"
      id="destek-portali"
    >
      <div className="container">
        {/* Top label */}
        <div className="text-center mb-14">
          <span
            className="uppercase tracking-widest mb-4 block"
            style={{
              color: "var(--color-primary)",
              fontFamily: "var(--font-family-label)",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            {isTr ? "Sözleşmeli Müşteriler" : "Contract Customers"}
          </span>
          <h2
            id="support-portal-title"
            className="text-4xl lg:text-5xl font-semibold mb-4"
            style={{
              fontFamily: "var(--font-family-headline)",
              letterSpacing: "-0.01em",
              color: "var(--color-on-surface)",
            }}
          >
            {isTr ? "Destek Portalı" : "Support Portal"}
          </h2>
          <p
            className="max-w-2xl mx-auto text-base"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            {isTr
              ? "Sözleşmeli şirketlerin teknik destek taleplerini kolayca yönettiği, anlık bildirimler ve SLA takibi sunan özel müşteri paneli."
              : "A dedicated customer panel for contracted companies to manage support tickets, with real-time notifications and SLA tracking."}
          </p>
        </div>

        {/* Main card */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            border: "1px solid rgba(0, 82, 255, 0.2)",
            background:
              "linear-gradient(135deg, rgba(0,56,199,0.12) 0%, rgba(0,82,255,0.06) 50%, rgba(17,20,35,0) 100%)",
          }}
        >
          {/* Glow blob top-left */}
          <div
            className="absolute top-0 left-0 w-80 h-80 rounded-full blur-3xl pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(0,82,255,0.12) 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />
          {/* Glow blob bottom-right */}
          <div
            className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(183,196,255,0.06) 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

              {/* Left — headline + CTA */}
              <div>
                {/* Icon badge */}
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
                  style={{
                    backgroundColor: "rgba(0, 82, 255, 0.12)",
                    border: "1px solid rgba(0, 82, 255, 0.25)",
                  }}
                >
                  <Headphones
                    className="w-7 h-7"
                    style={{ color: "var(--color-primary)" }}
                    aria-hidden="true"
                  />
                </div>

                <h3
                  className="text-2xl sm:text-3xl font-bold mb-4"
                  style={{
                    fontFamily: "var(--font-family-headline)",
                    color: "var(--color-on-surface)",
                  }}
                >
                  {isTr
                    ? "destek.lidernetwork.com.tr"
                    : "destek.lidernetwork.com.tr"}
                </h3>

                <p
                  className="text-base mb-8 leading-relaxed"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  {isTr
                    ? "Teknik destek taleplerinizi kolayca oluşturun, durumlarını gerçek zamanlı takip edin ve geçmiş kayıtlarınıza dilediğiniz zaman ulaşın."
                    : "Easily create technical support requests, track their status in real time, and access your history whenever you need."}
                </p>

                {/* Checklist */}
                <ul className="flex flex-col gap-3 mb-10">
                  {(isTr
                    ? [
                        "Şirket hesabıyla güvenli giriş",
                        "Talep önceliği ve kategorisi seçimi",
                        "Mail bildirimleri ve çözüm raporu",
                        "Memnuniyet değerlendirmesi",
                      ]
                    : [
                        "Secure login with company account",
                        "Ticket priority and category selection",
                        "Email notifications and resolution reports",
                        "Satisfaction rating per ticket",
                      ]
                  ).map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle2
                        className="w-4 h-4 shrink-0"
                        style={{ color: "var(--color-primary)" }}
                        aria-hidden="true"
                      />
                      <span
                        className="text-sm"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <a
                  href="https://destek.lidernetwork.com.tr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-semibold text-sm px-7 py-4 rounded-xl transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg, #0038c7 0%, #0052ff 100%)",
                    color: "#fff",
                    boxShadow: "0 4px 20px rgba(0,82,255,0.35)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 6px 28px rgba(0,82,255,0.5)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 4px 20px rgba(0,82,255,0.35)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }}
                >
                  {isTr ? "Destek Portalına Git" : "Go to Support Portal"}
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>

                <p
                  className="mt-4 text-xs"
                  style={{ color: "var(--color-on-surface-variant)", opacity: 0.6 }}
                >
                  {isTr
                    ? "Yalnızca sözleşmeli müşterilere açıktır. Hesap talebi için iletişime geçin."
                    : "Available to contracted customers only. Contact us to request access."}
                </p>
              </div>

              {/* Right — feature cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.title}
                      className="p-5 rounded-xl transition-all duration-200"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(141,144,162,0.12)",
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                        style={{
                          backgroundColor: "rgba(0, 82, 255, 0.1)",
                          border: "1px solid rgba(0, 82, 255, 0.18)",
                        }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: "var(--color-primary)" }}
                          aria-hidden="true"
                        />
                      </div>
                      <h4
                        className="text-sm font-semibold mb-2"
                        style={{
                          fontFamily: "var(--font-family-headline)",
                          color: "var(--color-on-surface)",
                        }}
                      >
                        {f.title}
                      </h4>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        {f.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
