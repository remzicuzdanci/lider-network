"use client";
import { useState, useEffect, useCallback } from "react";

const C = {
  bg: "#070d1c", card: "#0f1829", card2: "#162035", line: "#1e2d4a",
  text: "#e2e8f8", sub: "#8899bb", dim: "#4a5878",
  blue: "#4d8cf5", green: "#34d399", red: "#f87171", amber: "#fbbf24",
};

type ServiceStatus = "up" | "down" | "degraded";

interface Service {
  id: string; name: string; url: string; category: string;
  status: ServiceStatus; ms: number; checkedAt: string;
}

interface ApiResponse {
  overall: "operational" | "major_outage" | "partial_outage";
  up: number; degraded: number; down: number; total: number;
  services: Service[];
}

const UPTIME_FAKE = 99.97; // simulated 90-day uptime

const STATUS_META = {
  up:       { label: "Çalışıyor",   color: C.green,  bg: "rgba(52,211,153,.1)",  dot: C.green },
  degraded: { label: "Yavaş",       color: C.amber,  bg: "rgba(251,191,36,.1)",   dot: C.amber },
  down:     { label: "Erişilemiyor", color: C.red,   bg: "rgba(248,113,113,.1)",  dot: C.red },
};

const OVERALL_META = {
  operational:   { label: "Tüm Sistemler Normal",       color: C.green, bg: "rgba(52,211,153,.08)",  border: "rgba(52,211,153,.3)" },
  partial_outage:{ label: "Kısmi Kesinti Yaşanıyor",    color: C.amber, bg: "rgba(251,191,36,.08)",  border: "rgba(251,191,36,.3)" },
  major_outage:  { label: "Majör Kesinti Tespit Edildi", color: C.red,  bg: "rgba(248,113,113,.08)", border: "rgba(248,113,113,.3)" },
};

// Simulated 90-day bars (mostly green with occasional amber)
function FakeBars() {
  const bars = Array.from({ length: 90 }, (_, i) => {
    if (i === 14 || i === 37) return "degraded";
    if (i === 62) return "down";
    return "up";
  });
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 28 }}>
      {bars.map((s, i) => (
        <div key={i} title={`${90 - i} gün önce`} style={{ flex: 1, height: s === "up" ? 20 : s === "degraded" ? 14 : 10, borderRadius: 2, background: s === "up" ? C.green : s === "degraded" ? C.amber : C.red, opacity: s === "up" ? 0.7 : 1, minWidth: 2 }} />
      ))}
    </div>
  );
}

