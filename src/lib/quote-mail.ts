import nodemailer from "nodemailer";
import QRCode from "qrcode";

export interface QuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  kdv_rate: number;
  unit?: string;
}

export interface QuoteMailData {
  quote_no: string;
  customer_name?: string;
  company_name?: string;
  quote_date?: string;
  valid_until?: string;
  currency: string;
  description?: string;
  items: QuoteItem[];
  subtotal: number;
  discount_total: number;
  net_total: number;
  kdv_total: number;
  grand_total: number;
  toEmail: string;
  pdf?: Buffer;
  pdfName?: string;
  approvalUrl?: string;
}

// Teklifler teklif@lidernetwork.com.tr hesabından gider (Gmail).
// SMTP_TEKLIF_USER/PASS yoksa destek hesabına düşer.
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_TEKLIF_USER || process.env.SMTP_DESTEK_USER || process.env.SMTP_USER,
      pass: process.env.SMTP_TEKLIF_PASS || process.env.SMTP_DESTEK_PASS || process.env.SMTP_PASS,
    },
  });
}

const FROM =
  process.env.SMTP_TEKLIF_FROM ||
  process.env.SMTP_TEKLIF_USER ||
  "teklif@lidernetwork.com.tr";

// Teklif maillerinde her zaman CC'lenecekler (env ile değiştirilebilir)
const QUOTE_CC = (process.env.QUOTE_CC ||
  "remzi.cuzdanci@lidernetwork.com.tr,yunus.oztekin@lidernetwork.com.tr")
  .split(",").map(s => s.trim()).filter(Boolean);

function esc(s: string): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

