"use client";

import { useLocale } from "next-intl";

const TOOLS = [
  {
    label: "Threat Portal",
    labelEn: "Threat Portal",
    sub: "Siber Tehdit İstihbaratı",
    subEn: "Cyber Threat Intelligence",
    desc: "USOM tehdit beslemesinden anlık IP ve domain sorgulama. Zararlı adresleri saniyeler içinde tespit edin.",
    descEn: "Real-time IP and domain lookup from USOM threat feed. Detect malicious addresses in seconds.",
    href: "https://threat.lidernetwork.com.tr",
    color: "#4f7cff",
    shadow: "rgba(79,124,255,.28)",
    bg: "linear-gradient(135deg,#4f7cff 0%,#6366f1 100%)",
    badge: "USOM Feed",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    label: "Kara Liste Sorgu",
    labelEn: "Blacklist Check",
    sub: "IP / Domain Kara Liste",
    subEn: "IP / Domain Blacklist",
    desc: "30+ farklı DNSBL kaynağında IP veya domain'inizi sorgulayın. Spam listesinde olup olmadığını öğrenin.",
    descEn: "Query your IP or domain across 30+ DNSBL sources. Find out if you're on any spam blacklist.",
    href: "https://blacklist.lidernetwork.com.tr",
    color: "#ef4444",
    shadow: "rgba(239,68,68,.28)",
    bg: "linear-gradient(135deg,#ef4444 0%,#dc2626 100%)",
    badge: "30+ Liste",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}>
        <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
    ),
  },
  {
    label: "IP Analiz",
    labelEn: "IP Analysis",
    sub: "Konum & İtibar Analizi",
    subEn: "Location & Reputation",
    desc: "Herhangi bir IP adresinin coğrafi konumunu, ISP bilgisini ve güvenlik itibarını anında görün.",
    descEn: "Instantly view geographic location, ISP info, and security reputation of any IP address.",
    href: "https://ip.lidernetwork.com.tr",
    color: "#10b981",
    shadow: "rgba(16,185,129,.28)",
    bg: "linear-gradient(135deg,#10b981 0%,#059669 100%)",
    badge: "Ücretsiz",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}>
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    label: "DNS Checker",
    labelEn: "DNS Checker",
    sub: "DNS & Domain Sorgulama",
    subEn: "DNS & Domain Lookup",
    desc: "DNS kayıtları, SPF/DKIM/DMARC, WHOIS, SSL sertifika ve propagasyon durumunu tek ekranda görün.",
    descEn: "View DNS records, SPF/DKIM/DMARC, WHOIS, SSL certificate and propagation status in one screen.",
    href: "https://dns.lidernetwork.com.tr",
    color: "#f59e0b",
    shadow: "rgba(245,158,11,.28)",
    bg: "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
    badge: "Mail Analiz",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}>
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    label: "Şifre Oluşturucu",
    labelEn: "Password Generator",
    sub: "Güvenli Şifre Üretici",
    subEn: "Secure Password Creator",
    desc: "Kriptografik olarak güvenli, tamamen tarayıcıda üretilen rastgele şifreler. Sunucuya gönderilmez.",
    descEn: "Cryptographically secure random passwords generated entirely in your browser. Never sent to any server.",
    href: "https://password.lidernetwork.com.tr",
    color: "#8b5cf6",
    shadow: "rgba(139,92,246,.28)",
    bg: "linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)",
    badge: "Gizli & Güvenli",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  {
    label: "Site Kontrol",
    labelEn: "Site Monitor",
    sub: "Erişilebilirlik Kontrolü",
    subEn: "Availability Check",
    desc: "Herhangi bir web sitesinin erişilebilir olup olmadığını kontrol edin. Sadece sizde mi açılmıyor?",
    descEn: "Check whether any website is reachable. Is it down for everyone or just for you?",
    href: "https://uptime.lidernetwork.com.tr",
    color: "#06b6d4",
    shadow: "rgba(6,182,212,.28)",
    bg: "linear-gradient(135deg,#06b6d4 0%,#0891b2 100%)",
    badge: "Gerçek Zamanlı",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
];

