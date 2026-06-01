"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Ticket } from "@/lib/supabase";

// ── helpers ───────────────────────────────────────────────────────────────────
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

const STATUS_LABEL: Record<string, string> = { open: "Açık", in_progress: "İşlemde", resolved: "Çözüldü", closed: "Kapalı" };
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  open:        { bg: "rgba(0,82,255,.15)",   text: "#93c5fd" },
  in_progress: { bg: "rgba(124,58,237,.15)", text: "#c4b5fd" },
  resolved:    { bg: "rgba(22,163,74,.15)",  text: "#86efac" },
  closed:      { bg: "rgba(71,85,105,.2)",   text: "#94a3b8" },
};
const PRI_LABEL: Record<string, string> = { low: "Düşük", medium: "Orta", high: "Yüksek", urgent: "ACİL" };
const PRI_COLOR: Record<string, string> = { low: "#64748b", medium: "#d97706", high: "#ea580c", urgent: "#dc2626" };
const CAT_LABEL: Record<string, string> = { technical: "Teknik", billing: "Fatura", general: "Genel", feature_request: "Özellik" };

const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

interface Stats {
  open: number; in_progress: number; resolved_today: number;
  total: number; urgent: number; avg_response_min: number | null;
}
interface Customer {
  id: string; full_name: string; company: string | null;
  phone: string | null; email: string; approved: boolean; created_at: string;
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", padding: "18px 22px", flex: 1, minWidth: 0, borderTop: accent ? `3px solid ${accent}` : undefined }}>
      <p style={{ color: "var(--color-outline)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", margin: 0 }}>{label}</p>
      <p style={{ fontSize: "30px", fontWeight: 800, color: accent || "var(--color-on-surface)", margin: "6px 0 0", fontFamily: "var(--font-family-headline)" }}>{value}</p>
      {sub && <p style={{ fontSize: "11px", color: "var(--color-outline)", marginTop: "2px" }}>{sub}</p>}
    </div>
  );
}

