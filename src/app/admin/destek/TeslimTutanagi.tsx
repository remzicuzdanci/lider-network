"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Printer, Mail, FileText, Package, Check } from "lucide-react";

interface Company { id: string; name: string; }
interface DItem { name: string; qty: number; serial?: string; unit?: string }
interface DeliveryNote {
  id: string;
  note_no: string;
  company_id: string | null;
  customer_name: string | null;
  customer_address: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  items: DItem[];
  delivered_by: string | null;
  received_by: string | null;
  delivery_date: string | null;
  notes: string | null;
  status: string;
  sent_to_email: string | null;
  created_at: string;
}

const inpS: React.CSSProperties = {
  padding: "9px 12px", background: "#fff", border: "1.5px solid #e5e7ef",
  borderRadius: "9px", color: "#1a1d2e", fontSize: "13px", outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};
const lblS: React.CSSProperties = { fontSize: "12px", fontWeight: 700, color: "#475569", margin: "0 0 5px", display: "block" };

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s + (s.length === 10 ? "T00:00:00" : "")).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}
function esc(s: string) { return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

// Teslim tutanağı PDF (marka kimlikli, imza alanlı) — yeni pencere + yazdır
function docHtml(n: Partial<DeliveryNote>): string {
  const items = (n.items || []) as DItem[];
  const dt = (s?: string | null) => s ? new Date(s + (s.length === 10 ? "T00:00:00" : "")).toLocaleDateString("tr-TR") : "—";
  const rows = items.map((it, i) => `<tr style="background:${i % 2 ? "#f5f8ff" : "#fff"}">
    <td style="padding:11px 14px;font-size:12.5px;color:#1f2937"><span style="color:#0052ff;font-weight:700">${i + 1}.</span> ${esc(it.name)}</td>
    <td style="padding:11px 12px;font-size:12.5px;text-align:center;color:#475569;white-space:nowrap">${it.qty} ${esc(it.unit || "adet")}</td>
    <td style="padding:11px 14px;font-size:12px;color:#475569">${esc(it.serial || "—")}</td>
  </tr>`).join("");

  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Teslim Tutanağı ${esc(n.note_no || "")}</title>
<style>
  @page{ size:A4; margin:0 } *{ box-sizing:border-box } html,body{ margin:0;padding:0 }
  body{ font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#1f2937;font-size:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact }
  .band{ background:linear-gradient(120deg,#0038c7,#0052ff 55%,#3b74ff);padding:26px 40px }
  .accent{ height:5px;background:#ff5e07 }
  .content{ padding:28px 40px 0 }
  .doctitle{ color:#fff;font-size:25px;font-weight:800;letter-spacing:1px;margin:0 }
  .card{ background:#f8fafc;border:1px solid #e8edf3;border-radius:11px;padding:14px 16px }
  table.items{ width:100%;border-collapse:collapse;margin-top:10px;border-radius:9px;overflow:hidden;box-shadow:0 1px 4px rgba(15,23,42,.06) }
  table.items thead th{ background:#0f172a;color:#fff;font-size:10.5px;font-weight:700;padding:12px;letter-spacing:.4px }
  .footer{ background:#0f172a;color:#cbd5e1;padding:18px 40px;margin-top:40px;font-size:11px;text-align:center }
</style></head><body>
  <div class="band">
    <table style="width:100%;border:0;border-collapse:collapse"><tr>
      <td style="border:0;vertical-align:middle">
        <span style="display:inline-block;background:#fff;border-radius:14px;padding:14px 24px;box-shadow:0 6px 18px rgba(0,0,0,.22)">
          <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style="height:78px;width:auto;display:block" />
        </span>
        <div style="color:#eaf0ff;font-size:12.5px;margin-top:13px;font-weight:700">Lider Network Teknoloji Danışmanlık Tic. Ltd. Şti.</div>
      </td>
      <td style="border:0;vertical-align:middle;text-align:right">
        <div class="doctitle">TESLİM TUTANAĞI</div>
        <div style="display:inline-block;background:rgba(255,255,255,.18);color:#fff;border-radius:20px;padding:6px 16px;font-size:12px;font-weight:700;margin-top:12px">${esc(n.note_no || "TASLAK")}</div>
      </td>
    </tr></table>
  </div>
  <div class="accent"></div>
  <div class="content">
    <table style="width:100%;border:0;border-collapse:separate;border-spacing:0"><tr>
      <td style="border:0;vertical-align:top;width:60%;padding-right:14px">
        <div class="card" style="border-left:4px solid #0052ff">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:#94a3b8;font-weight:800;margin-bottom:6px">Teslim Edilen</div>
          <div style="font-weight:800;font-size:14px;color:#0f172a">${esc(n.customer_name || "—")}</div>
          ${n.customer_address ? `<div style="font-size:11px;color:#4b5563;margin-top:3px">${esc(n.customer_address)}</div>` : ""}
          ${n.customer_phone ? `<div style="font-size:11px;color:#4b5563;margin-top:2px">Tel: ${esc(n.customer_phone)}</div>` : ""}
        </div>
      </td>
      <td style="border:0;vertical-align:top;width:40%">
        <div class="card">
          <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px"><span style="color:#64748b">Teslim Tarihi</span><b style="color:#0f172a">${dt(n.delivery_date)}</b></div>
          ${n.delivered_by ? `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px"><span style="color:#64748b">Teslim Eden</span><b style="color:#0f172a">${esc(n.delivered_by)}</b></div>` : ""}
        </div>
      </td>
    </tr></table>

    <p style="color:#0052ff;font-size:12.5px;margin:20px 0 4px;font-weight:500">Aşağıda belirtilen ürünler eksiksiz ve sağlam olarak teslim edilmiştir.</p>
    <table class="items">
      <thead><tr>
        <th style="text-align:left">ÜRÜN / AÇIKLAMA</th>
        <th style="text-align:center">MİKTAR</th>
        <th style="text-align:left">SERİ NO</th>
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="3" style="padding:18px;text-align:center;color:#94a3b8">Ürün eklenmedi</td></tr>`}</tbody>
    </table>

    ${n.notes ? `<div style="margin-top:18px;padding:14px 16px;background:#f8fafc;border:1px solid #e8edf3;border-radius:10px;font-size:12px;color:#475569;line-height:1.6;white-space:pre-wrap">${esc(n.notes)}</div>` : ""}

    <table style="width:100%;border:0;border-collapse:collapse;margin-top:50px"><tr>
      <td style="border:0;width:50%;padding-right:28px;vertical-align:top">
        <div style="height:56px"></div>
        <div style="border-top:1.5px solid #475569;padding-top:8px;font-size:12px;color:#374151">
          <div style="font-weight:800;color:#0f172a">Teslim Eden</div>
          <div style="margin-top:2px">${esc(n.delivered_by || "Lider Network")}</div>
          <div style="color:#94a3b8;font-size:11px;margin-top:3px">Kaşe / İmza</div>
        </div>
      </td>
      <td style="border:0;width:50%;padding-left:28px;vertical-align:top">
        <div style="height:56px"></div>
        <div style="border-top:1.5px solid #475569;padding-top:8px;font-size:12px;color:#374151">
          <div style="font-weight:800;color:#0f172a">Teslim Alan</div>
          <div style="margin-top:2px">${esc(n.received_by || n.customer_name || "—")}</div>
          <div style="color:#94a3b8;font-size:11px;margin-top:3px">Kaşe / İmza / Tarih</div>
        </div>
      </td>
    </tr></table>
  </div>
  <div class="footer">
    <strong style="color:#fff;letter-spacing:1px">LİDER NETWORK</strong> &nbsp;·&nbsp; +90 312 232 02 88 &nbsp;·&nbsp; info@lidernetwork.com.tr &nbsp;·&nbsp; www.lidernetwork.com.tr
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print()},350)}<\/script>
</body></html>`;
}

export default function TeslimTutanagi({ companies, currentUserName, staff = [], isMobile }: {
  companies: Company[]; currentUserName: string; staff?: string[]; isMobile: boolean;
}) {
  const [list, setList] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<Partial<DeliveryNote> | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/delivery-notes");
      const d = await r.json();
      setList(d.notes || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = list.filter(n => !search.trim() || `${n.note_no} ${n.customer_name || ""}`.toLowerCase().includes(search.toLowerCase()));

  function openNew() {
    setModal({
      items: [{ name: "", qty: 1, unit: "adet", serial: "" }],
      delivered_by: currentUserName, delivery_date: new Date().toISOString().slice(0, 10), status: "draft",
    });
  }

  function setItem(i: number, patch: Partial<DItem>) {
    setModal(m => { if (!m) return m; const items = [...(m.items || [])]; items[i] = { ...items[i], ...patch }; return { ...m, items }; });
  }
  function addItem() { setModal(m => m ? ({ ...m, items: [...(m.items || []), { name: "", qty: 1, unit: "adet", serial: "" }] }) : m); }
  function delItem(i: number) { setModal(m => m ? ({ ...m, items: (m.items || []).filter((_, x) => x !== i) }) : m); }

  async function save(): Promise<DeliveryNote | null> {
    if (!modal) return null;
    const items = (modal.items || []).filter(it => it.name.trim());
    if (!modal.customer_name) { alert("Teslim edilen (müşteri) adı gerekli."); return null; }
    if (items.length === 0) { alert("En az bir ürün ekleyin."); return null; }
    setSaving(true);
    try {
      const method = modal.id ? "PATCH" : "POST";
      const r = await fetch("/api/admin/delivery-notes", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...modal, items }) });
      const d = await r.json();
      if (!r.ok) { alert("Hata: " + (d.error || "kaydedilemedi")); return null; }
      await load();
      const saved = d.note as DeliveryNote;
      setModal(saved); // id ile güncelle (yazdır/mail aktif olsun)
      return saved;
    } finally { setSaving(false); }
  }

  function printDoc(n: Partial<DeliveryNote>) {
    const w = window.open("", "_blank");
    if (!w) { alert("Açılır pencere engellendi. Pop-up iznini verin."); return; }
    w.document.write(docHtml(n)); w.document.close();
  }
  async function printCurrent() {
    let cur = modal;
    if (!cur?.id) { const s = await save(); if (!s) return; cur = s; }
    printDoc(cur!);
  }
  async function sendMail() {
    let cur = modal;
    if (!cur?.id) { const s = await save(); if (!s) return; cur = s; }
    const to = prompt("Tutanağın gönderileceği e-posta:", cur?.customer_email || "");
    if (!to) return;
    const r = await fetch("/api/admin/delivery-notes/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: cur!.id, email: to }) });
    const d = await r.json();
    if (!r.ok) { alert("Hata: " + (d.error || "gönderilemedi")); return; }
    alert("✅ Teslim tutanağı gönderildi → " + to);
    await load();
    setModal(m => m ? { ...m, status: "sent", sent_to_email: to } : m);
  }
  async function remove(n: DeliveryNote) {
    if (!confirm(`${n.note_no} numaralı tutanak silinsin mi?`)) return;
    await fetch("/api/admin/delivery-notes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id }) });
    await load();
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tutanak no veya müşteri ara..." style={{ ...inpS, flex: 1, minWidth: "180px", maxWidth: "340px" }} />
        <button onClick={openNew} style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 18px", background: "#0052ff", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}>
          <Plus size={15} /> Teslim Tutanağı
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#9ca3af", fontSize: "14px" }}>Yükleniyor…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: "14px", border: "1px dashed #e5e7ef" }}>
          <Package size={32} color="#cbd5e1" style={{ marginBottom: 10 }} />
          <p style={{ color: "#9ca3af", fontSize: "15px", margin: "0 0 14px" }}>Henüz teslim tutanağı yok.</p>
          <button onClick={openNew} style={{ padding: "10px 20px", background: "#0052ff", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>İlk Tutanağı Oluştur</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {filtered.map(n => (
            <div key={n.id} style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "12px", padding: "14px 16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <div style={{ display: "inline-flex", padding: "9px", background: "#eff6ff", color: "#0052ff", borderRadius: "10px" }}><FileText size={17} /></div>
              <div style={{ flex: 1, minWidth: "160px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a" }}>{n.note_no}</span>
                  {n.status === "sent"
                    ? <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#15803d", background: "#f0fdf4", padding: "2px 9px", borderRadius: "20px", display: "inline-flex", alignItems: "center", gap: 3 }}><Check size={11} /> Gönderildi</span>
                    : <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#6b7280", background: "#f3f4f6", padding: "2px 9px", borderRadius: "20px" }}>Taslak</span>}
                </div>
                <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#6b7280" }}>{n.customer_name || "—"} · {(n.items || []).length} ürün · {fmtDate(n.delivery_date)}</p>
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button onClick={() => printDoc(n)} title="Yazdır / PDF" style={{ width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #e5e7ef", background: "#fff", color: "#475569", cursor: "pointer" }}><Printer size={14} /></button>
                <button onClick={() => setModal(n)} title="Düzenle" style={{ width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #e5e7ef", background: "#fff", color: "#475569", cursor: "pointer" }}><Pencil size={14} /></button>
                <button onClick={() => remove(n)} title="Sil" style={{ width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div onClick={() => !saving && setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "26px 14px", zIndex: 1000, overflowY: "auto" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "680px", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: "17px", fontWeight: 800, color: "#1a1d2e" }}>{modal.id ? `Teslim Tutanağı — ${modal.note_no}` : "Yeni Teslim Tutanağı"}</h2>
            <p style={{ margin: "0 0 18px", fontSize: "12.5px", color: "#94a3b8" }}>Teslim edilen ürünleri girin; PDF (imza alanlı) yazdırın veya müşteriye mail atın.</p>

            <div style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={lblS}>Firma / Müşteri *</label>
                  <select style={inpS} value={modal.company_id || ""} onChange={e => {
                    const co = companies.find(x => x.id === e.target.value);
                    setModal({ ...modal, company_id: e.target.value || null, customer_name: co?.name || modal.customer_name });
                  }}>
                    <option value="">— Firma seç (veya elle yaz) —</option>
                    {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
                  </select>
                  <input style={{ ...inpS, marginTop: "8px" }} value={modal.customer_name || ""} onChange={e => setModal({ ...modal, customer_name: e.target.value })} placeholder="Teslim edilen ad/ünvan" />
                </div>
                <div>
                  <label style={lblS}>Teslim Tarihi</label>
                  <input type="date" style={inpS} value={modal.delivery_date || ""} onChange={e => setModal({ ...modal, delivery_date: e.target.value })} />
                  <input style={{ ...inpS, marginTop: "8px" }} value={modal.customer_email || ""} onChange={e => setModal({ ...modal, customer_email: e.target.value })} placeholder="Müşteri e-posta (mail için)" />
                </div>
              </div>
              <div>
                <label style={lblS}>Adres</label>
                <input style={inpS} value={modal.customer_address || ""} onChange={e => setModal({ ...modal, customer_address: e.target.value })} placeholder="Teslim adresi" />
              </div>

              {/* Ürün satırları */}
              <div>
                <label style={lblS}>Teslim Edilen Ürünler *</label>
                <div style={{ display: "grid", gap: "8px" }}>
                  {(modal.items || []).map((it, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 90px 110px 36px", gap: "8px", alignItems: "center", background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: "9px", padding: "8px" }}>
                      <input style={inpS} value={it.name} onChange={e => setItem(i, { name: e.target.value })} placeholder={`${i + 1}. Ürün / açıklama`} />
                      <input type="number" min={0} style={inpS} value={it.qty} onChange={e => setItem(i, { qty: Number(e.target.value) })} placeholder="Adet" />
                      <input style={inpS} value={it.serial || ""} onChange={e => setItem(i, { serial: e.target.value })} placeholder="Seri no" />
                      <button onClick={() => delItem(i)} title="Satırı sil" style={{ width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
                <button onClick={addItem} style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "5px", padding: "7px 13px", borderRadius: "8px", border: "1.5px dashed #cbd5e1", background: "#fff", color: "#0052ff", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}><Plus size={14} /> Ürün Ekle</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={lblS}>Teslim Eden</label>
                  <select style={inpS} value={modal.delivered_by || ""} onChange={e => setModal({ ...modal, delivered_by: e.target.value })}>
                    <option value="">— Seç —</option>
                    {[currentUserName, ...staff.filter(s => s !== currentUserName)].filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lblS}>Teslim Alan</label>
                  <input style={inpS} value={modal.received_by || ""} onChange={e => setModal({ ...modal, received_by: e.target.value })} placeholder="Teslim alan kişi" />
                </div>
              </div>
              <div>
                <label style={lblS}>Not</label>
                <textarea style={{ ...inpS, minHeight: "56px", resize: "vertical" }} value={modal.notes || ""} onChange={e => setModal({ ...modal, notes: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "22px", justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} disabled={saving} style={{ padding: "10px 16px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "9px", color: "#6b7280", fontSize: "13px", fontWeight: 700, cursor: "pointer", marginRight: "auto" }}>Kapat</button>
              <button onClick={printCurrent} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "9px", color: "#475569", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}><Printer size={15} /> Yazdır / PDF</button>
              <button onClick={sendMail} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "#fff", border: "1.5px solid #bbf7d0", borderRadius: "9px", color: "#15803d", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}><Mail size={15} /> Mail Gönder</button>
              <button onClick={save} disabled={saving} style={{ padding: "10px 22px", background: "#0052ff", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? .6 : 1 }}>{saving ? "Kaydediliyor…" : "Kaydet"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
