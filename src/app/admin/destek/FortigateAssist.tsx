"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Shield, Sparkles, Copy, Check, AlertTriangle, Terminal, MousePointerClick, BookOpen, Image as ImageIcon, Upload, Trash2, X, Search } from "lucide-react";

interface Step { baslik: string; aciklama: string; gui?: string | null; cli?: string[]; gorsel?: { url: string; title: string } }
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
  const [subTab, setSubTab] = useState<"asistan" | "gecmis" | "kutuphane">("asistan");
  const [lightbox, setLightbox] = useState<string | null>(null);
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
      {/* Alt sekme: Asistan / Ekran Görüntüleri */}
      <div style={{ display: "flex", gap: "6px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "11px", padding: "4px", width: "fit-content", marginBottom: "18px", flexWrap: "wrap" }}>
        {([["asistan", "🛡️ Asistan"], ["gecmis", "🕘 Geçmiş"], ["kutuphane", "📸 Ekran Görüntüleri"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setSubTab(id)} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: subTab === id ? 700 : 500, cursor: "pointer", background: subTab === id ? "linear-gradient(135deg,#EE3124,#b91c1c)" : "transparent", color: subTab === id ? "#fff" : "#64748b" }}>{label}</button>
        ))}
      </div>

      {subTab === "kutuphane" ? <ScreenshotLibrary onPreview={setLightbox} /> :
       subTab === "gecmis" ? <SolutionHistory onOpen={(p, res) => { setProblem(p); setResult(res); setError(""); setSubTab("asistan"); }} /> : (
      <>
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
                      {st.gui && (
                        <div style={{ marginTop: "9px", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "9px", padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: "4px" }}><MousePointerClick size={13} /> FortiGate Arayüzünde</div>
                          <div style={{ fontSize: "13.5px", color: "#4c1d95", fontWeight: 600, lineHeight: 1.5 }}>{st.gui}</div>
                        </div>
                      )}
                      {st.gorsel && (
                        <div style={{ marginTop: "9px" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={st.gorsel.url} alt={st.gorsel.title} onClick={() => setLightbox(st.gorsel!.url)} style={{ maxWidth: "100%", maxHeight: "260px", borderRadius: "9px", border: "1px solid #e5e7ef", cursor: "zoom-in", display: "block" }} />
                          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}><ImageIcon size={11} /> {st.gorsel.title}</div>
                        </div>
                      )}
                      {st.cli && st.cli.length > 0 && (
                        <details style={{ marginTop: "8px" }}>
                          <summary style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: "#94a3b8", fontWeight: 600, cursor: "pointer", listStyle: "none" }}><Terminal size={12} /> CLI alternatifi (göster)</summary>
                          <CliBlock cmds={st.cli} />
                        </details>
                      )}
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
      </>
      )}

      {/* Görsel büyütme (lightbox) */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", cursor: "zoom-out" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Ekran görüntüsü" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: "8px", boxShadow: "0 20px 60px rgba(0,0,0,.5)" }} />
          <button onClick={() => setLightbox(null)} style={{ position: "fixed", top: 18, right: 18, background: "rgba(255,255,255,.15)", border: "none", color: "#fff", borderRadius: "8px", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={20} /></button>
        </div>
      )}
    </div>
  );
}

interface HistItem { id: string; problem: string; created_by?: string | null; created_at: string }