export default function ITTools() {
  const locale = useLocale();
  const isTr = locale === "tr";

  return (
    <section className="section" style={{ backgroundColor: "var(--color-surface)" }} aria-label="IT Araçları">
      <div className="container">

        {/* Başlık */}
        <div className="text-center mb-14">
          <span
            className="uppercase tracking-widest mb-4 block"
            style={{ color: "var(--color-primary)", fontFamily: "var(--font-family-label)", fontSize: "12px", fontWeight: 500 }}
          >
            {isTr ? "Ücretsiz Kullanın" : "Free to Use"}
          </span>
          <h2
            className="text-4xl lg:text-5xl font-semibold mb-4"
            style={{ fontFamily: "var(--font-family-headline)", letterSpacing: "-0.01em", color: "var(--color-on-surface)" }}
          >
            {isTr ? "IT Güvenlik Araçları" : "IT Security Tools"}
          </h2>
          <p className="max-w-2xl mx-auto text-base" style={{ color: "var(--color-on-surface-variant)" }}>
            {isTr
              ? "Lider Network tarafından geliştirilmiş, ağ güvenliği ve altyapı yönetimi için ücretsiz çevrimiçi araçlar. Kayıt gerektirmez."
              : "Free online tools developed by Lider Network for network security and infrastructure management. No registration required."}
          </p>
        </div>

        {/* Araçlar grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
            marginBottom: 48,
          }}
        >
          {TOOLS.map((t) => (
            <a
              key={t.href}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                borderRadius: 20,
                textDecoration: "none",
                border: `1px solid ${t.color}28`,
                background: "var(--color-background)",
                overflow: "hidden",
                transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
                boxShadow: `0 2px 12px ${t.shadow}18`,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = `0 12px 36px ${t.shadow}`;
                el.style.borderColor = `${t.color}55`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "";
                el.style.boxShadow = `0 2px 12px ${t.shadow}18`;
                el.style.borderColor = `${t.color}28`;
              }}
            >
              {/* Renkli üst şerit */}
              <div style={{ height: 4, background: t.bg, flexShrink: 0 }} />

              <div style={{ padding: "22px 24px 24px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
                {/* İkon + rozet satırı */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div
                    style={{
                      width: 54, height: 54, borderRadius: 16,
                      background: t.bg,
                      color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 6px 20px ${t.shadow}`,
                      flexShrink: 0,
                    }}
                  >
                    {t.svg}
                  </div>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: ".04em",
                      padding: "4px 10px", borderRadius: 20,
                      color: t.color,
                      background: `${t.color}12`,
                      border: `1px solid ${t.color}30`,
                    }}
                  >
                    {t.badge}
                  </span>
                </div>

                {/* İsim + alt başlık */}
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "var(--color-on-surface)", marginBottom: 3, fontFamily: "var(--font-family-headline)" }}>
                    {isTr ? t.label : t.labelEn}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: t.color, opacity: 0.85 }}>
                    {isTr ? t.sub : t.subEn}
                  </div>
                </div>

                {/* Açıklama */}
                <p style={{ fontSize: 13, color: "var(--color-on-surface-variant)", lineHeight: 1.65, margin: 0, flex: 1 }}>
                  {isTr ? t.desc : t.descEn}
                </p>

                {/* CTA */}
                <div
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontSize: 13, fontWeight: 700, color: t.color,
                    marginTop: 4,
                  }}
                >
                  {isTr ? "Aracı Aç" : "Open Tool"}
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" style={{width:13,height:13}}>
                    <path d="M3 8h10M9 4l4 4-4 4"/>
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Alt bilgi */}
        <div
          className="text-center"
          style={{
            padding: "20px 32px",
            borderRadius: 16,
            background: "rgba(0,82,255,0.05)",
            border: "1px solid rgba(0,82,255,0.14)",
          }}
        >
          <p style={{ fontSize: 14, color: "var(--color-on-surface-variant)", margin: 0 }}>
            {isTr
              ? "Tüm araçlar ücretsiz ve kayıtsız kullanılabilir. Kurumsal entegrasyon veya API erişimi için "
              : "All tools are free and registration-free. For enterprise integration or API access, "}
            <a
              href="https://www.lidernetwork.com.tr/tr#iletisim"
              style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}
            >
              {isTr ? "bizimle iletişime geçin" : "contact us"}
            </a>
            {isTr ? "." : "."}
          </p>
        </div>

      </div>
    </section>
  );
}
