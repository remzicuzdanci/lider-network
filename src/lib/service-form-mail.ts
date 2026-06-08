import nodemailer from "nodemailer";

export interface ServiceFormMailData {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  service_description?: string;
  items_delivered?: string;
  notes?: string;
  signed_by?: string;
  signed_at?: string;
  company_name?: string;
}

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

const DESTEK_FROM =
  process.env.SMTP_DESTEK_FROM ||
  process.env.SMTP_FROM ||
  process.env.SMTP_DESTEK_USER ||
  process.env.SMTP_USER;

const DESTEK_BCC =
  process.env.SMTP_DESTEK_USER || process.env.SMTP_USER || undefined;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(d?: string): string {
  const date = d ? new Date(d) : new Date();
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

function row(label: string, value?: string, accent = "#0052ff"): string {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:0 0 12px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;">
          <tr>
            <td style="padding:14px 18px;background:#f8fafc;border-left:3px solid ${accent};border-radius:8px;">
              <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px;">${esc(label)}</div>
              <div style="font-size:15px;color:#1a1d2e;line-height:1.55;white-space:pre-wrap;">${esc(value)}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export async function sendServiceFormEmail(data: ServiceFormMailData): Promise<void> {
  if (!data.customer_email) throw new Error("Müşteri e-postası yok");

  const transporter = createTransporter();
  const dateStr = formatDate(data.signed_at);
  const subject = `Lider Network — Servis Formu (${data.customer_name || "Müşteri"})`;

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Segoe UI',Roboto,Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:28px 14px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 30px rgba(15,23,42,.10);">

        <!-- Header -->
        <tr>
          <td bgcolor="#0052ff" style="background:#0052ff;padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:34px 32px;" align="left">
                  <div style="display:inline-block;background:#ffffff;border-radius:10px;padding:10px 16px;">
                    <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" width="150" height="79" style="display:block;width:150px;height:auto;border:0;outline:none;text-decoration:none" />
                  </div>
                  <div style="color:#cdd9ff;font-size:14px;margin-top:14px;font-weight:500;">📋 Servis / Hizmet Formu</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:30px 32px 6px;">
            <p style="font-size:16px;color:#1a1d2e;line-height:1.6;margin:0 0 6px;font-weight:600;">
              Sayın ${esc(data.customer_name || "Müşterimiz")},
            </p>
            <p style="font-size:14px;color:#64748b;line-height:1.65;margin:0 0 22px;">
              Tarafınıza sunduğumuz hizmete ilişkin servis formu detayları aşağıdadır. Bizi tercih ettiğiniz için teşekkür ederiz.
            </p>
          </td>
        </tr>

        <!-- Detail cards -->
        <tr>
          <td style="padding:0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${row("Tarih", dateStr, "#0052ff")}
              ${row("Müşteri", data.customer_name, "#0052ff")}
              ${data.company_name ? row("Firma", data.company_name, "#7c3aed") : ""}
              ${row("Telefon", data.customer_phone, "#0891b2")}
              ${row("Adres", data.customer_address, "#d97706")}
              ${row("Yapılan Hizmet", data.service_description, "#15803d")}
              ${row("Teslim Edilenler", data.items_delivered, "#15803d")}
              ${row("Notlar", data.notes, "#64748b")}
              ${row("Yetkili", data.signed_by, "#0052ff")}
            </table>
          </td>
        </tr>

        <!-- Note -->
        <tr>
          <td style="padding:8px 32px 26px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:16px 18px;background:#eff6ff;border-radius:10px;">
                <p style="font-size:13px;color:#1e40af;line-height:1.6;margin:0;">
                  💬 Herhangi bir sorunuz olursa bu e-postayı yanıtlayarak veya destek hattımızdan bize ulaşabilirsiniz.
                </p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td bgcolor="#0f172a" style="background:#0f172a;padding:24px 32px;text-align:center;">
            <p style="color:#ffffff;font-size:14px;font-weight:700;margin:0 0 4px;letter-spacing:.5px;">LİDER NETWORK</p>
            <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">
              <a href="https://www.lidernetwork.com.tr" style="color:#7dd3fc;text-decoration:none;">www.lidernetwork.com.tr</a>
            </p>
            <p style="color:#64748b;font-size:11px;margin:6px 0 0;">© ${new Date().getFullYear()} Lider Network. Tüm hakları saklıdır.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const text = [
    "LİDER NETWORK — Servis / Hizmet Formu",
    "=".repeat(40),
    `Tarih: ${dateStr}`,
    `Müşteri: ${data.customer_name || "-"}`,
    data.company_name ? `Firma: ${data.company_name}` : "",
    data.customer_phone ? `Telefon: ${data.customer_phone}` : "",
    data.customer_address ? `Adres: ${data.customer_address}` : "",
    "",
    `Yapılan Hizmet:\n${data.service_description || "-"}`,
    data.items_delivered ? `\nTeslim Edilenler:\n${data.items_delivered}` : "",
    data.notes ? `\nNotlar:\n${data.notes}` : "",
    data.signed_by ? `\nYetkili: ${data.signed_by}` : "",
    "",
    "=".repeat(40),
    "Lider Network - www.lidernetwork.com.tr",
  ].filter(Boolean).join("\n");

  await transporter.sendMail({
    from: `"Lider Network Destek" <${DESTEK_FROM}>`,
    to: data.customer_email,
    bcc: DESTEK_BCC,
    replyTo: DESTEK_FROM,
    subject,
    html,
    text,
  });
}