function SolutionHistory({ onOpen }: { onOpen: (problem: string, result: Result) => void }) {
  const [list, setList] = useState<HistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [opening, setOpening] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/fg-solutions");
    if (r.ok) setList((await r.json()).solutions || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function open(id: string) {
    setOpening(id);
    const r = await fetch(`/api/admin/fg-solutions?id=${id}`);
    setOpening(null);
    if (r.ok) { const d = await r.json(); onOpen(d.problem, d.result as Result); }
    else alert("Kayıt açılamadı");
  }
  async function del(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Bu çözüm kaydını silmek istiyor musunuz?")) return;
    await fetch("/api/admin/fg-solutions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setList(p => p.filter(s => s.id !== id));
  }

  const filtered = list.filter(s => { const t = q.trim().toLowerCase(); return !t || s.problem.toLowerCase().includes(t); });
  const fmt = (s: string) => new Date(s).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h2 style={{ margin: "0 0 3px", fontSize: "20px", fontWeight: 800, color: "#1a1d2e" }}>🕘 Çözüm Geçmişi</h2>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Daha önce sorulan sorunlar ve üretilen çözümler. Tıklayınca tekrar açılır.</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1.5px solid #cbd5e1", borderRadius: "10px", padding: "0 12px", background: "#fff", marginBottom: "16px", maxWidth: "400px" }}>
        <Search size={15} color="#64748b" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Geçmişte ara…" style={{ flex: 1, border: "none", background: "transparent", padding: "10px 0", fontSize: "13px", color: "#1a1d2e", outline: "none" }} />
      </div>

      {loading ? <p style={{ color: "#94a3b8" }}>Yükleniyor…</p> : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", color: "#94a3b8" }}>
          <p style={{ fontSize: "14px", margin: 0 }}>{q ? "Aramaya uygun kayıt yok." : "Henüz kayıt yok. Asistan'da bir soru sorun."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
          {filtered.map(s => (
            <div key={s.id} onClick={() => open(s.id)} style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "11px", padding: "13px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#fff7f6")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a1d2e", lineHeight: 1.4 }}>{s.problem}</div>
                <div style={{ fontSize: "11.5px", color: "#9ca3af", marginTop: "3px" }}>{fmt(s.created_at)}{s.created_by ? ` · ${s.created_by}` : ""}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                {opening === s.id && <span style={{ fontSize: "11px", color: "#94a3b8" }}>Açılıyor…</span>}
                <button onClick={e => del(s.id, e)} title="Sil" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "7px", padding: "5px 7px", cursor: "pointer" }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Shot { id: string; title: string; tags?: string | null; menu_path?: string | null; image_url: string; created_at: string }

function ScreenshotLibrary({ onPreview }: { onPreview: (url: string) => void }) {
  const [list, setList] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [menuPath, setMenuPath] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/fg-screenshots");
    if (r.ok) setList((await r.json()).screenshots || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function upload() {
    if (!file) { alert("Görsel seçin"); return; }
    if (!title.trim()) { alert("Başlık girin"); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file); fd.append("title", title); fd.append("tags", tags); fd.append("menu_path", menuPath);
    const r = await fetch("/api/admin/fg-screenshots", { method: "POST", body: fd });
    setUploading(false);
    if (r.ok) {
      setTitle(""); setTags(""); setMenuPath(""); setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      load();
    } else alert("Yüklenemedi: " + ((await r.json().catch(() => ({}))).error || "hata"));
  }

  async function del(id: string) {
    if (!confirm("Bu ekran görüntüsünü silmek istiyor musunuz?")) return;
    await fetch("/api/admin/fg-screenshots", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setList(p => p.filter(s => s.id !== id));
  }

  const filtered = list.filter(s => { const t = q.trim().toLowerCase(); return !t || `${s.title} ${s.tags || ""} ${s.menu_path || ""}`.toLowerCase().includes(t); });
  const inp = { padding: "9px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", color: "#1a1d2e", outline: "none", width: "100%", boxSizing: "border-box" as const };
  const lbl = { fontSize: "11px", fontWeight: 800 as const, color: "#334155", display: "block", marginBottom: "5px", textTransform: "uppercase" as const, letterSpacing: ".3px" };

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h2 style={{ margin: "0 0 3px", fontSize: "20px", fontWeight: 800, color: "#1a1d2e" }}>📸 Ekran Görüntüsü Kütüphanesi</h2>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>FortiGate arayüz görsellerini etiketleyerek yükleyin; asistan ilgili adıma otomatik gösterir.</p>
      </div>

      {/* Yükleme */}
      <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderTop: "3px solid #EE3124", borderRadius: "13px", padding: "16px", marginBottom: "18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div><label style={lbl}>Başlık *</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="ör. IPsec Phase 2 Selector ekranı" style={inp} /></div>
          <div><label style={lbl}>Menü Yolu</label><input value={menuPath} onChange={e => setMenuPath(e.target.value)} placeholder="VPN > IPsec Tunnels > Phase 2" style={inp} /></div>
        </div>
        <div style={{ marginBottom: "12px" }}><label style={lbl}>Etiketler (boşlukla ayır)</label><input value={tags} onChange={e => setTags(e.target.value)} placeholder="ipsec vpn phase2 selector dns split tunnel forticlient" style={inp} /></div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} style={{ fontSize: "13px" }} />
          <button onClick={upload} disabled={uploading || !file || !title.trim()} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 18px", borderRadius: "10px", border: "none", background: uploading || !file || !title.trim() ? "#e2e8f0" : "linear-gradient(135deg,#EE3124,#b91c1c)", color: uploading || !file || !title.trim() ? "#94a3b8" : "#fff", fontSize: "13px", fontWeight: 700, cursor: uploading || !file || !title.trim() ? "not-allowed" : "pointer" }}>
            {uploading ? "Yükleniyor…" : <><Upload size={15} /> Yükle</>}
          </button>
        </div>
        <p style={{ fontSize: "11px", color: "#9ca3af", margin: "10px 2px 0", lineHeight: 1.5 }}>💡 İyi etiketleme = iyi eşleşme. Asistan, etiket/menü yolu/başlık ile adımları karşılaştırır.</p>
      </div>

      {/* Arama */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1.5px solid #cbd5e1", borderRadius: "10px", padding: "0 12px", background: "#fff", marginBottom: "16px", maxWidth: "360px" }}>
        <Search size={15} color="#64748b" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Görsellerde ara…" style={{ flex: 1, border: "none", background: "transparent", padding: "10px 0", fontSize: "13px", color: "#1a1d2e", outline: "none" }} />
      </div>

      {loading ? <p style={{ color: "#94a3b8" }}>Yükleniyor…</p> : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", color: "#94a3b8" }}>
          <ImageIcon size={36} color="#cbd5e1" style={{ marginBottom: "10px" }} />
          <p style={{ fontSize: "14px", margin: 0 }}>{q ? "Aramaya uygun görsel yok." : "Henüz görsel yok. Yukarıdan yükleyin."}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "14px" }}>
          {filtered.map(s => (
            <div key={s.id} style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "12px", overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image_url} alt={s.title} onClick={() => onPreview(s.image_url)} style={{ width: "100%", height: "130px", objectFit: "cover", cursor: "zoom-in", display: "block", background: "#f1f5f9" }} />
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a1d2e", lineHeight: 1.35 }}>{s.title}</div>
                {s.menu_path && <div style={{ fontSize: "11px", color: "#7c3aed", marginTop: "3px" }}>{s.menu_path}</div>}
                {s.tags && <div style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: "4px", lineHeight: 1.4 }}>{s.tags}</div>}
                <button onClick={() => del(s.id)} style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "5px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "6px", padding: "4px 9px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}><Trash2 size={11} /> Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
