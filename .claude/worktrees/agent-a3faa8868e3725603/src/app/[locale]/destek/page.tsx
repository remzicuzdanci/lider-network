import Link from "next/link";
import Image from "next/image";
import { TicketCheck, Clock, Shield, Zap, ArrowRight, Phone, Mail } from "lucide-react";

export default function DesktekLanding() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0d14", color: "#fff", fontFamily: "var(--font-family-body)", overflow: "hidden" }}>

      {/* ── Animated background glows ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,82,255,.18) 0%, transparent 70%)", top: "-10%", left: "50%", transform: "translateX(-50%)" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,.10) 0%, transparent 70%)", bottom: "10%", right: "5%" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,40,180,.12) 0%, transparent 70%)", bottom: "20%", left: "5%" }} />
      </div>

      {/* ── HERO ── */}
      <section style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "60px 24px", textAlign: "center" }}>

        {/* Logo */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "16px 36px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 40px rgba(0,82,255,.25), 0 2px 8px rgba(0,0,0,.3)",
          }}>
            <Image
              src="/logo.png"
              alt="Lider Network"
              width={180}
              height={56}
              style={{ objectFit: "contain", display: "block", height: 56, width: "auto" }}
              priority
            />
          </div>
        </div>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "6px 18px", borderRadius: "20px", marginBottom: "24px",
          background: "rgba(0,82,255,.15)", border: "1px solid rgba(0,82,255,.35)",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3b82f6", display: "inline-block", boxShadow: "0 0 6px #3b82f6" }} />
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "1px" }}>
            Müşteri Destek Portalı
          </span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily: "var(--font-family-headline)",
          fontSize: "clamp(36px, 6vw, 64px)",
          fontWeight: 900,
          lineHeight: 1.08,
          margin: "0 0 22px",
          letterSpacing: "-1.5px",
          maxWidth: "700px",
        }}>
          Teknik Desteğiniz{" "}
          <span style={{
            background: "linear-gradient(90deg, #4f8eff, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Burada
          </span>
        </h1>

        <p style={{
          fontSize: "17px", color: "rgba(255,255,255,.55)", lineHeight: 1.7,
          maxWidth: "520px", margin: "0 0 40px",
        }}>
          Taleplerinizi oluşturun, anlık takip edin ve uzman ekibimizle
          doğrudan iletişime geçin — tümü tek panelden.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center", marginBottom: "64px" }}>
          <Link href="giris" style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            padding: "15px 36px", borderRadius: "12px",
            background: "linear-gradient(135deg, #0052ff, #3b82f6)",
            color: "#fff", textDecoration: "none",
            fontWeight: 800, fontSize: "15px",
            fontFamily: "var(--font-family-headline)",
            boxShadow: "0 4px 24px rgba(0,82,255,.45)",
            letterSpacing: "0.2px",
          }}>
            Müşteri Girişi <ArrowRight size={16} />
          </Link>
          <Link href="kayit" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "15px 32px", borderRadius: "12px",
            border: "1px solid rgba(255,255,255,.18)",
            background: "rgba(255,255,255,.06)",
            color: "rgba(255,255,255,.85)", textDecoration: "none",
            fontWeight: 700, fontSize: "15px",
            fontFamily: "var(--font-family-headline)",
            backdropFilter: "blur(8px)",
          }}>
            Kayıt Ol
          </Link>
        </div>

        {/* Stats row */}
        <div style={{
          display: "flex", gap: "0", flexWrap: "wrap", justifyContent: "center",
          background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)",
          borderRadius: "16px", overflow: "hidden", marginBottom: "48px",
        }}>
          {[
            { value: "7/24", label: "Acil Destek" },
            { value: "< 2sa", label: "Acil Yanıt SLA" },
            { value: "%99.9", label: "Çözüm Oranı" },
            { value: "2006", label: "Yılından Beri" },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: "20px 32px", textAlign: "center",
              borderLeft: i > 0 ? "1px solid rgba(255,255,255,.08)" : "none",
            }}>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "#fff", fontFamily: "var(--font-family-headline)", letterSpacing: "-0.5px" }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,.4)", marginTop: "3px", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", maxWidth: "700px", width: "100%", marginBottom: "40px" }}>
          {[
            { icon: <TicketCheck size={20} color="#60a5fa" />, title: "Talep Takibi", desc: "Tüm taleplerinizi anlık izleyin, mesaj bırakın", accent: "#3b82f6" },
            { icon: <Zap size={20} color="#a78bfa" />,         title: "SLA Garantisi", desc: "Önceliğe göre 2–48 saat yanıt taahhüdü",     accent: "#8b5cf6" },
            { icon: <Shield size={20} color="#34d399" />,      title: "Güvenli Erişim", desc: "Hesabınızla şifreli ve güvenli bağlantı",    accent: "#10b981" },
          ].map((f) => (
            <div key={f.title} style={{
              padding: "20px", borderRadius: "14px",
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.09)",
              textAlign: "left",
              backdropFilter: "blur(8px)",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "10px", marginBottom: "14px",
                background: `${f.accent}18`, border: `1px solid ${f.accent}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {f.icon}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>{f.title}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,.45)", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Contact footer */}
        <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          <a href="tel:+903122320288" style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
            <Phone size={14} color="#3b82f6" />
            +90 312 232 02 88
          </a>
          <span style={{ color: "rgba(255,255,255,.15)" }}>·</span>
          <a href="mailto:destek@lidernetwork.com.tr" style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
            <Mail size={14} color="#3b82f6" />
            destek@lidernetwork.com.tr
          </a>
          <span style={{ color: "rgba(255,255,255,.15)" }}>·</span>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,.3)" }}>
            Pzt–Cum 09:00–18:00 · Cmt 09:00–13:00
          </span>
        </div>
      </section>
    </div>
  );
}
