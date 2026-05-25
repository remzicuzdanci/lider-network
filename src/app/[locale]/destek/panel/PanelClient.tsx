"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import type { Ticket } from "@/lib/supabase";
import {
  Plus, LogOut, TicketCheck, Clock, CheckCircle,
  XCircle, ChevronRight, Search,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60)    return "az önce";
  if (d < 3600)  return `${Math.floor(d / 60)}dk önce`;
  if (d < 86400) return `${Math.floor(d / 3600)}s önce`;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

const STATUS: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  open:        { label: "Açık",     bg: "rgba(0,82,255,.15)",    text: "#93c5fd", icon: <Clock size={12} />      },
  in_progress: { label: "İşlemde",  bg: "rgba(124,58,237,.15)",  text: "#c4b5fd", icon: <TicketCheck size={12} /> },
  resolved:    { label: "Çözüldü",  bg: "rgba(22,163,74,.15)",   text: "#86efac", icon: <CheckCircle size={12} /> },
  closed:      { label: "Kapalı",   bg: "rgba(71,85,105,.2)",    text: "#94a3b8", icon: <XCircle size={12} />     },
};
const PRI: Record<string, { label: string; color: string }> = {
  low: { label: "Düşük", color: "#64748b" }, medium: { label: "Orta", color: "#d97706" },
  high: { label: "Yüksek", color: "#ea580c" }, urgent: { label: "ACİL", color: "#dc2626" },
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
  const [tickets, setTickets]       = useState<Ticket[]>([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setFilter]   = useState("all");
  const [search, setSearch]         = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/destek/tickets");
    if (res.ok) {
      const data = await res.json();
      setTickets(data.tickets || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  async function logout() {
    const sb = createSupabaseBrowser();
    await sb.auth.signOut();
    router.push(`/${locale}/destek`);
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

  return (
    <div style={{ minHeight: "calc(100vh - 80px)", background: "var(--color-background)" }}>
      {/* Panel header */}
      <div style={{
        background: "#1d2022", borderBottom: "1px solid #434656",
        padding: "0 32px", display: "flex", alignItems: "center",
        gap: "16px", height: "56px",
      }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "13px", color: "#8d90a2" }}>Destek Paneli</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#e0e3e5" }}>{fullName}</p>
            {company && <p style={{ margin: 0, fontSize: "11px", color: "#8d90a2" }}>{company}</p>}
          </div>
          <button onClick={logout}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "6px 12px", border: "1px solid #434656",
              borderRadius: "7px", background: "transparent",
              color: "#8d90a2", fontSize: "13px", cursor: "pointer",
            }}>
            <LogOut size={14} /> Çıkış
          </button>
        </div>
      </div>

      <div style={{ padding: "28px 32px", maxWidth: "1100px", margin: "0 auto" }}>
        {/* Welcome + CTA */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-family-headline)", fontSize: "24px", fontWeight: 800, color: "#e0e3e5", margin: "0 0 4px" }}>
              Hoş geldiniz, {fullName.split(" ")[0]}!
            </h1>
            <p style={{ color: "#8d90a2", fontSize: "14px", margin: 0 }}>
              Destek taleplerinizi bu panel üzerinden yönetebilirsiniz.
            </p>
          </div>
          <Link href={`/${locale}/destek/panel/yeni`}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "11px 22px", background: "#0052ff",
              color: "#fff", borderRadius: "9px", textDecoration: "none",
              fontWeight: 800, fontSize: "14px",
              fontFamily: "var(--font-family-headline)",
              boxShadow: "0 4px 16px rgba(0,82,255,.3)",
            }}>
            <Plus size={16} /> Yeni Talep Oluştur
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "14px", marginBottom: "24px", flexWrap: "wrap" }}>
          {[
            { key: "open",        label: "Açık Talep",   color: "#93c5fd", bg: "rgba(0,82,255,.12)",   count: counts.open        },
            { key: "in_progress", label: "İşlemde",      color: "#c4b5fd", bg: "rgba(124,58,237,.12)", count: counts.in_progress  },
            { key: "resolved",    label: "Çözüldü",      color: "#86efac", bg: "rgba(22,163,74,.12)",  count: counts.resolved     },
          ].map((s) => (
            <button key={s.key}
              onClick={() => setFilter(statusFilter === s.key ? "all" : s.key)}
              style={{
                flex: 1, minWidth: "140px", padding: "18px 20px",
                background: s.bg, border: `1px solid ${statusFilter === s.key ? s.color : "transparent"}`,
                borderRadius: "12px", textAlign: "left", cursor: "pointer",
                transition: "border-color .15s",
              }}>
              <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: ".5px" }}>
                {s.label}
              </p>
              <p style={{ margin: 0, fontSize: "30px", fontWeight: 900, color: s.color, fontFamily: "var(--font-family-headline)" }}>
                {s.count}
              </p>
            </button>
          ))}
        </div>

        {/* Filters + Search */}
        <div style={{
          background: "#1d2022", border: "1px solid #434656",
          borderRadius: "12px", padding: "14px 18px",
          display: "flex", gap: "10px", alignItems: "center",
          flexWrap: "wrap", marginBottom: "14px",
        }}>
          {[["all","Tümü"],["open","Açık"],["in_progress","İşlemde"],["resolved","Çözüldü"],["closed","Kapalı"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              style={{
                padding: "5px 14px", borderRadius: "6px", border: "1px solid",
                borderColor: statusFilter === v ? "#0052ff" : "#434656",
                background: statusFilter === v ? "rgba(0,82,255,.15)" : "transparent",
                color: statusFilter === v ? "#b7c4ff" : "#8d90a2",
                fontSize: "13px", fontWeight: statusFilter === v ? 700 : 400,
                cursor: "pointer",
              }}>
              {l}
            </button>
          ))}
          <div style={{ flex: 1, minWidth: "180px", display: "flex", alignItems: "center", gap: "8px", background: "#272a2c", border: "1px solid #434656", borderRadius: "7px", padding: "6px 12px" }}>
            <Search size={14} color="#8d90a2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Konu ara..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e0e3e5", fontSize: "13px", fontFamily: "inherit" }}
            />
          </div>
        </div>

        {/* Ticket list */}
        <div style={{ background: "#1d2022", border: "1px solid #434656", borderRadius: "12px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#8d90a2" }}>Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "56px", textAlign: "center" }}>
              <TicketCheck size={40} color="#434656" style={{ marginBottom: "12px" }} />
              <p style={{ color: "#8d90a2", fontSize: "15px", margin: 0 }}>
                {tickets.length === 0 ? "Henüz destek talebiniz bulunmuyor." : "Sonuç bulunamadı."}
              </p>
              {tickets.length === 0 && (
                <Link href={`/${locale}/destek/panel/yeni`}
                  style={{ display: "inline-block", marginTop: "16px", padding: "10px 20px", background: "#0052ff", color: "#fff", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: 700 }}>
                  İlk Talebi Oluştur
                </Link>
              )}
            </div>
          ) : (
            <div>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 90px 80px 100px 80px 24px", gap: "12px", padding: "10px 20px", borderBottom: "1px solid #434656" }}>
                {["#No", "Konu", "Kategori", "Öncelik", "Durum", "Tarih", ""].map((h) => (
                  <span key={h} style={{ fontSize: "11px", fontWeight: 700, color: "#8d90a2", textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</span>
                ))}
              </div>
              {filtered.map((t) => {
                const st  = STATUS[t.status] || STATUS.open;
                const pri = PRI[t.priority]  || PRI.medium;
                return (
                  <Link key={t.id} href={`/${locale}/destek/panel/${t.id}`}
                    style={{ display: "grid", gridTemplateColumns: "80px 1fr 90px 80px 100px 80px 24px", gap: "12px", padding: "14px 20px", borderBottom: "1px solid rgba(67,70,86,.4)", textDecoration: "none", transition: "background .1s", alignItems: "center" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#272a2c")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontFamily: "var(--font-family-label)", fontSize: "12px", fontWeight: 700, color: "#b7c4ff" }}>
                      #{String(t.ticket_number).padStart(4, "0")}
                    </span>
                    <span style={{ fontSize: "14px", color: "#e0e3e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.subject}
                    </span>
                    <span style={{ fontSize: "12px", color: "#8d90a2" }}>{CAT[t.category]}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: pri.color }}>{pri.label}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "20px", background: st.bg, fontSize: "11px", fontWeight: 700, color: st.text }}>
                      {st.icon}{st.label}
                    </span>
                    <span style={{ fontSize: "12px", color: "#8d90a2" }}>{timeAgo(t.created_at)}</span>
                    <ChevronRight size={14} color="#8d90a2" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
