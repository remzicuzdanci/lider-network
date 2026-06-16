"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const C = {
  bg: "#050917", card: "#0a1228", card2: "#0f1a38", line: "#162044",
  text: "#e0e8ff", sub: "#6b7eb5", dim: "#2e3f6e",
  blue: "#4f7cff", green: "#10d98a", red: "#ff4f6d", amber: "#fbbf24",
  teal: "#00d4ff", purple: "#b06aff", orange: "#ff8c42",
};

const FEEDS = [
  { key: "domain", label: "Domain",  icon: "🌐", color: C.blue,   desc: "Zararlı alan adları",    src: "USOM" },
  { key: "ipv4",   label: "IPv4",    icon: "🖥",  color: C.teal,   desc: "Zararlı IP adresleri",   src: "USOM · Feodo · CINS" },
  { key: "url",    label: "URL",     icon: "🔗",  color: C.purple, desc: "Zararlı URL'ler",        src: "USOM · URLhaus" },
  { key: "ipv6",   label: "IPv6",    icon: "⬡",   color: C.amber,  desc: "Zararlı IPv6 adresleri", src: "USOM" },
];

const LITE_WINDOWS = [
  { label: "90 Gün",  days: 90,  key: "90d"  },
  { label: "180 Gün", days: 180, key: "180d" },
  { label: "365 Gün", days: 365, key: "365d" },
];

type FeedStat = { count: number; size_bytes: number; updated_at: string | null; partial: boolean };
interface Stats { stats: Record<string, FeedStat>; total: number; last_updated: string | null; is_partial: boolean }
interface CheckResult { query: string; found: boolean; found_in: string[]; results: Record<string, boolean>; checked: string[] }

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const start = prev.current;
    const diff  = target - start;
    const t0    = performance.now();
    let raf: number;
    function step(now: number) {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(start + diff * ease));
      if (p < 1) raf = requestAnimationFrame(step);
      else prev.current = target;
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function relTime(iso: string | null): string {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "Az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} saat önce` : `${Math.floor(h / 24)} gün önce`;
}

function absTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function useCountdown(lastUpdated: string | null) {
  const [display, setDisplay] = useState(""); const [pct, setPct] = useState(0);
  useEffect(() => {
    function tick() {
      if (!lastUpdated) { setDisplay("—"); setPct(0); return; }
      const rem = new Date(lastUpdated).getTime() + 3_600_000 - Date.now();
      if (rem <= 0) { setDisplay("Güncelleniyor…"); setPct(100); return; }
      const min = Math.floor(rem / 60000), sec = Math.floor((rem % 60000) / 1000);
      setDisplay(`${min}:${sec.toString().padStart(2, "0")}`);
      setPct(Math.round(((3_600_000 - rem) / 3_600_000) * 100));
    }
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [lastUpdated]);
  return { display, pct };
}

function StatCard({ feed, stat }: { feed: typeof FEEDS[0]; stat?: FeedStat }) {
  const count = useCountUp(stat?.count ?? 0);
  const hasData = (stat?.count ?? 0) > 0;
  return (
    <div style={{
      background: `linear-gradient(145deg, ${C.card} 0%, ${C.card2} 100%)`,
      border: `1px solid ${hasData ? feed.color + "30" : C.line}`,
      borderRadius: 16, padding: "20px 20px 16px",
      boxShadow: hasData ? `0 0 24px ${feed.color}12` : "none",
      transition: "all .25s",
      position: "relative", overflow: "hidden",
    }}>
      {hasData && (
        <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${feed.color}18 0%, transparent 70%)` }} />
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>{feed.icon}</span>
        <span style={{ fontSize: 9, color: hasData ? feed.color : C.dim, background: hasData ? `${feed.color}15` : `${C.dim}20`, border: `1px solid ${hasData ? feed.color + "30" : C.dim + "40"}`, padding: "2px 7px", borderRadius: 99, fontWeight: 700, letterSpacing: ".04em" }}>{feed.src}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: hasData ? feed.color : C.dim, fontVariantNumeric: "tabular-nums", lineHeight: 1, letterSpacing: -1 }}>
        {hasData ? count.toLocaleString("tr-TR") : <span style={{ fontSize: 20, animation: stat ? "none" : "shimmer 2s infinite" }}>—</span>}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: C.sub, marginTop: 6 }}>{feed.label}</div>
      <div style={{ fontSize: 11, color: C.dim, marginTop: 2, marginBottom: 12 }}>{feed.desc}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
        <div style={{ width: "100%", height: 2, background: C.card, borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${hasData ? 100 : 0}%`, background: `linear-gradient(90deg,${feed.color},${feed.color}88)`, transition: "width 1.2s ease", borderRadius: 99 }} />
        </div>
        {(stat?.partial) && <span style={{ fontSize: 9, color: C.amber, fontWeight: 700, marginLeft: 8, whiteSpace: "nowrap" }}>KISMİ</span>}
        {hasData && !stat?.partial && <span style={{ fontSize: 9, color: C.green, fontWeight: 700, marginLeft: 8, whiteSpace: "nowrap" }}>✓ TAM</span>}
        {!hasData && stat && <span style={{ fontSize: 9, color: C.dim, fontWeight: 600, marginLeft: 8, whiteSpace: "nowrap" }}>BEKLENIYOR</span>}
      </div>
    </div>
  );
}

