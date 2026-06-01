"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
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

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 14px", boxSizing: "border-box",
    background: "#fff", border: "1.5px solid #e5e7ef",
    borderRadius: "8px", color: "#1a1d2e", fontSize: "14px",
    outline: "none", fontFamily: "inherit", transition: "border-color .15s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>

        {/* Logo card */}
        <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "16px", padding: "28px 32px", marginBottom: "16px", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,.06)" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <Image src="/logo.png" alt="Lider Network" width={140} height={42} style={{ objectFit: "contain" }} />
          </div>
          <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#0052ff", textTransform: "uppercase", letterSpacing: "1.5px" }}>
            Admin Paneli
          </p>
        </div>

        {/* Form card */}
        <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "16px", padding: "28px 32px", boxShadow: "0 2px 16px rgba(0,0,0,.06)" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: 800, color: "#1a1d2e", fontFamily: "var(--font-family-headline)" }}>
            Giriş Yap
          </h2>
          <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#9ca3af" }}>
            Lider Network personel hesabınızla giriş yapın.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: ".5px" }}>
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ad.soyad@lidernetwork.com.tr"
                autoFocus
                style={inp}
                onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7ef")}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: ".5px" }}>
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ ...inp, borderColor: error ? "#ef4444" : "#e5e7ef" }}
                onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                onBlur={(e) => (e.target.style.borderColor = error ? "#ef4444" : "#e5e7ef")}
              />
              {error && (
                <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "6px", fontWeight: 500 }}>⚠ {error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: "100%", padding: "13px",
                background: loading || !password ? "#e5e7ef" : "#0052ff",
                color: loading || !password ? "#9ca3af" : "#fff",
                border: "none", borderRadius: "10px",
                fontSize: "14px", fontWeight: 700, cursor: loading || !password ? "not-allowed" : "pointer",
                transition: "background .15s", fontFamily: "var(--font-family-headline)",
                letterSpacing: ".2px",
              }}
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap →"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "12px", color: "#9ca3af" }}>
          Lider Network Destek Yönetim Sistemi
        </p>
      </div>
    </div>
  );
}
