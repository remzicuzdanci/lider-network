"use client";
import { useState, useEffect, useCallback } from "react";

const C = {
  bg: "#0a0e27", card: "#141a3a", card2: "#1b2350", line: "#283166",
  text: "#e8ecff", sub: "#9aa6d6", dim: "#5a6896",
  blue: "#4f7cff", green: "#34d399", red: "#fb7185", amber: "#fbbf24", teal: "#2dd4bf",
};

interface IpData {
  ip: string; original_query: string | null; is_self: boolean;
  version: string; is_private: boolean; ptr: string | null;
  country: string | null; country_code: string | null;
  region: string | null; city: string | null; zip: string | null;
  lat: number | null; lon: number | null;
  timezone: string | null; timezone_offset: number | null;
  isp: string | null; org: string | null; asn: string | null; as_name: string | null;
  is_mobile: boolean; is_proxy: boolean; is_hosting: boolean;
}

type IpTypeResult = { label: string; detail: string; color: string };

function detectIpType(d: IpData): IpTypeResult {
  const ptr = (d.ptr || "").toLowerCase();

  // Mobil bağlantı → kesinlikle dinamik (CGNAT)
  if (d.is_mobile)
    return { label: "Dinamik", detail: "Mobil bağlantılar dinamiktir ve CGNAT arkasında olabilir", color: "#fbbf24" };

  // Hosting / datacenter → kesinlikle statik
  if (d.is_hosting)
    return { label: "Statik", detail: "Datacenter ve hosting IP'leri daima statik olarak tahsis edilir", color: "#34d399" };

  // PTR'de açıkça "dynamic/dhcp/pool/pppoe" geçiyorsa
  if (/dynamic|dhcp|pool|pppoe|dial|residential/.test(ptr))
    return { label: "Büyük İhtimalle Dinamik", detail: "PTR kaydı dinamik tahsise işaret ediyor; ISP'nizle teyit edin", color: "#fbbf24" };

  // PTR'de açıkça "static/dedicated/fixed" geçiyorsa
  if (/static|dedicated|fixed|sabit/.test(ptr))
    return { label: "Statik", detail: "PTR kaydı statik tahsise işaret ediyor", color: "#34d399" };

  // Diğer tüm durumlar: PTR'den kesin sonuç çıkarılamaz
  return {
    label: "ISP'ye Bağlı",
    detail: "Statik/dinamik bilgisi dışarıdan kesin olarak tespit edilemez — ISP'nizin size atama türünü kontrol edin",
    color: "#9aa6d6",
  };
}

