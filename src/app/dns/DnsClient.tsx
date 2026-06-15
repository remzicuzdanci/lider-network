"use client";
import { useState, useEffect } from "react";

type Tab = "records" | "mail" | "whois" | "ssl" | "propagation";
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "records", label: "DNS Kayıtları", icon: "🗂️" },
  { id: "mail", label: "Mail Ayarları", icon: "✉️" },
  { id: "whois", label: "WHOIS", icon: "🔎" },
  { id: "ssl", label: "SSL Sertifika", icon: "🔒" },
  { id: "propagation", label: "Propagasyon", icon: "🌍" },
];

const C = {
  bg: "#0a0e27", card: "#141a3a", card2: "#1b2350", line: "#283166",
  text: "#e8ecff", sub: "#9aa6d6", blue: "#4f7cff", green: "#34d399", red: "#fb7185", amber: "#fbbf24",
};

interface State { loading: boolean; error: string | null; data: unknown }

export default function DnsClient() {
  const [input, setInput] = useState("");
  const [domain, setDomain] = useState("");
  const [tab, setTab] = useState<Tab>("records");
  const [cache, setCache] = useState<Record<string, State>>({});
  const [toast, setToast] = useState("");

  const key = (t: Tab, d: string) => `${t}:${d}`;
  const cur = cache[key(tab, domain)];

  function doCopy(v: string) {
    navigator.clipboard?.writeText(v);
    setToast("Kopyalandı ✓");
    setTimeout(() => setToast(""), 1200);
  }

  // Paylaşılabilir link: ?d=domain ile açılırsa otomatik sorgula
  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get("d");
    if (d) {
      const cd = d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
      if (cd) { setInput(cd); setDomain(cd); loadTab("records", cd); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTab(t: Tab, d: string) {
    const k = key(t, d);
    setCache(c => ({ ...c, [k]: { loading: true, error: null, data: null } }));
    try {
      const r = await fetch(`/api/dns?domain=${encodeURIComponent(d)}&type=${t}`);
      const j = await r.json();
      if (!r.ok) { setCache(c => ({ ...c, [k]: { loading: false, error: j.error || "Sorgu başarısız", data: null } })); return; }
      setCache(c => ({ ...c, [k]: { loading: false, error: null, data: j.data } }));
    } catch {
      setCache(c => ({ ...c, [k]: { loading: false, error: "Bağlantı hatası", data: null } }));
    }
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const d = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
    if (!d) return;
    setDomain(d);
    setTab("records");
    try { window.history.replaceState(null, "", `?d=${encodeURIComponent(d)}`); } catch { /* yoksay */ }
    if (!cache[key("records", d)]) loadTab("records", d);
  }
  function selectTab(t: Tab) {
    setTab(t);
    if (domain && !cache[key(t, domain)]) loadTab(t, domain);
  }

  return (
    <main style={{ minHeight: "100vh", background: `radial-gradient(1200px 600px at 50% -10%, #1a2150 0%, ${C.bg} 60%)`, color: C.text, fontFamily: "'Segoe UI', system-ui, Arial, sans-serif" }}>
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", flexWrap: "wrap", gap: 12 }}>
          <a href="https://www.lidernetwork.com.tr" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://www.lidernetwork.com.tr/Fortinet-logo-rgb-white-red.png" alt="" style={{ display: "none" }} />
            <span style={{ background: "#fff", borderRadius: 13, padding: "10px 20px", display: "inline-flex", boxShadow: "0 6px 22px rgba(0,0,0,.3)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: 56 }} />
            </span>
          </a>
          <a href="https://www.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>lidernetwork.com.tr ↗</a>
        </header>

        {/* Hero */}
        <section style={{ textAlign: "center", padding: "26px 0 22px" }}>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: 1, color: C.blue, background: "rgba(79,124,255,.12)", border: "1px solid rgba(79,124,255,.3)", padding: "4px 12px", borderRadius: 20, marginBottom: 14 }}>ÜCRETSİZ ARAÇ</span>
          <h1 style={{ margin: "0 0 8px", fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>DNS & Domain Sorgulama Aracı</h1>
          <p style={{ margin: 0, color: C.sub, fontSize: 15 }}>DNS kayıtları · Mail (SPF/DKIM/DMARC) · WHOIS · SSL · Propagasyon — tek ekranda.</p>
        </section>

        {/* Search */}
        <form onSubmit={submit} style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="alan adı girin — ör. lidernetwork.com.tr"
            style={{ flex: 1, minWidth: 220, padding: "15px 18px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.text, fontSize: 15, outline: "none" }} />
          <button type="submit" style={{ padding: "15px 28px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, #3a63ff, ${C.blue})`, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(79,124,255,.35)" }}>Sorgula</button>
        </form>

        {domain && (
          <>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 18 }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => selectTab(t.id)} style={{ whiteSpace: "nowrap", padding: "10px 16px", borderRadius: 10, border: `1px solid ${tab === t.id ? C.blue : C.line}`, background: tab === t.id ? "rgba(79,124,255,.15)" : C.card, color: tab === t.id ? C.text : C.sub, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
                  <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>

            {/* Result */}
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "20px 22px", minHeight: 160 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: C.sub }}>Sonuçlar:</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: C.blue }}>{domain}</span>
                <button onClick={() => doCopy(`${window.location.origin}${window.location.pathname}?d=${domain}`)}
                  style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: C.sub, background: C.card2, border: `1px solid ${C.line}`, borderRadius: 8, padding: "5px 11px", cursor: "pointer" }}>
                  🔗 Linki kopyala
                </button>
              </div>
              {cur?.loading ? <Loading /> :
                cur?.error ? <ErrorBox msg={cur.error} /> :
                  cur?.data ? <Result tab={tab} data={cur.data} onCopy={doCopy} /> :
                    <p style={{ color: C.sub }}>Sekme yükleniyor…</p>}
            </div>
          </>
        )}

        {!domain && <Landing onPick={(d) => { setInput(d); setDomain(d); setTab("records"); loadTab("records", d); }} />}

        <footer style={{ textAlign: "center", marginTop: 40, color: C.sub, fontSize: 12.5, lineHeight: 1.7 }}>
          <div style={{ marginBottom: 6 }}>Bu araç <a href="https://www.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>Lider Network</a> tarafından ücretsiz sunulmaktadır.</div>
          <div>Fortinet Yetkili Partner · Siber Güvenlik & BT Altyapı · +90 312 232 02 88</div>
        </footer>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.green, color: "#04240f", fontWeight: 800, fontSize: 13.5, padding: "10px 20px", borderRadius: 30, boxShadow: "0 8px 28px rgba(0,0,0,.4)", zIndex: 100 }}>
          {toast}
        </div>
      )}
    </main>
  );
}

