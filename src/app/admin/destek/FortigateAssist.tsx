"use client";

import { useState, useRef, useEffect } from "react";
import { Shield, Sparkles, Copy, Check, AlertTriangle, Terminal, MousePointerClick, BookOpen } from "lucide-react";

interface Step { baslik: string; aciklama: string; gui?: string | null; cli?: string[] }
interface Result {
  ozet: string; olasiSebepler: string[]; adimlar: Step[];
  diyagram?: string; uyari?: string | null;
  relatedPosts: { slug: string; title: string }[];
}

const EXAMPLES = [
  "SSL VPN bağlanıyor ama iç ağa erişemiyor",
  "FortiGate internete çıkmıyor, politika ve NAT doğru",
  "Web filter HTTPS sitelerde çalışmıyor",
  "Site-to-site IPsec VPN tünel kalkmıyor (phase 2)",
  "FortiGate yüksek CPU kullanıyor, yavaşlık var",
];

let mermaidId = 0;

function MermaidDiagram({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });
        const { svg } = await mermaid.render(`fg-mmd-${++mermaidId}`, code);
        if (active && ref.current) ref.current.innerHTML = svg;
      } catch { if (active) setErr(true); }
    })();
    return () => { active = false; };
  }, [code]);
  if (err) return <pre style={{ fontSize: "12px", color: "#64748b", whiteSpace: "pre-wrap", background: "#f8fafc", padding: "12px", borderRadius: "8px" }}>{code}</pre>;
  return <div ref={ref} style={{ overflowX: "auto", textAlign: "center" }} />;
}