function flag(code: string | null) {
  if (!code) return "🌐";
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
}
function utcOffset(secs: number | null) {
  if (secs === null) return "—";
  const h = Math.floor(Math.abs(secs) / 3600);
  const m = Math.floor((Math.abs(secs) % 3600) / 60);
  return `UTC${secs >= 0 ? "+" : "−"}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}
function localTime(tz: string | null) {
  if (!tz) return "—";
  try { return new Intl.DateTimeFormat("tr-TR", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date()); }
  catch { return "—"; }
}

export default function IpClient() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<IpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [tick, setTick] = useState(0);

  async function lookup(ip?: string) {
    setLoading(true); setError(null);
    try {
      const r = await fetch(ip ? `/api/ip?ip=${encodeURIComponent(ip)}` : "/api/ip");
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Sorgu başarısız"); setData(null); }
      else setData(d);
    } catch { setError("Bağlantı hatası"); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("ip");
    if (p) { setInput(p); lookup(p); } else lookup();
  }, []);

  useEffect(() => {
    if (!data?.timezone) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [data?.timezone]);

  const copy = useCallback((v: string) => {
    navigator.clipboard?.writeText(v);
    setToast("Kopyalandı ✓");
    setTimeout(() => setToast(""), 1400);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = input.trim();
    if (!v) { lookup(); return; }
    try { const u = new URL(window.location.href); u.searchParams.set("ip", v); window.history.pushState({}, "", u.toString()); } catch { /* ignore */ }
    lookup(v);
  }

  const btn = (label: string, onClick: () => void, accent = false): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px",
    borderRadius: 10, border: `1px solid ${accent ? "transparent" : C.line}`,
    background: accent ? `linear-gradient(135deg,#3a63ff,${C.blue})` : C.card2,
    color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
    boxShadow: accent ? "0 6px 20px rgba(79,124,255,.35)" : "none",
  });

  function Badge({ label, color = C.blue }: { label: string; color?: string }) {
    return (
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", padding: "3px 10px", borderRadius: 20, background: `${color}20`, border: `1px solid ${color}50`, color }}>
        {label}
      </span>
    );
  }

  function Row({ label, val, mono, last }: { label: string; val?: string | null; mono?: boolean; last?: boolean }) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: "9px 0", borderBottom: last ? "none" : `1px solid ${C.line}` }}>
        <span style={{ fontSize: 13, color: C.sub, flexShrink: 0 }}>{label}</span>
        <span style={{ fontSize: mono ? 12 : 13, color: C.text, fontWeight: 500, textAlign: "right", wordBreak: "break-all", fontFamily: mono ? "monospace" : "inherit" }}>{val || "—"}</span>
      </div>
    );
  }

  function PillStatus({ active, yes, no }: { active: boolean; yes: string; no: string }) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: active ? "rgba(251,113,133,.12)" : "rgba(52,211,153,.1)", color: active ? C.red : C.green, border: `1px solid ${active ? "rgba(251,113,133,.3)" : "rgba(52,211,153,.25)"}` }}>
        {active ? `⚠ ${yes}` : `✓ ${no}`}
      </span>
    );
  }

  function CardTitle({ icon, label }: { icon: string; label: string }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.line}` }}>
        <span style={{ fontSize: 17 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.sub }}>{label}</span>
      </div>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: `radial-gradient(1200px 600px at 50% -10%, #1a2150 0%, ${C.bg} 60%)`, color: C.text, fontFamily: "'Segoe UI', system-ui, Arial, sans-serif" }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input::placeholder{color:${C.dim}}
        input:focus{outline:none;border-color:${C.blue}!important;box-shadow:0 0 0 3px rgba(79,124,255,.15)}
        button:hover{filter:brightness(1.1)}
        a:hover{opacity:.8}
        .fade{animation:fadein .3s ease}
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", flexWrap: "wrap", gap: 12 }}>
          <a href="https://www.lidernetwork.com.tr" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <span style={{ background: "#fff", borderRadius: 13, padding: "8px 16px", display: "inline-flex", boxShadow: "0 6px 22px rgba(0,0,0,.35)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: 44 }} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", color: C.blue, background: "rgba(79,124,255,.12)", border: "1px solid rgba(79,124,255,.3)", padding: "4px 12px", borderRadius: 20 }}>IP SORGULAMA</span>
          </a>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <a href="https://dns.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>DNS Checker ↗</a>
            <a href="https://www.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>lidernetwork.com.tr ↗</a>
          </div>
        </header>

        {/* Hero Text */}
        <section style={{ textAlign: "center", padding: "16px 0 24px" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>IP Adresi Sorgulama</h1>
          <p style={{ margin: 0, color: C.sub, fontSize: 15 }}>Konum · ISP · ASN · PTR · VPN/Proxy tespiti — anında, kayıtsız, ücretsiz.</p>
        </section>

        {/* Search */}
        <form onSubmit={submit} style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="IP adresi veya domain girin — ör. 8.8.8.8 veya google.com"
            style={{ flex: 1, minWidth: 220, padding: "15px 18px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.text, fontSize: 15 }}
            autoComplete="off" spellCheck={false}
          />
          <button type="submit" style={{ padding: "15px 28px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,#3a63ff,${C.blue})`, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(79,124,255,.35)" }}>
            Sorgula
          </button>
        </form>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.sub }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${C.line}`, borderTopColor: C.blue, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ margin: 0, fontSize: 14 }}>Sorgulanıyor…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ background: "rgba(251,113,133,.08)", border: "1px solid rgba(251,113,133,.25)", borderRadius: 14, padding: "18px 22px", color: C.red, fontSize: 14 }}>
            ⚠ {error}
          </div>
        )}

        {/* Result */}
        {data && !loading && (
          <div className="fade">
            {/* Hero Card */}
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "28px 32px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 300, height: "100%", background: "radial-gradient(ellipse at 80% 50%, rgba(79,124,255,.07) 0%, transparent 70%)", pointerEvents: "none" }} />

              {/* Badges + Ülke */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 0 3px rgba(52,211,153,.2)`, animation: "pulse 2s ease-in-out infinite", display: "inline-block" }} />
                <Badge label={data.version} />
                {data.is_self && <Badge label="Sizin IP'niz" color={C.green} />}
                {data.is_private && <Badge label="Özel / LAN" color={C.amber} />}
                {data.country_code && (
                  <span style={{ fontSize: 14, color: C.sub, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 20 }}>{flag(data.country_code)}</span>
                    {data.country}{data.city ? ` / ${data.city}` : ""}
                  </span>
                )}
              </div>

              {/* IP Adresi */}
              <div
                onClick={() => copy(data.ip)}
                title="Kopyalamak için tıkla"
                style={{ fontSize: "clamp(26px,5vw,42px)", fontWeight: 800, letterSpacing: -1, fontFamily: "'Courier New', monospace", color: C.text, lineHeight: 1.1, marginBottom: 10, cursor: "pointer", wordBreak: "break-all" }}
              >
                {data.ip}
              </div>

              {/* PTR */}
              {data.ptr && (
                <div style={{ fontSize: 13, color: C.sub, fontFamily: "monospace", marginBottom: 14 }}>
                  PTR&nbsp;&nbsp;<span style={{ color: C.teal }}>{data.ptr}</span>
                </div>
              )}

              {/* Statik / Dinamik banner */}
              {(() => {
                const t = detectIpType(data);
                return (
                  <div style={{ display: "inline-flex", alignItems: "flex-start", gap: 12, background: `${t.color}12`, border: `1px solid ${t.color}40`, borderRadius: 12, padding: "10px 16px", marginBottom: 20, maxWidth: "100%" }}>
                    <span style={{ fontSize: 18, lineHeight: 1.2 }}>{t.label === "Statik" ? "⬛" : t.label === "Dinamik" ? "⟳" : t.label.includes("Statik") ? "◈" : "?"}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.color, marginBottom: 2 }}>
                        IP Tahsisi: {t.label}
                      </div>
                      <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{t.detail}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Butonlar */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={btn("", () => copy(data.ip))} onClick={() => copy(data.ip)}>
                  ⎘ {toast || "IP'yi Kopyala"}
                </button>
                <button style={btn("", () => { const u = new URL(window.location.href); u.searchParams.set("ip", data.ip); copy(u.toString()); })}
                  onClick={() => { const u = new URL(window.location.href); u.searchParams.set("ip", data.ip); copy(u.toString()); }}>
                  ↗ Bağlantıyı Paylaş
                </button>
                {data.lat && data.lon && (
                  <a href={`https://maps.google.com/?q=${data.lat},${data.lon}`} target="_blank" rel="noopener noreferrer"
                    style={{ ...btn("", () => { }), textDecoration: "none" }}>
                    🗺 Haritada Gör
                  </a>
                )}
              </div>
            </div>

            {/* Bilgi Kartları */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>

              {/* Konum */}
              <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "22px 24px" }}>
                <CardTitle icon="📍" label="Konum" />
                <Row label="Ülke" val={data.country ? `${flag(data.country_code)} ${data.country}` : null} />
                <Row label="Bölge / Şehir" val={[data.region, data.city].filter(Boolean).join(" / ") || null} />
                <Row label="Posta Kodu" val={data.zip} />
                <Row label="Koordinat" val={data.lat && data.lon ? `${data.lat.toFixed(4)}, ${data.lon.toFixed(4)}` : null} mono />
                <Row label="Saat Dilimi" val={data.timezone} />
                <Row label="UTC Farkı" val={utcOffset(data.timezone_offset)} />
                <Row label="Yerel Saat" val={tick >= 0 ? localTime(data.timezone) : "—"} mono last />
              </div>

              {/* Ağ */}
              <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "22px 24px" }}>
                <CardTitle icon="🏢" label="Ağ & ISP" />
                <Row label="ISP" val={data.isp} />
                <Row label="Organizasyon" val={data.org} />
                <Row label="AS Numarası" val={data.asn?.split(" ")[0]} mono />
                <Row label="AS Adı" val={data.as_name} />
                <Row label="PTR Kaydı" val={data.ptr} mono last />
              </div>

              {/* Güvenlik */}
              <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "22px 24px" }}>
                <CardTitle icon="🛡" label="Güvenlik & Nitelikler" />
                {(() => {
                  const t = detectIpType(data);
                  return (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.line}` }}>
                      <span style={{ fontSize: 13, color: C.sub }}>IP Tahsisi</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: t.color, background: `${t.color}15`, border: `1px solid ${t.color}40`, padding: "2px 10px", borderRadius: 999 }}>
                        {t.label}
                      </span>
                    </div>
                  );
                })()}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ fontSize: 13, color: C.sub }}>VPN / Proxy</span>
                  <PillStatus active={data.is_proxy} yes="Tespit edildi" no="Temiz" />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ fontSize: 13, color: C.sub }}>Hosting / DC</span>
                  <PillStatus active={data.is_hosting} yes="Datacenter" no="Konut/İş" />
                </div>
                <Row label="Mobil Bağlantı" val={data.is_mobile ? "Evet (LTE/5G)" : "Hayır"} />
                <Row label="IP Sürümü" val={data.version} />
                <Row label="Ağ Tipi" val={data.is_private ? "Özel (LAN)" : "Genel (WAN)"} last />
              </div>
            </div>

            <p style={{ textAlign: "center", fontSize: 12, color: C.dim, marginTop: 36, lineHeight: 1.7 }}>
              Konum bilgisi yaklaşıktır; şehir düzeyinde doğruluk sağlanır. Güvenlik verileri ip-api.com üzerinden alınmaktadır.<br />
              <a href="https://dns.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>DNS Checker</a>
              {" · "}
              <a href="https://www.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>Lider Network</a>
            </p>
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: C.card2, border: `1px solid ${C.line}`, color: C.green, padding: "10px 22px", borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,.4)", zIndex: 999 }}>
          {toast}
        </div>
      )}
    </main>
  );
}
