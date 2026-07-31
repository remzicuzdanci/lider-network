"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { showToast } from "@/lib/admin-toast";
import { Plus, Pencil, Trash2, Printer, Mail, FileText, Package, Check, ChevronLeft, ChevronRight } from "lucide-react";

interface Company { id: string; name: string; }
interface DItem { name: string; qty: number; serial?: string; unit?: string }
interface Product { id: string; name: string; code: string | null; brand: string | null; unit: string; unit_price: number; currency: string; }
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
  const totalQty = items.reduce((s, it) => s + (it.qty || 0), 0);
  const rows = items.map((it, i) => `
    <tr>
      <td style="padding:10px 14px;font-size:12px;color:#1f2937;border-bottom:1px solid #f1f5f9">
        <span style="display:inline-block;width:20px;height:20px;background:#0052ff;color:#fff;border-radius:50%;font-size:10px;font-weight:800;text-align:center;line-height:20px;margin-right:6px">${i + 1}</span>
        <strong>${esc(it.name)}</strong>
      </td>
      <td style="padding:10px 12px;font-size:12px;text-align:center;color:#0f172a;font-weight:700;border-bottom:1px solid #f1f5f9;white-space:nowrap">${it.qty} ${esc(it.unit || "adet")}</td>
      <td style="padding:10px 14px;font-size:11.5px;color:#64748b;border-bottom:1px solid #f1f5f9;font-family:monospace">${esc(it.serial || "—")}</td>
    </tr>`).join("");

  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Teslim Tutanağı ${esc(n.note_no || "")}</title>
