"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const C = {
  bg: "#080d1e",
  nav: "#0d1330",
  card: "#111827",
  card2: "#162035",
  border: "rgba(79,124,255,0.15)",
  borderHover: "rgba(79,124,255,0.35)",
  text: "#e8ecff",
  sub: "#8896b8",
  dim: "#4a5578",
  blue: "#4f7cff",
  blueD: "#3560e0",
  green: "#34d399",
  red: "#fb7185",
  amber: "#fbbf24",
  purple: "#a78bfa",
  teal: "#2dd4bf",
};

interface IpData {
  ip: string;
  original_query: string | null;
  is_self: boolean;
  version: string;
  is_private: boolean;
  ptr: string | null;
  country: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  zip: string | null;
  lat: number | null;
  lon: number | null;
  timezone: string | null;
  timezone_offset: number | null;
  isp: string | null;
  org: string | null;
  asn: string | null;
  as_name: string | null;
  is_mobile: boolean;
  is_proxy: boolean;
  is_hosting: boolean;
}

function flag(code: string | null) {
  if (!code) return "🌐";
  return code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(127397 + c.charCodeAt(0))
  );
}

function utcOffset(secs: number | null): string {
  if (secs === null) return "—";
  const h = Math.floor(Math.abs(secs) / 3600);
  const m = Math.floor((Math.abs(secs) % 3600) / 60);
  const sign = secs >= 0 ? "+" : "−";
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

function localTime(tz: string | null): string {
  if (!tz) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }).format(new Date());
  } catch { return "—"; }
}

