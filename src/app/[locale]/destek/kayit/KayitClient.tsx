"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useDestekPaths } from "@/lib/destek-path";
import {
  Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2, Clock,
  Building2, MapPin, Phone, Mail, CreditCard, User,
} from "lucide-react";

type FormState = {
  // Firma
  company: string;
  address: string;
  city: string;
  district: string;
  taxNumber: string;
  // İletişim
  phone: string;
  phone2: string;
  // Yetkili
  fullName: string;
  email: string;
  // Şifre
  password: string;
  confirm: string;
  // Onay
  kvkk: boolean;
};

const INIT: FormState = {
  company: "", address: "", city: "", district: "", taxNumber: "",
  phone: "", phone2: "",
  fullName: "", email: "",
  password: "", confirm: "",
  kvkk: false,
};

export default function KayitClient() {
  const locale    = useLocale();
  const paths     = useDestekPaths(locale);
  const [form, setForm]       = useState<FormState>(INIT);
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.kvkk) { setError("KVKK Aydınlatma Metni'ni onaylamanız gereklidir."); return; }
    if (form.password !== form.confirm) { setError("Şifreler eşleşmiyor."); return; }
    if (form.password.length < 8) { setError("Şifre en az 8 karakter olmalıdır."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/destek/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company:   form.company,
          address:   form.address,
          city:      form.city,
          district:  form.district,
          taxNumber: form.taxNumber,
          phone:     form.phone,
          phone2:    form.phone2,
          fullName:  form.fullName,
          email:     form.email,
          password:  form.password,
          kvkk:      form.kvkk,
        }),
      });
      const data = await res.json();
      if (res.ok) { setDone(true); }
      else { setError(data.error || "Bir hata oluştu."); }
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Shared styles ──────────────────────────────────────────── */
  const inp = (name: string, hasError = false): React.CSSProperties => ({
    width: "100%", padding: "10px 13px", boxSizing: "border-box",
    background: focused === name ? "#f0f5ff" : "#f8f9fc",
    border: `1.5px solid ${hasError ? "#ef4444" : focused === name ? "#0052ff" : "#e5e7ef"}`,
    borderRadius: "9px", color: "#1a1d2e", fontSize: "13.5px",
    outline: "none", fontFamily: "inherit", transition: "all .15s ease",
  });

  const lbl: React.CSSProperties = {
    display: "block", fontSize: "11px", fontWeight: 700,
    color: "#374151", marginBottom: "6px",
    letterSpacing: ".4px", textTransform: "uppercase",
  };

  const sectionHead = (Icon: React.ElementType, title: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", marginTop: "4px" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "8px", flexShrink: 0,
        background: "rgba(0,82,255,0.1)", border: "1px solid rgba(0,82,255,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={13} color="#0052ff" />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 700, color: "#0052ff", letterSpacing: ".5px", textTransform: "uppercase" as const }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(0,82,255,0.12)" }} />
    </div>
  );

  /* ── Success ────────────────────────────────────────────────── */
  if (done) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", background: "linear-gradient(135deg, #f0f4ff 0%, #f8f9fc 60%, #eef2ff 100%)" }}>
        <div style={{ flex: "0 0 420px", background: "linear-gradient(160deg, #0040cc 0%, #0052ff 50%, #1a6fff 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 40px", position: "relative", overflow: "hidden" }} className="kayit-left">
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,.06)", top: -120, right: -120 }} />
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,.04)", bottom: -80, left: -80 }} />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "16px 28px", display: "inline-block", marginBottom: "32px", boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
              <Image src="/logo.png" alt="Lider Network" width={160} height={48} style={{ objectFit: "contain", display: "block" }} />
            </div>
            <h2 style={{ fontFamily: "var(--font-family-headline)", fontSize: "26px", fontWeight: 800, color: "#fff", margin: "0 0 12px" }}>Destek Portalı</h2>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
          <div style={{ width: "100%", maxWidth: "420px", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #0038c7, #0052ff)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 8px 24px rgba(0,82,255,.3)" }}>
              <Clock size={32} color="#fff" />
            </div>
            <h2 style={{ fontFamily: "var(--font-family-headline)", color: "#0f172a", fontSize: "24px", fontWeight: 800, margin: "0 0 12px" }}>Başvurunuz Alındı!</h2>
            <p style={{ color: "#64748b", fontSize: "15px", lineHeight: 1.7, margin: "0 0 24px" }}>
              Firma kaydınız oluşturuldu ve onay için ekibimize iletildi.<br />
              Onaylandığında <strong style={{ color: "#0f172a" }}>{form.email}</strong> adresine bildirim gönderilecek.
            </p>
            <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: "12px", padding: "14px 18px", marginBottom: "28px" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#1d4ed8", lineHeight: 1.6 }}>⏱ Onay süresi genellikle birkaç saattir (mesai saatleri içinde).</p>
            </div>
            <Link href={paths.landing} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 28px", border: "1.5px solid #e5e7ef", borderRadius: "12px", color: "#374151", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
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

  /* ── Form ───────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "linear-gradient(135deg, #f0f4ff 0%, #f8f9fc 60%, #eef2ff 100%)" }}>

      {/* ── Sol panel ─────────────────────────────────────────── */}
      <div style={{
        flex: "0 0 380px",
        background: "linear-gradient(160deg, #0040cc 0%, #0052ff 55%, #1a6fff 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "48px 36px", position: "sticky", top: 0, height: "100vh",
        overflow: "hidden",
      }} className="kayit-left">
        <div style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", background: "rgba(255,255,255,.06)", top: -100, right: -100 }} />
        <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,.04)", bottom: -70, left: -70 }} />
        <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.05)", top: "42%", left: "6%" }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", color: "#fff" }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "14px 26px", display: "inline-block", marginBottom: "28px", boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
            <Image src="/logo.png" alt="Lider Network" width={150} height={45} style={{ objectFit: "contain", display: "block" }} />
          </div>
          <h2 style={{ fontFamily: "var(--font-family-headline)", fontSize: "24px", fontWeight: 800, margin: "0 0 10px" }}>Destek Portalı</h2>
          <p style={{ color: "rgba(255,255,255,.75)", fontSize: "14px", lineHeight: 1.7, margin: "0 0 36px" }}>
            Sözleşmeli müşterilere özel teknik destek ve talep yönetim sistemi.
          </p>

          {/* Adımlar */}
          {[
            { n: "1", title: "Formu doldurun", desc: "Firma ve yetkili bilgilerinizi girin" },
            { n: "2", title: "Onay bekleyin", desc: "Ekibimiz birkaç saat içinde inceler" },
            { n: "3", title: "Giriş yapın", desc: "Onay sonrası portale erişin" },
          ].map((s) => (
            <div key={s.n} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px", textAlign: "left" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800 }}>
                {s.n}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "2px" }}>{s.title}</div>
                <div style={{ color: "rgba(255,255,255,.65)", fontSize: "12px" }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sağ panel — form ─────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "40px 32px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: "520px" }}>

          {/* Başlık */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#eff3ff", borderRadius: "20px", padding: "5px 14px", marginBottom: "16px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0052ff", display: "inline-block" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#0052ff", letterSpacing: ".5px" }}>MÜŞTERİ KAYDI</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-family-headline)", fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.4px" }}>
              Hesap Başvurusu
            </h1>
            <p style={{ color: "#64748b", fontSize: "13.5px", margin: 0 }}>
              Tüm alanları eksiksiz doldurun — onay sonrası portale erişebilirsiniz.
            </p>
          </div>

          {/* Hata */}
          {error && (
            <div style={{ display: "flex", gap: "8px", padding: "11px 14px", background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: "10px", marginBottom: "20px" }}>
              <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: "1px" }} />
              <p style={{ margin: 0, fontSize: "13px", color: "#dc2626" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* ── Firma Bilgileri ──────────────────────────── */}
            <div>
              {sectionHead(Building2, "Firma Bilgileri")}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={lbl}>Firma / Kurum Adı <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="text" value={form.company} required placeholder="Örn: Örnek Yazılım Ltd. Şti."
                    style={inp("company")}
                    onFocus={() => setFocused("company")} onBlur={() => setFocused(null)}
                    onChange={(e) => set("company", e.target.value)}
                  />
                </div>
                <div>
                  <label style={lbl}>Açık Adres</label>
                  <textarea value={form.address} placeholder="Mahalle, cadde, sokak, bina no..."
                    rows={2}
                    style={{ ...inp("address"), resize: "vertical" as const }}
                    onFocus={() => setFocused("address")} onBlur={() => setFocused(null)}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={lbl}>Şehir</label>
                    <input type="text" value={form.city} placeholder="İstanbul"
                      style={inp("city")}
                      onFocus={() => setFocused("city")} onBlur={() => setFocused(null)}
                      onChange={(e) => set("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={lbl}>İlçe</label>
                    <input type="text" value={form.district} placeholder="Şişli"
                      style={inp("district")}
                      onFocus={() => setFocused("district")} onBlur={() => setFocused(null)}
                      onChange={(e) => set("district", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── İletişim ─────────────────────────────────── */}
            <div>
              {sectionHead(Phone, "İletişim Bilgileri")}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={lbl}>Cep Telefonu <span style={{ color: "#ef4444" }}>*</span></label>
                    <input type="tel" value={form.phone} required placeholder="05XX XXX XX XX"
                      style={inp("phone")}
                      onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Sabit / İkinci Hat</label>
                    <input type="tel" value={form.phone2} placeholder="0212 XXX XX XX"
                      style={inp("phone2")}
                      onFocus={() => setFocused("phone2")} onBlur={() => setFocused(null)}
                      onChange={(e) => set("phone2", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Vergi / TC Kimlik No</label>
                  <input type="text" value={form.taxNumber} placeholder="10 haneli VKN veya TC kimlik no"
                    style={inp("taxNumber")}
                    onFocus={() => setFocused("taxNumber")} onBlur={() => setFocused(null)}
                    onChange={(e) => set("taxNumber", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── Yetkili Bilgileri ─────────────────────────── */}
            <div>
              {sectionHead(User, "Yetkili Bilgileri")}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={lbl}>Yetkili Ad Soyad <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="text" value={form.fullName} required placeholder="Adınız Soyadınız"
                    style={inp("fullName")}
                    onFocus={() => setFocused("fullName")} onBlur={() => setFocused(null)}
                    onChange={(e) => set("fullName", e.target.value)}
                  />
                </div>
                <div>
                  <label style={lbl}>Yetkili E-posta <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="email" value={form.email} required placeholder="yetkili@firma.com"
                    style={inp("email")}
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── Şifre ────────────────────────────────────── */}
            <div>
              {sectionHead(CreditCard, "Giriş Bilgileri")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={lbl}>Şifre <span style={{ color: "#ef4444" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <input type={showPw ? "text" : "password"} value={form.password} required
                      placeholder="En az 8 karakter"
                      style={{ ...inp("password"), paddingRight: "40px" }}
                      onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                      onChange={(e) => set("password", e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Şifre Tekrar <span style={{ color: "#ef4444" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <input type={showCf ? "text" : "password"} value={form.confirm} required
                      placeholder="Tekrar girin"
                      style={{ ...inp("confirm", !!(form.confirm && form.confirm !== form.password)), paddingRight: "40px" }}
                      onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)}
                      onChange={(e) => set("confirm", e.target.value)}
                    />
                    <button type="button" onClick={() => setShowCf(!showCf)}
                      style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                      {showCf ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── KVKK ────────────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                <input type="checkbox" checked={form.kvkk} onChange={(e) => set("kvkk", e.target.checked)}
                  style={{ marginTop: "2px", width: 15, height: 15, accentColor: "#0052ff", flexShrink: 0 }}
                />
                <span style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.6 }}>
                  <Link href={`/${locale}/kvkk`} target="_blank" style={{ color: "#0052ff", fontWeight: 600, textDecoration: "none" }}>KVKK Aydınlatma Metni</Link>'ni okudum ve kişisel verilerimin işlenmesini onaylıyorum. <span style={{ color: "#ef4444" }}>*</span>
                </span>
              </label>
            </div>

            {/* ── Submit ────────────────────────────────── */}
            <button type="submit" disabled={loading}
              style={{
                width: "100%", padding: "14px",
                background: loading ? "#e2e8f0" : "linear-gradient(135deg, #0038c7 0%, #0052ff 100%)",
                color: loading ? "#94a3b8" : "#fff",
                border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font-family-headline)", transition: "all .2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: loading ? "none" : "0 4px 16px rgba(0,82,255,.35)",
                letterSpacing: ".2px",
              }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
                  Gönderiliyor...
                </span>
              ) : (
                <><UserPlus size={16} /> Başvuruyu Gönder</>
              )}
            </button>

            {/* Onay notu */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "11px 14px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
              <CheckCircle2 size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
              <p style={{ margin: 0, fontSize: "12px", color: "#15803d", lineHeight: 1.6 }}>
                Başvurunuz ekibimiz tarafından incelenerek onaylanacaktır. Onay sonrası e-posta ile bilgilendirileceksiniz.
              </p>
            </div>

          </form>

          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "13.5px", color: "#64748b" }}>
            Zaten hesabınız var mı?{" "}
            <Link href={paths.giris} style={{ color: "#0052ff", textDecoration: "none", fontWeight: 700 }}>Giriş Yapın</Link>
          </p>
          <p style={{ textAlign: "center", marginTop: "8px", fontSize: "12px", color: "#9ca3af" }}>
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
