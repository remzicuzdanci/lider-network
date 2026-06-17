"use client";
import { useState, useCallback } from "react";

const C = {
  bg: "#070d1c", card: "#0f1829", card2: "#162035", line: "#1e2d4a",
  text: "#e2e8f8", sub: "#8899bb", dim: "#4a5878",
  green: "#34d399", amber: "#fbbf24", red: "#f87171", blue: "#4d8cf5", cyan: "#22d3ee",
};

const QUICK = [
  { label: "10.0.0.0/8",     desc: "Büyük özel ağ" },
  { label: "172.16.0.0/12",  desc: "Orta özel ağ" },
  { label: "192.168.0.0/16", desc: "Küçük özel ağ" },
  { label: "192.168.1.0/24", desc: "Tipik LAN" },
  { label: "10.10.0.0/22",   desc: "Ofis ağı" },
  { label: "172.16.10.0/30", desc: "Point-to-Point" },
];

interface SubnetInfo {
  input: string; prefix: number;
  network: string; broadcast: string;
  firstHost: string; lastHost: string;
  netmask: string; wildcard: string;
  hostCount: number; totalAddresses: number;
  ipClass: string; networkBin: string; maskBin: string;
  isPrivate: boolean;
}

function ipToNum(ip: string): number {
  return ip.split(".").reduce((acc, oct) => (acc << 8) | parseInt(oct), 0) >>> 0;
}

function numToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function toBin(n: number): string {
  const b = (n >>> 0).toString(2).padStart(32, "0");
  return [b.slice(0, 8), b.slice(8, 16), b.slice(16, 24), b.slice(24)].join(".");
}

function getClass(ip: string): string {
  const first = parseInt(ip.split(".")[0]);
  if (first < 128) return "A";
  if (first < 192) return "B";
  if (first < 224) return "C";
  if (first < 240) return "D (Multicast)";
  return "E (Deneysel)";
}

function isPrivate(ip: string): boolean {
  const n = ipToNum(ip);
  return (
    (n >= ipToNum("10.0.0.0")     && n <= ipToNum("10.255.255.255")) ||
    (n >= ipToNum("172.16.0.0")   && n <= ipToNum("172.31.255.255")) ||
    (n >= ipToNum("192.168.0.0")  && n <= ipToNum("192.168.255.255"))
  );
}

function calculate(raw: string): SubnetInfo | null {
  try {
    const parts = raw.trim().split("/");
    if (parts.length !== 2) return null;
    const ipParts = parts[0].split(".");
    if (ipParts.length !== 4 || ipParts.some(p => isNaN(+p) || +p < 0 || +p > 255)) return null;
    const prefix = parseInt(parts[1]);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return null;

    const ipNum   = ipToNum(parts[0]);
    const maskNum = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const netNum  = (ipNum & maskNum) >>> 0;
    const bcastNum = (netNum | (~maskNum >>> 0)) >>> 0;
    const totalAddresses = Math.pow(2, 32 - prefix);
    const hostCount = prefix >= 31 ? totalAddresses : Math.max(0, totalAddresses - 2);
    const firstHost = prefix >= 31 ? numToIp(netNum) : numToIp(netNum + 1);
    const lastHost  = prefix >= 31 ? numToIp(bcastNum) : numToIp(bcastNum - 1);

    return {
      input: raw.trim(), prefix,
      network: numToIp(netNum), broadcast: numToIp(bcastNum),
      firstHost, lastHost,
      netmask: numToIp(maskNum), wildcard: numToIp(~maskNum >>> 0),
      hostCount, totalAddresses,
      ipClass: getClass(parts[0]),
      networkBin: toBin(netNum), maskBin: toBin(maskNum),
      isPrivate: isPrivate(parts[0]),
    };
  } catch { return null; }
}

