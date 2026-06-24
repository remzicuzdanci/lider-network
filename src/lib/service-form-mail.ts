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
  form_type?: "service" | "delivery"; // servis mi, teslimat mı
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

// Renders a 2-column info row inside a table
function infoRow(col1Label: string, col1Value: string | undefined, col2Label: string, col2Value: string | undefined): string {
  const cell = (label: string, value: string | undefined) =>
    `<td width="50%" style="padding:0 8px 0 0;vertical-align:top;">
      <div style="background:#f8fafc;border-radius:8px;padding:11px 14px;">
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px;">${esc(label)}</div>
        <div style="font-size:14px;color:#1a1d2e;font-weight:600;line-height:1.4;">${value ? esc(value) : '<span style="color:#cbd5e1;">—</span>'}</div>
      </div>
    </td>`;
  return `<tr><td style="padding:0 0 8px 0;" colspan="2">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      ${cell(col1Label, col1Value)}
      <td width="8" style="padding:0;"></td>
      ${cell(col2Label, col2Value)}
    </tr></table>
  </td></tr>`;
}

function fullRow(label: string, value: string | undefined, accent = "#0052ff"): string {
  if (!value) return "";
  return `<tr><td style="padding:0 0 8px 0;">
    <div style="background:#f8fafc;border-left:3px solid ${accent};border-radius:0 8px 8px 0;padding:12px 14px;">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px;">${esc(label)}</div>
      <div style="font-size:14px;color:#1a1d2e;line-height:1.6;white-space:pre-wrap;">${esc(value)}</div>
    </div>
  </td></tr>`;
}

