import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Target,
  Eye,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Award,
  Users,
  Zap,
  Shield,
} from "lucide-react";

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
      ? "Hakkımızda | Lider Network Teknoloji — Ankara"
      : "About Us | Lider Network Technology — Ankara",
    description: isTr
      ? "Lider Network Teknoloji Danışmanlık — 2006'dan bu yana Fortinet Yetkili Partner. Ankara merkezli, 500+ kurumsal proje, NSE sertifikalı mühendis kadrosu."
      : "Lider Network Technology Consulting — Fortinet Authorized Partner since 2006. Ankara-based, 500+ enterprise projects, NSE certified engineering team.",
    alternates: {
      canonical: `${baseUrl}/${locale}/hakkimizda`,
      languages: {
        tr: `${baseUrl}/tr/hakkimizda`,
        en: `${baseUrl}/en/hakkimizda`,
      },
    },
    openGraph: {
      title: isTr ? "Hakkımızda | Lider Network" : "About Us | Lider Network",
      description: isTr
        ? "2006'dan bu yana enterprise BT altyapı ve siber güvenlik çözümleri. Fortinet Yetkili Partner."
        : "Enterprise IT infrastructure and cybersecurity solutions since 2006. Fortinet Authorized Partner.",
      url: `${baseUrl}/${locale}/hakkimizda`,
    },
  };
}

const FN_RED = "#EE3124";
const BLUE = "#0052ff";

