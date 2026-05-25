"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Ticket } from "@/lib/supabase";

// ── helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "az önce";
  if (d < 3600) return `${Math.floor(d / 60)}dk`;
  if (d < 86400) return `${Math.floor(d / 3600)}s`;
  return `${Math.floor(d / 86400)}g`;
}

function slaDue(t: Ticket): { label: string; color: string } {
  if (t.status === "resolved" || t.status === "closed") return { label: "Tamamlandı", color: "#22c55e" };
  const slaH: Record<string, number> = { urgent: 2, high: 4, medium: 8, low: 24 };
  const rem = (slaH[t.priority] ?? 8) - (Date.now() - new Date(t.created_at).getTime()) / 3600000;
  if (rem < 0)  return { label: `${Math.abs(Math.round(rem))}s gecikti`, color: "#ef4444" };
  if (rem < 1)  return { label: `${Math.round(rem * 60)}dk kaldı`, color: "#f97316" };
  return { label: `${Math.round(rem)}s kaldı`, color: "#22c55e" };
}

const STATUS_LABEL: Record<string, string>  = { open: "Açık", in_progress: "İşlemde", resolved: "Çözüldü", closed: "Kapalı" };
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  open:        { bg: "rgba(0,82,255,.15)",    text: "#93c5fd" },
  in_progress: { bg: "rgba(124,58,237,.15)",  text: "#c4b5fd" },
  resolved:    { bg: "rgba(22,163,74,.15)",   text: "#86efac" },
  closed:      { bg: "rgba(71,85,105,.2)",    text: "#94a3b8" },
};
const PRI_LABEL: Record<string, string>  = { low: "Düşük", medium: "Orta", high: "Yüksek", urgent: "ACİL" };
const PRI_COLOR: Record<string, string>  = { low: "#64748b", medium: "#d97706", high: "#ea580c", urgent: "#dc2626" };
const CAT_LABEL: Record<string, string>  = { technical: "Teknik", billing: "Fatura", general: "Genel", feature_request: "Özellik" };

interface Stats {
  open: number; in_progress: number; resolved_today: number;
  total: number; urgent: number; avg_response_min: number | null;
}

interface Customer {
  id: string; full_name: string; company: string | null;
  phone: string | null; email: string; approved: boolean; created_at: string;
}

// ── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", padding: "18px 22px", flex: 1, minWidth: 0, borderTop: accent ? `3px solid ${accent}` : undefined }}>
      <p style={{ color: "var(--color-outline)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", margin: 0 }}>{label}</p>
      <p style={{ fontSize: "30px", fontWeight: 800, color: accent || "var(--color-on-surface)", margin: "6px 0 0", fontFamily: "var(--font-family-headline)" }}>{value}</p>
      {sub && <p style={{ fontSize: "11px", color: "var(--color-outline)", marginTop: "2px" }}>{sub}</p>}
    </div>
  );
}

