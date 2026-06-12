import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, CheckCircle2 } from "lucide-react";
import { PartnerLogo } from "@/components/ui/PartnerLogo";

const baseUrl = "https://www.lidernetwork.com.tr";
const BLUE   = "#0052ff";
const FN_RED = "#EE3124";

// Müşteri logoları paylaşılan modülden
import { clients } from "@/data/customer-logos";


function initials(name: string) {
  const w = name.trim().split(/\s+/);
  return w.length === 1
    ? name.slice(0, 2).toUpperCase()
    : w.slice(0, 2).map((x) => x[0]).join("").toUpperCase();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";
  return {
    title: isTr
      ? "Referanslarımız | Lider Network — 60+ Başarılı Proje"
      : "References | Lider Network — 60+ Successful Projects",
    description: isTr
      ? "RocheBobois, Ankara Valiliği, Jandarma, Donanma, KIA, Gazi Üniversitesi ve 60+ kurumda tamamladığımız BT altyapı projeleri."
      : "IT infrastructure projects completed at RocheBobois, Ankara Governorship, Gendarmerie, Navy, KIA, Gazi University and 60+ organizations.",
    alternates: { canonical: `${baseUrl}/${locale}/referanslar` },
  };
}

export default async function ReferencesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isTr = locale === "tr";

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-background)", color: "var(--color-on-surface)" }}
    >
      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section
        className="relative pt-28 pb-20 circuit-bg overflow-hidden"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{ background: `radial-gradient(ellipse, ${BLUE}12 0%, transparent 70%)`, filter: "blur(80px)" }}
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-8 text-xs" style={{ color: "var(--color-outline)" }}>
            <Link href={`/${locale}`} className="hover:text-white transition-colors">
              {isTr ? "Ana Sayfa" : "Home"}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: "var(--color-primary)" }}>
              {isTr ? "Referanslarımız" : "References"}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
                style={{ backgroundColor: `${FN_RED}18`, border: `1px solid ${FN_RED}30`, color: FN_RED, fontFamily: "var(--font-family-label)" }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isTr ? "Kanıtlanmış Başarı" : "Proven Success"}
              </div>

              <h1
                className="text-5xl md:text-6xl font-black mb-5 leading-tight"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                {isTr
                  ? (<>Güven Veren<br /><span style={{ color: BLUE }}>Referanslar</span></>)
                  : (<>Trusted<br /><span style={{ color: BLUE }}>References</span></>)}
              </h1>

              <p className="text-lg leading-relaxed mb-8 max-w-xl" style={{ color: "var(--color-on-surface-variant)" }}>
                {isTr
                  ? "Devlet kurumlarından küresel markalara, sanayi devlerinden teknoloji şirketlerine kadar 60'ı aşkın kurumun güvenilir BT altyapı partneri olduk."
                  : "From government institutions to global brands — trusted IT infrastructure partner for 60+ organizations."}
              </p>
            </div>

            {/* İstatistikler */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { v: "60+",  tr: "Başarılı Proje",   en: "Successful Projects" },
                { v: "18+",  tr: "Yıllık Deneyim",   en: "Years Experience" },
                { v: "2006", tr: "Fortinet Partner",  en: "Fortinet Partner" },
                { v: "7/24", tr: "Teknik Destek",     en: "Technical Support" },
              ].map((s) => (
                <div
                  key={s.v}
                  className="p-5 rounded-2xl"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="text-4xl font-black mb-1" style={{ color: BLUE, fontFamily: "var(--font-family-headline)" }}>
                    {s.v}
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}>
                    {isTr ? s.tr : s.en}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── LOGO DUVARI ──────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-14">
            <div
              className="text-xs font-bold mb-3 uppercase tracking-widest"
              style={{ color: BLUE, fontFamily: "var(--font-family-label)" }}
            >
              {isTr ? "Tüm Referanslarımız" : "All References"}
            </div>
            <h2
              className="text-3xl md:text-4xl font-black"
              style={{ fontFamily: "var(--font-family-headline)" }}
            >
              {isTr
                ? (<>Bize Güvenen <span style={{ color: BLUE }}>Kurumlar</span></>)
                : (<>Organizations That <span style={{ color: BLUE }}>Trust Us</span></>)}
            </h2>
          </div>

          {/* Logo grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {clients.map(({ name, logo, logoBg }) => (
              <div
                key={name}
                className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl cursor-default transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <PartnerLogo url={logo} abbr={initials(name)} color="#64748b" size={64} bgColor={logoBg} />
                <span
                  className="text-[10px] font-semibold text-center leading-tight w-full"
                  style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-family-label)" }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{
          background: `linear-gradient(135deg, rgba(0,82,255,0.07), ${FN_RED}05)`,
          borderTop: "1px solid rgba(0,82,255,0.1)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ fontFamily: "var(--font-family-headline)" }}
          >
            {isTr
              ? (<>Siz de <span style={{ color: BLUE }}>Referanslarımız</span> Arasına Katılın</>)
              : (<>Join Our <span style={{ color: BLUE }}>References</span></>)}
          </h2>
          <p
            className="text-base mb-8 max-w-xl mx-auto leading-relaxed"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            {isTr
              ? "60'ı aşkın kurumun tercih ettiği BT altyapı çözümleri için bize ulaşın. Ücretsiz analiz ve teklif hazırlayalım."
              : "Contact us for IT infrastructure solutions trusted by 60+ organizations."}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={`/${locale}/iletisim`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${BLUE}, #0040cc)`,
                fontFamily: "var(--font-family-label)",
                boxShadow: "0 0 24px rgba(0,82,255,0.35)",
              }}
            >
              {isTr ? "Ücretsiz Analiz Al" : "Get Free Analysis"}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/${locale}/cozum-ortaklarimiz`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all hover:bg-white/10"
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                color: "var(--color-on-surface-variant)",
                fontFamily: "var(--font-family-label)",
              }}
            >
              {isTr ? "Çözüm Ortaklarımız" : "Our Partners"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