export default function IpClient() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<IpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [time, setTime] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function lookup(ip?: string) {
    setLoading(true);
    setError(null);
    try {
      const url = ip ? `/api/ip?ip=${encodeURIComponent(ip)}` : "/api/ip";
      const r = await fetch(url);
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Sorgu başarısız"); setData(null); }
      else setData(d);
    } catch { setError("Bağlantı hatası"); }
    finally { setLoading(false); }
  }

  // Sayfa açılınca kendi IP'yi al; ?ip= parametresi varsa onu sorgula
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("ip");
    if (param) { setInput(param); lookup(param); }
    else lookup();
  }, []);

  // Saat her saniye güncelle
  useEffect(() => {
    if (!data?.timezone) return;
    const tick = () => setTime(localTime(data.timezone));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data?.timezone]);

  const copy = useCallback((v: string) => {
    navigator.clipboard?.writeText(v);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = input.trim();
    if (!v) { lookup(); return; }
    const url = new URL(window.location.href);
    url.searchParams.set("ip", v);
    window.history.pushState({}, "", url.toString());
    lookup(v);
  }

  const S: Record<string, React.CSSProperties> = {
    page: { minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" },
    nav: { background: C.nav, borderBottom: `1px solid ${C.border}`, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "52px" },
    navBrand: { display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" },
    navLogo: { height: "22px", filter: "brightness(0) invert(1) opacity(0.9)" },
    navTag: { fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", background: "rgba(79,124,255,0.15)", color: C.blue, padding: "3px 9px", borderRadius: "999px", border: `1px solid rgba(79,124,255,0.3)` },
    navLink: { fontSize: "12px", color: C.sub, textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" },
    wrap: { maxWidth: "920px", margin: "0 auto", padding: "36px 20px 60px" },

    // Arama
    searchWrap: { position: "relative", marginBottom: "40px" },
    searchRow: { display: "flex", gap: "10px" },
    searchInput: {
      flex: 1, height: "48px", background: C.card, border: `1px solid ${C.border}`,
      borderRadius: "12px", color: C.text, fontSize: "15px", padding: "0 18px",
      outline: "none", fontFamily: "inherit",
    },
    searchBtn: {
      height: "48px", padding: "0 24px", background: C.blue, color: "#fff",
      border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 600,
      cursor: "pointer", whiteSpace: "nowrap",
    },
    searchHint: { fontSize: "12px", color: C.dim, marginTop: "8px" },

    // Hero
    hero: {
      background: C.card, border: `1px solid ${C.border}`, borderRadius: "20px",
      padding: "32px 36px", marginBottom: "24px", position: "relative", overflow: "hidden",
    },
    heroBg: {
      position: "absolute", top: 0, right: 0, width: "320px", height: "100%",
      background: `radial-gradient(ellipse at 80% 50%, rgba(79,124,255,0.06) 0%, transparent 70%)`,
      pointerEvents: "none",
    },
    heroTop: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" },
    heroBadge: {
      fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em",
      padding: "3px 10px", borderRadius: "999px", border: `1px solid rgba(79,124,255,0.3)`,
      background: "rgba(79,124,255,0.1)", color: C.blue,
    },
    heroCountry: { fontSize: "14px", color: C.sub, display: "flex", alignItems: "center", gap: "6px" },
    heroIp: {
      fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      color: C.text, lineHeight: 1.1, marginBottom: "12px", wordBreak: "break-all",
    },
    heroPulse: {
      width: "8px", height: "8px", borderRadius: "50%", background: C.green,
      boxShadow: `0 0 0 3px rgba(52,211,153,0.2)`, flexShrink: 0,
      animation: "pulse 2s ease-in-out infinite",
    },
    heroPtr: { fontSize: "13px", color: C.sub, fontFamily: "monospace", wordBreak: "break-all" },
    heroActions: { display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" },
    btnCopy: {
      display: "flex", alignItems: "center", gap: "7px",
      height: "36px", padding: "0 16px", background: copied ? "rgba(52,211,153,0.15)" : "rgba(79,124,255,0.12)",
      color: copied ? C.green : C.blue, border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(79,124,255,0.25)"}`,
      borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
    },
    btnShare: {
      display: "flex", alignItems: "center", gap: "7px",
      height: "36px", padding: "0 16px", background: "rgba(255,255,255,0.04)",
      color: C.sub, border: `1px solid ${C.border}`,
      borderRadius: "8px", fontSize: "13px", cursor: "pointer",
    },

    // Kartlar
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" },
    card: {
      background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "24px",
    },
    cardTitle: {
      fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const,
      color: C.dim, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px",
    },
    row: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", padding: "9px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` },
    rowLast: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", padding: "9px 0" },
    label: { fontSize: "13px", color: C.sub, flexShrink: 0 },
    value: { fontSize: "13px", color: C.text, textAlign: "right" as const, wordBreak: "break-all" as const, fontWeight: 500 },
    valueMono: { fontSize: "12px", color: C.text, textAlign: "right" as const, wordBreak: "break-all" as const, fontFamily: "monospace", fontWeight: 500 },

    // Status badge
    pill: (ok: boolean) => ({
      display: "inline-flex", alignItems: "center", gap: "5px",
      fontSize: "12px", fontWeight: 500, padding: "2px 9px",
      borderRadius: "999px",
      background: ok ? "rgba(251,113,133,0.12)" : "rgba(52,211,153,0.1)",
      color: ok ? C.red : C.green,
      border: `1px solid ${ok ? "rgba(251,113,133,0.25)" : "rgba(52,211,153,0.2)"}`,
    }),

    // Skeleton
    skel: { height: "16px", background: C.card2, borderRadius: "6px", animation: "shimmer 1.4s ease infinite" },
  };

  function Row({ label, value, mono, last }: { label: string; value?: string | null; mono?: boolean; last?: boolean }) {
    return (
      <div style={last ? S.rowLast : S.row}>
        <span style={S.label}>{label}</span>
        <span style={mono ? S.valueMono : S.value}>{value || "—"}</span>
      </div>
    );
  }

  function Pill({ active, labelOn, labelOff }: { active: boolean; labelOn: string; labelOff: string }) {
    return <span style={S.pill(active)}>{active ? "⚠ " + labelOn : "✓ " + labelOff}</span>;
  }

  return (
    <div style={S.page}>
      <style>{`
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 3px rgba(52,211,153,0.2)} 50%{box-shadow:0 0 0 6px rgba(52,211,153,0.08)} }
        @keyframes shimmer { 0%{opacity:0.4} 50%{opacity:0.7} 100%{opacity:0.4} }
        @keyframes fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        input::placeholder{color:#4a5578}
        input:focus{border-color:rgba(79,124,255,0.5)!important;box-shadow:0 0 0 3px rgba(79,124,255,0.1)}
        button:hover{filter:brightness(1.1)}
        a:hover{opacity:0.8}
        .fadeIn{animation:fadein 0.35s ease}
      `}</style>

      {/* Nav */}
      <nav style={S.nav}>
        <a href="https://www.lidernetwork.com.tr" style={S.navBrand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={S.navLogo} />
          <span style={S.navTag}>IP Sorgulama</span>
        </a>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <a href="https://dns.lidernetwork.com.tr" style={S.navLink}>DNS Checker →</a>
          <a href="https://www.lidernetwork.com.tr" style={S.navLink}>lidernetwork.com.tr</a>
        </div>
      </nav>

      <div style={S.wrap}>
        {/* Arama */}
        <form onSubmit={submit} style={S.searchWrap}>
          <div style={S.searchRow}>
            <input
              ref={inputRef}
              style={S.searchInput}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="IP adresi veya domain — örn. 8.8.8.8 veya google.com"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" style={S.searchBtn}>Sorgula</button>
          </div>
          <p style={S.searchHint}>
            Boş bırakarak sorgularsanız kendi IP adresinizi görürsünüz.
          </p>
        </form>

        {loading && (
          <div style={{ ...S.hero }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ ...S.skel, width: "80px", height: "12px" }} />
              <div style={{ ...S.skel, width: "320px", height: "44px" }} />
              <div style={{ ...S.skel, width: "260px", height: "14px" }} />
            </div>
            <div style={{ height: "24px" }} />
            <div style={S.grid}>
              {[1, 2, 3].map(i => (
                <div key={i} style={S.card}>
                  <div style={{ ...S.skel, width: "80px", height: "10px", marginBottom: "20px" }} />
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ ...S.skel, width: "70px", height: "13px" }} />
                      <div style={{ ...S.skel, width: "100px", height: "13px" }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.2)", borderRadius: "14px", padding: "20px 24px", color: C.red, fontSize: "14px" }}>
            ⚠ {error}
          </div>
        )}

        {data && !loading && (
          <div className="fadeIn">
            {/* Hero */}
            <div style={S.hero}>
              <div style={S.heroBg} />
              <div style={S.heroTop}>
                <div style={S.heroPulse} />
                <span style={S.heroBadge}>{data.version}</span>
                {data.is_self && (
                  <span style={{ ...S.heroBadge, background: "rgba(52,211,153,0.1)", color: C.green, border: "1px solid rgba(52,211,153,0.25)" }}>
                    Sizin IP'niz
                  </span>
                )}
                {data.is_private && (
                  <span style={{ ...S.heroBadge, background: "rgba(251,191,36,0.1)", color: C.amber, border: "1px solid rgba(251,191,36,0.25)" }}>
                    Özel / LAN
                  </span>
                )}
                <span style={S.heroCountry}>
                  <span style={{ fontSize: "18px" }}>{flag(data.country_code)}</span>
                  <span>{data.country || "Bilinmiyor"}</span>
                  {data.city && <span style={{ color: C.dim }}>/ {data.city}</span>}
                </span>
              </div>

              <div
                style={{ ...S.heroIp, cursor: "pointer" }}
                onClick={() => copy(data.ip)}
                title="Kopyala"
              >
                {data.ip}
              </div>

              {data.ptr && (
                <div style={S.heroPtr}>
                  PTR&nbsp;&nbsp;
                  <span style={{ color: C.teal }}>{data.ptr}</span>
                </div>
              )}

              <div style={S.heroActions}>
                <button style={S.btnCopy} onClick={() => copy(data.ip)}>
                  {copied ? "✓ Kopyalandı" : "⎘ IP'yi Kopyala"}
                </button>
                <button
                  style={S.btnShare}
                  onClick={() => {
                    const u = new URL(window.location.href);
                    u.searchParams.set("ip", data.ip);
                    navigator.clipboard?.writeText(u.toString());
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  ↗ Bağlantıyı Paylaş
                </button>
                {data.lat && data.lon && (
                  <a
                    href={`https://maps.google.com/?q=${data.lat},${data.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...S.btnShare, textDecoration: "none" }}
                  >
                    🗺 Haritada Gör
                  </a>
                )}
              </div>
            </div>

            {/* Bilgi Kartları */}
            <div style={S.grid}>
              {/* Konum */}
              <div style={S.card}>
                <div style={S.cardTitle}>
                  <span style={{ fontSize: "16px" }}>📍</span> Konum
                </div>
                <Row label="Ülke" value={data.country ? `${flag(data.country_code)} ${data.country}` : null} />
                <Row label="Bölge / Şehir" value={[data.region, data.city].filter(Boolean).join(" / ") || null} />
                <Row label="Posta Kodu" value={data.zip} />
                <Row label="Koordinat" value={data.lat && data.lon ? `${data.lat.toFixed(4)}, ${data.lon.toFixed(4)}` : null} mono />
                <Row label="Saat Dilimi" value={data.timezone} />
                <Row label="UTC Farkı" value={utcOffset(data.timezone_offset)} />
                <Row label="Yerel Saat" value={time || localTime(data.timezone)} last />
              </div>

              {/* Ağ */}
              <div style={S.card}>
                <div style={S.cardTitle}>
                  <span style={{ fontSize: "16px" }}>🏢</span> Ağ & ISP
                </div>
                <Row label="ISP" value={data.isp} />
                <Row label="Organizasyon" value={data.org} />
                <Row label="AS Numarası" value={data.asn?.split(" ")[0]} mono />
                <Row label="AS Adı" value={data.as_name} />
                <Row label="PTR Kaydı" value={data.ptr} mono last />
              </div>

              {/* Güvenlik */}
              <div style={S.card}>
                <div style={S.cardTitle}>
                  <span style={{ fontSize: "16px" }}>🛡</span> Güvenlik & Nitelikler
                </div>
                <div style={S.row}>
                  <span style={S.label}>VPN / Proxy</span>
                  <Pill active={data.is_proxy} labelOn="Tespit edildi" labelOff="Temiz" />
                </div>
                <div style={S.row}>
                  <span style={S.label}>Hosting / DC</span>
                  <Pill active={data.is_hosting} labelOn="Datacenter" labelOff="Konut/İş" />
                </div>
                <div style={S.row}>
                  <span style={S.label}>Mobil Bağlantı</span>
                  <span style={{ ...S.value, color: data.is_mobile ? C.amber : C.sub }}>
                    {data.is_mobile ? "Evet (LTE/5G)" : "Hayır"}
                  </span>
                </div>
                <Row label="IP Sürümü" value={data.version} />
                <Row label="Ağ Tipi" value={data.is_private ? "Özel (LAN)" : "Genel (WAN)"} last />
              </div>
            </div>

            {/* Alt not */}
            <p style={{ textAlign: "center", fontSize: "12px", color: C.dim, marginTop: "36px", lineHeight: 1.7 }}>
              Konum bilgisi yaklaşıktır; şehir düzeyinde doğruluk sağlanır. Güvenlik verileri ip-api.com üzerinden alınmaktadır.<br />
              <a href="https://dns.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>DNS Checker</a>
              {" · "}
              <a href="https://www.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>Lider Network</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