function Fbtn({ val, cur, set, label }: { val: string; cur: string; set: (v: string) => void; label: string }) {
  const active = cur === val;
  return (
    <button onClick={() => set(val)} style={{ padding: "5px 13px", borderRadius: "6px", border: "1px solid", borderColor: active ? "var(--color-primary-container)" : "var(--color-outline-variant)", background: active ? "rgba(0,82,255,.12)" : "transparent", color: active ? "var(--color-primary)" : "var(--color-outline)", fontSize: "13px", fontWeight: active ? 700 : 400, cursor: "pointer" }}>
      {label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"tickets" | "customers" | "reports">("tickets");

  // Tickets
  const [tickets, setTickets]     = useState<Ticket[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [statusF, setStatusF]     = useState("all");
  const [priorityF, setPriorityF] = useState("all");
  const [categoryF, setCategoryF] = useState("all");
  const [dateF, setDateF]         = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]       = useState("");

  // Customers
  const [customers, setCustomers]     = useState<Customer[]>([]);
  const [custFilter, setCustFilter]   = useState("all");
  const [custLoading, setCustLoading] = useState(false);

  // Reports filters
  const now = new Date();
  const [rptCustomer, setRptCustomer]   = useState("all");
  const [rptDateMode, setRptDateMode]   = useState<"preset"|"month"|"range">("preset");
  const [rptPreset, setRptPreset]       = useState("month"); // today | week | month | quarter | year
  const [rptMonth, setRptMonth]         = useState(now.getMonth());
  const [rptYear, setRptYear]           = useState(now.getFullYear());
  const [rptFrom, setRptFrom]           = useState("");
  const [rptTo, setRptTo]               = useState("");
  const [allTickets, setAllTickets]     = useState<Ticket[]>([]); // unfiltered, for reports

  // ── Fetch ─────────────────────────────────────────────────────────────────
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
    if (categoryF !== "all") list = list.filter((t) => t.category === categoryF);
    if (dateF !== "all") {
      const cutoff = new Date();
      if (dateF === "today") cutoff.setHours(0, 0, 0, 0);
      if (dateF === "week")  cutoff.setDate(cutoff.getDate() - 7);
      if (dateF === "month") cutoff.setDate(cutoff.getDate() - 30);
      list = list.filter((t) => new Date(t.created_at) >= cutoff);
    }
    setTickets(list); setTotal(list.length); setLoading(false);
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

  // All tickets for reports (no filter)
  const fetchAllTickets = useCallback(async () => {
    const res = await fetch("/api/tickets?limit=50");
    if (res.ok) setAllTickets((await res.json()).tickets || []);
  }, []);

  useEffect(() => { fetchTickets(); fetchStats(); fetchAllTickets(); }, [fetchTickets, fetchStats, fetchAllTickets]);
  useEffect(() => { if (tab === "customers") fetchCustomers(); }, [tab, fetchCustomers]);

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }
  async function handleCustomerAction(id: string, action: "approve" | "reject") {
    const res = await fetch("/api/admin/customers", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) fetchCustomers();
  }

  // ── Reports filtered dataset ───────────────────────────────────────────────
  const rptTickets = useMemo(() => {
    let list = allTickets;

    // Customer filter
    if (rptCustomer !== "all") list = list.filter((t) => t.customer_email === rptCustomer);

    // Date filter
    if (rptDateMode === "preset") {
      const cutoff = new Date();
      if (rptPreset === "today")   { cutoff.setHours(0, 0, 0, 0); list = list.filter((t) => new Date(t.created_at) >= cutoff); }
      if (rptPreset === "week")    { cutoff.setDate(cutoff.getDate() - 7); list = list.filter((t) => new Date(t.created_at) >= cutoff); }
      if (rptPreset === "month")   { cutoff.setDate(cutoff.getDate() - 30); list = list.filter((t) => new Date(t.created_at) >= cutoff); }
      if (rptPreset === "quarter") { cutoff.setDate(cutoff.getDate() - 90); list = list.filter((t) => new Date(t.created_at) >= cutoff); }
      if (rptPreset === "year")    { cutoff.setDate(cutoff.getDate() - 365); list = list.filter((t) => new Date(t.created_at) >= cutoff); }
    } else if (rptDateMode === "month") {
      list = list.filter((t) => {
        const d = new Date(t.created_at);
        return d.getFullYear() === rptYear && d.getMonth() === rptMonth;
      });
    } else if (rptDateMode === "range" && rptFrom && rptTo) {
      const from = new Date(rptFrom); from.setHours(0,0,0,0);
      const to   = new Date(rptTo);   to.setHours(23,59,59,999);
      list = list.filter((t) => { const d = new Date(t.created_at); return d >= from && d <= to; });
    }

    return list;
  }, [allTickets, rptCustomer, rptDateMode, rptPreset, rptMonth, rptYear, rptFrom, rptTo]);

  // Charts data
  const rptCatCounts = ["technical","billing","general","feature_request"].map((cat) => ({
    cat, label: CAT_LABEL[cat], count: rptTickets.filter((t) => t.category === cat).length,
  }));
  const rptMaxCat = Math.max(...rptCatCounts.map((c) => c.count), 1);

  const rptPriCounts = ["urgent","high","medium","low"].map((p) => ({
    p, label: PRI_LABEL[p], color: PRI_COLOR[p], count: rptTickets.filter((t) => t.priority === p).length,
  }));
  const rptMaxPri = Math.max(...rptPriCounts.map((c) => c.count), 1);

  const rptStatusCounts = ["open","in_progress","resolved","closed"].map((s) => ({
    s, label: STATUS_LABEL[s], count: rptTickets.filter((t) => t.status === s).length, color: STATUS_COLOR[s].text,
  }));

  // Daily chart based on selected period
  const rptDays = useMemo(() => {
    const days = rptDateMode === "month" ? new Date(rptYear, rptMonth + 1, 0).getDate() : 7;
    return Array.from({ length: days }).map((_, i) => {
      let d: Date;
      if (rptDateMode === "month") {
        d = new Date(rptYear, rptMonth, i + 1); d.setHours(0,0,0,0);
      } else {
        d = new Date(); d.setDate(d.getDate() - (days - 1 - i)); d.setHours(0,0,0,0);
      }
      const end = new Date(d); end.setDate(end.getDate() + 1);
      return {
        label: rptDateMode === "month" ? String(i + 1) : d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }),
        count: rptTickets.filter((t) => { const dt = new Date(t.created_at); return dt >= d && dt < end; }).length,
      };
    });
  }, [rptTickets, rptDateMode, rptMonth, rptYear]);
  const rptMaxDay = Math.max(...rptDays.map((d) => d.count), 1);

  // Unique customers for dropdown
  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, string>();
    allTickets.forEach((t) => { if (!map.has(t.customer_email)) map.set(t.customer_email, `${t.customer_name}${t.company ? ` — ${t.company}` : ""}`); });
    return Array.from(map.entries());
  }, [allTickets]);

  const rptResolved = rptTickets.filter((t) => t.status === "resolved" || t.status === "closed").length;
  const rptTotal    = rptTickets.length;

  const pending = customers.filter((c) => !c.approved).length;

  const inpStyle: React.CSSProperties = {
    padding: "7px 11px", background: "var(--color-surface-high)", border: "1px solid var(--color-outline-variant)",
    borderRadius: "7px", color: "var(--color-on-surface)", fontSize: "13px", outline: "none", fontFamily: "inherit",
  };

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
        <div style={{ display: "flex", gap: "4px" }}>
          {(["tickets","customers","reports"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 16px", borderRadius: "6px", border: "none", background: tab === t ? "rgba(0,82,255,.15)" : "transparent", color: tab === t ? "var(--color-primary)" : "var(--color-outline)", fontSize: "13px", fontWeight: tab === t ? 700 : 400, cursor: "pointer" }}>
              {t === "tickets" ? `Talepler${total ? ` (${total})` : ""}` : t === "customers" ? `Müşteriler${pending > 0 ? ` 🔴${pending}` : ""}` : "Raporlar"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => { fetchTickets(); fetchStats(); fetchAllTickets(); }} style={{ padding: "5px 12px", border: "1px solid var(--color-outline-variant)", borderRadius: "6px", background: "transparent", color: "var(--color-outline)", fontSize: "13px", cursor: "pointer" }}>↻ Yenile</button>
          <button onClick={logout} style={{ padding: "5px 12px", border: "1px solid var(--color-outline-variant)", borderRadius: "6px", background: "transparent", color: "var(--color-outline)", fontSize: "13px", cursor: "pointer" }}>Çıkış</button>
        </div>
      </header>

      <main style={{ flex: 1, padding: "24px 28px", maxWidth: "1440px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

        {/* ══════════════════════════ TICKETS TAB */}
        {tab === "tickets" && (
          <>
            {stats && (
              <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                <StatCard label="Açık Talepler"  value={stats.open}            accent="#0052ff" />
                <StatCard label="İşlemde"         value={stats.in_progress}     accent="#7c3aed" />
                <StatCard label="Bugün Çözüldü"   value={stats.resolved_today}  accent="#16a34a" />
                <StatCard label="Acil"            value={stats.urgent}          accent="#dc2626" />
                <StatCard label="Toplam"          value={stats.total} />
                <StatCard label="Ort. İlk Yanıt"  value={stats.avg_response_min != null ? (stats.avg_response_min < 60 ? `${stats.avg_response_min}dk` : `${(stats.avg_response_min / 60).toFixed(1)}s`) : "—"} sub="son 50 talep" />
              </div>
            )}

            <div style={{ background: "var(--color-surface)", borderRadius: "12px", border: "1px solid var(--color-outline-variant)", padding: "14px 18px", marginBottom: "14px" }}>
              {[
                { label: "Durum",    opts: [["all","Tümü"],["open","Açık"],["in_progress","İşlemde"],["resolved","Çözüldü"],["closed","Kapalı"]], val: statusF, set: setStatusF },
                { label: "Öncelik", opts: [["all","Tümü"],["urgent","ACİL"],["high","Yüksek"],["medium","Orta"],["low","Düşük"]], val: priorityF, set: setPriorityF },
                { label: "Kategori",opts: [["all","Tümü"],["technical","Teknik"],["billing","Fatura"],["general","Genel"],["feature_request","Özellik"]], val: categoryF, set: setCategoryF },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px", minWidth: "60px" }}>{row.label}</span>
                  {row.opts.map(([v,l]) => <Fbtn key={v} val={v} cur={row.val} set={row.set} label={l} />)}
                </div>
              ))}
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px", minWidth: "60px" }}>Tarih</span>
                {[["all","Tümü"],["today","Bugün"],["week","Son 7 Gün"],["month","Son 30 Gün"]].map(([v,l]) => <Fbtn key={v} val={v} cur={dateF} set={setDateF} label={l} />)}
                <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} style={{ flex: 1, display: "flex", gap: "6px", marginLeft: "8px" }}>
                  <input value={searchInput} onChange={(e) => { setSearchInput(e.target.value); if (!e.target.value) setSearch(""); }}
                    placeholder="Müşteri, konu, e-posta..." style={{ ...inpStyle, flex: 1 }} />
                  <button type="submit" style={{ padding: "6px 14px", background: "var(--color-primary-container)", border: "none", borderRadius: "6px", color: "#fff", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>Ara</button>
                </form>
              </div>
              <p style={{ color: "var(--color-outline)", fontSize: "12px", marginTop: "10px", marginBottom: 0 }}>{total} talep listeleniyor</p>
            </div>

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
                        const sla = slaDue(t); const sc = STATUS_COLOR[t.status];
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
                            <td style={{ padding: "13px 14px" }}><span style={{ fontSize: "12px", color: "var(--color-primary)", fontWeight: 600 }}>Aç →</span></td>
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

        {/* ══════════════════════════ CUSTOMERS TAB */}
        {tab === "customers" && (
          <>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
              {[["all","Tümü"],["pending","Onay Bekleyen"],["approved","Onaylı"]].map(([v,l]) => <Fbtn key={v} val={v} cur={custFilter} set={setCustFilter} label={l} />)}
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
                        <td style={{ padding: "13px 16px", fontSize: "12px", color: "var(--color-outline)" }}>{new Date(c.created_at).toLocaleDateString("tr-TR")}</td>
                        <td style={{ padding: "13px 16px" }}>
                          {!c.approved ? (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => handleCustomerAction(c.id, "approve")} style={{ padding: "5px 12px", background: "rgba(22,163,74,.15)", border: "1px solid rgba(22,163,74,.3)", borderRadius: "6px", color: "#86efac", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Onayla</button>
                              <button onClick={() => { if (confirm(`${c.full_name} hesabını reddet ve sil?`)) handleCustomerAction(c.id, "reject"); }} style={{ padding: "5px 12px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: "6px", color: "#f87171", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Reddet</button>
                            </div>
                          ) : (
                            <button onClick={() => { if (confirm(`${c.full_name} hesabını sil?`)) handleCustomerAction(c.id, "reject"); }} style={{ padding: "5px 12px", background: "transparent", border: "1px solid var(--color-outline-variant)", borderRadius: "6px", color: "var(--color-outline)", fontSize: "12px", cursor: "pointer" }}>Kaldır</button>
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

        {/* ══════════════════════════ REPORTS TAB */}
        {tab === "reports" && (
          <>
            {/* ── Filter bar ── */}
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", padding: "20px 22px", marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 700, color: "var(--color-on-surface)" }}>Rapor Filtreleri</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", alignItems: "start" }}>

                {/* Müşteri seç */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "8px" }}>Müşteri</label>
                  <select value={rptCustomer} onChange={(e) => setRptCustomer(e.target.value)} style={{ ...inpStyle, width: "100%", cursor: "pointer" }}>
                    <option value="all">Tüm Müşteriler</option>
                    {uniqueCustomers.map(([email, label]) => (
                      <option key={email} value={email}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Tarih modu */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "8px" }}>Tarih Aralığı</label>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "10px" }}>
                    {[["preset","Hızlı Seçim"],["month","Ay Seç"],["range","Tarih Aralığı"]].map(([m,l]) => (
                      <button key={m} onClick={() => setRptDateMode(m as typeof rptDateMode)}
                        style={{ flex: 1, padding: "5px 0", borderRadius: "6px", border: "1px solid", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                          borderColor: rptDateMode === m ? "var(--color-primary-container)" : "var(--color-outline-variant)",
                          background: rptDateMode === m ? "rgba(0,82,255,.12)" : "transparent",
                          color: rptDateMode === m ? "var(--color-primary)" : "var(--color-outline)",
                        }}>{l}</button>
                    ))}
                  </div>

                  {rptDateMode === "preset" && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {[["today","Bugün"],["week","7 Gün"],["month","30 Gün"],["quarter","90 Gün"],["year","1 Yıl"]].map(([v,l]) => (
                        <button key={v} onClick={() => setRptPreset(v)}
                          style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid", fontSize: "12px", cursor: "pointer",
                            borderColor: rptPreset === v ? "var(--color-primary-container)" : "var(--color-outline-variant)",
                            background: rptPreset === v ? "rgba(0,82,255,.12)" : "transparent",
                            color: rptPreset === v ? "var(--color-primary)" : "var(--color-outline)",
                          }}>{l}</button>
                      ))}
                    </div>
                  )}

                  {rptDateMode === "month" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select value={rptMonth} onChange={(e) => setRptMonth(Number(e.target.value))} style={{ ...inpStyle, flex: 2 }}>
                        {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                      </select>
                      <select value={rptYear} onChange={(e) => setRptYear(Number(e.target.value))} style={{ ...inpStyle, flex: 1 }}>
                        {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  )}

                  {rptDateMode === "range" && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input type="date" value={rptFrom} onChange={(e) => setRptFrom(e.target.value)} style={{ ...inpStyle, flex: 1 }} />
                      <span style={{ color: "var(--color-outline)", fontSize: "12px" }}>—</span>
                      <input type="date" value={rptTo} onChange={(e) => setRptTo(e.target.value)} style={{ ...inpStyle, flex: 1 }} />
                    </div>
                  )}
                </div>

                {/* Özet sayılar */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "8px" }}>Dönem Özeti</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {[
                      { label: "Toplam",     value: rptTotal,    color: "var(--color-on-surface)" },
                      { label: "Çözülen",    value: rptResolved, color: "#22c55e" },
                      { label: "Çözüm %",   value: rptTotal ? `%${Math.round((rptResolved/rptTotal)*100)}` : "%—", color: "#3b82f6" },
                      { label: "Açık",       value: rptTickets.filter(t=>t.status==="open").length, color: "#f97316" },
                    ].map((s) => (
                      <div key={s.label} style={{ background: "var(--color-surface-high)", borderRadius: "8px", padding: "10px 12px" }}>
                        <div style={{ fontSize: "10px", color: "var(--color-outline)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>{s.label}</div>
                        <div style={{ fontSize: "22px", fontWeight: 800, color: s.color, fontFamily: "var(--font-family-headline)", marginTop: "3px" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Charts ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>

              {/* Kategori */}
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", padding: "20px 22px" }}>
                <h4 style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: 700, color: "var(--color-on-surface)" }}>Kategoriye Göre</h4>
                {rptCatCounts.map((c) => (
                  <div key={c.cat} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", color: "var(--color-on-surface-variant)" }}>{c.label}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-primary)" }}>{c.count}</span>
                    </div>
                    <div style={{ height: "6px", background: "var(--color-surface-high)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(c.count / rptMaxCat) * 100}%`, background: "var(--color-primary-container)", borderRadius: "3px", transition: "width .4s" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Öncelik */}
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", padding: "20px 22px" }}>
                <h4 style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: 700, color: "var(--color-on-surface)" }}>Önceliğe Göre</h4>
                {rptPriCounts.map((p) => (
                  <div key={p.p} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", color: p.color, fontWeight: 600 }}>{p.label}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: p.color }}>{p.count}</span>
                    </div>
                    <div style={{ height: "6px", background: "var(--color-surface-high)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(p.count / rptMaxPri) * 100}%`, background: p.color, borderRadius: "3px", opacity: 0.7, transition: "width .4s" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Durum */}
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", padding: "20px 22px" }}>
                <h4 style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: 700, color: "var(--color-on-surface)" }}>Duruma Göre</h4>
                {rptStatusCounts.map((s) => (
                  <div key={s.s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", marginBottom: "8px", background: "var(--color-surface-high)", borderRadius: "8px" }}>
                    <span style={{ fontSize: "13px", color: "var(--color-on-surface-variant)" }}>{s.label}</span>
                    <span style={{ fontSize: "22px", fontWeight: 800, color: s.color, fontFamily: "var(--font-family-headline)" }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Daily bar chart ── */}
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", padding: "20px 22px", marginBottom: "16px" }}>
              <h4 style={{ margin: "0 0 20px", fontSize: "13px", fontWeight: 700, color: "var(--color-on-surface)" }}>
                Günlük Talep Akışı
                {rptDateMode === "month" && ` — ${MONTHS[rptMonth]} ${rptYear}`}
              </h4>
              <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "100px", overflowX: "auto", paddingBottom: "4px" }}>
                {rptDays.map((d, i) => (
                  <div key={i} style={{ flex: "0 0 auto", minWidth: rptDateMode === "month" ? "28px" : "60px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
                    {d.count > 0 && <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-primary)" }}>{d.count}</span>}
                    <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                      <div style={{ width: "100%", height: `${Math.max((d.count / rptMaxDay) * 100, 3)}%`, background: d.count > 0 ? "var(--color-primary-container)" : "var(--color-surface-high)", borderRadius: "3px 3px 0 0", transition: "height .4s" }} />
                    </div>
                    <span style={{ fontSize: "9px", color: "var(--color-outline)", whiteSpace: "nowrap" }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Ticket table for selected filter ── */}
            {rptTickets.length > 0 && (
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-outline-variant)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-on-surface)" }}>Talep Listesi</span>
                  <span style={{ fontSize: "12px", color: "var(--color-outline)" }}>{rptTickets.length} talep</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-outline-variant)" }}>
                        {["#No","Müşteri","Konu","Kategori","Öncelik","Durum","Tarih"].map((h) => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rptTickets.map((t) => {
                        const sc = STATUS_COLOR[t.status];
                        return (
                          <tr key={t.id} onClick={() => router.push(`/admin/destek/${t.id}`)}
                            style={{ borderBottom: "1px solid var(--color-outline-variant)", cursor: "pointer" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-high)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <td style={{ padding: "11px 14px", fontSize: "12px", fontWeight: 700, color: "var(--color-primary)" }}>#{String(t.ticket_number).padStart(4,"0")}</td>
                            <td style={{ padding: "11px 14px" }}>
                              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--color-on-surface)" }}>{t.customer_name}</p>
                              {t.company && <p style={{ margin: 0, fontSize: "11px", color: "var(--color-outline)" }}>{t.company}</p>}
                            </td>
                            <td style={{ padding: "11px 14px", maxWidth: "220px" }}><p style={{ margin: 0, fontSize: "13px", color: "var(--color-on-surface)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</p></td>
                            <td style={{ padding: "11px 14px", fontSize: "12px", color: "var(--color-outline)" }}>{CAT_LABEL[t.category]}</td>
                            <td style={{ padding: "11px 14px" }}><span style={{ fontSize: "12px", fontWeight: 700, color: PRI_COLOR[t.priority] }}>{PRI_LABEL[t.priority]}</span></td>
                            <td style={{ padding: "11px 14px" }}><span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: sc.bg, color: sc.text }}>{STATUS_LABEL[t.status]}</span></td>
                            <td style={{ padding: "11px 14px", fontSize: "12px", color: "var(--color-outline)", whiteSpace: "nowrap" }}>
                              {new Date(t.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
