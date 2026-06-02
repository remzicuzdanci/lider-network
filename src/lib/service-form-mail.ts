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

function row(label: string, value?: string, pre = false): string {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:14px 18px;border-bottom:1px solid #eef2f7;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.4px;width:38%;vertical-align:top;">${esc(label)}</td>
      <td style="padding:14px 18px;border-bottom:1px solid #eef2f7;font-size:14px;color:#1a1d2e;${pre ? "white-space:pre-wrap;line-height:1.6;" : ""}">${esc(value)}</td>
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
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#0038c7,#0052ff);padding:32px 28px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;letter-spacing:1px;">LİDER NETWORK</h1>
      <p style="color:#cdd9ff;margin:8px 0 0;font-size:14px;">Servis / Hizmet Formu</p>
    </div>
    <div style="padding:26px 28px 8px;">
      <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 18px;">
        Sayın <strong>${esc(data.customer_name || "Müşterimiz")}</strong>,<br/>
        Tarafınıza verdiğimiz hizmete ilişkin servis form detayları aşağıdadır.
        Bizi tercih ettiğiniz için teşekkür ederiz.
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #eef2f7;border-radius:10px;overflow:hidden;">
        ${row("Tarih", dateStr)}
        ${row("Müşteri", data.customer_name)}
        ${data.company_name ? row("Firma", data.company_name) : ""}
        ${row("Telefon", data.customer_phone)}
        ${row("Adres", data.customer_address, true)}
        ${row("Yapılan Hizmet", data.service_description, true)}
        ${row("Teslim Edilenler", data.items_delivered, true)}
        ${row("Notlar", data.notes, true)}
        ${row("Yetkili", data.signed_by)}
      </table>
    </div>
    <div style="padding:18px 28px 28px;">
      <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0;">
        Herhangi bir sorunuz olursa bu e-postayı yanıtlayarak veya destek hattımızdan bize ulaşabilirsiniz.
      </p>
    </div>
    <div style="background:#f8fafc;padding:20px 28px;border-top:1px solid #eef2f7;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Lider Network. Tüm hakları saklıdır.</p>
      <p style="color:#94a3b8;font-size:12px;margin:6px 0 0;">www.lidernetwork.com.tr</p>
    </div>
  </div>
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