export default function SubnetClient() {
  const [input, setInput]   = useState("");
  const [result, setResult] = useState<SubnetInfo | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [prefix, setPrefix] = useState(24);

  const run = useCallback((val: string) => {
    const info = calculate(val);
    if (!info) { setError("Geçersiz CIDR — örnek: 192.168.1.0/24"); setResult(null); }
    else { setResult(info); setError(null); }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.includes("/")) run(`${input}/${prefix}`);
    else run(input);
  }

  function handleQuick(label: string) {
    setInput(label);
    const p = parseInt(label.split("/")[1]);
    setPrefix(p);
    run(label);
  }

  function handleInputChange(val: string) {
    setInput(val);
    if (val.includes("/")) {
      const p = parseInt(val.split("/")[1]);
      if (!isNaN(p) && p >= 0 && p <= 32) setPrefix(p);
    }
  }

  function handlePrefixChange(p: number) {
    setPrefix(p);
    const base = input.includes("/") ? input.split("/")[0] : input;
    if (base) { const v = `${base}/${p}`; setInput(v); run(v); }
  }

  const rows = !result ? [] : [
    { label: "Ağ Adresi",               val: result.network,    color: C.green },
    { label: "Broadcast Adresi",         val: result.broadcast,  color: C.amber },
    { label: "İlk Kullanılabilir Host",  val: result.firstHost,  color: C.blue },
    { label: "Son Kullanılabilir Host",  val: result.lastHost,   color: C.blue },
    { label: "Subnet Maskesi",           val: result.netmask,    color: C.text },
    { label: "Wildcard Maskesi",         val: result.wildcard,   color: C.text },
    { label: "Kullanılabilir Host",      val: result.hostCount.toLocaleString("tr-TR"), color: C.cyan },
    { label: "Toplam Adres",             val: result.totalAddresses.toLocaleString("tr-TR"), color: C.sub },
    { label: "IP Sınıfı",               val: `Sınıf ${result.ipClass}`, color: C.text },
    { label: "Tür",                      val: result.isPrivate ? "Özel (Private)" : "Genel (Public)", color: result.isPrivate ? C.green : C.amber },
  ];

  return (
    <main style={{ minHeight: "100vh", background: `radial-gradient(ellipse 1400px 700px at 50% -5%, #0d1d3d 0%, ${C.bg} 65%)`, color: C.text, fontFamily: "'Segoe UI', system-ui, Arial, sans-serif" }}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        input::placeholder{color:${C.dim}}
        input:focus{outline:none;border-color:${C.cyan}!important;box-shadow:0 0 0 3px rgba(34,211,238,.15)}
        input[type=range]{accent-color:${C.cyan}}
        .quick-btn:hover{background:rgba(34,211,238,.18)!important;border-color:${C.cyan}!important;color:${C.text}!important}
        .fade{animation:fadein .3s ease}
        a:hover{opacity:.8}
      `}</style>

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", flexWrap: "wrap", gap: 12 }}>
          <a href="https://www.lidernetwork.com.tr" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <span style={{ background: "#fff", borderRadius: 11, padding: "6px 14px", display: "inline-flex", boxShadow: "0 4px 16px rgba(0,0,0,.4)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: 36 }} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", color: C.cyan, background: "rgba(34,211,238,.12)", border: "1px solid rgba(34,211,238,.3)", padding: "4px 12px", borderRadius: 20 }}>
              SUBNET HESAP
            </span>
          </a>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <a href="https://dns.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>DNS Checker ↗</a>
            <a href="https://ip.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>IP Analiz ↗</a>
          </div>
        </header>

        {/* Hero */}
        <section style={{ textAlign: "center", padding: "12px 0 32px" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🌐</div>
          <h1 style={{ margin: "0 0 10px", fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>Subnet Hesaplayıcı</h1>
          <p style={{ margin: 0, color: C.sub, fontSize: 15, lineHeight: 1.6 }}>
            IP/CIDR notasyonundan network, broadcast, host aralığı,<br />
            netmask ve binary gösterimini anında hesaplayın.
          </p>
        </section>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <input
              value={input} onChange={e => handleInputChange(e.target.value)}
              placeholder="192.168.1.0/24"
              style={{ flex: 1, minWidth: 200, padding: "15px 18px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.text, fontSize: 15, fontFamily: "monospace" }}
              autoComplete="off" spellCheck={false} autoFocus
            />
            <button type="submit"
              style={{ padding: "15px 26px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,#0e7490,${C.cyan})`, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(34,211,238,.3)", transition: "all .2s" }}>
              Hesapla
            </button>
          </div>

          {/* Prefix slider */}
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: C.sub }}>Prefix uzunluğu</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.cyan, fontFamily: "monospace" }}>/{prefix}</span>
            </div>
            <input type="range" min={0} max={32} value={prefix} onChange={e => handlePrefixChange(+e.target.value)} style={{ width: "100%" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: C.dim }}>/0 — 4.3 milyar host</span>
              <span style={{ fontSize: 10, color: C.dim }}>/32 — tek host</span>
            </div>
          </div>
        </form>

        {/* Quick */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: C.dim }}>Örnekler:</span>
          {QUICK.map(q => (
            <button key={q.label} className="quick-btn" onClick={() => handleQuick(q.label)} title={q.desc}
              style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.sub, fontSize: 11, cursor: "pointer", fontFamily: "monospace", transition: "all .15s" }}>
              {q.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.25)", borderRadius: 14, padding: "14px 18px", color: C.red, fontSize: 14, marginBottom: 20 }}>
            ⚠ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="fade">
            {/* Özet band */}
            <div style={{ background: "rgba(34,211,238,.06)", border: "1px solid rgba(34,211,238,.25)", borderRadius: 16, padding: "18px 22px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: 28, fontFamily: "monospace", fontWeight: 900, color: C.cyan }}>{result.network}/{result.prefix}</span>
              <span style={{ fontSize: 13, color: C.sub }}>·</span>
              <span style={{ fontSize: 14, color: C.text }}>{result.hostCount.toLocaleString("tr-TR")} kullanılabilir host</span>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: result.isPrivate ? "rgba(52,211,153,.12)" : "rgba(251,191,36,.12)", color: result.isPrivate ? C.green : C.amber, border: `1px solid ${result.isPrivate ? "rgba(52,211,153,.3)" : "rgba(251,191,36,.3)"}` }}>
                {result.isPrivate ? "Özel Ağ" : "Genel Ağ"}
              </span>
            </div>

            {/* Detay grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 8, marginBottom: 14 }}>
              {rows.map(r => (
                <div key={r.label} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, color: C.dim, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>{r.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: r.color, fontFamily: "monospace" }}>{r.val}</div>
                </div>
              ))}
            </div>

            {/* Binary gösterim */}
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 18px" }}>
              <div style={{ fontSize: 10, color: C.dim, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Binary Gösterim</div>
              {[
                { label: "Network", val: result.networkBin, color: C.green },
                { label: "Netmask", val: result.maskBin,    color: C.cyan },
              ].map(b => (
                <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: C.dim, minWidth: 52 }}>{b.label}</span>
                  <span style={{ fontSize: 12, fontFamily: "monospace", color: b.color, letterSpacing: ".08em" }}>{b.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Landing info */}
        {!result && !error && (
          <div className="fade">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 12 }}>
              {[
                { icon: "🏗", title: "Network & Broadcast", desc: "CIDR bloğunun ağ ve yayın adreslerini otomatik hesaplar." },
                { icon: "📊", title: "Host Aralığı", desc: "İlk ve son kullanılabilir host adresleri ile toplam kapasite." },
                { icon: "🎭", title: "Netmask & Wildcard", desc: "Subnet maskesi ve ACL'lerde kullanılan wildcard mask." },
                { icon: "💻", title: "Binary Gösterim", desc: "Network ve mask adreslerinin ikili sayı sisteminde gösterimi." },
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