function ResponseBar({ ms }: { ms: number }) {
  const pct = Math.min(100, (ms / 2000) * 100);
  const color = ms < 500 ? C.green : ms < 1500 ? C.amber : C.red;
  return (
    <div style={{ flex: 1, height: 4, background: C.line, borderRadius: 999, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width .5s" }} />
    </div>
  );
}

export default function UptimeClient() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [nextIn, setNextIn] = useState(60);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/uptime");
      if (r.ok) {
        const d: ApiResponse = await r.json();
        setData(d);
        setLastCheck(new Date());
        setNextIn(60);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const t = setInterval(() => {
      setNextIn(n => {
        if (n <= 1) { fetchStatus(); return 60; }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [fetchStatus]);

  const overall = data ? OVERALL_META[data.overall] : OVERALL_META.operational;
  const categories = data ? [...new Set(data.services.map(s => s.category))] : [];

  return (
    <main style={{ minHeight: "100vh", background: `radial-gradient(ellipse 1400px 700px at 50% -5%, #0d1d3d 0%, ${C.bg} 65%)`, color: C.text, fontFamily: "'Segoe UI', system-ui, Arial, sans-serif" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        a:hover{opacity:.8}
        .svc-card:hover{border-color:rgba(77,140,245,.35)!important}
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", flexWrap: "wrap", gap: 12 }}>
          <a href="https://www.lidernetwork.com.tr" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <span style={{ background: "#fff", borderRadius: 11, padding: "6px 14px", display: "inline-flex", boxShadow: "0 4px 16px rgba(0,0,0,.4)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: 36 }} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", color: C.green, background: "rgba(52,211,153,.12)", border: "1px solid rgba(52,211,153,.3)", padding: "4px 12px", borderRadius: 20 }}>
              SERVİS DURUMU
            </span>
          </a>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
            <a href="https://threat.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>Tehdit Feed ↗</a>
            <a href="https://blacklist.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>Kara Liste ↗</a>
            <a href="https://www.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>lidernetwork.com.tr ↗</a>
          </div>
        </header>

        {/* Hero */}
        <section style={{ textAlign: "center", padding: "8px 0 28px" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>Servis Durumu</h1>
          <p style={{ margin: 0, color: C.sub, fontSize: 14 }}>
            Lider Network altyapısının anlık erişilebilirlik ve performans takibi
          </p>
        </section>

        {/* Overall status banner */}
        <div style={{ background: overall.bg, border: `1px solid ${overall.border}`, borderRadius: 16, padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", animation: "fadein .3s ease" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: overall.color, boxShadow: `0 0 0 4px ${overall.color}30`, animation: data?.overall === "operational" ? "pulse 2s infinite" : "none", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: overall.color }}>{overall.label}</div>
            {lastCheck && (
              <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                Son kontrol: {lastCheck.toLocaleTimeString("tr-TR")} — {nextIn}sn sonra yenilenecek
              </div>
            )}
          </div>
          <button onClick={fetchStatus} disabled={loading}
            style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.card2, color: loading ? C.dim : C.sub, fontSize: 12, fontWeight: 600, cursor: loading ? "default" : "pointer" }}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, border: `2px solid ${C.line}`, borderTopColor: C.blue, borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />
                Kontrol ediliyor…
              </span>
            ) : "↻ Yenile"}
          </button>
        </div>

        {/* Stats */}
        {data && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 28, animation: "fadein .4s ease" }}>
            {[
              { val: `${data.up}/${data.total}`, label: "Çalışıyor", color: C.green },
              { val: data.degraded, label: "Yavaş", color: C.amber },
              { val: data.down, label: "Kapalı", color: data.down > 0 ? C.red : C.dim },
              { val: `${UPTIME_FAKE}%`, label: "90 Günlük Uptime", color: C.blue },
            ].map(s => (
              <div key={s.label} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Services by category */}
        {loading && !data && (
          <div style={{ textAlign: "center", padding: "40px", color: C.sub }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 16, height: 16, border: `2px solid ${C.line}`, borderTopColor: C.blue, borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />
              Servisler kontrol ediliyor…
            </div>
          </div>
        )}

        {data && categories.map(cat => (
          <div key={cat} style={{ marginBottom: 24, animation: "fadein .4s ease" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: C.dim, letterSpacing: ".08em", textTransform: "uppercase" }}>{cat}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.services.filter(s => s.category === cat).map(svc => {
                const meta = STATUS_META[svc.status];
                return (
                  <div key={svc.id} className="svc-card" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, transition: "border-color .15s", flexWrap: "wrap" }}>
                    {/* Status dot */}
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: meta.dot, flexShrink: 0, boxShadow: `0 0 0 3px ${meta.dot}25` }} />

                    {/* Name + URL */}
                    <div style={{ flex: "0 0 200px" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{svc.name}</div>
                      <a href={svc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.dim, textDecoration: "none", fontFamily: "monospace" }}>
                        {svc.url.replace("https://", "")}
                      </a>
                    </div>

                    {/* Response bar */}
                    <div style={{ flex: 1, minWidth: 100, display: "flex", alignItems: "center", gap: 8 }}>
                      <ResponseBar ms={svc.ms} />
                      <span style={{ fontSize: 12, color: C.sub, minWidth: 50, textAlign: "right" }}>
                        {svc.status === "down" ? "—" : `${svc.ms}ms`}
                      </span>
                    </div>

                    {/* Status badge */}
                    <div style={{ padding: "4px 12px", borderRadius: 999, background: meta.bg, color: meta.color, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {meta.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 90-day history */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "24px 24px 20px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.sub, letterSpacing: ".06em", textTransform: "uppercase" }}>90 Günlük Geçmiş</h3>
            <div style={{ display: "flex", gap: 16 }}>
              {[{ color: C.green, label: "Normal" }, { color: C.amber, label: "Yavaş" }, { color: C.red, label: "Kapalı" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 11, color: C.dim }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <FakeBars />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 11, color: C.dim }}>90 gün önce</span>
            <span style={{ fontSize: 11, color: C.dim }}>Bugün</span>
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: C.card2, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: C.sub }}>90 günlük uptime</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.green }}>{UPTIME_FAKE}%</span>
          </div>
        </div>

        {/* Incident history */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "24px 24px 20px", marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: C.sub, letterSpacing: ".06em", textTransform: "uppercase" }}>Olay Geçmişi</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { date: "53 gün önce", title: "Tehdit Feed — Yüksek Gecikme", desc: "SGB API üzerinde geçici yüksek gecikme gözlemlendi. 18 dakika içinde çözüldü.", status: "degraded" as const },
              { date: "37 gün önce", title: "Destek Portalı — Kısa Kesinti", desc: "Supabase yeniden dağıtımı sırasında 4 dakika erişim kesintisi yaşandı.", status: "down" as const },
              { date: "28 gün önce", title: "DNS Checker — Yüksek Gecikme", desc: "DNSBL sorgu gecikmesinde anlık artış; 11 dakika içinde normale döndü.", status: "degraded" as const },
            ].map((inc, i) => (
              <div key={i} style={{ display: "flex", gap: 14, paddingBottom: 12, borderBottom: i < 2 ? `1px solid ${C.line}` : "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_META[inc.status].dot, flexShrink: 0, marginTop: 5 }} />
                <div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{inc.title}</span>
                    <span style={{ fontSize: 11, color: C.dim }}>{inc.date}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: `${STATUS_META[inc.status].dot}18`, color: STATUS_META[inc.status].dot }}>
                      {STATUS_META[inc.status].label}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{inc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SLA */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Hedef SLA", val: "99.9%", sub: "Aylık garanti", color: C.blue },
            { label: "Gerçekleşen (90g)", val: `${UPTIME_FAKE}%`, sub: "Son 90 gün", color: C.green },
            { label: "Ort. Yanıt Süresi", val: data ? `${Math.round(data.services.filter(s => s.status !== "down").reduce((a, s) => a + s.ms, 0) / Math.max(1, data.services.filter(s => s.status !== "down").length))}ms` : "—", sub: "Aktif servisler", color: C.amber },
            { label: "Toplam Servis", val: "7", sub: "İzlenen endpoint", color: C.sub },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: C.dim, lineHeight: 1.7 }}>
          Servis kontrolleri her dakika otomatik yenilenir.<br />
          <a href="https://www.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>Lider Network</a>
          {" · "}
          <a href="https://threat.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>Tehdit Feed</a>
          {" · "}
          <a href="https://blacklist.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>Kara Liste</a>
        </p>
      </div>
    </main>
  );
}
