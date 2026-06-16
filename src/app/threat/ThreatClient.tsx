"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const C = {
  bg: "#070b1d", card: "#0d1530", card2: "#121c3e", line: "#1a2550",
  text: "#dce4ff", sub: "#7a8bbf", dim: "#35456e",
  blue: "#4f7cff", green: "#2dd4a0", red: "#f87171", amber: "#fbbf24",
  teal: "#22d3ee", purple: "#a78bfa",
};

const FEEDS = [
  { key: "domain", label: "Domain",  icon: "🌐", color: C.blue,   desc: "Zararlı alan adları",      src: "USOM" },
  { key: "ipv4",   label: "IPv4",    icon: "🖥",  color: C.teal,   desc: "Zararlı IPv4 adresleri",   src: "USOM" },
  { key: "url",    label: "URL",     icon: "🔗",  color: C.purple, desc: "Zararlı URL'ler",          src: "USOM + URLhaus" },
  { key: "ipv6",   label: "IPv6",    icon: "⬡",   color: C.amber,  desc: "Zararlı IPv6 adresleri",   src: "USOM" },
];

const LITE_WINDOWS = [
  { label: "90 Gün",  days: 90,  key: "90d"  },
  { label: "180 Gün", days: 180, key: "180d" },
  { label: "365 Gün", days: 365, key: "365d" },
];

type FeedStat = {
  count: number;
  size_bytes: number;
  updated_at: string | null;
  partial: boolean;
  pages_fetched: number | null;
  total_pages: number | null;
};

interface Stats {
  stats: Record<string, FeedStat>;
  total: number;
  last_updated: string | null;
  is_partial: boolean;
}

function fmtSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function relTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Az önce";
  if (min < 60) return `${min} dk önce`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} saat önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

function absTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function useCountdown(lastUpdated: string | null) {
  const [display, setDisplay] = useState("");
  const [pct, setPct] = useState(0);

  useEffect(() => {
    function tick() {
      if (!lastUpdated) { setDisplay("—"); setPct(0); return; }
      const updatedAt = new Date(lastUpdated).getTime();
      const interval = 3_600_000;
      const nextAt = updatedAt + interval;
      const now = Date.now();
      const remaining = nextAt - now;

      if (remaining <= 0) {
        setDisplay("Güncelleme bekleniyor…");
        setPct(100);
        return;
      }

      const min = Math.floor(remaining / 60000);
      const sec = Math.floor((remaining % 60000) / 1000);
      setDisplay(`${min}:${sec.toString().padStart(2, "0")}`);
      setPct(Math.round(((interval - remaining) / interval) * 100));
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [lastUpdated]);

  return { display, pct };
}

export default function ThreatClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [guide, setGuide] = useState(false);
  const [liteOpen, setLiteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"full" | "lite">("full");
  const [origin, setOrigin] = useState("https://threat.lidernetwork.com.tr");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/threat/stats");
      if (r.ok) setStats(await r.json());
    } catch { /* sessiz */ }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(null), 2000);
    });
  }

  const isLive = stats?.last_updated
    ? Date.now() - new Date(stats.last_updated).getTime() < 7_200_000
    : false;

  const { display: countdown, pct: countdownPct } = useCountdown(stats?.last_updated ?? null);

  const totalSize = stats
    ? Object.values(stats.stats).reduce((s, v) => s + (v.size_bytes ?? 0), 0)
    : 0;

  return (
    <main style={{ minHeight: "100vh", background: `radial-gradient(ellipse 900px 450px at 50% -6%, #0e1b45 0%, ${C.bg} 60%)`, color: C.text, fontFamily: "'Segoe UI', system-ui, Arial, sans-serif" }}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes shimmer{0%{opacity:.4}50%{opacity:.8}100%{opacity:.4}}
        button:hover{filter:brightness(1.15)}
        a:hover{opacity:.7}
        .fade{animation:fadein .3s ease}
        .row-hover:hover{border-color:rgba(79,124,255,.4)!important;background:${C.card2}!important}
        .copy-btn:hover{background:rgba(79,124,255,.12)!important;border-color:rgba(79,124,255,.35)!important}
        .tab-btn{transition:all .15s;cursor:pointer;border:none}
        .tab-btn:hover{opacity:.85}
        code{font-family:'Cascadia Code','Fira Code',monospace,sans-serif}
      `}</style>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 16px 72px" }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 16px", flexWrap: "wrap", gap: 12, borderBottom: `1px solid ${C.line}` }}>
          <a href="https://www.lidernetwork.com.tr" style={{ display: "inline-flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
            <span style={{ background: "#fff", borderRadius: 11, padding: "6px 13px", display: "inline-flex", boxShadow: "0 4px 16px rgba(0,0,0,.45)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: 38 }} />
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Lider Network</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>Tehdit İstihbaratı Servisi</div>
            </div>
          </a>
          <nav style={{ display: "flex", gap: 6 }}>
            {[
              ["Kara Liste", "https://blacklist.lidernetwork.com.tr"],
              ["IP Sorgu",   "https://ip.lidernetwork.com.tr"],
              ["DNS",        "https://dns.lidernetwork.com.tr"],
            ].map(([label, href]) => (
              <a key={href} href={href}
                style={{ color: C.sub, fontSize: 12, textDecoration: "none", padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, transition: "opacity .15s" }}>
                {label} ↗
              </a>
            ))}
          </nav>
        </header>

        {/* Status bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: `1px solid ${C.line}`, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isLive ? C.green : C.amber, animation: "pulse 2.2s ease-in-out infinite", display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", color: isLive ? C.green : C.amber }}>
              {isLive ? "CANLI" : stats ? "VERİ BEKLENİYOR" : "BAĞLANIYOR"}
            </span>
          </div>
          <span style={{ color: C.line }}>|</span>
          <span style={{ fontSize: 12, color: C.sub }}>
            Son güncelleme: <span style={{ color: C.text, fontWeight: 500 }}>{relTime(stats?.last_updated ?? null)}</span>
            {stats?.last_updated && <span style={{ color: C.dim }}> ({absTime(stats.last_updated)})</span>}
          </span>
          <span style={{ color: C.line }}>|</span>
          <span style={{ fontSize: 12, color: C.sub }}>
            Sonraki: <span style={{ color: countdown.includes(":") ? C.teal : C.amber, fontWeight: 600, fontFamily: "monospace" }}>{countdown}</span>
          </span>
          {stats?.is_partial && (
            <>
              <span style={{ color: C.line }}>|</span>
              <span style={{ fontSize: 11, color: C.amber, background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)", padding: "2px 8px", borderRadius: 6 }}>
                ⚡ Kısmi veri — sonraki çevrimde tamamlanır
              </span>
            </>
          )}
          {stats?.last_updated && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 80, height: 3, background: C.card, borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${countdownPct}%`, background: `linear-gradient(90deg,${C.blue},${C.teal})`, transition: "width 1s linear", borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 10, color: C.dim }}>{countdownPct}%</span>
            </div>
          )}
        </div>

        {/* Hero */}
        <section style={{ padding: "28px 0 24px" }}>
          <h1 style={{ margin: "0 0 10px", fontSize: 30, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>
            SGB / USOM Zararlı Bağlantı Feed&apos;i
          </h1>
          <p style={{ margin: "0 0 16px", color: C.sub, fontSize: 14, maxWidth: 580, lineHeight: 1.7 }}>
            Siber Güvenlik Başkanlığı&apos;nın güncel tehdit listelerini <span style={{ color: C.teal, fontWeight: 600 }}>FortiGate External Connector</span> ile uyumlu
            TXT formatında sunar. Her 2 saatte bir otomatik güncelleme, sıfır kurulum.
          </p>
          {/* Kaynak badge'leri */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "USOM / SGB", color: C.blue },
              { label: "URLhaus", color: C.purple },
              { label: "2 Saatlik Güncelleme", color: C.green },
              { label: "FortiOS 6.4+", color: C.teal },
            ].map(b => (
              <span key={b.label} style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".05em", color: b.color, background: `${b.color}12`, border: `1px solid ${b.color}28`, padding: "3px 9px", borderRadius: 99 }}>
                {b.label}
              </span>
            ))}
          </div>
        </section>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 10, marginBottom: 24 }}>
          {FEEDS.map(f => {
            const st = stats?.stats?.[f.key];
            const count = st?.count ?? 0;
            const size = st?.size_bytes ?? 0;
            const partial = st?.partial ?? false;
            return (
              <div key={f.key}
                style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 18px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{f.icon}</span>
                  <span style={{ fontSize: 9, color: C.dim, background: `${C.dim}18`, border: `1px solid ${C.dim}30`, padding: "1px 6px", borderRadius: 99, fontWeight: 600 }}>{f.src}</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: f.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                  {count > 0
                    ? count.toLocaleString("tr-TR")
                    : <span style={{ color: C.dim, fontSize: 18, animation: stats ? "none" : "shimmer 2s infinite" }}>—</span>
                  }
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".07em", color: C.sub, marginTop: 4 }}>{f.label}</div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{f.desc}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.line}` }}>
                  <span style={{ fontSize: 10, color: C.dim }}>{fmtSize(size)}</span>
                  {partial && <span style={{ fontSize: 9, color: C.amber, fontWeight: 700, letterSpacing: ".05em" }}>KISMİ</span>}
                  {count > 0 && !partial && <span style={{ fontSize: 9, color: C.green, fontWeight: 700 }}>✓ TAM</span>}
                  {count === 0 && stats && <span style={{ fontSize: 9, color: C.dim, fontWeight: 600 }}>BEKLENIYOR</span>}
                </div>
              </div>
            );
          })}

          {/* Toplam */}
          <div style={{ background: `linear-gradient(140deg, #0f1e4a 0%, #0d1636 100%)`, border: `1px solid rgba(79,124,255,.25)`, borderRadius: 14, padding: "18px 18px 14px" }}>
            <div style={{ fontSize: 20, marginBottom: 10 }}>🛡</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {stats ? stats.total.toLocaleString("tr-TR") : <span style={{ color: C.dim, fontSize: 18 }}>—</span>}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".07em", color: C.sub, marginTop: 4 }}>TOPLAM KAYIT</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Tüm feed&apos;ler</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: `1px solid rgba(79,124,255,.2)` }}>
              <span style={{ fontSize: 10, color: C.dim }}>{fmtSize(totalSize)}</span>
              <span style={{ fontSize: 9, color: C.blue, fontWeight: 700 }}>SGB/USOM</span>
            </div>
          </div>
        </div>

        {/* Feed URL'leri — Tam / Lite sekmeleri */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>External Connector Feed URL&apos;leri</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Sekme: Tam / Lite */}
              <div style={{ display: "flex", background: C.card2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 3, gap: 2 }}>
                {(["full", "lite"] as const).map(tab => (
                  <button key={tab} className="tab-btn" onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "5px 14px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                      background: activeTab === tab ? C.blue : "transparent",
                      color: activeTab === tab ? "#fff" : C.sub,
                    }}>
                    {tab === "full" ? "TAM" : "LİTE"}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 11, color: C.dim }}>FortiOS 6.4+ · text/plain</span>
            </div>
          </div>

          {/* Tam feed'ler */}
          {activeTab === "full" && (
            <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {FEEDS.map(f => {
                const url = `${origin}/feeds/${f.key}.txt`;
                const st = stats?.stats?.[f.key];
                const count = st?.count ?? 0;
                const copyKey = `feed-${f.key}`;
                return (
                  <div key={f.key} className="row-hover"
                    style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, transition: "all .15s" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${f.color}14`, border: `1px solid ${f.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                      {f.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{f.label}</span>
                        {count > 0 && (
                          <span style={{ fontSize: 10, color: f.color, background: `${f.color}12`, border: `1px solid ${f.color}28`, padding: "1px 7px", borderRadius: 99, fontWeight: 700 }}>
                            {count.toLocaleString("tr-TR")} kayıt
                          </span>
                        )}
                        <span style={{ fontSize: 9, color: C.dim, background: `${C.dim}18`, padding: "1px 6px", borderRadius: 99 }}>{f.src}</span>
                      </div>
                      <code style={{ fontSize: 11, color: C.sub, wordBreak: "break-all" }}>{url}</code>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button className="copy-btn" onClick={() => copy(url, copyKey)}
                        style={{ padding: "7px 13px", borderRadius: 8, border: `1px solid ${C.line}`, background: copied === copyKey ? "rgba(45,212,160,.12)" : "transparent", color: copied === copyKey ? C.green : C.sub, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}>
                        {copied === copyKey ? "✓ Kopyalandı" : "📋 Kopyala"}
                      </button>
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        style={{ padding: "7px 11px", borderRadius: 8, border: `1px solid ${C.line}`, color: C.sub, fontSize: 11, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
                        Aç ↗
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Lite feed'ler */}
          {activeTab === "lite" && (
            <div className="fade">
              <div style={{ padding: "12px 16px", background: "rgba(79,124,255,.06)", border: `1px solid rgba(79,124,255,.18)`, borderRadius: 12, marginBottom: 12, fontSize: 12, color: C.sub, lineHeight: 1.6 }}>
                <strong style={{ color: C.text }}>Lite Feed Nedir?</strong> — Küçük hafızalı cihazlar (FortiGate 60F/80F vb.) için son 90/180/365 gün içinde eklenen kayıtları içerir.
                Tam listeye göre daha küçük boyutlu, aynı oranda etkili.
              </div>
              {FEEDS.filter(f => f.key === "domain" || f.key === "ipv4").map(f =>
                LITE_WINDOWS.map(w => {
                  const url = `${origin}/feeds/${f.key}-${w.key}.txt`;
                  const copyKey = `lite-${f.key}-${w.key}`;
                  return (
                    <div key={copyKey} className="row-hover"
                      style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "11px 16px", display: "flex", alignItems: "center", gap: 12, transition: "all .15s", marginBottom: 6 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${f.color}14`, border: `1px solid ${f.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                        {f.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{f.label}</span>
                          <span style={{ fontSize: 10, color: f.color, background: `${f.color}12`, border: `1px solid ${f.color}28`, padding: "1px 7px", borderRadius: 99, fontWeight: 700 }}>{w.label}</span>
                        </div>
                        <code style={{ fontSize: 11, color: C.sub, wordBreak: "break-all" }}>{url}</code>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button className="copy-btn" onClick={() => copy(url, copyKey)}
                          style={{ padding: "7px 13px", borderRadius: 8, border: `1px solid ${C.line}`, background: copied === copyKey ? "rgba(45,212,160,.12)" : "transparent", color: copied === copyKey ? C.green : C.sub, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}>
                          {copied === copyKey ? "✓ Kopyalandı" : "📋 Kopyala"}
                        </button>
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          style={{ padding: "7px 11px", borderRadius: 8, border: `1px solid ${C.line}`, color: C.sub, fontSize: 11, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
                          Aç ↗
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Kaynak bilgisi */}
        <div style={{ background: "rgba(34,211,238,.04)", border: "1px solid rgba(34,211,238,.12)", borderRadius: 12, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ fontSize: 20 }}>ℹ</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: C.text, fontWeight: 600, marginBottom: 3 }}>Veri Kaynakları: SGB / USOM &amp; URLhaus</div>
            <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.6 }}>
              Domain ve IP listeleri <strong style={{ color: C.teal }}>USOM/SGB</strong> kaynağından çekilir.
              URL feed&apos;i ek olarak <strong style={{ color: C.purple }}>abuse.ch URLhaus</strong> ile zenginleştirilir.
              Bu servis yalnızca veri dönüşümü ve dağıtımı yapar; içerik sorumluluğu kaynağa aittir.
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <a href="https://www.usom.gov.tr" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: C.teal, textDecoration: "none", whiteSpace: "nowrap", border: "1px solid rgba(34,211,238,.25)", padding: "6px 12px", borderRadius: 8 }}>
              usom.gov.tr ↗
            </a>
            <a href="https://urlhaus.abuse.ch" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: C.purple, textDecoration: "none", whiteSpace: "nowrap", border: "1px solid rgba(167,139,250,.25)", padding: "6px 12px", borderRadius: 8 }}>
              URLhaus ↗
            </a>
          </div>
        </div>

        {/* FortiGate Kurulum Rehberi */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
          <button onClick={() => setGuide(g => !g)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "transparent", border: "none", color: C.text, cursor: "pointer", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18 }}>🔧</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>FortiGate Kurulum Rehberi</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>External Connector · FortiOS 6.4+ · Adım adım kurulum</div>
              </div>
            </div>
            <span style={{ color: C.dim, fontSize: 16, display: "inline-block", transition: "transform .2s", transform: guide ? "rotate(180deg)" : "none" }}>▾</span>
          </button>

          {guide && (
            <div className="fade" style={{ borderTop: `1px solid ${C.line}`, padding: "0 20px 20px" }}>
              {[
                {
                  n: "1",
                  t: "Security Fabric → External Connectors",
                  d: "Sol menüden Security Fabric → External Connectors yolunu izleyin. 'Create New' butonuna tıklayın.",
                },
                {
                  n: "2",
                  t: "Feed tipini seçin",
                  d: "'Threat Feed' → tipe göre seçim yapın:\n• Domain listesi için → \"Domain Name\"\n• IPv4 listesi için → \"IP Address\"\n• URL listesi için → \"URL\"\nHer liste için ayrı bir connector oluşturun.",
                },
                {
                  n: "3",
                  t: "URI adresini girin",
                  d: `İlgili feed URL'sini yapıştırın. Örnek:\nhttps://threat.lidernetwork.com.tr/feeds/domain.txt\nhttps://threat.lidernetwork.com.tr/feeds/ipv4.txt\nhttps://threat.lidernetwork.com.tr/feeds/url.txt`,
                },
                {
                  n: "4",
                  t: "Yenileme aralığını ayarlayın",
                  d: "\"Refresh Rate\" → 60 dakika olarak ayarlayın. Listeler her 2 saatte bir güncellenir.",
                },
                {
                  n: "5",
                  t: "Firewall Policy'e ekleyin",
                  d: "Policy & Objects → Firewall Policy bölümünde oluşturulan connector'ları 'Source' veya 'Destination' olarak ekleyin. 'Action: DENY' ile zararlı bağlantılar otomatik engellenir.",
                },
              ].map(s => (
                <div key={s.n} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: `1px solid ${C.line}` }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(79,124,255,.15)", border: "1px solid rgba(79,124,255,.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C.blue, flexShrink: 0, marginTop: 2 }}>
                    {s.n}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 5 }}>{s.t}</div>
                    <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.7, whiteSpace: "pre-line" }}>{s.d}</div>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 14, padding: "12px 16px", background: "rgba(251,191,36,.05)", border: "1px solid rgba(251,191,36,.18)", borderRadius: 10, fontSize: 12, color: C.amber, lineHeight: 1.6 }}>
                <strong>Not:</strong> FortiGate, TXT feed&apos;ini her yenileme aralığında çeker. Daha küçük cihazlar için <strong>LİTE</strong> sekmesindeki kısa pencereli feed&apos;leri tercih edin.
                Daha fazla bilgi için{" "}
                <a href="https://docs.fortinet.com" target="_blank" rel="noopener noreferrer" style={{ color: C.amber }}>Fortinet dokümantasyonunu</a>{" "}
                inceleyin.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 11, color: C.dim, lineHeight: 1.8 }}>
          Veri kaynakları:{" "}
          <a href="https://www.usom.gov.tr" target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: "none" }}>usom.gov.tr</a>
          {" · "}
          <a href="https://urlhaus.abuse.ch" target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: "none" }}>URLhaus</a>
          {"  ·  "}
          <a href="https://blacklist.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>IP Kara Liste Sorgu</a>
          {"  ·  "}
          <a href="https://ip.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>IP Sorgu</a>
          {"  ·  "}
          <a href="https://dns.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>DNS Checker</a>
          {"  ·  "}
          <a href="https://www.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>Lider Network</a>
          <br />
          <span style={{ fontSize: 10 }}>
            Her 2 saatte bir otomatik güncelleme · USOM/URLhaus kaynaklı · Veri doğruluğu kaynağa aittir
          </span>
        </p>
      </div>
    </main>
  );
}
