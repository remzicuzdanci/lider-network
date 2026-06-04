"use client";

import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  ShieldCheck,
  Clock,
  Zap,
} from "lucide-react";
import CountUp from "@/components/ui/CountUp";
import AnimatedBar from "@/components/ui/AnimatedBar";

const expertiseIcons = [BadgeCheck, ShieldCheck, Clock, Zap];
const expertiseKeys = ["team", "guarantee", "support", "speed"] as const;

export default function Expertise() {
  const t = useTranslations("expertise");

  return (
    <section
      className="section"
      style={{ backgroundColor: "var(--color-surface)" }}
      id="neden-biz"
      aria-labelledby="expertise-title"
    >
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text Content */}
          <div>
            <h2
              id="expertise-title"
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
              style={{
                fontFamily: "var(--font-family-headline)",
                color: "var(--color-on-surface)",
              }}
            >
              {t("title")}
            </h2>
            <p
              className="text-lg mb-10"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              {t("subtitle")}
            </p>

            {/* Feature list */}
            <ul className="flex flex-col gap-6" role="list">
              {expertiseKeys.map((key, index) => {
                const Icon = expertiseIcons[index];
                return (
                  <li key={key} className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: "rgba(0, 82, 255, 0.1)",
                        border: "1px solid rgba(0, 82, 255, 0.2)",
                      }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: "var(--color-primary)" }}
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h3
                        className="text-base font-semibold mb-1"
                        style={{
                          fontFamily: "var(--font-family-headline)",
                          color: "var(--color-on-surface)",
                        }}
                      >
                        {t(`items.${key}.title`)}
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        {t(`items.${key}.description`)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right: Visual Card */}
          <div
            className="relative p-8 rounded-2xl"
            style={{
              backgroundColor: "var(--color-surface-high)",
              border: "1px solid var(--color-outline-variant)",
            }}
          >
            {/* Decorative glow */}
            <div
              className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(0, 82, 255, 0.1) 0%, transparent 70%)",
              }}
              aria-hidden="true"
            />

            <div className="relative z-10">
              <div
                className="text-sm font-semibold mb-2"
                style={{
                  fontFamily: "var(--font-family-label)",
                  color: "var(--color-outline)",
                }}
              >
                PROJE BAŞARI ORANI
              </div>
              <div
                className="text-6xl font-bold mb-6"
                style={{
                  fontFamily: "var(--font-family-headline)",
                  color: "var(--color-primary)",
                }}
              >
                <CountUp end={98} suffix="%" />
              </div>

              {/* Progress bars */}
              {[
                { label: "Müşteri Memnuniyeti", value: 98, delay: 0 },
                { label: "Zamanında Teslim", value: 96, delay: 150 },
                { label: "SLA Uyum Oranı", value: 99, delay: 300 },
                { label: "Tekrar Eden Müşteri", value: 85, delay: 450 },
              ].map((item) => (
                <div key={item.label} className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{
                        fontFamily: "var(--font-family-label)",
                        color: "var(--color-primary)",
                      }}
                    >
                      {item.value}%
                    </span>
                  </div>
                  <AnimatedBar value={item.value} delay={item.delay} />
                </div>
              ))}

              {/* Certifications */}
              <div
                className="mt-8 pt-6"
                style={{ borderTop: "1px solid var(--color-outline-variant)" }}
              >
                <div
                  className="text-xs font-semibold mb-3"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    color: "var(--color-outline)",
                  }}
                >
                  YETKİLİ ORTAKLIKLAR
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Fortinet Yetkili Partner",
                    "Google Cloud Partner",
                  ].map((cert) => (
                    <span
                      key={cert}
                      className="text-xs px-2.5 py-1 rounded"
                      style={{
                        backgroundColor: "rgba(183, 196, 255, 0.08)",
                        border: "1px solid rgba(183, 196, 255, 0.15)",
                        color: "var(--color-primary)",
                        fontFamily: "var(--font-family-label)",
                      }}
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
