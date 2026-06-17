"use client";
import { useState } from "react";

const C = {
  bg: "#070d1c", card: "#0f1829", card2: "#162035", line: "#1e2d4a",
  text: "#e2e8f8", sub: "#8899bb", dim: "#4a5878",
  blue: "#4d8cf5", green: "#34d399", red: "#f87171", amber: "#fbbf24",
};

const QUICK = [
  "google.com", "youtube.com", "github.com", "cloudflare.com",
  "lidernetwork.com.tr", "instagram.com", "twitter.com", "facebook.com",
];

interface Result {
  url: string; status: number | null; ms: number; up: boolean; label: string;
}

export default function UptimeClient() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function check(e: React.FormEvent | null, overrideUrl?: string) {
    if (e) e.preventDefault();
    const v = (overrideUrl ?? input).trim();
    if (!v) return;
    if (overrideUrl) setInput(overrideUrl);
    setLoading(true); setError(null); setResult(null); setProgress(0);

    const prog = setInterval(() => setProgress(p => Math.min(p + 5, 90)), 200);
    try {
      const r = await fetch(`/api/uptime?url=${encodeURIComponent(v)}`);
      const d = await r.json();
      if (!r.ok) setError(d.error || "Sorgu başarısız");
      else setResult(d);
    } catch { setError("Bağlantı hatası"); }
    finally { clearInterval(prog); setProgress(100); setLoading(false); }
  }

  const statusColor = result?.up
    ? result.ms > 2000 ? C.amber : C.green
    : C.red;

  const msColor = !result ? C.dim
    : result.ms < 500 ? C.green
    : result.ms < 2000 ? C.amber
    : C.red;

  return (
    <main style={{ minHeight: "100vh", background: `radial-gradient(ellipse 1400px 700px at 50% -5%, #0d1d3d 0%, ${C.bg} 65%)`, color: C.text, fontFamily: "'Segoe UI', system-ui, Arial, sans-serif" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        input::placeholder{color:${C.dim}}
        input:focus{outline:none;border-color:${C.blue}!important;box-shadow:0 0 0 3px rgba(77,140,245,.15)}
        a:hover{opacity:.8}
        .quick-btn:hover{background:rgba(77,140,245,.18)!important;border-color:${C.blue}!important;color:${C.text}!important}
        .fade{animation:fadein .3s ease}
      `}</style>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", flexWrap: "wrap", gap: 12 }}>
          <a href="https://www.lidernetwork.com.tr" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <span style={{ background: "#fff", borderRadius: 11, padding: "6px 14px", display: "inline-flex", boxShadow: "0 4px 16px rgba(0,0,0,.4)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: 36 }} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", color: C.green, background: "rgba(52,211,153,.12)", border: "1px solid rgba(52,211,153,.3)", padding: "4px 12px", borderRadius: 20 }}>
              SİTE KONTROL
            </span>
          </a>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <a href="https://blacklist.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>Kara Liste ↗</a>
            <a href="https://ip.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>IP Sorgu ↗</a>
            <a href="https://www.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>lidernetwork.com.tr ↗</a>
          </div>
        </header>

        {/* Hero */}
        <section style={{ textAlign: "center", padding: "12px 0 32px" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🌐</div>
          <h1 style={{ margin: "0 0 10px", fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>Site Çalışıyor mu?</h1>
          <p style={{ margin: 0, color: C.sub, fontSize: 15, lineHeight: 1.6 }}>
            Herhangi bir web sitesinin erişilebilir olup olmadığını anında kontrol edin.<br />
            Sadece sizde mi açılmıyor, yoksa gerçekten kapalı mı?
          </p>
        </section>

        {/* Search */}
        <form onSubmit={check} style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="google.com veya https://example.com"
            style={{ flex: 1, minWidth: 200, padding: "15px 18px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.text, fontSize: 15 }}
            autoComplete="off" spellCheck={false} autoFocus
          />
          <button type="submit" disabled={loading}
            style={{ padding: "15px 26px", borderRadius: 12, border: "none", background: loading ? C.card2 : `linear-gradient(135deg,#2c5ed4,${C.blue})`, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", boxShadow: loading ? "none" : "0 8px 24px rgba(77,140,245,.3)", transition: "all .2s" }}>
            {loading ? "Kontrol ediliyor…" : "Kontrol Et"}
          </button>
        </form>

        {/* Quick buttons */}
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
              <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg,#2c5ed4,${C.blue})`, borderRadius: 999, transition: "width .2s ease" }} />
            </div>
            <p style={{ fontSize: 13, color: C.sub, margin: 0, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ width: 13, height: 13, border: `2px solid ${C.line}`, borderTopColor: C.blue, borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />
              Sunucuya bağlanılıyor…
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
            {/* Ana sonuç kartı */}
            <div style={{ background: result.up ? "rgba(52,211,153,.06)" : "rgba(248,113,113,.06)", border: `1px solid ${result.up ? "rgba(52,211,153,.3)" : "rgba(248,113,113,.3)"}`, borderRadius: 20, padding: "32px 28px", marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 16 }}>
                {result.up ? (result.ms > 2000 ? "🐢" : "✅") : "🔴"}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: statusColor, marginBottom: 8 }}>
                {result.label}
              </div>
              <div style={{ fontSize: 14, color: C.sub, marginBottom: 20 }}>
                <span style={{ fontFamily: "monospace", color: C.text }}>{result.url}</span>
              </div>

              {/* Detay satırları */}
              <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: msColor }}>{result.ms}ms</div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Yanıt Süresi</div>
                </div>
                {result.status && (
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: result.status < 400 ? C.green : C.red }}>{result.status}</div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>HTTP Durum</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: result.up ? C.green : C.red }}>
                    {result.up ? "Erişilebilir" : "Erişilemiyor"}
                  </div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Durum</div>
                </div>
              </div>
            </div>

            {/* Yorum kutusu */}
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20, fontSize: 13, color: C.sub, lineHeight: 1.7 }}>
              {result.up && result.ms < 500 && "✓ Site hızlı yanıt veriyor, her şey normal görünüyor."}
              {result.up && result.ms >= 500 && result.ms < 2000 && "⚡ Site çalışıyor ancak yanıt süresi biraz yüksek. Geçici yoğunluk olabilir."}
              {result.up && result.ms >= 2000 && "🐢 Site erişilebilir fakat yavaş yanıt veriyor. Sunucu yoğun ya da ağ gecikmesi yüksek olabilir."}
              {!result.up && result.label === "Zaman Aşımı" && "⏱ Sunucu 10 saniye içinde yanıt vermedi. Site kapalı veya çok yoğun olabilir. Biraz sonra tekrar deneyin."}
              {!result.up && result.label === "Erişilemiyor" && "🔴 Siteye ulaşılamıyor. Site gerçekten kapalı olabilir veya IP engeliyle karşılaşılmış olabilir."}
            </div>

            {/* Yeniden kontrol */}
            <div style={{ textAlign: "center" }}>
              <button onClick={() => check(null, result.url)}
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
                { icon: "🔍", title: "Anlık Kontrol", desc: "Sunucuya gerçek bir istek atılır, DNS veya önbellek kullanılmaz." },
                { icon: "🌍", title: "Herkese Açık", desc: "Sadece sizde mi açılmıyor? Gerçekten kapalı mı? Hemen öğrenin." },
                { icon: "⚡", title: "Hızlı Sonuç", desc: "Yanıt süresi, HTTP durum kodu ve erişilebilirlik bilgisi tek seferde." },
                { icon: "🔒", title: "Kayıt Yok", desc: "Yaptığınız sorgular saklanmaz, log tutulmaz." },
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
