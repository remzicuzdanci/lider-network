"use client";

import { useState } from "react";
import { ShieldAlert, ShieldCheck, ShieldQuestion, Search, AlertTriangle, CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface CheckResult {
  ip: string;
  risk: "high" | "medium" | "low";
  ownFeeds: { found: boolean; feeds: string[] };
  greyNoise: { available: boolean; noise?: boolean; riot?: boolean; classification?: string; name?: string; message?: string } | null;
  abuseIPDB: { available: boolean; score?: number; totalReports?: number; lastReported?: string } | null;
}

function RiskBadge({ risk }: { risk: "high" | "medium" | "low" }) {
  const cfg = {
    high:   { label: "YÜKSEK RİSK",   bg: "#fef2f2", text: "#dc2626", border: "#fca5a5", icon: <XCircle size={15} /> },
    medium: { label: "ORTA RİSK",      bg: "#fffbeb", text: "#d97706", border: "#fcd34d", icon: <AlertTriangle size={15} /> },
    low:    { label: "TEMİZ",          bg: "#f0fdf4", text: "#16a34a", border: "#86efac", icon: <CheckCircle size={15} /> },
  }[risk];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: cfg.text, background: cfg.bg, border: `1.5px solid ${cfg.border}`, padding: "6px 14px", borderRadius: 99 }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function Row({ label, value, sub, ok }: { label: string; value: string; sub?: string; ok?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #f1f5f9", gap: 12 }}>
      <span style={{ fontSize: 13, color: "#64748b", flexShrink: 0 }}>{label}</span>
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: ok === false ? "#dc2626" : ok === true ? "#16a34a" : "#1e293b" }}>{value}</span>
        {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function FortigateChecker() {
  const [ip, setIp] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function check() {
    const val = ip.trim();
    if (!val) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const r = await fetch("/api/admin/security-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: val }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error ?? "Hata"); } else { setResult(d); }
    } catch { setError("Bağlantı hatası"); }
    setLoading(false);
  }

  const RiskIcon = result
    ? result.risk === "high"   ? ShieldAlert
    : result.risk === "medium" ? ShieldQuestion
    : ShieldCheck
    : ShieldQuestion;

  const riskColor = result
    ? result.risk === "high"   ? "#dc2626"
    : result.risk === "medium" ? "#d97706"
    : "#16a34a"
    : "#94a3b8";

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "18px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldAlert size={20} color="#dc2626" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>FortiGate IP Güvenlik Kontrolü</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Müşteri cihazını threat feed ve güvenlik veritabanlarında sorgula</div>
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: "20px 22px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={ip}
            onChange={e => { setIp(e.target.value); setResult(null); setError(null); }}
            onKeyDown={e => e.key === "Enter" && check()}
            placeholder="Müşteri FortiGate IP adresi  (ör. 185.220.101.45)"
            style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "monospace,sans-serif", outline: "none", color: "#1e293b" }}
            onFocus={e => (e.target.style.borderColor = "#6366f1")}
            onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
          />
          <button
            onClick={check}
            disabled={loading || !ip.trim()}
            style={{ padding: "11px 20px", borderRadius: 10, border: "none", background: loading ? "#e2e8f0" : "#6366f1", color: loading ? "#94a3b8" : "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
          >
            <Search size={14} />
            {loading ? "Kontrol ediliyor…" : "Kontrol Et"}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>
            {error}
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div style={{ padding: "20px 22px" }}>
          {/* Risk summary */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, padding: "16px 20px", background: result.risk === "high" ? "#fef2f2" : result.risk === "medium" ? "#fffbeb" : "#f0fdf4", borderRadius: 12, border: `1.5px solid ${riskColor}30` }}>
            <RiskIcon size={32} color={riskColor} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                {result.ip}
              </div>
              <RiskBadge risk={result.risk} />
            </div>
            <a
              href={`https://www.shodan.io/host/${result.ip}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6366f1", textDecoration: "none", padding: "6px 12px", border: "1px solid #c7d2fe", borderRadius: 8, background: "#eef2ff", whiteSpace: "nowrap" }}
            >
              <ExternalLink size={11} /> Shodan'da Aç
            </a>
          </div>

          {/* Kendi feed'lerimiz */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: ".04em", marginBottom: 8 }}>LİDER NETWORK THREAT FEED</div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "4px 14px" }}>
              <Row
                label="Zararlı IP listesinde"
                value={result.ownFeeds.found ? `Evet — ${result.ownFeeds.feeds.join(", ")} feed'inde` : "Hayır, listede yok"}
                ok={!result.ownFeeds.found}
              />
            </div>
          </div>

          {/* GreyNoise */}
          {result.greyNoise?.available && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: ".04em", marginBottom: 8 }}>GREYNOISE</div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "4px 14px" }}>
                <Row label="İnternet tarayıcısı" value={result.greyNoise.noise ? "Evet" : "Hayır"} ok={!result.greyNoise.noise} />
                {result.greyNoise.noise && (
                  <Row label="Sınıflandırma" value={result.greyNoise.classification ?? "—"} ok={result.greyNoise.classification === "benign"} />
                )}
                {result.greyNoise.name && (
                  <Row label="İsim" value={result.greyNoise.name} />
                )}
                {!result.greyNoise.noise && result.greyNoise.message && (
                  <Row label="Durum" value={result.greyNoise.message} ok={true} />
                )}
              </div>
            </div>
          )}

          {/* AbuseIPDB */}
          {result.abuseIPDB?.available && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: ".04em", marginBottom: 8 }}>ABUSEIPDB</div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "4px 14px" }}>
                <Row
                  label="Güven skoru"
                  value={`%${result.abuseIPDB.score}`}
                  ok={(result.abuseIPDB.score ?? 0) === 0}
                  sub="0% = temiz, 100% = kesinlikle zararlı"
                />
                <Row label="Raporlama sayısı" value={String(result.abuseIPDB.totalReports ?? 0)} ok={(result.abuseIPDB.totalReports ?? 0) === 0} />
                {result.abuseIPDB.lastReported && (
                  <Row label="Son raporlama" value={new Date(result.abuseIPDB.lastReported).toLocaleDateString("tr-TR")} />
                )}
              </div>
            </div>
          )}

          {/* API key uyarıları */}
          {(!result.greyNoise && !result.abuseIPDB) && (
            <div style={{ padding: "12px 16px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, fontSize: 12, color: "#92400e" }}>
              <strong>İpucu:</strong> Daha kapsamlı sonuçlar için <code>GREYNOISE_API_KEY</code> ve <code>ABUSEIPDB_API_KEY</code> env değişkenlerini tanımlayın. (Her ikisi de ücretsiz kayıt ile alınabilir.)
            </div>
          )}
        </div>
      )}

      {/* Boş durum */}
      {!result && !loading && !error && (
        <div style={{ padding: "32px 22px", textAlign: "center", color: "#94a3b8" }}>
          <ShieldQuestion size={36} style={{ margin: "0 auto 10px", display: "block", opacity: .4 }} />
          <div style={{ fontSize: 13 }}>Kontrol etmek istediğin müşteri FortiGate IP adresini gir</div>
        </div>
      )}
    </div>
  );
}
