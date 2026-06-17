"use client";
import { useState, useEffect, useCallback } from "react";

const SERVICES = [
  { id: "web",       name: "Lider Network Web",     url: "https://www.lidernetwork.com.tr",       category: "Web" },
  { id: "destek",    name: "Destek Portalı",         url: "https://destek.lidernetwork.com.tr",    category: "Portal" },
  { id: "threat",    name: "Tehdit Feed Servisi",    url: "https://threat.lidernetwork.com.tr",    category: "Güvenlik" },
  { id: "blacklist", name: "Kara Liste Sorgu",       url: "https://blacklist.lidernetwork.com.tr", category: "Güvenlik" },
  { id: "ip",        name: "IP Analiz",              url: "https://ip.lidernetwork.com.tr",        category: "Araçlar" },
  { id: "dns",       name: "DNS Checker",            url: "https://dns.lidernetwork.com.tr",       category: "Araçlar" },
  { id: "password",  name: "Şifre Oluşturucu",       url: "https://password.lidernetwork.com.tr",  category: "Araçlar" },
  { id: "uptime",    name: "Site Kontrol",           url: "https://uptime.lidernetwork.com.tr",    category: "Araçlar" },
];

type SvcStatus = "up" | "down" | "degraded" | "checking";

interface SvcResult {
  id: string; name: string; url: string; category: string;
  status: SvcStatus; ms: number; httpStatus: number | null;
}

