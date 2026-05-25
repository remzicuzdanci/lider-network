"use client";

import { useTranslations } from "next-intl";
import { TrendingUp, Zap, HeadphonesIcon, Award } from "lucide-react";
import CountUp from "@/components/ui/CountUp";

const icons = [TrendingUp, Zap, HeadphonesIcon, Award];

export default function Stats() {
  const t = useTranslations("hero");

  const stats = [
    {
      label: t("stat1"),
      icon: icons[0],
      description: "Yıllık uptime garantisi",
      countUp: <CountUp end={99.9} suffix="%" decimals={1} />,
    },
    {
      label: t("stat2"),
      icon: icons[1],
      description: "Ultra düşük gecikme",
      countUp: <span>&lt;1ms</span>,
    },
    {
      label: t("stat3"),
      icon: icons[2],
      description: "Kesintisiz hizmet",
      countUp: <span>7/24</span>,
    },
    {
      label: t("stat4"),
      icon: icons[3],
      description: "Başarıyla tamamlanan",
      countUp: <CountUp end={500} suffix="+" />,
    },
  ];

  return (
    <section
      className="section"
      style={{ backgroundColor: "var(--color-surface)" }}
      aria-label="İstatistikler"
    >
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article
                key={stat.label}
                className="text-center p-6 rounded-xl"
                style={{
                  backgroundColor: "var(--color-surface-high)",
                  border: "1px solid var(--color-outline-variant)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    backgroundColor: "rgba(0, 82, 255, 0.1)",
                  }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: "var(--color-primary)" }}
                    aria-hidden="true"
                  />
                </div>
                <div
                  className="text-3xl font-bold mb-1"
                  style={{
                    fontFamily: "var(--font-family-headline)",
                    color: "var(--color-primary)",
                  }}
                >
                  {stat.countUp}
                </div>
                <div
                  className="text-sm font-medium mb-1"
                  style={{
                    fontFamily: "var(--font-family-label)",
                    color: "var(--color-on-surface)",
                  }}
                >
                  {stat.label}
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--color-outline)" }}
                >
                  {stat.description}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
