"use client";
import { useState } from "react";

const C = {
  bg: "#070d1c", card: "#0f1829", card2: "#162035", line: "#1e2d4a",
  text: "#e2e8f8", sub: "#8899bb", dim: "#4a5878",
  blue: "#4d8cf5", green: "#34d399", red: "#f87171", amber: "#fbbf24", cyan: "#22d3ee",
};

const QUICK = [
  "google.com", "youtube.com", "github.com", "cloudflare.com",
  "lidernetwork.com.tr", "instagram.com", "twitter.com",
];

const HTTP_CODES: Record<number, string> = {
  200: "OK — Normal", 201: "Created", 204: "No Content",
  301: "Moved Permanently (Yönlendirme)", 302: "Found (Geçici Yönlendirme)",
  304: "Not Modified (Önbellek)", 307: "Temporary Redirect", 308: "Permanent Redirect",
  400: "Bad Request", 401: "Unauthorized", 403: "Forbidden (Erişim Engeli)",
  404: "Not Found (Sayfa Bulunamadı)", 429: "Too Many Requests (Hız Limiti)",
  500: "Internal Server Error (Sunucu Hatası)", 502: "Bad Gateway",
  503: "Service Unavailable (Bakım/Aşırı Yük)", 504: "Gateway Timeout",
};

interface CheckResult {
  url: string; status: number | null; ms: number; up: boolean; label: string;
  checkedAt: string;
}