const STATUS = {
  up:       { label: "Çalışıyor",    color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", dot: "#22c55e" },
  degraded: { label: "Yavaş",        color: "#d97706", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b" },
  down:     { label: "Erişilemiyor", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", dot: "#ef4444" },
  checking: { label: "Kontrol…",     color: "#6b7280", bg: "#f8fafc", border: "#e5e7eb", dot: "#d1d5db" },
};

export default function SistemDurumuPage() {
  const [results, setResults] = useState<SvcResult[]>(
    SERVICES.map(s => ({ ...s, status: "checking", ms: 0, httpStatus: null }))
  );
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);
  const [nextIn, setNextIn] = useState(60);

  const runChecks = useCallback(async () => {
    setChecking(true);
    setResults(SERVICES.map(s => ({ ...s, status: "checking", ms: 0, httpStatus: null })));

    const checks = await Promise.all(
      SERVICES.map(async (svc) => {
        const r = await fetch(`/api/uptime?url=${encodeURIComponent(svc.url)}`);
        if (!r.ok) return { ...svc, status: "down" as SvcStatus, ms: 0, httpStatus: null };
        const d = await r.json();
        const status: SvcStatus = d.up ? (d.ms > 2000 ? "degraded" : "up") : "down";
        return { ...svc, status, ms: d.ms as number, httpStatus: d.status as number | null };
      })
    );

    setResults(checks);
    setLastCheck(new Date());
    setNextIn(60);
    setChecking(false);
  }, []);

  useEffect(() => { runChecks(); }, [runChecks]);

  useEffect(() => {
    const t = setInterval(() => {
      setNextIn(n => {
        if (n <= 1) { runChecks(); return 60; }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [runChecks]);

  const up       = results.filter(r => r.status === "up").length;
  const degraded = results.filter(r => r.status === "degraded").length;
  const down     = results.filter(r => r.status === "down").length;
  const categories = [...new Set(SERVICES.map(s => s.category))];

  const overall = down > 0 ? "major" : degraded > 0 ? "partial" : checking ? "checking" : "ok";
  const overallMeta = {
    ok:       { label: "Tüm Sistemler Normal",       color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
    partial:  { label: "Kısmi Yavaşlama Var",        color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    major:    { label: "Servis Kesintisi Tespit Edildi", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
    checking: { label: "Kontrol ediliyor…",           color: "#6b7280", bg: "#f8fafc", border: "#e5e7eb" },
  }[overall];

  const avgMs = results.filter(r => r.status !== "checking" && r.ms > 0).reduce((a, r) => a + r.ms, 0) /
    Math.max(1, results.filter(r => r.status !== "checking" && r.ms > 0).length);

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "'Segoe UI', system-ui, Arial, sans-serif", padding: "28px 32px" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Başlık */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1d2e" }}>Sistem Durumu</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
            Lider Network servislerinin anlık erişilebilirlik ve performans takibi
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {lastCheck && (
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              Son: {lastCheck.toLocaleTimeString("tr-TR")} · {nextIn}sn
            </span>
          )}
          <button onClick={runChecks} disabled={checking}
            style={{ padding: "8px 18px", borderRadius: 9, border: "1.5px solid #e5e7ef", background: "#fff", color: checking ? "#9ca3af" : "#374151", fontSize: 13, fontWeight: 600, cursor: checking ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {checking
              ? <span style={{ width: 13, height: 13, border: "2px solid #e5e7ef", borderTopColor: "#0052ff", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />
              : "↻"}
            {checking ? "Kontrol ediliyor…" : "Yenile"}
          </button>
        </div>
      </div>

      {/* Overall banner */}
      <div style={{ background: overallMeta.bg, border: `1px solid ${overallMeta.border}`, borderRadius: 14, padding: "16px 22px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: overallMeta.color, boxShadow: `0 0 0 4px ${overallMeta.color}20`, animation: overall === "ok" ? "pulse 2.5s infinite" : "none", flexShrink: 0 }} />
        <span style={{ fontSize: 16, fontWeight: 800, color: overallMeta.color }}>{overallMeta.label}</span>
      </div>

      {/* Özet sayılar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { val: `${up}/${SERVICES.length}`, label: "Çalışıyor",      color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
          { val: degraded,                    label: "Yavaş",          color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
          { val: down,                        label: "Kapalı",         color: down > 0 ? "#dc2626" : "#9ca3af", bg: "#fff", border: "#e5e7ef" },
          { val: checking ? "—" : `${Math.round(avgMs)}ms`, label: "Ort. Yanıt", color: "#0052ff", bg: "#eff6ff", border: "#bfdbfe" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Servisler kategoriye göre */}
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 800, color: "#6b7280", letterSpacing: ".08em", textTransform: "uppercase" }}>{cat}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {results.filter(r => r.category === cat).map(svc => {
              const meta = STATUS[svc.status];
              const msColor = svc.ms < 500 ? "#15803d" : svc.ms < 2000 ? "#d97706" : "#dc2626";
              return (
                <div key={svc.id} style={{ background: "#fff", border: `1px solid ${meta.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  {/* Dot */}
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: meta.dot, flexShrink: 0, boxShadow: `0 0 0 3px ${meta.dot}25` }} />

                  {/* Adı + URL */}
                  <div style={{ flex: "0 0 200px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1d2e" }}>{svc.name}</div>
                    <a href={svc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#9ca3af", textDecoration: "none", fontFamily: "monospace" }}>
                      {svc.url.replace("https://", "")}
                    </a>
                  </div>

                  {/* Yanıt çubuğu */}
                  <div style={{ flex: 1, minWidth: 80, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 5, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: svc.status === "checking" ? "0%" : `${Math.min(100, (svc.ms / 3000) * 100)}%`, background: msColor, borderRadius: 999, transition: "width .6s ease" }} />
                    </div>
                    <span style={{ fontSize: 12, color: svc.status === "checking" ? "#d1d5db" : msColor, minWidth: 52, textAlign: "right", fontWeight: 600 }}>
                      {svc.status === "checking" ? "…" : svc.status === "down" ? "—" : `${svc.ms}ms`}
                    </span>
                  </div>

                  {/* HTTP kodu */}
                  {svc.httpStatus && (
                    <span style={{ fontSize: 11, fontFamily: "monospace", color: "#9ca3af", minWidth: 32 }}>
                      {svc.httpStatus}
                    </span>
                  )}

                  {/* Rozet */}
                  <span style={{ padding: "4px 12px", borderRadius: 999, background: meta.bg, color: meta.color, fontSize: 12, fontWeight: 700, border: `1px solid ${meta.border}`, flexShrink: 0 }}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 32 }}>
        Kontroller her 60 saniyede otomatik yenilenir · Lider Network Admin Paneli
      </p>
    </div>
  );
}
