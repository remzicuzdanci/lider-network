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
  Bell, User, Phone, Mail, Globe, ChevronRight,
  AlertCircle, ShieldCheck, Headphones, FileText,
  ArrowUpRight, Zap,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60)    return "az önce";
  if (d < 3600)  return `${Math.floor(d / 60)}dk önce`;
  if (d < 86400) return `${Math.floor(d / 3600)}sa önce`;
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

type ActivePage = "panel" | "profil" | "sla" | "bildirimler";

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
  const [activePage, setActivePage] = useState<ActivePage>("panel");

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
    total:       tickets.length,
  };

  const initials = fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6fb", fontFamily: "var(--font-family-body)" }}>

      {/* ══════════════════════════════════════════════════════ SIDEBAR */}
      <aside style={{
        width: "260px", flexShrink: 0,
        background: "#fff",
        borderRight: "1px solid #e5e7ef",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f0f2f8" }}>
          <Image src="/logo.png" alt="Lider Network" width={130} height={38} style={{ objectFit: "contain" }} />
          <div style={{ marginTop: "6px", fontSize: "10px", fontWeight: 700, color: "#0052ff", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Destek Portalı
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 10px" }}>

          {/* Ana Menü */}
          <SideSection label="Ana Menü" />
          <SideLink
            icon={<LayoutDashboard size={15} />}
            label="Kontrol Paneli"
            active={activePage === "panel" && statusFilter === "all"}
            onClick={() => { setActivePage("panel"); setFilter("all"); }}
          />
          <SideLink
            href={paths.yeni}
            icon={<Plus size={15} />}
            label="Yeni Talep Oluştur"
            highlight
          />

          {/* Talepler */}
          <SideSection label="Taleplerim" />
          <SideLink
            icon={<Clock size={15} />}
            label="Açık Talepler"
            badge={counts.open || undefined}
            badgeColor="#3b82f6"
            onClick={() => { setActivePage("panel"); setFilter("open"); }}
            active={activePage === "panel" && statusFilter === "open"}
          />
          <SideLink
            icon={<Activity size={15} />}
            label="İşlemdekiler"
            badge={counts.in_progress || undefined}
            badgeColor="#8b5cf6"
            onClick={() => { setActivePage("panel"); setFilter("in_progress"); }}
            active={activePage === "panel" && statusFilter === "in_progress"}
          />
          <SideLink
            icon={<CheckCircle size={15} />}
            label="Çözülenler"
            badge={counts.resolved || undefined}
            badgeColor="#22c55e"
            onClick={() => { setActivePage("panel"); setFilter("resolved"); }}
            active={activePage === "panel" && statusFilter === "resolved"}
          />
          <SideLink
            icon={<FileText size={15} />}
            label="Tüm Talepler"
            badge={counts.total || undefined}
            badgeColor="#64748b"
            onClick={() => { setActivePage("panel"); setFilter("all"); }}
            active={activePage === "panel" && statusFilter === "all"}
          />

          {/* Hesabım */}
          <SideSection label="Hesabım" />
          <SideLink
            icon={<User size={15} />}
            label="Profilim"
            active={activePage === "profil"}
            onClick={() => setActivePage("profil")}
          />
          <SideLink
            icon={<Bell size={15} />}
            label="Bildirimler"
            badge={counts.open > 0 ? counts.open : undefined}
            badgeColor="#ef4444"
            active={activePage === "bildirimler"}
            onClick={() => setActivePage("bildirimler")}
          />
          <SideLink
            icon={<ShieldCheck size={15} />}
            label="SLA & Öncelikler"
            active={activePage === "sla"}
            onClick={() => setActivePage("sla")}
          />

          {/* Hızlı İletişim */}
          <SideSection label="Hızlı İletişim" />
          <div style={{ margin: "4px 6px 2px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e5e7ef", padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Phone size={13} color="#0052ff" />
              <a href="tel:+903122320288" style={{ fontSize: "13px", fontWeight: 600, color: "#1a1d2e", textDecoration: "none" }}>+90 312 232 02 88</a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Mail size={13} color="#0052ff" />
              <a href="mailto:destek@lidernetwork.com.tr" style={{ fontSize: "11px", color: "#0052ff", textDecoration: "none" }}>destek@lidernetwork.com.tr</a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Globe size={13} color="#6b7280" />
              <a href="https://www.lidernetwork.com.tr" target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#6b7280", textDecoration: "none" }}>lidernetwork.com.tr</a>
            </div>
          </div>

          {/* Çalışma saatleri */}
          <div style={{ margin: "8px 6px 0", borderRadius: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#15803d" }}>Destek Hattı Açık</span>
            </div>
            <div style={{ fontSize: "11px", color: "#16a34a", lineHeight: 1.5 }}>
              Pzt – Cum: 09:00 – 18:00<br />
              Cmt: 09:00 – 13:00
            </div>
          </div>
        </nav>

        {/* User */}
        <div style={{ padding: "12px 14px", borderTop: "1px solid #f0f2f8", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#0052ff,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fullName}</p>
            <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{company || userEmail}</p>
          </div>
          <button onClick={logout} title="Çıkış Yap" style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px", borderRadius: "6px", display: "flex", alignItems: "center" }}>
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════ MAIN */}
      <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>

        {activePage === "profil" ? (
          <ProfilPage fullName={fullName} userEmail={userEmail} company={company} initials={initials} />
        ) : activePage === "sla" ? (
          <SlaPage />
        ) : activePage === "bildirimler" ? (
          <BildirimlerPage tickets={tickets} counts={counts} paths={paths} />
        ) : (
          <>
            {/* Header — dinamik başlık */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-family-headline)", fontSize: "22px", fontWeight: 800, color: "#1a1d2e", margin: "0 0 4px" }}>
                  {statusFilter === "open" ? "Açık Talepler" :
                   statusFilter === "in_progress" ? "İşlemdeki Talepler" :
                   statusFilter === "resolved" ? "Çözülen Talepler" :
                   statusFilter === "closed" ? "Kapalı Talepler" :
                   `Hoş geldiniz, ${fullName.split(" ")[0]}! 👋`}
                </h1>
                <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>
                  {statusFilter === "open" ? `${counts.open} açık talep — yanıt bekleniyor` :
                   statusFilter === "in_progress" ? `${counts.in_progress} talep işlemde` :
                   statusFilter === "resolved" ? `${counts.resolved} talep çözüldü` :
                   statusFilter === "closed" ? "Kapatılmış talepler" :
                   "Destek taleplerinizi buradan yönetebilir ve takip edebilirsiniz."}
                </p>
              </div>
              <Link href={paths.yeni} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 22px", background: "#0052ff", color: "#fff", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "14px", fontFamily: "var(--font-family-headline)", boxShadow: "0 4px 12px rgba(0,82,255,.3)" }}>
                <Plus size={16} /> Yeni Talep
              </Link>
            </div>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "24px" }}>
              {[
                { key: "open",        label: "Açık Talepler",  value: counts.open,        color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", icon: <Clock size={20} color="#3b82f6" /> },
                { key: "in_progress", label: "İşlemdeki",      value: counts.in_progress, color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", icon: <Activity size={20} color="#8b5cf6" /> },
                { key: "resolved",    label: "Çözülen / Kapalı", value: counts.resolved,  color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", icon: <CheckCircle size={20} color="#22c55e" /> },
              ].map((s) => (
                <button key={s.key} onClick={() => setFilter(statusFilter === s.key ? "all" : s.key)}
                  style={{ padding: "20px 22px", background: statusFilter === s.key ? s.bg : "#fff", border: `1.5px solid ${statusFilter === s.key ? s.border : "#e5e7ef"}`, borderRadius: "14px", textAlign: "left", cursor: "pointer", transition: "all .15s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ padding: "8px", background: s.bg, borderRadius: "8px", border: `1px solid ${s.border}` }}>{s.icon}</div>
                    <ChevronRight size={14} color="#d1d5db" />
                  </div>
                  <p style={{ margin: "0 0 2px", fontSize: "12px", fontWeight: 600, color: "#6b7280" }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: "30px", fontWeight: 900, color: statusFilter === s.key ? s.color : "#1a1d2e", fontFamily: "var(--font-family-headline)" }}>{s.value}</p>
                </button>
              ))}
            </div>

            {/* Urgent banner */}
            {counts.open > 0 && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "12px 18px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: "13px", color: "#92400e", fontWeight: 600 }}>
                  {counts.open} açık talebiniz var — yanıt bekleniyor.
                </p>
                <button onClick={() => setFilter("open")} style={{ marginLeft: "auto", background: "none", border: "1px solid #fcd34d", borderRadius: "6px", padding: "4px 12px", fontSize: "12px", fontWeight: 600, color: "#d97706", cursor: "pointer" }}>
                  Görüntüle
                </button>
              </div>
            )}

            {/* Filter + search */}
            <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "12px", padding: "14px 16px", marginBottom: "12px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
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
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,82,255,.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e)  => { e.currentTarget.style.borderColor = "#e5e7ef"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
                    >
                      <div style={{ flexShrink: 0, width: "48px", height: "48px", borderRadius: "10px", background: "#f4f6fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "var(--font-family-label)", fontSize: "12px", fontWeight: 800, color: "#0052ff" }}>#{String(t.ticket_number).padStart(4, "0")}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</p>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: "#9ca3af" }}>{CAT[t.category]}</span>
                          <span style={{ color: "#e5e7ef" }}>·</span>
                          <span style={{ fontSize: "12px", color: "#9ca3af" }}>{timeAgo(t.created_at)}</span>
                        </div>
                      </div>
                      <span style={{ flexShrink: 0, padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, background: pri.bg, color: pri.color }}>{pri.label}</span>
                      <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "8px", background: st.bg, fontSize: "12px", fontWeight: 600, color: st.text }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, flexShrink: 0 }} />
                        {st.label}
                      </span>
                      <ArrowUpRight size={14} color="#d1d5db" style={{ flexShrink: 0 }} />
                    </Link>
                  );
                })
              )}
            </div>

            {/* Bottom info cards */}
            {!loading && tickets.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "20px" }}>
                {/* SLA Bilgisi */}
                <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", padding: "20px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                    <Zap size={16} color="#0052ff" />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1d2e" }}>SLA Taahhütlerimiz</span>
                  </div>
                  {[
                    { label: "ACİL", time: "2 saat içinde yanıt", color: "#dc2626" },
                    { label: "Yüksek", time: "4 saat içinde yanıt", color: "#ea580c" },
                    { label: "Orta", time: "1 iş günü içinde yanıt", color: "#d97706" },
                    { label: "Düşük", time: "2 iş günü içinde yanıt", color: "#64748b" },
                  ].map((s) => (
                    <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f0f2f8" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: s.color }}>{s.label}</span>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>{s.time}</span>
                    </div>
                  ))}
                </div>

                {/* Hızlı İletişim */}
                <div style={{ background: "linear-gradient(135deg, #0040cc, #0052ff)", border: "none", borderRadius: "14px", padding: "20px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                    <Headphones size={16} color="#b7c4ff" />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Acil Destek Hattı</span>
                  </div>
                  <p style={{ fontSize: "22px", fontWeight: 900, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.5px" }}>+90 312 232 02 88</p>
                  <p style={{ fontSize: "12px", color: "#b7c4ff", margin: "0 0 16px" }}>Pzt–Cum 09:00–18:00, Cmt 09:00–13:00</p>
                  <a href="mailto:destek@lidernetwork.com.tr"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", color: "#fff", textDecoration: "none", fontWeight: 600 }}>
                    <Mail size={13} /> destek@lidernetwork.com.tr
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ── SLA Sayfası ────────────────────────────────────────────────────────────
function SlaPage() {
  const slaData = [
    { pri: "ACİL",    color: "#dc2626", bg: "#fef2f2", border: "#fecaca", response: "2 saat",     resolve: "8 saat",      desc: "Sistem tamamen çöktü, iş durdu" },
    { pri: "Yüksek",  color: "#ea580c", bg: "#fff7ed", border: "#fed7aa", response: "4 saat",     resolve: "24 saat",     desc: "Kritik işlevler etkilendi" },
    { pri: "Orta",    color: "#d97706", bg: "#fffbeb", border: "#fde68a", response: "1 iş günü",  resolve: "3 iş günü",   desc: "Kısmi etki, geçici çözüm mevcut" },
    { pri: "Düşük",   color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", response: "2 iş günü",  resolve: "5 iş günü",   desc: "Küçük sorun veya bilgi talebi" },
  ];

  return (
    <div style={{ maxWidth: "680px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "var(--font-family-headline)", fontSize: "22px", fontWeight: 800, color: "#1a1d2e", margin: "0 0 6px" }}>
          SLA & Öncelik Seviyeleri
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>
          Talep önceliğine göre garanti edilen yanıt ve çözüm sürelerimiz.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
        {slaData.map((s) => (
          <div key={s.pri} style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: "14px", padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "14px", fontWeight: 800, color: s.color, background: "#fff", border: `1px solid ${s.border}`, borderRadius: "20px", padding: "3px 14px" }}>{s.pri}</span>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>{s.desc}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ background: "#fff", borderRadius: "8px", padding: "12px 16px", border: `1px solid ${s.border}` }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>İlk Yanıt</div>
                <div style={{ fontSize: "20px", fontWeight: 900, color: s.color }}>{s.response}</div>
              </div>
              <div style={{ background: "#fff", borderRadius: "8px", padding: "12px 16px", border: `1px solid ${s.border}` }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>Çözüm Süresi</div>
                <div style={{ fontSize: "20px", fontWeight: 900, color: s.color }}>{s.resolve}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "16px 20px" }}>
        <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 700, color: "#1d4ed8" }}>📌 Önemli Notlar</p>
        <ul style={{ margin: "8px 0 0", paddingLeft: "18px", color: "#3b82f6", fontSize: "13px", lineHeight: 1.7 }}>
          <li>Süreler mesai saatleri içinde geçerlidir (Pzt–Cum 09:00–18:00).</li>
          <li>Acil talepler 7/24 izlenmektedir.</li>
          <li>SLA ihlali durumunda <a href="mailto:destek@lidernetwork.com.tr" style={{ color: "#0052ff" }}>destek@lidernetwork.com.tr</a> adresine yazın.</li>
        </ul>
      </div>
    </div>
  );
}

// ── Bildirimler Sayfası ────────────────────────────────────────────────────
function BildirimlerPage({ tickets, counts, paths }: { tickets: Ticket[]; counts: { open: number; in_progress: number }; paths: ReturnType<typeof useDestekPaths> }) {
  const openTickets = tickets.filter((t) => t.status === "open");
  const inProgress  = tickets.filter((t) => t.status === "in_progress");

  return (
    <div style={{ maxWidth: "680px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "var(--font-family-headline)", fontSize: "22px", fontWeight: 800, color: "#1a1d2e", margin: "0 0 6px" }}>
          Bildirimler
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Dikkat gerektiren talepleriniz.</p>
      </div>

      {counts.open === 0 && counts.in_progress === 0 ? (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "14px", padding: "32px", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>✅</div>
          <p style={{ fontWeight: 700, color: "#15803d", margin: "0 0 4px" }}>Tüm talepler güncel</p>
          <p style={{ fontSize: "13px", color: "#16a34a", margin: 0 }}>Bekleyen bildiriminiz bulunmuyor.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {openTickets.map((t) => (
            <Link key={t.id} href={paths.ticket(t.id)} style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "16px 20px", background: "#fff", border: "1.5px solid #bfdbfe", borderRadius: "12px", textDecoration: "none" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", flexShrink: 0, marginTop: 6 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: "14px", color: "#1a1d2e" }}>{t.subject}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>#{String(t.ticket_number).padStart(4,"0")} · Yanıt bekleniyor</p>
              </div>
              <span style={{ flexShrink: 0, background: "#eff6ff", color: "#1d4ed8", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>Açık</span>
            </Link>
          ))}
          {inProgress.map((t) => (
            <Link key={t.id} href={paths.ticket(t.id)} style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "16px 20px", background: "#fff", border: "1.5px solid #ddd6fe", borderRadius: "12px", textDecoration: "none" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6", flexShrink: 0, marginTop: 6 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: "14px", color: "#1a1d2e" }}>{t.subject}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>#{String(t.ticket_number).padStart(4,"0")} · İşlemde</p>
              </div>
              <span style={{ flexShrink: 0, background: "#f5f3ff", color: "#7c3aed", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>İşlemde</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Profil Sayfası ─────────────────────────────────────────────────────────
function ProfilPage({ fullName, userEmail, company, initials }: { fullName: string; userEmail: string; company?: string | null; initials: string }) {
  return (
    <div style={{ maxWidth: "620px" }}>
      <h1 style={{ fontFamily: "var(--font-family-headline)", fontSize: "22px", fontWeight: 800, color: "#1a1d2e", margin: "0 0 6px" }}>Profilim</h1>
      <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 28px" }}>Hesap bilgilerinizi görüntüleyin.</p>

      {/* Avatar card */}
      <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "16px", padding: "28px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#0052ff,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#1a1d2e" }}>{fullName}</p>
            {company && <p style={{ margin: "2px 0 0", fontSize: "14px", color: "#6b7280" }}>{company}</p>}
            <span style={{ display: "inline-block", marginTop: "6px", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "2px 12px", fontSize: "11px", fontWeight: 700 }}>✓ Onaylı Hesap</span>
          </div>
        </div>

        {[
          { label: "E-posta Adresi", value: userEmail, icon: <Mail size={14} color="#0052ff" /> },
          { label: "Şirket", value: company || "—", icon: <User size={14} color="#0052ff" /> },
        ].map((f) => (
          <div key={f.label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0", borderTop: "1px solid #f0f2f8" }}>
            <div style={{ flexShrink: 0, width: 32, height: 32, background: "#eff6ff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>{f.icon}</div>
            <div>
              <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
              <div style={{ fontSize: "14px", color: "#1a1d2e", fontWeight: 600, marginTop: "2px" }}>{f.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "14px 18px" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "#1d4ed8", lineHeight: 1.6 }}>
          Bilgilerinizi güncellemek için <a href="mailto:destek@lidernetwork.com.tr" style={{ color: "#0052ff", fontWeight: 700 }}>destek@lidernetwork.com.tr</a> adresine yazın.
        </p>
      </div>
    </div>
  );
}

// ── Sidebar helpers ───────────────────────────────────────────────────────────
function SideSection({ label }: { label: string }) {
  return (
    <p style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".8px", padding: "12px 10px 4px", margin: 0 }}>{label}</p>
  );
}

function SideLink({
  href, icon, label, badge, badgeColor, active, onClick, highlight,
}: {
  href?: string; icon: React.ReactNode; label: string;
  badge?: number; badgeColor?: string; active?: boolean; onClick?: () => void; highlight?: boolean;
}) {
  const style: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "8px 10px", borderRadius: "8px", textDecoration: "none",
    background: highlight ? "#0052ff" : active ? "#eff6ff" : "transparent",
    color: highlight ? "#fff" : active ? "#0052ff" : "#6b7280",
    fontSize: "13px", fontWeight: active || highlight ? 600 : 400,
    transition: "all .15s", marginBottom: "1px",
    cursor: "pointer", border: "none", width: "100%", textAlign: "left",
  };

  const inner = (
    <>
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && (
        <span style={{ background: badgeColor || "#0052ff", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "10px", fontWeight: 700 }}>{badge}</span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} style={style}
        onMouseEnter={(e) => { if (!active && !highlight) e.currentTarget.style.background = "#f8f9fb"; }}
        onMouseLeave={(e) => { if (!active && !highlight) e.currentTarget.style.background = "transparent"; }}
      >{inner}</Link>
    );
  }

  return (
    <button style={style} onClick={onClick}
      onMouseEnter={(e) => { if (!active && !highlight) (e.currentTarget as HTMLElement).style.background = "#f8f9fb"; }}
      onMouseLeave={(e) => { if (!active && !highlight) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >{inner}</button>
  );
}