export default async function AboutPage({
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
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative pt-28 pb-20 circuit-bg overflow-hidden"
        style={{ borderBottom: "1px solid rgba(183,196,255,0.08)" }}
      >
        <div
          className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, rgba(0,82,255,0.1) 0%, transparent 70%)`,
            filter: "blur(80px)",
          }}
        />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-8 text-xs" style={{ color: "var(--color-outline)" }}>
            <Link href={`/${locale}`} className="hover:text-white transition-colors">
              {isTr ? "Ana Sayfa" : "Home"}
            </Link>
            <span>/</span>
            <span style={{ color: "var(--color-primary)" }}>
              {isTr ? "Hakkımızda" : "About Us"}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
                style={{
                  backgroundColor: `${FN_RED}18`,
                  border: `1px solid ${FN_RED}30`,
                  color: FN_RED,
                  fontFamily: "var(--font-family-label)",
                }}
              >
                <Shield className="w-3.5 h-3.5" />
                Fortinet Yetkili Partner — 2006
              </div>

              <h1
                className="text-5xl md:text-6xl font-black mb-6 leading-tight"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                {isTr ? (
                  <>Türkiye'nin Güvenilir<br /><span style={{ color: BLUE }}>BT Altyapı Ortağı</span></>
                ) : (
                  <>Turkey's Trusted<br /><span style={{ color: BLUE }}>IT Infrastructure Partner</span></>
                )}
              </h1>

              <p className="text-lg leading-relaxed mb-8 max-w-xl" style={{ color: "var(--color-on-surface-variant)" }}>
                {isTr
                  ? "Lider Network Teknoloji Danışmanlık, 2006 yılından bu yana Ankara merkezli olarak kurumsal BT altyapısı, siber güvenlik ve ağ çözümleri alanında hizmet vermektedir. Fortinet Yetkili Partner unvanıyla NSE sertifikalı mühendis kadromuzla yanınızdayız."
                  : "Lider Network Technology Consulting has been providing enterprise IT infrastructure, cybersecurity and network solutions from Ankara since 2006. As a Fortinet Authorized Partner, our NSE-certified engineers are here for you."}
              </p>

              {/* Contact strip */}
              <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                <a href="tel:+903122320288" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" style={{ color: BLUE }} />
                  +90 312 232 02 88
                </a>
                <a href="mailto:info@lidernetwork.com.tr" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="w-4 h-4" style={{ color: BLUE }} />
                  info@lidernetwork.com.tr
                </a>
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: BLUE }} />
                  Çankaya / Ankara
                </span>
              </div>
            </div>

            {/* Stats card */}
            <div
              className="rounded-2xl p-8 circuit-pattern"
              style={{
                backgroundColor: "#0f1315",
                border: "1px solid rgba(183,196,255,0.1)",
              }}
            >
              {/* Logo */}
              <div
                className="flex justify-center mb-7 pb-7"
                style={{ borderBottom: "1px solid rgba(183,196,255,0.08)" }}
              >
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 10,
                    padding: "6px 18px",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt="Lider Network"
                    style={{ height: 46, width: "auto", objectFit: "contain", display: "block" }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                {[
                  { v: "2006", l: isTr ? "Kuruluş Yılı" : "Founded", color: FN_RED },
                  { v: "500+", l: isTr ? "Başarılı Proje" : "Successful Projects", color: BLUE },
                  { v: "NSE", l: isTr ? "Fortinet Sertifika" : "Fortinet Certificate", color: "#7c3aed" },
                  { v: "7/24", l: isTr ? "Teknik Destek" : "Technical Support", color: "#059669" },
                  { v: "%98", l: isTr ? "Müşteri Memnuniyeti" : "Customer Satisfaction", color: BLUE },
                  { v: "20+", l: isTr ? "Yıl Deneyim" : "Years Experience", color: FN_RED },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: `${s.color}08`, border: `1px solid ${s.color}18` }}
                  >
                    <div
                      className="text-2xl font-black mb-1"
                      style={{ color: s.color, fontFamily: "var(--font-family-headline)" }}
                    >
                      {s.v}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
                    >
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MİSYON & VİZYON ──────────────────────────────────────────────── */}
      <section
        className="py-16"
        style={{ backgroundColor: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Misyon */}
            <div
              className="p-8 rounded-2xl"
              style={{ backgroundColor: `${BLUE}06`, border: `1px solid ${BLUE}18` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${BLUE}15` }}
              >
                <Target className="w-6 h-6" style={{ color: BLUE }} />
              </div>
              <h2
                className="text-2xl font-black mb-4"
                style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
              >
                {isTr ? "Misyonumuz" : "Our Mission"}
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                {isTr
                  ? "Yaratıcı, yenilikçi ve uzman kadromuzla kuruluşlara tanımlanan gereksinimler doğrultusunda; müşterilerimizin başarıları için değer sağlamak amacıyla uluslararası kalite standartlarında, yüksek verimlilikte bilişim çözümleri üretmek, eğitim, danışmanlık, yazılım ve teknik destek hizmeti vermektir."
                  : "To deliver high-quality IT solutions at international standards through our creative, innovative and expert team; providing value for our customers' success through education, consulting, software and technical support services."}
              </p>
            </div>

            {/* Vizyon */}
            <div
              className="p-8 rounded-2xl"
              style={{ backgroundColor: `${FN_RED}05`, border: `1px solid ${FN_RED}15` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${FN_RED}15` }}
              >
                <Eye className="w-6 h-6" style={{ color: FN_RED }} />
              </div>
              <h2
                className="text-2xl font-black mb-4"
                style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
              >
                {isTr ? "Vizyonumuz" : "Our Vision"}
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                {isTr
                  ? "Bilişim sektöründe standartların oluşumuna katkıda bulunan, müşteri memnuniyetini esas alarak güvenilir ve etik iş anlayışıyla hizmet veren, sektörün önde gelen ve tercih edilen kuruluşu olmaktır."
                  : "To be the leading and preferred organization in the IT sector; contributing to the formation of industry standards, delivering service with reliability and ethics, with customer satisfaction at its core."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DEĞERLER ─────────────────────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <div
            className="text-xs font-bold mb-3 uppercase tracking-widest"
            style={{ color: BLUE, fontFamily: "var(--font-family-label)" }}
          >
            {isTr ? "Kurumsal Değerlerimiz" : "Our Corporate Values"}
          </div>
          <h2
            className="text-3xl md:text-4xl font-black"
            style={{ fontFamily: "var(--font-family-headline)" }}
          >
            {isTr ? "Bizi Biz Yapan Değerler" : "Values That Define Us"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: Shield,
              title: isTr ? "Güvenilirlik" : "Reliability",
              desc: isTr ? "2006'dan bu yana 500+ kurumsal projeyi zamanında ve SLA garantisiyle teslim eden bir ekip." : "A team delivering 500+ enterprise projects on time with SLA guarantees since 2006.",
              color: FN_RED,
            },
            {
              icon: Zap,
              title: isTr ? "Yenilikçilik" : "Innovation",
              desc: isTr ? "WiFi 7, SASE, Zero Trust ve yapay zeka destekli güvenlik gibi en güncel teknolojileri müşterilerimize sunuyoruz." : "We bring the latest technologies like WiFi 7, SASE, Zero Trust and AI-powered security to our customers.",
              color: BLUE,
            },
            {
              icon: Award,
              title: isTr ? "Uzmanlık" : "Expertise",
              desc: isTr ? "Fortinet NSE 4-7, VMware VCP, Microsoft Azure sertifikalı mühendislerden oluşan uzman kadromuz." : "Expert team with Fortinet NSE 4-7, VMware VCP, Microsoft Azure certified engineers.",
              color: "#7c3aed",
            },
            {
              icon: Users,
              title: isTr ? "Ortaklık" : "Partnership",
              desc: isTr ? "Müşterilerimizi sadece bir proje değil, uzun vadeli teknoloji ortağı olarak görüyoruz." : "We see our customers not just as a project, but as long-term technology partners.",
              color: "#059669",
            },
          ].map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="p-6 rounded-2xl card-glow"
                style={{ backgroundColor: `${v.color}06`, border: `1px solid ${v.color}18` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${v.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: v.color }} />
                </div>
                <h3
                  className="text-base font-bold mb-2"
                  style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-family-headline)" }}
                >
                  {v.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                  {v.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── SERTİFİKALAR & ORTAKLIKLAR ───────────────────────────────────── */}
      <section
        className="py-16"
        style={{ backgroundColor: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <div
                className="text-xs font-bold mb-3 uppercase tracking-widest"
                style={{ color: FN_RED, fontFamily: "var(--font-family-label)" }}
              >
                {isTr ? "Sertifikalar" : "Certifications"}
              </div>
              <h2
                className="text-3xl font-black mb-6"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                {isTr ? "Teknik Yetkinliklerimiz" : "Our Technical Competencies"}
              </h2>
              <div className="space-y-3">
                {[
                  { label: "Fortinet NSE Sertifikalı", sub: "Network Security Expert", color: FN_RED },
                  { label: "Fortinet Authorized Partner", sub: "Yetkili Satıcı & Destek", color: FN_RED },
                  { label: "VMware Solution Provider", sub: "vSphere, NSX, VDI", color: "#607cdc" },
                  { label: "Microsoft Azure Certified", sub: "Cloud Solutions Provider", color: "#00a4ef" },
                  { label: "Veeam Gold Partner", sub: "Backup & Recovery", color: "#00b336" },
                  { label: "CISSP / CompTIA Security+", sub: "Güvenlik Sertifikaları", color: "#f59e0b" },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: c.color }} />
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-family-label)" }}>
                        {c.label}
                      </div>
                      <div className="text-xs" style={{ color: "var(--color-outline)" }}>{c.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* İletişim & Ofis */}
            <div>
              <div
                className="text-xs font-bold mb-3 uppercase tracking-widest"
                style={{ color: BLUE, fontFamily: "var(--font-family-label)" }}
              >
                {isTr ? "Ofis Bilgileri" : "Office Info"}
              </div>
              <h2
                className="text-3xl font-black mb-6"
                style={{ fontFamily: "var(--font-family-headline)" }}
              >
                {isTr ? "Bize Ulaşın" : "Get In Touch"}
              </h2>

              <div className="space-y-4">
                {[
                  {
                    icon: MapPin,
                    label: isTr ? "Adres" : "Address",
                    value: "Birlik Mh. 448. Cd No:119/2\n06610 Çankaya / Ankara",
                    href: "https://maps.google.com",
                    color: FN_RED,
                  },
                  {
                    icon: Phone,
                    label: isTr ? "Telefon" : "Phone",
                    value: "+90 312 232 02 88",
                    href: "tel:+903122320288",
                    color: BLUE,
                  },
                  {
                    icon: Mail,
                    label: "E-posta",
                    value: "info@lidernetwork.com.tr",
                    href: "mailto:info@lidernetwork.com.tr",
                    color: "#7c3aed",
                  },
                  {
                    icon: Clock,
                    label: isTr ? "Çalışma Saatleri" : "Office Hours",
                    value: isTr ? "Hft içi 08:30 – 17:30\nCumartesi 08:30 – 13:00" : "Weekdays 08:30 – 17:30\nSaturday 08:30 – 13:00",
                    href: undefined,
                    color: "#059669",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const content = (
                    <div
                      className="flex items-start gap-4 p-4 rounded-2xl transition-all"
                      style={{ backgroundColor: `${item.color}06`, border: `1px solid ${item.color}15` }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.color}15` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: item.color }} />
                      </div>
                      <div>
                        <div
                          className="text-xs font-bold mb-1"
                          style={{ color: item.color, fontFamily: "var(--font-family-label)" }}
                        >
                          {item.label}
                        </div>
                        <div
                          className="text-sm whitespace-pre-line"
                          style={{ color: "var(--color-on-surface-variant)" }}
                        >
                          {item.value}
                        </div>
                      </div>
                    </div>
                  );
                  return item.href ? (
                    <a key={item.label} href={item.href} className="block hover:opacity-80 transition-opacity">
                      {content}
                    </a>
                  ) : (
                    <div key={item.label}>{content}</div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TİMELINE ─────────────────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{ backgroundColor: "var(--color-surface)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
              style={{
                backgroundColor: `${BLUE}12`,
                border: `1px solid ${BLUE}28`,
                color: BLUE,
                fontFamily: "var(--font-family-label)",
              }}
            >
              <Zap className="w-3 h-3" />
              {isTr ? "18 Yıllık Yolculuk" : "18-Year Journey"}
            </div>
            <h2
              className="text-3xl font-black"
              style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
            >
              {isTr ? "Büyüme " : "Our "}<span style={{ color: BLUE }}>{isTr ? "Hikayemiz" : "Growth Story"}</span>
            </h2>
          </div>

          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />
            <div className="flex flex-col gap-8">
              {[
                { year: "2006", color: FN_RED, tr: { title: "Kuruluş", desc: "Lider Network Teknoloji Danışmanlık, Ankara'da kuruldu. İlk yıldan itibaren kurumsal ağ ve güvenlik altyapısına odaklanıldı." }, en: { title: "Founded", desc: "Lider Network established in Ankara, focusing on enterprise network and security infrastructure from day one." } },
                { year: "2008", color: BLUE, tr: { title: "Fortinet Partnerliği", desc: "Fortinet Yetkili Partner statüsü kazanıldı. İlk FortiGate kurulumları Kamu ve Savunma sektöründe gerçekleştirildi." }, en: { title: "Fortinet Partnership", desc: "Achieved Fortinet Authorized Partner status. First FortiGate deployments completed in public sector and defence." } },
                { year: "2012", color: "#10b981", tr: { title: "NSE Sertifikasyonu", desc: "Mühendis kadrosu Fortinet NSE sertifikaları aldı. Microsoft ve VMware partnerlik programlarına katılım sağlandı." }, en: { title: "NSE Certification", desc: "Engineering team obtained Fortinet NSE certifications. Joined Microsoft and VMware partner programmes." } },
                { year: "2016", color: "#f59e0b", tr: { title: "100. Proje & Veeam Gold", desc: "100. kurumsal proje teslim edildi. Veeam Gold Partner statüsü kazanıldı. SOC ve FortiAnalyzer hizmetleri portföye eklendi." }, en: { title: "100th Project & Veeam Gold", desc: "100th enterprise project delivered. Achieved Veeam Gold Partner. SOC and FortiAnalyzer services added." } },
                { year: "2020", color: "#8b5cf6", tr: { title: "500+ Proje & SD-WAN", desc: "500+ başarılı proje hedefine ulaşıldı. SD-WAN ve SASE mimarileri hizmet portföyüne entegre edildi." }, en: { title: "500+ Projects & SD-WAN", desc: "Reached 500+ successful projects. SD-WAN and SASE architectures integrated into service portfolio." } },
                { year: "2024", color: BLUE, tr: { title: "WiFi 7 & Zero Trust", desc: "WiFi 7 (FortiAP) kurulumları başladı. Zero Trust / ZTNA danışmanlık hizmetleri eklendi. FortiOS 7.x NSE güncellemeleri tamamlandı." }, en: { title: "WiFi 7 & Zero Trust", desc: "WiFi 7 (FortiAP) deployments commenced. Zero Trust / ZTNA consulting services added. FortiOS 7.x NSE updated." } },
              ].map((item) => {
                const d = isTr ? item.tr : item.en;
                return (
                  <div key={item.year} className="relative flex gap-6 pl-16">
                    <div className="absolute left-0 w-16 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black z-10" style={{ backgroundColor: `${item.color}18`, border: `2px solid ${item.color}50`, color: item.color, fontFamily: "var(--font-family-label)" }}>
                        {item.year.slice(2)}
                      </div>
                    </div>
                    <div className="flex-1 p-5 rounded-2xl" style={{ backgroundColor: `${item.color}07`, border: `1px solid ${item.color}18` }}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-black" style={{ color: item.color, fontFamily: "var(--font-family-label)" }}>{item.year}</span>
                        <h3 className="text-sm font-black" style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}>{d.title}</h3>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>{d.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{
          background: `linear-gradient(135deg, rgba(0,82,255,0.1), ${FN_RED}08)`,
          borderTop: "1px solid rgba(0,82,255,0.15)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ fontFamily: "var(--font-family-headline)" }}
          >
            {isTr ? (
              <>Birlikte <span style={{ color: BLUE }}>Başaralım</span></>
            ) : (
              <>Let&apos;s <span style={{ color: BLUE }}>Succeed Together</span></>
            )}
          </h2>
          <p className="text-base mb-8 max-w-xl mx-auto" style={{ color: "var(--color-on-surface-variant)" }}>
            {isTr
              ? "Altyapınızı güçlendirmek ve geleceğinizi güvence altına almak için bugün iletişime geçin. NSE sertifikalı mühendislerimiz en kısa sürede dönüş yapar."
              : "Contact us today to strengthen your infrastructure and secure your future. Our NSE-certified engineers will get back to you as soon as possible."}
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
              {isTr ? "Bizimle Çalışın" : "Work With Us"}
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