const SYM: Record<string, string> = { TL: "₺", TRY: "₺", USD: "$", EUR: "€" };
function money(n: number, cur: string): string {
  const sym = SYM[cur] || cur + " ";
  return `${sym}${Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(d?: string): string {
  return d ? new Date(d).toLocaleDateString("tr-TR") : "—";
}

export async function sendQuoteEmail(data: QuoteMailData): Promise<void> {
  if (!data.toEmail) throw new Error("Alıcı e-postası yok");
  const transporter = createTransporter();
  const cur = data.currency;
  const subject = `Lider Network — Teklif ${data.quote_no}`;

  // QR kodu (onay URL'i varsa)
  let qrBuffer: Buffer | null = null;
  if (data.approvalUrl) {
    try {
      qrBuffer = await QRCode.toBuffer(data.approvalUrl, { margin: 1, width: 200, color: { dark: "#0f172a", light: "#ffffff" } });
    } catch { /* opsiyonel */ }
  }

  const rows = data.items.map((it, i) => {
    const gross = it.quantity * it.unit_price;
    const net = gross - gross * it.discount / 100;
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;font-size:13px;color:#1a1d2e;">${i + 1}. ${esc(it.description)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;font-size:13px;color:#475569;text-align:center;white-space:nowrap;">${it.quantity} ${esc(it.unit || "")}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;font-size:13px;color:#475569;text-align:right;white-space:nowrap;">${money(it.unit_price, cur)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;font-size:13px;color:#475569;text-align:center;">%${it.discount || 0}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;font-size:13px;color:#1a1d2e;text-align:right;font-weight:700;white-space:nowrap;">${money(net, cur)}</td>
      </tr>`;
  }).join("");

  const html = `
<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:28px 14px;">
    <tr><td align="center">
      <table role="presentation" width="680" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 30px rgba(15,23,42,.10);">
        <tr><td bgcolor="#0052ff" style="background:#0052ff;padding:26px 32px;">
          <div style="display:inline-block;background:#ffffff;border-radius:9px;padding:8px 14px;margin-bottom:14px;">
            <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" width="140" height="73" style="display:block;width:140px;height:auto;border:0;" />
          </div>
          <div style="color:#ffffff;font-size:20px;font-weight:800;">📄 Fiyat Teklifi</div>
          <div style="color:#cdd9ff;font-size:13px;margin-top:6px;">Teklif No: <strong style="color:#fff;">${esc(data.quote_no)}</strong></div>
        </td></tr>

        <tr><td style="padding:26px 32px 6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr>
              <td style="font-size:13px;color:#64748b;vertical-align:top;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;margin-bottom:4px;">Müşteri</div>
                <div style="font-size:15px;color:#1a1d2e;font-weight:700;">${esc(data.company_name || data.customer_name || "—")}</div>
              </td>
              <td align="right" style="font-size:13px;color:#64748b;vertical-align:top;">
                <div>Tarih: <strong style="color:#1a1d2e;">${fmtDate(data.quote_date)}</strong></div>
                <div>Geçerlilik: <strong style="color:#1a1d2e;">${fmtDate(data.valid_until)}</strong></div>
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eef2f7;border-radius:10px;overflow:hidden;">
            <tr style="background:#f8fafc;">
              <th style="padding:11px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:.4px;">Açıklama</th>
              <th style="padding:11px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:.4px;">Miktar</th>
              <th style="padding:11px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:.4px;">Fiyat</th>
              <th style="padding:11px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:.4px;">İsk.</th>
              <th style="padding:11px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:.4px;">Net</th>
            </tr>
            ${rows}
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
            <tr><td align="right">
              <table role="presentation" cellpadding="0" cellspacing="0" style="min-width:260px;">
                <tr><td style="padding:4px 0;font-size:13px;color:#64748b;">Brüt Toplam</td><td align="right" style="padding:4px 0 4px 24px;font-size:13px;color:#1a1d2e;">${money(data.subtotal, cur)}</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#64748b;">İndirim</td><td align="right" style="padding:4px 0 4px 24px;font-size:13px;color:#dc2626;">- ${money(data.discount_total, cur)}</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#64748b;">Net Toplam</td><td align="right" style="padding:4px 0 4px 24px;font-size:13px;color:#1a1d2e;">${money(data.net_total, cur)}</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#64748b;">KDV</td><td align="right" style="padding:4px 0 4px 24px;font-size:13px;color:#1a1d2e;">${money(data.kdv_total, cur)}</td></tr>
                <tr><td style="padding:10px 0 0;font-size:15px;color:#0052ff;font-weight:800;border-top:2px solid #eef2f7;">GENEL TOPLAM</td><td align="right" style="padding:10px 0 0 24px;font-size:17px;color:#0052ff;font-weight:900;border-top:2px solid #eef2f7;white-space:nowrap;">${money(data.grand_total, cur)}</td></tr>
              </table>
            </td></tr>
          </table>

          ${data.description ? `<div style="margin-top:18px;padding:14px 16px;background:#f8fafc;border-radius:10px;font-size:13px;color:#475569;line-height:1.6;white-space:pre-wrap;">${esc(data.description)}</div>` : ""}

          ${qrBuffer ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr>
              <td style="background:#f0f4ff;border-radius:14px;padding:20px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:20px;">
                      <img src="cid:qr-approval" width="100" height="100" alt="Onay QR" style="display:block;border-radius:8px;border:3px solid #ffffff;box-shadow:0 2px 10px rgba(0,82,255,0.15);" />
                    </td>
                    <td style="vertical-align:middle;">
                      <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:6px;">Teklifi Onaylayın veya Reddedin</div>
                      <div style="font-size:12px;color:#64748b;line-height:1.6;margin-bottom:12px;">QR kodu telefonunuzla okutarak teklife hızlıca yanıt verebilirsiniz.</div>
                      <a href="${data.approvalUrl}" style="display:inline-block;background:#0052ff;color:#ffffff;font-size:12px;font-weight:700;padding:8px 18px;border-radius:8px;text-decoration:none;">Teklifi İncele →</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>` : ""}
        </td></tr>

        <tr><td style="padding:8px 32px 24px;"><p style="font-size:13px;color:#64748b;margin:0;">Teklifimizle ilgili her türlü sorunuz için bu e-postayı yanıtlayabilirsiniz. Bizi tercih ettiğiniz için teşekkür ederiz.</p></td></tr>

        <tr><td bgcolor="#0f172a" style="background:#0f172a;padding:22px 32px;text-align:center;">
          <p style="color:#fff;font-size:13px;font-weight:700;margin:0 0 4px;">LİDER NETWORK</p>
          <p style="color:#94a3b8;font-size:12px;margin:0;"><a href="https://www.lidernetwork.com.tr" style="color:#7dd3fc;text-decoration:none;">www.lidernetwork.com.tr</a> · +90 312 232 02 88</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`.trim();

  await transporter.sendMail({
    from: `"Lider Network" <${FROM}>`,
    to: data.toEmail,
    cc: QUOTE_CC.length ? QUOTE_CC : undefined,
    replyTo: FROM,
    subject,
    html,
    attachments: [
      ...(data.pdf ? [{ filename: data.pdfName || `Teklif-${data.quote_no}.pdf`, content: data.pdf, contentType: "application/pdf" }] : []),
      ...(qrBuffer ? [{ filename: "qr.png", content: qrBuffer, contentType: "image/png", cid: "qr-approval" }] : []),
    ],
  });
}
