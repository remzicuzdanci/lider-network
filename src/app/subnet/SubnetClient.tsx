"use client";
import { useState, useCallback } from "react";

const C = {
  bg: "#070d1c", card: "#0f1829", card2: "#162035", line: "#1e2d4a",
  text: "#e2e8f8", sub: "#8899bb", dim: "#4a5878",
  green: "#34d399", amber: "#fbbf24", red: "#f87171", blue: "#4d8cf5", cyan: "#22d3ee",
};

const QUICK = [
  { label: "10.0.0.0/8",     desc: "Büyük özel ağ (Class A)" },
  { label: "172.16.0.0/12",  desc: "Orta özel ağ (Class B)" },
  { label: "192.168.0.0/16", desc: "Küçük özel ağ (Class C)" },
  { label: "192.168.1.0/24", desc: "Tipik LAN" },
  { label: "10.10.0.0/22",   desc: "Ofis ağı (1022 host)" },
  { label: "172.16.10.0/30", desc: "Point-to-Point" },
];

const CHEAT_SHEET = [
  { prefix: "/8",  hosts: "16.777.214", mask: "255.0.0.0",       usage: "ISP / Büyük kurumlar" },
  { prefix: "/16", hosts: "65.534",     mask: "255.255.0.0",     usage: "Büyük kampüs ağları" },
  { prefix: "/20", hosts: "4.094",      mask: "255.255.240.0",   usage: "Çok büyük ofis" },
  { prefix: "/22", hosts: "1.022",      mask: "255.255.252.0",   usage: "Büyük ofis (1000+ host)" },
  { prefix: "/23", hosts: "510",        mask: "255.255.254.0",   usage: "Orta ofis" },
  { prefix: "/24", hosts: "254",        mask: "255.255.255.0",   usage: "Tipik LAN (ev / küçük ofis)" },
  { prefix: "/25", hosts: "126",        mask: "255.255.255.128", usage: "İki VLAN bölümü" },
  { prefix: "/26", hosts: "62",         mask: "255.255.255.192", usage: "Dört VLAN bölümü" },
  { prefix: "/27", hosts: "30",         mask: "255.255.255.224", usage: "Küçük segment" },
  { prefix: "/28", hosts: "14",         mask: "255.255.255.240", usage: "Küçük segment" },
  { prefix: "/29", hosts: "6",          mask: "255.255.255.248", usage: "Çok küçük segment" },
  { prefix: "/30", hosts: "2",          mask: "255.255.255.252", usage: "Point-to-Point bağlantı" },
  { prefix: "/31", hosts: "2",          mask: "255.255.255.254", usage: "P2P (RFC 3021)" },
  { prefix: "/32", hosts: "1",          mask: "255.255.255.255", usage: "Host route / Loopback" },
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

function isPrivateIp(ip: string): boolean {
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
      isPrivate: isPrivateIp(parts[0]),
    };
  } catch { return null; }
}

