"use client";
import { useState } from "react";

const C = {
  bg: "#070d1c", card: "#0f1829", card2: "#162035", line: "#1e2d4a",
  text: "#e2e8f8", sub: "#8899bb", dim: "#4a5878",
  blue: "#4d8cf5", green: "#34d399", red: "#f87171", amber: "#fbbf24", purple: "#a78bfa",
};

const QUICK = ["google.com", "github.com", "cloudflare.com", "lidernetwork.com.tr", "microsoft.com", "apple.com"];

interface SSLResult {
  host: string; valid: boolean; daysLeft: number;
  validFrom: string; validTo: string;
  subject: string; issuer: string; sans: string[];
  protocol: string; selfSigned: boolean;
}

export default function SSLClient() {
  const [input, setInput]     = useState("");
  const [result, setResult]   = useState<SSLResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function check(e: React.FormEvent | null, override?: string) {
    if (e) e.preventDefault();
    const v = (override ?? input).trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    if (!v) return;
    if (override) setInput(override);
    setLoading(true); setError(null); setResult(null); setProgress(0);
    const prog = setInterval(() => setProgress(p => Math.min(p + 6, 88)), 220);
    try {
      const r = await fetch(`/api/ssl?host=${encodeURIComponent(v)}`);
      const d = await r.json();
      if (!r.ok) setError(d.error || "Sorgu başarısız");
      else setResult(d);
    } catch { setError("Bağlantı hatası"); }
    finally { clearInterval(prog); setProgress(100); setLoading(false); }
  }

  const statusColor = !result ? C.dim : result.valid
    ? (result.daysLeft > 30 ? C.green : result.daysLeft > 7 ? C.amber : C.red)
    : C.red;

  const statusLabel = !result ? "" : !result.valid ? "Geçersiz / Süresi Dolmuş"
    : result.daysLeft > 30 ? "Geçerli" : result.daysLeft > 7 ? "Yakında Sona Eriyor" : "Kritik — Acil Yenile";

  const statusEmoji = !result ? "" : !result.valid ? "🔴" : result.daysLeft > 30 ? "✅" : result.daysLeft > 7 ? "⚠️" : "🚨";

  return (
    <main style={{ minHeight: "100vh", background: `radial-gradient(ellipse 1400px 700px at 50% -5%, #0d1d3d 0%, ${C.bg} 65%)`, color: C.text, fontFamily: "'Segoe UI', system-ui, Arial, sans-serif" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        input::placeholder{color:${C.dim}}
        input:focus{outline:none;border-color:${C.purple}!important;box-shadow:0 0 0 3px rgba(167,139,250,.15)}
        .quick-btn:hover{background:rgba(167,139,250,.18)!important;border-color:${C.purple}!important;color:${C.text}!important}
        .fade{animation:fadein .3s ease}
        a:hover{opacity:.8}
      `}</style>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", flexWrap: "wrap", gap: 12 }}>
          <a href="https://www.lidernetwork.com.tr" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <span style={{ background: "#fff", borderRadius: 11, padding: "6px 14px", display: "inline-flex", boxShadow: "0 4px 16px rgba(0,0,0,.4)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: 36 }} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", color: C.purple, background: "rgba(167,139,250,.12)", border: "1px solid rgba(167,139,250,.3)", padding: "4px 12px", borderRadius: 20 }}>
              SSL KONTROL
            </span>
          </a>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <a href="https://dns.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>DNS Checker ↗</a>
            <a href="https://blacklist.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>Kara Liste ↗</a>
          </div>
        </header>

        {/* Hero */}
        <section style={{ textAlign: "center", padding: "12px 0 32px" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🔒</div>
          <h1 style={{ margin: "0 0 10px", fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>SSL Sertifika Kontrolü</h1>
          <p style={{ margin: 0, color: C.sub, fontSize: 15, lineHeight: 1.6 }}>
            Herhangi bir alan adının SSL sertifikasını anında kontrol edin.<br />
            Geçerlilik, bitiş tarihi, yayıncı ve kapsanan alan adları.
          </p>
        </section>

        {/* Form */}
        <form onSubmit={check} style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="example.com veya https://example.com"
            style={{ flex: 1, minWidth: 200, padding: "15px 18px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.text, fontSize: 15 }}
            autoComplete="off" spellCheck={false} autoFocus
          />
          <button type="submit" disabled={loading}
            style={{ padding: "15px 26px", borderRadius: 12, border: "none", background: loading ? C.card2 : "linear-gradient(135deg,#6d28d9,#a78bfa)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", boxShadow: loading ? "none" : "0 8px 24px rgba(167,139,250,.3)", transition: "all .2s" }}>
            {loading ? "Kontrol ediliyor…" : "Kontrol Et"}
          </button>
        </form>

        {/* Quick */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: C.dim }}>Hızlı:</span>
          {QUICK.map(u => (
            <button key={u} className="quick-btn" onClick={() => check(null, u)}
              style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.sub, fontSize: 12, cursor: "pointer", fontFamily: "monospace", transition: "all .15s" }}>
              {u}
            </button>
          ))}
        </div>

        {/* Progress */}
        {loading && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ height: 5, background: C.card, borderRadius: 999, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#6d28d9,#a78bfa)", borderRadius: 999, transition: "width .22s ease" }} />
            </div>
            <p style={{ fontSize: 13, color: C.sub, margin: 0, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ width: 13, height: 13, border: `2px solid ${C.line}`, borderTopColor: C.purple, borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />
              TLS el sıkışması yapılıyor…
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.25)", borderRadius: 14, padding: "16px 20px", color: C.red, fontSize: 14, marginBottom: 20 }}>
            ⚠ {error}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="fade">
            {/* Ana kart */}
            <div style={{ background: result.valid ? "rgba(52,211,153,.06)" : "rgba(248,113,113,.06)", border: `1px solid ${result.valid ? "rgba(52,211,153,.3)" : "rgba(248,113,113,.3)"}`, borderRadius: 20, padding: "28px 28px 24px", marginBottom: 14, textAlign: "center" }}>
              <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 14 }}>{statusEmoji}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: statusColor, marginBottom: 6 }}>{statusLabel}</div>
              <div style={{ fontSize: 13, color: C.sub, fontFamily: "monospace" }}>{result.host}</div>

              {/* Sayı bandı */}
              <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap", marginTop: 22 }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: statusColor, lineHeight: 1 }}>{result.daysLeft < 0 ? "—" : result.daysLeft}</div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>Gün Kaldı</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1 }}>{result.protocol}</div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>Protokol</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: result.selfSigned ? C.amber : C.green, lineHeight: 1 }}>{result.selfSigned ? "Self-Signed" : "CA İmzalı"}</div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>Tür</div>
                </div>
              </div>
            </div>

            {/* Detay kartlar */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              {[
                { label: "Konu (CN)", val: result.subject },
                { label: "Yayıncı (CA)", val: result.issuer },
                { label: "Geçerlilik Başlangıcı", val: new Date(result.validFrom).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }) },
                { label: "Bitiş Tarihi", val: new Date(result.validTo).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }) },
              ].map(row => (
                <div key={row.label} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 16px" }}>
                  <div style={{ fontSize: 10, color: C.dim, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>{row.label}</div>
                  <div style={{ fontSize: 12, color: C.text, fontFamily: "monospace", wordBreak: "break-all" }}>{row.val}</div>
                </div>
              ))}
            </div>

            {/* SANs */}
            {result.sans.length > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: C.dim, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Kapsanan Alan Adları (SAN) — {result.sans.length} adet</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {result.sans.map(s => (
                    <span key={s} style={{ fontSize: 11, fontFamily: "monospace", padding: "3px 10px", borderRadius: 6, background: "rgba(167,139,250,.1)", border: "1px solid rgba(167,139,250,.2)", color: C.purple }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Yeniden kontrol */}
            <div style={{ textAlign: "center" }}>
              <button onClick={() => check(null, result.host)}
                style={{ padding: "10px 24px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.card2, color: C.sub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ↻ Tekrar Kontrol Et
              </button>
            </div>
          </div>
        )}

        {/* Landing info */}
        {!result && !loading && (
          <div className="fade">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
              {[
                { icon: "🔒", title: "Sertifika Geçerliliği", desc: "Sertifikanın aktif, süresi dolmamış ve doğru imzalı olup olmadığını kontrol eder." },
                { icon: "📅", title: "Bitiş Tarihi", desc: "Kaç gün kaldığını görün, kritik eşiğe yaklaşınca renk değişir." },
                { icon: "🏢", title: "Yayıncı (CA)", desc: "Sertifikayı hangi Sertifika Otoritesinin imzaladığını ve self-signed olup olmadığını gösterir." },
                { icon: "🌐", title: "SAN Listesi", desc: "Sertifikanın kapsadığı tüm alan adlarını ve wildcard girişleri listeler." },
              ].map(t => (
                <div key={t.title} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px" }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{t.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
