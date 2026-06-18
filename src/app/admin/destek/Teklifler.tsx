"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, X, Trash2, FileText, Mail, Printer, ArrowLeft, Search, Save, History, Pencil, Copy, ChevronUp, ChevronDown, PackageCheck } from "lucide-react";
import { showToast } from "@/lib/admin-toast";
import { companyLogo } from "@/data/customer-logos";
import QRCode from "qrcode";

interface Company {
  id: string; name: string;
  contact_name?: string | null; contact_email?: string | null; phone?: string | null;
  address?: string | null; tax_office?: string | null; tax_no?: string | null;
}
interface Product { id: string; name: string; code?: string; unit_price: number; currency: string; kdv_rate: number; unit: string; type?: string; }

const PRODUCT_TYPES: { id: string; label: string }[] = [
  { id: "stoklu", label: "Stoklu Ürün" },
  { id: "stoksuz", label: "Stoksuz Ürün" },
  { id: "hizmet", label: "Hizmet" },
];
interface Item { product_id?: string | null; description: string; quantity: number; unit_price: number; discount: number; kdv_rate: number; unit: string; }
interface Quote {
  id: string; quote_no: string; company_id?: string; customer_name?: string;
  quote_date?: string; valid_until?: string; currency: string; exchange_rate?: number;
  description?: string; items: Item[]; subtotal: number; discount_total: number;
  net_total: number; kdv_total: number; grand_total: number; status: string;
  created_by?: string; created_at: string; companies?: { name: string };
}