function ThreatCheck({ origin }: { origin: string }) {
  const [query, setQuery]   = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function doCheck(q?: string) {
    const val = (q ?? query).trim();
    if (!val) return;
    setLoading(true); setResult(null);
    try {
      const r = await fetch(`${origin}/api/threat/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: val }),
      });
      setResult(await r.json());
    } catch { setResult(null); }
    setLoading(false);
  }

  const EXAMPLES = ["185.220.101.1", "malware.example.com", "https://phishing.site/login"];

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        background: `linear-gradient(135deg, ${C.card} 0%, #0c1535 100%)`,
        border: `1px solid ${C.line}`, borderRadius: 20,
        padding: "24px 24px 20px",
        boxShadow: "0 8px 40px rgba(0,0,0,.4)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(79,124,255,.15)", border: "1px solid rgba(79,124,255,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔍</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Tehdit Sorgulama</div>
            <div style={{ fontSize: 11, color: C.sub }}>IP adresi, domain veya URL'nin zararlı listede olup olmadığını anında kontrol edin</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); if (result) setResult(null); }}
            onKeyDown={e => e.key === "Enter" && doCheck()}
            placeholder="185.220.101.1 · kötü-domain.com · https://phishing.site/..."
            style={{
              flex: 1, padding: "13px 18px", borderRadius: 12,
              background: C.bg, border: `1.5px solid ${C.line}`,
              color: C.text, fontSize: 13, fontFamily: "'Cascadia Code',monospace,sans-serif",
              outline: "none", transition: "border-color .15s",
            }}
            onFocus={e => { e.target.style.borderColor = C.blue; }}
            onBlur={e => { e.target.style.borderColor = C.line; }}
          />
          <button onClick={() => doCheck()}
            disabled={loading || !query.trim()}
            style={{
              padding: "13px 22px", borderRadius: 12, border: "none",
              background: loading ? C.card2 : `linear-gradient(135deg,${C.blue},#3a5fd4)`,
              color: loading ? C.sub : "#fff", fontSize: 13, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap",
              boxShadow: loading ? "none" : "0 4px 16px rgba(79,124,255,.35)",
              transition: "all .15s",
            }}>
            {loading ? "⏳ Sorgulanıyor…" : "Sorgula →"}
          </button>
        </div>

        {/* Örnek sorgular */}
        {!result && !loading && (
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: C.dim, alignSelf: "center" }}>Örnek:</span>
            {EXAMPLES.map(ex => (
              <button key={ex} onClick={() => { setQuery(ex); doCheck(ex); }}
                style={{ fontSize: 10, color: C.sub, background: `${C.dim}20`, border: `1px solid ${C.line}`, padding: "3px 9px", borderRadius: 99, cursor: "pointer", fontFamily: "monospace" }}>
                {ex}
              </button>
            ))}
          </div>
        )}

        {/* Sonuç */}
        {result && (
          <div style={{
            marginTop: 14, padding: "14px 18px", borderRadius: 12,
            background: result.found ? "rgba(255,79,109,.07)" : "rgba(16,217,138,.07)",
            border: `1px solid ${result.found ? C.red + "40" : C.green + "40"}`,
            animation: "fadein .25s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: result.found ? 10 : 0 }}>
              <span style={{ fontSize: 22 }}>{result.found ? "⚠️" : "✅"}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: result.found ? C.red : C.green }}>
                  {result.found ? "Zararlı Listede Bulundu!" : "Listede Bulunamadı"}
                </div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 2, fontFamily: "monospace" }}>
                  {result.query}
                </div>
              </div>
            </div>
            {result.found && result.found_in.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {result.found_in.map(f => (
                  <span key={f} style={{ fontSize: 10, fontWeight: 700, color: C.red, background: "rgba(255,79,109,.12)", border: "1px solid rgba(255,79,109,.3)", padding: "3px 10px", borderRadius: 99, letterSpacing: ".04em" }}>
                    {f.toUpperCase()} feed
                  </span>
                ))}
              </div>
            )}
            {!result.found && (
              <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>
                Kontrol edilen: {result.checked.join(", ")} feed · {new Date().toLocaleTimeString("tr-TR")}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ThreatClient() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [guide, setGuide]   = useState(false);
  const [activeTab, setActiveTab] = useState<"full" | "lite">("full");
  const [origin, setOrigin] = useState("https://threat.lidernetwork.com.tr");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (typeof window !== "undefined") setOrigin(window.location.origin); }, []);

  const load = useCallback(async () => {
    try { const r = await fetch("/api/threat/stats"); if (r.ok) setStats(await r.json()); } catch {}
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30_000); return () => clearInterval(t); }, [load]);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(null), 2000);
    });
  }

  const totalCount = useCountUp(stats?.total ?? 0);
  const isLive = stats?.last_updated ? Date.now() - new Date(stats.last_updated).getTime() < 7_200_000 : false;
  const { display: countdown, pct: countdownPct } = useCountdown(stats?.last_updated ?? null);

  return (
    <main style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Segoe UI', system-ui, Arial, sans-serif", position: "relative", overflow: "hidden" }}>
      {/* Animated background glows */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "20%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,124,255,.07) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "30%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,.05) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(176,106,255,.04) 0%, transparent 70%)" }} />
      </div>

      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes shimmer{0%,100%{opacity:.3}50%{opacity:.7}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fade{animation:fadein .3s ease}
        .card-hover:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.5)!important}
        .row-hover:hover{border-color:rgba(79,124,255,.35)!important;background:#0f1a38!important}
        .copy-btn:hover{background:rgba(79,124,255,.12)!important}
        .tab-btn{transition:all .18s;cursor:pointer;border:none}
        code{font-family:'Cascadia Code','Fira Code',monospace}
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px 80px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 0 18px", flexWrap: "wrap", gap: 12, borderBottom: `1px solid ${C.line}` }}>
          <a href="https://www.lidernetwork.com.tr" style={{ display: "inline-flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
            <span style={{ background: "#fff", borderRadius: 12, padding: "7px 14px", display: "inline-flex", boxShadow: "0 4px 20px rgba(0,0,0,.5)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: 36 }} />
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Lider Network</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>Tehdit İstihbaratı Servisi</div>
            </div>
          </a>
          <nav style={{ display: "flex", gap: 6 }}>
            {[["Kara Liste", "https://blacklist.lidernetwork.com.tr"], ["IP Sorgu", "https://ip.lidernetwork.com.tr"], ["DNS", "https://dns.lidernetwork.com.tr"]].map(([label, href]) => (
              <a key={href} href={href} style={{ color: C.sub, fontSize: 12, textDecoration: "none", padding: "7px 14px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, transition: "all .15s" }}>{label} ↗</a>
            ))}
          </nav>
        </header>

        {/* Status bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 0", borderBottom: `1px solid ${C.line}`, flexWrap: "wrap", fontSize: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isLive ? C.green : C.amber, animation: "pulse 2s ease-in-out infinite", display: "inline-block" }} />
            <span style={{ fontWeight: 800, letterSpacing: ".07em", fontSize: 11, color: isLive ? C.green : C.amber }}>
              {isLive ? "CANLI" : stats ? "BEKLENIYOR" : "BAĞLANIYOR"}
            </span>
          </div>
          <span style={{ color: C.line }}>|</span>
          <span style={{ color: C.sub }}>Son güncelleme: <strong style={{ color: C.text }}>{relTime(stats?.last_updated ?? null)}</strong>
            {stats?.last_updated && <span style={{ color: C.dim }}> ({absTime(stats.last_updated)})</span>}
          </span>
          <span style={{ color: C.line }}>|</span>
          <span style={{ color: C.sub }}>Sonraki: <span style={{ color: C.teal, fontWeight: 700, fontFamily: "monospace" }}>{countdown}</span></span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 72, height: 2, background: C.card, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${countdownPct}%`, background: `linear-gradient(90deg,${C.blue},${C.teal})`, transition: "width 1s linear" }} />
            </div>
            <span style={{ fontSize: 10, color: C.dim }}>{countdownPct}%</span>
          </div>
        </div>

        {/* Hero */}
        <section style={{ padding: "32px 0 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div>
              <h1 style={{ margin: "0 0 10px", fontSize: 34, fontWeight: 900, letterSpacing: -1, lineHeight: 1.15 }}>
                SGB / USOM Zararlı<br />Bağlantı Feed&apos;i
              </h1>
              <p style={{ margin: "0 0 18px", color: C.sub, fontSize: 14, maxWidth: 520, lineHeight: 1.75 }}>
                Siber Güvenlik Başkanlığı tehdit listelerini <span style={{ color: C.teal, fontWeight: 700 }}>FortiGate External Connector</span> uyumlu TXT formatında sunar. Her 2 saatte bir otomatik güncelleme, sıfır kurulum.
              </p>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {[["USOM / SGB", C.blue], ["URLhaus", C.purple], ["Feodo Tracker", C.teal], ["CINS Score", C.orange], ["Her 2 Saat", C.green], ["FortiOS 6.4+", C.amber]].map(([l, c]) => (
                  <span key={l} style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".05em", color: c, background: `${c}12`, border: `1px solid ${c}30`, padding: "3px 10px", borderRadius: 99 }}>{l}</span>
                ))}
              </div>
            </div>

            {/* Toplam kart */}
            <div style={{
              background: `linear-gradient(135deg, #0f1f50 0%, #0c1840 100%)`,
              border: `1px solid rgba(79,124,255,.3)`, borderRadius: 20,
              padding: "22px 28px", textAlign: "center", minWidth: 180,
              boxShadow: "0 0 40px rgba(79,124,255,.12)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: C.sub, marginBottom: 8 }}>TOPLAM TEHDİT</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: -2, fontVariantNumeric: "tabular-nums" }}>
                {stats ? totalCount.toLocaleString("tr-TR") : <span style={{ color: C.dim, fontSize: 28 }}>—</span>}
              </div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 6 }}>kayıt</div>
              <div style={{ marginTop: 12, fontSize: 10, color: C.blue, fontWeight: 700, letterSpacing: ".05em" }}>SGB · URLhaus · Feodo · CINS</div>
            </div>
          </div>
        </section>

        {/* Tehdit Sorgulama */}
        <ThreatCheck origin={origin} />

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 28 }}>
          {FEEDS.map(f => <StatCard key={f.key} feed={f} stat={stats?.stats?.[f.key]} />)}
        </div>

        {/* Feed URL'leri */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text }}>External Connector Feed URL&apos;leri</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", background: C.card2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 3 }}>
                {(["full", "lite"] as const).map(tab => (
                  <button key={tab} className="tab-btn" onClick={() => setActiveTab(tab)}
                    style={{ padding: "6px 16px", borderRadius: 7, fontSize: 11, fontWeight: 800, letterSpacing: ".05em", background: activeTab === tab ? C.blue : "transparent", color: activeTab === tab ? "#fff" : C.sub, boxShadow: activeTab === tab ? "0 2px 8px rgba(79,124,255,.35)" : "none" }}>
                    {tab === "full" ? "TAM" : "LİTE"}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 11, color: C.dim }}>FortiOS 6.4+ · text/plain</span>
            </div>
          </div>

          {activeTab === "full" && (
            <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {FEEDS.map(f => {
                const url = `${origin}/feeds/${f.key}.txt`;
                const count = stats?.stats?.[f.key]?.count ?? 0;
                const ck = `feed-${f.key}`;
                return (
                  <div key={f.key} className="row-hover" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "13px 18px", display: "flex", alignItems: "center", gap: 12, transition: "all .18s" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `${f.color}15`, border: `1px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{f.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 800 }}>{f.label}</span>
                        {count > 0 && <span style={{ fontSize: 10, color: f.color, background: `${f.color}12`, border: `1px solid ${f.color}28`, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>{count.toLocaleString("tr-TR")} kayıt</span>}
                        <span style={{ fontSize: 9, color: C.dim, background: `${C.dim}20`, padding: "1px 6px", borderRadius: 99 }}>{f.src}</span>
                      </div>
                      <code style={{ fontSize: 11, color: C.sub, wordBreak: "break-all" }}>{url}</code>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button className="copy-btn" onClick={() => copy(url, ck)}
                        style={{ padding: "8px 14px", borderRadius: 9, border: `1px solid ${C.line}`, background: copied === ck ? "rgba(16,217,138,.12)" : "transparent", color: copied === ck ? C.green : C.sub, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}>
                        {copied === ck ? "✓ Kopyalandı" : "📋 Kopyala"}
                      </button>
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 12px", borderRadius: 9, border: `1px solid ${C.line}`, color: C.sub, fontSize: 11, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>Aç ↗</a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "lite" && (
            <div className="fade">
              <div style={{ padding: "13px 18px", background: "rgba(79,124,255,.06)", border: `1px solid rgba(79,124,255,.2)`, borderRadius: 12, marginBottom: 12, fontSize: 12, color: C.sub, lineHeight: 1.7 }}>
                <strong style={{ color: C.text }}>Lite Feed</strong> — Düşük hafızalı cihazlar (FortiGate 60F/80F) için son 90/180/365 gün içinde eklenen kayıtları sunar. Tam listeye göre çok daha küçük boyutlu, etkisi aynı.
              </div>
              {FEEDS.filter(f => f.key === "domain" || f.key === "ipv4").map(f =>
                LITE_WINDOWS.map(w => {
                  const url = `${origin}/feeds/${f.key}-${w.key}.txt`;
                  const ck = `lite-${f.key}-${w.key}`;
                  return (
                    <div key={ck} className="row-hover" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, transition: "all .18s", marginBottom: 7 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: `${f.color}15`, border: `1px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{f.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 800 }}>{f.label}</span>
                          <span style={{ fontSize: 10, color: f.color, background: `${f.color}12`, border: `1px solid ${f.color}28`, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>{w.label}</span>
                          <span style={{ fontSize: 9, color: C.green, background: "rgba(16,217,138,.1)", padding: "1px 6px", borderRadius: 99, fontWeight: 700 }}>KÜÇÜK CİHAZ</span>
                        </div>
                        <code style={{ fontSize: 11, color: C.sub, wordBreak: "break-all" }}>{url}</code>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button className="copy-btn" onClick={() => copy(url, ck)}
                          style={{ padding: "8px 14px", borderRadius: 9, border: `1px solid ${C.line}`, background: copied === ck ? "rgba(16,217,138,.12)" : "transparent", color: copied === ck ? C.green : C.sub, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}>
                          {copied === ck ? "✓ Kopyalandı" : "📋 Kopyala"}
                        </button>
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 12px", borderRadius: 9, border: `1px solid ${C.line}`, color: C.sub, fontSize: 11, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>Aç ↗</a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Kaynak bilgisi */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 20 }}>
          {[
            { icon: "🏛", name: "USOM / SGB", desc: "Siber Güvenlik Başkanlığı — resmi Türkiye tehdit listesi", color: C.blue,   href: "https://www.usom.gov.tr" },
            { icon: "🦠", name: "URLhaus",    desc: "abuse.ch — aktif malware dağıtım URL'leri",             color: C.purple, href: "https://urlhaus.abuse.ch" },
            { icon: "🤖", name: "Feodo Tracker", desc: "abuse.ch — botnet C2 sunucu IP adresleri",           color: C.teal,   href: "https://feodotracker.abuse.ch" },
            { icon: "📊", name: "CINS Score", desc: "Collective Intelligence — kötü aktör IP listesi",       color: C.orange, href: "https://cinsscore.com" },
          ].map(s => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: "none", background: C.card, border: `1px solid ${s.color}20`, borderRadius: 14, padding: "14px 16px", transition: "all .15s", display: "block" }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = s.color + "50"; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = s.color + "20"; }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.name}</span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: C.dim }}>↗</span>
              </div>
              <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.5 }}>{s.desc}</div>
            </a>
          ))}
        </div>

        {/* FortiGate rehberi */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, overflow: "hidden", marginBottom: 24 }}>
          <button onClick={() => setGuide(g => !g)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", background: "transparent", border: "none", color: C.text, cursor: "pointer", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(79,124,255,.12)", border: "1px solid rgba(79,124,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔧</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>FortiGate Kurulum Rehberi</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>External Connector · FortiOS 6.4+ · Adım adım</div>
              </div>
            </div>
            <span style={{ color: C.dim, fontSize: 18, transform: guide ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
          </button>

          {guide && (
            <div className="fade" style={{ borderTop: `1px solid ${C.line}`, padding: "0 22px 22px" }}>
              {[
                { n: "1", t: "Security Fabric → External Connectors", d: "Sol menüden Security Fabric → External Connectors yolunu izleyin. 'Create New' butonuna tıklayın." },
                { n: "2", t: "Feed tipini seçin", d: "'Threat Feed' → tipe göre seçim:\n• Domain listesi → \"Domain Name\"\n• IPv4 listesi → \"IP Address\"\n• URL listesi → \"URL\"\nHer liste için ayrı connector oluşturun." },
                { n: "3", t: "URI adresini girin", d: `Feed URL'sini yapıştırın:\nhttps://threat.lidernetwork.com.tr/feeds/domain.txt\nhttps://threat.lidernetwork.com.tr/feeds/ipv4.txt\nhttps://threat.lidernetwork.com.tr/feeds/url.txt\n\nKüçük cihazlar için LİTE feed kullanın:\nhttps://threat.lidernetwork.com.tr/feeds/domain-90d.txt` },
                { n: "4", t: "Yenileme aralığını ayarlayın", d: "\"Refresh Rate\" → 60 dakika. Listeler her 2 saatte bir güncellenir." },
                { n: "5", t: "Firewall Policy'e ekleyin", d: "Policy & Objects → Firewall Policy → connector'ları Source/Destination olarak ekleyin. Action: DENY ile zararlı bağlantılar otomatik engellenir." },
              ].map(s => (
                <div key={s.n} style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: `1px solid ${C.line}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(79,124,255,.15)", border: "1px solid rgba(79,124,255,.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: C.blue, flexShrink: 0, marginTop: 2 }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{s.t}</div>
                    <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.75, whiteSpace: "pre-line" }}>{s.d}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: "13px 16px", background: "rgba(251,191,36,.05)", border: "1px solid rgba(251,191,36,.2)", borderRadius: 10, fontSize: 12, color: C.amber, lineHeight: 1.65 }}>
                <strong>Not:</strong> FortiGate her yenileme aralığında feed'i çeker. DNS propagasyonu nedeniyle ilk aktivasyonda 5-10 dakika gecikme olabilir. Daha fazla bilgi için{" "}
                <a href="https://docs.fortinet.com" target="_blank" rel="noopener noreferrer" style={{ color: C.amber }}>Fortinet dokümantasyonunu</a> inceleyin.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 11, color: C.dim, lineHeight: 2 }}>
          {["usom.gov.tr|https://www.usom.gov.tr", "URLhaus|https://urlhaus.abuse.ch", "Feodo Tracker|https://feodotracker.abuse.ch", "CINS Score|https://cinsscore.com", "IP Kara Liste|https://blacklist.lidernetwork.com.tr", "IP Sorgu|https://ip.lidernetwork.com.tr", "DNS Checker|https://dns.lidernetwork.com.tr", "Lider Network|https://www.lidernetwork.com.tr"].map((s, i, arr) => {
            const [label, href] = s.split("|");
            return <span key={s}><a href={href} target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: "none" }}>{label}</a>{i < arr.length - 1 ? "  ·  " : ""}</span>;
          })}
          <br /><span style={{ fontSize: 10 }}>Her 2 saatte bir otomatik güncelleme · USOM/URLhaus/Feodo/CINS kaynaklı · Veri doğruluğu kaynağa aittir</span>
        </p>
      </div>
    </main>
  );
}
