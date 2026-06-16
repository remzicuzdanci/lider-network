"use client";
import { useState, useEffect, useCallback } from "react";

const C = {
  bg: "#080c1f", card: "#0f1530", card2: "#162040", line: "#1e2d5a",
  text: "#dce4ff", sub: "#8896cc", dim: "#3d4f80",
  blue: "#4f7cff", green: "#2dd4a0", red: "#f87171", amber: "#fbbf24",
  teal: "#22d3ee", purple: "#a78bfa",
};

const FEED_BASE = typeof window !== "undefined" ? window.location.origin : "https://threat.lidernetwork.com.tr";

const FEEDS = [
  { key: "domain", label: "Domain", desc: "Zararlı alan adları", icon: "🌐", color: C.blue },
  { key: "ipv4",   label: "IPv4",   desc: "Zararlı IP adresleri", icon: "🖥", color: C.teal },
  { key: "url",    label: "URL",    desc: "Zararlı URL'ler", icon: "🔗", color: C.purple },
  { key: "ipv6",   label: "IPv6",   desc: "Zararlı IPv6 adresleri", icon: "⬡", color: C.amber },
];

interface Stats {
  stats: Record<string, { count: number; updated_at: string | null }>;
  total: number;
  last_updated: string | null;
}

function relTime(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Az önce";
  if (min < 60) return `${min} dk önce`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} saat önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

function nextUpdate(iso: string | null) {
  if (!iso) return "—";
  const next = new Date(new Date(iso).getTime() + 3600_000);
  const diff = next.getTime() - Date.now();
  if (diff < 0) return "Güncelleme bekleniyor";
  const min = Math.floor(diff / 60000);
  if (min < 1) return "1 dk içinde";
  if (min < 60) return `${min} dk sonra`;
  return `${Math.floor(min / 60)} saat sonra`;
}