const CURRENCIES = ["TL", "USD", "EUR"];
const SYM: Record<string, string> = { TL: "₺", USD: "$", EUR: "€" };
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: "Taslak",     color: "#64748b", bg: "#f1f5f9" },
  sent:     { label: "Gönderildi", color: "#0052ff", bg: "#eff6ff" },
  accepted: { label: "Kabul",      color: "#15803d", bg: "#f0fdf4" },
  rejected: { label: "Red",        color: "#dc2626", bg: "#fef2f2" },
  ordered:  { label: "Siparişe Döndü", color: "#7c3aed", bg: "#f5f3ff" },
};
const money = (n: number, cur: string) => `${SYM[cur] || cur + " "}${Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const today = () => new Date().toISOString().slice(0, 10);
function emptyItem(): Item { return { description: "", quantity: 1, unit_price: 0, discount: 0, kdv_rate: 20, unit: "Adet" }; }

export default function Teklifler({ companies = [], initialCompanyId = "", staff = [], currentUserName = "", onCreateDelivery }: { companies?: Company[]; currentUserName?: string; initialCompanyId?: string; staff?: string[]; onCreateDelivery?: (data: { customer_name: string; company_id: string | null; items: { name: string; qty: number; unit: string }[] }) => void }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [listSearch, setListSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [mainTab, setMainTab] = useState<"quotes" | "products">("quotes");
  const [companyFilter, setCompanyFilter] = useState<string>(initialCompanyId);
  useEffect(() => { setCompanyFilter(initialCompanyId); setPage(1); }, [initialCompanyId]);

  // form
  const [companyId, setCompanyId] = useState("");
  const [quoteNo, setQuoteNo] = useState("");
  const [qDate, setQDate] = useState(today());
  const [validUntil, setValidUntil] = useState("");
  const [currency, setCurrency] = useState("TL");
  const [rate, setRate] = useState("");
  const [desc, setDesc] = useState("");
  const [preparedBy, setPreparedBy] = useState(currentUserName);
  const [status, setStatus] = useState("draft");
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);

  // ürün arama
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [newProd, setNewProd] = useState(false);

  // fiyat geçmişi
  const [histFor, setHistFor] = useState<{ product_id?: string | null; name: string } | null>(null);
  // kopyalama seçimi (aynı/başka müşteri)
  const [copySource, setCopySource] = useState<Quote | null>(null);

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (statusFilter !== "all") p.set("status", statusFilter);
    if (companyFilter)          p.set("company_id", companyFilter);
    if (listSearch.trim())      p.set("q", listSearch.trim());
    const r = await fetch(`/api/admin/quotes?${p}`);
    if (r.ok) { const d = await r.json(); setQuotes(d.quotes || []); setTotal(d.total ?? 0); }
    setLoading(false);
  }, [page, statusFilter, companyFilter, listSearch]);

  useEffect(() => { loadQuotes(); }, [loadQuotes]);

  // Filtre değişince sayfa 1'e dön
  useEffect(() => { setPage(1); }, [statusFilter, companyFilter, listSearch]);

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
    setCompanyId(""); setQuoteNo(""); setQDate(today()); setValidUntil(""); setCurrency("TL"); setRate(""); setDesc(""); setPreparedBy(currentUserName); setStatus("draft"); setItems([]); setSearch(""); setResults([]);
  }
  function openNew() { resetForm(); setEditId(null); setView("edit"); }
  function openEdit(q: Quote) {
    setEditId(q.id); setCompanyId(q.company_id || ""); setQuoteNo(q.quote_no || "");
    setQDate(q.quote_date || today()); setValidUntil(q.valid_until || ""); setCurrency(q.currency || "TL");
    setRate(q.exchange_rate ? String(q.exchange_rate) : ""); setDesc(q.description || ""); setPreparedBy(q.created_by || currentUserName); setStatus(q.status || "draft"); setItems(q.items || []);
    setSearch(""); setResults([]); setView("edit");
  }
  // Sonraki revize numarası: TKF-2026-0001 -> TKF-2026-0001-R2 -> -R3 ...
  function nextRevisionNo(no?: string): string {
    if (!no) return "";
    const m = no.match(/^(.*)-R(\d+)$/);
    return m ? `${m[1]}-R${Number(m[2]) + 1}` : `${no}-R2`;
  }
  // Bir teklifi YENİ teklif olarak kopyala. keepCustomer=false → müşteri boş; asRevision=true → revize no'su atanır.
  function copyQuote(q: Quote, keepCustomer: boolean, asRevision = false) {
    setEditId(null);
    setCompanyId(keepCustomer ? (q.company_id || "") : "");
    setQuoteNo(asRevision ? nextRevisionNo(q.quote_no) : ""); // revize ise -R no, değilse yeni otomatik no
    setQDate(today()); setValidUntil(""); setCurrency(q.currency || "TL");
    setRate(q.exchange_rate ? String(q.exchange_rate) : ""); setDesc(q.description || ""); setPreparedBy(q.created_by || currentUserName); setStatus("draft");
    setItems((q.items || []).map(it => ({ ...it }))); setSearch(""); setResults([]);
    setCopySource(null); setView("edit");
  }
  // Editördeki mevcut formdan bir kaynak teklif kur (kopyalama seçimi için)
  function currentAsQuote(): Quote {
    return { id: "", quote_no: quoteNo, company_id: companyId, customer_name: companies.find(c => c.id === companyId)?.name, quote_date: qDate, valid_until: validUntil, currency, exchange_rate: rate ? Number(rate) : 1, description: desc, items, subtotal: 0, discount_total: 0, net_total: 0, kdv_total: 0, grand_total: 0, status, created_by: preparedBy, created_at: "" };
  }

  function addProduct(p: Product) {
    setItems(prev => [...prev, { product_id: p.id, description: p.name, quantity: 1, unit_price: p.unit_price || 0, discount: 0, kdv_rate: p.kdv_rate ?? 20, unit: p.unit || "Adet" }]);
    setSearch(""); setResults([]);
  }
  function addBlank() { setItems(prev => [...prev, emptyItem()]); }
  function setItem(i: number, patch: Partial<Item>) { setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it)); }
  function delItem(i: number) { setItems(prev => prev.filter((_, idx) => idx !== i)); }
  function moveItem(i: number, dir: -1 | 1) {
    setItems(prev => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function save(): Promise<Quote | null> {
    if (!companyId) { showToast("Müşteri seçin", "warning"); return null; }
    if (items.length === 0) { showToast("En az bir kalem ekleyin", "warning"); return null; }
    setSaving(true);
    const body = {
      id: editId || undefined,
      company_id: companyId,
      customer_name: companies.find(c => c.id === companyId)?.name || null,
      quote_no: quoteNo || undefined,
      quote_date: qDate, valid_until: validUntil || null,
      currency, exchange_rate: rate ? Number(rate) : 1, description: desc, items,
      created_by: preparedBy || currentUserName || null, status,
    };
    try {
      const r = await fetch("/api/admin/quotes", { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error((await r.json()).error || "Kaydedilemedi");
      const saved: Quote = await r.json();
      setEditId(saved.id); setQuoteNo(saved.quote_no);
      showToast(editId ? "Teklif güncellendi" : "Teklif kaydedildi");
      await loadQuotes();
      return saved;
    } catch (e) { showToast(e instanceof Error ? e.message : "Kaydedilemedi", "error"); return null; }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm("Bu teklifi silmek istiyor musunuz?")) return;
    await fetch("/api/admin/quotes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setQuotes(p => p.filter(q => q.id !== id));
  }

  // Hızlı durum değişimi (Kabul/Red/Sipariş) — gerekiyorsa önce kaydeder
  async function quickStatus(st: string) {
    setStatus(st);
    let id = editId;
    if (!id) { const s = await save(); if (!s) return; id = s.id; }
    const r = await fetch("/api/admin/quotes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: st }) });
    if (r.ok) { showToast("Durum güncellendi"); await loadQuotes(); }
    else showToast("Durum güncellenemedi", "error");
  }

  // Profesyonel teklif belgesi (HTML) — Türkçe sorunsuz, yazdır/PDF için
  function quoteDocHtml(no: string, qr = ""): string {
    const cur = currency;
    const c = companies.find(x => x.id === companyId);
    const cLogo = companyLogo(c || { name: customerName(companyId) });
    const m = (n: number) => `${SYM[cur] || cur} ${Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const dt = (d?: string) => d ? new Date(d).toLocaleDateString("tr-TR") : "—";
    const kdvRates = [...new Set(items.map(i => +i.kdv_rate || 0))];
    const kdvLabel = kdvRates.length === 1 ? `KDV (%${kdvRates[0]})` : "KDV";

    const rows = items.map((it, i) => {
      const gross = (+it.quantity || 0) * (+it.unit_price || 0);
      const net = gross - gross * (+it.discount || 0) / 100;
      const bg = i % 2 ? "#f5f8ff" : "#ffffff";
      return `<tr style="background:${bg};">
        <td style="padding:8px 14px;font-size:12px;color:#1f2937;"><span style="color:#0052ff;font-weight:700;">${i + 1}.</span> ${it.description || ""}</td>
        <td style="padding:8px 12px;font-size:12px;text-align:center;white-space:nowrap;color:#475569;">${it.quantity} ${it.unit || ""}</td>
        <td style="padding:8px 12px;font-size:12px;text-align:right;white-space:nowrap;color:#475569;">${m(it.unit_price)}</td>
        <td style="padding:8px 12px;font-size:12px;text-align:center;color:#475569;">%${it.discount || 0}</td>
        <td style="padding:8px 12px;font-size:12px;text-align:center;color:#475569;">%${it.kdv_rate || 0}</td>
        <td style="padding:8px 14px;font-size:12.5px;text-align:right;font-weight:800;white-space:nowrap;color:#0f172a;">${m(net)}</td>
      </tr>`;
    }).join("");

    const taxLine = (c?.tax_office || c?.tax_no) ? `<div style="font-size:11px;color:#4b5563;margin-top:2px;">VD: ${c?.tax_office || "—"}  VN: ${c?.tax_no || "—"}</div>` : "";
    const addrLine = c?.address ? `<div style="font-size:11px;color:#4b5563;margin-top:2px;">${c.address}</div>` : "";
    const attn = c?.contact_name ? `<div style="font-weight:700;font-size:12px;margin-top:8px;color:#111827;">Sayın ${c.contact_name} dikkatine;</div>` : "";

    return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Teklif ${no}</title>
<style>
  @page { size:A4; margin:0; }
  *{ box-sizing:border-box; }
  html,body{ margin:0; padding:0; }
  body{ font-family:'Segoe UI',Roboto,Arial,Helvetica,sans-serif; color:#1f2937; font-size:12px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .band{ background:#0052ff; background:linear-gradient(120deg,#0038c7 0%,#0052ff 55%,#3b74ff 100%); padding:16px 40px; }
  .accent{ height:5px; background:#ff5e07; }
  .content{ padding:18px 40px 0; }
  .doctitle{ color:#ffffff; font-size:24px; font-weight:800; letter-spacing:1px; margin:0; }
  .card{ background:#f8fafc; border:1px solid #e8edf3; border-radius:11px; padding:11px 15px; }
  .intro{ color:#0052ff; font-size:12.5px; margin:12px 0 5px; font-weight:500; }
  table.items{ width:100%; border-collapse:collapse; margin-top:6px; border-radius:9px; overflow:hidden; box-shadow:0 1px 4px rgba(15,23,42,.06); }
  table.items thead th{ background:#0f172a; color:#ffffff; font-size:10.5px; font-weight:700; padding:9px 12px; letter-spacing:.4px; }
  .totbox{ background:#eef4ff; border:1px solid #cfe0ff; border-radius:12px; padding:12px 18px; }
  .totrow{ display:flex; justify-content:space-between; padding:3px 0; font-size:12.5px; color:#475569; }
  .grand{ border-top:2px solid #0052ff; margin-top:7px; padding-top:8px; font-weight:800; font-size:17px; color:#0052ff; }
  .footer{ background:#0f172a; color:#cbd5e1; padding:14px 40px; margin-top:22px; font-size:11px; text-align:center; }
</style></head><body>

  <div class="band">
    <table style="width:100%;border:0;border-collapse:collapse;"><tr>
      <td style="border:0;vertical-align:middle;">
        <span style="display:inline-block;background:#ffffff;border-radius:12px;padding:10px 20px;box-shadow:0 6px 18px rgba(0,0,0,.22);">
          <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style="height:64px;width:auto;display:block;" />
        </span>
        <div style="color:#eaf0ff;font-size:12px;margin-top:9px;font-weight:700;letter-spacing:.3px;">Lider Network Teknoloji Danışmanlık Tic. Ltd. Şti.</div>
      </td>
      <td style="border:0;vertical-align:middle;text-align:right;">
        <div class="doctitle">FİYAT TEKLİFİ</div>
        <div style="display:inline-block;background:rgba(255,255,255,.18);color:#fff;border-radius:20px;padding:6px 16px;font-size:12px;font-weight:700;margin-top:12px;">${no}</div>
      </td>
    </tr></table>
  </div>
  <div class="accent"></div>

  <div class="content">
    <table style="width:100%;border:0;border-collapse:separate;border-spacing:0;"><tr>
      <td style="border:0;vertical-align:top;width:58%;padding-right:14px;">
        <div class="card" style="border-left:4px solid #0052ff;">
          <table style="width:100%;border:0;border-collapse:collapse;"><tr>
            <td style="border:0;vertical-align:top;">
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:#94a3b8;font-weight:800;margin-bottom:6px;">Müşteri</div>
              <div style="font-weight:800;font-size:14px;color:#0f172a;">${c?.name || customerName(companyId)}</div>
              ${addrLine}${taxLine}${attn}
            </td>
            ${cLogo?.logo ? `<td style="border:0;width:96px;text-align:right;vertical-align:top;"><img src="${cLogo.logo}" alt="" style="max-width:92px;max-height:48px;object-fit:contain;"/></td>` : ""}
          </tr></table>
        </div>
      </td>
      <td style="border:0;vertical-align:top;width:42%;">
        <div class="card">
          <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;"><span style="color:#64748b;">Tarih</span><b style="color:#0f172a;">${dt(qDate)}</b></div>
          <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;"><span style="color:#64748b;">Geçerlilik</span><b style="color:#0f172a;">${dt(validUntil)}</b></div>
          <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;"><span style="color:#64748b;">Para Birimi</span><b style="color:#0f172a;">${cur}</b></div>
          ${preparedBy ? `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;"><span style="color:#64748b;">Teklifi Veren</span><b style="color:#0f172a;">${preparedBy}</b></div>` : ""}
        </div>
      </td>
    </tr></table>

    <p class="intro">Yapmış olduğumuz görüşmeler sonrasında hazırlamış olduğumuz fiyat teklifimizi değerlendirmenize sunarız.</p>

    <table class="items">
      <thead><tr>
        <th style="text-align:left;">AÇIKLAMA</th>
        <th style="text-align:center;">MİKTAR</th>
        <th style="text-align:right;">FİYAT</th>
        <th style="text-align:center;">İSK.</th>
        <th style="text-align:center;">KDV</th>
        <th style="text-align:right;">TUTAR (KDV Hariç)</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <table style="width:100%;border:0;border-collapse:collapse;margin-top:16px;"><tr>
      <td style="border:0;"></td>
      <td style="border:0;width:300px;">
        <div class="totbox">
          <div class="totrow"><span>Brüt Toplam</span><span style="font-weight:600;color:#1f2937;">${m(totals.subtotal)}</span></div>
          ${totals.discount_total ? `<div class="totrow"><span>İndirim</span><span style="color:#dc2626;font-weight:600;">- ${m(totals.discount_total)}</span></div>` : ""}
          <div class="totrow"><span>Net Toplam</span><span style="font-weight:600;color:#1f2937;">${m(totals.net_total)}</span></div>
          <div class="totrow"><span>${kdvLabel}</span><span style="font-weight:600;color:#1f2937;">${m(totals.kdv_total)}</span></div>
          <div class="totrow grand"><span>GENEL TOPLAM</span><span>${m(totals.grand_total)}</span></div>
        </div>
      </td>
    </tr></table>

    ${desc ? `<div style="margin-top:14px;padding:12px 15px;background:#f8fafc;border:1px solid #e8edf3;border-radius:10px;font-size:12px;color:#475569;line-height:1.55;white-space:pre-wrap;">${desc}</div>` : ""}

    <div style="font-size:12px;color:#374151;margin-top:18px;line-height:1.55;">
      Teklifimiz ile ilgili sorularınızı cevaplandırmaya hazır olduğumuzu belirtir, çalışmalarınızda başarılar dileriz.
      <div style="margin-top:10px;">Saygılarımızla,</div>
    </div>

    <!-- İmza / kaşe alanları (+ onay QR) -->
    <table style="width:100%;border:0;border-collapse:collapse;margin-top:26px;"><tr>
      ${qr ? `<td style="border:0;width:128px;vertical-align:top;padding-right:20px;text-align:center;">
        <img src="${qr}" alt="Onay QR" style="width:104px;height:104px;display:block;border:1px solid #e8edf3;border-radius:8px;margin:0 auto;" />
        <div style="font-size:9.5px;color:#475569;margin-top:5px;line-height:1.4;font-weight:700;">📱 Telefonla okutup<br/>onaylayın</div>
      </td>` : ""}
      <td style="border:0;width:50%;padding-right:28px;vertical-align:top;">
        <div style="height:42px;"></div>
        <div style="border-top:1.5px solid #475569;padding-top:8px;font-size:12px;color:#374151;">
          <div style="font-weight:800;color:#0f172a;">Teklifi Veren</div>
          <div style="margin-top:2px;">${preparedBy || "Lider Network"}</div>
          <div style="color:#94a3b8;font-size:11px;margin-top:3px;">Kaşe / İmza</div>
        </div>
      </td>
      <td style="border:0;width:50%;padding-left:28px;vertical-align:top;">
        <div style="height:42px;"></div>
        <div style="border-top:1.5px solid #475569;padding-top:8px;font-size:12px;color:#374151;">
          <div style="font-weight:800;color:#0f172a;">Müşteri Onayı</div>
          <div style="margin-top:2px;">${c?.name || customerName(companyId)}</div>
          <div style="color:#94a3b8;font-size:11px;margin-top:3px;">Kaşe / İmza / Tarih</div>
        </div>
      </td>
    </tr></table>
  </div>

  <div class="footer">
    <strong style="color:#fff;letter-spacing:1px;">LİDER NETWORK</strong> &nbsp;·&nbsp; +90 312 232 02 88 &nbsp;·&nbsp; info@lidernetwork.com.tr &nbsp;·&nbsp; www.lidernetwork.com.tr
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print()},350)}<\/script>
</body></html>`;
  }

  async function openDoc(no: string, id?: string | null) {
    // Onay QR'ı: kayıtlı teklif için herkese açık onay linkini üret
    let qr = "";
    if (id) {
      try {
        const url = `${window.location.origin}/teklif/onay/${id}`;
        qr = await QRCode.toDataURL(url, { margin: 1, width: 240, color: { dark: "#0f172a", light: "#ffffff" } });
      } catch { /* QR opsiyonel */ }
    }
    const w = window.open("", "_blank");
    if (!w) { showToast("Pop-up engellendi — tarayıcı izinlerini kontrol edin", "warning"); return; }
    w.document.write(quoteDocHtml(no, qr));
    w.document.close();
  }
  async function exportPDF() {
    let no = quoteNo, id = editId;
    if (!editId) { const s = await save(); if (!s) return; no = s.quote_no; id = s.id; }
    openDoc(no || "TASLAK", id);
  }
  function printQuote() { openDoc(quoteNo || "TASLAK", editId); }

  function customerName(id: string) { return companies.find(c => c.id === id)?.name || "—"; }

  async function sendEmail() {
    const saved = editId ? { id: editId } : await save();
    if (!saved) return;
    const c = companies.find(x => x.id === companyId);
    const to = prompt("Teklifin gönderileceği e-posta adresi:", c?.contact_email || "");
    if (!to) return;
    const r = await fetch("/api/admin/quotes/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ("id" in saved ? saved.id : editId), email: to }) });
    if (r.ok) { showToast("Teklif e-postası gönderildi → " + to); await loadQuotes(); }
    else showToast("Gönderilemedi: " + ((await r.json().catch(() => ({}))).error || "hata"), "error");
  }

  const inp = { padding: "9px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", color: "#1a1d2e", outline: "none", width: "100%", boxSizing: "border-box" as const, background: "#fff" };
  const lbl = { fontSize: "11px", fontWeight: 800 as const, color: "#334155", textTransform: "uppercase" as const, letterSpacing: ".4px", display: "block", marginBottom: "6px" };

  // Kopyalama seçim modalı (hem liste hem editör görünümünde gösterilir)
  const copyModal = copySource ? (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => { if (e.target === e.currentTarget) setCopySource(null); }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,.25)", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", background: "linear-gradient(135deg,#b45309,#d97706)" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "7px" }}><Copy size={16} /> Teklifi Kopyala</h3>
          <button onClick={() => setCopySource(null)} style={{ background: "rgba(255,255,255,.2)", border: "none", cursor: "pointer", color: "#fff", borderRadius: "6px", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>
        <div style={{ padding: "22px" }}>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 18px", lineHeight: 1.55 }}>Orijinal teklif <strong>korunur</strong>. Nasıl kopyalansın?</p>
          <button onClick={() => copyQuote(copySource, true, true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "13px 16px", marginBottom: "10px", borderRadius: "11px", border: "1.5px solid #fde68a", background: "#fffbeb", color: "#b45309", fontSize: "14px", fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: "20px" }}>📝</span>
            <span>Revize Et<br /><span style={{ fontSize: "11.5px", fontWeight: 500, color: "#64748b" }}>Aynı müşteri — orijinalin yeni sürümü ({nextRevisionNo(copySource.quote_no)})</span></span>
          </button>
          <button onClick={() => copyQuote(copySource, true, false)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "13px 16px", marginBottom: "10px", borderRadius: "11px", border: "1.5px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", fontSize: "14px", fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: "20px" }}>📄</span>
            <span>Yeni Teklif (Aynı Müşteri)<br /><span style={{ fontSize: "11.5px", fontWeight: 500, color: "#64748b" }}>İçerik değişti — bağımsız yeni teklif, revize değil</span></span>
          </button>
          <button onClick={() => copyQuote(copySource, false, false)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "13px 16px", borderRadius: "11px", border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#0052ff", fontSize: "14px", fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: "20px" }}>🔄</span>
            <span>Başka Müşteri İçin<br /><span style={{ fontSize: "11.5px", fontWeight: 500, color: "#64748b" }}>Müşteri boş gelir, yenisini seçersin</span></span>
          </button>
        </div>
      </div>
    </div>
  ) : null;

  /* ── LİSTE ── */
  if (view === "list") {
    const s = listSearch.trim().toLowerCase();
    const filtered = quotes.filter(q => {
      if (companyFilter && q.company_id !== companyFilter) return false;
      if (statusFilter !== "all" && q.status !== statusFilter) return false;
      if (s) { const hay = `${q.quote_no} ${q.customer_name || ""} ${q.companies?.name || ""}`.toLowerCase(); if (!hay.includes(s)) return false; }
      return true;
    });
    const stats = [
      { id: "all", label: "Toplam", value: quotes.length, color: "#0052ff" },
      { id: "draft", label: "Taslak", value: quotes.filter(q => q.status === "draft").length, color: "#64748b" },
      { id: "sent", label: "Gönderildi", value: quotes.filter(q => q.status === "sent").length, color: "#0891b2" },
      { id: "accepted", label: "Kabul", value: quotes.filter(q => q.status === "accepted").length, color: "#15803d" },
    ];
    const companyFilterName = companies.find(c => c.id === companyFilter)?.name;
    const STFILT = [["all", "Tümü"], ["draft", "Taslak"], ["sent", "Gönderildi"], ["accepted", "Kabul"], ["ordered", "Sipariş"], ["rejected", "Red"]];
    const initials = (n: string) => n.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const avatarBg = (n: string) => { const c = ["#0052ff", "#7c3aed", "#15803d", "#d97706", "#dc2626", "#0891b2"]; let h = 0; for (const ch of n) h = ch.charCodeAt(0) + h; return c[h % c.length]; };

    if (mainTab === "products") {
      return (
        <div>
          <div style={{ display: "flex", gap: "6px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "11px", padding: "4px", width: "fit-content", marginBottom: "18px" }}>
            <button onClick={() => setMainTab("quotes")} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: "transparent", color: "#64748b" }}>📄 Teklifler</button>
            <button onClick={() => setMainTab("products")} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg,#16a34a,#22c55e)", color: "#fff" }}>🛒 Ürünler</button>
          </div>
          <ProductsView defaultCurrency="TL" />
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: "flex", gap: "6px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "11px", padding: "4px", width: "fit-content", marginBottom: "18px" }}>
          <button onClick={() => setMainTab("quotes")} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg,#0038c7,#0052ff)", color: "#fff" }}>📄 Teklifler</button>
          <button onClick={() => setMainTab("products")} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: "transparent", color: "#64748b" }}>🛒 Ürünler</button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
          <div>
            <h2 style={{ margin: "0 0 3px", fontSize: "20px", fontWeight: 800, color: "#1a1d2e" }}>📄 Teklifler</h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Fiyat teklifleri oluştur, PDF indir, e-posta gönder</p>
          </div>
          <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 18px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#0038c7,#0052ff)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,82,255,.25)" }}>
            <Plus size={16} /> Yeni Teklif
          </button>
        </div>

        {/* Özet kartları */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: "12px", marginBottom: "16px" }}>
          {stats.map(s2 => (
            <div key={s2.id} onClick={() => setStatusFilter(s2.id)} style={{ background: "#fff", border: `1px solid ${statusFilter === s2.id ? s2.color : "#e5e7ef"}`, borderTop: `3px solid ${s2.color}`, borderRadius: "12px", padding: "14px 16px", cursor: "pointer", boxShadow: statusFilter === s2.id ? `0 2px 10px ${s2.color}22` : "none" }}>
              <p style={{ fontSize: "24px", fontWeight: 900, color: s2.color, margin: "0 0 2px", lineHeight: 1 }}>{s2.value}</p>
              <p style={{ fontSize: "11.5px", color: "#9ca3af", margin: 0 }}>{s2.label}</p>
            </div>
          ))}
        </div>

        {/* Arama + filtre çubuğu */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1.5px solid #cbd5e1", borderRadius: "10px", padding: "0 12px", background: "#fff", flex: "1 1 240px", minWidth: "200px" }}>
            <Search size={15} color="#64748b" />
            <input value={listSearch} onChange={e => setListSearch(e.target.value)} placeholder="Müşteri veya teklif no ara…" style={{ flex: 1, border: "none", background: "transparent", padding: "10px 0", fontSize: "13px", color: "#1a1d2e", outline: "none" }} />
            {listSearch && <button onClick={() => setListSearch("")} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}><X size={15} /></button>}
          </div>
          <div style={{ display: "flex", gap: "6px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "10px", padding: "4px", overflowX: "auto" }}>
            {STFILT.map(([id, label]) => (
              <button key={id} onClick={() => setStatusFilter(id)} style={{ padding: "7px 13px", borderRadius: "7px", border: "none", whiteSpace: "nowrap", fontSize: "12.5px", fontWeight: statusFilter === id ? 700 : 500, cursor: "pointer", background: statusFilter === id ? "linear-gradient(135deg,#0038c7,#0052ff)" : "transparent", color: statusFilter === id ? "#fff" : "#64748b" }}>{label}</button>
            ))}
          </div>
          {companyFilter && (
            <button onClick={() => setCompanyFilter("")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "20px", border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#0052ff", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}>
              🏢 {companyFilterName} <X size={13} />
            </button>
          )}
        </div>

        {loading ? <p style={{ color: "#94a3b8" }}>Yükleniyor…</p> : quotes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <FileText size={40} color="#cbd5e1" style={{ marginBottom: "12px" }} />
            <p style={{ fontSize: "14px", margin: 0 }}>Henüz teklif yok. "Yeni Teklif" ile başlayın.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#94a3b8" }}>
            <Search size={36} color="#cbd5e1" style={{ marginBottom: "10px" }} />
            <p style={{ fontSize: "14px", margin: 0 }}>Aramaya uygun teklif bulunamadı.</p>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "13px", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "680px" }}>
                <thead><tr style={{ background: "#f8fafc" }}>
                  {["Teklif No", "Müşteri", "Tarih", "Tutar", "Durum", ""].map((h, i) => (
                    <th key={i} style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: ".3px", textAlign: i === 3 ? "right" : "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filtered.map(q => {
                    const st = STATUS[q.status] || STATUS.draft;
                    const cname = q.companies?.name || q.customer_name || "—";
                    return (
                      <tr key={q.id} onClick={() => openEdit(q)} style={{ borderTop: "1px solid #f0f2f8", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f8faff")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 800, color: "#0052ff", whiteSpace: "nowrap" }}>
                          {q.quote_no}
                          {/-R\d+$/.test(q.quote_no || "") && <span style={{ marginLeft: "6px", fontSize: "10px", fontWeight: 800, padding: "2px 6px", borderRadius: "5px", background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}>REVİZE</span>}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {(() => { const cl = companyLogo(companies.find(c => c.id === q.company_id) || { name: cname }); return cl?.logo
                              ? <span style={{ flexShrink: 0, width: 38, height: 30, borderRadius: "8px", background: cl.logoBg || "#fff", border: "1px solid #eef2f7", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "2px" }}><img src={cl.logo} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /></span>
                              : <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: "8px", background: avatarBg(cname), color: "#fff", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials(cname)}</span>; })()}
                            <div>
                              <div style={{ fontSize: "13px", color: "#1a1d2e", fontWeight: 600 }}>{cname}</div>
                              {q.created_by && <div style={{ fontSize: "11px", color: "#9ca3af" }}>👤 {q.created_by}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>{q.quote_date ? new Date(q.quote_date).toLocaleDateString("tr-TR") : "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 800, color: "#1a1d2e", textAlign: "right", whiteSpace: "nowrap" }}>{money(q.grand_total, q.currency)}</td>
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}><span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 11px", borderRadius: "6px", background: st.bg, color: st.color }}>{st.label}</span></td>
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap", textAlign: "right" }}>
                          <button onClick={e => { e.stopPropagation(); setCopySource(q); }} title="Kopyala (yeni teklif olarak)" style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#b45309", borderRadius: "7px", padding: "5px 7px", cursor: "pointer", marginRight: "5px" }}><Copy size={13} /></button>
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
        {/* Pagination */}
        {total > PAGE_SIZE && (() => {
          const totalPages = Math.ceil(total / PAGE_SIZE);
          const start = (page - 1) * PAGE_SIZE + 1;
          const end   = Math.min(page * PAGE_SIZE, total);
          const nums: number[] = [];
          for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) nums.push(i);
          const btnS = (active: boolean, disabled: boolean): React.CSSProperties => ({
            padding: "6px 12px", borderRadius: "8px", border: `1.5px solid ${active ? "#0052ff" : "#e5e7ef"}`,
            background: active ? "#0052ff" : disabled ? "#f8f9fb" : "#fff",
            color: active ? "#fff" : disabled ? "#d1d5db" : "#1a1d2e",
            fontSize: "13px", fontWeight: 700, cursor: disabled ? "default" : "pointer",
          });
          return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", marginTop: "10px", flexWrap: "wrap", gap: "10px" }}>
              <span style={{ fontSize: "13px", color: "#6b7280" }}><strong style={{ color: "#1a1d2e" }}>{start}–{end}</strong> / {total} teklif &nbsp;·&nbsp; Sayfa {page}/{totalPages}</span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => setPage(1)} disabled={page === 1} style={btnS(false, page === 1)}>«</button>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={btnS(false, page === 1)}>← Önceki</button>
                {nums.map(n => <button key={n} onClick={() => setPage(n)} style={btnS(n === page, false)}>{n}</button>)}
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} style={btnS(false, page === totalPages)}>Sonraki →</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={btnS(false, page === totalPages)}>»</button>
              </div>
            </div>
          );
        })()}
        {copyModal}
      </div>
    );
  }

  /* ── EDİTÖR ── */
  return (
    <div>
      {/* Üst aksiyon barı */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "18px", alignItems: "center" }}>
        <button onClick={() => { setView("list"); resetForm(); }} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 14px", borderRadius: "9px", border: "1.5px solid #e5e7ef", background: "#fff", color: "#475569", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}><ArrowLeft size={15} /> Geri</button>
        {editId && <span style={{ fontSize: "12px", fontWeight: 700, padding: "5px 11px", borderRadius: "7px", background: (STATUS[status] || STATUS.draft).bg, color: (STATUS[status] || STATUS.draft).color }}>{(STATUS[status] || STATUS.draft).label}</span>}
        {editId && <button onClick={() => setCopySource(currentAsQuote())} title="Bu teklifi yeni bir teklif olarak kopyala (orijinal korunur)" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 13px", borderRadius: "9px", border: "1.5px solid #fde68a", background: "#fffbeb", color: "#b45309", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}><Copy size={14} /> Kopyala</button>}
        {editId && (status === "accepted" || status === "ordered") && onCreateDelivery && (
          <button onClick={() => {
            const company = companies.find(c => c.id === companyId);
            onCreateDelivery({
              customer_name: company?.name || customerName(companyId) || "",
              company_id: companyId || null,
              items: items.filter(it => it.description.trim()).map(it => ({ name: it.description, qty: it.quantity, unit: it.unit || "Adet" })),
            });
          }} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 13px", borderRadius: "9px", border: "1.5px solid #a7f3d0", background: "#ecfdf5", color: "#065f46", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
            <PackageCheck size={14} /> Teslim Tutanağı Oluştur
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={() => quickStatus("accepted")} title="Teklifi kabul edildi olarak işaretle" style={{ padding: "9px 13px", borderRadius: "9px", border: "1.5px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>✓ Kabul</button>
        <button onClick={() => quickStatus("rejected")} title="Teklifi reddedildi olarak işaretle" style={{ padding: "9px 13px", borderRadius: "9px", border: "1.5px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>✕ Red</button>
        <button onClick={() => quickStatus("ordered")} title="Siparişe çevir" style={{ padding: "9px 13px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg,#6d28d9,#7c3aed)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>🛒 Siparişe Çevir</button>
        <button onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "9px", border: "none", background: saving ? "#9ca3af" : "linear-gradient(135deg,#15803d,#22c55e)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}><Save size={15} /> {saving ? "Kaydediliyor…" : "Teklifi Kaydet"}</button>
        <button onClick={exportPDF} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "9px", border: "none", background: "#b91c1c", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}><FileText size={15} /> PDF</button>
        <button onClick={printQuote} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "9px", border: "1.5px solid #e5e7ef", background: "#fff", color: "#475569", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}><Printer size={15} /> Yazdır</button>
        <button onClick={sendEmail} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg,#0038c7,#0052ff)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}><Mail size={15} /> Gönder</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))", gap: "18px", alignItems: "start" }}>
        {/* Sol: teklif bilgileri */}
        <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderTop: "3px solid #0052ff", borderRadius: "13px", padding: "18px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 800, color: "#0052ff", display: "flex", alignItems: "center", gap: "7px" }}>📋 Teklif Bilgileri</h3>
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
          <div style={{ marginBottom: "12px" }}><label style={lbl}>Teklifi Veren</label>
            {staff.length > 0 ? (
              <select value={preparedBy} onChange={e => setPreparedBy(e.target.value)} style={inp}>
                {!staff.includes(preparedBy) && preparedBy && <option value={preparedBy}>{preparedBy}</option>}
                {staff.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input value={preparedBy} onChange={e => setPreparedBy(e.target.value)} placeholder="Hazırlayan kişi" style={inp} />
            )}
          </div>
          <div style={{ marginBottom: "12px" }}><label style={lbl}>Durum</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={inp}>
              {Object.entries(STATUS).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Açıklama</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} placeholder="Teklif notu, şartlar…" style={{ ...inp, resize: "vertical", lineHeight: 1.5 }} />
          </div>
        </div>

        {/* Sağ: ürün / hizmetler */}
        <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderTop: "3px solid #16a34a", borderRadius: "13px", padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", gap: "8px", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#16a34a", display: "flex", alignItems: "center", gap: "7px" }}>🛒 Ürün / Hizmetler</h3>
            <button onClick={() => setNewProd(true)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", borderRadius: "8px", border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#0052ff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}><Plus size={13} /> Yeni Ürün</button>
          </div>

          {/* Ürün arama */}
          <div style={{ position: "relative", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1.5px solid #cbd5e1", borderRadius: "9px", padding: "0 12px", background: "#fff" }}>
              <Search size={15} color="#64748b" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ürün adından arayın (en az 2 harf)…" style={{ flex: 1, border: "none", background: "transparent", padding: "10px 0", fontSize: "13px", color: "#1a1d2e", outline: "none" }} />
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
                <thead><tr style={{ borderBottom: "2px solid #e5e7ef" }}>
                  <th style={{ width: 26 }} />
                  {["Açıklama", "Miktar", "Fiyat", "İsk.%", "KDV%", "Net", ""].map((h, i) => (
                    <th key={i} style={{ padding: "8px 6px", fontSize: "11px", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: ".3px", textAlign: i >= 1 && i <= 5 ? "right" : "left" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {items.map((it, i) => {
                    const gross = (+it.quantity || 0) * (+it.unit_price || 0); const net = gross - gross * (+it.discount || 0) / 100;
                    const cell = { width: "100%", border: "1.5px solid #cbd5e1", borderRadius: "6px", padding: "6px 7px", fontSize: "12px", color: "#1a1d2e", background: "#fff", textAlign: "right" as const, boxSizing: "border-box" as const, outline: "none" };
                    const mvBtn = { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "5px", width: 22, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#475569", padding: 0 } as const;
                    return (
                      <tr key={i}>
                        <td style={{ padding: "4px 2px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <button onClick={() => moveItem(i, -1)} disabled={i === 0} title="Yukarı taşı" style={{ ...mvBtn, opacity: i === 0 ? .35 : 1, cursor: i === 0 ? "default" : "pointer" }}><ChevronUp size={13} /></button>
                            <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} title="Aşağı taşı" style={{ ...mvBtn, opacity: i === items.length - 1 ? .35 : 1, cursor: i === items.length - 1 ? "default" : "pointer" }}><ChevronDown size={13} /></button>
                          </div>
                        </td>
                        <td style={{ padding: "4px 5px" }}><input value={it.description} onChange={e => setItem(i, { description: e.target.value })} placeholder="Açıklama" style={{ ...cell, textAlign: "left" }} /></td>
                        <td style={{ padding: "4px 5px", width: "70px" }}><input type="number" step="any" value={it.quantity} onChange={e => setItem(i, { quantity: +e.target.value })} style={cell} /></td>
                        <td style={{ padding: "4px 5px", width: "90px" }}><input type="number" step="any" value={it.unit_price} onChange={e => setItem(i, { unit_price: +e.target.value })} style={cell} /></td>
                        <td style={{ padding: "4px 5px", width: "62px" }}><input type="number" step="any" value={it.discount} onChange={e => setItem(i, { discount: +e.target.value })} style={cell} /></td>
                        <td style={{ padding: "4px 5px", width: "62px" }}><input type="number" step="any" value={it.kdv_rate} onChange={e => setItem(i, { kdv_rate: +e.target.value })} style={cell} /></td>
                        <td style={{ padding: "4px 5px", fontSize: "12px", fontWeight: 700, color: "#1a1d2e", textAlign: "right", whiteSpace: "nowrap" }}>{money(net, currency)}</td>
                        <td style={{ padding: "4px 5px", whiteSpace: "nowrap" }}>
                          <button onClick={() => setHistFor({ product_id: it.product_id, name: it.description })} title="Önceki fiyatlar" style={{ background: "none", border: "none", color: "#0052ff", cursor: "pointer", marginRight: "2px" }}><History size={14} /></button>
                          <button onClick={() => delItem(i)} title="Sil" style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}><Trash2 size={14} /></button>
                        </td>
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
      {histFor && <HistoryModal target={histFor} onClose={() => setHistFor(null)} />}
      {copyModal}
    </div>
  );
}

/* ── Ürün Kataloğu Yönetimi ── */
function ProductsView({ defaultCurrency }: { defaultCurrency: string }) {
  const [list, setList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<Product | "new" | null>(null);

  const load = useCallback(async (term = "") => {
    setLoading(true);
    const r = await fetch(`/api/admin/products${term ? `?q=${encodeURIComponent(term)}` : ""}`);
    if (r.ok) setList((await r.json()).products || []);
    setLoading(false);
  }, []);
  useEffect(() => { const t = setTimeout(() => load(q.trim()), 250); return () => clearTimeout(t); }, [q, load]);

  async function del(id: string) {
    if (!confirm("Bu ürünü katalogdan kaldırmak istiyor musunuz?")) return;
    await fetch("/api/admin/products", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setList(p => p.filter(x => x.id !== id));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div>
          <h2 style={{ margin: "0 0 3px", fontSize: "20px", fontWeight: 800, color: "#1a1d2e" }}>🛒 Ürün Kataloğu</h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Tekliflerde kullanılan ürünleri yönetin</p>
        </div>
        <button onClick={() => setModal("new")} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 18px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#16a34a,#22c55e)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(34,197,94,.25)" }}>
          <Plus size={16} /> Yeni Ürün
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1.5px solid #cbd5e1", borderRadius: "10px", padding: "0 12px", background: "#fff", marginBottom: "16px", maxWidth: "360px" }}>
        <Search size={15} color="#64748b" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Ürün ara…" style={{ flex: 1, border: "none", background: "transparent", padding: "10px 0", fontSize: "13px", color: "#1a1d2e", outline: "none" }} />
        {q && <button onClick={() => setQ("")} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}><X size={15} /></button>}
      </div>

      {loading ? <p style={{ color: "#94a3b8" }}>Yükleniyor…</p> : list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", color: "#94a3b8" }}>
          <FileText size={36} color="#cbd5e1" style={{ marginBottom: "10px" }} />
          <p style={{ fontSize: "14px", margin: 0 }}>{q ? "Aramaya uygun ürün yok." : "Henüz ürün yok. \"Yeni Ürün\" ile başlayın."}</p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "13px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
              <thead><tr style={{ background: "#f8fafc" }}>
                {["Ürün", "Kod", "Birim Fiyat", "KDV", "Birim", ""].map((h, i) => (
                  <th key={i} style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 800, color: "#475569", textTransform: "uppercase", textAlign: i === 2 ? "right" : "left", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {list.map(p => (
                  <tr key={p.id} onClick={() => setModal(p)} style={{ borderTop: "1px solid #f0f2f8", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8faff")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 700, color: "#1a1d2e" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        {p.name}
                        {p.type && <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "5px", background: p.type === "hizmet" ? "#f5f3ff" : "#eff6ff", color: p.type === "hizmet" ? "#7c3aed" : "#0052ff" }}>{PRODUCT_TYPES.find(t => t.id === p.type)?.label || p.type}</span>}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#64748b" }}>{p.code || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 800, color: "#15803d", textAlign: "right", whiteSpace: "nowrap" }}>{money(p.unit_price, p.currency)}</td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#64748b" }}>%{p.kdv_rate}</td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#64748b" }}>{p.unit}</td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap", textAlign: "right" }}>
                      <button onClick={e => { e.stopPropagation(); setModal(p); }} title="Düzenle" style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#0052ff", borderRadius: "7px", padding: "5px 7px", cursor: "pointer", marginRight: "5px" }}><Pencil size={13} /></button>
                      <button onClick={e => { e.stopPropagation(); del(p.id); }} title="Sil" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "7px", padding: "5px 7px", cursor: "pointer" }}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && <NewProductModal currency={defaultCurrency} product={modal === "new" ? undefined : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(q.trim()); }} />}
    </div>
  );
}

/* ── Fiyat Geçmişi Modalı ── */
function HistoryModal({ target, onClose }: { target: { product_id?: string | null; name: string }; onClose: () => void }) {
  const [rows, setRows] = useState<{ quote_no: string; customer_name: string; quote_date: string; unit_price: number; quantity: number; discount: number; currency: string }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const p = new URLSearchParams();
    if (target.product_id) p.set("product_id", target.product_id);
    else p.set("name", target.name);
    fetch(`/api/admin/quote-history?${p.toString()}`).then(r => r.ok ? r.json() : { history: [] }).then(d => { setRows(d.history || []); setLoading(false); }).catch(() => setLoading(false));
  }, [target]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "520px", boxShadow: "0 20px 60px rgba(0,0,0,.25)", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", background: "linear-gradient(135deg,#0038c7,#0052ff)" }}>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "7px" }}><History size={16} /> Önceki Fiyatlar</h3>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.2)", border: "none", cursor: "pointer", color: "#fff", borderRadius: "6px", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>
        <div style={{ padding: "18px 22px", maxHeight: "60vh", overflowY: "auto" }}>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 14px" }}>Bu ürünün geçmiş tekliflerde <strong>kime, kaçtan</strong> verildiği:</p>
          {loading ? <p style={{ color: "#94a3b8", fontSize: "13px" }}>Yükleniyor…</p> : rows.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>Bu ürün için önceki teklif kaydı bulunamadı.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                {["Müşteri", "Tarih", "Teklif", "Birim Fiyat"].map((h, i) => (
                  <th key={i} style={{ padding: "8px 8px", fontSize: "11px", fontWeight: 800, color: "#475569", textTransform: "uppercase", textAlign: i === 3 ? "right" : "left", borderBottom: "2px solid #e5e7ef", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: "9px 8px", fontSize: "13px", color: "#1a1d2e", fontWeight: 600, borderBottom: "1px solid #f1f5f9" }}>{r.customer_name}</td>
                    <td style={{ padding: "9px 8px", fontSize: "12px", color: "#64748b", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{new Date(r.quote_date).toLocaleDateString("tr-TR")}</td>
                    <td style={{ padding: "9px 8px", fontSize: "12px", color: "#0052ff", fontWeight: 700, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{r.quote_no}</td>
                    <td style={{ padding: "9px 8px", fontSize: "13px", color: "#15803d", fontWeight: 800, textAlign: "right", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{money(r.unit_price, r.currency)}{r.discount ? <span style={{ fontSize: "10px", color: "#dc2626", fontWeight: 600 }}> (-%{r.discount})</span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Yeni/Düzenle Ürün Modalı ── */
function NewProductModal({ currency, product, onClose, onSaved }: { currency: string; product?: Product; onClose: () => void; onSaved: (p: Product) => void }) {
  const [name, setName] = useState(product?.name || "");
  const [code, setCode] = useState(product?.code || "");
  const [price, setPrice] = useState(product ? String(product.unit_price ?? "") : "");
  const [cur, setCur] = useState(product?.currency || currency);
  const [kdv, setKdv] = useState(product ? String(product.kdv_rate ?? 20) : "20");
  const [unit, setUnit] = useState(product?.unit || "Adet");
  const [type, setType] = useState(product?.type || "stoklu");
  const [saving, setSaving] = useState(false);
  const isEdit = !!product?.id;

  const inp = { padding: "9px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", color: "#1a1d2e", outline: "none", width: "100%", boxSizing: "border-box" as const };
  const lbl = { fontSize: "11px", fontWeight: 800 as const, color: "#334155", display: "block", marginBottom: "6px", textTransform: "uppercase" as const, letterSpacing: ".3px" };

  async function save() {
    if (!name.trim()) { showToast("Ürün adı gerekli", "warning"); return; }
    setSaving(true);
    const payload = { name, code, unit_price: price ? Number(price) : 0, currency: cur, kdv_rate: kdv ? Number(kdv) : 20, unit, type };
    const r = await fetch("/api/admin/products", {
      method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id: product!.id, ...payload } : payload),
    });
    setSaving(false);
    if (r.ok) { showToast(isEdit ? "Ürün güncellendi" : "Ürün kataloğa eklendi"); onSaved(await r.json()); }
    else showToast("Kaydedilemedi: " + ((await r.json().catch(() => ({}))).error || "hata"), "error");
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "460px", boxShadow: "0 20px 60px rgba(0,0,0,.25)", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", background: "linear-gradient(135deg,#16a34a,#22c55e)" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "7px" }}>🛒 {isEdit ? "Ürün Düzenle" : "Yeni Ürün Kaydı"}</h3>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.2)", border: "none", cursor: "pointer", color: "#fff", borderRadius: "6px", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>
        <div style={{ padding: "22px" }}>
        {!isEdit && <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 16px", lineHeight: 1.5, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 12px" }}>Ürün kataloğa eklenir, sonraki tekliflerde aratıp seçebilirsiniz. Detayları sonra düzenleyebilirsiniz.</p>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: "10px", marginBottom: "12px" }}>
          <div><label style={lbl}>Ürün Adı *</label><input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="ör. Viewsonic 32 Monitör" style={inp} /></div>
          <div><label style={lbl}>Ürün Tipi</label><select value={type} onChange={e => setType(e.target.value)} style={inp}>{PRODUCT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
        </div>
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
          <button onClick={save} disabled={saving} style={{ padding: "9px 22px", border: "none", borderRadius: "9px", background: saving ? "#9ca3af" : "linear-gradient(135deg,#16a34a,#22c55e)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Kaydediliyor…" : "Kaydet"}</button>
        </div>
        </div>
      </div>
    </div>
  );
}
