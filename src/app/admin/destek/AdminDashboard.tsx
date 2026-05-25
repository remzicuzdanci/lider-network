"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Ticket } from "@/lib/supabase";

// ── helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}s`;
  return `${Math.floor(diff / 86400)}g`;
}

function slaDue(ticket: Ticket): { label: string; color: string } {
  if (ticket.status === "resolved" || ticket.status === "closed")
    return { label: "Tamamlandı", color: "#22c55e" };
  const hours: Record<string, number> = {
    urgent: 2, high: 4, medium: 8, low: 24,
  };
  const slaH = hours[ticket.priority] ?? 8;
  const elapsed =
    (Date.now() - new Date(ticket.created_at).getTime()) / 3600000;
  const rem = slaH - elapsed;
  if (rem < 0)
    return { label: `${Math.abs(Math.round(rem))}s gecikti`, color: "#ef4444" };
  if (rem < 1)
    return { label: `${Math.round(rem * 60)}dk kaldı`, color: "#f97316" };
  return { label: `${Math.round(rem)}s kaldı`, color: "#22c55e" };
}

const STATUS_LABELS: Record<string, string> = {
  open: "Açık", in_progress: "İşlemde", resolved: "Çözüldü", closed: "Kapalı",
};
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open:        { bg: "#dbeafe", text: "#1d4ed8" },
  in_progress: { bg: "#ede9fe", text: "#7c3aed" },
  resolved:    { bg: "#dcfce7", text: "#15803d" },
  closed:      { bg: "#f1f5f9", text: "#475569" },
};
const PRI_LABELS: Record<string, string> = {
  low: "Düşük", medium: "Orta", high: "Yüksek", urgent: "ACİL",
};
const PRI_COLORS: Record<string, string> = {
  low: "#64748b", medium: "#d97706", high: "#ea580c", urgent: "#dc2626",
};
const CAT_LABELS: Record<string, string> = {
  technical: "Teknik", billing: "Fatura", general: "Genel", feature_request: "Özellik",
};

interface Stats {
  open: number; in_progress: number; resolved_today: number;
  total: number; urgent: number; avg_response_min: number | null;
}

// ── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, accent,
}: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-outline-variant)",
        borderRadius: "12px",
        padding: "20px 24px",
        flex: 1,
        minWidth: 0,
        borderTop: accent ? `3px solid ${accent}` : undefined,
      }}
    >
      <p style={{ color: "var(--color-outline)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", margin: 0 }}>
        {label}
      </p>
      <p style={{ fontSize: "32px", fontWeight: 800, color: accent || "var(--color-on-surface)", margin: "8px 0 0", fontFamily: "var(--font-family-headline)" }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: "12px", color: "var(--color-outline)", marginTop: "4px" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [total, setTotal] = useState(0);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "30" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (search) params.set("q", search);

    const res = await fetch(`/api/tickets?${params}`);
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();
    setTickets(data.tickets || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [statusFilter, priorityFilter, search, router]);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => { fetchTickets(); fetchStats(); }, [fetchTickets, fetchStats]);

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  const filterBtn = (val: string, cur: string, set: (v: string) => void, label: string) => (
    <button
      key={val}
      onClick={() => set(val)}
      style={{
        padding: "6px 14px",
        borderRadius: "6px",
        border: "1px solid",
        borderColor: cur === val ? "var(--color-primary-container)" : "var(--color-outline-variant)",
        background: cur === val ? "rgba(0,82,255,.12)" : "transparent",
        color: cur === val ? "var(--color-primary)" : "var(--color-outline)",
        fontSize: "13px",
        fontWeight: cur === val ? 700 : 400,
        cursor: "pointer",
        transition: "all .15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-outline-variant)", padding: "0 32px", display: "flex", alignItems: "center", gap: "16px", height: "60px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
          <div style={{ width: 32, height: 32, background: "var(--color-primary-container)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" /><path d="M12 12l-9-5M12 12l9-5M12 12v10" stroke="#fff" strokeWidth="2" /></svg>
          </div>
          <span style={{ fontFamily: "var(--font-family-headline)", fontWeight: 700, color: "var(--color-on-surface)", fontSize: "15px" }}>
            Lider Network
          </span>
          <span style={{ color: "var(--color-outline-variant)" }}>·</span>
          <span style={{ color: "var(--color-outline)", fontSize: "14px" }}>Destek Merkezi</span>
        </div>
        <button
          onClick={() => { fetchTickets(); fetchStats(); }}
          style={{ padding: "6px 12px", border: "1px solid var(--color-outline-variant)", borderRadius: "6px", background: "transparent", color: "var(--color-outline)", fontSize: "13px", cursor: "pointer" }}
        >
          ↻ Yenile
        </button>
        <button
          onClick={logout}
          style={{ padding: "6px 14px", border: "1px solid var(--color-outline-variant)", borderRadius: "6px", background: "transparent", color: "var(--color-outline)", fontSize: "13px", cursor: "pointer" }}
        >
          Çıkış
        </button>
      </header>

      <main style={{ flex: 1, padding: "28px 32px", maxWidth: "1400px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {/* Stats */}
        {stats && (
          <div style={{ display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
            <StatCard label="Açık Talepler" value={stats.open} accent="#0052ff" />
            <StatCard label="İşlemde" value={stats.in_progress} accent="#7c3aed" />
            <StatCard label="Bugün Çözüldü" value={stats.resolved_today} accent="#16a34a" />
            <StatCard label="Acil" value={stats.urgent} accent="#dc2626" />
            <StatCard
              label="Ort. İlk Yanıt"
              value={stats.avg_response_min !== null
                ? stats.avg_response_min < 60
                  ? `${stats.avg_response_min}dk`
                  : `${(stats.avg_response_min / 60).toFixed(1)}s`
                : "—"}
              sub="son 50 talep"
            />
          </div>
        )}

        {/* Filters */}
        <div style={{ background: "var(--color-surface)", borderRadius: "12px", border: "1px solid var(--color-outline-variant)", padding: "16px 20px", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Status filters */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[["all","Tümü"],["open","Açık"],["in_progress","İşlemde"],["resolved","Çözüldü"],["closed","Kapalı"]].map(
                ([v, l]) => filterBtn(v, statusFilter, setStatusFilter, l)
              )}
            </div>
            <div style={{ width: "1px", height: "24px", background: "var(--color-outline-variant)" }} />
            {/* Priority filters */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[["all","Tüm Öncelik"],["urgent","Acil"],["high","Yüksek"],["medium","Orta"],["low","Düşük"]].map(
                ([v, l]) => filterBtn(v, priorityFilter, setPriorityFilter, l)
              )}
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }}>
                <input
                  value={searchInput}
                  onChange={(e) => { setSearchInput(e.target.value); if (!e.target.value) setSearch(""); }}
                  placeholder="Ara: müşteri, konu, e-posta..."
                  style={{
                    width: "100%", padding: "7px 12px",
                    background: "var(--color-surface-high)",
                    border: "1px solid var(--color-outline-variant)",
                    borderRadius: "6px", color: "var(--color-on-surface)",
                    fontSize: "13px", outline: "none", boxSizing: "border-box",
                  }}
                />
              </form>
            </div>
          </div>
          <p style={{ color: "var(--color-outline)", fontSize: "12px", marginTop: "10px", marginBottom: 0 }}>
            {total} talep bulundu
          </p>
        </div>

        {/* Tickets Table */}
        <div style={{ background: "var(--color-surface)", borderRadius: "12px", border: "1px solid var(--color-outline-variant)", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "var(--color-outline)" }}>
              Yükleniyor...
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "var(--color-outline)" }}>
              Talep bulunamadı
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-outline-variant)" }}>
                    {["#No","Müşteri / Şirket","Konu","Kategori","Öncelik","Durum","SLA","Tarih",""].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => {
                    const sla = slaDue(t);
                    const statusStyle = STATUS_COLORS[t.status];
                    return (
                      <tr
                        key={t.id}
                        onClick={() => router.push(`/admin/destek/${t.id}`)}
                        style={{ borderBottom: "1px solid var(--color-outline-variant)", cursor: "pointer", transition: "background .1s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-high)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 700, color: "var(--color-primary)", fontFamily: "var(--font-family-label)", whiteSpace: "nowrap" }}>
                          #{String(t.ticket_number).padStart(4,"0")}
                        </td>
                        <td style={{ padding: "14px 16px", minWidth: "160px" }}>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--color-on-surface)" }}>{t.customer_name}</p>
                          {t.company && <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-outline)" }}>{t.company}</p>}
                        </td>
                        <td style={{ padding: "14px 16px", maxWidth: "280px" }}>
                          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-on-surface)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.subject}
                          </p>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--color-outline)", whiteSpace: "nowrap" }}>
                          {CAT_LABELS[t.category]}
                        </td>
                        <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: PRI_COLORS[t.priority] }}>
                            {PRI_LABELS[t.priority]}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: statusStyle.bg, color: statusStyle.text }}>
                            {STATUS_LABELS[t.status]}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: sla.color }}>
                            ● {sla.label}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--color-outline)", whiteSpace: "nowrap" }}>
                          {timeAgo(t.created_at)}
                        </td>
                        <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
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
      </main>
    </div>
  );
}
