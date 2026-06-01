"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [focusedField, setFocusedField] = useState<"email"|"password"|null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/admin/destek");
        router.refresh();
      } else {
        setError(data.error || "Giriş başarısız");
      }
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (field: "email" | "password"): React.CSSProperties => ({
    width: "100%",
    padding: "12px 16px",
    boxSizing: "border-box",
    background: focusedField === field ? "#f0f5ff" : "#f8f9fc",
    border: `1.5px solid ${
      field === "password" && error
        ? "#ef4444"
        : focusedField === field
        ? "#0052ff"
        : "#e5e7ef"
    }`,
    borderRadius: "10px",
    color: "#1a1d2e",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    transition: "all .15s ease",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#fff",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* ── Sol panel — mavi / gradient ──────────────────────────── */}
      <div
        style={{
          flex: "0 0 45%",
          background: "linear-gradient(145deg, #0038c7 0%, #0052ff 50%, #3b82f6 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Dekoratif daireler */}
        <div style={{
          position: "absolute", width: 350, height: 350, borderRadius: "50%",
          background: "rgba(255,255,255,.06)", top: -80, right: -80,
        }} />
        <div style={{
          position: "absolute", width: 250, height: 250, borderRadius: "50%",
          background: "rgba(255,255,255,.06)", bottom: -60, left: -60,
        }} />
        <div style={{
          position: "absolute", width: 150, height: 150, borderRadius: "50%",
          background: "rgba(255,255,255,.08)", top: "40%", left: "10%",
        }} />

        {/* İçerik */}
        <div style={{ position: "relative", textAlign: "center", color: "#fff" }}>
          <div style={{
            background: "rgba(255,255,255,.15)",
            borderRadius: "20px",
            padding: "16px 24px",
            marginBottom: "32px",
            display: "inline-block",
            backdropFilter: "blur(8px)",
          }}>
            <Image
              src="/logo.png"
              alt="Lider Network"
              width={160}
              height={48}
              style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
            />
          </div>

          <h2 style={{
            fontSize: "26px", fontWeight: 800,
            margin: "0 0 12px", letterSpacing: "-0.5px",
          }}>
            Destek Yönetim Sistemi
          </h2>
          <p style={{
            fontSize: "14px", opacity: 0.8, margin: 0,
            lineHeight: 1.7, maxWidth: 280,
          }}>
            Müşteri taleplerinizi tek panelden yönetin, sözleşmeli şirketlere kolayca destek açın.
          </p>

          {/* Stats */}
          <div style={{
            display: "flex", gap: "16px", marginTop: "48px", justifyContent: "center",
          }}>
            {[
              { label: "Personel", value: "6" },
              { label: "Sistem", value: "7/24" },
              { label: "Mail", value: "Otomatik" },
            ].map((s) => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,.12)",
                borderRadius: "12px",
                padding: "14px 18px",
                backdropFilter: "blur(8px)",
                textAlign: "center",
                minWidth: 80,
              }}>
                <div style={{ fontSize: "18px", fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: "11px", opacity: 0.75, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sağ panel — form ─────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 40px",
          background: "#fafbff",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>

          {/* Başlık */}
          <div style={{ marginBottom: "36px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "#eff3ff", borderRadius: "20px",
              padding: "6px 14px", marginBottom: "20px",
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#0052ff", display: "inline-block",
              }} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#0052ff", letterSpacing: ".5px" }}>
                PERSONEL GİRİŞİ
              </span>
            </div>
            <h1 style={{
              fontSize: "28px", fontWeight: 800,
              color: "#0f172a", margin: "0 0 8px",
              letterSpacing: "-0.5px",
            }}>
              Hoş Geldiniz
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
              Lider Network personel hesabınızla giriş yapın.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* E-posta */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block", fontSize: "12px", fontWeight: 700,
                color: "#374151", marginBottom: "8px",
                letterSpacing: ".3px", textTransform: "uppercase",
              }}>
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ad.soyad@lidernetwork.com.tr"
                autoFocus
                style={inputStyle("email")}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
              />
            </div>

            {/* Şifre */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{
                display: "block", fontSize: "12px", fontWeight: 700,
                color: "#374151", marginBottom: "8px",
                letterSpacing: ".3px", textTransform: "uppercase",
              }}>
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle("password")}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
              />
              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: "8px", padding: "10px 12px", marginTop: "10px",
                }}>
                  <span style={{ fontSize: "16px" }}>⚠️</span>
                  <span style={{ color: "#dc2626", fontSize: "13px", fontWeight: 500 }}>{error}</span>
                </div>
              )}
            </div>

            {/* Buton */}
            <button
              type="submit"
              disabled={loading || !password || !email}
              style={{
                width: "100%",
                padding: "14px",
                background: loading || !password || !email
                  ? "#e2e8f0"
                  : "linear-gradient(135deg, #0038c7 0%, #0052ff 100%)",
                color: loading || !password || !email ? "#94a3b8" : "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: loading || !password || !email ? "not-allowed" : "pointer",
                transition: "all .2s ease",
                letterSpacing: ".2px",
                boxShadow: loading || !password || !email
                  ? "none"
                  : "0 4px 16px rgba(0,82,255,.35)",
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <span style={{
                    width: 16, height: 16, border: "2px solid rgba(255,255,255,.4)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    display: "inline-block", animation: "spin .7s linear infinite",
                  }} />
                  Giriş yapılıyor...
                </span>
              ) : (
                "Giriş Yap →"
              )}
            </button>

          </form>

          <p style={{
            textAlign: "center", marginTop: "32px",
            fontSize: "12px", color: "#94a3b8",
          }}>
            © {new Date().getFullYear()} Lider Network — Tüm hakları saklıdır
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