function CliBlock({ cmds }: { cmds: string[] }) {
  const [copied, setCopied] = useState(false);
  const text = cmds.join("\n");
  function copy() { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  return (
    <div style={{ position: "relative", marginTop: "8px" }}>
      <pre style={{ background: "#0f172a", color: "#e2e8f0", padding: "12px 14px", borderRadius: "9px", fontSize: "12.5px", overflowX: "auto", margin: 0, fontFamily: "ui-monospace,Menlo,Consolas,monospace", lineHeight: 1.6 }}>{text}</pre>
      <button onClick={copy} title="Komutları kopyala" style={{ position: "absolute", top: "8px", right: "8px", display: "flex", alignItems: "center", gap: "5px", background: copied ? "#16a34a" : "rgba(255,255,255,.12)", color: "#fff", border: "none", borderRadius: "6px", padding: "4px 9px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
        {copied ? <><Check size={12} /> Kopyalandı</> : <><Copy size={12} /> Kopyala</>}
      </button>
    </div>
  );
}

export default function FortigateAssist() {
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function run(text?: string) {
    const p = (text ?? problem).trim();
    if (!p) return;
    if (text) setProblem(text);
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await fetch("/api/admin/fortigate-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ problem: p }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Hata");
      setResult(d);
    } catch (e) { setError(e instanceof Error ? e.message : "Hata"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ marginBottom: "18px" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 800, color: "#1a1d2e", display: "flex", alignItems: "center", gap: "9px" }}>
          <span style={{ width: 34, height: 34, borderRadius: "9px", background: "linear-gradient(135deg,#EE3124,#b91c1c)", display: "flex", alignItems: "center", justifyContent: "center" }}><Shield size={19} color="#fff" /></span>
          FortiGate Destek Asistanı
        </h2>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Sorunu yaz, adım adım çözüm yolu + akış diyagramı + ilgili kaynaklar üretilsin.</p>
      </div>

      {/* Giriş */}
      <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderTop: "3px solid #EE3124", borderRadius: "13px", padding: "16px" }}>
        <textarea value={problem} onChange={e => setProblem(e.target.value)} rows={3} placeholder="Örn: SSL VPN bağlanıyor ama iç ağdaki sunucuya erişemiyorum…"
          onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") run(); }}
          style={{ width: "100%", border: "1.5px solid #cbd5e1", borderRadius: "9px", padding: "11px 13px", fontSize: "14px", color: "#1a1d2e", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>İpucu: Ctrl+Enter ile gönder</span>
          <button onClick={() => run()} disabled={loading || !problem.trim()} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 20px", borderRadius: "10px", border: "none", background: loading || !problem.trim() ? "#e2e8f0" : "linear-gradient(135deg,#EE3124,#b91c1c)", color: loading || !problem.trim() ? "#94a3b8" : "#fff", fontSize: "14px", fontWeight: 700, cursor: loading || !problem.trim() ? "not-allowed" : "pointer" }}>
            {loading ? <>Üretiliyor…</> : <><Sparkles size={16} /> Çözüm Üret</>}
          </button>
        </div>
        {/* Örnekler */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => run(ex)} disabled={loading} style={{ fontSize: "11.5px", padding: "5px 11px", borderRadius: "20px", border: "1px solid #e5e7ef", background: "#f8fafc", color: "#475569", cursor: "pointer" }}>{ex}</button>
          ))}
        </div>
      </div>

      {error && <div style={{ marginTop: "16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 14px", color: "#dc2626", fontSize: "13px", fontWeight: 500 }}>⚠️ {error}</div>}

      {loading && <div style={{ marginTop: "20px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>🔧 FortiGate uzmanı çözüm hazırlıyor…</div>}

      {result && (
        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Özet */}
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "16px 18px" }}>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#0052ff", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "6px" }}>Özet</div>
            <p style={{ margin: 0, fontSize: "14.5px", color: "#1a1d2e", lineHeight: 1.6 }}>{result.ozet}</p>
          </div>

          {result.uyari && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "13px 16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <AlertTriangle size={17} color="#d97706" style={{ flexShrink: 0, marginTop: "1px" }} />
              <p style={{ margin: 0, fontSize: "13px", color: "#92400e", lineHeight: 1.55 }}>{result.uyari}</p>
            </div>
          )}

          {/* Olası sebepler */}
          {result.olasiSebepler?.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "12px", padding: "16px 18px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a1d2e", marginBottom: "10px" }}>🔍 Olası Sebepler</div>
              <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {result.olasiSebepler.map((s, i) => <li key={i} style={{ fontSize: "13.5px", color: "#374151", lineHeight: 1.5 }}>{s}</li>)}
              </ul>
            </div>
          )}

          {/* Adımlar */}
          {result.adimlar?.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "12px", padding: "16px 18px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a1d2e", marginBottom: "12px" }}>🛠️ Çözüm Adımları</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {result.adimlar.map((st, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px" }}>
                    <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: "#EE3124", color: "#fff", fontSize: "13px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1d2e" }}>{st.baslik}</div>
                      {st.aciklama && <div style={{ fontSize: "13.5px", color: "#475569", marginTop: "3px", lineHeight: 1.55 }}>{st.aciklama}</div>}
                      {st.gui && <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "7px", fontSize: "12px", color: "#7c3aed", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "6px", padding: "4px 9px", fontWeight: 600 }}><MousePointerClick size={12} /> {st.gui}</div>}
                      {st.cli && st.cli.length > 0 && <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "8px", fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}><Terminal size={12} /> CLI</div>}
                      {st.cli && st.cli.length > 0 && <CliBlock cmds={st.cli} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Akış diyagramı */}
          {result.diyagram && (
            <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "12px", padding: "16px 18px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a1d2e", marginBottom: "12px" }}>🗺️ Çözüm Akışı</div>
              <MermaidDiagram code={result.diyagram} />
            </div>
          )}

          {/* İlgili kaynaklar */}
          {result.relatedPosts?.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "12px", padding: "16px 18px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a1d2e", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}><BookOpen size={15} color="#15803d" /> İlgili Kaynaklar (Blog)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {result.relatedPosts.map(p => (
                  <a key={p.slug} href={`/tr/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13.5px", color: "#0052ff", textDecoration: "none", fontWeight: 600 }}>→ {p.title}</a>
                ))}
              </div>
            </div>
          )}

          <p style={{ fontSize: "11.5px", color: "#9ca3af", margin: "0 0 8px", lineHeight: 1.5 }}>⚠️ Yapay zeka tarafından üretilmiştir; kritik işlemlerden önce doğrulayın ve yapılandırma yedeği alın.</p>
        </div>
      )}
    </div>
  );
}
