"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, FileText, AlertTriangle, CalendarClock, ShieldCheck, RefreshCw, Mail } from "lucide-react";

interface Company { id: string; name: string; contact_name?: string; }
interface Contract {
  id: string;
  company_id: string | null;
  company_name: string | null;
  title: string;
  type: string;
  serial_no: string | null;
  start_date: string | null;
  end_date: string;
  amount: number;
  currency: string;
  status: string;
  auto_remind: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  fortinet: "Fortinet Lisans/Bundle", destek: "Destek Sözleşmesi", bakim: "Bakım Anlaşması",
  lisans: "Yazılım Lisansı", donanim: "Donanım Garanti", diger: "Diğer",
};
const TYPE_COLOR: Record<string, string> = {
  fortinet: "#dc2626", destek: "#0052ff", bakim: "#0891b2", lisans: "#7c3aed", donanim: "#d97706", diger: "#6b7280",
};
const CUR_SYM: Record<string, string> = { TL: "₺", USD: "$", EUR: "€" };

function daysLeft(end: string): number {
  const d = new Date(end + "T00:00:00");
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}
function fmtMoney(n: number, cur: string) {
  return `${CUR_SYM[cur] || ""}${(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function renewBadge(c: Contract): { label: string; color: string; bg: string } {
  if (c.status === "renewed") return { label: "Yenilendi", color: "#15803d", bg: "#f0fdf4" };
  if (c.status === "cancelled") return { label: "İptal", color: "#6b7280", bg: "#f3f4f6" };
  const d = daysLeft(c.end_date);
  if (d < 0) return { label: `${Math.abs(d)} gün geçti`, color: "#dc2626", bg: "#fef2f2" };
  if (d <= 7) return { label: `${d} gün kaldı`, color: "#dc2626", bg: "#fef2f2" };
  if (d <= 30) return { label: `${d} gün kaldı`, color: "#ea580c", bg: "#fff7ed" };
  if (d <= 60) return { label: `${d} gün kaldı`, color: "#d97706", bg: "#fffbeb" };
  return { label: `${d} gün kaldı`, color: "#15803d", bg: "#f0fdf4" };
}

const inpS: React.CSSProperties = {
  padding: "9px 12px", background: "#fff", border: "1.5px solid #e5e7ef",
  borderRadius: "9px", color: "#1a1d2e", fontSize: "13px", outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};
const lblS: React.CSSProperties = { fontSize: "12px", fontWeight: 700, color: "#475569", margin: "0 0 5px", display: "block" };

export default function Sozlesmeler({ companies, currentUserName, canSeeMoney, isMobile, onCreateRenewalQuote }: {
  companies: Company[];
  currentUserName: string;
  canSeeMoney: boolean;
  isMobile: boolean;
  onCreateRenewalQuote?: (companyId: string) => void;
}) {
  const [list, setList] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "soon" | "expired" | "active">("all");
  const [modal, setModal] = useState<Partial<Contract> | null>(null);
  const [saving, setSaving] = useState(false);
  const [mailing, setMailing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/contracts");
      const d = await r.json();
      setList(d.contracts || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let arr = list;
    if (filter === "soon") arr = arr.filter(c => c.status === "active" && daysLeft(c.end_date) >= 0 && daysLeft(c.end_date) <= 30);
    else if (filter === "expired") arr = arr.filter(c => c.status === "active" && daysLeft(c.end_date) < 0);
    else if (filter === "active") arr = arr.filter(c => c.status === "active");
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(c => `${c.title} ${c.company_name || ""} ${c.serial_no || ""}`.toLowerCase().includes(q));
    }
    return arr;
  }, [list, filter, search]);

  // Özet istatistikler (sadece aktif sözleşmeler)
  const stats = useMemo(() => {
    const active = list.filter(c => c.status === "active");
    const soon = active.filter(c => { const d = daysLeft(c.end_date); return d >= 0 && d <= 30; });
    const expired = active.filter(c => daysLeft(c.end_date) < 0);
    const sumBy = (arr: Contract[]) => {
      const m: Record<string, number> = {};
      for (const c of arr) m[c.currency] = (m[c.currency] || 0) + (Number(c.amount) || 0);
      return Object.entries(m).filter(([, v]) => v > 0).map(([k, v]) => fmtMoney(v, k)).join(" + ") || "—";
    };
    return { activeCount: active.length, soonCount: soon.length, expiredCount: expired.length, soonValue: sumBy(soon) };
  }, [list]);

  async function save() {
    if (!modal?.title || !modal?.end_date) { alert("Başlık ve bitiş tarihi zorunlu."); return; }
    setSaving(true);
    try {
      const method = modal.id ? "PATCH" : "POST";
      const r = await fetch("/api/admin/contracts", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(modal),
      });
      if (!r.ok) { const e = await r.json(); alert("Hata: " + (e.error || "kaydedilemedi")); return; }
      setModal(null);
      await load();
    } finally { setSaving(false); }
  }
  async function markRenewed(c: Contract) {
    if (!confirm(`"${c.title}" sözleşmesi yenilendi olarak işaretlensin mi?`)) return;
    await fetch("/api/admin/contracts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, status: "renewed" }) });
    await load();
  }
  async function remove(c: Contract) {
    if (!confirm(`"${c.title}" sözleşmesi silinsin mi?`)) return;
    await fetch("/api/admin/contracts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id }) });
    await load();
  }
  async function sendReminder() {
    setMailing(true);
    try {
      const r = await fetch("/api/admin/contracts/check-renewals");
      const d = await r.json();
      if (!r.ok) { alert("Hata: " + (d.error || "gönderilemedi")); return; }
      if (d.sent) alert(`✅ ${d.count} sözleşme için hatırlatma maili gönderildi → ${d.to}`);
      else alert("Şu an 30 gün içinde bitecek veya süresi geçmiş sözleşme yok, mail gönderilmedi.");
    } catch { alert("Mail gönderilemedi."); }
    finally { setMailing(false); }
  }

  return (
    <div>
      {/* Özet kartları */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fit,minmax(180px,1fr))", gap: "14px", marginBottom: "18px" }}>
        <SumCard icon={<ShieldCheck size={18} />} value={stats.activeCount} label="Aktif Sözleşme" color="#0052ff" bg="#eff6ff" onClick={() => setFilter("active")} />
        <SumCard icon={<CalendarClock size={18} />} value={stats.soonCount} label="30 Gün İçinde Bitecek" color="#ea580c" bg="#fff7ed" onClick={() => setFilter("soon")} />
        <SumCard icon={<AlertTriangle size={18} />} value={stats.expiredCount} label="Süresi Geçmiş" color="#dc2626" bg="#fef2f2" onClick={() => setFilter("expired")} />
        {canSeeMoney && <SumCard icon={<RefreshCw size={18} />} value={stats.soonValue} label="Yakın Yenileme Cirosu" color="#15803d" bg="#f0fdf4" small />}
      </div>

      {/* Üst bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {([["all", "Tümü"], ["active", "Aktif"], ["soon", "Yaklaşan"], ["expired", "Süresi Geçmiş"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 13px", borderRadius: "8px", border: `1.5px solid ${filter === v ? "#0052ff" : "#e5e7ef"}`, background: filter === v ? "#eff6ff" : "#fff", color: filter === v ? "#0052ff" : "#6b7280", fontSize: "12.5px", fontWeight: filter === v ? 700 : 500, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sözleşme, firma, seri no ara..." style={{ ...inpS, flex: 1, minWidth: "160px", maxWidth: "320px" }} />
        <button onClick={sendReminder} disabled={mailing} title="Yaklaşan sözleşmeler için fortigate@lidernetwork.com.tr adresine hatırlatma maili gönder"
          style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 15px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "10px", color: "#475569", fontSize: "12.5px", fontWeight: 700, cursor: mailing ? "default" : "pointer", marginLeft: "auto", opacity: mailing ? .6 : 1 }}>
          <Mail size={15} /> {mailing ? "Gönderiliyor…" : "Hatırlatma Maili"}
        </button>
        <button onClick={() => setModal({ type: "fortinet", currency: "TL", status: "active", auto_remind: true, end_date: "" })}
          style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 18px", background: "#0052ff", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
          <Plus size={15} /> Sözleşme Ekle
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <p style={{ color: "#9ca3af", fontSize: "14px" }}>Yükleniyor…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: "14px", border: "1px dashed #e5e7ef" }}>
          <p style={{ color: "#9ca3af", fontSize: "15px", margin: "0 0 14px" }}>Bu filtrede sözleşme yok.</p>
          <button onClick={() => setModal({ type: "fortinet", currency: "TL", status: "active", auto_remind: true, end_date: "" })} style={{ padding: "10px 20px", background: "#0052ff", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>İlk Sözleşmeyi Ekle</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {filtered.map(c => {
            const rb = renewBadge(c);
            return (
              <div key={c.id} style={{ background: "#fff", border: "1px solid #e5e7ef", borderLeft: `4px solid ${rb.color}`, borderRadius: "12px", padding: "16px 18px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".4px", color: TYPE_COLOR[c.type] || "#6b7280", background: (TYPE_COLOR[c.type] || "#6b7280") + "14", padding: "2px 8px", borderRadius: "6px" }}>{TYPE_LABEL[c.type] || c.type}</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: rb.color, background: rb.bg, padding: "2px 9px", borderRadius: "20px" }}>{rb.label}</span>
                  </div>
                  <p style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: 700, color: "#1a1d2e" }}>{c.title}</p>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#6b7280" }}>
                    {c.company_name || "—"}{c.serial_no ? ` · SN: ${c.serial_no}` : ""}
                  </p>
                </div>
                <div style={{ textAlign: isMobile ? "left" : "right", minWidth: "140px" }}>
                  <p style={{ margin: "0 0 2px", fontSize: "12px", color: "#9ca3af" }}>{fmtDate(c.start_date)} → <b style={{ color: "#1a1d2e" }}>{fmtDate(c.end_date)}</b></p>
                  {canSeeMoney && c.amount > 0 && <p style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#15803d" }}>{fmtMoney(c.amount, c.currency)}</p>}
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  {c.status === "active" && onCreateRenewalQuote && c.company_id && (
                    <button onClick={() => onCreateRenewalQuote(c.company_id!)} title="Yenileme teklifi oluştur" style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "8px 11px", borderRadius: "8px", border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                      <FileText size={13} /> Teklif
                    </button>
                  )}
                  {c.status === "active" && (
                    <button onClick={() => markRenewed(c)} title="Yenilendi işaretle" style={{ width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", cursor: "pointer" }}><RefreshCw size={14} /></button>
                  )}
                  <button onClick={() => setModal(c)} title="Düzenle" style={{ width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #e5e7ef", background: "#fff", color: "#475569", cursor: "pointer" }}><Pencil size={14} /></button>
                  <button onClick={() => remove(c)} title="Sil" style={{ width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div onClick={() => !saving && setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "30px 16px", zIndex: 1000, overflowY: "auto" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "560px", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
            <h2 style={{ margin: "0 0 18px", fontSize: "17px", fontWeight: 800, color: "#1a1d2e" }}>{modal.id ? "Sözleşme Düzenle" : "Yeni Sözleşme"}</h2>
            <div style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={lblS}>Başlık *</label>
                <input style={inpS} value={modal.title || ""} onChange={e => setModal({ ...modal, title: e.target.value })} placeholder="ör. FortiGate 100F UTM Bundle" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={lblS}>Firma</label>
                  <select style={inpS} value={modal.company_id || ""} onChange={e => {
                    const co = companies.find(x => x.id === e.target.value);
                    setModal({ ...modal, company_id: e.target.value || null, company_name: co?.name || null });
                  }}>
                    <option value="">— Seçiniz —</option>
                    {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lblS}>Tür</label>
                  <select style={inpS} value={modal.type || "fortinet"} onChange={e => setModal({ ...modal, type: e.target.value })}>
                    {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={lblS}>Başlangıç Tarihi</label>
                  <input type="date" style={inpS} value={modal.start_date || ""} onChange={e => setModal({ ...modal, start_date: e.target.value })} />
                </div>
                <div>
                  <label style={lblS}>Bitiş Tarihi *</label>
                  <input type="date" style={inpS} value={modal.end_date || ""} onChange={e => setModal({ ...modal, end_date: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={lblS}>Seri No</label>
                  <input style={inpS} value={modal.serial_no || ""} onChange={e => setModal({ ...modal, serial_no: e.target.value })} placeholder="FG100F..." />
                </div>
                {canSeeMoney && (
                  <div>
                    <label style={lblS}>Tutar</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input type="number" style={{ ...inpS, flex: 1 }} value={modal.amount ?? ""} onChange={e => setModal({ ...modal, amount: Number(e.target.value) })} placeholder="0" />
                      <select style={{ ...inpS, width: "80px" }} value={modal.currency || "TL"} onChange={e => setModal({ ...modal, currency: e.target.value })}>
                        <option>TL</option><option>USD</option><option>EUR</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label style={lblS}>Not</label>
                <textarea style={{ ...inpS, minHeight: "70px", resize: "vertical" }} value={modal.notes || ""} onChange={e => setModal({ ...modal, notes: e.target.value })} />
              </div>
              {modal.id && (
                <div>
                  <label style={lblS}>Durum</label>
                  <select style={inpS} value={modal.status || "active"} onChange={e => setModal({ ...modal, status: e.target.value })}>
                    <option value="active">Aktif</option>
                    <option value="renewed">Yenilendi</option>
                    <option value="cancelled">İptal</option>
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "22px", justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} disabled={saving} style={{ padding: "10px 18px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "9px", color: "#6b7280", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>İptal</button>
              <button onClick={save} disabled={saving} style={{ padding: "10px 22px", background: "#0052ff", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? .6 : 1 }}>{saving ? "Kaydediliyor…" : "Kaydet"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SumCard({ icon, value, label, color, bg, onClick, small }: {
  icon: React.ReactNode; value: string | number; label: string; color: string; bg: string; onClick?: () => void; small?: boolean;
}) {
  return (
    <div onClick={onClick} style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", padding: "16px 18px", cursor: onClick ? "pointer" : "default" }}>
      <div style={{ display: "inline-flex", padding: "7px", background: bg, color, borderRadius: "9px", marginBottom: "10px" }}>{icon}</div>
      <p style={{ fontSize: small ? "18px" : "28px", fontWeight: 900, color, margin: "0 0 2px", lineHeight: 1.1, fontFamily: "var(--font-family-headline)" }}>{value}</p>
      <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>{label}</p>
    </div>
  );
}
