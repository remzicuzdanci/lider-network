"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useDestekPaths } from "@/lib/destek-path";
import { Eye, EyeOff, LogIn, AlertCircle, Clock } from "lucide-react";

export default function GirisClient() {
  const router = useRouter();
  const locale = useLocale();
  const paths = useDestekPaths(locale);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [pending, setPending]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPending(false);

    const sb = createSupabaseBrowser();
    const { data, error: authErr } = await sb.auth.signInWithPassword({ email, password });

    if (authErr) {
      setError(
        authErr.message.includes("Invalid login")
          ? "E-posta veya şifre hatalı."
          : authErr.message
      );
      setLoading(false);
      return;
    }

    // Check approval status
    const { data: profile } = await sb
      .from("customer_profiles")
      .select("approved")
      .eq("id", data.user.id)
      .single();

    if (!profile?.approved) {
      await sb.auth.signOut();
      setPending(true);
      setLoading(false);
      return;
    }

    router.push(paths.panel);
    router.refresh();
  }

  const inputBase: React.CSSProperties = {
    width: "100%", padding: "11px 14px", boxSizing: "border-box",
    background: "#272a2c", border: "1px solid #434656",
    borderRadius: "8px", color: "#e0e3e5", fontSize: "15px",
    outline: "none", fontFamily: "inherit", transition: "border-color .15s",
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 80px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 20px",
      background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,82,255,.08) 0%, transparent 70%)",
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
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
            Lider Network
          </h1>
          <p style={{ color: "#8d90a2", fontSize: "14px", margin: 0 }}>Destek Portalı Girişi</p>
        </div>

        {/* Card */}
        <div style={{
          background: "#1d2022", border: "1px solid #434656",
          borderRadius: "16px", padding: "32px",
          boxShadow: "0 8px 32px rgba(0,0,0,.3)",
        }}>
          {/* Pending approval notice */}
          {pending && (
            <div style={{
              display: "flex", gap: "10px", padding: "14px 16px",
              background: "rgba(217,119,6,.1)", border: "1px solid rgba(217,119,6,.3)",
              borderRadius: "10px", marginBottom: "20px",
            }}>
              <Clock size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: "1px" }} />
              <div>
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "14px", color: "#fbbf24" }}>
                  Hesabınız Onay Bekliyor
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#fcd34d" }}>
                  Hesabınız ekibimiz tarafından incelenip onaylanacak. Onaylandığında e-posta ile bilgilendirileceksiniz.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
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
            {/* Email */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#c3c5d9", marginBottom: "7px" }}>
                E-posta Adresi
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@sirket.com" required autoFocus
                style={inputBase}
                onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                onBlur={(e)  => (e.target.style.borderColor = "#434656")}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#c3c5d9" }}>Şifre</label>
                <Link href={`/${locale}/destek/sifre-sifirla`} style={{ fontSize: "12px", color: "#b7c4ff", textDecoration: "none" }}>
                  Şifremi Unuttum
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  style={{ ...inputBase, paddingRight: "42px" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                  onBlur={(e)  => (e.target.style.borderColor = "#434656")}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8d90a2", padding: 0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading || !email || !password}
              style={{
                width: "100%", padding: "13px",
                background: loading || !email || !password ? "#434656" : "#0052ff",
                color: "#fff", border: "none", borderRadius: "9px",
                fontSize: "15px", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font-family-headline)", transition: "background .15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}
            >
              {loading ? "Giriş yapılıyor..." : <><LogIn size={17} /> Giriş Yap</>}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#8d90a2" }}>
          Henüz hesabınız yok mu?{" "}
          <Link href={paths.kayit} style={{ color: "#b7c4ff", textDecoration: "none", fontWeight: 600 }}>
            Kayıt Olun
          </Link>
        </p>
        <p style={{ textAlign: "center", fontSize: "12px", color: "#434656", marginTop: "8px" }}>
          Acil destek:{" "}
          <a href="tel:+903122320288" style={{ color: "#8d90a2", textDecoration: "none" }}>+90 312 232 02 88</a>
        </p>
      </div>
    </div>
  );
}
