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

  const rows = (d.items || []).map((it, i) => `<tr bgcolor="${i % 2 ? "#f6f8fc" : "#ffffff"}">
    <td style="padding:9px 14px;font-size:13px;color:#1f2937;border-bottom:1px solid #e8edf3;font-family:Arial,sans-serif"><b style="color:#0052ff">${i + 1}.</b>&nbsp; ${esc(it.name)}</td>
    <td align="center" style="padding:9px 12px;font-size:13px;color:#334155;border-bottom:1px solid #e8edf3;white-space:nowrap;font-family:Arial,sans-serif">${it.qty} ${esc(it.unit || "adet")}</td>
    <td style="padding:9px 14px;font-size:12px;color:#64748b;border-bottom:1px solid #e8edf3;font-family:Arial,sans-serif">${esc(it.serial || "—")}</td>
  </tr>`).join("");

  // E-posta istemcileri (Outlook vb.) gradient/arka plan CSS'ini yok sayar.
  // Bu yüzden tablo + bgcolor tabanlı, belge/form formatında, sade ve kurumsal tasarım.
  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#eef1f6;font-family:Arial,Helvetica,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#eef1f6" style="background:#eef1f6"><tr><td align="center" style="padding:26px 14px">
      <table width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:640px;background:#ffffff;border:1px solid #e2e7ef;border-radius:6px;overflow:hidden">

        <!-- Üst: logo (beyaz şerit) + firma adı -->
        <tr><td style="padding:22px 34px 16px 34px;border-bottom:1px solid #eef2f7">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle">
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" height="38" style="height:38px;width:auto;display:block;border:0" />
            </td>
            <td align="right" style="vertical-align:middle;font-size:11px;color:#94a3b8;line-height:1.5;font-family:Arial,sans-serif">
              Lider Network Teknoloji Danışmanlık<br>+90 312 232 02 88 · lidernetwork.com.tr
            </td>
          </tr></table>
        </td></tr>

        <!-- Belge başlık barı (solid renk -> Outlook uyumlu) -->
        <tr><td bgcolor="#0052ff" style="background:#0052ff;padding:13px 34px">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;color:#ffffff;font-size:17px;font-weight:bold;letter-spacing:.5px;font-family:Arial,sans-serif">ÜRÜN TESLİM TUTANAĞI</td>
            <td align="right" style="vertical-align:middle;color:#ffffff;font-size:13px;font-weight:bold;font-family:Arial,sans-serif"><span style="color:#bcd2ff">No:</span> ${esc(d.note_no)}</td>
          </tr></table>
        </td></tr>
        <tr><td bgcolor="#ff5e07" style="background:#ff5e07;font-size:0;line-height:3px;height:3px">&nbsp;</td></tr>

        <!-- Bilgi bloğu: Teslim Edilen / Tarih -->
        <tr><td style="padding:22px 34px 6px 34px">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e6ebf2;border-radius:5px">
            <tr>
              <td width="62%" style="padding:13px 16px;border-right:1px solid #eef2f7;vertical-align:top">
                <div style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#94a3b8;font-weight:bold;font-family:Arial,sans-serif">Teslim Edilen</div>
                <div style="font-size:15px;font-weight:bold;color:#0f172a;margin-top:4px;font-family:Arial,sans-serif">${esc(d.customer_name || "—")}</div>
                ${d.customer_address ? `<div style="font-size:12px;color:#64748b;margin-top:3px;font-family:Arial,sans-serif">${esc(d.customer_address)}</div>` : ""}
              </td>
              <td style="padding:13px 16px;vertical-align:top">
                <div style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#94a3b8;font-weight:bold;font-family:Arial,sans-serif">Teslim Tarihi</div>
                <div style="font-size:14px;font-weight:bold;color:#0f172a;margin-top:4px;font-family:Arial,sans-serif">${fmtDate(d.delivery_date)}</div>
                ${d.delivered_by ? `<div style="font-size:11px;color:#64748b;margin-top:6px;font-family:Arial,sans-serif">Teslim Eden: <b style="color:#334155">${esc(d.delivered_by)}</b></div>` : ""}
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Açıklama -->
        <tr><td style="padding:14px 34px 0 34px;font-size:12.5px;color:#475569;font-family:Arial,sans-serif">
          Aşağıda belirtilen ürünler tarafınıza <b style="color:#0f172a">eksiksiz ve sağlam</b> olarak teslim edilmiştir.
        </td></tr>

        <!-- Ürün tablosu -->
        <tr><td style="padding:10px 34px 0 34px">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e6ebf2;border-radius:5px;overflow:hidden">
            <tr bgcolor="#0f172a" style="background:#0f172a">
              <th align="left" style="padding:10px 14px;font-size:11px;color:#ffffff;text-transform:uppercase;letter-spacing:.4px;font-family:Arial,sans-serif">Ürün / Açıklama</th>
              <th align="center" style="padding:10px 12px;font-size:11px;color:#ffffff;text-transform:uppercase;letter-spacing:.4px;font-family:Arial,sans-serif">Miktar</th>
              <th align="left" style="padding:10px 14px;font-size:11px;color:#ffffff;text-transform:uppercase;letter-spacing:.4px;font-family:Arial,sans-serif">Seri No</th>
            </tr>
            ${rows}
          </table>
        </td></tr>

        ${d.notes ? `<tr><td style="padding:14px 34px 0 34px"><table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background:#f8fafc;border:1px solid #e8edf3;border-radius:5px"><tr><td style="padding:12px 15px;font-size:12.5px;color:#475569;font-family:Arial,sans-serif;white-space:pre-wrap">${esc(d.notes)}</td></tr></table></td></tr>` : ""}

        <!-- İmza alanları -->
        <tr><td style="padding:36px 34px 22px 34px">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="50%" style="padding-right:18px;vertical-align:bottom">
              <div style="border-top:1px solid #94a3b8;padding-top:7px;font-size:12px;color:#374151;font-family:Arial,sans-serif">
                <b style="color:#0f172a">Teslim Eden</b><br>${esc(d.delivered_by || "Lider Network")}
                <div style="color:#94a3b8;font-size:11px;margin-top:3px">Kaşe / İmza</div>
              </div>
            </td>
            <td width="50%" style="padding-left:18px;vertical-align:bottom">
              <div style="border-top:1px solid #94a3b8;padding-top:7px;font-size:12px;color:#374151;font-family:Arial,sans-serif">
                <b style="color:#0f172a">Teslim Alan</b><br>${esc(d.received_by || d.customer_name || "—")}
                <div style="color:#94a3b8;font-size:11px;margin-top:3px">Kaşe / İmza / Tarih</div>
              </div>
            </td>
          </tr></table>
        </td></tr>

        <!-- Footer -->
        <tr><td bgcolor="#0f172a" style="background:#0f172a;padding:14px 34px;text-align:center;font-size:11px;color:#cbd5e1;font-family:Arial,sans-serif">
          <strong style="color:#ffffff;letter-spacing:1px">LİDER NETWORK</strong> &nbsp;·&nbsp; +90 312 232 02 88 &nbsp;·&nbsp; info@lidernetwork.com.tr &nbsp;·&nbsp; www.lidernetwork.com.tr
        </td></tr>

      </table>
      <div style="font-size:11px;color:#9aa4b2;margin-top:12px;line-height:1.6;font-family:Arial,sans-serif;max-width:600px">İşbu teslim tutanağı, yukarıda belirtilen ürünlerin eksiksiz ve sağlam şekilde teslim alındığını teyit eder. Lider Network Teknoloji Danışmanlık Tic. Ltd. Şti. tarafından düzenlenmiştir.</div>
    </td></tr></table>
  </body></html>`;

  await transporter.sendMail({
    from: `"Lider Network" <${FROM}>`,
    to: d.to,
    subject: `Ürün Teslim Tutanağı ${d.note_no} — Lider Network`,
    html,
    replyTo: FROM,
  });
}