<style>
  @page{ size:A4; margin:0 } *{ box-sizing:border-box } html,body{ margin:0;padding:0 }
  body{ font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#1f2937;font-size:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#fff }
  .band{ background:linear-gradient(135deg,#0038c7 0%,#0052ff 60%,#3b74ff 100%);padding:28px 44px 24px }
  .accent{ height:4px;background:linear-gradient(90deg,#ff5e07,#ff8c42) }
  .content{ padding:28px 44px 0 }
  .section-title{ font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;font-weight:800;margin-bottom:8px }
  .info-card{ background:#f8fafc;border:1px solid #e8edf3;border-radius:10px;padding:14px 18px }
  .info-row{ display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px;border-bottom:1px solid #f1f5f9 }
  .info-row:last-child{ border-bottom:none }
  table.items{ width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(15,23,42,.07) }
  table.items thead th{ background:#0f172a;color:#fff;font-size:10px;font-weight:800;padding:11px 14px;letter-spacing:.5px;text-transform:uppercase }
  table.items tbody tr:nth-child(even){ background:#f8faff }
  .sig-box{ border-top:2px solid #334155;padding-top:10px }
  .footer{ background:#0f172a;color:#94a3b8;padding:16px 44px;font-size:11px }
</style></head><body>

  <!-- HEADER -->
  <div class="band">
    <table style="width:100%;border:0;border-collapse:collapse"><tr>
      <td style="border:0;vertical-align:middle;width:55%">
        <span style="display:inline-block;background:#fff;border-radius:12px;padding:12px 22px;box-shadow:0 4px 16px rgba(0,0,0,.20)">
          <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style="height:56px;width:auto;display:block" />
        </span>
        <div style="color:#bfcfff;font-size:11px;margin-top:10px">Lider Network Teknoloji Danışmanlık Tic. Ltd. Şti.</div>
        <div style="color:#8fa8ff;font-size:10.5px;margin-top:2px">Vergi No: 608 046 2147 &nbsp;·&nbsp; Birlik Mh. 448. Cd. 119/2 Çankaya / ANKARA</div>
      </td>
      <td style="border:0;vertical-align:middle;text-align:right">
        <div style="color:#fff;font-size:28px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase">TESLİM TUTANAĞI</div>
        <div style="margin-top:10px">
          <span style="display:inline-block;background:rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.3);color:#fff;border-radius:8px;padding:6px 18px;font-size:13px;font-weight:800;letter-spacing:.5px">${esc(n.note_no || "TASLAK")}</span>
        </div>
        <div style="color:#bfcfff;font-size:11px;margin-top:8px">Teslim Tarihi: <strong style="color:#fff">${dt(n.delivery_date)}</strong></div>
      </td>
    </tr></table>
  </div>
  <div class="accent"></div>

  <div class="content">

    <!-- BİLGİ KARTLARI -->
    <table style="width:100%;border:0;border-collapse:separate;border-spacing:14px 0;margin:0 -14px;margin-bottom:4px"><tr>

      <!-- Teslim Edilen -->
      <td style="border:0;vertical-align:top;width:50%">
        <div class="section-title">Teslim Edilen Firma / Kişi</div>
        <div class="info-card" style="border-left:3px solid #0052ff">
          <div style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:6px">${esc(n.customer_name || "—")}</div>
          ${n.customer_address ? `<div style="font-size:11px;color:#64748b;line-height:1.6;margin-bottom:4px">${esc(n.customer_address)}</div>` : ""}
          ${n.customer_phone ? `<div style="font-size:11.5px;color:#475569">📞 ${esc(n.customer_phone)}</div>` : ""}
          ${n.customer_email ? `<div style="font-size:11.5px;color:#475569">✉ ${esc(n.customer_email)}</div>` : ""}
        </div>
      </td>

      <!-- Teslimat Detayları -->
      <td style="border:0;vertical-align:top;width:50%">
        <div class="section-title">Teslimat Detayları</div>
        <div class="info-card">
          <div class="info-row"><span style="color:#64748b">Tutanak No</span><strong style="color:#0052ff">${esc(n.note_no || "—")}</strong></div>
          <div class="info-row"><span style="color:#64748b">Teslim Tarihi</span><strong>${dt(n.delivery_date)}</strong></div>
          <div class="info-row"><span style="color:#64748b">Teslim Eden</span><strong>${esc(n.delivered_by || "Lider Network")}</strong></div>
          ${n.received_by ? `<div class="info-row"><span style="color:#64748b">Teslim Alan</span><strong>${esc(n.received_by)}</strong></div>` : ""}
          <div class="info-row"><span style="color:#64748b">Toplam Kalem</span><strong style="color:#0052ff">${items.length} kalem / ${totalQty} adet</strong></div>
        </div>
      </td>

    </tr></table>

    <!-- ÜRÜN TABLOSU -->
    <div class="section-title" style="margin-top:22px">Teslim Edilen Ürünler</div>
    <p style="font-size:11.5px;color:#64748b;margin:0 0 10px;font-style:italic">Aşağıda belirtilen ürünler eksiksiz ve sağlam olarak teslim edilmiştir.</p>
    <table class="items">
      <thead><tr>
        <th style="text-align:left;width:50%">Ürün / Açıklama</th>
        <th style="text-align:center;width:18%">Miktar</th>
        <th style="text-align:left;width:32%">Seri No</th>
      </tr></thead>
      <tbody>
        ${rows || `<tr><td colspan="3" style="padding:20px;text-align:center;color:#94a3b8">Ürün eklenmedi</td></tr>`}
        <tr style="background:#f0f4ff">
          <td style="padding:10px 14px;font-size:12px;font-weight:800;color:#0f172a" colspan="1">TOPLAM</td>
          <td style="padding:10px 12px;text-align:center;font-size:13px;font-weight:900;color:#0052ff">${totalQty} adet</td>
          <td style="padding:10px 14px;font-size:11.5px;color:#94a3b8">${items.length} farklı kalem</td>
        </tr>
      </tbody>
    </table>

    ${n.notes ? `
    <div style="margin-top:16px;padding:13px 16px;background:#fffbeb;border:1px solid #fde68a;border-left:3px solid #f59e0b;border-radius:9px">
      <div style="font-size:10px;font-weight:800;color:#92400e;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Notlar</div>
      <div style="font-size:12px;color:#78350f;line-height:1.7;white-space:pre-wrap">${esc(n.notes)}</div>
    </div>` : ""}

    <!-- İMZA ALANLARI -->
    <table style="width:100%;border:0;border-collapse:collapse;margin-top:44px"><tr>
      <td style="border:0;width:50%;padding-right:32px;vertical-align:top">
        <div style="height:64px;border-bottom:none"></div>
        <div style="border:1.5px dashed #cbd5e1;border-radius:8px;height:64px;margin-bottom:12px;background:#f8fafc"></div>
        <div class="sig-box">
          <div style="font-weight:800;font-size:12px;color:#0f172a">Teslim Eden</div>
          <div style="font-size:12px;color:#475569;margin-top:2px">${esc(n.delivered_by || "Lider Network")}</div>
          <div style="color:#94a3b8;font-size:10.5px;margin-top:3px">Ad Soyad / Kaşe / İmza</div>
        </div>
      </td>
      <td style="border:0;width:50%;padding-left:32px;vertical-align:top">
        <div style="height:64px;border-bottom:none"></div>
        <div style="border:1.5px dashed #cbd5e1;border-radius:8px;height:64px;margin-bottom:12px;background:#f8fafc"></div>
        <div class="sig-box">
          <div style="font-weight:800;font-size:12px;color:#0f172a">Teslim Alan</div>
          <div style="font-size:12px;color:#475569;margin-top:2px">${esc(n.received_by || n.customer_name || "—")}</div>
          <div style="color:#94a3b8;font-size:10.5px;margin-top:3px">Ad Soyad / Kaşe / İmza / Tarih</div>
        </div>
      </td>
    </tr></table>

  </div>

  <!-- FOOTER -->
  <div class="footer" style="margin-top:36px">
    <table style="width:100%;border:0;border-collapse:collapse"><tr>
      <td style="border:0;vertical-align:middle">
        <strong style="color:#fff;font-size:12px;letter-spacing:.5px">LİDER NETWORK</strong>
        <div style="margin-top:3px;font-size:10.5px">Lider Network Teknoloji Danışmanlık Tic. Ltd. Şti.</div>
      </td>
      <td style="border:0;vertical-align:middle;text-align:right;font-size:10.5px">
        +90 312 232 02 88 &nbsp;·&nbsp; info@lidernetwork.com.tr &nbsp;·&nbsp; www.lidernetwork.com.tr
      </td>
    </tr></table>
  </div>

  <script>window.onload=function(){setTimeout(function(){window.print()},350)}<\/script>
</body></html>`;
}

const PAGE_SIZE = 20;

export default function TeslimTutanagi({ companies, currentUserName, staff = [], isMobile, initialNote, onInitialNoteConsumed }: {
  companies: Company[]; currentUserName: string; staff?: string[]; isMobile: boolean;
  initialNote?: Partial<DeliveryNote>;
  onInitialNoteConsumed?: () => void;
}) {
  const [list, setList]   = useState<DeliveryNote[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [modal, setModal]   = useState<Partial<DeliveryNote> | null>(null);
  const [saving, setSaving] = useState(false);
  // Mail gönderme
  const [mailModal, setMailModal]   = useState(false);
  const [mailTo, setMailTo]         = useState("");
  const [mailSending, setMailSending] = useState(false);
  // Cari kart detayları
  const [cariMap, setCariMap] = useState<Record<string, { name: string; address: string | null; email: string | null; phone: string | null }>>({});
  // Ürün kataloğu autocomplete
  const [prodSuggest, setProdSuggest] = useState<{ row: number; results: Product[] } | null>(null);
  const prodTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (pg = page, q = search) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(pg), limit: String(PAGE_SIZE) });
      if (q.trim()) p.set("q", q.trim());
      const r = await fetch(`/api/admin/delivery-notes?${p}`);
      const d = await r.json();
      setList(d.notes || []);
      setTotal(d.total ?? 0);
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  // initialNote prop'u gelince modal'ı aç (Tekliflerden otomatik doldurma)
  useEffect(() => {
    if (initialNote) {
      setModal({ ...initialNote, delivered_by: currentUserName, delivery_date: new Date().toISOString().slice(0, 10), status: "draft" });
      onInitialNoteConsumed?.();
    }
  }, [initialNote, currentUserName, onInitialNoteConsumed]);

  // Tam firma verisini (adres dahil) çek
  useEffect(() => {
    fetch("/api/admin/companies").then(r => r.json()).then(d => {
      const m: Record<string, { name: string; address: string | null; email: string | null; phone: string | null }> = {};
      for (const c of (d.companies || [])) {
        m[c.id] = { name: c.name, address: c.address || null, email: c.contact_email || null, phone: c.phone || null };
      }
      setCariMap(m);
    }).catch(() => {});
  }, []);

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, val), 300);
  }

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
    if (!modal.customer_name) { showToast("Teslim edilen (müşteri) adı gerekli", "warning"); return null; }
    if (items.length === 0) { showToast("En az bir ürün ekleyin", "warning"); return null; }
    setSaving(true);
    try {
      const method = modal.id ? "PATCH" : "POST";
      const r = await fetch("/api/admin/delivery-notes", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...modal, items }) });
      const d = await r.json();
      if (!r.ok) { showToast("Hata: " + (d.error || "kaydedilemedi"), "error"); return null; }
      showToast(modal.id ? "Tutanak güncellendi" : "Tutanak kaydedildi");
      await load();
      const saved = d.note as DeliveryNote;
      setModal(saved);
      return saved;
    } finally { setSaving(false); }
  }

  function printDoc(n: Partial<DeliveryNote>) {
    const w = window.open("", "_blank");
    if (!w) { showToast("Pop-up engellendi — tarayıcı izinlerini kontrol edin", "warning"); return; }
    w.document.write(docHtml(n)); w.document.close();
  }
  async function printCurrent() {
    let cur = modal;
    if (!cur?.id) { const s = await save(); if (!s) return; cur = s; }
    printDoc(cur!);
  }
  async function openMailModal() {
    let cur = modal;
    if (!cur?.id) { const s = await save(); if (!s) return; cur = s; }
    setMailTo(cur?.customer_email || "");
    setMailModal(true);
  }
  async function doSendMail() {
    if (!modal?.id) return;
    if (!mailTo.trim()) { showToast("E-posta adresi girin", "warning"); return; }
    setMailSending(true);
    try {
      const r = await fetch("/api/admin/delivery-notes/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: modal.id, email: mailTo.trim() }) });
      const d = await r.json();
      if (!r.ok) { showToast("Hata: " + (d.error || "gönderilemedi"), "error"); return; }
      showToast("Teslim tutanağı gönderildi → " + mailTo.trim());
      setMailModal(false);
      load(page, search);
      setModal(m => m ? { ...m, status: "sent", sent_to_email: mailTo.trim() } : m);
    } finally { setMailSending(false); }
  }
  async function remove(n: DeliveryNote) {
    if (!confirm(`${n.note_no} numaralı tutanak silinsin mi?`)) return;
    await fetch("/api/admin/delivery-notes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id }) });
    load(page, search);
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
        <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Tutanak no veya müşteri ara..." style={{ ...inpS, flex: 1, minWidth: "180px", maxWidth: "340px" }} />
        <button onClick={openNew} style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 18px", background: "#0052ff", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}>
          <Plus size={15} /> Teslim Tutanağı
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#9ca3af", fontSize: "14px" }}>Yükleniyor…</p>
      ) : list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: "14px", border: "1px dashed #e5e7ef" }}>
          <Package size={32} color="#cbd5e1" style={{ marginBottom: 10 }} />
          <p style={{ color: "#9ca3af", fontSize: "15px", margin: "0 0 14px" }}>Henüz teslim tutanağı yok.</p>
          <button onClick={openNew} style={{ padding: "10px 20px", background: "#0052ff", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>İlk Tutanağı Oluştur</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {list.map(n => (
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

      {/* Sayfalama */}
      {total > PAGE_SIZE && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "16px", flexWrap: "wrap" }}>
          <button onClick={() => { setPage(1); load(1, search); }} disabled={page === 1} style={{ padding: "6px 10px", borderRadius: "8px", border: "1.5px solid #e5e7ef", background: "#fff", color: page===1?"#cbd5e1":"#475569", cursor: page===1?"default":"pointer", fontSize: "13px" }}>«</button>
          <button onClick={() => { const p=page-1; setPage(p); load(p, search); }} disabled={page === 1} style={{ display:"inline-flex",alignItems:"center",gap:"4px",padding:"6px 12px",borderRadius:"8px",border:"1.5px solid #e5e7ef",background:"#fff",color:page===1?"#cbd5e1":"#475569",cursor:page===1?"default":"pointer",fontSize:"13px",fontWeight:600 }}><ChevronLeft size={14}/>Önceki</button>
          {Array.from({ length: Math.ceil(total / PAGE_SIZE) }).map((_, i) => {
            const p = i + 1;
            if (Math.abs(p - page) > 2) return null;
            return <button key={p} onClick={() => { setPage(p); load(p, search); }} style={{ width:36,height:36,borderRadius:"8px",border:`1.5px solid ${p===page?"#0052ff":"#e5e7ef"}`,background:p===page?"#0052ff":"#fff",color:p===page?"#fff":"#475569",fontSize:"13px",fontWeight:p===page?700:500,cursor:"pointer" }}>{p}</button>;
          })}
          <button onClick={() => { const p=page+1; setPage(p); load(p, search); }} disabled={page >= Math.ceil(total/PAGE_SIZE)} style={{ display:"inline-flex",alignItems:"center",gap:"4px",padding:"6px 12px",borderRadius:"8px",border:"1.5px solid #e5e7ef",background:"#fff",color:page>=Math.ceil(total/PAGE_SIZE)?"#cbd5e1":"#475569",cursor:page>=Math.ceil(total/PAGE_SIZE)?"default":"pointer",fontSize:"13px",fontWeight:600 }}>Sonraki<ChevronRight size={14}/></button>
          <button onClick={() => { const p=Math.ceil(total/PAGE_SIZE); setPage(p); load(p, search); }} disabled={page>=Math.ceil(total/PAGE_SIZE)} style={{ padding:"6px 10px",borderRadius:"8px",border:"1.5px solid #e5e7ef",background:"#fff",color:page>=Math.ceil(total/PAGE_SIZE)?"#cbd5e1":"#475569",cursor:page>=Math.ceil(total/PAGE_SIZE)?"default":"pointer",fontSize:"13px" }}>»</button>
          <span style={{ fontSize:"12px",color:"#9ca3af",marginLeft:"4px" }}>{total} tutanak</span>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div onClick={() => !saving && setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "26px 14px", zIndex: 1000, overflowY: "auto" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "680px", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: "17px", fontWeight: 800, color: "#1a1d2e" }}>{modal.id ? `Teslim Tutanağı — ${modal.note_no}` : "Yeni Teslim Tutanağı"}</h2>
            <p style={{ margin: "0 0 18px", fontSize: "12.5px", color: "#94a3b8" }}>Teslim edilen ürünleri girin; PDF (imza alanlı) yazdırın veya müşteriye mail atın.</p>

            <div style={{ display: "grid", gap: "18px" }}>

              {/* Müşteri Bilgileri */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#0052ff", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "10px", paddingBottom: "6px", borderBottom: "2px solid #eff3ff" }}>Müşteri Bilgileri</div>
                <div style={{ display: "grid", gap: "10px" }}>
                  <div>
                    <label style={lblS}>Firma *</label>
                    <select style={inpS} value={modal.company_id || ""} onChange={e => {
                      const id = e.target.value;
                      const cari = id ? cariMap[id] : null;
                      const co = companies.find(x => x.id === id);
                      setModal({
                        ...modal,
                        company_id: id || null,
                        customer_name: cari?.name || co?.name || modal.customer_name,
                        customer_address: cari?.address ?? modal.customer_address,
                        customer_email: cari?.email ?? modal.customer_email,
                        customer_phone: cari?.phone ?? modal.customer_phone,
                      });
                    }}>
                      <option value="">— Firma seç (veya elle yaz) —</option>
                      {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={lblS}>Yetkili / Ad Soyad *</label>
                      <input style={inpS} value={modal.customer_name || ""} onChange={e => setModal({ ...modal, customer_name: e.target.value })} placeholder="Teslim edilen kişi veya ünvan" />
                    </div>
                    <div>
                      <label style={lblS}>Telefon</label>
                      <input style={inpS} value={modal.customer_phone || ""} onChange={e => setModal({ ...modal, customer_phone: e.target.value })} placeholder="0(5XX) XXX XX XX" />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={lblS}>Adres</label>
                      <input style={inpS} value={modal.customer_address || ""} onChange={e => setModal({ ...modal, customer_address: e.target.value })} placeholder="Teslim adresi" />
                    </div>
                    <div>
                      <label style={lblS}>E-posta</label>
                      <input style={inpS} value={modal.customer_email || ""} onChange={e => setModal({ ...modal, customer_email: e.target.value })} placeholder="mail@sirket.com" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ürün satırları */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#0052ff", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "10px", paddingBottom: "6px", borderBottom: "2px solid #eff3ff" }}>Teslim Edilen Ürünler</div>
                <div style={{ display: "grid", gap: "8px" }}>
                  {(modal.items || []).map((it, i) => (
                    <div key={i} style={{ background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: "9px", padding: "8px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 90px 130px 36px", gap: "8px", alignItems: "center" }}>
                        {/* Ürün adı — katalog autocomplete */}
                        <div style={{ position: "relative" }}>
                          <input
                            style={inpS}
                            value={it.name}
                            placeholder={`${i + 1}. Ürün adı yaz veya katalogdan seç`}
                            onChange={e => {
                              setItem(i, { name: e.target.value });
                              const q = e.target.value.trim();
                              if (prodTimer.current) clearTimeout(prodTimer.current);
                              if (q.length < 1) { setProdSuggest(null); return; }
                              prodTimer.current = setTimeout(async () => {
                                const r = await fetch(`/api/admin/products?q=${encodeURIComponent(q)}`);
                                const d = await r.json();
                                if ((d.products || []).length > 0) setProdSuggest({ row: i, results: d.products });
                                else setProdSuggest(null);
                              }, 250);
                            }}
                            onBlur={() => setTimeout(() => setProdSuggest(null), 180)}
                          />
                          {/* Öneri listesi */}
                          {prodSuggest?.row === i && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "#fff", border: "1.5px solid #0052ff", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,82,255,.13)", marginTop: "3px", maxHeight: "220px", overflowY: "auto" }}>
                              {prodSuggest.results.map(p => (
                                <div key={p.id}
                                  onMouseDown={() => {
                                    setItem(i, { name: p.name, unit: p.unit || "adet" });
                                    setProdSuggest(null);
                                  }}
                                  style={{ padding: "9px 13px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "1px" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                                >
                                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1d2e" }}>{p.name}</span>
                                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                                    {[p.code, p.brand, p.unit].filter(Boolean).join(" · ")}
                                    {p.unit_price > 0 ? ` · ${p.unit_price.toLocaleString("tr-TR")} ${p.currency}` : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <input type="number" min={0} style={inpS} value={it.qty} onChange={e => setItem(i, { qty: Number(e.target.value) })} placeholder="Adet" />
                        <input style={inpS} value={it.serial || ""} onChange={e => setItem(i, { serial: e.target.value })} placeholder="Seri no" />
                        <button onClick={() => delItem(i)} title="Satırı sil" style={{ width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={addItem} style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "5px", padding: "7px 13px", borderRadius: "8px", border: "1.5px dashed #cbd5e1", background: "#fff", color: "#0052ff", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}><Plus size={14} /> Ürün Ekle</button>
              </div>

              {/* Teslimat Bilgileri */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#0052ff", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "10px", paddingBottom: "6px", borderBottom: "2px solid #eff3ff" }}>Teslimat Bilgileri</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={lblS}>Teslim Tarihi</label>
                    <input type="date" style={inpS} value={modal.delivery_date || ""} onChange={e => setModal({ ...modal, delivery_date: e.target.value })} />
                  </div>
                  <div>
                    <label style={lblS}>Teslim Eden</label>
                    <select style={inpS} value={modal.delivered_by || ""} onChange={e => setModal({ ...modal, delivered_by: e.target.value })}>
                      <option value="">— Seç —</option>
                      {[currentUserName, ...staff.filter(s => s !== currentUserName)].filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lblS}>Teslim Alan</label>
                    <input style={inpS} value={modal.received_by || ""} onChange={e => setModal({ ...modal, received_by: e.target.value })} placeholder="Teslim alan kişi adı" />
                  </div>
                </div>
              </div>

              <div>
                <label style={lblS}>Not / Açıklama</label>
                <textarea style={{ ...inpS, minHeight: "60px", resize: "vertical" }} value={modal.notes || ""} onChange={e => setModal({ ...modal, notes: e.target.value })} placeholder="Varsa ek bilgi veya şartlar..." />
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "22px", justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} disabled={saving} style={{ padding: "10px 16px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "9px", color: "#6b7280", fontSize: "13px", fontWeight: 700, cursor: "pointer", marginRight: "auto" }}>Kapat</button>
              <button onClick={printCurrent} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "9px", color: "#475569", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}><Printer size={15} /> Yazdır / PDF</button>
              <button onClick={openMailModal} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "#fff", border: "1.5px solid #bbf7d0", borderRadius: "9px", color: "#15803d", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}><Mail size={15} /> Mail Gönder</button>
              <button onClick={save} disabled={saving} style={{ padding: "10px 22px", background: "#0052ff", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? .6 : 1 }}>{saving ? "Kaydediliyor…" : "Kaydet"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Mail gönder mini-modal */}
      {mailModal && (
        <div onClick={() => !mailSending && setMailModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "14px", padding: "24px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 800, color: "#1a1d2e" }}>Teslim Tutanağını Gönder</h3>
            <p style={{ margin: "0 0 14px", fontSize: "12.5px", color: "#9ca3af" }}>Tutanak PDF olarak e-posta ile iletilir.</p>
            <label style={lblS}>E-posta adresi</label>
            <input autoFocus value={mailTo} onChange={e => setMailTo(e.target.value)} onKeyDown={e => e.key === "Enter" && doSendMail()} placeholder="ornek@sirket.com" style={inpS} />
            <div style={{ display: "flex", gap: "10px", marginTop: "16px", justifyContent: "flex-end" }}>
              <button onClick={() => setMailModal(false)} disabled={mailSending} style={{ padding: "9px 16px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "9px", color: "#6b7280", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>İptal</button>
              <button onClick={doSendMail} disabled={mailSending} style={{ padding: "9px 20px", background: "#15803d", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: mailSending ? "default" : "pointer", opacity: mailSending ? .6 : 1 }}>{mailSending ? "Gönderiliyor…" : "Gönder"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
