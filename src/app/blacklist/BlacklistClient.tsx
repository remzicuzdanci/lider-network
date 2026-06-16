"use client";
import { useState } from "react";

const C = {
  bg: "#0a0e27", card: "#141a3a", card2: "#1b2350", line: "#283166",
  text: "#e8ecff", sub: "#9aa6d6", dim: "#5a6896",
  blue: "#4f7cff", green: "#34d399", red: "#fb7185", amber: "#fbbf24",
};

const CAT_COLORS: Record<string, string> = {
  Spam: "#4f7cff", Exploit: "#fb7185", DUL: "#fbbf24", Policy: "#a78bfa",
};

type Filter = "all" | "listed" | "clean";

interface ListResult {
  zone: string; name: string; cat: string; desc: string;
  listed: boolean; response: string | null;
}
interface ApiResult {
  ip: string; query: string;
  listed: number; clean: number; errors: number; total: number;
  results: ListResult[];
}

export default function BlacklistClient() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [progress, setProgress] = useState(0);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    const v = input.trim();
    if (!v) return;
    setLoading(true); setError(null); setData(null); setFilter("all"); setProgress(0);

    // Animasyon — gerçek ilerlemeyi simüle et (30 DNS sorgusu ~8-15sn)
    const prog = setInterval(() => setProgress(p => Math.min(p + 2, 92)), 300);

    try {
      const url = new URL(window.location.href);
      url.searchParams.set("ip", v);
      window.history.pushState({}, "", url.toString());

      const r = await fetch(`/api/blacklist?ip=${encodeURIComponent(v)}`);
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Sorgu başarısız"); }
      else setData(d);
    } catch { setError("Bağlantı hatası"); }
    finally { clearInterval(prog); setProgress(100); setLoading(false); }
  }

  const filtered = data?.results.filter(r => {
    if (filter === "listed") return r.listed;
    if (filter === "clean") return !r.listed;
    return true;
  }) ?? [];

  const allClean  = data && data.listed === 0;
  const hasListed = data && data.listed > 0;

  return (
    <main style={{ minHeight: "100vh", background: `radial-gradient(1200px 600px at 50% -10%, #1a2150 0%, ${C.bg} 60%)`, color: C.text, fontFamily: "'Segoe UI', system-ui, Arial, sans-serif" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes progress{from{width:0}to{width:var(--w)}}
        input::placeholder{color:${C.dim}}
        input:focus{outline:none;border-color:${C.blue}!important;box-shadow:0 0 0 3px rgba(79,124,255,.15)}
        button:hover{filter:brightness(1.1)}
        a:hover{opacity:.8}
        .fade{animation:fadein .35s ease}
        .card-item:hover{border-color:rgba(79,124,255,.35)!important}
      `}</style>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", flexWrap: "wrap", gap: 12 }}>
          <a href="https://www.lidernetwork.com.tr" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <span style={{ background: "#fff", borderRadius: 13, padding: "8px 16px", display: "inline-flex", boxShadow: "0 6px 22px rgba(0,0,0,.35)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: 44 }} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", color: C.red, background: "rgba(251,113,133,.12)", border: "1px solid rgba(251,113,133,.3)", padding: "4px 12px", borderRadius: 20 }}>
              KARA LİSTE SORGU
            </span>
          </a>
          <div style={{ display: "flex", gap: 20 }}>
            <a href="https://ip.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>IP Sorgu ↗</a>
            <a href="https://dns.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>DNS Checker ↗</a>
            <a href="https://www.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>lidernetwork.com.tr ↗</a>
          </div>
        </header>

        {/* Hero */}
        <section style={{ textAlign: "center", padding: "16px 0 24px" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>IP Kara Liste Sorgulama</h1>
          <p style={{ margin: 0, color: C.sub, fontSize: 15 }}>
            {`${30} DNSBL / RBL listesinde itibar kontrolü — Spamhaus, SpamCop, Barracuda ve daha fazlası.`}
          </p>
        </section>

        {/* Search */}
        <form onSubmit={check} style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="IP adresi veya domain — ör. 1.2.3.4 veya mail.example.com"
            style={{ flex: 1, minWidth: 220, padding: "15px 18px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.text, fontSize: 15 }}
            autoComplete="off" spellCheck={false}
          />
          <button type="submit" disabled={loading}
            style={{ padding: "15px 28px", borderRadius: 12, border: "none", background: loading ? C.card2 : `linear-gradient(135deg,#3a63ff,${C.blue})`, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", boxShadow: loading ? "none" : "0 8px 24px rgba(79,124,255,.35)", transition: "all .2s" }}>
            {loading ? "Sorgulanıyor…" : "Sorgula"}
          </button>
        </form>

        {/* Progress */}
        {loading && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: C.sub, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 14, height: 14, border: `2px solid ${C.line}`, borderTopColor: C.blue, borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />
                30 liste eş zamanlı sorgulanıyor…
              </span>
              <span style={{ fontSize: 13, color: C.dim }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: C.card, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg,#3a63ff,${C.blue})`, borderRadius: 999, transition: "width .3s ease" }} />
            </div>
            <p style={{ fontSize: 12, color: C.dim, margin: "8px 0 0", textAlign: "center" }}>
              DNS sorguları ağ koşullarına göre 5–15 saniye sürebilir.
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ background: "rgba(251,113,133,.08)", border: "1px solid rgba(251,113,133,.25)", borderRadius: 14, padding: "18px 22px", color: C.red, fontSize: 14, marginBottom: 20 }}>
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div className="fade">
            {/* Özet */}
            <div style={{ background: allClean ? "rgba(52,211,153,.07)" : "rgba(251,113,133,.07)", border: `1px solid ${allClean ? "rgba(52,211,153,.3)" : "rgba(251,113,133,.3)"}`, borderRadius: 18, padding: "24px 28px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ fontSize: 44, lineHeight: 1 }}>{allClean ? "✅" : "🚨"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: allClean ? C.green : C.red, marginBottom: 4 }}>
                    {allClean
                      ? `${data.total} listede temiz — itibarınız sağlam`
                      : `${data.listed} listede listelendi`}
                  </div>
                  <div style={{ fontSize: 14, color: C.sub }}>
                    Sorgulanan IP: <span style={{ color: C.text, fontFamily: "monospace", fontWeight: 600 }}>{data.ip}</span>
                    {data.query !== data.ip && <span style={{ color: C.dim }}> ({data.query})</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {[
                    { label: "Listelendi", val: data.listed, color: C.red },
                    { label: "Temiz", val: data.clean, color: C.green },
                    { label: "Zaman Aşımı", val: data.errors, color: C.dim },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* İlerleme çubuğu */}
              <div style={{ marginTop: 16, height: 6, background: C.card, borderRadius: 999, overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${(data.listed / data.total) * 100}%`, background: C.red, transition: "width .5s" }} />
                <div style={{ width: `${(data.clean / data.total) * 100}%`, background: C.green, transition: "width .5s" }} />
              </div>

              {hasListed && (
                <p style={{ margin: "12px 0 0", fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
                  ⚠ Listelenen IP'ler mail teslim sorunlarına yol açabilir.{" "}
                  <a href="https://www.spamhaus.org/removal/" target="_blank" rel="noopener noreferrer" style={{ color: C.blue }}>Spamhaus listeden çıkarma →</a>
                </p>
              )}
            </div>

            {/* Filtre */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {([["all", "Tümü"], ["listed", "Listelendi"], ["clean", "Temiz"]] as [Filter, string][]).map(([f, label]) => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding: "8px 18px", borderRadius: 10, border: `1px solid ${filter === f ? C.blue : C.line}`, background: filter === f ? "rgba(79,124,255,.15)" : C.card, color: filter === f ? C.text : C.sub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {label}
                  <span style={{ marginLeft: 6, fontSize: 12, color: filter === f ? C.blue : C.dim }}>
                    {f === "all" ? data.total : f === "listed" ? data.listed : data.clean}
                  </span>
                </button>
              ))}
            </div>

            {/* Liste grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 10 }}>
              {filtered.map(r => (
                <div key={r.zone} className="card-item"
                  style={{ background: C.card, border: `1px solid ${r.listed ? "rgba(251,113,133,.3)" : C.line}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12, transition: "border-color .15s" }}>
                  {/* Status dot */}
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.listed ? C.red : r.response === "timeout" ? C.dim : C.green, flexShrink: 0, marginTop: 3, boxShadow: r.listed ? `0 0 0 3px rgba(251,113,133,.2)` : "none" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{r.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: `${CAT_COLORS[r.cat] || C.blue}18`, color: CAT_COLORS[r.cat] || C.blue, border: `1px solid ${CAT_COLORS[r.cat] || C.blue}40`, flexShrink: 0 }}>
                        {r.cat}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: C.dim, marginBottom: r.listed ? 4 : 0 }}>{r.desc}</div>
                    {r.listed && r.response && (
                      <div style={{ fontSize: 11, fontFamily: "monospace", color: C.red, background: "rgba(251,113,133,.08)", padding: "2px 7px", borderRadius: 5, display: "inline-block" }}>
                        {r.response}
                      </div>
                    )}
                    {r.response === "timeout" && (
                      <div style={{ fontSize: 11, color: C.dim }}>Zaman aşımı</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p style={{ textAlign: "center", fontSize: 12, color: C.dim, marginTop: 36, lineHeight: 1.7 }}>
              Sonuçlar DNS sorgusuna dayanır; gerçek zamanlı veri sağlanır. Zaman aşımı ayrı bir kara listeyi değil ağ gecikmesini ifade eder.<br />
              <a href="https://ip.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>IP Sorgu</a>
              {" · "}
              <a href="https://dns.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>DNS Checker</a>
              {" · "}
              <a href="https://www.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>Lider Network</a>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
