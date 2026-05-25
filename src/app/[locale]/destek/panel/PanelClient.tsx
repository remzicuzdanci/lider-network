"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useDestekPaths } from "@/lib/destek-path";
import type { Ticket } from "@/lib/supabase";
import {
  Plus, LogOut, TicketCheck, Clock, CheckCircle,
  XCircle, Search, LayoutDashboard, Activity,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60)    return "az önce";
  if (d < 3600)  return `${Math.floor(d / 60)}dk önce`;
  if (d < 86400) return `${Math.floor(d / 3600)}s önce`;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

const STATUS: Record<string, { label: string; bg: string; text: string; dot: string; icon: React.ReactNode }> = {
  open:        { label: "Açık",     bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6",  icon: <Clock size={11} />      },
  in_progress: { label: "İşlemde",  bg: "#f5f3ff", text: "#7c3aed", dot: "#8b5cf6",  icon: <Activity size={11} />   },
  resolved:    { label: "Çözüldü",  bg: "#f0fdf4", text: "#15803d", dot: "#22c55e",  icon: <CheckCircle size={11} /> },
  closed:      { label: "Kapalı",   bg: "#f8fafc", text: "#475569", dot: "#94a3b8",  icon: <XCircle size={11} />    },
};
const PRI: Record<string, { label: string; color: string; bg: string }> = {
  low:    { label: "Düşük",  color: "#64748b", bg: "#f1f5f9" },
  medium: { label: "Orta",   color: "#d97706", bg: "#fffbeb" },
  high:   { label: "Yüksek", color: "#ea580c", bg: "#fff7ed" },
  urgent: { label: "ACİL",   color: "#dc2626", bg: "#fef2f2" },
};
const CAT: Record<string, string> = {
  technical: "Teknik", billing: "Fatura", general: "Genel", feature_request: "Özellik",
};

export default function PanelClient({
  userId, userEmail, fullName, company,
}: {
  userId: string; userEmail: string; fullName: string; company?: string | null;
}) {
  const router = useRouter();
  const locale = useLocale();
  const paths  = useDestekPaths(locale);
  const [tickets, setTickets]     = useState<Ticket[]>([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setFilter] = useState("all");
  const [search, setSearch]       = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/destek/tickets");
    if (res.ok) setTickets((await res.json()).tickets || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  async function logout() {
    const sb = createSupabaseBrowser();
    await sb.auth.signOut();
    router.push(paths.landing);
    router.refresh();
  }

  const filtered = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !`${t.subject} ${t.customer_name}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    open:        tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved:    tickets.filter((t) => t.status === "resolved" || t.status === "closed").length,
  };

  const initials = fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6fb", fontFamily: "var(--font-family-body)" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: "240px", flexShrink: 0,
        background: "#fff",
        borderRight: "1px solid #e5e7ef",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f0f2f8" }}>
          <Image src="/logo.png" alt="Lider Network" width={130} height={38} style={{ objectFit: "contain" }} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".8px", padding: "0 12px", margin: "0 0 6px" }}>Menü</p>

          <SideLink href={paths.panel} icon={<LayoutDashboard size={16} />} label="Taleplerim"
            badge={counts.open > 0 ? counts.open : undefined} active />
          <SideLink href={paths.yeni} icon={<Plus size={16} />} label="Yeni Talep" />
        </nav>

        {/* User info */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #f0f2f8", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #0052ff, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fullName}</p>
            {company && <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{company}</p>}
          </div>
          <button onClick={logout} title="Çıkış" style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px", borderRadius: "6px", display: "flex", alignItems: "center" }}>
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-family-headline)", fontSize: "22px", fontWeight: 800, color: "#1a1d2e", margin: "0 0 4px" }}>
              Hoş geldiniz, {fullName.split(" ")[0]}! 👋
            </h1>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Destek taleplerinizi buradan yönetebilirsiniz.</p>
          </div>
          <Link href={paths.yeni} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 22px", background: "#0052ff", color: "#fff", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "14px", fontFamily: "var(--font-family-headline)", boxShadow: "0 4px 12px rgba(0,82,255,.3)" }}>
            <Plus size={16} /> Yeni Talep
          </Link>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" }}>
          {[
            { key: "open",        label: "Açık",     value: counts.open,        color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
            { key: "in_progress", label: "İşlemde",  value: counts.in_progress, color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
            { key: "resolved",    label: "Çözüldü",  value: counts.resolved,    color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0" },
          ].map((s) => (
            <button key={s.key} onClick={() => setFilter(statusFilter === s.key ? "all" : s.key)}
              style={{ padding: "18px 20px", background: statusFilter === s.key ? s.bg : "#fff", border: `1.5px solid ${statusFilter === s.key ? s.border : "#e5e7ef"}`, borderRadius: "14px", textAlign: "left", cursor: "pointer", transition: "all .15s" }}>
              <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 600, color: "#6b7280" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: "32px", fontWeight: 900, color: statusFilter === s.key ? s.color : "#1a1d2e", fontFamily: "var(--font-family-headline)" }}>{s.value}</p>
            </button>
          ))}
        </div>

        {/* Filter + search */}
        <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "12px", padding: "14px 16px", marginBottom: "14px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {[["all","Tümü"],["open","Açık"],["in_progress","İşlemde"],["resolved","Çözüldü"],["closed","Kapalı"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              style={{ padding: "5px 14px", borderRadius: "8px", border: "1.5px solid", borderColor: statusFilter === v ? "#0052ff" : "#e5e7ef", background: statusFilter === v ? "#eff6ff" : "transparent", color: statusFilter === v ? "#0052ff" : "#6b7280", fontSize: "13px", fontWeight: statusFilter === v ? 700 : 400, cursor: "pointer" }}>
              {l}
            </button>
          ))}
          <div style={{ flex: 1, minWidth: "200px", display: "flex", alignItems: "center", gap: "8px", background: "#f8f9fb", border: "1.5px solid #e5e7ef", borderRadius: "8px", padding: "7px 12px" }}>
            <Search size={14} color="#9ca3af" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Konu ara..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#1a1d2e", fontSize: "13px", fontFamily: "inherit" }} />
          </div>
        </div>

        {/* Ticket list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7ef" }}>Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "56px", textAlign: "center", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7ef" }}>
              <TicketCheck size={40} color="#e5e7ef" style={{ marginBottom: "12px" }} />
              <p style={{ color: "#9ca3af", fontSize: "15px", margin: "0 0 16px" }}>
                {tickets.length === 0 ? "Henüz destek talebiniz bulunmuyor." : "Sonuç bulunamadı."}
              </p>
              {tickets.length === 0 && (
                <Link href={paths.yeni} style={{ display: "inline-block", padding: "10px 20px", background: "#0052ff", color: "#fff", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: 700 }}>
                  İlk Talebi Oluştur
                </Link>
              )}
            </div>
          ) : (
            filtered.map((t) => {
              const st  = STATUS[t.status] || STATUS.open;
              const pri = PRI[t.priority] || PRI.medium;
              return (
                <Link key={t.id} href={paths.ticket(t.id)}
                  style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "12px", textDecoration: "none", transition: "all .15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,82,255,.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7ef"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Ticket number */}
                  <div style={{ flexShrink: 0, width: "48px", height: "48px", borderRadius: "10px", background: "#f4f6fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--font-family-label)", fontSize: "12px", fontWeight: 800, color: "#0052ff" }}>#{String(t.ticket_number).padStart(4, "0")}</span>
                  </div>

                  {/* Subject + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "#9ca3af" }}>{CAT[t.category]}</span>
                      <span style={{ color: "#e5e7ef" }}>·</span>
                      <span style={{ fontSize: "12px", color: "#9ca3af" }}>{timeAgo(t.created_at)}</span>
                    </div>
                  </div>

                  {/* Priority */}
                  <span style={{ flexShrink: 0, padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, background: pri.bg, color: pri.color }}>
                    {pri.label}
                  </span>

                  {/* Status */}
                  <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "8px", background: st.bg, fontSize: "12px", fontWeight: 600, color: st.text }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, flexShrink: 0 }} />
                    {st.label}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

function SideLink({ href, icon, label, badge, active }: { href: string; icon: React.ReactNode; label: string; badge?: number; active?: boolean }) {
  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "9px 12px", borderRadius: "8px", textDecoration: "none",
      background: active ? "#eff6ff" : "transparent",
      color: active ? "#0052ff" : "#6b7280",
      fontSize: "14px", fontWeight: active ? 600 : 400,
      transition: "all .15s", marginBottom: "2px",
    }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f8f9fb"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span style={{ background: "#0052ff", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: 700 }}>{badge}</span>}
    </Link>
  );
}
