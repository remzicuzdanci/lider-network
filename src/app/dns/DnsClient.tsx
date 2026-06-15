"use client";
import { useState } from "react";

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

  const key = (t: Tab, d: string) => `${t}:${d}`;
  const cur = cache[key(tab, domain)];

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
            <span style={{ background: "#fff", borderRadius: 9, padding: "6px 12px", display: "inline-flex" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: 30 }} />
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: C.sub }}>Sonuçlar:</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: C.blue }}>{domain}</span>
              </div>
              {cur?.loading ? <Loading /> :
                cur?.error ? <ErrorBox msg={cur.error} /> :
                  cur?.data ? <Result tab={tab} data={cur.data} /> :
                    <p style={{ color: C.sub }}>Sekme yükleniyor…</p>}
            </div>
          </>
        )}

        {!domain && <Examples onPick={(d) => { setInput(d); setDomain(d); setTab("records"); loadTab("records", d); }} />}

        <footer style={{ textAlign: "center", marginTop: 40, color: C.sub, fontSize: 12.5, lineHeight: 1.7 }}>
          <div style={{ marginBottom: 6 }}>Bu araç <a href="https://www.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>Lider Network</a> tarafından ücretsiz sunulmaktadır.</div>
          <div>Fortinet Yetkili Partner · Siber Güvenlik & BT Altyapı · +90 312 232 02 88</div>
        </footer>
      </div>
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
function copy(v: string) { navigator.clipboard?.writeText(v); }

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
function Result({ tab, data }: { tab: Tab; data: any }) {
  if (tab === "records") {
    const order = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA", "CAA"];
    const has = order.filter(t => (data[t] || []).length);
    if (!has.length) return <p style={{ color: C.sub }}>Bu alan adı için DNS kaydı bulunamadı.</p>;
    return <div style={{ display: "grid", gap: 18 }}>
      {has.map(t => (
        <div key={t}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.blue, marginBottom: 6 }}>{t}</div>
          {(data[t] as any[]).map((rec, i) => (
            <div key={i} onClick={() => copy(rec.value)} title="Kopyala" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: C.card2, borderRadius: 9, marginBottom: 6 }}>
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
    </div>;
  }

  if (tab === "whois") {
    if (data.error) return <ErrorBox msg={data.error} />;
    const fmt = (s: string | null) => s ? new Date(s).toLocaleString("tr-TR") : "—";
    return <div>
      <Row label="Alan adı" value={data.domain} mono />
      <Row label="Registrar" value={data.registrar || "—"} />
      <Row label="Oluşturma" value={fmt(data.created)} />
      <Row label="Son güncelleme" value={fmt(data.updated)} />
      <Row label="Bitiş" value={fmt(data.expires)} />
      <Row label="DNSSEC" value={data.dnssec === true ? <Pill ok>Aktif</Pill> : data.dnssec === false ? <Pill ok={false}>Pasif</Pill> : "—"} />
      <Row label="Durum" value={(data.status || []).join(", ") || "—"} />
      <Row label="Name server" value={(data.nameservers || []).join("  ·  ") || "—"} mono />
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

function Examples({ onPick }: { onPick: (d: string) => void }) {
  const ex = ["lidernetwork.com.tr", "google.com", "fortinet.com"];
  return <div style={{ textAlign: "center", color: C.sub, fontSize: 13, marginTop: 8 }}>
    <span style={{ marginRight: 8 }}>Örnek:</span>
    {ex.map(d => <button key={d} onClick={() => onPick(d)} style={{ margin: "0 5px", padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.blue, fontSize: 13, cursor: "pointer" }}>{d}</button>)}
  </div>;
}