export default function UptimeClient() {
  const [input, setInput]       = useState("");
  const [result, setResult]     = useState<CheckResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [history, setHistory]   = useState<CheckResult[]>([]);

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
      else {
        const entry: CheckResult = { ...d, checkedAt: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) };
        setResult(entry);
        setHistory(prev => [entry, ...prev].slice(0, 8));
      }
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

  function SpeedBar({ ms }: { ms: number }) {
    const pct = Math.min((ms / 3000) * 100, 100);
    const col = ms < 500 ? C.green : ms < 2000 ? C.amber : C.red;
    return (
      <div style={{ marginTop: 6 }}>
        <div style={{ height: 4, background: C.line, borderRadius: 999, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 999, transition: "width .5s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontSize: 10, color: C.dim }}>Hızlı</span>
          <span style={{ fontSize: 10, color: C.dim }}>Yavaş</span>
        </div>
      </div>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: `radial-gradient(ellipse 1400px 700px at 50% -5%, #0d1d3d 0%, ${C.bg} 65%)`, color: C.text, fontFamily: "'Segoe UI', system-ui, Arial, sans-serif" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        input::placeholder{color:${C.dim}}
        input:focus{outline:none;border-color:${C.cyan}!important;box-shadow:0 0 0 3px rgba(34,211,238,.15)}
        a:hover{opacity:.8}
        .quick-btn:hover{background:rgba(34,211,238,.18)!important;border-color:${C.cyan}!important;color:${C.text}!important}
        .fade{animation:fadein .3s ease}
        button:hover{filter:brightness(1.1)}
        .hist-row:hover{background:rgba(255,255,255,.03)!important}
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", flexWrap: "wrap", gap: 12 }}>
          <a href="https://www.lidernetwork.com.tr" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <span style={{ background: "#fff", borderRadius: 11, padding: "6px 14px", display: "inline-flex", boxShadow: "0 4px 16px rgba(0,0,0,.4)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: 36 }} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", color: C.cyan, background: "rgba(34,211,238,.12)", border: "1px solid rgba(34,211,238,.3)", padding: "4px 12px", borderRadius: 20 }}>
              SİTE KONTROL
            </span>
          </a>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <a href="https://blacklist.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>Kara Liste ↗</a>
            <a href="https://ip.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>IP Sorgu ↗</a>
            <a href="https://ssl.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>SSL Kontrol ↗</a>
            <a href="https://www.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>lidernetwork.com.tr ↗</a>
          </div>
        </header>

        {/* Hero */}
        <section style={{ textAlign: "center", padding: "12px 0 32px" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>📡</div>
          <h1 style={{ margin: "0 0 10px", fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>Site Çalışıyor mu?</h1>
          <p style={{ margin: 0, color: C.sub, fontSize: 15, lineHeight: 1.6 }}>
            Herhangi bir web sitesinin erişilebilir olup olmadığını sunucudan kontrol edin.<br />
            HTTP durum kodu, yanıt süresi ve erişilebilirlik durumu anlık görüntülenir.
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
            style={{ padding: "15px 26px", borderRadius: 12, border: "none", background: loading ? C.card2 : `linear-gradient(135deg,#0e7490,${C.cyan})`, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", boxShadow: loading ? "none" : "0 8px 24px rgba(34,211,238,.3)", transition: "all .2s" }}>
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
              <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg,#0e7490,${C.cyan})`, borderRadius: 999, transition: "width .2s ease" }} />
            </div>
            <p style={{ fontSize: 13, color: C.sub, margin: 0, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ width: 13, height: 13, border: `2px solid ${C.line}`, borderTopColor: C.cyan, borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />
              Sunucuya bağlanılıyor, yanıt bekleniyor…
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
            <div style={{ background: result.up ? "rgba(52,211,153,.06)" : "rgba(248,113,113,.06)", border: `1px solid ${result.up ? "rgba(52,211,153,.3)" : "rgba(248,113,113,.3)"}`, borderRadius: 20, padding: "32px 28px", marginBottom: 14 }}>
              <div style={{ textAlign: "center", marginBottom: 22 }}>
                <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 16 }}>
                  {result.up ? (result.ms > 2000 ? "🐢" : "✅") : "🔴"}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: statusColor, marginBottom: 8 }}>
                  {result.label}
                </div>
                <div style={{ fontSize: 13, color: C.sub }}>
                  <span style={{ fontFamily: "monospace", color: C.text }}>{result.url}</span>
                  <span style={{ marginLeft: 8, fontSize: 11 }}>· {result.checkedAt}</span>
                </div>
              </div>

              {/* Metrik bandı */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
                <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: msColor, fontFamily: "monospace", lineHeight: 1 }}>{result.ms}</div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>ms Yanıt Süresi</div>
                  <SpeedBar ms={result.ms} />
                </div>
                {result.status && (
                  <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: result.status < 400 ? C.green : C.red, lineHeight: 1 }}>{result.status}</div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>HTTP Durum</div>
                    {HTTP_CODES[result.status] && (
                      <div style={{ fontSize: 10, color: C.sub, marginTop: 4, lineHeight: 1.4 }}>{HTTP_CODES[result.status]}</div>
                    )}
                  </div>
                )}
                <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: result.up ? C.green : C.red, lineHeight: 1 }}>
                    {result.up ? "Erişilebilir" : "Erişilemiyor"}
                  </div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>Durum</div>
                </div>
              </div>
            </div>

            {/* Yorum kutusu */}
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 20px", marginBottom: 16, fontSize: 13, color: C.sub, lineHeight: 1.7 }}>
              {result.up && result.ms < 500 && "✓ Site hızlı yanıt veriyor, her şey normal görünüyor."}
              {result.up && result.ms >= 500 && result.ms < 2000 && "⚡ Site çalışıyor ancak yanıt süresi biraz yüksek. Geçici yoğunluk veya ağ gecikmesi olabilir."}
              {result.up && result.ms >= 2000 && "🐢 Site erişilebilir fakat yavaş yanıt veriyor. Sunucu yoğun ya da içerik ağırlıklı olabilir."}
              {!result.up && result.label === "Zaman Aşımı" && "⏱ Sunucu 10 saniye içinde yanıt vermedi. Site kapalı veya çok yoğun olabilir. Biraz sonra tekrar deneyin."}
              {!result.up && result.label === "Erişilemiyor" && "🔴 Siteye ulaşılamıyor. Gerçekten kapalı olabilir ya da Cloudflare/CDN tarafında sorun yaşanıyor olabilir."}
              {" "}
              {result.up && result.ms < 500 && <span>Yanıt süresi {result.ms}ms, bu referans değerlerin ({`<`}500ms) altında.</span>}
            </div>

            {/* Aksiyon butonları */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
              <button onClick={() => check(null, result.url)}
                style={{ padding: "10px 22px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.card2, color: C.sub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ↻ Tekrar Kontrol Et
              </button>
              <a href={`https://ssl.lidernetwork.com.tr/?host=${new URL(result.url.startsWith("http") ? result.url : "https://" + result.url).hostname}`} target="_blank" rel="noopener noreferrer"
                style={{ padding: "10px 22px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.card2, color: C.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                🔒 SSL Sertifikasına Bak
              </a>
            </div>
          </div>
        )}

        {/* Kontrol Geçmişi */}
        {history.length > 1 && (
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "20px 22px", marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.sub, letterSpacing: ".06em", textTransform: "uppercase" }}>
                Bu Oturumda Kontrol Edilenler
              </h3>
              <button onClick={() => setHistory([])}
                style={{ fontSize: 11, color: C.dim, background: "transparent", border: "none", cursor: "pointer" }}>
                Temizle
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {history.map((h, i) => (
                <div key={i} className="hist-row" onClick={() => check(null, h.url)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, cursor: "pointer", transition: "background .1s" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: h.up ? C.green : C.red, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontFamily: "monospace", color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.url}</span>
                  <span style={{ fontSize: 12, color: h.ms < 500 ? C.green : h.ms < 2000 ? C.amber : C.red, fontFamily: "monospace", flexShrink: 0 }}>{h.ms}ms</span>
                  {h.status && <span style={{ fontSize: 11, color: h.status < 400 ? C.green : C.red, flexShrink: 0 }}>{h.status}</span>}
                  <span style={{ fontSize: 10, color: C.dim, flexShrink: 0 }}>{h.checkedAt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Landing info */}
        {!result && !loading && (
          <div className="fade">

            {/* Neden önemli */}
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "22px 24px", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: C.sub, letterSpacing: ".06em", textTransform: "uppercase" }}>
                Sadece Bende mi Açılmıyor?
              </h3>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: C.sub, lineHeight: 1.7 }}>
                Bu araç, Lider Network sunucularından doğrudan hedef siteye bağlanır. Yanıt alınamıyorsa site <strong style={{ color: C.text }}>gerçekten kapalı</strong> demektir — sadece sizin ağınızda değil, tüm internet üzerinden erişilemiyor.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
                {[
                  { icon: "✅", label: "Site çalışıyorsa", text: "Sorun sizin ağınızda ya da tarayıcınızda. DNS flush veya VPN deneyin." },
                  { icon: "🔴", label: "Site kapalıysa", text: "Sunucu/hosting sorunu veya DDoS saldırısı. Site sahiplerini uyarın." },
                  { icon: "⏱", label: "Zaman aşımı", text: "Site çok yavaş veya Cloudflare/CDN tarafında engel var." },
                ].map(c => (
                  <div key={c.label} style={{ background: C.card2, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{c.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>{c.label}</div>
                    <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.55 }}>{c.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
              {[
                { icon: "⚡", title: "Gerçek Sunucu İsteği", desc: "DNS veya önbellek kullanılmaz. Sunucuya gerçek bir HEAD isteği atılır." },
                { icon: "📊", title: "HTTP Durum Kodu", desc: "200, 301, 403, 503… Dönen HTTP kodu ve açıklaması gösterilir." },
                { icon: "⏱", title: "Yanıt Süresi", desc: "Milisaniye cinsinden gerçek yanıt süresi ve hız değerlendirmesi." },
                { icon: "📋", title: "Kontrol Geçmişi", desc: "Oturum boyunca yapılan sorgular listelenir, tekrar kontrol kolaylaşır." },
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
