"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  CheckCircle, AlertCircle, Headphones, Clock, Shield, Zap,
} from "lucide-react";

type Category = "technical" | "billing" | "general" | "feature_request";
type Priority  = "low" | "medium" | "high" | "urgent";

interface FormData {
  customer_name: string;
  customer_email: string;
  company: string;
  phone: string;
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
}

const CATEGORIES: { value: Category; label: string; desc: string }[] = [
  { value: "technical",       label: "Teknik Destek",    desc: "Donanım, yazılım, ağ sorunları" },
  { value: "billing",         label: "Fatura / Lisans",  desc: "Fatura ve lisans işlemleri" },
  { value: "general",         label: "Genel Bilgi",      desc: "Ürün ve hizmetler hakkında" },
  { value: "feature_request", label: "Özellik İsteği",   desc: "Yeni özellik veya iyileştirme" },
];

const PRIORITIES: { value: Priority; label: string; color: string; desc: string }[] = [
  { value: "low",    label: "Düşük",   color: "#64748b", desc: "1-2 iş günü" },
  { value: "medium", label: "Orta",    color: "#d97706", desc: "8 saat" },
  { value: "high",   label: "Yüksek",  color: "#ea580c", desc: "4 saat" },
  { value: "urgent", label: "Acil",    color: "#dc2626", desc: "2 saat" },
];

