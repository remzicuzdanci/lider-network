"use client";

import { useRef } from "react";
import { X, Printer } from "lucide-react";

export interface Receipt {
  id: string;
  receipt_no: string;
  company_id: string;
  payment_type: "cek" | "nakit" | "kredi_karti";
  amount: number;
  currency: string;
  receipt_date: string;
  due_date?: string | null;
  check_no?: string | null;
  bank_name?: string | null;
  check_image_url?: string | null;
  notes?: string | null;
  created_at: string;
  companies?: {
    name: string;
    address?: string | null;
    tax_no?: string | null;
    tax_office?: string | null;
  } | null;
}

const PT_LABEL: Record<string, string> = {
  cek: "Çek",
  nakit: "Nakit",
  kredi_karti: "Kredi Kartı",
};

function fmt(n: number, cur: string) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency", currency: cur, minimumFractionDigits: 2,
  }).format(n);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}
function numToWords(n: number): string {
  const ones = ["","bir","iki","üç","dört","beş","altı","yedi","sekiz","dokuz"];
  const tens = ["","on","yirmi","otuz","kırk","elli","altmış","yetmiş","seksen","doksan"];
  if (n === 0) return "sıfır";
  if (n >= 1000000) return numToWords(Math.floor(n/1000000))+" milyon "+(n%1000000>0?numToWords(n%1000000):"");
  if (n >= 1000) return numToWords(Math.floor(n/1000))+" bin "+(n%1000>0?numToWords(n%1000):"");
  if (n >= 100) return ones[Math.floor(n/100)]+(Math.floor(n/100)===1?"":"")+" yüz "+(n%100>0?numToWords(n%100):"");
  if (n >= 10) return tens[Math.floor(n/10)]+" "+(n%10>0?ones[n%10]:"");
  return ones[n];
}
function amountInWords(amount: number): string {
  const lira = Math.floor(amount);
  const kurus = Math.round((amount - lira) * 100);
  let s = numToWords(lira).trim() + " Türk Lirası";
  if (kurus > 0) s += " " + numToWords(kurus).trim() + " Kuruş";
  return s.replace(/\s+/g," ").trim();
}

interface Props {
  receipt: Receipt;
  onClose: () => void;
}

