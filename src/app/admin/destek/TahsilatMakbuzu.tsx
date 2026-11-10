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
  notes?: string | null;
  created_at: string;
  companies?: { name: string } | null;
}

const PT_LABEL: Record<string, string> = {
  cek: "Çek",
  nakit: "Nakit",
  kredi_karti: "Kredi Kartı",
};

function fmt(n: number, cur: string) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: cur, minimumFractionDigits: 2 }).format(n);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

interface Props {
  receipt: Receipt;
  onClose: () => void;
}

export default function TahsilatMakbuzu({ receipt, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const content = printRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank", "width=794,height=1123");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<title>Tahsilat Makbuzu ${receipt.receipt_no}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1a1d2e;background:#fff;padding:40px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #0052ff}
  .logo-block .company{font-size:22px;font-weight:800;color:#0052ff}
  .logo-block .tagline{font-size:11px;color:#6b7280;margin-top:3px}
  .doc-block{text-align:right}
  .doc-block .title{font-size:18px;font-weight:800;color:#1a1d2e;text-transform:uppercase;letter-spacing:1px}
  .doc-block .no{font-size:12px;color:#6b7280;margin-top:4px}
  .doc-block .date{font-size:12px;color:#6b7280;margin-top:2px}
  .section{margin-bottom:24px}
  .section-label{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px}
  .info-box{background:#f8f9fb;border-radius:8px;padding:14px 18px}
  .info-row{display:flex;gap:8px;margin-bottom:6px;font-size:13px}
  .info-row:last-child{margin-bottom:0}
  .info-key{color:#6b7280;min-width:120px}
  .info-val{font-weight:600;color:#1a1d2e}
  .amount-box{background:#0052ff;color:#fff;border-radius:10px;padding:20px 24px;text-align:center;margin:24px 0}
  .amount-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;opacity:.8}
  .amount-value{font-size:28px;font-weight:800;margin-top:4px}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7ef;display:flex;justify-content:space-between;align-items:flex-end}
  .footer-note{font-size:11px;color:#9ca3af;line-height:1.6}
  .sign-box{text-align:center;width:160px}
  .sign-line{border-top:1px solid #1a1d2e;padding-top:6px;font-size:11px;color:#6b7280}
  .notes-box{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.6}
</style></head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  const companyName = receipt.companies?.name ?? "—";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.2)" }}
        onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #e5e7ef" }}>
          <span style={{ fontSize: "15px", fontWeight: 800, color: "#1a1d2e" }}>Tahsilat Makbuzu — {receipt.receipt_no}</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handlePrint}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "#0052ff", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              <Printer size={14} /> Yazdır / PDF
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}><X size={20} /></button>
          </div>
        </div>

        {/* Printable area */}
        <div ref={printRef} style={{ padding: "32px" }}>
          {/* Header */}
          <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", paddingBottom: "18px", borderBottom: "2px solid #0052ff" }}>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#0052ff" }}>Lider Network</div>
              <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "3px" }}>Bilgi Teknolojileri Çözümleri</div>
              <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>www.lidernetwork.com.tr</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "17px", fontWeight: 800, color: "#1a1d2e", textTransform: "uppercase", letterSpacing: "1px" }}>Tahsilat Makbuzu</div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>No: <strong>{receipt.receipt_no}</strong></div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>Tarih: {fmtDate(receipt.receipt_date)}</div>
            </div>
          </div>

          {/* Amount box */}
          <div style={{ background: "#0052ff", color: "#fff", borderRadius: "10px", padding: "18px 24px", textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", opacity: .8 }}>Tahsil Edilen Tutar</div>
            <div style={{ fontSize: "26px", fontWeight: 800, marginTop: "4px" }}>{fmt(receipt.amount, receipt.currency)}</div>
          </div>

          {/* Company */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "8px" }}>Alınan Şirket</div>
            <div style={{ background: "#f8f9fb", borderRadius: "8px", padding: "12px 16px", fontSize: "14px", fontWeight: 700, color: "#1a1d2e" }}>{companyName}</div>
          </div>

          {/* Payment details */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "8px" }}>Ödeme Bilgileri</div>
            <div style={{ background: "#f8f9fb", borderRadius: "8px", padding: "12px 16px" }}>
              <Row label="Ödeme Türü" value={PT_LABEL[receipt.payment_type]} />
              {receipt.payment_type === "cek" && receipt.check_no && <Row label="Çek No" value={receipt.check_no} />}
              {receipt.payment_type === "cek" && receipt.bank_name && <Row label="Banka" value={receipt.bank_name} />}
              {receipt.payment_type === "cek" && receipt.due_date && <Row label="Vade Tarihi" value={fmtDate(receipt.due_date)} />}
            </div>
          </div>

          {/* Notes */}
          {receipt.notes && (
            <div style={{ marginBottom: "18px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "8px" }}>Açıklama</div>
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: "#92400e", lineHeight: 1.6 }}>{receipt.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: "36px", paddingTop: "16px", borderTop: "1px solid #e5e7ef", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: "11px", color: "#9ca3af", lineHeight: 1.6 }}>
              <div>Lider Network Bilgi Teknolojileri</div>
              <div>info@lidernetwork.com.tr</div>
              <div style={{ marginTop: "4px", fontSize: "10px" }}>Bu makbuz bilgisayar ortamında düzenlenmiştir.</div>
            </div>
            <div style={{ textAlign: "center", width: "160px" }}>
              <div style={{ borderTop: "1px solid #1a1d2e", paddingTop: "6px", fontSize: "11px", color: "#6b7280" }}>Yetkili İmza</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "6px", fontSize: "13px" }}>
      <span style={{ color: "#6b7280", minWidth: "120px" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#1a1d2e" }}>{value}</span>
    </div>
  );
}
