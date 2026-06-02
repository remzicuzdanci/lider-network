"use client";

import { useEffect, useState } from "react";
import {
  Plus, X, Calendar, User, Building2, Flag,
  AlertCircle, MoreHorizontal, Edit2, Trash2, CheckCircle2, Clock,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────── */
interface WorkTask {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: "todo" | "in_progress" | "done";
  assigned_to?: string;
  company_id?: string;
  due_date?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  companies?: { name: string };
}

interface Company { id: string; name: string; }

/* ── Constants ─────────────────────────────────────────────────── */
const CATEGORIES: { value: string; label: string; emoji: string }[] = [
  { value: "ziyaret",  label: "Müşteri Ziyareti",    emoji: "🏢" },
  { value: "kurulum",  label: "Kurulum / Montaj",     emoji: "🔧" },
  { value: "toplanti", label: "Toplantı",              emoji: "📞" },
  { value: "teklif",   label: "Teklif Hazırlama",     emoji: "📄" },
  { value: "destek",   label: "Teknik Destek",        emoji: "🛠️" },
  { value: "rapor",    label: "Rapor / Analiz",       emoji: "📊" },
  { value: "ic_gorev", label: "İç Görev",             emoji: "📋" },
  { value: "general",  label: "Diğer",                emoji: "⚡" },
];
const catMap = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

const PRIORITIES: { value: string; label: string; color: string; bg: string }[] = [
  { value: "urgent", label: "ACİL",   color: "#dc2626", bg: "#fef2f2" },
  { value: "high",   label: "Yüksek", color: "#ea580c", bg: "#fff7ed" },
  { value: "medium", label: "Orta",   color: "#d97706", bg: "#fffbeb" },
  { value: "low",    label: "Düşük",  color: "#64748b", bg: "#f1f5f9" },
];
const priMap = Object.fromEntries(PRIORITIES.map((p) => [p.value, p]));

const COLUMNS: { id: "todo" | "in_progress" | "done"; label: string; color: string; bg: string; border: string }[] = [
  { id: "todo",        label: "Yapılacak",     color: "#4b5563", bg: "#f8fafc",  border: "#e2e8f0" },
  { id: "in_progress", label: "Devam Ediyor",  color: "#7c3aed", bg: "#faf5ff",  border: "#ddd6fe" },
  { id: "done",        label: "Tamamlandı",    color: "#15803d", bg: "#f0fdf4",  border: "#bbf7d0" },
];

const STAFF_LIST = ["Remzi Cuzdancı", "Ahmet Yılmaz", "Mehmet Kaya", "Fatma Demir", "Ali Öztürk", "Ayşe Çelik"];

const inpS: React.CSSProperties = {
  padding: "8px 12px", background: "#fff", border: "1.5px solid #e5e7ef",
  borderRadius: "8px", color: "#1a1d2e", fontSize: "13px", outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};
const selS: React.CSSProperties = { ...inpS };
const lblS: React.CSSProperties = { display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "5px", letterSpacing: ".3px", textTransform: "uppercase" };

/* ── Helpers ───────────────────────────────────────────────────── */
function dueBadge(due?: string, status?: string) {
  if (!due) return null;
  if (status === "done") return null;
  const d = new Date(due);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}g gecikti`, color: "#dc2626", bg: "#fef2f2" };
  if (diff === 0) return { label: "Bugün", color: "#ea580c", bg: "#fff7ed" };
  if (diff <= 2) return { label: `${diff}g kaldı`, color: "#d97706", bg: "#fffbeb" };
  return { label: d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }), color: "#64748b", bg: "#f1f5f9" };
}

/* ── Task Card ─────────────────────────────────────────────────── */
function TaskCard({
  task, onEdit, onDelete, onMove,
}: {
  task: WorkTask;
  onEdit: (t: WorkTask) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: "todo" | "in_progress" | "done") => void;
}) {
  const [menu, setMenu] = useState(false);
  const cat = catMap[task.category] ?? catMap["general"];
  const pri = priMap[task.priority] ?? priMap["medium"];
  const due = dueBadge(task.due_date, task.status);

  return (
    <div style={{
      background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "12px",
      padding: "14px", marginBottom: "10px", cursor: "default",
      boxShadow: "0 1px 4px rgba(0,0,0,.04)",
      transition: "box-shadow .15s",
    }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,.08)"; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,.04)"; }}>

      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: "15px", flexShrink: 0 }}>{cat.emoji}</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", flexShrink: 0 }}>{cat.label}</span>
        </div>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button onClick={() => setMenu(!menu)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "2px 4px", borderRadius: "6px" }}>
            <MoreHorizontal size={15} />
          </button>
          {menu && (
            <div style={{
              position: "absolute", right: 0, top: "100%", zIndex: 50,
              background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "10px",
              boxShadow: "0 8px 24px rgba(0,0,0,.12)", minWidth: 160, padding: "6px",
            }} onMouseLeave={() => setMenu(false)}>
              {COLUMNS.filter((c) => c.id !== task.status).map((col) => (
                <button key={col.id} onClick={() => { onMove(task.id, col.id); setMenu(false); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 10px", borderRadius: "7px", background: "none", border: "none", fontSize: "12px", color: col.color, cursor: "pointer", fontWeight: 600 }}>
                  → {col.label}
                </button>
              ))}
              <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />
              <button onClick={() => { onEdit(task); setMenu(false); }}
                style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%", textAlign: "left", padding: "7px 10px", borderRadius: "7px", background: "none", border: "none", fontSize: "12px", color: "#374151", cursor: "pointer" }}>
                <Edit2 size={12} /> Düzenle
              </button>
              <button onClick={() => { onDelete(task.id); setMenu(false); }}
                style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%", textAlign: "left", padding: "7px 10px", borderRadius: "7px", background: "none", border: "none", fontSize: "12px", color: "#dc2626", cursor: "pointer" }}>
                <Trash2 size={12} /> Sil
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <p style={{ margin: "0 0 10px", fontSize: "13.5px", fontWeight: 700, color: "#1a1d2e", lineHeight: 1.4,
        textDecoration: task.status === "done" ? "line-through" : "none",
        opacity: task.status === "done" ? 0.6 : 1 }}>
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
          {task.description.length > 80 ? task.description.slice(0, 80) + "…" : task.description}
        </p>
      )}

      {/* Company */}
      {task.companies?.name && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
          <Building2 size={11} color="#94a3b8" />
          <span style={{ fontSize: "11.5px", color: "#64748b" }}>{task.companies.name}</span>
        </div>
      )}

      {/* Footer row */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginTop: "8px" }}>
        {/* Priority */}
        <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "2px 7px", borderRadius: "5px", background: pri.bg, color: pri.color }}>
          {pri.label}
        </span>

        {/* Due */}
        {due && (
          <span style={{ fontSize: "10.5px", fontWeight: 600, padding: "2px 7px", borderRadius: "5px", background: due.bg, color: due.color, display: "flex", alignItems: "center", gap: "3px" }}>
            <Clock size={10} /> {due.label}
          </span>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Assignee */}
        {task.assigned_to && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#0038c7,#0052ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 800, color: "#fff" }}>
              {task.assigned_to.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Modal ─────────────────────────────────────────────────────── */
function TaskModal({
  task, companies, onSave, onClose,
}: {
  task: Partial<WorkTask> | null;
  companies: Company[];
  onSave: (t: Partial<WorkTask>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<WorkTask>>(
    task ?? { category: "general", priority: "medium", status: "todo" }
  );
  const [saving, setSaving] = useState(false);

  function set<K extends keyof WorkTask>(k: K, v: WorkTask[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title?.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: "18px", padding: "28px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1a1d2e" }}>
            {form.id ? "Görevi Düzenle" : "Yeni Görev"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={18} /></button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Title */}
          <div>
            <label style={lblS}>Görev Başlığı *</label>
            <input type="text" value={form.title ?? ""} required placeholder="Görevi kısaca açıklayın..."
              style={inpS} onChange={(e) => set("title", e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7ef")}
            />
          </div>

          {/* Description */}
          <div>
            <label style={lblS}>Açıklama</label>
            <textarea value={form.description ?? ""} rows={2} placeholder="Detay bilgi..."
              style={{ ...inpS, resize: "vertical" as const }}
              onChange={(e) => set("description", e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7ef")}
            />
          </div>

          {/* Category + Priority */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={lblS}>Kategori</label>
              <select value={form.category ?? "general"} style={selS}
                onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lblS}>Öncelik</label>
              <select value={form.priority ?? "medium"} style={selS}
                onChange={(e) => set("priority", e.target.value)}>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned + Due */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={lblS}>Atanan Kişi</label>
              <select value={form.assigned_to ?? ""} style={selS}
                onChange={(e) => set("assigned_to", e.target.value)}>
                <option value="">— Seçin —</option>
                {STAFF_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={lblS}>Bitiş Tarihi</label>
              <input type="date" value={form.due_date ?? ""} style={inpS}
                onChange={(e) => set("due_date", e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7ef")}
              />
            </div>
          </div>

          {/* Company + Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={lblS}>Müşteri / Firma</label>
              <select value={form.company_id ?? ""} style={selS}
                onChange={(e) => set("company_id", e.target.value)}>
                <option value="">— Seçin —</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lblS}>Durum</label>
              <select value={form.status ?? "todo"} style={selS}
                onChange={(e) => set("status", e.target.value as WorkTask["status"])}>
                {COLUMNS.map((col) => <option key={col.id} value={col.id}>{col.label}</option>)}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
            <button type="button" onClick={onClose}
              style={{ padding: "9px 18px", border: "1.5px solid #e5e7ef", borderRadius: "9px", background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              İptal
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: "9px 22px", border: "none", borderRadius: "9px", background: saving ? "#d1d5db" : "linear-gradient(135deg,#0038c7,#0052ff)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(0,82,255,.3)" }}>
              {saving ? "Kaydediliyor..." : form.id ? "Güncelle" : "Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
export default function IsPlani({ companies }: { companies: Company[] }) {
  const [tasks, setTasks]       = useState<WorkTask[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<Partial<WorkTask> | null | false>(false);
  const [filterAssign, setFA]   = useState("");
  const [filterPri, setFP]      = useState("");

  /* ── Fetch ──────────────────────────────────────────────────── */
  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/tasks");
    if (res.ok) setTasks(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  /* ── CRUD helpers ───────────────────────────────────────────── */
  async function saveTask(form: Partial<WorkTask>) {
    if (form.id) {
      const res = await fetch("/api/admin/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { const updated = await res.json(); setTasks((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t)); }
    } else {
      const res = await fetch("/api/admin/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { const created = await res.json(); setTasks((prev) => [created, ...prev]); }
    }
    setModal(false);
  }

  async function deleteTask(id: string) {
    if (!confirm("Bu görevi silmek istediğinizden emin misiniz?")) return;
    await fetch("/api/admin/tasks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function moveTask(id: string, status: WorkTask["status"]) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    await fetch("/api/admin/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
  }

  /* ── Filter ─────────────────────────────────────────────────── */
  const filtered = tasks.filter((t) => {
    if (filterAssign && t.assigned_to !== filterAssign) return false;
    if (filterPri    && t.priority    !== filterPri)    return false;
    return true;
  });

  const byCol = (col: WorkTask["status"]) => filtered.filter((t) => t.status === col);

  /* ── Stats ──────────────────────────────────────────────────── */
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdue  = tasks.filter((t) => t.status !== "done" && t.due_date && t.due_date < todayStr).length;
  const doneToday = tasks.filter((t) => t.status === "done" && t.updated_at?.slice(0, 10) === todayStr).length;

  return (
    <div style={{ padding: "28px 32px", background: "#f8fafc", minHeight: "100%", fontFamily: "inherit" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 800, color: "#1a1d2e" }}>İş Planı</h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Ekip görevlerini takip edin ve yönetin</p>
        </div>
        <button onClick={() => setModal({})}
          style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 18px", background: "linear-gradient(135deg,#0038c7,#0052ff)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,82,255,.3)" }}>
          <Plus size={15} /> Görev Ekle
        </button>
      </div>

      {/* ── Mini stats ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Toplam Görev",    value: tasks.length,                              color: "#0052ff", bg: "#eff6ff" },
          { label: "Devam Ediyor",    value: tasks.filter((t) => t.status === "in_progress").length, color: "#7c3aed", bg: "#faf5ff" },
          { label: "Gecikmiş",        value: overdue,                                   color: "#dc2626", bg: "#fef2f2" },
          { label: "Bugün Tamamlandı",value: doneToday,                                 color: "#15803d", bg: "#f0fdf4" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "12px", padding: "16px 18px", borderTop: `3px solid ${s.color}` }}>
            <p style={{ fontSize: "26px", fontWeight: 900, color: s.color, margin: "0 0 2px", lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <select value={filterAssign} onChange={(e) => setFA(e.target.value)}
          style={{ padding: "7px 12px", border: "1.5px solid #e5e7ef", borderRadius: "8px", fontSize: "12px", color: filterAssign ? "#0052ff" : "#64748b", background: "#fff", cursor: "pointer", outline: "none" }}>
          <option value="">Tüm Personel</option>
          {STAFF_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPri} onChange={(e) => setFP(e.target.value)}
          style={{ padding: "7px 12px", border: "1.5px solid #e5e7ef", borderRadius: "8px", fontSize: "12px", color: filterPri ? "#0052ff" : "#64748b", background: "#fff", cursor: "pointer", outline: "none" }}>
          <option value="">Tüm Öncelikler</option>
          {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        {(filterAssign || filterPri) && (
          <button onClick={() => { setFA(""); setFP(""); }}
            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "7px 12px", border: "1.5px solid #fca5a5", borderRadius: "8px", fontSize: "12px", color: "#dc2626", background: "#fef2f2", cursor: "pointer" }}>
            <X size={12} /> Temizle
          </button>
        )}
        <div style={{ marginLeft: "auto", fontSize: "12px", color: "#9ca3af" }}>
          {filtered.length} / {tasks.length} görev
        </div>
      </div>

      {/* ── Kanban Board ───────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}>Yükleniyor...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", alignItems: "start" }}>
          {COLUMNS.map((col) => {
            const colTasks = byCol(col.id);
            return (
              <div key={col.id} style={{ background: col.bg, border: `1.5px solid ${col.border}`, borderRadius: "16px", padding: "16px" }}>
                {/* Column header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.color }} />
                    <span style={{ fontSize: "13px", fontWeight: 800, color: col.color }}>{col.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: col.color, background: col.border, padding: "2px 8px", borderRadius: "10px" }}>
                      {colTasks.length}
                    </span>
                    <button onClick={() => setModal({ status: col.id })}
                      style={{ background: "none", border: `1px dashed ${col.border}`, borderRadius: "6px", cursor: "pointer", color: col.color, padding: "2px 6px", display: "flex", alignItems: "center" }}>
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                {/* Cards */}
                {colTasks.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 16px", color: "#cbd5e1", fontSize: "12px" }}>
                    Görev yok
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard key={task.id} task={task}
                      onEdit={(t) => setModal(t)}
                      onDelete={deleteTask}
                      onMove={moveTask}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────── */}
      {modal !== false && (
        <TaskModal
          task={modal === null ? null : modal}
          companies={companies}
          onSave={saveTask}
          onClose={() => setModal(false)}
        />
      )}
    </div>
  );
}
