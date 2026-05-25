"use client";

import { useLocale } from "next-intl";

const row1 = [
  "Roche", "Ankara Valiliği", "Jandarma Genel Komutanlığı", "Türk Deniz Kuvvetleri",
  "Gazi Üniversitesi", "KIA Türkiye", "Ulusoy Enerji", "Fransız Kültür Merkezi",
  "Kırıkkale Üniversitesi", "Vilayetler Hizmet Birliği", "Alo Sigortam",
];

const row2 = [
  "Ulusoy Raylı Sistemler", "Gıpta Grup", "Panda Alüminyum", "Midi Hotel",
  "Koza İnşaat", "Usta İnşaat", "ETS Grup", "MySilo", "AKNET",
  "Universal Mine", "KSE Maden", "Karamehmetler",
];

function MarqueeRow({
  items,
  direction = "left",
  color,
}: {
  items: string[];
  direction?: "left" | "right";
  color: string;
}) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden select-none">
      <div className={direction === "left" ? "marquee-left" : "marquee-right"} style={{ display: "flex", gap: "12px", width: "max-content" }}>
        {doubled.map((name, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap"
            style={{
              backgroundColor: `${color}0d`,
              border: `1px solid ${color}22`,
              color: "var(--color-on-surface-variant)",
              fontFamily: "var(--font-family-label)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color, opacity: 0.7 }} />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ClientMarquee() {
  const locale = useLocale();
  const isTr = locale === "tr";

  return (
    <section
      className="py-14 marquee-wrap overflow-hidden"
      style={{
        backgroundColor: "var(--color-background)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
      aria-label={isTr ? "Referans müşteriler" : "Reference clients"}
    >
      {/* Header */}
      <div className="text-center mb-8 px-6">
        <p
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
        >
          {isTr
            ? "Devlet kurumları, global markalar ve sanayi devleri güveniyor"
            : "Trusted by government institutions, global brands and industry leaders"}
        </p>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-3">
        <MarqueeRow items={row1} direction="left"  color="#0052ff" />
        <MarqueeRow items={row2} direction="right" color="#EE3124" />
      </div>

      {/* Footer */}
      <div className="text-center mt-8 px-6">
        <p className="text-xs" style={{ color: "var(--color-outline)" }}>
          {isTr ? "ve 50+ kurum daha →" : "and 50+ more organizations →"}{" "}
          <a
            href={`/${locale}/referanslar`}
            className="underline underline-offset-2 hover:text-white transition-colors"
            style={{ color: "var(--color-primary)" }}
          >
            {isTr ? "Tüm referansları gör" : "View all references"}
          </a>
        </p>
      </div>
    </section>
  );
}
