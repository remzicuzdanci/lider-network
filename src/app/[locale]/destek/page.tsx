import Link from "next/link";
import Image from "next/image";
import { TicketCheck, Clock, Shield } from "lucide-react";

export default function DesktekLanding() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          minHeight: "calc(100vh - 80px)",
          display: "flex",
          alignItems: "center",
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,82,255,.12) 0%, transparent 70%)",
        }}
      >
        <div className="container">
          <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center", padding: "64px 0" }}>
            {/* Logo */}
            <div
              style={{
                display: "inline-block",
                background: "#fff",
                borderRadius: "16px",
                padding: "12px 28px",
                margin: "0 auto 28px",
                boxShadow: "0 4px 24px rgba(0,0,0,.18)",
              }}
            >
              <Image
                src="/logo.png"
                alt="Lider Network"
                width={160}
                height={52}
                style={{ objectFit: "contain", display: "block", height: 52, width: "auto" }}
                priority
              />
            </div>

            <div
              style={{
                display: "inline-block", padding: "4px 14px", borderRadius: "20px",
                background: "rgba(0,82,255,.1)", border: "1px solid rgba(0,82,255,.25)",
                fontSize: "12px", fontWeight: 700, color: "var(--color-primary)",
                textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "20px",
              }}
            >
              Müşteri Destek Portalı
            </div>

            <h1
              style={{
                fontFamily: "var(--font-family-headline)",
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 800,
                color: "var(--color-on-surface)",
                lineHeight: 1.1,
                margin: "0 0 20px",
              }}
            >
              Destek Merkezine<br />
              <span style={{ color: "var(--color-primary)" }}>Hoş Geldiniz</span>
            </h1>

            <p
              style={{
                color: "var(--color-on-surface-variant)",
                fontSize: "17px",
                lineHeight: 1.7,
                marginBottom: "40px",
              }}
            >
              Teknik destek taleplerinizi oluşturun, takip edin ve ekibimizle
              iletişimde kalın — tümü tek panelden.
            </p>

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap", marginBottom: "48px" }}>
              <Link
                href="giris"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "14px 32px", borderRadius: "10px",
                  background: "var(--color-primary-container)",
                  color: "#fff", textDecoration: "none",
                  fontWeight: 800, fontSize: "15px",
                  fontFamily: "var(--font-family-headline)",
                  boxShadow: "0 4px 20px rgba(0,82,255,.35)",
                  transition: "opacity .15s",
                }}
              >
                Müşteri Girişi →
              </Link>
              <Link
                href="kayit"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "14px 32px", borderRadius: "10px",
                  border: "1px solid var(--color-outline-variant)",
                  background: "var(--color-surface)",
                  color: "var(--color-on-surface)", textDecoration: "none",
                  fontWeight: 700, fontSize: "15px",
                  fontFamily: "var(--font-family-headline)",
                  transition: "border-color .15s",
                }}
              >
                Kayıt Ol
              </Link>
            </div>

            {/* Features */}
            <div
              style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px", textAlign: "left",
              }}
            >
              {[
                { icon: <TicketCheck size={18} color="#b7c4ff" />, title: "Talep Takibi", desc: "Tüm talepleriniz tek yerde" },
                { icon: <Clock size={18} color="#b7c4ff" />, title: "SLA Garantisi", desc: "Önceliğe göre yanıt süresi" },
                { icon: <Shield size={18} color="#b7c4ff" />, title: "Güvenli Panel", desc: "Hesabınızla güvenle erişin" },
              ].map((f) => (
                <div
                  key={f.title}
                  style={{
                    padding: "16px", borderRadius: "12px",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-outline-variant)",
                  }}
                >
                  <div style={{ marginBottom: "8px" }}>{f.icon}</div>
                  <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 700, color: "var(--color-on-surface)" }}>{f.title}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--color-outline)" }}>{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Emergency contact */}
            <p style={{ marginTop: "36px", fontSize: "13px", color: "var(--color-outline)" }}>
              Acil destek için:{" "}
              <a href="tel:+903122320288" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>
                +90 312 232 02 88
              </a>
              {" "}·{" "}
              <a href="mailto:info@lidernetwork.com.tr" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                info@lidernetwork.com.tr
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
