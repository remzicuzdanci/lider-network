"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useDestekPaths } from "@/lib/destek-path";
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function KayitClient() {
  const locale = useLocale();
  const paths  = useDestekPaths(locale);
  const [form, setForm] = useState({
    fullName: "", company: "", phone: "", email: "", password: "", confirm: "",
  });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);

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

  const inputBase: React.CSSProperties = {
    width: "100%", padding: "11px 14px", boxSizing: "border-box",
    background: "#f8f9fb", border: "1.5px solid #e2e5ed",
    borderRadius: "10px", color: "#1a1d2e", fontSize: "14px",
    outline: "none", fontFamily: "inherit", transition: "border-color .15s",
  };

  // ── Success state ─────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "linear-gradient(135deg, #f0f4ff 0%, #f8f9fb 60%, #eef2ff 100%)" }}>
        <div style={{ background: "#fff", border: "1.5px solid #e2e5ed", borderRadius: "20px", padding: "48px 40px", maxWidth: "440px", width: "100%", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,.08)" }}>
          <div style={{ marginBottom: "24px" }}>
            <Image src="/logo.png" alt="Lider Network" width={140} height={42} style={{ objectFit: "contain" }} />
          </div>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fffbeb", border: "2px solid #fcd34d", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Clock size={28} color="#d97706" />
          </div>
          <h2 style={{ fontFamily: "var(--font-family-headline)", color: "#1a1d2e", fontSize: "22px", fontWeight: 800, margin: "0 0 12px" }}>Kaydınız Alındı!</h2>
          <p style={{ color: "#6b7280", fontSize: "15px", lineHeight: 1.7, margin: "0 0 20px" }}>
            Hesabınız oluşturuldu ve onay için ekibimize iletildi. Onaylandığında{" "}
            <strong style={{ color: "#1a1d2e" }}>{form.email}</strong> adresinize bildirim gönderilecek.
          </p>
          <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: "10px", padding: "12px 16px", marginBottom: "24px" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#1d4ed8" }}>⏱ Onay süresi genellikle birkaç saattir (mesai saatleri içinde).</p>
          </div>
          <Link href={paths.landing} style={{ display: "inline-block", padding: "11px 24px", border: "1.5px solid #e2e5ed", borderRadius: "10px", color: "#374151", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>← Ana Sayfaya Dön</Link>
          <p style={{ marginTop: "20px", fontSize: "12px", color: "#9ca3af" }}>Acil: <a href="tel:+903122320288" style={{ color: "#6b7280", textDecoration: "none" }}>+90 312 232 02 88</a></p>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "linear-gradient(135deg, #f0f4ff 0%, #f8f9fb 60%, #eef2ff 100%)" }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <Image src="/logo.png" alt="Lider Network" width={150} height={45} style={{ objectFit: "contain", marginBottom: "12px" }} />
          <h1 style={{ fontFamily: "var(--font-family-headline)", fontSize: "22px", fontWeight: 800, color: "#1a1d2e", margin: "0 0 4px" }}>Hesap Oluştur</h1>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Destek portalına kayıt olun</p>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", border: "1.5px solid #e2e5ed", borderRadius: "20px", padding: "32px", boxShadow: "0 8px 40px rgba(0,0,0,.08)" }}>
          {error && (
            <div style={{ display: "flex", gap: "8px", padding: "12px 14px", background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: "10px", marginBottom: "20px" }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: "1px" }} />
              <p style={{ margin: 0, fontSize: "13px", color: "#dc2626" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "7px" }}>
                  Ad Soyad <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input type="text" value={form.fullName} onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Ali Yılmaz" required style={inputBase}
                  onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e5ed")}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "7px" }}>
                  Şirket <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input type="text" value={form.company} onChange={(e) => set("company", e.target.value)}
                  placeholder="Şirket A.Ş." required style={inputBase}
                  onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e5ed")}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "7px" }}>Telefon</label>
                <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  placeholder="+90 5xx xxx xx xx" style={inputBase}
                  onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e5ed")}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "7px" }}>
                  E-posta <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="ali@sirket.com" required style={inputBase}
                  onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e5ed")}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "7px" }}>
                  Şifre <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="En az 8 karakter" required
                    style={{ ...inputBase, paddingRight: "40px" }}
                    onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e5ed")}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8d90a2", padding: 0 }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "7px" }}>
                  Şifre Tekrar <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)}
                  placeholder="Şifrenizi tekrar girin" required style={inputBase}
                  onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e5ed")}
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "13px", background: loading ? "#d1d5db" : "#0052ff", color: loading ? "#9ca3af" : "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "var(--font-family-headline)", transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: loading ? "none" : "0 4px 12px rgba(0,82,255,.3)" }}>
              {loading ? "Kayıt yapılıyor..." : <><UserPlus size={16} /> Kayıt Ol</>}
            </button>
          </form>

          <div style={{ marginTop: "16px", padding: "11px 14px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#15803d", lineHeight: 1.6 }}>
              <CheckCircle size={12} color="#16a34a" style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
              Kayıt sonrası hesabınız ekibimiz tarafından incelenerek onaylanacaktır.
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#6b7280" }}>
          Zaten hesabınız var mı?{" "}
          <Link href={paths.giris} style={{ color: "#0052ff", textDecoration: "none", fontWeight: 600 }}>Giriş Yapın</Link>
        </p>
      </div>
    </div>
  );
}
