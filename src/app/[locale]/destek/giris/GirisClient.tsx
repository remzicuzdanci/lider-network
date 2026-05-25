"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useDestekPaths } from "@/lib/destek-path";
import { Eye, EyeOff, LogIn, AlertCircle, Clock } from "lucide-react";

export default function GirisClient() {
  const router = useRouter();
  const locale = useLocale();
  const paths  = useDestekPaths(locale);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [pending, setPending]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setPending(false);

    const sb = createSupabaseBrowser();
    const { data, error: authErr } = await sb.auth.signInWithPassword({ email, password });

    if (authErr) {
      setError(authErr.message.includes("Invalid login") ? "E-posta veya şifre hatalı." : authErr.message);
      setLoading(false);
      return;
    }

    // Check approval via server API (uses service role key — bypasses all permission issues)
    const profileRes = await fetch("/api/destek/me");
    const profileData = await profileRes.json();

    if (!profileData.approved) {
      await sb.auth.signOut();
      setPending(true);
      setLoading(false);
      return;
    }

    router.push(paths.panel);
    router.refresh();
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 14px", boxSizing: "border-box",
    background: "#f8f9fb", border: "1.5px solid #e2e5ed",
    borderRadius: "10px", color: "#1a1d2e", fontSize: "14px",
    outline: "none", fontFamily: "inherit", transition: "border-color .15s",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: "linear-gradient(135deg, #f0f4ff 0%, #f8f9fb 60%, #eef2ff 100%)",
    }}>
      {/* Left panel — branding */}
      <div style={{
        flex: "0 0 420px", background: "linear-gradient(160deg, #0040cc 0%, #0052ff 50%, #1a6fff 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "48px 40px", position: "relative", overflow: "hidden",
      }} className="giris-left">
        {/* Decorative circles */}
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,.06)", top: -120, right: -120 }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,.04)", bottom: -80, left: -80 }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "16px 28px", display: "inline-block", marginBottom: "32px", boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
            <Image src="/logo.png" alt="Lider Network" width={160} height={48} style={{ objectFit: "contain", display: "block" }} />
          </div>
          <h2 style={{ fontFamily: "var(--font-family-headline)", fontSize: "26px", fontWeight: 800, color: "#fff", margin: "0 0 12px", lineHeight: 1.2 }}>
            Destek Portalı
          </h2>
          <p style={{ color: "rgba(255,255,255,.75)", fontSize: "15px", lineHeight: 1.7, margin: "0 0 40px" }}>
            Teknik destek taleplerinizi oluşturun,<br/>takip edin ve yönetin.
          </p>
          {[
            { icon: "🎯", text: "Öncelikli talep yönetimi" },
            { icon: "💬", text: "Gerçek zamanlı mesajlaşma" },
            { icon: "📊", text: "SLA takibi ve raporlama" },
          ].map((f) => (
            <div key={f.text} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", textAlign: "left" }}>
              <span style={{ fontSize: "18px" }}>{f.icon}</span>
              <span style={{ color: "rgba(255,255,255,.85)", fontSize: "14px" }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontFamily: "var(--font-family-headline)", fontSize: "26px", fontWeight: 800, color: "#1a1d2e", margin: "0 0 8px" }}>
              Hoş Geldiniz
            </h1>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Hesabınıza giriş yapın</p>
          </div>

          {/* Pending notice */}
          {pending && (
            <div style={{ display: "flex", gap: "10px", padding: "14px 16px", background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: "12px", marginBottom: "20px" }}>
              <Clock size={18} color="#d97706" style={{ flexShrink: 0, marginTop: "1px" }} />
              <div>
                <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: "14px", color: "#92400e" }}>Hesabınız Onay Bekliyor</p>
                <p style={{ margin: 0, fontSize: "13px", color: "#b45309" }}>Ekibimiz inceleyip onaylayacak. Onaylandığında e-posta ile bilgilendirileceksiniz.</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ display: "flex", gap: "8px", padding: "12px 14px", background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: "10px", marginBottom: "20px" }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: "1px" }} />
              <p style={{ margin: 0, fontSize: "13px", color: "#dc2626" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "7px" }}>E-posta Adresi</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@sirket.com" required autoFocus style={inp}
                onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                onBlur={(e)  => (e.target.style.borderColor = "#e2e5ed")}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Şifre</label>
                <Link href={`/${locale}/destek/sifre-sifirla`} style={{ fontSize: "12px", color: "#0052ff", textDecoration: "none" }}>Şifremi Unuttum</Link>
              </div>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  style={{ ...inp, paddingRight: "44px" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                  onBlur={(e)  => (e.target.style.borderColor = "#e2e5ed")}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !email || !password}
              style={{
                width: "100%", padding: "13px",
                background: loading || !email || !password ? "#d1d5db" : "#0052ff",
                color: loading || !email || !password ? "#9ca3af" : "#fff",
                border: "none", borderRadius: "10px",
                fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font-family-headline)", transition: "all .15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: loading || !email || !password ? "none" : "0 4px 12px rgba(0,82,255,.3)",
              }}>
              {loading ? "Giriş yapılıyor..." : <><LogIn size={16} /> Giriş Yap</>}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#6b7280" }}>
            Hesabınız yok mu?{" "}
            <Link href={paths.kayit} style={{ color: "#0052ff", textDecoration: "none", fontWeight: 600 }}>Kayıt Olun</Link>
          </p>
          <p style={{ textAlign: "center", marginTop: "12px", fontSize: "12px", color: "#9ca3af" }}>
            Acil:{" "}
            <a href="tel:+903122320288" style={{ color: "#6b7280", textDecoration: "none" }}>+90 312 232 02 88</a>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .giris-left { display: none !important; } }
      `}</style>
    </div>
  );
}
