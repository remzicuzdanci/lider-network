"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useDestekPaths } from "@/lib/destek-path";
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function KayitClient() {
  const locale = useLocale();
  const paths = useDestekPaths(locale);
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

    const sb = createSupabaseBrowser();
    const { data, error: signUpErr } = await sb.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (signUpErr) {
      setError(
        signUpErr.message.includes("already registered")
          ? "Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin."
          : signUpErr.message
      );
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setError("Kayıt tamamlanamadı. Lütfen tekrar deneyin.");
      setLoading(false);
      return;
    }

    // Create profile (approved: false by default)
    await sb.from("customer_profiles").insert({
      id: userId,
      full_name: form.fullName,
      company: form.company || null,
      phone: form.phone || null,
      approved: false,
    });

    // Sign out immediately — they need admin approval first
    await sb.auth.signOut();

    // Send emails via API
    await fetch("/api/destek/notify-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        fullName: form.fullName,
        company: form.company,
        phone: form.phone,
        email: form.email,
      }),
    });

    setDone(true);
    setLoading(false);
  }

  const inputBase: React.CSSProperties = {
    width: "100%", padding: "11px 14px", boxSizing: "border-box",
    background: "#272a2c", border: "1px solid #434656",
    borderRadius: "8px", color: "#e0e3e5", fontSize: "15px",
    outline: "none", fontFamily: "inherit", transition: "border-color .15s",
  };

  // ── Success state ─────────────────────────────────────────────
  if (done) {
    return (
      <div style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 20px",
      }}>
        <div style={{
          background: "#1d2022", border: "1px solid #434656",
          borderRadius: "16px", padding: "40px", maxWidth: "440px",
          width: "100%", textAlign: "center",
          boxShadow: "0 8px 32px rgba(0,0,0,.3)",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(217,119,6,.15)", border: "2px solid #d97706",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <Clock size={28} color="#fbbf24" />
          </div>
          <h2 style={{ fontFamily: "var(--font-family-headline)", color: "#e0e3e5", fontSize: "22px", fontWeight: 800, margin: "0 0 12px" }}>
            Kaydınız Alındı!
          </h2>
          <p style={{ color: "#8d90a2", fontSize: "15px", lineHeight: 1.7, margin: "0 0 24px" }}>
            Hesabınız oluşturuldu ve onay için ekibimize iletildi.
            Onaylandığında <strong style={{ color: "#c3c5d9" }}>{form.email}</strong> adresinize
            bildirim gönderilecek.
          </p>
          <div style={{
            background: "rgba(0,82,255,.08)", border: "1px solid rgba(0,82,255,.2)",
            borderRadius: "10px", padding: "14px 16px", marginBottom: "24px",
          }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#b7c4ff" }}>
              ⏱ Onay süresi genellikle birkaç saattir (mesai saatleri içinde).
            </p>
          </div>
          <Link href={paths.landing}
            style={{
              display: "inline-block", padding: "11px 24px",
              border: "1px solid #434656", borderRadius: "8px",
              color: "#c3c5d9", textDecoration: "none", fontSize: "14px",
            }}>
            ← Ana Sayfaya Dön
          </Link>
          <p style={{ marginTop: "20px", fontSize: "13px", color: "#8d90a2" }}>
            Acil destek:{" "}
            <a href="tel:+903122320288" style={{ color: "#b7c4ff", textDecoration: "none" }}>+90 312 232 02 88</a>
          </p>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "calc(100vh - 80px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 20px",
      background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,82,255,.08) 0%, transparent 70%)",
    }}>
      <div style={{ width: "100%", maxWidth: "460px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "14px",
            background: "rgba(0,82,255,.15)", border: "1px solid rgba(0,82,255,.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="#b7c4ff" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M12 12l-9-5M12 12l9-5M12 12v10" stroke="#b7c4ff" strokeWidth="1.5"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "var(--font-family-headline)", fontSize: "22px", fontWeight: 800, color: "#e0e3e5", margin: "0 0 6px" }}>
            Hesap Oluştur
          </h1>
          <p style={{ color: "#8d90a2", fontSize: "14px", margin: 0 }}>Destek portalına kayıt olun</p>
        </div>

        {/* Card */}
        <div style={{
          background: "#1d2022", border: "1px solid #434656",
          borderRadius: "16px", padding: "32px",
          boxShadow: "0 8px 32px rgba(0,0,0,.3)",
        }}>
          {error && (
            <div style={{
              display: "flex", gap: "8px", padding: "12px 14px",
              background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)",
              borderRadius: "8px", marginBottom: "20px",
            }}>
              <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: "1px" }} />
              <p style={{ margin: 0, fontSize: "13px", color: "#f87171" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#c3c5d9", marginBottom: "7px" }}>
                  Ad Soyad <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input type="text" value={form.fullName} onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Ali Yılmaz" required style={inputBase}
                  onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                  onBlur={(e)  => (e.target.style.borderColor = "#434656")}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#c3c5d9", marginBottom: "7px" }}>
                  Şirket <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input type="text" value={form.company} onChange={(e) => set("company", e.target.value)}
                  placeholder="Şirket A.Ş." required style={inputBase}
                  onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                  onBlur={(e)  => (e.target.style.borderColor = "#434656")}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#c3c5d9", marginBottom: "7px" }}>
                  Telefon
                </label>
                <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  placeholder="+90 5xx xxx xx xx" style={inputBase}
                  onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                  onBlur={(e)  => (e.target.style.borderColor = "#434656")}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#c3c5d9", marginBottom: "7px" }}>
                  E-posta <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="ali@sirket.com" required style={inputBase}
                  onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                  onBlur={(e)  => (e.target.style.borderColor = "#434656")}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#c3c5d9", marginBottom: "7px" }}>
                  Şifre <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="En az 8 karakter" required
                    style={{ ...inputBase, paddingRight: "40px" }}
                    onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                    onBlur={(e)  => (e.target.style.borderColor = "#434656")}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8d90a2", padding: 0 }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#c3c5d9", marginBottom: "7px" }}>
                  Şifre Tekrar <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)}
                  placeholder="Şifrenizi tekrar girin" required style={inputBase}
                  onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                  onBlur={(e)  => (e.target.style.borderColor = "#434656")}
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: "100%", padding: "13px",
                background: loading ? "#434656" : "#0052ff",
                color: "#fff", border: "none", borderRadius: "9px",
                fontSize: "15px", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font-family-headline)", transition: "background .15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}
            >
              {loading ? "Kayıt yapılıyor..." : <><UserPlus size={17} /> Kayıt Ol</>}
            </button>
          </form>

          <div style={{
            marginTop: "20px", padding: "12px 14px",
            background: "rgba(183,196,255,.05)", borderRadius: "8px",
            border: "1px solid rgba(183,196,255,.1)",
          }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#8d90a2", lineHeight: 1.6 }}>
              <CheckCircle size={12} color="#22c55e" style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
              Kayıt sonrası hesabınız ekibimiz tarafından incelenerek onaylanacaktır.
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#8d90a2" }}>
          Zaten hesabınız var mı?{" "}
          <Link href={paths.giris} style={{ color: "#b7c4ff", textDecoration: "none", fontWeight: 600 }}>
            Giriş Yapın
          </Link>
        </p>
      </div>
    </div>
  );
}
