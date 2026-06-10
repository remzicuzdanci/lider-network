"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Ticket, Company } from "@/lib/supabase";
import {
  TicketCheck, Users, BarChart2, LogOut, RefreshCw,
  Clock, Activity, CheckCircle, AlertCircle, Building2,
  UserCog, Plus, X, ArrowUpRight, TrendingUp, Filter,
  Zap, ShieldCheck, ChevronRight, ListTodo, Menu, StickyNote, Trash2, FileText, Shield,
} from "lucide-react";
import IsPlani from "./IsPlani";
import PersonelNotlari from "./PersonelNotlari";
import Teklifler from "./Teklifler";
import FortigateAssist from "./FortigateAssist";

// Mobile responsive hook
function useWindowSize() {
  const [size, setSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1200 });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
}

// ── helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "az önce";
  if (d < 3600) return `${Math.floor(d / 60)}dk`;
  if (d < 86400) return `${Math.floor(d / 3600)}sa`;
  return `${Math.floor(d / 86400)}g`;
}
function slaDue(t: Ticket): { label: string; color: string; bg: string } {
  if (t.status === "resolved" || t.status === "closed") return { label: "Tamamlandı", color: "#15803d", bg: "#f0fdf4" };
  const slaH: Record<string, number> = { urgent: 2, high: 4, medium: 8, low: 24 };
  const rem = (slaH[t.priority] ?? 8) - (Date.now() - new Date(t.created_at).getTime()) / 3600000;
  if (rem < 0) return { label: `${Math.abs(Math.round(rem))}sa gecikti`, color: "#dc2626", bg: "#fef2f2" };
  if (rem < 1) return { label: `${Math.round(rem * 60)}dk kaldı`, color: "#ea580c", bg: "#fff7ed" };
  return { label: `${Math.round(rem)}sa kaldı`, color: "#d97706", bg: "#fffbeb" };
}

const STATUS_LABEL: Record<string, string> = { open: "Açık", in_progress: "İşlemde", resolved: "Çözüldü", closed: "Kapalı" };
const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  open:        { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
  in_progress: { bg: "#f5f3ff", text: "#7c3aed", dot: "#8b5cf6" },
  resolved:    { bg: "#f0fdf4", text: "#15803d", dot: "#22c55e" },
  closed:      { bg: "#f8fafc", text: "#475569", dot: "#94a3b8" },
};
const PRI_LABEL: Record<string, string> = { low: "Düşük", medium: "Orta", high: "Yüksek", urgent: "ACİL" };
const PRI_COLOR: Record<string, { text: string; bg: string }> = {
  low:    { text: "#64748b", bg: "#f1f5f9" },
  medium: { text: "#d97706", bg: "#fffbeb" },
  high:   { text: "#ea580c", bg: "#fff7ed" },
  urgent: { text: "#dc2626", bg: "#fef2f2" },
};
const CAT_LABEL: Record<string, string> = { technical: "Teknik", billing: "Fatura", general: "Genel", feature_request: "Özellik" };
const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const SECTORS = ["Savunma & Kamu","Sağlık","Üretim & Sanayi","Eğitim","Enerji","Kurumsal & Finans","Turizm & Otelcilik","İnşaat & Gayrimenkul","BT & Yazılım","Perakende","Diğer"];

interface Stats { open: number; in_progress: number; resolved_today: number; total: number; urgent: number; avg_response_min: number | null; }
interface Customer { id: string; full_name: string; company: string | null; phone: string | null; email: string; approved: boolean; created_at: string; }
interface StaffMember { id: string; email: string; name: string; role: string; active: boolean; created_at: string; }

type Tab = "tickets" | "customers" | "companies" | "prospects" | "staff" | "reports" | "isplan" | "notes" | "quotes" | "fortigate";

