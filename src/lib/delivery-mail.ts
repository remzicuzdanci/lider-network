import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_DESTEK_USER || process.env.SMTP_USER,
      pass: process.env.SMTP_DESTEK_PASS || process.env.SMTP_PASS,
    },
  });
}

const FROM = process.env.SMTP_DESTEK_FROM || process.env.SMTP_FROM || process.env.SMTP_DESTEK_USER || process.env.SMTP_USER;

function esc(s: string): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export interface DeliveryItem { name: string; qty: number; serial?: string; unit?: string }
export interface DeliveryMailData {
  note_no: string;
  customer_name: string | null;
  customer_address?: string | null;
  delivery_date?: string | null;
  delivered_by?: string | null;
  received_by?: string | null;
  items: DeliveryItem[];
  notes?: string | null;
  to: string;
}

function fmtDate(s?: string | null) {
  if (!s) return "—";
  return new Date(s + "T00:00:00").toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

export async function sendDeliveryNoteEmail(d: DeliveryMailData): Promise<void> {
  const transporter = createTransporter();

  const rows = (d.items || []).map((it, i) => `<tr style="background:${i % 2 ? "#f5f8ff" : "#fff"}">
    <td style="padding:10px 12px;font-size:13px;color:#1f2937;border-bottom:1px solid #eef2f7"><b style="color:#0052ff">${i + 1}.</b> ${esc(it.name)}</td>
    <td style="padding:10px 12px;font-size:13px;color:#475569;text-align:center;border-bottom:1px solid #eef2f7;white-space:nowrap">${it.qty} ${esc(it.unit || "adet")}</td>
    <td style="padding:10px 12px;font-size:12px;color:#6b7280;border-bottom:1px solid #eef2f7">${esc(it.serial || "—")}</td>
  </tr>`).join("");

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"></head>
  <body style="font-family:Arial,sans-serif;background:#f4f6fb;margin:0;padding:24px">
    <div style="max-width:660px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.07)">
      <div style="background:linear-gradient(120deg,#0038c7,#0052ff);padding:26px 30px">
        <table style="width:100%"><tr>
          <td style="vertical-align:middle">
            <span style="display:inline-block;background:#fff;border-radius:10px;padding:8px 16px">
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style="height:42px;display:block" />
            </span>
          </td>
          <td style="text-align:right;vertical-align:middle">
            <div style="color:#fff;font-size:20px;font-weight:800;letter-spacing:.5px">ÜRÜN TESLİM TUTANAĞI</div>
            <div style="display:inline-block;background:rgba(255,255,255,.18);color:#fff;border-radius:16px;padding:4px 13px;font-size:12px;font-weight:700;margin-top:8px">${esc(d.note_no)}</div>
          </td>
        </tr></table>
      </div>
      <div style="height:4px;background:#ff5e07"></div>
      <div style="padding:24px 30px">
        <table style="width:100%;margin-bottom:18px"><tr>
          <td style="vertical-align:top;width:60%">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#94a3b8;font-weight:800">Teslim Edilen</div>
            <div style="font-size:15px;font-weight:800;color:#0f172a;margin-top:3px">${esc(d.customer_name || "—")}</div>
            ${d.customer_address ? `<div style="font-size:12px;color:#64748b;margin-top:3px">${esc(d.customer_address)}</div>` : ""}
          </td>
          <td style="vertical-align:top;text-align:right">
            <div style="font-size:12px;color:#64748b">Teslim Tarihi: <b style="color:#0f172a">${fmtDate(d.delivery_date)}</b></div>
          </td>
        </tr></table>

        <p style="font-size:13px;color:#475569;margin:0 0 8px">Aşağıda belirtilen ürünler tarafınıza eksiksiz ve sağlam olarak teslim edilmiştir:</p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #eef2f7;border-radius:8px;overflow:hidden">
          <thead><tr style="background:#0f172a">
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#fff;text-transform:uppercase">Ürün / Açıklama</th>
            <th style="padding:10px 12px;text-align:center;font-size:11px;color:#fff;text-transform:uppercase">Miktar</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#fff;text-transform:uppercase">Seri No</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${d.notes ? `<div style="margin-top:16px;padding:13px 15px;background:#f8fafc;border:1px solid #e8edf3;border-radius:9px;font-size:12.5px;color:#475569;white-space:pre-wrap">${esc(d.notes)}</div>` : ""}

        <table style="width:100%;margin-top:34px"><tr>
          <td style="width:50%;padding-right:20px;vertical-align:top">
            <div style="height:40px"></div>
            <div style="border-top:1.5px solid #475569;padding-top:7px;font-size:12px">
              <b style="color:#0f172a">Teslim Eden</b><br>${esc(d.delivered_by || "Lider Network")}
              <div style="color:#94a3b8;font-size:11px;margin-top:2px">Kaşe / İmza</div>
            </div>
          </td>
          <td style="width:50%;padding-left:20px;vertical-align:top">
            <div style="height:40px"></div>
            <div style="border-top:1.5px solid #475569;padding-top:7px;font-size:12px">
              <b style="color:#0f172a">Teslim Alan</b><br>${esc(d.received_by || d.customer_name || "—")}
              <div style="color:#94a3b8;font-size:11px;margin-top:2px">Kaşe / İmza / Tarih</div>
            </div>
          </td>
        </tr></table>
      </div>
      <div style="background:#0f172a;color:#cbd5e1;padding:16px 30px;text-align:center;font-size:11px">
        <strong style="color:#fff;letter-spacing:1px">LİDER NETWORK</strong> · +90 312 232 02 88 · info@lidernetwork.com.tr · www.lidernetwork.com.tr
      </div>
    </div>
  </body></html>`;

  await transporter.sendMail({
    from: `"Lider Network" <${FROM}>`,
    to: d.to,
    subject: `Ürün Teslim Tutanağı ${d.note_no} — Lider Network`,
    html,
    replyTo: FROM,
  });
}