export async function sendServiceFormEmail(data: ServiceFormMailData): Promise<void> {
  if (!data.customer_email) throw new Error("Müşteri e-postası yok");

  const transporter = createTransporter();
  const dateStr   = formatDate(data.signed_at);
  const isDelivery = data.form_type === "delivery";
  const formTitle  = isDelivery ? "Ürün Teslimat Formu" : "Servis / Hizmet Formu";
  const subject    = `Lider Network — ${formTitle} (${data.customer_name || "Müşteri"})`;

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="580" cellpadding="0" cellspacing="0"
  style="max-width:580px;width:100%;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,.10);">

  <!-- ── HEADER ─────────────────────────────────────── -->
  <tr>
    <td bgcolor="#0052ff" style="background:#0052ff;padding:24px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="display:inline-block;background:#fff;border-radius:8px;padding:8px 14px;line-height:0;">
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" width="130" height="auto" style="display:block;width:130px;border:0;"/>
            </div>
          </td>
          <td align="right" style="vertical-align:middle;">
            <div style="text-align:right;">
              <div style="color:#cdd9ff;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:4px;">${isDelivery ? "📦 Teslimat Formu" : "📋 Servis Formu"}</div>
              <div style="color:#fff;font-size:18px;font-weight:900;line-height:1.2;">${esc(dateStr)}</div>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── GREETING ───────────────────────────────────── -->
  <tr>
    <td style="padding:22px 28px 14px;">
      <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1a1d2e;">
        Sayın ${esc(data.customer_name || "Müşterimiz")},
      </p>
      <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
        ${isDelivery
          ? "Teslimat formunuz aşağıda yer almaktadır. Ürünleri teslim aldığınız için teşekkür ederiz."
          : "Tarafınıza sunulan hizmete ilişkin servis formu aşağıda yer almaktadır."}
      </p>
    </td>
  </tr>

  <!-- ── DIVIDER ────────────────────────────────────── -->
  <tr><td style="padding:0 28px;"><div style="height:1px;background:#f0f4f8;"></div></td></tr>

  <!-- ── MÜŞTERİ / FİRMA BİLGİLERİ ────────────────── -->
  <tr>
    <td style="padding:16px 28px 4px;">
      <div style="font-size:10px;font-weight:800;color:#0052ff;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">
        Müşteri / Firma Bilgileri
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${infoRow("Ad Soyad", data.customer_name, "Telefon", data.customer_phone)}
        ${data.company_name ? infoRow("Firma", data.company_name, "E-posta", data.customer_email) : ""}
        ${data.customer_address ? `<tr><td style="padding:0 0 8px 0;" colspan="2">
          <div style="background:#f8fafc;border-radius:8px;padding:11px 14px;">
            <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px;">Adres</div>
            <div style="font-size:14px;color:#1a1d2e;font-weight:500;line-height:1.5;">${esc(data.customer_address)}</div>
          </div>
        </td></tr>` : ""}
      </table>
    </td>
  </tr>

  <!-- ── DIVIDER ────────────────────────────────────── -->
  <tr><td style="padding:0 28px 4px;"><div style="height:1px;background:#f0f4f8;"></div></td></tr>

  <!-- ── HİZMET / TESLİMAT ─────────────────────────── -->
  <tr>
    <td style="padding:16px 28px 4px;">
      <div style="font-size:10px;font-weight:800;color:#059669;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">
        ${isDelivery ? "Teslim Edilen Ürünler" : "Yapılan Hizmet"}
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${fullRow(isDelivery ? "Ürün / Hizmet Açıklaması" : "Hizmet Açıklaması", data.service_description, "#059669")}
        ${data.items_delivered ? fullRow("Teslim Edilenler", data.items_delivered, "#0284c7") : ""}
        ${data.notes ? fullRow("Notlar", data.notes, "#94a3b8") : ""}
      </table>
    </td>
  </tr>

  <!-- ── İMZA & YETKİLİ ────────────────────────────── -->
  ${data.signed_by ? `
  <tr><td style="padding:0 28px 4px;"><div style="height:1px;background:#f0f4f8;"></div></td></tr>
  <tr>
    <td style="padding:14px 28px 18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${infoRow("Sorumlu / Yetkili", data.signed_by, "Tarih", dateStr)}
      </table>
    </td>
  </tr>` : ""}

  <!-- ── NOT KUTUSU ────────────────────────────────── -->
  <tr>
    <td style="padding:0 28px 22px;">
      <div style="background:#eff6ff;border-radius:10px;padding:14px 16px;">
        <p style="margin:0;font-size:12px;color:#1e40af;line-height:1.65;">
          💬 Bu form ile ilgili sorularınız için bu e-postayı yanıtlayabilir veya
          <a href="tel:+903122320288" style="color:#0052ff;font-weight:700;text-decoration:none;">+90 312 232 02 88</a>
          numaralı destek hattımızı arayabilirsiniz.
        </p>
      </div>
    </td>
  </tr>

  <!-- ── FOOTER ─────────────────────────────────────── -->
  <tr>
    <td bgcolor="#0f172a" style="background:#0f172a;padding:18px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0;color:#fff;font-size:13px;font-weight:800;letter-spacing:.5px;">LİDER NETWORK</p>
            <p style="margin:3px 0 0;font-size:11px;color:#64748b;">
              <a href="https://www.lidernetwork.com.tr" style="color:#7dd3fc;text-decoration:none;">www.lidernetwork.com.tr</a>
              &nbsp;·&nbsp; +90 312 232 02 88
            </p>
          </td>
          <td align="right" style="vertical-align:middle;">
            <p style="margin:0;font-size:10px;color:#475569;">© ${new Date().getFullYear()} Lider Network</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    `LİDER NETWORK — ${formTitle}`,
    "=".repeat(44),
    `Tarih   : ${dateStr}`,
    `Müşteri : ${data.customer_name || "-"}`,
    data.company_name   ? `Firma   : ${data.company_name}` : "",
    data.customer_phone ? `Telefon : ${data.customer_phone}` : "",
    data.customer_address ? `Adres   : ${data.customer_address}` : "",
    "",
    `${isDelivery ? "Ürün/Hizmet" : "Yapılan Hizmet"}:\n${data.service_description || "-"}`,
    data.items_delivered ? `\nTeslim Edilenler:\n${data.items_delivered}` : "",
    data.notes           ? `\nNotlar:\n${data.notes}` : "",
    data.signed_by       ? `\nSorumlu: ${data.signed_by}` : "",
    "",
    "=".repeat(44),
    "Lider Network · www.lidernetwork.com.tr · +90 312 232 02 88",
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
