import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, CheckCircle2 } from "lucide-react";
import { PartnerLogo } from "@/components/ui/PartnerLogo";

const baseUrl = "https://www.lidernetwork.com.tr";
const BLUE   = "#0052ff";
const FN_RED = "#EE3124";

const WIX = "https://static.wixstatic.com/media";
const wix = (h: string) => `${WIX}/${h}~mv2.png`;

/* ─── Tüm müşteri logoları — kullanıcının premium sıralamasına göre ──────── */
const clients = [
  { name: "RocheBobois",               logo: wix("27bac0_228f6d4e4fee4a2ab020647ee3e48676") },
  { name: "Ankara Valiliği",           logo: wix("27bac0_7b6c905d2d9d446fa9ce2c721a84a9c5") },
  { name: "Jandarma",                  logo: wix("27bac0_89e4399b82a8467b9da820a1c435a5fe") },
  { name: "Donanma",                   logo: wix("27bac0_089616e05c624e6b839de411e4d060a8") },
  { name: "Gazi Üniversitesi",         logo: wix("27bac0_23300a17901b41c6b286c1d036e1900a") },
  { name: "KIA",                       logo: wix("27bac0_278c0b70c373420baa1b2ded159e015e") },
  { name: "ETS",                       logo: wix("27bac0_cf85b38f81cd417280de2b112c87a753") },
  { name: "Ulusoy Enerji",             logo: wix("27bac0_27e2deb68d02474694e87e0979a0216e") },
  { name: "Ulusoy Raylı Sistemler",    logo: wix("27bac0_c394af73a7ec495ba6dd3f89d9c02745") },
  { name: "Gıpta Grup",                logo: wix("27bac0_4e97c96a80d04bcb8041919b99b4f57f") },
  { name: "Panda Alüminyum",           logo: wix("27bac0_4f25be30517144fa8c172c874e986d94") },
  { name: "KSE Maden",                 logo: wix("27bac0_292f256949c6410da34f4e3e137bd7f3") },
  { name: "Universal Mine",            logo: wix("27bac0_b5f5b038565a4a3094bbb912f5c9f90a") },
  { name: "Uğur Makina",               logo: wix("27bac0_922c8bf36670403fbe5a8a5f0763de67") },
  { name: "Dsgnon",                    logo: null },
  { name: "Dürümle",                   logo: wix("27bac0_70e67dee7738443abb077661162e9e81") },
  { name: "Sami Ulus",                 logo: wix("27bac0_f7b66211f7594ff3b75b52de076b7655") },
  { name: "Büyükhanlı",                logo: wix("27bac0_49e16aa7ed024f91aa2d7f97c791147b") },
  { name: "Koza İnşaat",               logo: wix("27bac0_fc915c35cf6246f79f289a358eaec09d") },
  { name: "Usta İnşaat",               logo: wix("27bac0_6ebe1eb52e834abd97da95c81add56db") },
  { name: "Polgün",                    logo: wix("27bac0_9a916a62bfa240948dcf898a005ca5f7") },
  { name: "Bauxite",                   logo: wix("27bac0_b75cd9e0d02e4ebf8b63c11c22ed930a") },
  { name: "Karamehmetler",             logo: wix("27bac0_21dbc41f64b64b0bb24e840d560dde38") },
  { name: "Metalinşaat",               logo: wix("27bac0_ee1177ef12dc46f4b06c87638cfd8b9c") },
  { name: "Fransız Kültür",            logo: wix("27bac0_56b0b784b5ce4c7fa8da19bb110b3ea6") },
  { name: "Midi Hotel",                logo: wix("27bac0_73a4e4f39c2b4fdda407c18450b77d09") },
  { name: "Vilayetler Birliği",        logo: wix("27bac0_3550ed0c63cf44aba5bc0bfd0244d0c6") },
  { name: "Alo Sigortam",              logo: wix("27bac0_4c15ac71d77949e791d29a50ac013ae0") },
  { name: "MySilo",                    logo: wix("27bac0_6ba7b2b6a6d74eb3be8675a307b425ee") },
  { name: "Sonmak",                    logo: wix("27bac0_fe5fb3647c33440391964846cae56813") },
  { name: "Elektromekanik",            logo: wix("27bac0_1aa5b516ad5c46f7b06ec09d792c20c3") },
  { name: "Magnet",                    logo: wix("27bac0_bad61cb51b234bc68352e2294db2d3d4") },
  { name: "OMAY",                      logo: wix("27bac0_7e3db1510d6d4995bebf04dd92b15e09") },
  { name: "MSM",                       logo: wix("27bac0_d350191cfe1e46eea4ea86439ca34e98") },
  { name: "UCI",                       logo: wix("27bac0_deef590367e04af8887b45973e1e006c") },
  { name: "AKNET",                     logo: wix("27bac0_7f25f7f393dc472c88ac741dd4b30b30") },
  { name: "CDM",                       logo: wix("27bac0_5b1c26913feb4cb5bb8f13f805d96916") },
  { name: "SO Design",                 logo: wix("27bac0_5bd5a52ee2bb457e92f9be62dde19537") },
  { name: "ENNE",                      logo: wix("27bac0_817d729a43674edb94ce21cdc8037211") },
  { name: "ARGİS",                     logo: wix("27bac0_b05f2b6b2eec4fecabd413f008df6fc9") },
  { name: "TÜMDEF",                    logo: wix("27bac0_b74fb1f8ba3b487584cc720b3f4ef2dd") },
  { name: "KCM",                       logo: wix("27bac0_6358d33df7324b96a1c91a371632fdd5") },
  { name: "Ankamall",                  logo: wix("27bac0_cdd6bd1b04ff41da897d670c07c42599") },
  { name: "MİSTAV",                    logo: wix("27bac0_45df696b80564d5997f45d33cd34629b") },
  { name: "Ultra Turizm",              logo: wix("27bac0_a3859a66ccc641c8b1b1bfd128af2d37") },
  { name: "Gürgenler",                 logo: wix("27bac0_947497c21c8c410a8c0a3c243799cfea") },
  { name: "Kırıkkale Üniversitesi",    logo: wix("27bac0_51215cbfd52541468e8498f9e50b7189") },
  { name: "Mezzaluna",                 logo: wix("27bac0_69c54261a28b4bc0a5587b21a1906edd") },
  { name: "Siber Suçlarla Mücadele",   logo: wix("27bac0_fd93ebf27976414c8c80a517ddfa0aad") },
  /* ─── Yeni referanslar ──────────────────────────────────────────────────── */
  { name: "Gala Sahne",    logo: null }, // site bot-engelliyor, initials fallback
  { name: "Pantech",       logo: "https://pantechalu.com.tr/uploads/images/logos/large/1774521249_pantech-aluminyum-logo.svg" },
  { name: "Pancast",       logo: "https://www.pancast.com.tr/uploads/images/home-logos/large/1774519597_pancast-aluminium.svg" },
  { name: "Panab",         logo: "https://www.panabenerji.com/uploads/images/logos/large/1774523391_panab-enerji-logo.svg" },
  { name: "MND Gıda",      logo: "https://www.mndgida.com.tr/wp-content/themes/v1/img/mnd-gida-logo.svg" },
  { name: "ATC-Mateks",    logo: "https://www.atc-mateks.com/img/logo.png" },
  { name: "DGN Sigorta",   logo: "https://www.dgnsigorta.com/image/cache/catalog/001/logo.fw-3171x833.png" },
  { name: "Natuzzi",       logo: "https://upload.wikimedia.org/wikipedia/commons/9/91/Natuzzi_logo.svg" },
  { name: "Reynardglobal", logo: "https://www.reynardglobal.com/wp-content/uploads/2022/10/logo.png" },
  { name: "Ada Dış Ticaret", logo: "https://www.adadisticaret.com.tr/images/logo2.png" },
  { name: "Akış Enerji",   logo: "https://www.akisenerji.com/wp-content/uploads/2024/12/logo.svg" },
  { name: "Endüstri Teknik", logo: "https://www.endustriteknik.com/wp-content/uploads/2024/08/EndTek-Website-2024.png" },
  { name: "Pergo Uzay",    logo: "https://www.pergo.com.tr/assets/uploads/643670dd48426168128943747.png" },
  { name: "Teknik Orijin", logo: "https://www.teknikorijin.com/Uploads/Original/b13aa68f08887be65735cbfc2385b025.webp" },
];

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
            {clients.map(({ name, logo }) => (
              <div
                key={name}
                className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl cursor-default transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <PartnerLogo url={logo} abbr={initials(name)} color="#64748b" size={64} />
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