function Loading() {
  return <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.sub, padding: "30px 0", justifyContent: "center" }}>
    <span style={{ width: 18, height: 18, border: `2px solid ${C.line}`, borderTopColor: C.blue, borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
    Sorgulanıyor…
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}
function ErrorBox({ msg }: { msg: string }) {
  return <div style={{ background: "rgba(251,113,133,.1)", border: "1px solid rgba(251,113,133,.3)", borderRadius: 10, padding: "14px 16px", color: C.red, fontSize: 14 }}>⚠ {msg}</div>;
}

function Pill({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <span style={{ fontSize: 11.5, fontWeight: 800, padding: "3px 10px", borderRadius: 20, background: ok ? "rgba(52,211,153,.15)" : "rgba(251,113,133,.15)", color: ok ? C.green : C.red, border: `1px solid ${ok ? "rgba(52,211,153,.35)" : "rgba(251,113,133,.35)"}` }}>{children}</span>;
}
function Row({ label, value, mono }: { label?: string; value: React.ReactNode; mono?: boolean }) {
  return <div style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.line}` }}>
    {label && <span style={{ color: C.sub, fontSize: 13, minWidth: 130, flexShrink: 0 }}>{label}</span>}
    <span style={{ color: C.text, fontSize: 13.5, fontFamily: mono ? "ui-monospace, monospace" : "inherit", wordBreak: "break-all", flex: 1 }}>{value}</span>
  </div>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function Result({ tab, data, onCopy }: { tab: Tab; data: any; onCopy: (v: string) => void }) {
  if (tab === "records") {
    const order = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA", "CAA"];
    const has = order.filter(t => (data[t] || []).length);
    if (!has.length) return <p style={{ color: C.sub }}>Bu alan adı için DNS kaydı bulunamadı.</p>;
    return <div style={{ display: "grid", gap: 18 }}>
      {has.map(t => (
        <div key={t}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.blue, marginBottom: 6 }}>{t}</div>
          {(data[t] as any[]).map((rec, i) => (
            <div key={i} onClick={() => onCopy(rec.value)} title="Kopyala" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: C.card2, borderRadius: 9, marginBottom: 6 }}>
              {rec.priority !== undefined && <span style={{ fontSize: 11, fontWeight: 700, color: C.amber, background: "rgba(251,191,36,.12)", padding: "2px 7px", borderRadius: 5 }}>öncelik {rec.priority}</span>}
              <span style={{ flex: 1, fontFamily: "ui-monospace, monospace", fontSize: 13, wordBreak: "break-all" }}>{rec.value}</span>
              <span style={{ fontSize: 11, color: C.sub }}>TTL {rec.ttl}</span>
            </div>
          ))}
        </div>
      ))}
    </div>;
  }

  if (tab === "mail") {
    return <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ color: C.sub, fontSize: 13 }}>Mail sağlayıcı:</span>
        <span style={{ fontWeight: 800 }}>{data.provider}</span>
        <Pill ok={data.hasMx}>{data.hasMx ? "MX var" : "MX yok"}</Pill>
        <Pill ok={!!data.spf}>SPF {data.spf ? "✓" : "✗"}</Pill>
        <Pill ok={!!data.dmarc}>DMARC {data.dmarc ? "✓" : "✗"}</Pill>
        <Pill ok={data.dkim.length > 0}>DKIM {data.dkim.length > 0 ? "✓" : "?"}</Pill>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.blue, marginBottom: 6 }}>MX KAYITLARI</div>
        {data.mx.length ? data.mx.map((m: any, i: number) => <Row key={i} label={`öncelik ${m.priority}`} value={m.host} mono />) : <p style={{ color: C.sub, fontSize: 13 }}>MX kaydı yok</p>}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.blue, marginBottom: 6 }}>SPF</div>
        {data.spf ? <Row value={data.spf} mono /> : <p style={{ color: C.red, fontSize: 13 }}>SPF kaydı bulunamadı — sahte mail riski.</p>}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.blue, marginBottom: 6 }}>DMARC</div>
        {data.dmarc ? <Row value={data.dmarc} mono /> : <p style={{ color: C.red, fontSize: 13 }}>DMARC kaydı yok — _dmarc.{`{alan}`} TXT ekleyin.</p>}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.blue, marginBottom: 6 }}>DKIM</div>
        {data.dkim.length ? data.dkim.map((d: any, i: number) => <Row key={i} label={d.selector} value={d.value.slice(0, 80) + (d.value.length > 80 ? "…" : "")} mono />) : <p style={{ color: C.sub, fontSize: 13 }}>Yaygın seçicilerde DKIM bulunamadı (özel seçici kullanılıyor olabilir).</p>}
      </div>

      {/* Sağlayıcıya özel kurulum kontrolü */}
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr", marginTop: 4 }}>
        <ProviderCard title="Google Workspace" logo="🟦 G" accent="#4285F4" p={data.google} max={4} />
        <ProviderCard title="Microsoft 365 / Exchange" logo="🟧 M" accent="#EA3E23" p={data.microsoft} max={5} />
      </div>
    </div>;
  }

  if (tab === "whois") {
    if (data.error) return <ErrorBox msg={data.error} />;
    const fmt = (s: string | null) => {
      if (!s) return "—";
      const d = new Date(s);
      return isNaN(d.getTime()) ? s : d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
    };
    return <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: C.sub, border: `1px solid ${C.line}`, padding: "2px 8px", borderRadius: 20 }}>kaynak: {data.source || "—"}</span>
      </div>
      <Row label="Alan adı" value={data.domain} mono />
      <Row label="Registrar" value={data.registrar || "—"} />
      <Row label="Oluşturma" value={fmt(data.created)} />
      {data.updated && <Row label="Son güncelleme" value={fmt(data.updated)} />}
      <Row label="Bitiş" value={fmt(data.expires)} />
      {data.dnssec !== null && data.dnssec !== undefined && <Row label="DNSSEC" value={data.dnssec ? <Pill ok>Aktif</Pill> : <Pill ok={false}>Pasif</Pill>} />}
      <Row label="Durum" value={(data.status || []).join(", ") || "—"} />
      <Row label="Name server" value={(data.nameservers || []).join("  ·  ") || "—"} mono />
      {data.raw && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", color: C.blue, fontSize: 13, fontWeight: 700 }}>Ham WHOIS çıktısı</summary>
          <pre style={{ marginTop: 8, padding: 12, background: C.card2, borderRadius: 9, fontSize: 11.5, color: C.sub, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 320, overflow: "auto" }}>{data.raw}</pre>
        </details>
      )}
    </div>;
  }

  if (tab === "ssl") {
    if (data.error) return <ErrorBox msg={data.error} />;
    const dr = data.daysRemaining as number;
    const col = dr <= 0 ? C.red : dr <= 14 ? C.amber : C.green;
    return <div>
      <Row label="Durum" value={<span style={{ color: col, fontWeight: 700 }}>{dr <= 0 ? "Süresi dolmuş" : `Geçerli · ${dr} gün kaldı`}</span>} />
      <Row label="Sahip (CN)" value={data.subject} mono />
      <Row label="Veren (CA)" value={data.issuer} />
      <Row label="Başlangıç" value={new Date(data.valid_from).toLocaleDateString("tr-TR")} />
      <Row label="Bitiş" value={new Date(data.valid_to).toLocaleDateString("tr-TR")} />
      <Row label="Kapsanan (SAN)" value={(data.san || []).join("  ·  ")} mono />
    </div>;
  }

  if (tab === "propagation") {
    return <div style={{ display: "grid", gap: 12 }}>
      <div style={{ fontSize: 13, color: data.consistent ? C.green : C.amber }}>
        {data.consistent ? "✓ Tüm çözücüler aynı IP'yi döndürüyor — propagasyon tutarlı." : "⚠ Çözücüler farklı IP döndürüyor — yayılma sürüyor olabilir."}
      </div>
      {(data.results as any[]).map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: C.card2, borderRadius: 10 }}>
          <span style={{ fontSize: 18 }}>{r.flag}</span>
          <span style={{ fontWeight: 700, minWidth: 90 }}>{r.name}</span>
          <span style={{ flex: 1, fontFamily: "ui-monospace, monospace", fontSize: 13, color: r.ok ? C.text : C.sub }}>{r.ips.join(", ") || "—"}</span>
          <Pill ok={r.ok}>{r.ok ? "Yanıt var" : "Yanıt yok"}</Pill>
        </div>
      ))}
    </div>;
  }
  return null;
}

function ProviderCard({ title, logo, accent, p, max }: { title: string; logo: string; accent: string; p: any; max: number }) {
  if (!p) return null;
  return (
    <div style={{ border: `1px solid ${p.detected ? accent : C.line}`, borderRadius: 12, padding: "14px 16px", background: p.detected ? `${accent}14` : C.card2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 800, fontSize: 14.5 }}>{logo} {title}</span>
        {p.detected && <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: accent, padding: "2px 9px", borderRadius: 20 }}>BU DOMAINDE AKTİF</span>}
        <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: p.score === max ? C.green : C.amber }}>{p.score}/{max}</span>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {p.items.map((it: any, i: number) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 14, flexShrink: 0, color: it.ok ? C.green : C.red }}>{it.ok ? "✓" : "✗"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{it.label}</div>
              <div style={{ fontSize: 12, color: it.ok ? C.sub : C.text, fontFamily: "ui-monospace, monospace", wordBreak: "break-all" }}>{it.found}</div>
              {!it.ok && <div style={{ fontSize: 11.5, color: C.amber, marginTop: 1 }}>Beklenen: {it.expected}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Landing({ onPick }: { onPick: (d: string) => void }) {
  const ex = ["lidernetwork.com.tr", "google.com", "fortinet.com"];
  const feats = [
    { icon: "🗂️", title: "DNS Kayıtları", desc: "A, AAAA, MX, TXT, NS, CNAME, SOA, CAA — TTL'li, tek tıkla kopyalanır.", accent: C.blue },
    { icon: "✉️", title: "Gelişmiş Mail Kontrolü", desc: "Google Workspace ve Microsoft 365 / Exchange ayrı ayrı: MX, SPF, DKIM, DMARC, Autodiscover doğrulaması.", accent: "#34d399", highlight: true },
    { icon: "🔎", title: "WHOIS", desc: "Sahip, registrar, kayıt/bitiş tarihi, name server — .tr (TRABIS) dahil.", accent: "#a78bfa" },
    { icon: "🔒", title: "SSL Sertifika", desc: "Geçerlilik, kalan gün, veren CA ve kapsanan alan adları (SAN).", accent: "#fbbf24" },
    { icon: "🌍", title: "DNS Propagasyon", desc: "Google, Cloudflare, AdGuard, DNS.SB çözücülerinde yayılma tutarlılığı.", accent: "#fb7185" },
  ];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ textAlign: "center", color: C.sub, fontSize: 13, marginBottom: 26 }}>
        <span style={{ marginRight: 8 }}>Hızlı dene:</span>
        {ex.map(d => <button key={d} onClick={() => onPick(d)} style={{ margin: "4px 5px", padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.blue, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{d}</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        {feats.map(f => (
          <div key={f.title} style={{ background: f.highlight ? `${f.accent}10` : C.card, border: `1px solid ${f.highlight ? f.accent + "55" : C.line}`, borderRadius: 14, padding: "18px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22, width: 42, height: 42, display: "inline-flex", alignItems: "center", justifyContent: "center", background: `${f.accent}1e`, borderRadius: 11 }}>{f.icon}</span>
              <span style={{ fontWeight: 800, fontSize: 15 }}>{f.title}</span>
              {f.highlight && <span style={{ marginLeft: "auto", fontSize: 9.5, fontWeight: 800, color: "#04240f", background: f.accent, padding: "2px 7px", borderRadius: 20 }}>YENİ</span>}
            </div>
            <p style={{ margin: 0, color: C.sub, fontSize: 13, lineHeight: 1.55 }}>{f.desc}</p>
          </div>
        ))}
      </div>
      <p style={{ textAlign: "center", color: C.sub, fontSize: 13, marginTop: 22 }}>👆 Yukarıya bir alan adı girip <b style={{ color: C.text }}>Sorgula</b>'ya basın.</p>
    </div>
  );
}
