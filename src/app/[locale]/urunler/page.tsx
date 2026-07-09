import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { brands } from "@/data/products";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Ürün Kataloğu | Fortinet, Synology, HPE, Dell — Lider Network",
    description:
      "Fortinet FortiGate, FortiSwitch, FortiAP; Synology NAS; HPE ProLiant ve Dell PowerEdge sunucu modellerinin tüm portföyü. Teklif almak için iletişime geçin.",
    keywords: [
      "fortigate modeller", "synology nas modeller", "hpe proliant sunucu",
      "dell poweredge sunucu", "fortinet ürün listesi", "ağ güvenliği cihaz",
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/urunler`,
      languages: {
        tr: `${baseUrl}/tr/urunler`,
        en: `${baseUrl}/en/urunler`,
      },
    },
  };
}

export default async function UrunlerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="pt-20">
      {/* Hero */}
      <section
        className="py-20 px-5 lg:px-20 max-w-[1280px] mx-auto"
        style={{ borderBottom: "1px solid rgba(141,144,162,0.15)" }}
      >
        <div className="max-w-3xl">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-8"
            style={{
              backgroundColor: "rgba(0,82,255,0.08)",
              borderColor: "rgba(0,82,255,0.25)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
            <span
              className="uppercase tracking-[0.2em]"
              style={{ fontFamily: "var(--font-family-label)", fontSize: "11px", color: "var(--color-primary)" }}
            >
              Ürün Kataloğu
            </span>
          </div>
          <h1
            className="text-5xl lg:text-6xl font-bold leading-tight mb-6"
            style={{ fontFamily: "var(--font-family-headline)", letterSpacing: "-0.02em", color: "var(--color-on-surface)" }}
          >
            Tüm{" "}
            <span style={{ color: "var(--color-primary)" }}>Ürün Portföyümüz</span>
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
            Fortinet, Synology, HPE ve Dell ürünlerinin yetkili satıcısı olarak
            tüm portföyü sunuyoruz. Her ürün için teknik destek, kurulum ve
            lisans yönetimi hizmetleri dahildir.
          </p>
        </div>
      </section>

      {/* Brand Grid */}
      <section className="py-16 px-5 lg:px-20 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/${locale}/urunler/${brand.slug}`}
              className="group industrial-border rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "#191c1e", minHeight: 240 }}
            >
              <div>
                <h2
                  className="text-3xl font-bold text-white mb-3"
                  style={{ fontFamily: "var(--font-family-headline)" }}
                >
                  {brand.name}
                </h2>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--color-on-surface-variant)" }}>
                  {brand.description}
                </p>

                {/* Kategori etiketleri */}
                <div className="flex flex-wrap gap-2">
                  {brand.categories.map((cat) => (
                    <span
                      key={cat.slug}
                      className="text-xs px-2.5 py-1 rounded"
                      style={{
                        backgroundColor: `${brand.accentColor}10`,
                        color: brand.accentColor,
                        border: `1px solid ${brand.accentColor}20`,
                        fontFamily: "var(--font-family-label)",
                      }}
                    >
                      {cat.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex items-center gap-2">
                <span
                  className="text-sm font-semibold"
                  style={{ fontFamily: "var(--font-family-label)", color: brand.accentColor }}
                >
                  Tüm Modelleri İncele
                </span>
                <ArrowRight
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                  style={{ color: brand.accentColor }}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16 border-t"
        style={{ borderColor: "rgba(141,144,162,0.15)", backgroundColor: "#0b0f10" }}
      >
        <div className="px-5 lg:px-20 max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              Aradığınız modeli bulamadınız mı?
            </h2>
            <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
              Katalogda listelenmeyen ürünler dahil tüm Fortinet, Synology, HPE ve Dell ürünlerini temin edebiliriz.
            </p>
          </div>
          <Link
            href={`/${locale}/iletisim`}
            className="shrink-0 inline-flex items-center gap-2 px-7 py-4 rounded-lg font-bold uppercase tracking-widest transition-all"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "white",
              fontFamily: "var(--font-family-label)",
              fontSize: "12px",
            }}
          >
            Teklif İste
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