// ── Small UI helpers ──────────────────────────────────────────────────────────
function NavItem({ icon, label, active, badge, badgeColor, tag, onClick }: {
  icon: React.ReactNode; label: string; active?: boolean; badge?: number; badgeColor?: string; tag?: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "10px",
      border: "none", width: "100%", textAlign: "left",
      background: active ? "#eff6ff" : "transparent",
      color: active ? "#0052ff" : "#6b7280", fontSize: "13px", fontWeight: active ? 700 : 500,
      cursor: "pointer", transition: "all .15s", marginBottom: "2px",
    }}
    onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "#f8f9fb"; }}
    onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
      <span style={{ color: active ? "#0052ff" : "#9ca3af", display: "flex" }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {tag && (
        <span style={{ background: "linear-gradient(135deg,#7c3aed,#0052ff)", color: "#fff", borderRadius: "6px", padding: "1px 6px", fontSize: "9px", fontWeight: 800, letterSpacing: ".5px", display: "inline-flex", alignItems: "center", gap: "2px" }}>✨ {tag}</span>
      )}
      {badge !== undefined && badge > 0 && (
        <span style={{ background: badgeColor || "#0052ff", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "10px", fontWeight: 700 }}>{badge}</span>
      )}
    </button>
  );
}
function SideSection({ label }: { label: string }) {
  return <p style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".8px", padding: "12px 12px 4px", margin: 0 }}>{label}</p>;
}
function Fbtn({ val, cur, set, label }: { val: string; cur: string; set: (v: string) => void; label: string }) {
  const a = cur === val;
  return (
    <button onClick={() => set(val)} style={{ padding: "5px 13px", borderRadius: "8px", border: `1.5px solid ${a ? "#0052ff" : "#e5e7ef"}`, background: a ? "#eff6ff" : "transparent", color: a ? "#0052ff" : "#6b7280", fontSize: "13px", fontWeight: a ? 700 : 400, cursor: "pointer" }}>
      {label}
    </button>
  );
}
function StatCard({ label, value, sub, icon, color, bg, border }: {
  label: string; value: string | number; sub?: string; icon?: React.ReactNode; color?: string; bg?: string; border?: string;
}) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${border || "#e5e7ef"}`, borderRadius: "14px", padding: "20px 22px", flex: 1, minWidth: 0, borderTop: color ? `3px solid ${color}` : undefined }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        {icon && <div style={{ padding: "8px", background: bg || "#f4f6fb", borderRadius: "8px", border: `1px solid ${border || "#e5e7ef"}` }}>{icon}</div>}
      </div>
      <p style={{ fontSize: "32px", fontWeight: 900, color: color || "#1a1d2e", margin: "0 0 2px", fontFamily: "var(--font-family-headline)", lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>{label}</p>
      {sub && <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0" }}>{sub}</p>}
    </div>
  );
}

const inpS: React.CSSProperties = {
  padding: "8px 12px", background: "#fff", border: "1.5px solid #e5e7ef",
  borderRadius: "8px", color: "#1a1d2e", fontSize: "13px", outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isTablet = width < 1024;

  const [tab, setTab] = useState<Tab>("tickets");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [quoteCounts, setQuoteCounts] = useState<Record<string, number>>({});
  const [quotesFilterCompany, setQuotesFilterCompany] = useState("");

  // Session
  const [sessionName, setSessionName] = useState("Admin");
  const [sessionRole, setSessionRole] = useState("super_admin");

  // Tickets
  const [tickets, setTickets]         = useState<Ticket[]>([]);
  const [stats, setStats]             = useState<Stats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [total, setTotal]             = useState(0);
  const [statusF, setStatusF]         = useState("all");
  const [priorityF, setPriorityF]     = useState("all");
  const [categoryF, setCategoryF]     = useState("all");
  const [dateF, setDateF]             = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]           = useState("");

  // Customers
  const [customers, setCustomers]     = useState<Customer[]>([]);
  const [custFilter, setCustFilter]   = useState("all");
  const [custLoading, setCustLoading] = useState(false);

  // Companies
  const [companies, setCompanies]         = useState<Company[]>([]);
  const [compLoading, setCompLoading]     = useState(false);
  const [compModal, setCompModal]         = useState<Partial<Company> | null>(null); // null = closed, {} = new
  const [compSaving, setCompSaving]       = useState(false);

  // Staff - loaded from staff_users table via /api/admin/staff
  const [staff, setStaff]             = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSetupDone, setStaffSetupDone] = useState(false);

  // Internal ticket modal
  const [newTicketModal, setNewTicketModal]   = useState(false);
  const [ntCompanyId, setNtCompanyId]         = useState("");
  const [ntCategory, setNtCategory]           = useState("internet_ag");
  const [ntIssueType, setNtIssueType]         = useState("");
  const [ntCustomSubject, setNtCustomSubject] = useState("");
  const [ntPriority, setNtPriority]           = useState("medium");
  const [ntStartedAt, setNtStartedAt]         = useState("");
  const [ntAffected, setNtAffected]           = useState("1_kisi");
  const [ntAffectedName, setNtAffectedName]   = useState("");
  const [ntNotifyEmail, setNtNotifyEmail]     = useState("");
  const [ntCompanyEmails, setNtCompanyEmails] = useState<string[]>([]);
  const [ntSupportType, setNtSupportType]     = useState("remote");
  const [ntNotes, setNtNotes]                 = useState("");
  const [ntSaving, setNtSaving]               = useState(false);
  const [ntError, setNtError]                 = useState("");

  // Password change modal
  const [pwModal, setPwModal]           = useState(false);
  const [pwCurrent, setPwCurrent]       = useState("");
  const [pwNew, setPwNew]               = useState("");
  const [pwConfirm, setPwConfirm]       = useState("");
  const [pwSaving, setPwSaving]         = useState(false);
  const [pwError, setPwError]           = useState("");
  const [pwSuccess, setPwSuccess]       = useState("");

  // SLA toast
  const [slaToast, setSlaToast]         = useState("");
  const [slaChecking, setSlaChecking]   = useState(false);

  // Monthly summary toast
  const [mSummaryToast, setMSummaryToast] = useState("");

  // Reports extra filters
  const [rptCompanyId, setRptCompanyId] = useState("all");
  const [rptSource, setRptSource]       = useState("all");
  const [rptStaff, setRptStaff]         = useState("all");

  // Reports
  const now = new Date();
  const [rptCustomer, setRptCustomer] = useState("all");
  const [rptDateMode, setRptDateMode] = useState<"preset"|"month"|"range">("preset");
  const [rptPreset, setRptPreset]     = useState("month");
  const [rptMonth, setRptMonth]       = useState(now.getMonth());
  const [rptYear, setRptYear]         = useState(now.getFullYear());
  const [rptFrom, setRptFrom]         = useState("");
  const [rptTo, setRptTo]             = useState("");
  const [allTickets, setAllTickets]   = useState<Ticket[]>([]);

  // ── Session ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/auth").then(r => r.json()).then(d => {
      if (d.name) setSessionName(d.name);
      if (d.role) setSessionRole(d.role);
    });
  }, []);

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

  const fetchStats       = useCallback(async () => { const r = await fetch("/api/admin/stats"); if (r.ok) setStats(await r.json()); }, []);
  const fetchAllTickets  = useCallback(async () => { const r = await fetch("/api/tickets?limit=500"); if (r.ok) setAllTickets((await r.json()).tickets || []); }, []);
  const fetchCustomers   = useCallback(async () => { setCustLoading(true); const r = await fetch(`/api/admin/customers?filter=${custFilter}`); if (r.ok) setCustomers((await r.json()).customers || []); setCustLoading(false); }, [custFilter]);
  const fetchCompanies   = useCallback(async () => { setCompLoading(true); const r = await fetch("/api/admin/companies"); if (r.ok) setCompanies((await r.json()).companies || []); setCompLoading(false); }, []);
  const fetchStaff       = useCallback(async () => { setStaffLoading(true); const r = await fetch("/api/admin/staff"); if (r.ok) setStaff((await r.json()).staff || []); setStaffLoading(false); }, []);

  useEffect(() => { fetchTickets(); fetchStats(); fetchAllTickets(); fetchCompanies(); fetchStaff(); }, [fetchTickets, fetchStats, fetchAllTickets, fetchCompanies, fetchStaff]);

  // Otomatik tazeleme: 60 sn'de bir, sayfa görünürken ve modal açık değilken
  // talep listesi + istatistikler + rozetler arka planda güncellenir (sayfa yenilenmez)
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (newTicketModal || compModal) return; // form açıkken bölme
      fetchTickets(); fetchStats(); fetchAllTickets();
    }, 60000);
    return () => clearInterval(id);
  }, [fetchTickets, fetchStats, fetchAllTickets, newTicketModal, compModal]);
  // Şirket seçilince o şirkete ait daha önce kullanılmış bildirim e-postalarını getir
  useEffect(() => {
    if (!ntCompanyId) { setNtCompanyEmails([]); return; }
    let active = true;
    fetch(`/api/admin/company-emails?company_id=${ntCompanyId}`)
      .then(r => r.ok ? r.json() : { emails: [] })
      .then(d => { if (active) setNtCompanyEmails(d.emails || []); })
      .catch(() => { if (active) setNtCompanyEmails([]); });
    return () => { active = false; };
  }, [ntCompanyId]);

  useEffect(() => { if (tab === "customers") fetchCustomers(); }, [tab, fetchCustomers]);
  useEffect(() => { if (tab === "companies" || tab === "prospects") fetchCompanies(); }, [tab, fetchCompanies]);
  // Şirket başına teklif sayısı (Şirketler ve Teklifler sekmesinde gösterilir)
  useEffect(() => {
    if (tab !== "companies" && tab !== "prospects" && tab !== "quotes") return;
    let active = true;
    fetch("/api/admin/quotes").then(r => r.ok ? r.json() : { quotes: [] }).then(d => {
      if (!active) return;
      const counts: Record<string, number> = {};
      (d.quotes || []).forEach((q: { company_id?: string }) => { if (q.company_id) counts[q.company_id] = (counts[q.company_id] || 0) + 1; });
      setQuoteCounts(counts);
    }).catch(() => {});
    return () => { active = false; };
  }, [tab]);
  useEffect(() => { if (tab === "staff") fetchStaff(); }, [tab, fetchStaff]);

  async function logout() { await fetch("/api/admin/auth", { method: "DELETE" }); router.push("/admin/login"); }

  async function handleCustomerAction(id: string, action: "approve" | "reject") {
    const r = await fetch("/api/admin/customers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
    if (r.ok) fetchCustomers();
  }

  // ── Company CRUD ───────────────────────────────────────────────────────────
  async function saveCompany() {
    if (!compModal) return;
    setCompSaving(true);
    const method = compModal.id ? "PATCH" : "POST";
    const url = "/api/admin/companies";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(compModal) });
    setCompSaving(false);
    setCompModal(null);
    fetchCompanies();
  }
  async function deactivateCompany(id: string, name: string) {
    if (!confirm(`"${name}" şirketini devre dışı bırak?`)) return;
    await fetch("/api/admin/companies", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchCompanies();
  }

  // ── Internal ticket ────────────────────────────────────────────────────────
  const NT_ISSUES: Record<string, { label: string; emoji: string; items: string[] }> = {
    internet_ag: { label: "İnternet & Ağ", emoji: "🌐", items: [
      "İnternet bağlantısı tamamen yok",
      "İnternet bağlantısı yavaş / kesintili",
      "Wi-Fi ağına bağlanamıyor",
      "Wi-Fi şifre / erişim sorunu",
      "VPN bağlantısı kurulamıyor",
      "VPN bağlantısı düşüyor",
      "Ağ cihazı arızası (switch / router)",
      "Yerel ağ (LAN) erişim sorunu",
      "IP / DNS yapılandırma sorunu",
      "Diğer ağ sorunu",
    ]},
    donanim: { label: "Donanım & Cihaz", emoji: "🖥️", items: [
      "Bilgisayar açılmıyor / başlamıyor",
      "Bilgisayar çok yavaş / donuyor / kasıyor",
      "Bilgisayar beklenmedik şekilde kapanıyor",
      "Ekran / monitör görüntü vermiyor",
      "Klavye veya fare çalışmıyor",
      "Yazıcı bağlanamıyor / yazdırmıyor",
      "Yazıcı kağıt sıkışması / mekanik arıza",
      "Tarayıcı (scanner) çalışmıyor",
      "UPS / güç kaynağı arızası",
      "Harici disk / USB cihaz tanınmıyor",
      "Diğer donanım sorunu",
    ]},
    yazilim: { label: "Yazılım & Program", emoji: "💻", items: [
      "Program açılmıyor veya hata veriyor",
      "Program yavaş çalışıyor / donuyor",
      "Windows / işletim sistemi sorunu",
      "Windows güncelleme hatası",
      "Microsoft Office açılmıyor / hata",
      "Microsoft 365 lisans / aktivasyon sorunu",
      "Muhasebe yazılımı sorunu (ETA / Logo / Zirve)",
      "ERP / kurumsal uygulama sorunu",
      "Antivirüs / güvenlik yazılımı sorunu",
      "Sürücü / driver güncelleme",
      "Yeni program kurulumu",
      "Diğer yazılım sorunu",
    ]},
    eposta: { label: "E-posta & İletişim", emoji: "📧", items: [
      "E-posta gönderilemiyor",
      "E-posta gelmiyor / alınamıyor",
      "Outlook açılmıyor veya hata veriyor",
      "Outlook hesap / profil kurulumu",
      "E-posta şifresi sıfırlama",
      "Şüpheli / spam e-posta sorunu",
      "Toplantı / takvim senkronizasyonu",
      "İmza / otomatik yanıt ayarı",
      "Diğer e-posta sorunu",
    ]},
    sunucu: { label: "Sunucu & Sistem", emoji: "🗄️", items: [
      "Sunucuya erişilemiyor",
      "Paylaşımlı klasöre / ağ sürücüsüne erişilemiyor",
      "Yedekleme hatası / yedek alınamıyor",
      "Veri kaybı / kurtarma talebi",
      "Uzak masaüstü (RDP) bağlantı sorunu",
      "Sunucu performans sorunu",
      "Disk doluluk uyarısı",
      "Diğer sunucu sorunu",
    ]},
    guvenlik: { label: "Güvenlik", emoji: "🔒", items: [
      "Virüs / fidye yazılımı (ransomware) şüphesi",
      "Yetkisiz erişim / hesap ele geçirme şüphesi",
      "Şüpheli e-posta / phishing girişimi",
      "Şifre sıfırlama / erişim yetkilendirme",
      "Kullanıcı hesabı kilitleme / açma",
      "Yetki / izin tanımlama sorunu",
      "Diğer güvenlik sorunu",
    ]},
    fortinet: { label: "Fortinet & Güvenlik Duvarı", emoji: "🛡️", items: [
      "FortiGate güvenlik duvarına erişilemiyor",
      "FortiGate kural / politika (policy) değişikliği",
      "VPN (IPsec / SSL) bağlantı sorunu",
      "VPN kullanıcı ekleme / yetkilendirme",
      "Web filtreleme / kategori engelleme ayarı",
      "Uygulama kontrolü (Application Control) ayarı",
      "IPS / antivirüs / tehdit engelleme",
      "Port yönlendirme (VIP / NAT) talebi",
      "FortiSwitch / FortiAP cihaz sorunu",
      "FortiClient kurulum / bağlantı sorunu",
      "Firmware güncelleme / yükseltme",
      "FortiGate yapılandırma yedeği alma",
      "Diğer Fortinet sorunu",
    ]},
    depolama: { label: "Depolama & Yedekleme", emoji: "💾", items: [
      "NAS / depolama cihazına erişilemiyor (Synology / QNAP)",
      "Paylaşımlı klasör / kota / izin sorunu",
      "Yedekleme hatası / yedek alınamıyor (Veeam vb.)",
      "Yedekten geri yükleme (restore) talebi",
      "Disk arızası / RAID uyarısı",
      "Disk doluluk / kapasite artırımı",
      "Veri taşıma / arşivleme talebi",
      "Diğer depolama sorunu",
    ]},
    kamera: { label: "Kamera & Zayıf Akım", emoji: "📹", items: [
      "Kamera görüntü vermiyor / siyah ekran",
      "Kayıt yapılmıyor / kayıt cihazı (NVR/DVR) sorunu",
      "Uzaktan kamera izleme erişim sorunu",
      "Yeni kamera kurulumu / ek kamera talebi",
      "Kamera konum / açı değişikliği",
      "Yapısal kablolama / zayıf akım talebi",
      "Geçiş kontrol / kartlı geçiş sistemi sorunu",
      "Diğer kamera / zayıf akım sorunu",
    ]},
    telefon: { label: "Telefon & Santral", emoji: "☎️", items: [
      "Telefon hattı / santral çalışmıyor",
      "IP telefon (VoIP) bağlanmıyor",
      "Çağrı yönlendirme / dahili numara ayarı",
      "Sesli karşılama (IVR) / anons ayarı",
      "Yeni dahili / telefon kurulumu",
      "Ses kalitesi / çağrı kesintisi sorunu",
      "Diğer telefon / santral sorunu",
    ]},
    bulut: { label: "Bulut & Microsoft 365", emoji: "☁️", items: [
      "Microsoft 365 erişim / oturum açma sorunu",
      "Microsoft 365 lisans / aktivasyon",
      "OneDrive / SharePoint senkronizasyon sorunu",
      "Google Workspace erişim sorunu",
      "Azure / bulut sunucu sorunu",
      "Bulut yedekleme sorunu",
      "Yeni bulut kullanıcısı / hesap oluşturma",
      "Diğer bulut sorunu",
    ]},
    lisans: { label: "Lisans & Yenileme", emoji: "🧾", items: [
      "Fortinet lisans yenileme",
      "Antivirüs / güvenlik lisansı yenileme",
      "Microsoft 365 / Office lisansı",
      "Yazılım lisansı satın alma / yenileme",
      "Lisans / kullanıcı sayısı artırımı",
      "Diğer lisans talebi",
    ]},
    yetkilendirme: { label: "Yetkilendirme & Erişim", emoji: "🔑", items: [
      "Active Directory kullanıcı şifre sıfırlama",
      "Windows oturum şifresi sıfırlama",
      "Active Directory'de USB açma / kapatma yetkisi",
      "Synology ortak klasöre erişim yetkisi",
      "Paylaşımlı klasör / dosya erişim yetkisi",
      "Klasör yazma / okuma izni değişikliği",
      "Yeni kullanıcı hesabı oluşturma (Active Directory)",
      "Kullanıcı hesabı kapatma / pasife alma",
      "VPN erişim yetkisi tanımlama",
      "Uzak masaüstü (RDP) erişim yetkisi",
      "Yazıcı / cihaz erişim yetkisi",
      "Uygulama / program erişim yetkisi",
      "E-posta grup / dağıtım listesi yetkisi",
      "İnternet / web sitesi erişim izni (engel kaldırma)",
      "Yönetici (admin) yetkisi talebi",
      "Diğer yetkilendirme / erişim talebi",
    ]},
    kurulum: { label: "Kurulum & Proje", emoji: "🚀", items: [
      "Yeni bilgisayar / cihaz kurulumu",
      "Yeni kullanıcı / çalışma istasyonu hazırlığı",
      "Ofis taşıma / yeni lokasyon kurulumu",
      "Yeni ağ / altyapı kurulumu",
      "Donanım / yazılım temini talebi",
      "Keşif / yerinde inceleme talebi",
      "Diğer kurulum / proje talebi",
    ]},
    diger: { label: "Diğer", emoji: "🔧", items: [
      "Genel teknik destek ve bakım",
      "Yazıcı / cihaz sarf malzeme talebi",
      "Teknik danışmanlık",
      "Periyodik bakım talebi",
      "Diğer (aşağıya açıklayın)",
    ]},
  };
  const NT_CAT_MAP: Record<string, string> = {
    internet_ag: "technical", fortinet: "technical", donanim: "technical", yazilim: "technical",
    eposta: "technical", sunucu: "technical", depolama: "technical", kamera: "technical",
    telefon: "technical", bulut: "technical", guvenlik: "technical", kurulum: "technical",
    yetkilendirme: "technical", lisans: "billing", diger: "general",
  };
  const NT_PRI_SUGGEST: Record<string, string> = {
    guvenlik: "urgent", fortinet: "high", sunucu: "high", internet_ag: "high",
    depolama: "high", telefon: "high",
    donanim: "medium", yazilim: "medium", eposta: "medium", kamera: "medium", bulut: "medium", yetkilendirme: "medium",
    lisans: "low", kurulum: "low", diger: "low",
  };
  const NT_AFFECTED_LABELS: Record<string, string> = {
    "1_kisi": "1 kişi", "2-5": "2–5 kişi", "6-10": "6–10 kişi", "tum_ofis": "Tüm ofis",
  };

  async function createInternalTicket() {
    const finalSubject = ntIssueType === "custom" ? ntCustomSubject.trim() : ntIssueType;
    if (!ntCompanyId) { setNtError("Lütfen bir şirket seçin."); return; }
    if (!finalSubject) { setNtError("Lütfen sorun türünü seçin veya yazın."); return; }
    setNtSaving(true); setNtError("");

    const supportLabel = ntSupportType === "remote" ? "Uzaktan" : "Yerinde";
    const affectedLabel = NT_AFFECTED_LABELS[ntAffected] || ntAffected;
    const catLabel = NT_ISSUES[ntCategory]?.label || "Teknik";

    // Yapılandırılmış açıklama — mailde de kullanılır
    const lines: string[] = [];
    lines.push(`📋 Sorun Kategorisi: ${catLabel}`);
    lines.push(`📌 Sorun Türü: ${finalSubject}`);
    if (ntAffectedName.trim()) lines.push(`👤 Etkilenen Kullanıcı: ${ntAffectedName.trim()}`);
    lines.push(`👥 Etkilenen Kişi Sayısı: ${affectedLabel}`);
    lines.push(`🔧 Destek Türü: ${supportLabel}`);
    if (ntStartedAt) lines.push(`🕐 Sorun Başlangıcı: ${new Date(ntStartedAt).toLocaleString("tr-TR")}`);
    if (ntNotes.trim()) { lines.push(""); lines.push("📝 Ek Notlar:"); lines.push(ntNotes.trim()); }
    const description = lines.join("\n");

    const r = await fetch("/api/admin/internal-ticket", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_id: ntCompanyId,
        subject:    finalSubject,
        description,
        category:   NT_CAT_MAP[ntCategory] || "technical",
        priority:   ntPriority,
        notify_email: ntNotifyEmail.trim() || undefined,
      }),
    });
    const json = await r.json();
    if (r.ok) {
      setNewTicketModal(false);
      setNtCompanyId(""); setNtCategory("internet_ag"); setNtIssueType("");
      setNtCustomSubject(""); setNtPriority("medium"); setNtStartedAt("");
      setNtAffected("1_kisi"); setNtAffectedName(""); setNtNotifyEmail(""); setNtSupportType("remote"); setNtNotes("");
      fetchTickets(); fetchStats();
      router.push(`/admin/destek/${json.ticket_id}`);
    } else {
      setNtError(json.error || "Hata oluştu");
    }
    setNtSaving(false);
  }

  // ── Talep silme (yalnızca yönetici) ─────────────────────────────────────────
  async function deleteTicket(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Bu talebi kalıcı olarak silmek istediğinize emin misiniz?\nBu işlem geri alınamaz.")) return;
    const r = await fetch(`/api/tickets/${id}`, { method: "DELETE" });
    if (r.ok) { fetchTickets(); fetchStats(); }
    else { const j = await r.json().catch(() => ({})); alert("Silinemedi: " + (j.error || "hata")); }
  }

  // ── Staff setup ────────────────────────────────────────────────────────────
  async function runStaffSetup() {
    const key = prompt("ADMIN_PASSWORD değerini girin:");
    if (!key) return;
    const r = await fetch(`/api/admin/setup?key=${encodeURIComponent(key)}`, { method: "POST" });
    const d = await r.json();
    if (r.ok) { alert(`✅ ${d.users.length} personel oluşturuldu!\n\nİlk şifreler:\n${d.users.map((u: { name: string; initialPassword: string }) => `${u.name}: ${u.initialPassword}`).join("\n")}`); setStaffSetupDone(true); fetchStaff(); }
    else alert("Hata: " + d.error);
  }

  // ── Reports ────────────────────────────────────────────────────────────────
  const rptTickets = useMemo(() => {
    let list = allTickets;
    if (rptCustomer !== "all") list = list.filter((t) => t.customer_email === rptCustomer);
    if (rptCompanyId !== "all") list = list.filter((t) => t.company_id === rptCompanyId);
    if (rptSource !== "all") list = list.filter((t) => (t.ticket_source || "external") === rptSource);
    if (rptStaff !== "all") list = list.filter((t) => t.assigned_to === rptStaff || t.created_by_staff === rptStaff);
    if (rptDateMode === "preset") {
      const cutoff = new Date();
      if (rptPreset === "today")   { cutoff.setHours(0,0,0,0); list = list.filter((t) => new Date(t.created_at) >= cutoff); }
      if (rptPreset === "week")    { cutoff.setDate(cutoff.getDate()-7); list = list.filter((t) => new Date(t.created_at) >= cutoff); }
      if (rptPreset === "month")   { cutoff.setDate(cutoff.getDate()-30); list = list.filter((t) => new Date(t.created_at) >= cutoff); }
      if (rptPreset === "quarter") { cutoff.setDate(cutoff.getDate()-90); list = list.filter((t) => new Date(t.created_at) >= cutoff); }
      if (rptPreset === "year")    { cutoff.setDate(cutoff.getDate()-365); list = list.filter((t) => new Date(t.created_at) >= cutoff); }
    } else if (rptDateMode === "month") {
      list = list.filter((t) => { const d = new Date(t.created_at); return d.getFullYear()===rptYear && d.getMonth()===rptMonth; });
    } else if (rptDateMode === "range" && rptFrom && rptTo) {
      const from=new Date(rptFrom); from.setHours(0,0,0,0);
      const to=new Date(rptTo); to.setHours(23,59,59,999);
      list = list.filter((t) => { const d=new Date(t.created_at); return d>=from && d<=to; });
    }
    return list;
  }, [allTickets,rptCustomer,rptCompanyId,rptSource,rptStaff,rptDateMode,rptPreset,rptMonth,rptYear,rptFrom,rptTo]);

  const rptCatCounts = ["technical","billing","general","feature_request"].map((cat) => ({ cat, label: CAT_LABEL[cat], count: rptTickets.filter((t) => t.category===cat).length }));
  const rptMaxCat = Math.max(...rptCatCounts.map(c=>c.count),1);
  const rptPriCounts = ["urgent","high","medium","low"].map((p) => ({ p, label: PRI_LABEL[p], style: PRI_COLOR[p], count: rptTickets.filter((t) => t.priority===p).length }));
  const rptMaxPri = Math.max(...rptPriCounts.map(c=>c.count),1);
  const rptStatusCounts = ["open","in_progress","resolved","closed"].map((s) => ({ s, label: STATUS_LABEL[s], style: STATUS_STYLE[s], count: rptTickets.filter((t) => t.status===s).length }));
  const rptDays = useMemo(() => {
    const days = rptDateMode==="month" ? new Date(rptYear,rptMonth+1,0).getDate() : 7;
    return Array.from({length:days}).map((_,i) => {
      let d: Date;
      if (rptDateMode==="month") { d=new Date(rptYear,rptMonth,i+1); d.setHours(0,0,0,0); }
      else { d=new Date(); d.setDate(d.getDate()-(days-1-i)); d.setHours(0,0,0,0); }
      const end=new Date(d); end.setDate(end.getDate()+1);
      return { label: rptDateMode==="month" ? String(i+1) : d.toLocaleDateString("tr-TR",{day:"2-digit",month:"short"}), count: rptTickets.filter((t) => { const dt=new Date(t.created_at); return dt>=d && dt<end; }).length };
    });
  }, [rptTickets,rptDateMode,rptMonth,rptYear]);
  const rptMaxDay = Math.max(...rptDays.map(d=>d.count),1);
  const uniqueCustomers = useMemo(() => { const map=new Map<string,string>(); allTickets.forEach(t=>{if(!map.has(t.customer_email))map.set(t.customer_email,`${t.customer_name}${t.company ? ` — ${t.company}` : ""}`)}); return Array.from(map.entries()); }, [allTickets]);
  const uniqueStaff = useMemo(() => { const s=new Set<string>(); allTickets.forEach(t=>{ if(t.created_by_staff) s.add(t.created_by_staff); if(t.assigned_to) s.add(t.assigned_to); }); return Array.from(s); }, [allTickets]);
  const rptCompanyCounts = useMemo(() => {
    const map = new Map<string, { name: string; total: number; resolved: number }>();
    rptTickets.filter(t => t.company_id && t.ticket_source === "internal").forEach(t => {
      const co = companies.find(c => c.id === t.company_id);
      const name = co?.name || t.company || "—";
      const prev = map.get(t.company_id!) || { name, total: 0, resolved: 0 };
      map.set(t.company_id!, { name, total: prev.total + 1, resolved: prev.resolved + (t.status === "resolved" || t.status === "closed" ? 1 : 0) });
    });
    return Array.from(map.values()).sort((a,b) => b.total - a.total);
  }, [rptTickets, companies]);
  const rptResolved = rptTickets.filter(t=>t.status==="resolved"||t.status==="closed").length;
  const rptTotal = rptTickets.length;
  const pending = customers.filter(c=>!c.approved).length;

  const activeCompanies = companies.filter(c=>c.active);
  const contractedCompanies = activeCompanies.filter(c => (c.customer_type || "contracted") !== "external");
  const externalCompanies = activeCompanies.filter(c => c.customer_type === "external");
  const isProspect = tab === "prospects";
  const companyList = isProspect ? externalCompanies : contractedCompanies;
  const newCompanyType = isProspect ? "external" : "contracted";

  // ── Password change ────────────────────────────────────────────────────────
  async function changePassword() {
    setPwError(""); setPwSuccess("");
    if (!pwCurrent || !pwNew || !pwConfirm) { setPwError("Tüm alanları doldurun."); return; }
    if (pwNew.length < 8) { setPwError("Yeni şifre en az 8 karakter olmalıdır."); return; }
    if (pwNew !== pwConfirm) { setPwError("Yeni şifreler eşleşmiyor."); return; }
    setPwSaving(true);
    const r = await fetch("/api/admin/staff/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
    });
    const d = await r.json();
    if (r.ok) {
      setPwSuccess("Şifreniz başarıyla güncellendi.");
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
    } else {
      setPwError(d.error || "Hata oluştu.");
    }
    setPwSaving(false);
  }

  // ── SLA Check ─────────────────────────────────────────────────────────────
  async function checkSLA() {
    setSlaChecking(true); setSlaToast("");
    const r = await fetch("/api/admin/sla-check");
    const d = await r.json();
    setSlaToast(d.message || (r.ok ? "Kontrol tamamlandı." : "Hata oluştu."));
    setSlaChecking(false);
    setTimeout(() => setSlaToast(""), 5000);
  }

  // ── Monthly Summary ───────────────────────────────────────────────────────
  async function sendMonthlyToCompany(companyId?: string) {
    setMSummaryToast("Gönderiliyor...");
    const r = await fetch("/api/admin/monthly-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(companyId ? { companyId } : {}),
    });
    const d = await r.json();
    setMSummaryToast(d.message || (r.ok ? "Gönderildi." : "Hata oluştu."));
    setTimeout(() => setMSummaryToast(""), 5000);
  }

  // ── CSV Export ────────────────────────────────────────────────────────────
  function downloadCSV() {
    const headers = ["Talep No","Konu","Durum","Öncelik","Kategori","Müşteri","Şirket","Personel","Oluşturulma","Çözüm Tarihi"];
    const rows = rptTickets.map(t => [
      `#${String(t.ticket_number).padStart(4,"0")}`,
      t.subject,
      STATUS_LABEL[t.status] || t.status,
      PRI_LABEL[t.priority] || t.priority,
      CAT_LABEL[t.category] || t.category,
      t.customer_name,
      t.company || "",
      t.created_by_staff || "",
      new Date(t.created_at).toLocaleDateString("tr-TR"),
      t.resolved_at ? new Date(t.resolved_at).toLocaleDateString("tr-TR") : "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const bom = "﻿"; // UTF-8 BOM for Excel Turkish chars
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lider-network-rapor-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printPDF() {
    const dateStr = new Date().toLocaleDateString("tr-TR", { day:"2-digit", month:"long", year:"numeric" });
    const rows = rptTickets.map((t, i) => `
      <tr style="background:${i % 2 === 0 ? "#f8fafc" : "#fff"}">
        <td style="padding:7px 10px;border:1px solid #e2e8f0;font-weight:700;color:#0052ff;white-space:nowrap">#${String(t.ticket_number).padStart(4,"0")}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;max-width:200px;word-break:break-word">${t.subject.replace(/</g,"&lt;")}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;white-space:nowrap">${STATUS_LABEL[t.status] || t.status}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;white-space:nowrap">${PRI_LABEL[t.priority] || t.priority}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0">${CAT_LABEL[t.category] || t.category}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0">${(t.customer_name || "").replace(/</g,"&lt;")}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0">${(t.company || "—").replace(/</g,"&lt;")}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;white-space:nowrap">${t.created_by_staff?.split("@")[0] || "—"}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;white-space:nowrap">${new Date(t.created_at).toLocaleDateString("tr-TR")}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;white-space:nowrap">${t.resolved_at ? new Date(t.resolved_at).toLocaleDateString("tr-TR") : "—"}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Lider Network — Destek Raporu</title>
  <style>
    body { margin: 0; padding: 24px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1e293b; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #0052ff; }
    .logo-area h1 { margin: 0; font-size: 22px; color: #0052ff; letter-spacing: -0.5px; }
    .logo-area p { margin: 4px 0 0; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    .meta { text-align: right; font-size: 11px; color: #64748b; line-height: 1.7; }
    .stats { display: flex; gap: 12px; margin-bottom: 20px; }
    .stat { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
    .stat .val { font-size: 22px; font-weight: 900; color: #0052ff; }
    .stat .lbl { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: .5px; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #0052ff; }
    thead th { padding: 9px 10px; text-align: left; color: #fff; font-size: 11px; font-weight: 700; border: 1px solid #0041cc; letter-spacing: .3px; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      <h1>LİDER NETWORK</h1>
      <p>Destek Yönetim Sistemi — Rapor</p>
    </div>
    <div class="meta">
      Oluşturulma: ${dateStr}<br>
      Toplam: <strong>${rptTickets.length} talep</strong>
    </div>
  </div>
  <div class="stats">
    <div class="stat"><div class="val">${rptTickets.length}</div><div class="lbl">Toplam Talep</div></div>
    <div class="stat" style="border-color:#bbf7d0"><div class="val" style="color:#15803d">${rptTickets.filter(t=>t.status==="resolved"||t.status==="closed").length}</div><div class="lbl">Çözülen</div></div>
    <div class="stat" style="border-color:#fde68a"><div class="val" style="color:#d97706">${rptTickets.filter(t=>t.status==="open").length}</div><div class="lbl">Açık</div></div>
    <div class="stat" style="border-color:#ddd6fe"><div class="val" style="color:#7c3aed">${rptTickets.filter(t=>t.status==="in_progress").length}</div><div class="lbl">İşlemde</div></div>
    <div class="stat" style="border-color:#bfdbfe"><div class="val">${rptTickets.length ? Math.round((rptTickets.filter(t=>t.status==="resolved"||t.status==="closed").length/rptTickets.length)*100) : 0}%</div><div class="lbl">Çözüm Oranı</div></div>
  </div>
  <table>
    <thead>
      <tr>
        ${["No","Konu","Durum","Öncelik","Kategori","Müşteri","Şirket","Personel","Tarih","Çözüm"].map(h=>`<th>${h}</th>`).join("")}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>Lider Network Bilişim Hizmetleri — destek@lidernetwork.com.tr — +90 312 232 02 88</span>
    <span>www.lidernetwork.com.tr</span>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) { alert("Pop-up engelleyicisini kapatın ve tekrar deneyin."); return; }
    win.document.write(html);
    win.document.close();
  }

  // ── Staff Performance ─────────────────────────────────────────────────────
  const rptStaffPerf = useMemo(() => {
    const map = new Map<string, { name: string; total: number; resolved: number; totalMinutes: number }>();
    rptTickets.filter(t => t.created_by_staff).forEach(t => {
      const key = t.created_by_staff!;
      const name = key.split("@")[0].replace(".", " ").replace(/\b\w/g, c => c.toUpperCase());
      const prev = map.get(key) || { name, total: 0, resolved: 0, totalMinutes: 0 };
      const isResolved = t.status === "resolved" || t.status === "closed";
      const minutes = isResolved && t.resolved_at
        ? Math.round((new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / 60000)
        : 0;
      map.set(key, { name, total: prev.total + 1, resolved: prev.resolved + (isResolved ? 1 : 0), totalMinutes: prev.totalMinutes + minutes });
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [rptTickets]);

  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      minHeight: "100vh",
      background: "#f4f6fb",
      fontFamily: "var(--font-family-body)",
      position: "relative",
      width: "100%",
      overflowX: "hidden"
    }}>

      {/* ══════════════════════════════════════════════════════ SIDEBAR */}
      <aside style={{
        width: "240px",
        flexShrink: 0,
        background: "#fff",
        borderRight: "1px solid #e5e7ef",
        display: isMobile ? (sidebarOpen ? "flex" : "none") : "flex",
        flexDirection: "column",
        position: isMobile ? "fixed" : "sticky",
        top: 0,
        left: 0,
        height: "100vh",
        overflowY: "auto",
        zIndex: isMobile ? 999 : "auto",
        boxShadow: isMobile && sidebarOpen ? "0 8px 24px rgba(0,0,0,.12)" : "none",
        paddingTop: isMobile ? "env(safe-area-inset-top)" : 0,
        transition: "all .2s"
      }}>
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #f0f2f8" }}>
          <Image src="/logo.png" alt="Lider Network" width={120} height={36} style={{ objectFit: "contain" }} />
          <div style={{ marginTop: "5px", fontSize: "10px", fontWeight: 700, color: "#0052ff", letterSpacing: "1.5px", textTransform: "uppercase" }}>Admin Paneli</div>
        </div>

        <nav style={{ flex: 1, padding: "10px 8px" }}>
          <SideSection label="Destek" />
          <NavItem icon={<TicketCheck size={15} />} label="Talepler" active={tab==="tickets"} badge={total} badgeColor="#0052ff" onClick={() => setTab("tickets")} />
          <NavItem icon={<Users size={15} />} label="Web Üyeleri" active={tab==="customers"} badge={pending} badgeColor="#ef4444" onClick={() => setTab("customers")} />
          <NavItem icon={<Shield size={15} />} label="FortiGate Destek" tag="AI" active={tab==="fortigate"} onClick={() => setTab("fortigate")} />

          <SideSection label="Müşteriler & Firmalar" />
          <NavItem icon={<Building2 size={15} />} label="Sözleşmeli Şirketler" active={tab==="companies"} badge={contractedCompanies.length || undefined} badgeColor="#6b7280" onClick={() => setTab("companies")} />
          <NavItem icon={<Users size={15} />} label="Dış Müşteriler" active={tab==="prospects"} badge={externalCompanies.length || undefined} badgeColor="#7c3aed" onClick={() => setTab("prospects")} />
          <NavItem icon={<FileText size={15} />} label="Teklifler" active={tab==="quotes"} onClick={() => setTab("quotes")} />

          <SideSection label="Operasyon" />
          <NavItem icon={<ListTodo size={15} />} label="İş Planı" active={tab==="isplan"} onClick={() => setTab("isplan")} />
          <NavItem icon={<StickyNote size={15} />} label="Personel Notları" active={tab==="notes"} onClick={() => setTab("notes")} />

          <SideSection label="Yönetim" />
          {sessionRole === "super_admin" && (
            <NavItem icon={<UserCog size={15} />} label="Personel" active={tab==="staff"} onClick={() => setTab("staff")} />
          )}
          <NavItem icon={<BarChart2 size={15} />} label="Raporlar" active={tab==="reports"} onClick={() => setTab("reports")} />

          {stats && (
            <>
              <SideSection label="Durum" />
              <div style={{ margin: "4px 6px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e5e7ef", padding: "12px 14px" }}>
                {[
                  { label: "Açık",    value: stats.open,            color: "#3b82f6" },
                  { label: "İşlemde", value: stats.in_progress,     color: "#8b5cf6" },
                  { label: "Bugün ✓", value: stats.resolved_today,  color: "#22c55e" },
                  { label: "ACİL",    value: stats.urgent,          color: "#dc2626" },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #f0f2f8" }}>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>{s.label}</span>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: s.color, fontFamily: "var(--font-family-headline)" }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </nav>

        <div style={{ padding: "8px 14px", borderTop: "1px solid #f0f2f8" }}>
          <button onClick={() => { setPwModal(true); setPwError(""); setPwSuccess(""); }} style={{ width: "100%", padding: "7px 12px", background: "#f4f6fb", border: "1px solid #e5e7ef", borderRadius: "8px", color: "#6b7280", fontSize: "12px", fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
            🔒 Şifremi Değiştir
          </button>
        </div>
        <div style={{ padding: "10px 14px", borderTop: "1px solid #f0f2f8", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#0052ff,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {sessionName.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sessionName}</p>
            <p style={{ margin: 0, fontSize: "10px", color: sessionRole==="super_admin" ? "#0052ff" : "#9ca3af", fontWeight: 600 }}>{sessionRole==="super_admin" ? "Yönetici" : "Personel"}</p>
          </div>
          <button onClick={logout} title="Çıkış" style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px", borderRadius: "6px", display: "flex" }}>
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.3)",
          zIndex: 998
        }} />
      )}

      {/* ══════════════════════════════════════════════════════ MAIN */}
      <main style={{
        flex: 1,
        width: isMobile ? "100%" : "auto",
        padding: isMobile ? "calc(14px + env(safe-area-inset-top)) 14px calc(20px + env(safe-area-inset-bottom))" : isTablet ? "20px 24px" : "28px 32px",
        minWidth: 0,
        overflowX: "hidden",
        position: "relative"
      }}>

        {/* Page header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isMobile ? "16px" : "24px",
          gap: "12px",
          flexWrap: isMobile ? "wrap" : "nowrap"
        }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: "4px" }}>
              <Menu size={20} />
            </button>
          )}
          <div>
            <h1 style={{
              fontFamily: "var(--font-family-headline)",
              fontSize: isMobile ? "18px" : "22px",
              fontWeight: 800,
              color: "#1a1d2e",
              margin: "0 0 3px"
            }}>
              {tab==="tickets" ? "Destek Talepleri" : tab==="customers" ? "Web Üyeleri" : tab==="companies" ? "Sözleşmeli Şirketler" : tab==="prospects" ? "Dış Müşteriler" : tab==="staff" ? "Personel" : tab==="isplan" ? "İş Planı" : tab==="notes" ? "Personel Notları" : tab==="quotes" ? "Teklifler" : tab==="fortigate" ? "FortiGate Destek Asistanı" : "Raporlar"}
            </h1>
            <p style={{ color: "#6b7280", fontSize: isMobile ? "12px" : "14px", margin: 0 }}>
              {tab==="tickets" ? `${total} talep` : tab==="customers" ? `${customers.length} web üyesi (siteden kayıt)` : tab==="companies" ? `${contractedCompanies.length} sözleşmeli şirket` : tab==="prospects" ? `${externalCompanies.length} dış müşteri (teklif isteyen)` : tab==="staff" ? `${staff.length} personel` : "Filtreli rapor ve istatistikler"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {tab==="tickets" && (
              <>
                <button onClick={() => { fetchCompanies(); setNewTicketModal(true); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 18px", background: "#0052ff", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,82,255,.25)" }}>
                  <Plus size={15} /> Yeni Talep
                </button>
                <button onClick={checkSLA} disabled={slaChecking}
                  title="SLA süresi dolmak üzere olan talepleri kontrol et"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "10px", color: "#6b7280", fontSize: "12px", fontWeight: 600, cursor: slaChecking ? "not-allowed" : "pointer" }}>
                  <Zap size={13} color={slaChecking ? "#9ca3af" : "#d97706"} />
                  {slaChecking ? "Kontrol..." : "SLA Kontrol"}
                </button>
              </>
            )}
            {tab==="companies" && (
              <button onClick={() => sendMonthlyToCompany()}
                style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", color: "#15803d", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                📧 Tüm Şirketlere Aylık Rapor
              </button>
            )}
            {(tab==="companies" || tab==="prospects") && (
              <button onClick={() => setCompModal({ customer_type: newCompanyType } as Partial<Company>)}
                style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 18px", background: isProspect ? "#7c3aed" : "#0052ff", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                <Plus size={15} /> {isProspect ? "Dış Müşteri Ekle" : "Şirket Ekle"}
              </button>
            )}
            <button onClick={() => { fetchTickets(); fetchStats(); fetchAllTickets(); if(tab==="customers") fetchCustomers(); if(tab==="companies") fetchCompanies(); if(tab==="staff") fetchStaff(); }}
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 18px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "10px", color: "#6b7280", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              <RefreshCw size={14} /> Yenile
            </button>
          </div>
          {/* SLA Toast */}
          {slaToast && (
            <div style={{ position: "fixed", bottom: "24px", right: "24px", background: "#1a1d2e", color: "#fff", padding: "12px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,.2)" }}>
              {slaToast}
            </div>
          )}
          {/* Monthly Summary Toast */}
          {mSummaryToast && (
            <div style={{ position: "fixed", bottom: "24px", right: "24px", background: "#15803d", color: "#fff", padding: "12px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,.2)" }}>
              {mSummaryToast}
            </div>
          )}
        </div>

        {/* ══════════════════════════ TICKETS TAB */}
        {tab === "tickets" && (
          <>
            {stats && (
              <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                <StatCard label="Açık Talepler"  value={stats.open}           color="#3b82f6" bg="#eff6ff" border="#bfdbfe" icon={<Clock size={18} color="#3b82f6" />} />
                <StatCard label="İşlemde"         value={stats.in_progress}    color="#8b5cf6" bg="#f5f3ff" border="#ddd6fe" icon={<Activity size={18} color="#8b5cf6" />} />
                <StatCard label="Bugün Çözüldü"   value={stats.resolved_today} color="#22c55e" bg="#f0fdf4" border="#bbf7d0" icon={<CheckCircle size={18} color="#22c55e" />} />
                <StatCard label="ACİL"            value={stats.urgent}         color="#dc2626" bg="#fef2f2" border="#fecaca" icon={<AlertCircle size={18} color="#dc2626" />} />
                <StatCard label="Toplam"          value={stats.total}          color="#1a1d2e" bg="#f4f6fb" border="#e5e7ef" icon={<TicketCheck size={18} color="#6b7280" />} />
                <StatCard label="Ort. İlk Yanıt"  value={stats.avg_response_min!=null ? (stats.avg_response_min<60 ? `${stats.avg_response_min}dk` : `${(stats.avg_response_min/60).toFixed(1)}sa`) : "—"} sub="son 50 talep" color="#0052ff" bg="#eff6ff" border="#bfdbfe" icon={<TrendingUp size={18} color="#0052ff" />} />
              </div>
            )}

            {stats && stats.urgent > 0 && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "12px 18px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: "13px", color: "#991b1b", fontWeight: 600 }}>{stats.urgent} ACİL öncelikli talep bekliyor.</p>
                <button onClick={() => setPriorityF("urgent")} style={{ marginLeft: "auto", background: "none", border: "1px solid #fca5a5", borderRadius: "6px", padding: "4px 12px", fontSize: "12px", fontWeight: 600, color: "#dc2626", cursor: "pointer" }}>Filtrele</button>
              </div>
            )}

            <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", padding: "16px 20px", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <Filter size={13} color="#9ca3af" />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".5px" }}>Filtreler</span>
              </div>
              {[
                { label:"Durum",    opts:[["all","Tümü"],["open","Açık"],["in_progress","İşlemde"],["resolved","Çözüldü"],["closed","Kapalı"]], val:statusF, set:setStatusF },
                { label:"Öncelik", opts:[["all","Tümü"],["urgent","ACİL"],["high","Yüksek"],["medium","Orta"],["low","Düşük"]], val:priorityF, set:setPriorityF },
                { label:"Kategori",opts:[["all","Tümü"],["technical","Teknik"],["billing","Fatura"],["general","Genel"],["feature_request","Özellik"]], val:categoryF, set:setCategoryF },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", minWidth: "62px" }}>{row.label}</span>
                  {row.opts.map(([v,l]) => <Fbtn key={v} val={v} cur={row.val} set={row.set} label={l} />)}
                </div>
              ))}
              <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", minWidth: "62px" }}>Tarih</span>
                {[["all","Tümü"],["today","Bugün"],["week","Son 7 Gün"],["month","Son 30 Gün"]].map(([v,l]) => <Fbtn key={v} val={v} cur={dateF} set={setDateF} label={l} />)}
                <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} style={{ flex: 1, display: "flex", gap: "6px", marginLeft: "8px" }}>
                  <input value={searchInput} onChange={(e) => { setSearchInput(e.target.value); if (!e.target.value) setSearch(""); }} placeholder="Müşteri, konu, e-posta..." style={{ ...inpS, padding: "7px 12px" }} />
                  <button type="submit" style={{ padding: "7px 16px", background: "#0052ff", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>Ara</button>
                </form>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e5e7ef", overflow: "hidden" }}>
              {loading ? (
                <div style={{ padding: "56px", textAlign: "center", color: "#9ca3af" }}>Yükleniyor...</div>
              ) : tickets.length === 0 ? (
                <div style={{ padding: "56px", textAlign: "center", color: "#9ca3af" }}>Talep bulunamadı</div>
              ) : isMobile ? (
                <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {tickets.map((t) => {
                    const sla=slaDue(t); const sc=STATUS_STYLE[t.status]||STATUS_STYLE.open; const pc=PRI_COLOR[t.priority]||PRI_COLOR.medium;
                    return (
                      <div key={t.id} onClick={() => router.push(`/admin/destek/${t.id}`)} style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "12px", padding: "13px 14px", cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "7px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 800, color: "#0052ff", background: "#eff6ff", borderRadius: "6px", padding: "3px 8px" }}>#{String(t.ticket_number).padStart(4,"0")}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "8px", background: sc.bg, fontSize: "12px", fontWeight: 600, color: sc.text }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot }} />{STATUS_LABEL[t.status]}</span>
                        </div>
                        <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 700, color: "#1a1d2e" }}>{t.customer_name}{t.company ? <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: "12px" }}> · {t.company}</span> : null}</p>
                        <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#475569", lineHeight: 1.4 }}>{t.subject}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: pc.text, background: pc.bg, padding: "3px 9px", borderRadius: "6px" }}>{PRI_LABEL[t.priority]}</span>
                          <span style={{ fontSize: "11px", color: "#6b7280", background: "#f1f5f9", padding: "3px 8px", borderRadius: "6px" }}>{CAT_LABEL[t.category]}</span>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: sla.color, background: sla.bg, padding: "3px 8px", borderRadius: "6px" }}>{sla.label}</span>
                          <span style={{ fontSize: "11px", color: "#9ca3af", marginLeft: "auto" }}>{timeAgo(t.created_at)}</span>
                          {sessionRole === "super_admin" && <button onClick={(e) => deleteTicket(t.id, e)} style={{ display: "inline-flex", width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: "7px", border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}><Trash2 size={13} /></button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8f9fb", borderBottom: "1px solid #e5e7ef" }}>
                        {["","#No","Müşteri / Şirket","Konu","Kat.","Öncelik","Durum","SLA","Tarih",""].map((h,i) => (
                          <th key={i} style={{ padding: "11px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".5px", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((t) => {
                        const sla=slaDue(t); const sc=STATUS_STYLE[t.status]||STATUS_STYLE.open; const pc=PRI_COLOR[t.priority]||PRI_COLOR.medium;
                        return (
                          <tr key={t.id} onClick={() => router.push(`/admin/destek/${t.id}`)} style={{ borderBottom: "1px solid #f0f2f8", cursor: "pointer" }}
                            onMouseEnter={e => (e.currentTarget.style.background="#f8f9fb")}
                            onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
                            <td style={{ padding: "14px 8px 14px 14px" }}>
                              {t.ticket_source === "internal" ? (
                                <span title="İç Talep" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                                  <Building2 size={11} color="#0052ff" />
                                </span>
                              ) : (
                                <span title="Dış Talep" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                                  <Users size={11} color="#16a34a" />
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "14px 14px 14px 8px", whiteSpace: "nowrap" }}>
                              <span style={{ fontSize: "12px", fontWeight: 800, color: "#0052ff", background: "#eff6ff", borderRadius: "6px", padding: "3px 8px" }}>#{String(t.ticket_number).padStart(4,"0")}</span>
                            </td>
                            <td style={{ padding: "14px", minWidth: "160px" }}>
                              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1a1d2e" }}>{t.customer_name}</p>
                              {t.company && <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{t.company}</p>}
                            </td>
                            <td style={{ padding: "14px", maxWidth: "240px" }}>
                              <p style={{ margin: 0, fontSize: "13px", color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</p>
                              {t.created_by_staff && <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>👤 {t.created_by_staff.split("@")[0]}</p>}
                            </td>
                            <td style={{ padding: "14px", fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" }}>{CAT_LABEL[t.category]}</td>
                            <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: pc.text, background: pc.bg, padding: "3px 10px", borderRadius: "6px" }}>{PRI_LABEL[t.priority]}</span>
                            </td>
                            <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "8px", background: sc.bg, fontSize: "12px", fontWeight: 600, color: sc.text }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, flexShrink: 0 }} />
                                {STATUS_LABEL[t.status]}
                              </span>
                            </td>
                            <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                              <span style={{ fontSize: "12px", fontWeight: 600, color: sla.color, background: sla.bg, padding: "3px 8px", borderRadius: "6px" }}>{sla.label}</span>
                            </td>
                            <td style={{ padding: "14px", fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>{timeAgo(t.created_at)}</td>
                            <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
                                {sessionRole === "super_admin" && (
                                  <button onClick={(e) => deleteTicket(t.id, e)} title="Talebi sil" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "7px", border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}>
                                    <Trash2 size={13} />
                                  </button>
                                )}
                                <ArrowUpRight size={14} color="#d1d5db" />
                              </div>
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

        {/* ══════════════════════════ CUSTOMERS TAB */}
        {tab === "customers" && (
          <>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {[["all","Tümü"],["pending","Onay Bekleyen"],["approved","Onaylı"]].map(([v,l]) => <Fbtn key={v} val={v} cur={custFilter} set={setCustFilter} label={l} />)}
            </div>
            <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e5e7ef", overflow: "hidden" }}>
              {custLoading ? <div style={{ padding: "56px", textAlign: "center", color: "#9ca3af" }}>Yükleniyor...</div>
              : customers.length === 0 ? <div style={{ padding: "56px", textAlign: "center", color: "#9ca3af" }}>Kayıtlı müşteri bulunamadı</div>
              : (
                <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fb", borderBottom: "1px solid #e5e7ef" }}>
                      {["Ad Soyad","Şirket","E-posta","Telefon","Durum","Kayıt Tarihi","İşlem"].map(h => (
                        <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #f0f2f8" }}
                        onMouseEnter={e => (e.currentTarget.style.background="#f8f9fb")}
                        onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#0052ff,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                              {c.full_name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                            </div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1d2e" }}>{c.full_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "13px", color: "#6b7280" }}>{c.company||"—"}</td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#6b7280" }}>{c.email}</td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#6b7280" }}>{c.phone||"—"}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: c.approved ? "#f0fdf4" : "#fffbeb", color: c.approved ? "#15803d" : "#d97706", border: `1px solid ${c.approved ? "#bbf7d0" : "#fde68a"}` }}>
                            {c.approved ? "✓ Onaylı" : "⏱ Bekliyor"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#9ca3af" }}>{new Date(c.created_at).toLocaleDateString("tr-TR")}</td>
                        <td style={{ padding: "14px 16px" }}>
                          {!c.approved ? (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => handleCustomerAction(c.id,"approve")} style={{ padding: "5px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "7px", color: "#15803d", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Onayla</button>
                              <button onClick={() => { if(confirm(`${c.full_name} reddet?`)) handleCustomerAction(c.id,"reject"); }} style={{ padding: "5px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "7px", color: "#dc2626", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Reddet</button>
                            </div>
                          ) : (
                            <button onClick={() => { if(confirm(`${c.full_name} hesabını sil?`)) handleCustomerAction(c.id,"reject"); }} style={{ padding: "5px 12px", background: "#fff", border: "1px solid #e5e7ef", borderRadius: "7px", color: "#6b7280", fontSize: "12px", cursor: "pointer" }}>Kaldır</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════ COMPANIES TAB */}
        {(tab === "companies" || tab === "prospects") && (
          <>
            {compLoading ? <div style={{ padding: "56px", textAlign: "center", color: "#9ca3af" }}>Yükleniyor...</div>
            : companyList.length === 0 ? (
              <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", padding: "56px", textAlign: "center" }}>
                <Building2 size={40} color="#e5e7ef" style={{ marginBottom: "12px" }} />
                <p style={{ color: "#9ca3af", fontSize: "15px", margin: "0 0 16px" }}>{isProspect ? "Henüz dış müşteri yok. Teklif isteyenleri buraya ekleyin." : "Henüz sözleşmeli şirket yok."}</p>
                <button onClick={() => setCompModal({ customer_type: newCompanyType } as Partial<Company>)} style={{ padding: "10px 20px", background: isProspect ? "#7c3aed" : "#0052ff", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                  {isProspect ? "İlk Dış Müşteriyi Ekle" : "İlk Şirketi Ekle"}
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "14px" }}>
                {companyList.map(c => (
                  <div key={c.id} style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
                      <div>
                        <p style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#1a1d2e" }}>{c.name}</p>
                        <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                          {c.sector && <span style={{ fontSize: "11px", color: "#0052ff", fontWeight: 600, background: "#eff6ff", padding: "2px 8px", borderRadius: "4px" }}>{c.sector}</span>}
                          <button onClick={() => { setQuotesFilterCompany(c.id); setTab("quotes"); }} title="Bu müşterinin tekliflerini gör"
                            style={{ fontSize: "11px", fontWeight: 700, color: quoteCounts[c.id] ? "#15803d" : "#9ca3af", background: quoteCounts[c.id] ? "#f0fdf4" : "#f4f6fb", border: `1px solid ${quoteCounts[c.id] ? "#bbf7d0" : "#e5e7ef"}`, padding: "2px 8px", borderRadius: "4px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            📄 {quoteCounts[c.id] || 0} teklif
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => setCompModal(c)} style={{ padding: "5px 10px", background: "#f4f6fb", border: "1px solid #e5e7ef", borderRadius: "6px", fontSize: "12px", color: "#6b7280", cursor: "pointer" }}>Düzenle</button>
                        <button onClick={() => deactivateCompany(c.id, c.name)} style={{ padding: "5px 10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "12px", color: "#dc2626", cursor: "pointer" }}>Kaldır</button>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                          {c.contact_name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1a1d2e" }}>{c.contact_name}</p>
                          <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>Yetkili / Müdür</p>
                        </div>
                      </div>
                      <div style={{ borderTop: "1px solid #f0f2f8", paddingTop: "8px" }}>
                        <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#6b7280" }}>✉ <a href={`mailto:${c.contact_email}`} style={{ color: "#0052ff", textDecoration: "none" }}>{c.contact_email}</a></p>
                        {c.phone && <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>📞 <a href={`tel:${c.phone}`} style={{ color: "#6b7280", textDecoration: "none" }}>{c.phone}</a></p>}
                        {c.notes && <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}>{c.notes}</p>}
                      </div>
                    </div>
                    <div style={{ marginTop: "12px", borderTop: "1px solid #f0f2f8", paddingTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button onClick={() => { setNtCompanyId(c.id); setNewTicketModal(true); }} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "6px 14px", color: "#0052ff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                        <Plus size={13} /> Talep Aç
                      </button>
                      <button onClick={() => sendMonthlyToCompany(c.id)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "6px 14px", color: "#15803d", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                        📧 Aylık Rapor Gönder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════ STAFF TAB */}
        {tab === "staff" && sessionRole === "super_admin" && (
          <>
            {staffLoading ? <div style={{ padding: "56px", textAlign: "center", color: "#9ca3af" }}>Yükleniyor...</div>
            : staff.length === 0 ? (
              <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", padding: "40px", textAlign: "center" }}>
                <UserCog size={40} color="#e5e7ef" style={{ marginBottom: "12px" }} />
                <p style={{ color: "#9ca3af", fontSize: "15px", margin: "0 0 8px" }}>Personel hesabı bulunamadı.</p>
                <p style={{ color: "#9ca3af", fontSize: "13px", margin: "0 0 20px" }}>İlk kurulum için aşağıdaki butona tıklayın.</p>
                {!staffSetupDone && (
                  <button onClick={runStaffSetup} style={{ padding: "10px 24px", background: "#0052ff", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                    Personel Hesaplarını Oluştur
                  </button>
                )}
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "14px", marginBottom: "20px" }}>
                  {staff.map(s => (
                    <div key={s.id} style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", padding: "20px 22px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: s.role==="super_admin" ? "linear-gradient(135deg,#0052ff,#6366f1)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                          {s.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#1a1d2e" }}>{s.name}</p>
                          <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{s.email}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: s.role==="super_admin" ? "#eff6ff" : "#f5f3ff", color: s.role==="super_admin" ? "#1d4ed8" : "#7c3aed", border: `1px solid ${s.role==="super_admin" ? "#bfdbfe" : "#ddd6fe"}` }}>
                          {s.role==="super_admin" ? "🛡 Yönetici" : "👤 Personel"}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: s.active ? "#15803d" : "#dc2626" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.active ? "#22c55e" : "#ef4444" }} />
                          {s.active ? "Aktif" : "Pasif"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "16px 20px" }}>
                  <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "13px", color: "#92400e" }}>📌 Şifre Değişikliği</p>
                  <p style={{ margin: 0, fontSize: "13px", color: "#b45309", lineHeight: 1.6 }}>
                    Personel şifrelerini değiştirmek için Supabase veya API üzerinden işlem yapın.
                    İlk oturum şifreleri: Yöneticiler → <code>LiderNetwork2024!</code>, Personel → <code>Lider2024!</code>
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* ══════════════════════════ REPORTS TAB */}
        {tab === "reports" && (
          <>
            <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", padding: "22px 24px", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
                <BarChart2 size={16} color="#0052ff" />
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1a1d2e" }}>Rapor Filtreleri</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", alignItems: "start", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "8px" }}>🏢 Şirket (İç Talep)</label>
                  <select value={rptCompanyId} onChange={e=>setRptCompanyId(e.target.value)} style={inpS}>
                    <option value="all">Tüm Şirketler</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "8px" }}>📋 Talep Kaynağı</label>
                  <select value={rptSource} onChange={e=>setRptSource(e.target.value)} style={inpS}>
                    <option value="all">Tümü</option>
                    <option value="internal">🏢 İç Talep (Sözleşmeli)</option>
                    <option value="external">👥 Dış Talep (Self-servis)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "8px" }}>👤 Personel</label>
                  <select value={rptStaff} onChange={e=>setRptStaff(e.target.value)} style={inpS}>
                    <option value="all">Tüm Personel</option>
                    {uniqueStaff.map(s => <option key={s} value={s}>{s.split("@")[0].replace("."," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "8px" }}>👤 Müşteri (Dış)</label>
                  <select value={rptCustomer} onChange={e=>setRptCustomer(e.target.value)} style={inpS}>
                    <option value="all">Tüm Müşteriler</option>
                    {uniqueCustomers.map(([email,label]) => <option key={email} value={email}>{label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", alignItems: "start" }}>
                <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "8px" }}>Tarih</label>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "10px" }}>
                    {[["preset","Hızlı"],["month","Ay"],["range","Aralık"]].map(([m,l]) => (
                      <button key={m} onClick={() => setRptDateMode(m as typeof rptDateMode)} style={{ flex:1,padding:"6px 0",borderRadius:"8px",border:`1.5px solid ${rptDateMode===m?"#0052ff":"#e5e7ef"}`,fontSize:"12px",fontWeight:600,cursor:"pointer",background:rptDateMode===m?"#eff6ff":"#fff",color:rptDateMode===m?"#0052ff":"#6b7280" }}>{l}</button>
                    ))}
                  </div>
                  {rptDateMode==="preset" && (
                    <div style={{ display:"flex",gap:"4px",flexWrap:"wrap" }}>
                      {[["today","Bugün"],["week","7G"],["month","30G"],["quarter","90G"],["year","1Y"]].map(([v,l]) => (
                        <button key={v} onClick={() => setRptPreset(v)} style={{ padding:"5px 11px",borderRadius:"8px",border:`1.5px solid ${rptPreset===v?"#0052ff":"#e5e7ef"}`,fontSize:"12px",cursor:"pointer",background:rptPreset===v?"#eff6ff":"#fff",color:rptPreset===v?"#0052ff":"#6b7280" }}>{l}</button>
                      ))}
                    </div>
                  )}
                  {rptDateMode==="month" && (
                    <div style={{ display:"flex",gap:"8px" }}>
                      <select value={rptMonth} onChange={e=>setRptMonth(Number(e.target.value))} style={{ ...inpS,flex:2 }}>{MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
                      <select value={rptYear} onChange={e=>setRptYear(Number(e.target.value))} style={{ ...inpS,flex:1 }}>{[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}</select>
                    </div>
                  )}
                  {rptDateMode==="range" && (
                    <div style={{ display:"flex",gap:"8px",alignItems:"center" }}>
                      <input type="date" value={rptFrom} onChange={e=>setRptFrom(e.target.value)} style={{ ...inpS,flex:1 }} />
                      <span style={{ color:"#9ca3af" }}>—</span>
                      <input type="date" value={rptTo} onChange={e=>setRptTo(e.target.value)} style={{ ...inpS,flex:1 }} />
                    </div>
                  )}
                </div>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "8px" }}>Dönem Özeti</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {[
                      { label:"Toplam", value:rptTotal, color:"#1a1d2e", bg:"#f8f9fb", border:"#e5e7ef" },
                      { label:"Çözülen", value:rptResolved, color:"#15803d", bg:"#f0fdf4", border:"#bbf7d0" },
                      { label:"Çözüm %", value:rptTotal ? `%${Math.round((rptResolved/rptTotal)*100)}` : "—", color:"#0052ff", bg:"#eff6ff", border:"#bfdbfe" },
                      { label:"Açık", value:rptTickets.filter(t=>t.status==="open").length, color:"#d97706", bg:"#fffbeb", border:"#fde68a" },
                    ].map(s => (
                      <div key={s.label} style={{ background:s.bg,border:`1px solid ${s.border}`,borderRadius:"10px",padding:"10px 14px" }}>
                        <div style={{ fontSize:"10px",color:"#9ca3af",fontWeight:700,textTransform:"uppercase",letterSpacing:".5px" }}>{s.label}</div>
                        <div style={{ fontSize:"24px",fontWeight:900,color:s.color,fontFamily:"var(--font-family-headline)",marginTop:"4px",lineHeight:1 }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* Şirket bazında kırılım */}
            {rptCompanyCounts.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", padding: "20px 24px", marginBottom: "14px" }}>
                <h4 style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 700, color: "#1a1d2e", display: "flex", alignItems: "center", gap: "6px" }}>
                  🏢 Şirket Bazında İç Talep Kırılımı
                </h4>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e5e7ef" }}>
                        {["Şirket", "Toplam", "Çözülen", "Açık", "Çözüm %"].map(h => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rptCompanyCounts.map((c, i) => {
                        const open = c.total - c.resolved;
                        const pct = c.total ? Math.round((c.resolved / c.total) * 100) : 0;
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid #f0f2f8" }}>
                            <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1a1d2e" }}>{c.name}</td>
                            <td style={{ padding: "10px 12px", fontWeight: 800, color: "#0052ff" }}>{c.total}</td>
                            <td style={{ padding: "10px 12px", color: "#15803d", fontWeight: 700 }}>{c.resolved}</td>
                            <td style={{ padding: "10px 12px", color: open > 0 ? "#d97706" : "#9ca3af", fontWeight: 700 }}>{open}</td>
                            <td style={{ padding: "10px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ flex: 1, height: "6px", background: "#f0f2f8", borderRadius: "3px", overflow: "hidden", minWidth: 60 }}>
                                  <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444", borderRadius: "3px" }} />
                                </div>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a1d2e", minWidth: 32 }}>%{pct}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", padding: "20px 22px" }}>
                <h4 style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: 700, color: "#1a1d2e", display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width:8,height:8,borderRadius:"50%",background:"#0052ff",display:"inline-block" }} /> Kategoriye Göre</h4>
                {rptCatCounts.map(c => (
                  <div key={c.cat} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ fontSize:"12px",color:"#6b7280",fontWeight:500 }}>{c.label}</span>
                      <span style={{ fontSize:"12px",fontWeight:800,color:"#0052ff" }}>{c.count}</span>
                    </div>
                    <div style={{ height:"6px",background:"#f0f2f8",borderRadius:"3px",overflow:"hidden" }}>
                      <div style={{ height:"100%",width:`${(c.count/rptMaxCat)*100}%`,background:"linear-gradient(90deg,#0052ff,#6366f1)",borderRadius:"3px",transition:"width .5s" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", padding: "20px 22px" }}>
                <h4 style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: 700, color: "#1a1d2e", display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width:8,height:8,borderRadius:"50%",background:"#dc2626",display:"inline-block" }} /> Önceliğe Göre</h4>
                {rptPriCounts.map(p => (
                  <div key={p.p} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ fontSize:"12px",fontWeight:600,color:p.style.text,background:p.style.bg,padding:"1px 8px",borderRadius:"4px" }}>{p.label}</span>
                      <span style={{ fontSize:"12px",fontWeight:800,color:p.style.text }}>{p.count}</span>
                    </div>
                    <div style={{ height:"6px",background:"#f0f2f8",borderRadius:"3px",overflow:"hidden" }}>
                      <div style={{ height:"100%",width:`${(p.count/rptMaxPri)*100}%`,background:p.style.text,borderRadius:"3px",opacity:.8,transition:"width .5s" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", padding: "20px 22px" }}>
                <h4 style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: 700, color: "#1a1d2e", display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width:8,height:8,borderRadius:"50%",background:"#22c55e",display:"inline-block" }} /> Duruma Göre</h4>
                {rptStatusCounts.map(s => (
                  <div key={s.s} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 14px",marginBottom:"8px",background:s.style.bg,borderRadius:"8px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
                      <span style={{ width:7,height:7,borderRadius:"50%",background:s.style.dot,flexShrink:0 }} />
                      <span style={{ fontSize:"12px",fontWeight:600,color:s.style.text }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize:"22px",fontWeight:900,color:s.style.text,fontFamily:"var(--font-family-headline)" }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", padding: "22px 24px", marginBottom: "14px" }}>
              <h4 style={{ margin: "0 0 20px", fontSize: "13px", fontWeight: 700, color: "#1a1d2e", display: "flex", alignItems: "center", gap: "6px" }}>
                <TrendingUp size={14} color="#0052ff" /> Günlük Talep Akışı
                {rptDateMode==="month" && <span style={{ fontWeight:400,color:"#9ca3af" }}> — {MONTHS[rptMonth]} {rptYear}</span>}
              </h4>
              <div style={{ display:"flex",gap:rptDateMode==="month"?"2px":"8px",alignItems:"flex-end",height:"100px",overflowX:"auto",paddingBottom:"4px" }}>
                {rptDays.map((d,i) => (
                  <div key={i} style={{ flex:"0 0 auto",minWidth:rptDateMode==="month"?"24px":"52px",display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",height:"100%" }}>
                    {d.count>0 && <span style={{ fontSize:"10px",fontWeight:700,color:"#0052ff" }}>{d.count}</span>}
                    <div style={{ flex:1,width:"100%",display:"flex",alignItems:"flex-end" }}>
                      <div style={{ width:"100%",height:`${Math.max((d.count/rptMaxDay)*100,4)}%`,background:d.count>0?"linear-gradient(180deg,#0052ff,#6366f1)":"#f0f2f8",borderRadius:"4px 4px 0 0",transition:"height .4s" }} />
                    </div>
                    <span style={{ fontSize:"9px",color:"#9ca3af",whiteSpace:"nowrap" }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Personel Performansı */}
            {rptStaffPerf.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", padding: "20px 24px", marginBottom: "14px" }}>
                <h4 style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 700, color: "#1a1d2e", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={14} color="#0052ff" /> Personel Performansı
                </h4>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e5e7ef" }}>
                        {["Personel", "Açılan", "Çözülen", "Çözüm %", "Ort. Süre"].map(h => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rptStaffPerf.map((s, i) => {
                        const pct = s.total ? Math.round((s.resolved / s.total) * 100) : 0;
                        const avgMin = s.resolved > 0 ? Math.round(s.totalMinutes / s.resolved) : null;
                        let avgStr = "—";
                        if (avgMin !== null) {
                          if (avgMin < 60) avgStr = `${avgMin}dk`;
                          else if (avgMin < 1440) avgStr = `${Math.round(avgMin/60)}sa`;
                          else avgStr = `${Math.round(avgMin/1440)}g`;
                        }
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid #f0f2f8" }}>
                            <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1a1d2e" }}>{s.name}</td>
                            <td style={{ padding: "10px 12px", fontWeight: 800, color: "#0052ff" }}>{s.total}</td>
                            <td style={{ padding: "10px 12px", color: "#15803d", fontWeight: 700 }}>{s.resolved}</td>
                            <td style={{ padding: "10px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ flex: 1, height: "6px", background: "#f0f2f8", borderRadius: "3px", overflow: "hidden", minWidth: 60 }}>
                                  <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444", borderRadius: "3px" }} />
                                </div>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a1d2e", minWidth: 32 }}>%{pct}</span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 12px", fontSize: "12px", color: "#6b7280" }}>{avgStr}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PDF / Excel Export */}
            <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", padding: "16px 24px", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h4 style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 700, color: "#1a1d2e" }}>Dışa Aktar</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>{rptTotal} talep listelendi</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={printPDF} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "10px", color: "#6b7280", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                    📄 PDF İndir
                  </button>
                  <button onClick={downloadCSV} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "10px", color: "#15803d", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                    📊 Excel İndir
                  </button>
                </div>
              </div>
            </div>

          </>
        )}

        {/* ══════════════════════════ İŞ PLANI TAB */}
        {tab === "isplan" && (
          <IsPlani companies={companies} staff={staff.map(s => s.name)} currentUserName={sessionName} currentUserRole={sessionRole} />
        )}

        {tab === "notes" && (
          <div style={{ padding: "24px 28px" }}>
            <PersonelNotlari userName={sessionName} />
          </div>
        )}

        {tab === "quotes" && (
          <div style={{ padding: "24px 28px" }}>
            <Teklifler companies={companies} currentUserName={sessionName} staff={staff.map(s => s.name)} initialCompanyId={quotesFilterCompany} />
          </div>
        )}

        {tab === "fortigate" && (
          <div style={{ padding: "24px 28px" }}>
            <FortigateAssist />
          </div>
        )}
      </main>

      {/* ══════════════════════════ MODAL: Yeni Talep (İç) */}
      {newTicketModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          onClick={e => { if (e.target === e.currentTarget) setNewTicketModal(false); }}>
          <div style={{ background: "#fff", borderRadius: "18px", width: "100%", maxWidth: "620px", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 72px rgba(0,0,0,.28)" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f5", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#eff6ff", borderRadius: "10px", padding: "8px", display: "flex" }}>
                  <Plus size={18} color="#0052ff" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>Yeni Destek Talebi</h2>
                  <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>Sözleşmeli müşteri için talep oluştur</p>
                </div>
              </div>
              <button onClick={() => setNewTicketModal(false)} style={{ background: "#f4f6fb", border: "none", borderRadius: "8px", cursor: "pointer", padding: "6px", display: "flex", color: "#6b7280" }}><X size={16} /></button>
            </div>

            {/* Body (scrollable) */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>

              {/* Şirket */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".6px", display: "block", marginBottom: "6px" }}>🏢 Şirket *</label>
                <select value={ntCompanyId} onChange={e => setNtCompanyId(e.target.value)} style={inpS}>
                  <option value="">— Şirket seçin —</option>
                  {contractedCompanies.map(c => <option key={c.id} value={c.id}>{c.name} — {c.contact_name}</option>)}
                </select>
              </div>

              {/* Sorun Kategorisi */}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".6px", display: "block", marginBottom: "8px" }}>🗂 Sorun Kategorisi *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {Object.entries(NT_ISSUES).map(([key, cat]) => (
                    <button key={key} onClick={() => { setNtCategory(key); setNtIssueType(""); setNtPriority(NT_PRI_SUGGEST[key] || "medium"); }}
                      style={{ padding: "6px 14px", borderRadius: "20px", border: `1.5px solid ${ntCategory === key ? "#0052ff" : "#e5e7ef"}`, background: ntCategory === key ? "#eff6ff" : "#fff", color: ntCategory === key ? "#0052ff" : "#6b7280", fontSize: "12px", fontWeight: ntCategory === key ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap" }}>
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorun Türü */}
              {ntCategory && (
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".6px", display: "block", marginBottom: "6px" }}>⚠️ Sorun Türü *</label>
                  <select value={ntIssueType} onChange={e => setNtIssueType(e.target.value)} style={{ ...inpS, background: ntIssueType ? "#f0f5ff" : "#fff" }}>
                    <option value="">— Seçin —</option>
                    {NT_ISSUES[ntCategory]?.items.map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                    <option value="custom">✏️ Diğer — manuel gir</option>
                  </select>
                </div>
              )}

              {/* Özel konu girişi */}
              {ntIssueType === "custom" && (
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".6px", display: "block", marginBottom: "6px" }}>Konu (Manuel)</label>
                  <input value={ntCustomSubject} onChange={e => setNtCustomSubject(e.target.value)} placeholder="Sorun başlığını yazın..." style={inpS} />
                </div>
              )}

              {/* Öncelik + Destek Türü */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".6px", display: "block", marginBottom: "6px" }}>🚦 Öncelik</label>
                  <select value={ntPriority} onChange={e => setNtPriority(e.target.value)} style={inpS}>
                    <option value="low">🟢 Düşük</option>
                    <option value="medium">🟡 Orta</option>
                    <option value="high">🟠 Yüksek</option>
                    <option value="urgent">🔴 ACİL</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".6px", display: "block", marginBottom: "6px" }}>🔧 Destek Türü</label>
                  <select value={ntSupportType} onChange={e => setNtSupportType(e.target.value)} style={inpS}>
                    <option value="remote">💻 Uzaktan</option>
                    <option value="onsite">🏢 Yerinde</option>
                  </select>
                </div>
              </div>

              {/* Etkilenen kullanıcı adı */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".6px", display: "block", marginBottom: "6px" }}>👤 Etkilenen Kullanıcı Ad Soyad</label>
                  <input value={ntAffectedName} onChange={e => setNtAffectedName(e.target.value)} placeholder="Ahmet Yılmaz" style={inpS} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".6px", display: "block", marginBottom: "6px" }}>👥 Etkilenen Kişi Sayısı</label>
                  <select value={ntAffected} onChange={e => setNtAffected(e.target.value)} style={inpS}>
                    <option value="1_kisi">1 kişi</option>
                    <option value="2-5">2–5 kişi</option>
                    <option value="6-10">6–10 kişi</option>
                    <option value="tum_ofis">Tüm ofis</option>
                  </select>
                </div>
              </div>

              {/* Bildirim e-postası (override) */}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".6px", display: "block", marginBottom: "6px" }}>📧 Bildirim E-postası <span style={{ fontWeight: 400, color: "#9ca3af", textTransform: "none", letterSpacing: 0 }}>(opsiyonel — boşsa şirket maili kullanılır)</span></label>
                <input type="email" list="nt-company-emails" value={ntNotifyEmail} onChange={e => setNtNotifyEmail(e.target.value)} placeholder="ornek: gm@musterifirma.com" style={inpS} />
                <datalist id="nt-company-emails">
                  {ntCompanyEmails.map(em => <option key={em} value={em} />)}
                </datalist>
                {ntCompanyEmails.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#9ca3af", alignSelf: "center" }}>Kayıtlı:</span>
                    {ntCompanyEmails.map(em => (
                      <button key={em} type="button" onClick={() => setNtNotifyEmail(em)}
                        style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", cursor: "pointer",
                          border: ntNotifyEmail === em ? "1.5px solid #0052ff" : "1px solid #e5e7ef",
                          background: ntNotifyEmail === em ? "#eff6ff" : "#f8fafc",
                          color: ntNotifyEmail === em ? "#0052ff" : "#475569" }}>
                        {em}
                      </button>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: "11px", color: "#9ca3af", margin: "7px 2px 0", lineHeight: 1.5 }}>Doldurursanız açılış ve çözüm bildirimleri şirket kartındaki mail yerine <strong>bu adrese</strong> gönderilir. Bu şirket için girdiğiniz adresler bir sonraki sefere hatırlanır.</p>
              </div>

              {/* Sorun saati */}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".6px", display: "block", marginBottom: "6px" }}>🕐 Sorun Başlangıç Saati <span style={{ fontWeight: 400, color: "#9ca3af", textTransform: "none" }}>(opsiyonel)</span></label>
                <input type="datetime-local" value={ntStartedAt} onChange={e => setNtStartedAt(e.target.value)} style={inpS} />
              </div>

              {/* Ek Notlar (opsiyonel) */}
              <div style={{ marginBottom: "4px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".6px", display: "block", marginBottom: "6px" }}>
                  📝 Ek Notlar <span style={{ fontWeight: 400, color: "#9ca3af", textTransform: "none", letterSpacing: 0 }}>(opsiyonel)</span>
                </label>
                <textarea value={ntNotes} onChange={e => setNtNotes(e.target.value)} rows={3} placeholder="Varsa ek detay, geçmiş bilgi veya özel durum..." style={{ ...inpS, resize: "vertical", lineHeight: 1.6 }} />
              </div>

              {ntError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", marginTop: "12px" }}>
                  <p style={{ color: "#dc2626", fontSize: "13px", margin: 0, fontWeight: 500 }}>⚠️ {ntError}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #f0f0f5", display: "flex", gap: "10px", flexShrink: 0 }}>
              <button onClick={createInternalTicket} disabled={ntSaving || !ntCompanyId || (!ntIssueType)}
                style={{ flex: 1, padding: "12px", background: ntSaving || !ntCompanyId || !ntIssueType ? "#e5e7ef" : "#0052ff", color: ntSaving || !ntCompanyId || !ntIssueType ? "#9ca3af" : "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: ntSaving || !ntCompanyId || !ntIssueType ? "not-allowed" : "pointer", transition: "background .15s" }}>
                {ntSaving ? "Oluşturuluyor..." : "Talep Oluştur →"}
              </button>
              <button onClick={() => setNewTicketModal(false)} style={{ padding: "12px 20px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════ MODAL: Şifre Değiştir */}
      {pwModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          onClick={e => { if (e.target === e.currentTarget) setPwModal(false); }}>
          <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 72px rgba(0,0,0,.28)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #f0f0f5" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>🔒 Şifremi Değiştir</h2>
              <button onClick={() => setPwModal(false)} style={{ background: "#f4f6fb", border: "none", borderRadius: "8px", cursor: "pointer", padding: "6px", display: "flex", color: "#6b7280" }}><X size={16} /></button>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "6px" }}>Mevcut Şifre</label>
                <input type="password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} placeholder="••••••••" style={inpS} />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "6px" }}>Yeni Şifre</label>
                <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder="••••••••" style={inpS} />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "6px" }}>Yeni Şifre (Tekrar)</label>
                <input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder="••••••••" style={inpS} />
              </div>
              {pwError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px" }}>
                  <p style={{ color: "#dc2626", fontSize: "13px", margin: 0, fontWeight: 500 }}>⚠️ {pwError}</p>
                </div>
              )}
              {pwSuccess && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px" }}>
                  <p style={{ color: "#15803d", fontSize: "13px", margin: 0, fontWeight: 600 }}>✓ {pwSuccess}</p>
                </div>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={changePassword} disabled={pwSaving}
                  style={{ flex: 1, padding: "12px", background: pwSaving ? "#e5e7ef" : "#0052ff", color: pwSaving ? "#9ca3af" : "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: pwSaving ? "not-allowed" : "pointer" }}>
                  {pwSaving ? "Kaydediliyor..." : "Şifreyi Güncelle"}
                </button>
                <button onClick={() => setPwModal(false)} style={{ padding: "12px 20px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════ MODAL: Şirket Ekle / Düzenle */}
      {compModal !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          onClick={e => { if (e.target === e.currentTarget) setCompModal(null); }}>
          <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "520px", boxShadow: "0 20px 60px rgba(0,0,0,.25)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #e5e7ef" }}>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#1a1d2e" }}>{compModal.customer_type === "external" ? (compModal.id ? "Dış Müşteri Düzenle" : "Yeni Dış Müşteri") : (compModal.id ? "Şirket Düzenle" : "Yeni Şirket Ekle")}</h2>
              <button onClick={() => setCompModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={20} /></button>
            </div>
            <div style={{ padding: "24px" }}>
              {[
                { label: "Şirket Adı *",        key: "name",          type: "text",  placeholder: "Şirket Bilişim A.Ş." },
                { label: "Yetkili / Müdür Adı *",key: "contact_name",  type: "text",  placeholder: "Ahmet Yılmaz" },
                { label: "Yetkili E-posta *",    key: "contact_email", type: "email", placeholder: "mudurad@sirket.com" },
                { label: "Telefon",              key: "phone",         type: "text",  placeholder: "+90 312 000 00 00" },
                { label: "Adres",                key: "address",       type: "text",  placeholder: "Mahalle, cadde, no, ilçe/il" },
                { label: "Vergi Dairesi",        key: "tax_office",    type: "text",  placeholder: "ör. Sincan" },
                { label: "Vergi No",             key: "tax_no",        type: "text",  placeholder: "ör. 1234567890" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "6px" }}>{f.label}</label>
                  <input type={f.type} value={(compModal as Record<string,string>)[f.key] || ""} onChange={e => setCompModal(p => ({ ...p!, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inpS} />
                </div>
              ))}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "6px" }}>Sektör</label>
                <select value={compModal.sector || ""} onChange={e => setCompModal(p => ({ ...p!, sector: e.target.value }))} style={inpS}>
                  <option value="">— Seçin —</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "6px" }}>Notlar</label>
                <textarea value={compModal.notes || ""} onChange={e => setCompModal(p => ({ ...p!, notes: e.target.value }))} rows={3} placeholder="Ek bilgi, sözleşme detayı..." style={{ ...inpS, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={saveCompany} disabled={compSaving || !compModal.name || !compModal.contact_name || !compModal.contact_email}
                  style={{ flex: 1, padding: "12px", background: compSaving ? "#e5e7ef" : "#0052ff", color: compSaving ? "#9ca3af" : "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                  {compSaving ? "Kaydediliyor..." : compModal.id ? "Güncelle" : "Şirket Ekle"}
                </button>
                <button onClick={() => setCompModal(null)} style={{ padding: "12px 20px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
