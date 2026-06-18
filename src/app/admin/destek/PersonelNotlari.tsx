"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Pin, X, StickyNote } from "lucide-react";
import { showToast } from "@/lib/admin-toast";

interface Note {
  id: string;
  title?: string | null;
  content: string;
  color?: string | null;
  pinned?: boolean;
  created_at: string;
  updated_at?: string;
}

const COLORS = ["#fffbeb", "#eff6ff", "#f0fdf4", "#fdf2f8", "#f5f3ff", "#fef2f2"];

export default function PersonelNotlari({ userName = "" }: { userName?: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Note | "new" | null>(null);
  const [draft, setDraft] = useState<{ title: string; content: string; color: string }>({ title: "", content: "", color: "#fffbeb" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/staff-notes");
    if (r.ok) setNotes((await r.json()).notes || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openNew() { setDraft({ title: "", content: "", color: "#fffbeb" }); setEditing("new"); }
  function openEdit(n: Note) { setDraft({ title: n.title || "", content: n.content || "", color: n.color || "#fffbeb" }); setEditing(n); }

  async function save() {
    if (!draft.title.trim() && !draft.content.trim()) { setEditing(null); return; }
    setSaving(true);
    try {
      if (editing === "new") {
        const r = await fetch("/api/admin/staff-notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
        if (!r.ok) throw new Error((await r.json()).error || "Kaydedilemedi");
        const created = await r.json();
        setNotes(p => [created, ...p]);
      } else if (editing) {
        const r = await fetch("/api/admin/staff-notes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...draft }) });
        if (!r.ok) throw new Error((await r.json()).error || "Güncellenemedi");
        const u = await r.json();
        setNotes(p => p.map(n => n.id === u.id ? u : n));
      }
      setEditing(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Hata", "error");
    } finally { setSaving(false); }
  }

  async function togglePin(n: Note) {
    const r = await fetch("/api/admin/staff-notes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id, pinned: !n.pinned }) });
    if (r.ok) { await load(); }
  }

  async function del(id: string) {
    if (!confirm("Bu notu silmek istiyor musunuz?")) return;
    await fetch("/api/admin/staff-notes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNotes(p => p.filter(n => n.id !== id));
  }

  const fmt = (s?: string) => s ? new Date(s).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: "0 0 3px", fontSize: "20px", fontWeight: 800, color: "#1a1d2e", display: "flex", alignItems: "center", gap: "8px" }}>
            <StickyNote size={20} color="#d97706" /> Personel Notları
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            {userName ? `${userName} — ` : ""}Bu notları yalnızca siz görürsünüz. 🔒
          </p>
        </div>
        <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 18px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#0038c7,#0052ff)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,82,255,.25)" }}>
          <Plus size={16} /> Yeni Not
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Yükleniyor…</p>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
          <StickyNote size={40} color="#cbd5e1" style={{ marginBottom: "12px" }} />
          <p style={{ fontSize: "14px", margin: 0 }}>Henüz notunuz yok. "Yeni Not" ile başlayın.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
          {notes.map(n => (
            <div key={n.id} onClick={() => openEdit(n)} style={{ background: n.color || "#fffbeb", border: "1px solid rgba(0,0,0,.07)", borderRadius: "12px", padding: "14px 16px", cursor: "pointer", boxShadow: n.pinned ? "0 4px 14px rgba(217,119,6,.18)" : "0 1px 4px rgba(0,0,0,.05)", position: "relative", minHeight: "110px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px", marginBottom: "6px" }}>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1a1d2e", wordBreak: "break-word", flex: 1 }}>{n.title || "(başlıksız)"}</h4>
                <div style={{ display: "flex", gap: "2px" }}>
                  <button onClick={e => { e.stopPropagation(); togglePin(n); }} title={n.pinned ? "Sabitlemeyi kaldır" : "Sabitle"} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: n.pinned ? "#d97706" : "#9ca3af" }}><Pin size={14} fill={n.pinned ? "#d97706" : "none"} /></button>
                  <button onClick={e => { e.stopPropagation(); del(n.id); }} title="Sil" style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "#9ca3af" }}><Trash2 size={14} /></button>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.55, flex: 1, wordBreak: "break-word" }}>{n.content}</p>
              <p style={{ margin: "10px 0 0", fontSize: "10.5px", color: "#9ca3af" }}>{fmt(n.updated_at || n.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Editör modalı */}
      {editing !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={e => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "460px", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#1a1d2e" }}>{editing === "new" ? "Yeni Not" : "Notu Düzenle"}</h3>
              <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={18} /></button>
            </div>
            <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Başlık (opsiyonel)" style={{ width: "100%", padding: "11px 13px", border: "1.5px solid #e5e7ef", borderRadius: "9px", fontSize: "14px", fontWeight: 600, marginBottom: "10px", outline: "none", boxSizing: "border-box" }} />
            <textarea value={draft.content} onChange={e => setDraft(d => ({ ...d, content: e.target.value }))} placeholder="Notunuz…" rows={6} autoFocus style={{ width: "100%", padding: "11px 13px", border: "1.5px solid #e5e7ef", borderRadius: "9px", fontSize: "14px", resize: "vertical", lineHeight: 1.6, outline: "none", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: "8px", margin: "14px 0" }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setDraft(d => ({ ...d, color: c }))} style={{ width: "28px", height: "28px", borderRadius: "50%", background: c, border: draft.color === c ? "2.5px solid #0052ff" : "1.5px solid #e5e7ef", cursor: "pointer" }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(null)} style={{ padding: "9px 18px", border: "1.5px solid #e5e7ef", borderRadius: "9px", background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>İptal</button>
              <button onClick={save} disabled={saving} style={{ padding: "9px 22px", border: "none", borderRadius: "9px", background: saving ? "#d1d5db" : "linear-gradient(135deg,#0038c7,#0052ff)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Kaydediliyor…" : "Kaydet"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