export default function SubnetClient() {
  const [input, setInput]   = useState("");
  const [result, setResult] = useState<SubnetInfo | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [prefix, setPrefix] = useState(24);
  const [toast, setToast]   = useState("");
  const [showCheat, setShowCheat] = useState(false);

  const run = useCallback((val: string) => {
    const info = calculate(val);
    if (!info) { setError("Geçersiz CIDR — örnek: 192.168.1.0/24"); setResult(null); }
    else { setResult(info); setError(null); }
  }, []);

  const copy = useCallback((v: string) => {
    navigator.clipboard?.writeText(v);
    setToast("Kopyalandı ✓");
    setTimeout(() => setToast(""), 1400);
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

  // Sub-subnets: split current subnet into /+1 blocks
  function getSubnets(r: SubnetInfo): { cidr: string; firstHost: string; lastHost: string }[] | null {
    if (r.prefix >= 30) return null;
    const newPrefix = r.prefix + 1;
    const size = Math.pow(2, 32 - newPrefix);
    const netNum = ipToNum(r.network);
    return [0, 1].map(i => {
      const sNet = (netNum + i * size) >>> 0;
      const sBcast = (sNet + size - 1) >>> 0;
      return {
        cidr: `${numToIp(sNet)}/${newPrefix}`,
        firstHost: numToIp(sNet + 1),
        lastHost: numToIp(sBcast - 1),
      };
    });
  }

  const rows = !result ? [] : [
    { label: "Ağ Adresi",              val: result.network,    color: C.green,  copy: true },
    { label: "Broadcast Adresi",        val: result.broadcast,  color: C.amber,  copy: true },
    { label: "İlk Kullanılabilir Host", val: result.firstHost,  color: C.blue,   copy: true },
    { label: "Son Kullanılabilir Host", val: result.lastHost,   color: C.blue,   copy: true },
    { label: "Subnet Maskesi",          val: result.netmask,    color: C.text,   copy: true },
    { label: "Wildcard Maskesi",        val: result.wildcard,   color: C.text,   copy: true },
    { label: "Kullanılabilir Host",     val: result.hostCount.toLocaleString("tr-TR"),        color: C.cyan,   copy: false },
    { label: "Toplam Adres",            val: result.totalAddresses.toLocaleString("tr-TR"),   color: C.sub,    copy: false },
    { label: "IP Sınıfı",              val: `Sınıf ${result.ipClass}`, color: C.text, copy: false },
    { label: "Tür",                     val: result.isPrivate ? "Özel (Private)" : "Genel (Public)", color: result.isPrivate ? C.green : C.amber, copy: false },
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
        button:hover{filter:brightness(1.1)}
        .val-card:hover{border-color:rgba(34,211,238,.35)!important;cursor:pointer}
        .cheat-row:hover{background:rgba(255,255,255,.03)!important}
      `}</style>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 16px 60px" }}>

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
            <a href="https://ip.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>IP Analiz ↗</a>
            <a href="https://dns.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>DNS Checker ↗</a>
            <a href="https://www.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>lidernetwork.com.tr ↗</a>
          </div>
        </header>

        {/* Hero */}
        <section style={{ textAlign: "center", padding: "12px 0 32px" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🌐</div>
          <h1 style={{ margin: "0 0 10px", fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>Subnet Hesaplayıcı</h1>
          <p style={{ margin: 0, color: C.sub, fontSize: 15, lineHeight: 1.6 }}>
            IP/CIDR notasyonundan network, broadcast, host aralığı, netmask,<br />
            wildcard ve binary gösterimi — tarayıcıda anlık hesaplama.
          </p>
        </section>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <input
              value={input} onChange={e => handleInputChange(e.target.value)}
              placeholder="192.168.1.0/24"
              style={{ flex: 1, minWidth: 200, padding: "15px 18px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.text, fontSize: 16, fontFamily: "monospace" }}
              autoComplete="off" spellCheck={false} autoFocus
            />
            <button type="submit"
              style={{ padding: "15px 26px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,#0e7490,${C.cyan})`, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(34,211,238,.3)" }}>
              Hesapla
            </button>
          </div>

          {/* Prefix slider */}
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: C.sub }}>Prefix uzunluğu</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.cyan, fontFamily: "monospace" }}>/{prefix} — {CHEAT_SHEET.find(r => r.prefix === `/${prefix}`)?.hosts || "?"} host</span>
            </div>
            <input type="range" min={0} max={32} value={prefix} onChange={e => handlePrefixChange(+e.target.value)} style={{ width: "100%" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: C.dim }}>/0 — tüm internet</span>
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
              <span style={{ fontSize: 26, fontFamily: "monospace", fontWeight: 900, color: C.cyan }}>{result.network}/{result.prefix}</span>
              <span style={{ fontSize: 13, color: C.sub }}>·</span>
              <span style={{ fontSize: 14, color: C.text }}>{result.hostCount.toLocaleString("tr-TR")} kullanılabilir host</span>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: result.isPrivate ? "rgba(52,211,153,.12)" : "rgba(251,191,36,.12)", color: result.isPrivate ? C.green : C.amber, border: `1px solid ${result.isPrivate ? "rgba(52,211,153,.3)" : "rgba(251,191,36,.3)"}` }}>
                {result.isPrivate ? "🔒 Özel (RFC 1918)" : "🌐 Genel (Routable)"}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: C.dim }}>Sınıf {result.ipClass}</span>
            </div>

            {/* Detay grid — tıklanınca kopyala */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 8, marginBottom: 14 }}>
              {rows.map(r => (
                <div key={r.label} className={r.copy ? "val-card" : ""} onClick={() => r.copy && copy(r.val)}
                  title={r.copy ? "Kopyalamak için tıkla" : undefined}
                  style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 14px", transition: "border-color .15s" }}>
                  <div style={{ fontSize: 10, color: C.dim, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em", display: "flex", justifyContent: "space-between" }}>
                    <span>{r.label}</span>
                    {r.copy && <span style={{ color: C.dim, fontSize: 9 }}>⎘</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: r.color, fontFamily: "monospace" }}>{r.val}</div>
                </div>
              ))}
            </div>

            {/* Binary gösterim */}
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 18px", marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: C.dim, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Binary Gösterim</div>
              {[
                { label: "Network", val: result.networkBin, color: C.green },
                { label: "Netmask", val: result.maskBin,    color: C.cyan },
              ].map(b => (
                <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: C.dim, minWidth: 52, flexShrink: 0 }}>{b.label}</span>
                  <span style={{ fontSize: 12, fontFamily: "monospace", color: b.color, letterSpacing: ".08em", wordBreak: "break-all" }}>{b.val}</span>
                </div>
              ))}
              <p style={{ margin: "8px 0 0", fontSize: 11, color: C.dim }}>
                Network kısmı: <strong style={{ color: C.green }}>{result.prefix} bit</strong> — Host kısmı: <strong style={{ color: C.cyan }}>{32 - result.prefix} bit</strong>
              </p>
            </div>

            {/* Subnet bölme */}
            {(() => {
              const subs = getSubnets(result);
              return subs ? (
                <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 18px", marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: C.dim, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    /{result.prefix} → /{result.prefix + 1} Bölme (2 eşit subnet)
                  </div>
                  {subs.map((s, i) => (
                    <div key={i} onClick={() => handleQuick(s.cidr)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: C.card2, borderRadius: 8, marginBottom: 6, cursor: "pointer" }}
                      title="Bu subnet'i hesapla">
                      <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: C.cyan, minWidth: 140 }}>{s.cidr}</span>
                      <span style={{ fontSize: 11, color: C.sub }}>{s.firstHost} — {s.lastHost}</span>
                      <span style={{ marginLeft: "auto", fontSize: 10, color: C.dim }}>→ hesapla</span>
                    </div>
                  ))}
                </div>
              ) : null;
            })()}

          </div>
        )}

        {/* Cheat Sheet toggle */}
        <div style={{ marginTop: result ? 8 : 0, marginBottom: 20 }}>
          <button onClick={() => setShowCheat(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12, border: `1px solid ${showCheat ? C.cyan : C.line}`, background: showCheat ? "rgba(34,211,238,.1)" : C.card, color: showCheat ? C.cyan : C.sub, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s" }}>
            📋 Subnet Referans Tablosu
            <span style={{ fontSize: 11, display: "inline-block", transform: showCheat ? "rotate(90deg)" : "none", transition: "transform .2s" }}>›</span>
          </button>

          {showCheat && (
            <div className="fade" style={{ marginTop: 10, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: C.card2 }}>
                      {["Prefix", "Host Sayısı", "Netmask", "Kullanım"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: C.sub, fontWeight: 700, fontSize: 11, letterSpacing: ".05em", whiteSpace: "nowrap", borderBottom: `1px solid ${C.line}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CHEAT_SHEET.map((row, i) => (
                      <tr key={row.prefix} className="cheat-row"
                        onClick={() => { handleQuick(`192.168.0.0${row.prefix}`); setShowCheat(false); }}
                        style={{ borderBottom: i < CHEAT_SHEET.length - 1 ? `1px solid ${C.line}` : "none", cursor: "pointer", transition: "background .1s" }}>
                        <td style={{ padding: "8px 14px", fontFamily: "monospace", fontWeight: 800, color: C.cyan }}>{row.prefix}</td>
                        <td style={{ padding: "8px 14px", fontFamily: "monospace", color: C.green }}>{row.hosts}</td>
                        <td style={{ padding: "8px 14px", fontFamily: "monospace", color: C.sub }}>{row.mask}</td>
                        <td style={{ padding: "8px 14px", color: C.sub }}>{row.usage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "10px 14px", fontSize: 11, color: C.dim, borderTop: `1px solid ${C.line}` }}>
                Satıra tıklayarak 192.168.0.0 + seçilen prefix ile hesaplama yapabilirsiniz.
              </div>
            </div>
          )}
        </div>

        {/* Landing info */}
        {!result && !error && (
          <div className="fade">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 12 }}>
              {[
                { icon: "🏗", title: "Network & Broadcast", desc: "CIDR bloğunun ağ ve yayın adreslerini otomatik hesaplar." },
                { icon: "📊", title: "Host Aralığı", desc: "İlk ve son kullanılabilir host adresleri ile toplam kapasite." },
                { icon: "🎭", title: "Netmask & Wildcard", desc: "Subnet maskesi ve Cisco ACL'lerde kullanılan wildcard mask." },
                { icon: "💻", title: "Binary Gösterim", desc: "Network ve mask adreslerinin ikili sayı sisteminde gösterimi." },
                { icon: "✂️", title: "Subnet Bölme", desc: "Bir subnet'i iki eşit alt bloğa bölerek VLSM planlaması." },
                { icon: "📋", title: "Referans Tablosu", desc: "Sık kullanılan prefix'ler için hazır subnet cheat sheet." },
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

        <p style={{ textAlign: "center", fontSize: 12, color: C.dim, marginTop: 36, lineHeight: 1.7 }}>
          Tüm hesaplamalar tarayıcınızda yapılır, sunucuya veri gönderilmez.<br />
          <a href="https://ip.lidernetwork.com.tr" style={{ color: C.cyan, textDecoration: "none" }}>IP Analiz</a>
          {" · "}
          <a href="https://dns.lidernetwork.com.tr" style={{ color: C.cyan, textDecoration: "none" }}>DNS Checker</a>
          {" · "}
          <a href="https://www.lidernetwork.com.tr" style={{ color: C.cyan, textDecoration: "none" }}>Lider Network</a>
        </p>

      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: C.card2, border: `1px solid ${C.line}`, color: C.green, padding: "10px 22px", borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,.4)", zIndex: 999 }}>
          {toast}
        </div>
      )}
    </main>
  );
}
