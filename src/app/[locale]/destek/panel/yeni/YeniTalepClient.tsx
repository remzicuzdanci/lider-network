"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";

type Category = "technical" | "billing" | "general" | "feature_request";
type Priority  = "low" | "medium" | "high" | "urgent";

const CATEGORIES = [
  { value: "technical" as Category,       label: "Teknik Destek",   desc: "Donanım, yazılım, ağ sorunları" },
  { value: "billing" as Category,         label: "Fatura / Lisans", desc: "Fatura ve lisans işlemleri" },
  { value: "general" as Category,         label: "Genel Bilgi",     desc: "Ürün ve hizmetler hakkında" },
  { value: "feature_request" as Category, label: "Özellik İsteği",  desc: "Yeni özellik veya iyileştirme" },
];
const PRIORITIES = [
  { value: "low" as Priority,    label: "Düşük",  color: "#64748b", desc: "1-2 iş günü" },
  { value: "medium" as Priority, label: "Orta",   color: "#d97706", desc: "8 saat" },
  { value: "high" as Priority,   label: "Yüksek", color: "#ea580c", desc: "4 saat" },
  { value: "urgent" as Priority, label: "ACİL",   color: "#dc2626", desc: "2 saat" },
];

export default function YeniTalepClient({
  userId, userEmail, fullName, company, phone,
}: {
  userId: string; userEmail: string; fullName: string; company?: string | null; phone?: string | null;
}) {
  const router = useRouter();
  const locale = useLocale();
  const [category, setCategory] = useState<Category>("technical");
  const [priority, setPriority] = useState<Priority>("medium");
  const [subject, setSubject]   = useState("");
  const [desc, setDesc]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (subject.length < 5) { setError("Konu en az 5 karakter olmalıdır."); return; }
    if (desc.length < 20)   { setError("Açıklama en az 20 karakter olmalıdır."); return; }

    setLoading(true); setError("");

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: fullName,
        customer_email: userEmail,
        company: company || "",
        phone: phone || "",
        subject, description: desc,
        category, priority,
        user_id: userId,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setDone(data.ticket_number);
    } else {
      setError(data.error || "Bir hata oluştu.");
    }
    setLoading(false);
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 14px", boxSizing: "border-box",
    background: "#272a2c", border: "1px solid #434656",
    borderRadius: "8px", color: "#e0e3e5", fontSize: "14px",
    outline: "none", fontFamily: "inherit",
  };

  if (done !== null) {
    return (
      <div style={{ minHeight: "calc(100vh - 136px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ background: "#1d2022", border: "1px solid #434656", borderRadius: "16px", padding: "40px", maxWidth: "440px", width: "100%", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(22,163,74,.15)", border: "2px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckCircle size={28} color="#22c55e" />
          </div>
          <h2 style={{ fontFamily: "var(--font-family-headline)", color: "#e0e3e5", fontSize: "22px", fontWeight: 800, margin: "0 0 10px" }}>Talebiniz Oluşturuldu</h2>
          <p style={{ color: "#8d90a2", fontSize: "15px", margin: "0 0 8px" }}>Talep numaranız:</p>
          <p style={{ fontFamily: "var(--font-family-label)", fontSize: "38px", fontWeight: 900, color: "#0052ff", margin: "0 0 24px" }}>
            #{String(done).padStart(4, "0")}
          </p>
          <p style={{ color: "#8d90a2", fontSize: "13px", margin: "0 0 24px" }}>
            Onay e-postası {userEmail} adresinize gönderildi.
          </p>
          <Link href={`/${locale}/destek/panel`}
            style={{ display: "inline-block", padding: "11px 24px", background: "#0052ff", color: "#fff", borderRadius: "8px", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>
            Panele Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--color-background)", padding: "0 0 48px" }}>
      {/* Panel header */}
      <div style={{ background: "#1d2022", borderBottom: "1px solid #434656", padding: "0 32px", height: "56px", display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href={`/${locale}/destek/panel`}
          style={{ display: "flex", alignItems: "center", gap: "6px", color: "#8d90a2", textDecoration: "none", fontSize: "13px" }}>
          <ArrowLeft size={15} /> Panele Dön
        </Link>
        <span style={{ color: "#434656" }}>/</span>
        <span style={{ color: "#e0e3e5", fontSize: "13px", fontWeight: 600 }}>Yeni Talep</span>
      </div>

      <div style={{ maxWidth: "680px", margin: "32px auto", padding: "0 24px" }}>
        <h1 style={{ fontFamily: "var(--font-family-headline)", fontSize: "22px", fontWeight: 800, color: "#e0e3e5", margin: "0 0 24px" }}>
          Yeni Destek Talebi
        </h1>

        {error && (
          <div style={{ padding: "12px 14px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: "8px", marginBottom: "20px", color: "#f87171", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Category */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#c3c5d9", marginBottom: "10px" }}>Kategori</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {CATEGORIES.map((c) => (
                <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                  style={{
                    padding: "12px 14px", borderRadius: "10px", textAlign: "left", cursor: "pointer",
                    border: `1px solid ${category === c.value ? "#0052ff" : "#434656"}`,
                    background: category === c.value ? "rgba(0,82,255,.12)" : "#1d2022",
                    transition: "all .15s",
                  }}>
                  <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 700, color: category === c.value ? "#b7c4ff" : "#e0e3e5" }}>{c.label}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#8d90a2" }}>{c.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#c3c5d9", marginBottom: "10px" }}>Öncelik</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {PRIORITIES.map((p) => (
                <button key={p.value} type="button" onClick={() => setPriority(p.value)}
                  style={{
                    padding: "8px 14px", borderRadius: "8px", cursor: "pointer",
                    border: `1px solid ${priority === p.value ? p.color : "#434656"}`,
                    background: priority === p.value ? `${p.color}22` : "transparent",
                    transition: "all .15s",
                  }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: priority === p.value ? p.color : "#8d90a2" }}>{p.label}</span>
                  <span style={{ fontSize: "11px", color: "#8d90a2", marginLeft: "6px" }}>{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#c3c5d9", marginBottom: "7px" }}>
              Konu <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="Sorununuzu kısaca özetleyin" required style={inp}
              onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
              onBlur={(e)  => (e.target.style.borderColor = "#434656")}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#c3c5d9", marginBottom: "7px" }}>
              Açıklama <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Sorununuzu ayrıntılı açıklayın. Hata mesajları, etkilenen cihaz/sistem, ne zaman başladığı gibi bilgileri ekleyin..."
              rows={6} required
              style={{ ...inp, resize: "vertical", lineHeight: 1.65 }}
              onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
              onBlur={(e)  => (e.target.style.borderColor = "#434656")}
            />
            <p style={{ textAlign: "right", fontSize: "12px", color: "#8d90a2", marginTop: "4px" }}>{desc.length}/5000</p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <Link href={`/${locale}/destek/panel`}
              style={{ padding: "12px 20px", border: "1px solid #434656", borderRadius: "9px", color: "#8d90a2", textDecoration: "none", fontSize: "14px" }}>
              İptal
            </Link>
            <button type="submit" disabled={loading}
              style={{
                flex: 1, padding: "12px",
                background: loading ? "#434656" : "#0052ff",
                color: "#fff", border: "none", borderRadius: "9px",
                fontSize: "15px", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font-family-headline)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}>
              {loading ? "Gönderiliyor..." : <><Send size={16} /> Talebi Gönder</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