export default function DesktekClient() {
  const locale = useLocale();
  const [form, setForm] = useState<FormData>({
    customer_name: "",
    customer_email: "",
    company: "",
    phone: "",
    subject: "",
    description: "",
    category: "technical",
    priority: "medium",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string; number: number } | null>(null);
  const [apiError, setApiError] = useState("");

  function set(key: keyof FormData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.customer_name.trim() || form.customer_name.length < 2)
      e.customer_name = "Ad Soyad en az 2 karakter olmalıdır";
    if (!form.customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email))
      e.customer_email = "Geçerli bir e-posta adresi girin";
    if (!form.subject.trim() || form.subject.length < 5)
      e.subject = "Konu en az 5 karakter olmalıdır";
    if (!form.description.trim() || form.description.length < 20)
      e.description = "Açıklama en az 20 karakter olmalıdır";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ id: data.ticket_id, number: data.ticket_number });
      } else {
        setApiError(data.error || "Bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } catch {
      setApiError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  // ── Success State ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <section className="section" style={{ minHeight: "80vh", display: "flex", alignItems: "center" }}>
        <div className="container">
          <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, background: "rgba(22,163,74,.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <CheckCircle size={32} color="#22c55e" />
            </div>
            <h1 style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)", fontSize: "28px", fontWeight: 800, marginBottom: "12px" }}>
              Talebiniz Alındı
            </h1>
            <p style={{ color: "var(--color-on-surface-variant)", fontSize: "16px", marginBottom: "32px" }}>
              En kısa sürede dönüş yapacağız. Onay e-postası gönderildi.
            </p>
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "16px", padding: "28px", marginBottom: "28px" }}>
              <p style={{ color: "var(--color-outline)", fontSize: "12px", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "8px" }}>Talep Numaranız</p>
              <p style={{ fontFamily: "var(--font-family-label)", fontSize: "40px", fontWeight: 900, color: "var(--color-primary-container)", letterSpacing: "-2px", margin: "0 0 20px" }}>
                #{String(result.number).padStart(4, "0")}
              </p>
              <Link
                href={`/${locale}/destek/ticket/${result.id}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "12px 24px", background: "var(--color-primary-container)",
                  color: "#fff", borderRadius: "8px", textDecoration: "none",
                  fontWeight: 700, fontSize: "14px",
                }}
              >
                Talebimi Takip Et →
              </Link>
            </div>
            <p style={{ color: "var(--color-outline)", fontSize: "13px" }}>
              Acil durumlarda:{" "}
              <a href="tel:+903122320288" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                +90 312 232 02 88
              </a>
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  const inputStyle = (hasError?: boolean) => ({
    width: "100%", padding: "11px 14px", boxSizing: "border-box" as const,
    background: "var(--color-surface-high)",
    border: `1px solid ${hasError ? "#ef4444" : "var(--color-outline-variant)"}`,
    borderRadius: "8px", color: "var(--color-on-surface)",
    fontSize: "14px", outline: "none", fontFamily: "inherit",
  });

  return (
    <>
      {/* Hero */}
      <section style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-outline-variant)", padding: "56px 0 40px" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <div style={{ width: 48, height: 48, background: "rgba(0,82,255,.15)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Headphones size={24} color="#b7c4ff" />
            </div>
            <div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: ".5px", margin: 0 }}>
                Destek Merkezi
              </p>
              <h1 style={{ fontFamily: "var(--font-family-headline)", fontSize: "28px", fontWeight: 800, color: "var(--color-on-surface)", margin: "4px 0 0" }}>
                Nasıl yardımcı olabiliriz?
              </h1>
            </div>
          </div>
          <p style={{ color: "var(--color-on-surface-variant)", fontSize: "15px", maxWidth: "600px" }}>
            Destek talebinizi oluşturun — ekibimiz belirlenen SLA sürelerinde yanıt verir.
            Talebinizi e-postanızdan takip edebilirsiniz.
          </p>
          {/* SLA badges */}
          <div style={{ display: "flex", gap: "16px", marginTop: "24px", flexWrap: "wrap" }}>
            {[
              { icon: <Zap size={14} />, text: "Acil: 2s yanıt", color: "#dc2626" },
              { icon: <Clock size={14} />, text: "Yüksek: 4s yanıt", color: "#ea580c" },
              { icon: <Shield size={14} />, text: "Orta: 8s yanıt", color: "#d97706" },
            ].map((b) => (
              <span key={b.text} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: b.color, fontWeight: 600 }}>
                {b.icon}{b.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="section">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(0,680px) 1fr", gap: "0" }}>
            <div /> {/* spacer */}
            <form onSubmit={handleSubmit} noValidate>
              {apiError && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "14px 16px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: "10px", marginBottom: "24px" }}>
                  <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: "1px" }} />
                  <p style={{ color: "#fca5a5", fontSize: "14px", margin: 0 }}>{apiError}</p>
                </div>
              )}

              {/* Contact info */}
              <fieldset style={{ border: "none", padding: 0, marginBottom: "28px" }}>
                <legend style={{ fontFamily: "var(--font-family-headline)", fontWeight: 700, color: "var(--color-on-surface)", fontSize: "16px", marginBottom: "16px", display: "block" }}>
                  İletişim Bilgileri
                </legend>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-on-surface-variant)", display: "block", marginBottom: "6px" }}>
                      Ad Soyad <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input type="text" value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} placeholder="Adınız Soyadınız" style={inputStyle(!!errors.customer_name)} />
                    {errors.customer_name && <p style={{ color: "#f87171", fontSize: "12px", marginTop: "4px" }}>{errors.customer_name}</p>}
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-on-surface-variant)", display: "block", marginBottom: "6px" }}>
                      E-posta <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input type="email" value={form.customer_email} onChange={(e) => set("customer_email", e.target.value)} placeholder="ornek@sirket.com" style={inputStyle(!!errors.customer_email)} />
                    {errors.customer_email && <p style={{ color: "#f87171", fontSize: "12px", marginTop: "4px" }}>{errors.customer_email}</p>}
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-on-surface-variant)", display: "block", marginBottom: "6px" }}>
                      Şirket
                    </label>
                    <input type="text" value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Şirket Adı" style={inputStyle()} />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-on-surface-variant)", display: "block", marginBottom: "6px" }}>
                      Telefon
                    </label>
                    <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+90 5xx xxx xx xx" style={inputStyle()} />
                  </div>
                </div>
              </fieldset>

              {/* Ticket details */}
              <fieldset style={{ border: "none", padding: 0, marginBottom: "28px" }}>
                <legend style={{ fontFamily: "var(--font-family-headline)", fontWeight: 700, color: "var(--color-on-surface)", fontSize: "16px", marginBottom: "16px", display: "block" }}>
                  Talep Detayları
                </legend>

                {/* Category */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-on-surface-variant)", display: "block", marginBottom: "10px" }}>
                    Kategori
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => set("category", c.value)}
                        style={{
                          padding: "12px 14px", borderRadius: "10px", textAlign: "left", cursor: "pointer",
                          border: "1px solid",
                          borderColor: form.category === c.value ? "var(--color-primary-container)" : "var(--color-outline-variant)",
                          background: form.category === c.value ? "rgba(0,82,255,.1)" : "var(--color-surface-high)",
                          transition: "all .15s",
                        }}
                      >
                        <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 700, color: form.category === c.value ? "var(--color-primary)" : "var(--color-on-surface)" }}>
                          {c.label}
                        </p>
                        <p style={{ margin: 0, fontSize: "11px", color: "var(--color-outline)" }}>{c.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-on-surface-variant)", display: "block", marginBottom: "10px" }}>
                    Öncelik
                  </label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => set("priority", p.value)}
                        style={{
                          padding: "8px 14px", borderRadius: "8px", cursor: "pointer",
                          border: `1px solid ${form.priority === p.value ? p.color : "var(--color-outline-variant)"}`,
                          background: form.priority === p.value ? `${p.color}22` : "transparent",
                          transition: "all .15s",
                        }}
                      >
                        <span style={{ fontSize: "13px", fontWeight: 700, color: form.priority === p.value ? p.color : "var(--color-outline)" }}>
                          {p.label}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--color-outline)", marginLeft: "6px" }}>
                          {p.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-on-surface-variant)", display: "block", marginBottom: "6px" }}>
                    Konu <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input type="text" value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Sorununuzu kısaca özetleyin" style={inputStyle(!!errors.subject)} />
                  {errors.subject && <p style={{ color: "#f87171", fontSize: "12px", marginTop: "4px" }}>{errors.subject}</p>}
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-on-surface-variant)", display: "block", marginBottom: "6px" }}>
                    Açıklama <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Sorununuzu ayrıntılı açıklayın. Hata mesajları, etkilenen sistem, ne zaman başladığı gibi bilgileri ekleyin..."
                    rows={6}
                    style={{ ...inputStyle(!!errors.description), resize: "vertical", lineHeight: 1.6 }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                    {errors.description
                      ? <p style={{ color: "#f87171", fontSize: "12px", margin: 0 }}>{errors.description}</p>
                      : <span />}
                    <span style={{ fontSize: "12px", color: "var(--color-outline)" }}>{form.description.length}/5000</span>
                  </div>
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "14px",
                  background: loading ? "var(--color-outline-variant)" : "var(--color-primary-container)",
                  color: "#fff", border: "none", borderRadius: "10px",
                  fontSize: "15px", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-family-headline)", transition: "background .15s",
                }}
              >
                {loading ? "Gönderiliyor..." : "Destek Talebi Oluştur"}
              </button>

              <p style={{ textAlign: "center", fontSize: "12px", color: "var(--color-outline)", marginTop: "16px" }}>
                Onay e-postası anında gönderilir · Acil:{" "}
                <a href="tel:+903122320288" style={{ color: "var(--color-primary)", textDecoration: "none" }}>+90 312 232 02 88</a>
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