export default function ThreatClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [guide, setGuide] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/threat/stats");
      if (r.ok) setStats(await r.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 60_000); return () => clearInterval(t); }, [load]);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const isLive = stats?.last_updated
    ? Date.now() - new Date(stats.last_updated).getTime() < 7_200_000
    : false;

  return (
    <main style={{ minHeight: "100vh", background: `radial-gradient(1000px 500px at 50% -5%, #0e1740 0%, ${C.bg} 55%)`, color: C.text, fontFamily: "'Segoe UI', system-ui, Arial, sans-serif" }}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        button:hover{filter:brightness(1.12)}
        a:hover{opacity:.75}
        .fade{animation:fadein .3s ease}
        .card-hover:hover{border-color:rgba(79,124,255,.4)!important;background:${C.card2}!important}
        input::placeholder{color:${C.dim}}
        input:focus{outline:none;border-color:${C.blue}!important}
        .copy-btn:hover{background:rgba(79,124,255,.15)!important}
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px 64px" }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", flexWrap: "wrap", gap: 12 }}>
          <a href="https://www.lidernetwork.com.tr" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <span style={{ background: "#fff", borderRadius: 12, padding: "7px 14px", display: "inline-flex", boxShadow: "0 4px 18px rgba(0,0,0,.4)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: 40 }} />
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", color: C.red, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.25)", padding: "3px 10px", borderRadius: 20 }}>
              TEHDİT İSTİHBARATI
            </span>
          </a>
          <div style={{ display: "flex", gap: 20 }}>
            <a href="https://blacklist.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>Kara Liste ↗</a>
            <a href="https://ip.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>IP Sorgu ↗</a>
            <a href="https://dns.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>DNS Checker ↗</a>
          </div>
        </header>

        {/* Hero */}
        <section style={{ padding: "12px 0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: isLive ? C.green : C.amber, animation: isLive ? "pulse 2s infinite" : "none", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: isLive ? C.green : C.amber, fontWeight: 600, letterSpacing: ".04em" }}>
              {isLive ? "CANLI — OTOMATIK GÜNCELLEME AKTİF" : stats ? "VERİ BEKLENIYOR" : "BAĞLANIYOR…"}
            </span>
          </div>
          <h1 style={{ margin: "0 0 10px", fontSize: 32, fontWeight: 800, letterSpacing: -0.5 }}>
            SGB / USOM Zararlı Bağlantı Feed&apos;i
          </h1>
          <p style={{ margin: 0, color: C.sub, fontSize: 15, maxWidth: 600, lineHeight: 1.6 }}>
            Siber Güvenlik Başkanlığı&apos;nın zararlı domain, IP ve URL listelerini FortiGate{" "}
            <span style={{ color: C.teal }}>External Connector</span> ile doğrudan uyumlu TXT format'ta sunar.{" "}
            Her saat otomatik güncellenir.
          </p>
        </section>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 28 }}>
          {FEEDS.map(f => {
            const count = stats?.stats?.[f.key]?.count ?? 0;
            return (
              <div key={f.key} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: f.color, fontVariantNumeric: "tabular-nums" }}>
                  {count > 0 ? count.toLocaleString("tr-TR") : <span style={{ color: C.dim, fontSize: 16 }}>—</span>}
                </div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 2, fontWeight: 600 }}>{f.label.toUpperCase()}</div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 1 }}>{f.desc}</div>
              </div>
            );
          })}
          {/* Toplam */}
          <div style={{ background: `linear-gradient(135deg, #162040, #1a2a5a)`, border: `1px solid rgba(79,124,255,.3)`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>🛡</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.blue, fontVariantNumeric: "tabular-nums" }}>
              {stats ? (stats.total).toLocaleString("tr-TR") : <span style={{ color: C.dim, fontSize: 16 }}>—</span>}
            </div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 2, fontWeight: 600 }}>TOPLAM KAYIT</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 1 }}>Tüm listeler</div>
          </div>
        </div>

        {/* Güncelleme bilgisi */}
        {stats?.last_updated && (
          <div style={{ display: "flex", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: C.sub }}>
              Son güncelleme: <span style={{ color: C.text }}>{relTime(stats.last_updated)}</span>
            </span>
            <span style={{ color: C.line }}>|</span>
            <span style={{ fontSize: 13, color: C.sub }}>
              Sonraki güncelleme: <span style={{ color: C.text }}>{nextUpdate(stats.last_updated)}</span>
            </span>
            <span style={{ color: C.line }}>|</span>
            <span style={{ fontSize: 13, color: C.sub }}>
              Kaynak: <span style={{ color: C.teal }}>SGB / USOM</span>
            </span>
          </div>
        )}

        {/* Feed URL'leri */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: C.text }}>
            FortiGate External Connector URL&apos;leri
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FEEDS.map(f => {
              const url = `${FEED_BASE}/feeds/${f.key}.txt`;
              const count = stats?.stats?.[f.key]?.count ?? 0;
              return (
                <div key={f.key} className="card-hover"
                  style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, transition: "all .15s" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${f.color}18`, border: `1px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{f.label} Feed</span>
                      {count > 0 && (
                        <span style={{ fontSize: 10, color: f.color, background: `${f.color}15`, border: `1px solid ${f.color}30`, padding: "2px 7px", borderRadius: 999, fontWeight: 600 }}>
                          {count.toLocaleString("tr-TR")} kayıt
                        </span>
                      )}
                    </div>
                    <code style={{ fontSize: 12, color: C.sub, background: "rgba(255,255,255,.04)", padding: "3px 8px", borderRadius: 5, display: "inline-block", wordBreak: "break-all" }}>
                      {url}
                    </code>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button className="copy-btn" onClick={() => copy(url, f.key)}
                      style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.line}`, background: copied === f.key ? "rgba(45,212,160,.15)" : "transparent", color: copied === f.key ? C.green : C.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}>
                      {copied === f.key ? "✓ Kopyalandı" : "Kopyala"}
                    </button>
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.line}`, color: C.sub, fontSize: 12, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                      Aç ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FortiGate Kurulum Rehberi */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden", marginBottom: 28 }}>
          <button onClick={() => setGuide(g => !g)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", background: "transparent", border: "none", color: C.text, cursor: "pointer", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>🔧</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>FortiGate Kurulum Rehberi</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>External Connector adım adım — FortiOS 6.4+</div>
              </div>
            </div>
            <span style={{ color: C.sub, fontSize: 18, transform: guide ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
          </button>

          {guide && (
            <div className="fade" style={{ padding: "0 22px 22px", borderTop: `1px solid ${C.line}` }}>
              {[
                {
                  step: "1",
                  title: "Security Fabric → External Connectors",
                  detail: "FortiGate yönetim panelinde sol menüden Security Fabric → External Connectors yolunu izleyin.",
                },
                {
                  step: "2",
                  title: "Yeni Connector Oluşturun",
                  detail: '"Create New" butonuna tıklayın. Tip olarak "Threat Feed" → "IP Address" (IP listeleri için) veya "Domain Name" (domain listesi için) seçin.',
                },
                {
                  step: "3",
                  title: "URI Adresini Girin",
                  detail: `İlgili feed URL'sini "URI of external resource" alanına yapıştırın. Örnek:\nhttps://threat.lidernetwork.com.tr/feeds/domain.txt`,
                },
                {
                  step: "4",
                  title: "Yenileme Periyodunu Ayarlayın",
                  detail: '"Refresh Rate" değerini 60 dakika olarak ayarlayın. Liste saatte bir güncellenmektedir.',
                },
                {
                  step: "5",
                  title: "Firewall Policy'de Kullanın",
                  detail: "Oluşturulan connector, Firewall Policy → Source/Destination alanında Address Group olarak seçilebilir.",
                },
              ].map(s => (
                <div key={s.step} style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: `1px solid ${C.line}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(79,124,255,.2)", border: `1px solid rgba(79,124,255,.4)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: C.blue, flexShrink: 0, marginTop: 2 }}>
                    {s.step}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 5 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, whiteSpace: "pre-line" }}>{s.detail}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 14, padding: "12px 16px", background: "rgba(251,191,36,.06)", border: "1px solid rgba(251,191,36,.2)", borderRadius: 10, fontSize: 13, color: C.amber }}>
                ⚠ Bu servis yalnızca veri dağıtımı sağlar. İçerik sorumluluğu SGB/USOM&apos;a aittir. Listenin doğru uygulanması için Fortinet dokümantasyonunu inceleyin.
              </div>
            </div>
          )}
        </div>

        {/* Alt linkler */}
        <p style={{ textAlign: "center", fontSize: 12, color: C.dim, lineHeight: 1.7 }}>
          Kaynak: <a href="https://www.usom.gov.tr" target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: "none" }}>usom.gov.tr</a>
          {" · "}
          <a href="https://blacklist.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>IP Kara Liste</a>
          {" · "}
          <a href="https://ip.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>IP Sorgu</a>
          {" · "}
          <a href="https://dns.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>DNS Checker</a>
          {" · "}
          <a href="https://www.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>Lider Network</a>
        </p>
      </div>
    </main>
  );
}