export default function TahsilatMakbuzu({ receipt, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const co = receipt.companies;

  function handlePrint() {
    const content = printRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank", "width=850,height=1200");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="tr"><head>
<meta charset="UTF-8">
<title>Tahsilat Makbuzu ${receipt.receipt_no}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#111;background:#fff;padding:0}
.page{max-width:794px;margin:0 auto;padding:36px 44px;min-height:1050px;position:relative}
.top-bar{height:6px;background:linear-gradient(90deg,#0052ff,#6366f1);border-radius:0 0 4px 4px;margin-bottom:28px}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:1.5px solid #e5e7ef}
.logo-wrap img{height:48px;object-fit:contain}
.logo-text{font-size:22px;font-weight:800;color:#0052ff;letter-spacing:-.5px}
.logo-sub{font-size:10px;color:#9ca3af;margin-top:3px}
.logo-contact{font-size:10px;color:#6b7280;margin-top:8px;line-height:1.6}
.doc-block{text-align:right}
.doc-title{font-size:20px;font-weight:800;color:#1a1d2e;text-transform:uppercase;letter-spacing:2px}
.doc-no{font-size:12px;color:#0052ff;font-weight:700;margin-top:6px}
.doc-date{font-size:11px;color:#6b7280;margin-top:3px}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
.party-box{border:1px solid #e5e7ef;border-radius:8px;padding:14px 16px}
.party-label{font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.7px;margin-bottom:8px}
.party-name{font-size:13px;font-weight:800;color:#1a1d2e;margin-bottom:4px}
.party-info{font-size:11px;color:#6b7280;line-height:1.65}
.amount-block{background:linear-gradient(135deg,#0052ff,#6366f1);border-radius:10px;padding:20px 28px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:center}
.amount-left .label{font-size:10px;color:rgba(255,255,255,.75);text-transform:uppercase;letter-spacing:.6px;font-weight:600}
.amount-left .value{font-size:30px;font-weight:800;color:#fff;margin-top:4px;letter-spacing:-.5px}
.amount-left .words{font-size:10px;color:rgba(255,255,255,.75);margin-top:5px;font-style:italic}
.amount-right{text-align:right}
.amount-right .pt-badge{background:rgba(255,255,255,.2);color:#fff;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700}
.details{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:22px}
.detail-box{border:1px solid #e5e7ef;border-radius:8px;padding:14px 16px}
.detail-label{font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.7px;margin-bottom:10px}
.detail-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed #f0f2f8;font-size:11px}
.detail-row:last-child{border-bottom:none}
.detail-row .dk{color:#6b7280}
.detail-row .dv{font-weight:700;color:#1a1d2e}
.notes-box{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:22px;font-size:11px;color:#92400e;line-height:1.65}
.notes-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px;color:#b45309}
.footer{margin-top:auto;padding-top:16px;border-top:1.5px solid #e5e7ef;display:flex;justify-content:space-between;align-items:flex-end}
.footer-info{font-size:10px;color:#9ca3af;line-height:1.65}
.sign-col{text-align:center;width:160px}
.sign-line{border-top:1px solid #374151;padding-top:6px;font-size:10px;color:#6b7280;margin-top:40px}
.bottom-bar{height:4px;background:linear-gradient(90deg,#0052ff,#6366f1);border-radius:4px 4px 0 0;margin-top:24px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="page">
  <div class="top-bar"></div>
  ${content}
  <div class="bottom-bar"></div>
</div>
</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "760px", maxHeight: "92vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.25)" }}
        onClick={e => e.stopPropagation()}>

        {/* Modal toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #e5e7ef", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#1a1d2e" }}>
            {receipt.receipt_no} — Önizleme
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handlePrint}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 16px", background: "#0052ff", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              <Printer size={14} /> Yazdır / PDF
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}><X size={20} /></button>
          </div>
        </div>

        {/* Preview body */}
        <div style={{ padding: "28px 32px", background: "#f8f9fb" }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "32px 36px", boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>

            {/* Printable content */}
            <div ref={printRef}>

              {/* Header */}
              <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "26px", paddingBottom: "20px", borderBottom: "1.5px solid #e5e7ef" }}>
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="Lider Network" style={{ height: "44px", objectFit: "contain", display: "block", marginBottom: "8px" }} />
                  <div style={{ fontSize: "10px", color: "#6b7280", lineHeight: 1.65 }}>
                    <div>Bilgi Teknolojileri Çözümleri</div>
                    <div>www.lidernetwork.com.tr</div>
                    <div>info@lidernetwork.com.tr</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "19px", fontWeight: 800, color: "#1a1d2e", textTransform: "uppercase", letterSpacing: "2px" }}>Tahsilat Makbuzu</div>
                  <div style={{ fontSize: "13px", color: "#0052ff", fontWeight: 700, marginTop: "7px" }}>{receipt.receipt_no}</div>
                  <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "3px" }}>Tarih: {fmtDate(receipt.receipt_date)}</div>
                </div>
              </div>

              {/* Parties */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "22px" }}>
                {/* Tahsil Eden */}
                <div style={{ border: "1px solid #e5e7ef", borderRadius: "8px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: "8px" }}>Tahsil Eden</div>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a1d2e", marginBottom: "5px" }}>Lider Network Bilgi Teknolojileri</div>
                  <div style={{ fontSize: "11px", color: "#6b7280", lineHeight: 1.65 }}>
                    <div>VKN: —</div>
                    <div>Vergi Dairesi: —</div>
                  </div>
                </div>
                {/* Alınan Şirket */}
                <div style={{ border: "1px solid #e5e7ef", borderRadius: "8px", padding: "14px 16px", background: "#fafbff" }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: "8px" }}>Alınan Şirket</div>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a1d2e", marginBottom: "5px" }}>{co?.name ?? "—"}</div>
                  <div style={{ fontSize: "11px", color: "#6b7280", lineHeight: 1.65 }}>
                    {co?.tax_no && <div>VKN: <strong style={{ color: "#1a1d2e" }}>{co.tax_no}</strong></div>}
                    {co?.tax_office && <div>Vergi Dairesi: <strong style={{ color: "#1a1d2e" }}>{co.tax_office}</strong></div>}
                    {co?.address && <div style={{ marginTop: "3px" }}>{co.address}</div>}
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div style={{ background: "linear-gradient(135deg,#0052ff,#6366f1)", borderRadius: "10px", padding: "18px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,.75)", textTransform: "uppercase", letterSpacing: ".6px", fontWeight: 600 }}>Tahsil Edilen Tutar</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#fff", marginTop: "4px", letterSpacing: "-.5px" }}>{fmt(receipt.amount, receipt.currency)}</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,.7)", marginTop: "5px", fontStyle: "italic" }}>{amountInWords(receipt.amount)}</div>
                </div>
                <div>
                  <span style={{ background: "rgba(255,255,255,.2)", color: "#fff", borderRadius: "20px", padding: "5px 16px", fontSize: "13px", fontWeight: 700 }}>
                    {PT_LABEL[receipt.payment_type]}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
                {/* Ödeme detayı */}
                <div style={{ border: "1px solid #e5e7ef", borderRadius: "8px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: "10px" }}>Ödeme Detayı</div>
                  <DRow k="Ödeme Türü" v={PT_LABEL[receipt.payment_type]} />
                  {receipt.payment_type === "cek" && receipt.check_no && <DRow k="Çek No" v={receipt.check_no} />}
                  {receipt.payment_type === "cek" && receipt.bank_name && <DRow k="Banka" v={receipt.bank_name} />}
                  {receipt.due_date && <DRow k="Vade Tarihi" v={fmtDate(receipt.due_date)} />}
                </div>
                {/* Belge bilgisi */}
                <div style={{ border: "1px solid #e5e7ef", borderRadius: "8px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: "10px" }}>Belge Bilgisi</div>
                  <DRow k="Makbuz No" v={receipt.receipt_no} />
                  <DRow k="Tahsilat Tarihi" v={fmtDate(receipt.receipt_date)} />
                  <DRow k="Para Birimi" v={receipt.currency} />
                </div>
              </div>

              {/* Check image */}
              {receipt.payment_type === "cek" && receipt.check_image_url && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: "10px" }}>Çek Görseli</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={receipt.check_image_url} alt="Çek" style={{ width: "100%", maxHeight: "240px", objectFit: "contain", border: "1px solid #e5e7ef", borderRadius: "8px", background: "#f8f9fb" }} />
                </div>
              )}

              {/* Notes */}
              {receipt.notes && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: "6px" }}>Açıklama</div>
                  <div style={{ fontSize: "12px", color: "#92400e", lineHeight: 1.65 }}>{receipt.notes}</div>
                </div>
              )}

              {/* Footer */}
              <div style={{ marginTop: "32px", paddingTop: "16px", borderTop: "1.5px solid #e5e7ef", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ fontSize: "10px", color: "#9ca3af", lineHeight: 1.65 }}>
                  <div style={{ fontWeight: 600, color: "#6b7280", marginBottom: "3px" }}>Lider Network Bilgi Teknolojileri</div>
                  <div>info@lidernetwork.com.tr</div>
                  <div>www.lidernetwork.com.tr</div>
                  <div style={{ marginTop: "6px", fontSize: "9px" }}>Bu makbuz bilgisayar ortamında düzenlenmiştir.</div>
                </div>
                <div style={{ textAlign: "center", width: "160px" }}>
                  <div style={{ borderTop: "1px solid #374151", paddingTop: "6px", fontSize: "10px", color: "#6b7280", marginTop: "44px" }}>Yetkili İmza</div>
                </div>
              </div>

            </div>{/* /printable */}
          </div>
        </div>
      </div>
    </div>
  );
}

function DRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px dashed #f0f2f8", fontSize: "11px" }}>
      <span style={{ color: "#6b7280" }}>{k}</span>
      <span style={{ fontWeight: 700, color: "#1a1d2e" }}>{v}</span>
    </div>
  );
}
