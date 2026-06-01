"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useDestekPaths } from "@/lib/destek-path";
import {
  Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2, Clock,
  TicketCheck, Bell, ShieldCheck,
} from "lucide-react";

export default function KayitClient() {
  const locale = useLocale();
  const paths  = useDestekPaths(locale);
  const [form, setForm] = useState({
    fullName: "", company: "", phone: "", email: "", password: "", confirm: "",
  });
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);
  const [focused, setFocused]   = useState<string | null>(null);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (form.password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (!form.company.trim()) {
      setError("Şirket adı zorunludur.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/destek/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        company:  form.company,
        phone:    form.phone,
        email:    form.email,
        password: form.password,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setDone(true);
    } else {
      setError(data.error || "Bir hata oluştu. Lütfen tekrar deneyin.");
    }
    setLoading(false);
  }

  const inp = (name: string, hasError = false): React.CSSProperties => ({
    width: "100%",
    padding: "11px 14px",
    boxSizing: "border-box",
    background: focused === name ? "#f0f5ff" : "#f8f9fc",
    border: `1.5px solid ${hasError ? "#ef4444" : focused === name ? "#0052ff" : "#e5e7ef"}`,
    borderRadius: "10px",
    color: "#1a1d2e",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    transition: "all .15s ease",
  });

  const label: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    color: "#374151",
    marginBottom: "7px",
    letterSpacing: ".4px",
    textTransform: "uppercase",
  };

  // ── Success state ───────────────────────────────────────────────
  if (done) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        background: "linear-gradient(135deg, #f0f4ff 0%, #f8f9fc 60%, #eef2ff 100%)",
      }}>
        {/* Left panel */}
        <div style={{
          flex: "0 0 420px",
          background: "linear-gradient(160deg, #0040cc 0%, #0052ff 50%, #1a6fff 100%)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "48px 40px", position: "relative", overflow: "hidden",
        }} className="kayit-left">
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,.06)", top: -120, right: -120 }} />
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,.04)", bottom: -80, left: -80 }} />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "16px 28px", display: "inline-block", marginBottom: "32px", boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
              <Image src="/logo.png" alt="Lider Network" width={160} height={48} style={{ objectFit: "contain", display: "block" }} />
            </div>
            <h2 style={{ fontFamily: "var(--font-family-headline)", fontSize: "26px", fontWeight: 800, color: "#fff", margin: "0 0 12px" }}>Destek Portalı</h2>
            <p style={{ color: "rgba(255,255,255,.75)", fontSize: "15px", lineHeight: 1.7, margin: 0 }}>
              Teknik destek taleplerinizi oluşturun,<br />takip edin ve yönetin.
            </p>
          </div>
        </div>

        {/* Right — success card */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
          <div style={{ width: "100%", maxWidth: "420px", textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "linear-gradient(135deg, #0038c7, #0052ff)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
              boxShadow: "0 8px 24px rgba(0,82,255,.3)",
            }}>
              <Clock size={32} color="#fff" />
            </div>
            <h2 style={{ fontFamily: "var(--font-family-headline)", color: "#0f172a", fontSize: "24px", fontWeight: 800, margin: "0 0 12px" }}>
              Kaydınız Alındı!
            </h2>
            <p style={{ color: "#64748b", fontSize: "15px", lineHeight: 1.7, margin: "0 0 24px" }}>
              Hesabınız oluşturuldu ve onay için ekibimize iletildi.<br />
              Onaylandığında <strong style={{ color: "#0f172a" }}>{form.email}</strong> adresinize bildirim gönderilecek.
            </p>
            <div style={{
              background: "#eff6ff", border: "1.5px solid #bfdbfe",
              borderRadius: "12px", padding: "14px 18px", marginBottom: "28px",
            }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#1d4ed8", lineHeight: 1.6 }}>
                ⏱ Onay süresi genellikle birkaç saattir (mesai saatleri içinde).
              </p>
            </div>
            <Link href={paths.landing} style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 28px", border: "1.5px solid #e5e7ef",
              borderRadius: "12px", color: "#374151", textDecoration: "none",
              fontSize: "14px", fontWeight: 600, transition: "all .15s",
            }}>
              ← Ana Sayfaya Dön
            </Link>
            <p style={{ marginTop: "20px", fontSize: "12px", color: "#9ca3af" }}>
              Acil: <a href="tel:+903122320288" style={{ color: "#64748b", textDecoration: "none" }}>+90 312 232 02 88</a>
            </p>
          </div>
        </div>
        <style>{`@media (max-width: 768px) { .kayit-left { display: none !important; } }`}</style>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: "linear-gradient(135deg, #f0f4ff 0%, #f8f9fc 60%, #eef2ff 100%)",
    }}>
      {/* ── Sol panel — mavi / branding ─────────────────────────── */}
      <div style={{
        flex: "0 0 420px",
        background: "linear-gradient(160deg, #0040cc 0%, #0052ff 50%, #1a6fff 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "48px 40px", position: "relative", overflow: "hidden",
      }} className="kayit-left">
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,.06)", top: -120, right: -120 }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,.04)", bottom: -80, left: -80 }} />
        <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.05)", top: "40%", left: "5%" }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", color: "#fff" }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "16px 28px", display: "inline-block", marginBottom: "32px", boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
            <Image src="/logo.png" alt="Lider Network" width={160} height={48} style={{ objectFit: "contain", display: "block" }} />
          </div>
          <h2 style={{ fontFamily: "var(--font-family-headline)", fontSize: "26px", fontWeight: 800, margin: "0 0 12px", lineHeight: 1.2 }}>
            Destek Portalı
          </h2>
          <p style={{ color: "rgba(255,255,255,.75)", fontSize: "15px", lineHeight: 1.7, margin: "0 0 40px" }}>
            Teknik destek taleplerinizi oluşturun,<br />takip edin ve yönetin.
          </p>

          {[
            { Icon: TicketCheck, text: "Çevrimiçi talep takibi" },
            { Icon: Bell,        text: "Anlık e-posta bildirimleri" },
            { Icon: ShieldCheck, text: "Güvenli ve özel hesabınız" },
          ].map(({ Icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", textAlign: "left" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
                background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={17} color="#fff" />
              </div>
              <span style={{ color: "rgba(255,255,255,.88)", fontSize: "14px" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sağ panel — form ────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: "460px" }}>

          {/* Başlık */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "#eff3ff", borderRadius: "20px",
              padding: "6px 14px", marginBottom: "18px",
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0052ff", display: "inline-block" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#0052ff", letterSpacing: ".5px" }}>
                MÜŞTERİ KAYDI
              </span>
            </div>
            <h1 style={{ fontFamily: "var(--font-family-headline)", fontSize: "26px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.4px" }}>
              Hesap Oluştur
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
              Destek portalına erişim için kayıt olun.
            </p>
          </div>

          {/* Hata mesajı */}
          {error && (
            <div style={{ display: "flex", gap: "8px", padding: "12px 14px", background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: "10px", marginBottom: "20px" }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: "1px" }} />
              <p style={{ margin: 0, fontSize: "13px", color: "#dc2626" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Satır 1: Ad Soyad + Şirket */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
              <div>
                <label style={label}>Ad Soyad <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="text" value={form.fullName} onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Ali Yılmaz" required style={inp("fullName")}
                  onFocus={() => setFocused("fullName")} onBlur={() => setFocused(null)}
                />
              </div>
              <div>
                <label style={label}>Şirket <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="text" value={form.company} onChange={(e) => set("company", e.target.value)}
                  placeholder="Şirket A.Ş." required style={inp("company")}
                  onFocus={() => setFocused("company")} onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            {/* Satır 2: Telefon + E-posta */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
              <div>
                <label style={label}>Telefon</label>
                <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  placeholder="+90 5xx xxx xx xx" style={inp("phone")}
                  onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
                />
              </div>
              <div>
                <label style={label}>E-posta <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="ali@sirket.com" required style={inp("email")}
                  onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            {/* Satır 3: Şifre + Şifre Tekrar */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "28px" }}>
              <div>
                <label style={label}>Şifre <span style={{ color: "#ef4444" }}>*</span></label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="En az 8 karakter" required
                    style={{ ...inp("password"), paddingRight: "42px" }}
                    onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={label}>Şifre Tekrar <span style={{ color: "#ef4444" }}>*</span></label>
                <div style={{ position: "relative" }}>
                  <input type={showCf ? "text" : "password"} value={form.confirm}
                    onChange={(e) => set("confirm", e.target.value)}
                    placeholder="Tekrar girin" required
                    style={{ ...inp("confirm", !!(form.confirm && form.confirm !== form.password)), paddingRight: "42px" }}
                    onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)}
                  />
                  <button type="button" onClick={() => setShowCf(!showCf)}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                    {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit butonu */}
            <button type="submit" disabled={loading}
              style={{
                width: "100%", padding: "14px",
                background: loading ? "#e2e8f0" : "linear-gradient(135deg, #0038c7 0%, #0052ff 100%)",
                color: loading ? "#94a3b8" : "#fff",
                border: "none", borderRadius: "12px",
                fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font-family-headline)", transition: "all .2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: loading ? "none" : "0 4px 16px rgba(0,82,255,.35)",
                letterSpacing: ".2px",
              }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
                  Kayıt yapılıyor...
                </span>
              ) : (
                <><UserPlus size={16} /> Kayıt Ol</>
              )}
            </button>
          </form>

          {/* Onay notu */}
          <div style={{
            marginTop: "16px", padding: "12px 16px",
            background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0",
            display: "flex", alignItems: "flex-start", gap: "8px",
          }}>
            <CheckCircle2 size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
            <p style={{ margin: 0, fontSize: "12px", color: "#15803d", lineHeight: 1.6 }}>
              Kayıt sonrası hesabınız ekibimiz tarafından incelenerek onaylanacaktır.
            </p>
          </div>

          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#64748b" }}>
            Zaten hesabınız var mı?{" "}
            <Link href={paths.giris} style={{ color: "#0052ff", textDecoration: "none", fontWeight: 700 }}>Giriş Yapın</Link>
          </p>
          <p style={{ textAlign: "center", marginTop: "10px", fontSize: "12px", color: "#9ca3af" }}>
            Acil: <a href="tel:+903122320288" style={{ color: "#64748b", textDecoration: "none" }}>+90 312 232 02 88</a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .kayit-left { display: none !important; } }
      `}</style>
    </div>
  );
}