// ── FilterBtn ────────────────────────────────────────────────────────────────
function Fbtn({ val, cur, set, label }: { val: string; cur: string; set: (v: string) => void; label: string }) {
  const active = cur === val;
  return (
    <button onClick={() => set(val)} style={{ padding: "5px 13px", borderRadius: "6px", border: "1px solid", borderColor: active ? "var(--color-primary-container)" : "var(--color-outline-variant)", background: active ? "rgba(0,82,255,.12)" : "transparent", color: active ? "var(--color-primary)" : "var(--color-outline)", fontSize: "13px", fontWeight: active ? 700 : 400, cursor: "pointer" }}>
      {label}
    </button>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"tickets" | "customers" | "reports">("tickets");

  // Tickets state
  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [stats, setStats]       = useState<Stats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [statusF, setStatusF]   = useState("all");
  const [priorityF, setPriorityF] = useState("all");
  const [categoryF, setCategoryF] = useState("all");
  const [dateF, setDateF]       = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]     = useState("");

  // Customers state
  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [custFilter, setCustFilter] = useState("all");
  const [custLoading, setCustLoading] = useState(false);

  // ── Fetch tickets ─────────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ limit: "50" });
    if (statusF !== "all")   p.set("status", statusF);
    if (priorityF !== "all") p.set("priority", priorityF);
    if (search)              p.set("q", search);

    const res = await fetch(`/api/tickets?${p}`);
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();

    let list: Ticket[] = data.tickets || [];

    // Client-side category & date filters (not in API)
    if (categoryF !== "all") list = list.filter((t) => t.category === categoryF);
    if (dateF !== "all") {
      const cutoff = new Date();
      if (dateF === "today") cutoff.setHours(0, 0, 0, 0);
      if (dateF === "week")  cutoff.setDate(cutoff.getDate() - 7);
      if (dateF === "month") cutoff.setDate(cutoff.getDate() - 30);
      list = list.filter((t) => new Date(t.created_at) >= cutoff);
    }

    setTickets(list);
    setTotal(list.length);
    setLoading(false);
  }, [statusF, priorityF, categoryF, dateF, search, router]);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const fetchCustomers = useCallback(async () => {
    setCustLoading(true);
    const res = await fetch(`/api/admin/customers?filter=${custFilter}`);
    if (res.ok) setCustomers((await res.json()).customers || []);
    setCustLoading(false);
  }, [custFilter]);

  useEffect(() => { fetchTickets(); fetchStats(); }, [fetchTickets, fetchStats]);
  useEffect(() => { if (tab === "customers") fetchCustomers(); }, [tab, fetchCustomers]);

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  async function handleCustomerAction(id: string, action: "approve" | "reject") {
    const res = await fetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) fetchCustomers();
  }

  // ── Category report data ──────────────────────────────────────
  const catCounts = ["technical", "billing", "general", "feature_request"].map((cat) => ({
    cat, label: CAT_LABEL[cat],
    count: tickets.filter((t) => t.category === cat).length,
  }));
  const maxCat = Math.max(...catCounts.map((c) => c.count), 1);

  // ── Status report data ────────────────────────────────────────
  const statusCounts = ["open", "in_progress", "resolved", "closed"].map((s) => ({
    s, label: STATUS_LABEL[s],
    count: tickets.filter((t) => t.status === s).length,
    color: STATUS_COLOR[s].text,
  }));

  // ── 7-day daily chart ─────────────────────────────────────────
  const days7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0);
    const end = new Date(d); end.setDate(end.getDate() + 1);
    return {
      label: d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }),
      count: tickets.filter((t) => { const dt = new Date(t.created_at); return dt >= d && dt < end; }).length,
    };
  });
  const maxDay = Math.max(...days7.map((d) => d.count), 1);

  const pending = customers.filter((c) => !c.approved).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-outline-variant)", padding: "0 28px", display: "flex", alignItems: "center", gap: "12px", height: "58px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
          <div style={{ width: 30, height: 30, background: "var(--color-primary-container)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/><path d="M12 12l-9-5M12 12l9-5M12 12v10" stroke="#fff" strokeWidth="2"/></svg>
          </div>
          <span style={{ fontFamily: "var(--font-family-headline)", fontWeight: 700, color: "var(--color-on-surface)", fontSize: "14px" }}>Lider Network</span>
          <span style={{ color: "var(--color-outline-variant)" }}>·</span>
          <span style={{ color: "var(--color-outline)", fontSize: "13px" }}>Destek Yönetimi</span>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px" }}>
          {(["tickets", "customers", "reports"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 16px", borderRadius: "6px", border: "none", background: tab === t ? "rgba(0,82,255,.15)" : "transparent", color: tab === t ? "var(--color-primary)" : "var(--color-outline)", fontSize: "13px", fontWeight: tab === t ? 700 : 400, cursor: "pointer" }}>
              {t === "tickets" ? `Talepler${total ? ` (${total})` : ""}` : t === "customers" ? `Müşteriler${pending > 0 ? ` 🔴${pending}` : ""}` : "Raporlar"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => { fetchTickets(); fetchStats(); }} style={{ padding: "5px 12px", border: "1px solid var(--color-outline-variant)", borderRadius: "6px", background: "transparent", color: "var(--color-outline)", fontSize: "13px", cursor: "pointer" }}>↻ Yenile</button>
          <button onClick={logout} style={{ padding: "5px 12px", border: "1px solid var(--color-outline-variant)", borderRadius: "6px", background: "transparent", color: "var(--color-outline)", fontSize: "13px", cursor: "pointer" }}>Çıkış</button>
        </div>
      </header>

      <main style={{ flex: 1, padding: "24px 28px", maxWidth: "1440px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

        {/* ── TICKETS TAB ── */}
        {tab === "tickets" && (
          <>
            {/* Stats */}
            {stats && (
              <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                <StatCard label="Açık Talepler"  value={stats.open}          accent="#0052ff" />
                <StatCard label="İşlemde"         value={stats.in_progress}   accent="#7c3aed" />
                <StatCard label="Bugün Çözüldü"   value={stats.resolved_today} accent="#16a34a" />
                <StatCard label="Acil"            value={stats.urgent}        accent="#dc2626" />
                <StatCard label="Toplam"          value={stats.total}         />
                <StatCard
                  label="Ort. İlk Yanıt"
                  value={stats.avg_response_min != null
                    ? stats.avg_response_min < 60 ? `${stats.avg_response_min}dk` : `${(stats.avg_response_min / 60).toFixed(1)}s`
                    : "—"}
                  sub="son 50 talep"
                />
              </div>
            )}

            {/* Filter bar */}
            <div style={{ background: "var(--color-surface)", borderRadius: "12px", border: "1px solid var(--color-outline-variant)", padding: "14px 18px", marginBottom: "14px" }}>
              {/* Row 1: Status + Priority */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px", minWidth: "52px" }}>Durum</span>
                {[["all","Tümü"],["open","Açık"],["in_progress","İşlemde"],["resolved","Çözüldü"],["closed","Kapalı"]].map(([v,l]) => (
                  <Fbtn key={v} val={v} cur={statusF} set={setStatusF} label={l} />
                ))}
              </div>
              {/* Row 2: Priority + Category */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px", minWidth: "52px" }}>Öncelik</span>
                {[["all","Tümü"],["urgent","ACİL"],["high","Yüksek"],["medium","Orta"],["low","Düşük"]].map(([v,l]) => (
                  <Fbtn key={v} val={v} cur={priorityF} set={setPriorityF} label={l} />
                ))}
              </div>
              {/* Row 3: Category + Date */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px", minWidth: "52px" }}>Kategori</span>
                {[["all","Tümü"],["technical","Teknik"],["billing","Fatura"],["general","Genel"],["feature_request","Özellik"]].map(([v,l]) => (
                  <Fbtn key={v} val={v} cur={categoryF} set={setCategoryF} label={l} />
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px", minWidth: "52px" }}>Tarih</span>
                {[["all","Tümü"],["today","Bugün"],["week","Son 7 Gün"],["month","Son 30 Gün"]].map(([v,l]) => (
                  <Fbtn key={v} val={v} cur={dateF} set={setDateF} label={l} />
                ))}
                <div style={{ flex: 1, minWidth: "200px", display: "flex", gap: "8px" }}>
                  <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} style={{ flex: 1, display: "flex", gap: "6px" }}>
                    <input value={searchInput} onChange={(e) => { setSearchInput(e.target.value); if (!e.target.value) setSearch(""); }}
                      placeholder="Müşteri, konu, e-posta..."
                      style={{ flex: 1, padding: "6px 12px", background: "var(--color-surface-high)", border: "1px solid var(--color-outline-variant)", borderRadius: "6px", color: "var(--color-on-surface)", fontSize: "13px", outline: "none" }}
                    />
                    <button type="submit" style={{ padding: "6px 12px", background: "var(--color-primary-container)", border: "none", borderRadius: "6px", color: "#fff", fontSize: "13px", cursor: "pointer" }}>Ara</button>
                  </form>
                </div>
              </div>
              <p style={{ color: "var(--color-outline)", fontSize: "12px", marginTop: "10px", marginBottom: 0 }}>{total} talep listeleniyor</p>
            </div>

            {/* Tickets table */}
            <div style={{ background: "var(--color-surface)", borderRadius: "12px", border: "1px solid var(--color-outline-variant)", overflow: "hidden" }}>
              {loading ? (
                <div style={{ padding: "48px", textAlign: "center", color: "var(--color-outline)" }}>Yükleniyor...</div>
              ) : tickets.length === 0 ? (
                <div style={{ padding: "48px", textAlign: "center", color: "var(--color-outline)" }}>Talep bulunamadı</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-outline-variant)" }}>
                        {["#No","Müşteri","Konu","Kategori","Öncelik","Durum","SLA","Tarih",""].map((h) => (
                          <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((t) => {
                        const sla = slaDue(t);
                        const sc  = STATUS_COLOR[t.status];
                        return (
                          <tr key={t.id} onClick={() => router.push(`/admin/destek/${t.id}`)}
                            style={{ borderBottom: "1px solid var(--color-outline-variant)", cursor: "pointer" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-high)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <td style={{ padding: "13px 14px", fontSize: "12px", fontWeight: 700, color: "var(--color-primary)", fontFamily: "var(--font-family-label)", whiteSpace: "nowrap" }}>#{String(t.ticket_number).padStart(4,"0")}</td>
                            <td style={{ padding: "13px 14px", minWidth: "150px" }}>
                              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--color-on-surface)" }}>{t.customer_name}</p>
                              {t.company && <p style={{ margin: 0, fontSize: "11px", color: "var(--color-outline)" }}>{t.company}</p>}
                            </td>
                            <td style={{ padding: "13px 14px", maxWidth: "240px" }}>
                              <p style={{ margin: 0, fontSize: "13px", color: "var(--color-on-surface)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</p>
                            </td>
                            <td style={{ padding: "13px 14px", fontSize: "12px", color: "var(--color-outline)", whiteSpace: "nowrap" }}>{CAT_LABEL[t.category]}</td>
                            <td style={{ padding: "13px 14px", whiteSpace: "nowrap" }}>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: PRI_COLOR[t.priority] }}>{PRI_LABEL[t.priority]}</span>
                            </td>
                            <td style={{ padding: "13px 14px", whiteSpace: "nowrap" }}>
                              <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: sc.bg, color: sc.text }}>{STATUS_LABEL[t.status]}</span>
                            </td>
                            <td style={{ padding: "13px 14px", whiteSpace: "nowrap" }}>
                              <span style={{ fontSize: "12px", fontWeight: 600, color: sla.color }}>● {sla.label}</span>
                            </td>
                            <td style={{ padding: "13px 14px", fontSize: "12px", color: "var(--color-outline)", whiteSpace: "nowrap" }}>{timeAgo(t.created_at)}</td>
                            <td style={{ padding: "13px 14px" }}>
                              <span style={{ fontSize: "12px", color: "var(--color-primary)", fontWeight: 600 }}>Aç →</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── CUSTOMERS TAB ── */}
        {tab === "customers" && (
          <>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
              {[["all","Tümü"],["pending","Onay Bekleyen"],["approved","Onaylı"]].map(([v,l]) => (
                <Fbtn key={v} val={v} cur={custFilter} set={setCustFilter} label={l} />
              ))}
              <button onClick={fetchCustomers} style={{ marginLeft: "auto", padding: "5px 12px", border: "1px solid var(--color-outline-variant)", borderRadius: "6px", background: "transparent", color: "var(--color-outline)", fontSize: "13px", cursor: "pointer" }}>↻ Yenile</button>
            </div>

            <div style={{ background: "var(--color-surface)", borderRadius: "12px", border: "1px solid var(--color-outline-variant)", overflow: "hidden" }}>
              {custLoading ? (
                <div style={{ padding: "48px", textAlign: "center", color: "var(--color-outline)" }}>Yükleniyor...</div>
              ) : customers.length === 0 ? (
                <div style={{ padding: "48px", textAlign: "center", color: "var(--color-outline)" }}>Kayıtlı müşteri bulunamadı</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-outline-variant)" }}>
                      {["Ad Soyad","Şirket","E-posta","Telefon","Durum","Kayıt Tarihi","İşlem"].map((h) => (
                        <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid var(--color-outline-variant)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-high)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "13px 16px", fontSize: "13px", fontWeight: 600, color: "var(--color-on-surface)" }}>{c.full_name}</td>
                        <td style={{ padding: "13px 16px", fontSize: "13px", color: "var(--color-outline)" }}>{c.company || "—"}</td>
                        <td style={{ padding: "13px 16px", fontSize: "12px", color: "var(--color-outline)" }}>{c.email}</td>
                        <td style={{ padding: "13px 16px", fontSize: "12px", color: "var(--color-outline)" }}>{c.phone || "—"}</td>
                        <td style={{ padding: "13px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: c.approved ? "rgba(22,163,74,.15)" : "rgba(217,119,6,.15)", color: c.approved ? "#86efac" : "#fbbf24" }}>
                            {c.approved ? "✓ Onaylı" : "⏱ Bekliyor"}
                          </span>
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: "12px", color: "var(--color-outline)" }}>
                          {new Date(c.created_at).toLocaleDateString("tr-TR")}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          {!c.approved ? (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => handleCustomerAction(c.id, "approve")}
                                style={{ padding: "5px 12px", background: "rgba(22,163,74,.15)", border: "1px solid rgba(22,163,74,.3)", borderRadius: "6px", color: "#86efac", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                                Onayla
                              </button>
                              <button onClick={() => { if (confirm(`${c.full_name} hesabını reddet ve sil?`)) handleCustomerAction(c.id, "reject"); }}
                                style={{ padding: "5px 12px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: "6px", color: "#f87171", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                                Reddet
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => { if (confirm(`${c.full_name} hesabını sil?`)) handleCustomerAction(c.id, "reject"); }}
                              style={{ padding: "5px 12px", background: "transparent", border: "1px solid var(--color-outline-variant)", borderRadius: "6px", color: "var(--color-outline)", fontSize: "12px", cursor: "pointer" }}>
                              Kaldır
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── REPORTS TAB ── */}
        {tab === "reports" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

            {/* Category breakdown */}
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", padding: "24px" }}>
              <h3 style={{ margin: "0 0 20px", fontFamily: "var(--font-family-headline)", fontSize: "15px", color: "var(--color-on-surface)" }}>Kategoriye Göre Talepler</h3>
              {catCounts.map((c) => (
                <div key={c.cat} style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <span style={{ fontSize: "13px", color: "var(--color-on-surface)" }}>{c.label}</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-primary)" }}>{c.count}</span>
                  </div>
                  <div style={{ height: "8px", background: "var(--color-surface-high)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(c.count / maxCat) * 100}%`, background: "var(--color-primary-container)", borderRadius: "4px", transition: "width .4s" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Status breakdown */}
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", padding: "24px" }}>
              <h3 style={{ margin: "0 0 20px", fontFamily: "var(--font-family-headline)", fontSize: "15px", color: "var(--color-on-surface)" }}>Duruma Göre Talepler</h3>
              {statusCounts.map((s) => (
                <div key={s.s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", marginBottom: "8px", background: "var(--color-surface-high)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "13px", color: "var(--color-on-surface)" }}>{s.label}</span>
                  <span style={{ fontSize: "22px", fontWeight: 800, color: s.color, fontFamily: "var(--font-family-headline)" }}>{s.count}</span>
                </div>
              ))}
            </div>

            {/* Daily chart — full width */}
            <div style={{ gridColumn: "1 / -1", background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", padding: "24px" }}>
              <h3 style={{ margin: "0 0 20px", fontFamily: "var(--font-family-headline)", fontSize: "15px", color: "var(--color-on-surface)" }}>Son 7 Günlük Talep Akışı</h3>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", height: "120px" }}>
                {days7.map((d) => (
                  <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: d.count > 0 ? "var(--color-primary)" : "var(--color-outline)" }}>{d.count}</span>
                    <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                      <div style={{ width: "100%", height: `${Math.max((d.count / maxDay) * 100, 4)}%`, background: d.count > 0 ? "var(--color-primary-container)" : "var(--color-surface-high)", borderRadius: "4px 4px 0 0", transition: "height .4s" }} />
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--color-outline)", whiteSpace: "nowrap" }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary cards */}
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {[
                { label: "Toplam Talep", value: tickets.length },
                { label: "Çözüm Oranı", value: `${tickets.length ? Math.round(((tickets.filter(t => t.status === "resolved" || t.status === "closed").length) / tickets.length) * 100) : 0}%` },
                { label: "Aktif Müşteri", value: customers.filter(c => c.approved).length },
                { label: "Onay Bekleyen", value: customers.filter(c => !c.approved).length },
              ].map((s) => (
                <div key={s.label} style={{ flex: 1, minWidth: "160px", background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", padding: "18px 20px" }}>
                  <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px" }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "var(--color-on-surface)", fontFamily: "var(--font-family-headline)" }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
