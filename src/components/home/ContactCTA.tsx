"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Phone } from "lucide-react";
import { trackPhoneClick } from "@/lib/gtag";

export default function ContactCTA() {
  const locale = useLocale();

  return (
    <section
      className="section"
      style={{ backgroundColor: "var(--color-surface)" }}
      aria-label="İletişim CTA"
    >
      <div className="container">
        <div
          className="relative overflow-hidden rounded-2xl p-10 md:p-16 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(0, 82, 255, 0.15) 0%, rgba(0, 82, 255, 0.05) 50%, rgba(183, 196, 255, 0.05) 100%)",
            border: "1px solid rgba(0, 82, 255, 0.2)",
          }}
        >
          {/* Background decorations */}
          <div
            className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(0, 82, 255, 0.15) 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(183, 196, 255, 0.08) 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
              style={{
                fontFamily: "var(--font-family-headline)",
                color: "var(--color-on-surface)",
              }}
            >
              {locale === "tr"
                ? "Projenizi Bugün Başlatalım"
                : "Let's Start Your Project Today"}
            </h2>
            <p
              className="text-lg mb-10"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              {locale === "tr"
                ? "Altyapınız için ücretsiz analiz ve özel teklif almak üzere uzman ekibimizle görüşün."
                : "Talk to our expert team for a free analysis and custom quote for your infrastructure."}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/${locale}/iletisim`}
                className="btn-cta text-base px-8 py-4 w-full sm:w-auto justify-center"
              >
                {locale === "tr"
                  ? "Ücretsiz Analiz Al"
                  : "Get Free Analysis"}
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
              <a
                href="tel:+903122320288"
                className="btn-secondary text-base px-8 py-4 w-full sm:w-auto justify-center"
                onClick={() => trackPhoneClick("contact_cta")}
              >
                <Phone className="w-5 h-5" aria-hidden="true" />
                +90 312 232 02 88
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
              {[
                locale === "tr" ? "Ücretsiz Danışmanlık" : "Free Consultation",
                locale === "tr" ? "Hızlı Yanıt" : "Quick Response",
                locale === "tr" ? "Garanti Taahhüdü" : "Service Guarantee",
                locale === "tr" ? "7/24 Destek" : "24/7 Support",
              ].map((badge) => (
                <span
                  key={badge}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "var(--color-primary)" }}
                    aria-hidden="true"
                  />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
