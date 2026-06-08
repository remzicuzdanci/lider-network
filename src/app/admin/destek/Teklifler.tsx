"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, X, Trash2, FileText, Mail, Printer, ArrowLeft, Search, Save } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Company { id: string; name: string; }
interface Product { id: string; name: string; code?: string; unit_price: number; currency: string; kdv_rate: number; unit: string; }
interface Item { product_id?: string | null; description: string; quantity: number; unit_price: number; discount: number; kdv_rate: number; unit: string; }
interface Quote {
  id: string; quote_no: string; company_id?: string; customer_name?: string;
  quote_date?: string; valid_until?: string; currency: string; exchange_rate?: number;
  description?: string; items: Item[]; subtotal: number; discount_total: number;
  net_total: number; kdv_total: number; grand_total: number; status: string;
  created_at: string; companies?: { name: string };
}

const CURRENCIES = ["TL", "USD", "EUR"];
const SYM: Record<string, string> = { TL: "₺", USD: "$", EUR: "€" };
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: "Taslak",     color: "#64748b", bg: "#f1f5f9" },
  sent:     { label: "Gönderildi", color: "#0052ff", bg: "#eff6ff" },
  accepted: { label: "Kabul",      color: "#15803d", bg: "#f0fdf4" },
  rejected: { label: "Red",        color: "#dc2626", bg: "#fef2f2" },
};
const money = (n: number, cur: string) => `${SYM[cur] || cur + " "}${Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const trAscii = (s: string) => (s ?? "").replace(/ş/g,"s").replace(/Ş/g,"S").replace(/ğ/g,"g").replace(/Ğ/g,"G").replace(/ı/g,"i").replace(/İ/g,"I").replace(/ç/g,"c").replace(/Ç/g,"C").replace(/ö/g,"o").replace(/Ö/g,"O").replace(/ü/g,"u").replace(/Ü/g,"U");

const today = () => new Date().toISOString().slice(0, 10);
function emptyItem(): Item { return { description: "", quantity: 1, unit_price: 0, discount: 0, kdv_rate: 20, unit: "Adet" }; }

export default function Teklifler({ companies = [] }: { companies?: Company[]; currentUserName?: string }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit">("list");
  const [editId, setEditId] = useState<string | null>(null);

  // form
  const [companyId, setCompanyId] = useState("");
  const [quoteNo, setQuoteNo] = useState("");
  const [qDate, setQDate] = useState(today());
  const [validUntil, setValidUntil] = useState("");
  const [currency, setCurrency] = useState("TL");
  const [rate, setRate] = useState("");
  const [desc, setDesc] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);

  // ürün arama
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [newProd, setNewProd] = useState(false);

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/quotes");
    if (r.ok) setQuotes((await r.json()).quotes || []);
    setLoading(false);
  }, []);
  useEffect(() => { loadQuotes(); }, [loadQuotes]);

  // ürün arama (debounce basit)
  useEffect(() => {
    if (search.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/admin/products?q=${encodeURIComponent(search.trim())}`);
      if (r.ok) setResults((await r.json()).products || []);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const totals = useMemo(() => {
    let subtotal = 0, discount_total = 0, net_total = 0, kdv_total = 0;
    for (const it of items) {
      const gross = (+it.quantity || 0) * (+it.unit_price || 0);
      const disc = gross * (+it.discount || 0) / 100;
      const net = gross - disc;
      subtotal += gross; discount_total += disc; net_total += net; kdv_total += net * (+it.kdv_rate || 0) / 100;
    }
    return { subtotal, discount_total, net_total, kdv_total, grand_total: net_total + kdv_total };
  }, [items]);

  function resetForm() {
    setCompanyId(""); setQuoteNo(""); setQDate(today()); setValidUntil(""); setCurrency("TL"); setRate(""); setDesc(""); setItems([]); setSearch(""); setResults([]);
  }
  function openNew() { resetForm(); setEditId(null); setView("edit"); }
  function openEdit(q: Quote) {
    setEditId(q.id); setCompanyId(q.company_id || ""); setQuoteNo(q.quote_no || "");
    setQDate(q.quote_date || today()); setValidUntil(q.valid_until || ""); setCurrency(q.currency || "TL");
    setRate(q.exchange_rate ? String(q.exchange_rate) : ""); setDesc(q.description || ""); setItems(q.items || []);
    setSearch(""); setResults([]); setView("edit");
  }

  function addProduct(p: Product) {
    setItems(prev => [...prev, { product_id: p.id, description: p.name, quantity: 1, unit_price: p.unit_price || 0, discount: 0, kdv_rate: p.kdv_rate ?? 20, unit: p.unit || "Adet" }]);
    setSearch(""); setResults([]);
  }
  function addBlank() { setItems(prev => [...prev, emptyItem()]); }
  function setItem(i: number, patch: Partial<Item>) { setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it)); }
  function delItem(i: number) { setItems(prev => prev.filter((_, idx) => idx !== i)); }

  async function save(): Promise<Quote | null> {
    if (!companyId) { alert("Müşteri seçin"); return null; }
    if (items.length === 0) { alert("En az bir kalem ekleyin"); return null; }
    setSaving(true);
    const body = {
      id: editId || undefined,
      company_id: companyId,
      customer_name: companies.find(c => c.id === companyId)?.name || null,
      quote_no: quoteNo || undefined,
      quote_date: qDate, valid_until: validUntil || null,
      currency, exchange_rate: rate ? Number(rate) : 1, description: desc, items,
    };
    try {
      const r = await fetch("/api/admin/quotes", { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error((await r.json()).error || "Kaydedilemedi");
      const saved: Quote = await r.json();
      setEditId(saved.id); setQuoteNo(saved.quote_no);
      await loadQuotes();
      return saved;
    } catch (e) { alert(e instanceof Error ? e.message : "Hata"); return null; }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm("Bu teklifi silmek istiyor musunuz?")) return;
    await fetch("/api/admin/quotes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setQuotes(p => p.filter(q => q.id !== id));
  }

  function buildPdf(q: { quote_no: string; companyName: string; quote_date?: string; valid_until?: string; currency: string; description?: string; items: Item[]; t: typeof totals }) {
    const doc = new jsPDF();
    const cur = q.currency;
    const m = (n: number) => `${trAscii(SYM[cur] || cur)} ${Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;
    doc.setFontSize(18); doc.setTextColor(0, 82, 255); doc.text("LIDER NETWORK", 14, 18);
    doc.setFontSize(13); doc.setTextColor(30); doc.text("FIYAT TEKLIFI", 14, 27);
    doc.setFontSize(10); doc.setTextColor(90);
    doc.text(`Teklif No: ${q.quote_no}`, 14, 35);
    doc.text(`Musteri: ${trAscii(q.companyName)}`, 14, 41);
    doc.text(`Tarih: ${q.quote_date ? new Date(q.quote_date).toLocaleDateString("tr-TR") : "-"}   Gecerlilik: ${q.valid_until ? new Date(q.valid_until).toLocaleDateString("tr-TR") : "-"}`, 14, 47);

    autoTable(doc, {
      startY: 53,
      head: [["#", "Aciklama", "Miktar", "Fiyat", "Isk.%", "Net"]],
      body: q.items.map((it, i) => {
        const gross = it.quantity * it.unit_price; const net = gross - gross * it.discount / 100;
        return [String(i + 1), trAscii(it.description), `${it.quantity} ${trAscii(it.unit || "")}`, m(it.unit_price), `%${it.discount || 0}`, m(net)];
      }),
      headStyles: { fillColor: [0, 82, 255] }, styles: { fontSize: 9 },
      columnStyles: { 1: { cellWidth: 78 } },
    });
    const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    const rows: [string, string][] = [
      ["Brut Toplam", m(q.t.subtotal)], ["Indirim", "- " + m(q.t.discount_total)],
      ["Net Toplam", m(q.t.net_total)], ["KDV", m(q.t.kdv_total)], ["GENEL TOPLAM", m(q.t.grand_total)],
    ];
    doc.setFontSize(10);
    rows.forEach((r, i) => {
      const yy = y + i * 7; const bold = i === rows.length - 1;
      doc.setTextColor(bold ? 0 : 90, bold ? 82 : 90, bold ? 255 : 90);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.text(r[0], 130, yy); doc.text(r[1], 196, yy, { align: "right" });
    });
    if (q.description) { doc.setFont("helvetica", "normal"); doc.setTextColor(80); doc.setFontSize(9); doc.text(trAscii(q.description).slice(0, 400), 14, y + 4, { maxWidth: 100 }); }
    return doc;
  }

  function currentPdfData() {
    return { quote_no: quoteNo || "TASLAK", companyName: companies.find(c => c.id === companyId)?.name || "-", quote_date: qDate, valid_until: validUntil, currency, description: desc, items, t: totals };
  }
  async function exportPDF() {
    let no = quoteNo;
    if (!editId) { const s = await save(); if (!s) return; no = s.quote_no; }
    const doc = buildPdf({ ...currentPdfData(), quote_no: no });
    doc.save(`Teklif-${no}.pdf`);
  }
  async function sendEmail() {
    const saved = editId ? { id: editId } : await save();
    if (!saved) return;
    const to = prompt("Teklifin gönderileceği e-posta adresi:");
    if (!to) return;
    const r = await fetch("/api/admin/quotes/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ("id" in saved ? saved.id : editId), email: to }) });
    if (r.ok) { alert("Teklif e-postası gönderildi ✓"); await loadQuotes(); }
    else alert("Gönderilemedi: " + ((await r.json().catch(() => ({}))).error || "hata"));
  }
  function printQuote() {
    const d = currentPdfData();
    const w = window.open("", "_blank"); if (!w) return;
    const rowsHtml = d.items.map((it, i) => {
      const gross = it.quantity * it.unit_price; const net = gross - gross * it.discount / 100;
      return `<tr><td>${i + 1}. ${it.description}</td><td style="text-align:center">${it.quantity} ${it.unit || ""}</td><td style="text-align:right">${money(it.unit_price, currency)}</td><td style="text-align:center">%${it.discount || 0}</td><td style="text-align:right"><b>${money(net, currency)}</b></td></tr>`;
    }).join("");
    w.document.write(`<html><head><title>Teklif ${d.quote_no}</title><style>body{font-family:Arial;padding:30px;color:#1a1d2e}h1{color:#0052ff;margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px 10px;border-bottom:1px solid #e5e7ef;font-size:13px}th{background:#f8fafc;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b}.tot{margin-top:16px;float:right;min-width:280px}.tot div{display:flex;justify-content:space-between;padding:4px 0}.gt{border-top:2px solid #0052ff;color:#0052ff;font-weight:800;font-size:16px;padding-top:8px}</style></head><body>
      <h1>LİDER NETWORK</h1><p style="color:#64748b;margin:4px 0 0">Fiyat Teklifi · ${d.quote_no}</p>
      <p style="margin:14px 0 0"><b>Müşteri:</b> ${d.companyName}<br><b>Tarih:</b> ${d.quote_date ? new Date(d.quote_date).toLocaleDateString("tr-TR") : "-"} &nbsp; <b>Geçerlilik:</b> ${d.valid_until ? new Date(d.valid_until).toLocaleDateString("tr-TR") : "-"}</p>
      <table><thead><tr><th>Açıklama</th><th style="text-align:center">Miktar</th><th style="text-align:right">Fiyat</th><th style="text-align:center">İsk.</th><th style="text-align:right">Net</th></tr></thead><tbody>${rowsHtml}</tbody></table>
      <div class="tot"><div><span>Brüt Toplam</span><span>${money(d.t.subtotal, currency)}</span></div><div><span>İndirim</span><span>- ${money(d.t.discount_total, currency)}</span></div><div><span>Net Toplam</span><span>${money(d.t.net_total, currency)}</span></div><div><span>KDV</span><span>${money(d.t.kdv_total, currency)}</span></div><div class="gt"><span>GENEL TOPLAM</span><span>${money(d.t.grand_total, currency)}</span></div></div>
      ${d.description ? `<div style="clear:both;margin-top:30px;padding:14px;background:#f8fafc;border-radius:8px;font-size:13px;color:#475569;white-space:pre-wrap">${d.description}</div>` : ""}
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  }

  const inp = { padding: "9px 12px", border: "1.5px solid #e5e7ef", borderRadius: "8px", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" as const, background: "#fff" };
  const lbl = { fontSize: "11px", fontWeight: 700 as const, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: ".5px", display: "block", marginBottom: "5px" };

  /* ── LİSTE ── */
  if (view === "list") {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: "0 0 3px", fontSize: "20px", fontWeight: 800, color: "#1a1d2e" }}>📄 Teklifler</h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Fiyat teklifleri oluştur, PDF indir, e-posta gönder</p>
          </div>
          <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 18px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#0038c7,#0052ff)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,82,255,.25)" }}>
            <Plus size={16} /> Yeni Teklif
          </button>
        </div>

        {loading ? <p style={{ color: "#94a3b8" }}>Yükleniyor…</p> : quotes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <FileText size={40} color="#cbd5e1" style={{ marginBottom: "12px" }} />
            <p style={{ fontSize: "14px", margin: 0 }}>Henüz teklif yok. "Yeni Teklif" ile başlayın.</p>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "13px", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
                <thead><tr style={{ background: "#f8fafc" }}>
                  {["Teklif No", "Müşteri", "Tarih", "Tutar", "Durum", ""].map((h, i) => (
                    <th key={i} style={{ padding: "12px 14px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", textAlign: i === 3 ? "right" : "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {quotes.map(q => {
                    const st = STATUS[q.status] || STATUS.draft;
                    return (
                      <tr key={q.id} onClick={() => openEdit(q)} style={{ borderTop: "1px solid #f0f2f8", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 800, color: "#0052ff", whiteSpace: "nowrap" }}>{q.quote_no}</td>
                        <td style={{ padding: "12px 14px", fontSize: "13px", color: "#1a1d2e", fontWeight: 600 }}>{q.companies?.name || q.customer_name || "—"}</td>
                        <td style={{ padding: "12px 14px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>{q.quote_date ? new Date(q.quote_date).toLocaleDateString("tr-TR") : "—"}</td>
                        <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 800, color: "#1a1d2e", textAlign: "right", whiteSpace: "nowrap" }}>{money(q.grand_total, q.currency)}</td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}><span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px", background: st.bg, color: st.color }}>{st.label}</span></td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap", textAlign: "right" }}>
                          <button onClick={e => { e.stopPropagation(); del(q.id); }} title="Sil" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "7px", padding: "5px 7px", cursor: "pointer" }}><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── EDİTÖR ── */
  return (
    <div>
      {/* Üst aksiyon barı */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "18px", alignItems: "center" }}>
        <button onClick={() => { setView("list"); resetForm(); }} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 14px", borderRadius: "9px", border: "1.5px solid #e5e7ef", background: "#fff", color: "#475569", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}><ArrowLeft size={15} /> Geri</button>
        <div style={{ flex: 1 }} />
        <button onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "9px", border: "none", background: saving ? "#9ca3af" : "linear-gradient(135deg,#15803d,#22c55e)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}><Save size={15} /> {saving ? "Kaydediliyor…" : "Teklifi Kaydet"}</button>
        <button onClick={exportPDF} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "9px", border: "none", background: "#b91c1c", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}><FileText size={15} /> PDF</button>
        <button onClick={printQuote} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "9px", border: "1.5px solid #e5e7ef", background: "#fff", color: "#475569", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}><Printer size={15} /> Yazdır</button>
        <button onClick={sendEmail} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg,#0038c7,#0052ff)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}><Mail size={15} /> Gönder</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,340px) 1fr", gap: "18px", alignItems: "start" }}>
        {/* Sol: teklif bilgileri */}
        <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "13px", padding: "18px" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 800, color: "#1a1d2e" }}>Teklif Bilgileri</h3>
          <div style={{ marginBottom: "12px" }}><label style={lbl}>Müşteri *</label>
            <select value={companyId} onChange={e => setCompanyId(e.target.value)} style={inp}>
              <option value="">— Seçin —</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: "12px" }}><label style={lbl}>Teklif No</label>
            <input value={quoteNo} onChange={e => setQuoteNo(e.target.value)} placeholder="Otomatik (boş bırak)" style={inp} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <div><label style={lbl}>Teklif Tarihi</label><input type="date" value={qDate} onChange={e => setQDate(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Geçerlilik</label><input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={inp} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <div><label style={lbl}>Para Birimi</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={inp}>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            </div>
            <div><label style={lbl}>Döviz Kuru</label><input type="number" step="0.0001" value={rate} onChange={e => setRate(e.target.value)} placeholder={currency === "TL" ? "—" : "ör. 45,97"} style={inp} disabled={currency === "TL"} /></div>
          </div>
          <div><label style={lbl}>Açıklama</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} placeholder="Teklif notu, şartlar…" style={{ ...inp, resize: "vertical", lineHeight: 1.5 }} />
          </div>
        </div>

        {/* Sağ: ürün / hizmetler */}
        <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "13px", padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", gap: "8px", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#1a1d2e" }}>Ürün / Hizmetler</h3>
            <button onClick={() => setNewProd(true)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", borderRadius: "8px", border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#0052ff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}><Plus size={13} /> Yeni Ürün</button>
          </div>

          {/* Ürün arama */}
          <div style={{ position: "relative", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1.5px solid #e5e7ef", borderRadius: "9px", padding: "0 12px", background: "#f8fafc" }}>
              <Search size={15} color="#9ca3af" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ürün adından arayın (en az 2 harf)…" style={{ flex: 1, border: "none", background: "transparent", padding: "10px 0", fontSize: "13px", outline: "none" }} />
              <button onClick={addBlank} title="Boş kalem ekle" style={{ background: "none", border: "none", color: "#0052ff", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ Boş</button>
            </div>
            {results.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 30, background: "#fff", border: "1px solid #e5e7ef", borderRadius: "9px", marginTop: "4px", boxShadow: "0 8px 24px rgba(0,0,0,.12)", maxHeight: "240px", overflowY: "auto" }}>
                {results.map(p => (
                  <div key={p.id} onClick={() => addProduct(p)} style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", gap: "10px" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                    <span style={{ fontSize: "13px", color: "#1a1d2e", fontWeight: 600 }}>{p.name}{p.code ? <span style={{ color: "#9ca3af", fontWeight: 400 }}> · {p.code}</span> : null}</span>
                    <span style={{ fontSize: "12px", color: "#0052ff", fontWeight: 700, whiteSpace: "nowrap" }}>{money(p.unit_price, p.currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kalemler */}
          {items.length === 0 ? (
            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", padding: "26px 0" }}>Henüz kalem yok. Ürün arayın veya "+ Boş" ile satır ekleyin.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
                <thead><tr>
                  {["Açıklama", "Miktar", "Fiyat", "İsk.%", "KDV%", "Net", ""].map((h, i) => (
                    <th key={i} style={{ padding: "7px 6px", fontSize: "10.5px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: i >= 1 && i <= 5 ? "right" : "left" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {items.map((it, i) => {
                    const gross = (+it.quantity || 0) * (+it.unit_price || 0); const net = gross - gross * (+it.discount || 0) / 100;
                    const cell = { width: "100%", border: "1px solid #e5e7ef", borderRadius: "6px", padding: "6px 7px", fontSize: "12px", textAlign: "right" as const, boxSizing: "border-box" as const, outline: "none" };
                    return (
                      <tr key={i}>
                        <td style={{ padding: "4px 5px" }}><input value={it.description} onChange={e => setItem(i, { description: e.target.value })} placeholder="Açıklama" style={{ ...cell, textAlign: "left" }} /></td>
                        <td style={{ padding: "4px 5px", width: "70px" }}><input type="number" step="any" value={it.quantity} onChange={e => setItem(i, { quantity: +e.target.value })} style={cell} /></td>
                        <td style={{ padding: "4px 5px", width: "90px" }}><input type="number" step="any" value={it.unit_price} onChange={e => setItem(i, { unit_price: +e.target.value })} style={cell} /></td>
                        <td style={{ padding: "4px 5px", width: "62px" }}><input type="number" step="any" value={it.discount} onChange={e => setItem(i, { discount: +e.target.value })} style={cell} /></td>
                        <td style={{ padding: "4px 5px", width: "62px" }}><input type="number" step="any" value={it.kdv_rate} onChange={e => setItem(i, { kdv_rate: +e.target.value })} style={cell} /></td>
                        <td style={{ padding: "4px 5px", fontSize: "12px", fontWeight: 700, color: "#1a1d2e", textAlign: "right", whiteSpace: "nowrap" }}>{money(net, currency)}</td>
                        <td style={{ padding: "4px 5px" }}><button onClick={() => delItem(i)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}><Trash2 size={14} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Toplamlar */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <div style={{ minWidth: "260px" }}>
              {[["Brüt Toplam", totals.subtotal, "#64748b"], ["İndirim", totals.discount_total, "#dc2626"], ["Net Toplam", totals.net_total, "#64748b"], ["KDV", totals.kdv_total, "#64748b"]].map(([l, v, c], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: "13px", color: c as string }}>
                  <span>{l as string}</span><span style={{ fontWeight: 600 }}>{i === 1 ? "- " : ""}{money(v as number, currency)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", marginTop: "6px", borderTop: "2px solid #eef2f7", fontSize: "16px", fontWeight: 900, color: "#0052ff" }}>
                <span>GENEL TOPLAM</span><span>{money(totals.grand_total, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {newProd && <NewProductModal currency={currency} onClose={() => setNewProd(false)} onSaved={(p) => { addProduct(p); setNewProd(false); }} />}
    </div>
  );
}

/* ── Yeni Ürün Modalı ── */
function NewProductModal({ currency, onClose, onSaved }: { currency: string; onClose: () => void; onSaved: (p: Product) => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [price, setPrice] = useState("");
  const [cur, setCur] = useState(currency);
  const [kdv, setKdv] = useState("20");
  const [unit, setUnit] = useState("Adet");
  const [saving, setSaving] = useState(false);

  const inp = { padding: "9px 12px", border: "1.5px solid #e5e7ef", borderRadius: "8px", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" as const };
  const lbl = { fontSize: "11px", fontWeight: 700 as const, color: "#6b7280", display: "block", marginBottom: "5px" };

  async function save() {
    if (!name.trim()) { alert("Ürün adı gerekli"); return; }
    setSaving(true);
    const r = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, code, unit_price: price ? Number(price) : 0, currency: cur, kdv_rate: kdv ? Number(kdv) : 20, unit }) });
    setSaving(false);
    if (r.ok) onSaved(await r.json());
    else alert("Kaydedilemedi: " + ((await r.json().catch(() => ({}))).error || "hata"));
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "460px", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#1a1d2e" }}>Yeni Ürün Kaydı</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 16px", lineHeight: 1.5 }}>Ürün kataloğa eklenir, sonraki tekliflerde aratıp seçebilirsiniz. Detayları sonra düzenleyebilirsiniz.</p>
        <div style={{ marginBottom: "12px" }}><label style={lbl}>Ürün Adı *</label><input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="ör. Viewsonic 32 Monitör" style={inp} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
          <div><label style={lbl}>Ürün Kodu</label><input value={code} onChange={e => setCode(e.target.value)} placeholder="opsiyonel" style={inp} /></div>
          <div><label style={lbl}>Birim</label><input value={unit} onChange={e => setUnit(e.target.value)} style={inp} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px", gap: "10px" }}>
          <div><label style={lbl}>Birim Fiyatı</label><input type="number" step="any" value={price} onChange={e => setPrice(e.target.value)} placeholder="0,00" style={inp} /></div>
          <div><label style={lbl}>Para Birimi</label><select value={cur} onChange={e => setCur(e.target.value)} style={inp}>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label style={lbl}>KDV %</label><input type="number" value={kdv} onChange={e => setKdv(e.target.value)} style={inp} /></div>
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "18px" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", border: "1.5px solid #e5e7ef", borderRadius: "9px", background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Vazgeç</button>
          <button onClick={save} disabled={saving} style={{ padding: "9px 22px", border: "none", borderRadius: "9px", background: saving ? "#9ca3af" : "linear-gradient(135deg,#0038c7,#0052ff)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Kaydediliyor…" : "Kaydet"}</button>
        </div>
      </div>
    </div>
  );
}
