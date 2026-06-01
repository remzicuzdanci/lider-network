import nodemailer from "nodemailer";
import crypto from "crypto";
import type { Ticket } from "./supabase";

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

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.lidernetwork.com.tr";

function formatTicketNo(n: number) {
  return `#${String(n).padStart(4, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const priLabels: Record<string, string> = {
  low: "Düşük", medium: "Orta", high: "Yüksek", urgent: "ACİL",
};
const priColors: Record<string, string> = {
  low: "#64748b", medium: "#d97706", high: "#ea580c", urgent: "#dc2626",
};
const catLabels: Record<string, string> = {
  technical: "Teknik", billing: "Faturalama",
  general: "Genel", feature_request: "Özellik İsteği",
};

// ── Shared shell ─────────────────────────────────────────────────────────────
function shell(content: string) {
  return `<!DOCTYPE html>
<html lang="tr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lider Network</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

      <!-- TOP ACCENT BAR -->
      <tr><td style="background:linear-gradient(90deg,#0040cc,#0052ff,#1a6fff);height:5px;border-radius:10px 10px 0 0"></td></tr>

      <!-- HEADER -->
      <tr>
        <td style="background:#ffffff;padding:28px 36px 24px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="display:inline-block;background:#0052ff;border-radius:8px;padding:6px 14px">
                  <span style="color:#ffffff;font-size:18px;font-weight:900;letter-spacing:-0.5px">LİDER</span>
                  <span style="color:#b7c4ff;font-size:18px;font-weight:400;letter-spacing:-0.5px"> NETWORK</span>
                </div>
                <div style="margin-top:6px;color:#64748b;font-size:12px;letter-spacing:1px;text-transform:uppercase">Destek Portalı</div>
              </td>
              <td align="right" style="vertical-align:top">
                ${content.includes("badge-orange") || content.includes("badge-admin")
                  ? `<span style="background:#fff7ed;color:#ea580c;border:1px solid #fed7aa;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase">Yeni Talep</span>`
                  : content.includes("badge-green")
                  ? `<span style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase">Yanıt Geldi</span>`
                  : content.includes("badge-approval")
                  ? `<span style="background:#fff7ed;color:#ea580c;border:1px solid #fed7aa;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase">Onay Bekliyor</span>`
                  : content.includes("badge-approved")
                  ? `<span style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase">Onaylandı</span>`
                  : `<span style="background:#eff6ff;color:#0052ff;border:1px solid #bfdbfe;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase">Bildirim</span>`
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- DIVIDER -->
      <tr><td style="background:#ffffff;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:0 36px"><div style="height:1px;background:#e2e8f0"></div></td></tr>

      <!-- BODY -->
      <tr>
        <td style="background:#ffffff;padding:28px 36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
          ${content}
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;padding:20px 36px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#94a3b8;font-size:12px;line-height:1.6">
                <strong style="color:#64748b">Lider Network Bilişim Hizmetleri</strong><br>
                📞 <a href="tel:+903122320288" style="color:#0052ff;text-decoration:none">+90 312 232 02 88</a> &nbsp;|&nbsp;
                ✉️ <a href="mailto:destek@lidernetwork.com.tr" style="color:#0052ff;text-decoration:none">destek@lidernetwork.com.tr</a><br>
                <a href="https://www.lidernetwork.com.tr" style="color:#0052ff;text-decoration:none">www.lidernetwork.com.tr</a>
              </td>
              <td align="right" style="color:#cbd5e1;font-size:11px;vertical-align:bottom">
                &copy; ${new Date().getFullYear()} Lider Network
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
}

// ── Field helpers ─────────────────────────────────────────────────────────────
function field(label: string, value: string) {
  return `
  <div style="margin-bottom:14px">
    <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">${label}</div>
    <div style="font-size:14px;color:#1e293b;background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:10px 14px;line-height:1.5">${value}</div>
  </div>`;
}

function fieldAccent(label: string, value: string, color: string) {
  return `
  <div style="margin-bottom:14px">
    <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">${label}</div>
    <div style="font-size:14px;color:${color};background:${color}10;border:1px solid ${color}30;border-radius:7px;padding:10px 14px;font-weight:800">${value}</div>
  </div>`;
}

function bigTicketNo(n: number) {
  return `<div style="font-size:38px;font-weight:900;color:#0052ff;letter-spacing:-2px;line-height:1;margin-bottom:6px">${formatTicketNo(n)}</div>`;
}

function btn(text: string, url: string, color = "#0052ff") {
  return `<a href="${url}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.2px">${text}</a>`;
}

function sectionTitle(text: string) {
  return `<div style="font-size:13px;font-weight:700;color:#0052ff;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e0e7ff;padding-bottom:8px;margin:22px 0 14px">${text}</div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Müşteriye: Talep oluşturuldu
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendTicketCreatedEmail(ticket: Ticket): Promise<void> {
  if (!process.env.SMTP_USER && !process.env.SMTP_DESTEK_USER) return;
  const trackUrl = `${siteUrl}/tr/destek/ticket/${ticket.id}`;

  const body = `
    <!-- Greeting -->
    <p style="font-size:16px;color:#1e293b;margin:0 0 6px">Sayın <strong>${esc(ticket.customer_name)}</strong>,</p>
    <p style="font-size:14px;color:#64748b;margin:0 0 24px;line-height:1.6">
      Destek talebiniz başarıyla oluşturuldu. Teknik ekibimiz talebinizi inceleyip en kısa sürede size geri dönüş yapacaktır.
    </p>

    <!-- Ticket No -->
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px 24px;margin-bottom:24px;text-align:center">
      <div style="font-size:11px;color:#3b82f6;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:4px">Talep Numaranız</div>
      ${bigTicketNo(ticket.ticket_number)}
      <div style="font-size:12px;color:#64748b">Bu numarayı saklayın — talebinizi takip etmek için kullanacaksınız.</div>
    </div>

    ${sectionTitle("Talep Detayları")}

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="50%" style="padding-right:8px;vertical-align:top">
          ${fieldAccent("Öncelik", priLabels[ticket.priority] || ticket.priority, priColors[ticket.priority] || "#64748b")}
        </td>
        <td width="50%" style="padding-left:8px;vertical-align:top">
          ${field("Kategori", catLabels[ticket.category] || ticket.category)}
        </td>
      </tr>
    </table>

    ${field("Konu", esc(ticket.subject))}
    ${field("Açıklama", `<span style="white-space:pre-wrap">${esc(ticket.description)}</span>`)}
    ${field("Oluşturulma Tarihi", formatDate(ticket.created_at))}

    <div style="margin-top:28px;text-align:center">
      ${btn("Talebinizi Takip Edin →", trackUrl)}
    </div>

    <p style="margin-top:24px;font-size:13px;color:#94a3b8;text-align:center">
      Acil durumlarda: <a href="tel:+903122320288" style="color:#0052ff;text-decoration:none">+90 312 232 02 88</a>
    </p>
  `;

  await createTransporter().sendMail({
    from: `"Lider Network Destek" <${DESTEK_FROM}>`,
    to: ticket.customer_email,
    subject: `[Destek ${formatTicketNo(ticket.ticket_number)}] Talebiniz Alındı — ${ticket.subject}`,
    html: shell("badge-blue " + body),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Admine: Yeni talep bildirimi
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendNewTicketAdminEmail(ticket: Ticket): Promise<void> {
  if (!process.env.SMTP_USER && !process.env.SMTP_DESTEK_USER) return;
  const adminUrl = `${siteUrl}/admin/destek/${ticket.id}`;
  const priColor = priColors[ticket.priority] || "#64748b";

  const body = `
    <p style="font-size:15px;color:#1e293b;margin:0 0 24px;line-height:1.6">
      Sisteme yeni bir destek talebi geldi. Aşağıdaki bilgileri inceleyerek panelden yanıt verebilirsiniz.
    </p>

    <!-- Ticket Summary Bar -->
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin-bottom:24px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size:10px;color:#9a3412;text-transform:uppercase;letter-spacing:1px;font-weight:700">Talep No</div>
            <div style="font-size:28px;font-weight:900;color:#ea580c;letter-spacing:-1px">${formatTicketNo(ticket.ticket_number)}</div>
          </td>
          <td align="right">
            <div style="font-size:10px;color:#9a3412;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px">Öncelik</div>
            <span style="background:${priColor};color:#fff;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:800">${priLabels[ticket.priority] || ticket.priority}</span>
          </td>
        </tr>
      </table>
    </div>

    ${sectionTitle("Müşteri Bilgileri")}

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:20px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="vertical-align:top;padding-right:12px">
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Ad Soyad</div>
            <div style="font-size:15px;font-weight:700;color:#1e293b">${esc(ticket.customer_name)}</div>
            ${ticket.company ? `<div style="font-size:13px;color:#64748b;margin-top:2px">${esc(ticket.company)}</div>` : ""}
          </td>
          <td width="50%" style="vertical-align:top;padding-left:12px;border-left:1px solid #e2e8f0">
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">İletişim</div>
            <div><a href="mailto:${esc(ticket.customer_email)}" style="color:#0052ff;text-decoration:none;font-size:14px">${esc(ticket.customer_email)}</a></div>
            ${ticket.phone ? `<div style="font-size:13px;color:#64748b;margin-top:2px"><a href="tel:${esc(ticket.phone)}" style="color:#64748b;text-decoration:none">${esc(ticket.phone)}</a></div>` : ""}
          </td>
        </tr>
      </table>
    </div>

    ${sectionTitle("Talep İçeriği")}

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="50%" style="padding-right:8px;vertical-align:top">
          ${field("Kategori", catLabels[ticket.category] || ticket.category)}
        </td>
        <td width="50%" style="padding-left:8px;vertical-align:top">
          ${field("Tarih", formatDate(ticket.created_at))}
        </td>
      </tr>
    </table>

    ${field("Konu", `<strong>${esc(ticket.subject)}</strong>`)}
    ${field("Açıklama", `<span style="white-space:pre-wrap;font-size:13px">${esc(ticket.description)}</span>`)}

    <div style="margin-top:28px">
      ${btn("Admin Panelinde Aç →", adminUrl, "#ea580c")}
    </div>
  `;

  const adminTo = process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_TO || process.env.SMTP_USER;

  await createTransporter().sendMail({
    from: `"Lider Network Destek" <${DESTEK_FROM}>`,
    to: adminTo,
    subject: `[Yeni Talep] ${formatTicketNo(ticket.ticket_number)} — ${ticket.subject}`,
    html: shell("badge-orange badge-admin " + body),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Müşteriye: Talebe yanıt geldi
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendReplyEmail(
  ticket: Ticket,
  replyContent: string
): Promise<void> {
  if (!process.env.SMTP_USER && !process.env.SMTP_DESTEK_USER) return;
  const trackUrl = `${siteUrl}/tr/destek/ticket/${ticket.id}`;

  const body = `
    <p style="font-size:16px;color:#1e293b;margin:0 0 6px">Sayın <strong>${esc(ticket.customer_name)}</strong>,</p>
    <p style="font-size:14px;color:#64748b;margin:0 0 24px;line-height:1.6">
      <strong>${formatTicketNo(ticket.ticket_number)}</strong> numaralı destek talebinize Lider Network teknik ekibi tarafından yanıt verildi.
    </p>

    ${sectionTitle("Talep Bilgisi")}
    ${field("Talep No / Konu", `<strong>${formatTicketNo(ticket.ticket_number)}</strong> — ${esc(ticket.subject)}`)}

    ${sectionTitle("Ekibimizin Yanıtı")}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #16a34a;border-radius:0 8px 8px 0;padding:16px 20px;font-size:14px;color:#1e293b;line-height:1.7;white-space:pre-wrap;margin-bottom:24px">${esc(replyContent)}</div>

    <div style="margin-top:8px;text-align:center">
      ${btn("Talebinizi Görüntüleyin →", trackUrl, "#16a34a")}
    </div>

    <p style="margin-top:20px;font-size:13px;color:#94a3b8;text-align:center">
      Yanıtlamak için destek portalını kullanabilir ya da bu e-postayı yanıtlayabilirsiniz.
    </p>
  `;

  await createTransporter().sendMail({
    from: `"Lider Network Destek" <${DESTEK_FROM}>`,
    to: ticket.customer_email,
    replyTo: process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_TO || process.env.SMTP_USER,
    subject: `Re: [Destek ${formatTicketNo(ticket.ticket_number)}] ${ticket.subject}`,
    html: shell("badge-green " + body),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Approval emails
// ═══════════════════════════════════════════════════════════════════════════════

export function generateApproveToken(userId: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "secret";
  return crypto.createHmac("sha256", secret).update(userId).digest("hex");
}

export function validateApproveToken(userId: string, token: string): boolean {
  return token === generateApproveToken(userId);
}

// ─── Admine: Yeni kayıt onay isteği ──────────────────────────────────────────
export async function sendNewRegistrationEmail(opts: {
  userId: string;
  fullName: string;
  company?: string | null;
  email: string;
  phone?: string | null;
}): Promise<void> {
  if (!process.env.SMTP_USER && !process.env.SMTP_DESTEK_USER) return;

  const token = generateApproveToken(opts.userId);
  const approveUrl = `${siteUrl}/api/destek/approve?uid=${opts.userId}&token=${token}`;
  const rejectUrl  = `${siteUrl}/api/destek/approve?uid=${opts.userId}&token=${token}&action=reject`;

  const body = `
    <p style="font-size:15px;color:#1e293b;margin:0 0 24px;line-height:1.6">
      Destek portalına yeni bir müşteri kayıt talebi geldi. Bilgileri inceleyip hesabı onaylayabilir ya da reddedebilirsiniz.
    </p>

    ${sectionTitle("Başvuru Sahibi")}

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin-bottom:20px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-bottom:12px">
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Ad Soyad</div>
            <div style="font-size:16px;font-weight:800;color:#1e293b">${esc(opts.fullName)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;border-top:1px solid #e2e8f0;padding-top:12px">
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">E-posta</div>
            <div><a href="mailto:${esc(opts.email)}" style="color:#0052ff;text-decoration:none;font-size:15px">${esc(opts.email)}</a></div>
          </td>
        </tr>
        ${opts.company ? `
        <tr>
          <td style="padding-bottom:12px;border-top:1px solid #e2e8f0;padding-top:12px">
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Şirket</div>
            <div style="font-size:15px;color:#1e293b">${esc(opts.company)}</div>
          </td>
        </tr>` : ""}
        ${opts.phone ? `
        <tr>
          <td style="border-top:1px solid #e2e8f0;padding-top:12px">
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Telefon</div>
            <div><a href="tel:${esc(opts.phone)}" style="color:#0052ff;text-decoration:none;font-size:15px">${esc(opts.phone)}</a></div>
          </td>
        </tr>` : ""}
      </table>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">
      <tr>
        <td width="50%" style="padding-right:8px">
          <a href="${approveUrl}" style="display:block;text-align:center;background:#16a34a;color:#ffffff;text-decoration:none;padding:13px 0;border-radius:8px;font-weight:700;font-size:14px">✓ Hesabı Onayla</a>
        </td>
        <td width="50%" style="padding-left:8px">
          <a href="${rejectUrl}" style="display:block;text-align:center;background:#dc2626;color:#ffffff;text-decoration:none;padding:13px 0;border-radius:8px;font-weight:700;font-size:14px">✕ Reddet</a>
        </td>
      </tr>
    </table>

    <p style="margin-top:16px;font-size:12px;color:#94a3b8;text-align:center">
      Bu bağlantılar güvenli şekilde imzalanmıştır ve tek kullanımlıktır.
    </p>
  `;

  const adminTo = process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_TO || process.env.SMTP_USER;

  await createTransporter().sendMail({
    from: `"Lider Network Destek" <${DESTEK_FROM}>`,
    to: adminTo,
    subject: `[Kayıt Talebi] ${opts.fullName}${opts.company ? ` — ${opts.company}` : ""} — ${opts.email}`,
    html: shell("badge-approval " + body),
  });
}

// ─── Müşteriye: Hesap onaylandı ───────────────────────────────────────────────
export async function sendAccountApprovedEmail(opts: {
  fullName: string;
  email: string;
}): Promise<void> {
  if (!process.env.SMTP_USER && !process.env.SMTP_DESTEK_USER) return;

  const loginUrl = "https://destek.lidernetwork.com.tr/giris";

  const body = `
    <p style="font-size:16px;color:#1e293b;margin:0 0 6px">Sayın <strong>${esc(opts.fullName)}</strong>,</p>
    <p style="font-size:14px;color:#64748b;margin:0 0 28px;line-height:1.6">
      Destek portalı hesabınız ekibimiz tarafından onaylandı. Artık oturum açarak destek taleplerinizi oluşturabilir, takip edebilir ve teknik ekibimizle iletişime geçebilirsiniz.
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px;margin-bottom:28px;text-align:center">
      <div style="font-size:36px;margin-bottom:8px">✅</div>
      <div style="font-size:18px;font-weight:800;color:#15803d;margin-bottom:4px">Hesabınız Aktif</div>
      <div style="font-size:13px;color:#16a34a">Destek portalına giriş yapabilirsiniz.</div>
    </div>

    <div style="text-align:center">
      ${btn("Destek Paneline Giriş Yap →", loginUrl, "#0052ff")}
    </div>

    <p style="margin-top:24px;font-size:13px;color:#94a3b8;text-align:center">
      Sorularınız için: <a href="mailto:destek@lidernetwork.com.tr" style="color:#0052ff;text-decoration:none">destek@lidernetwork.com.tr</a>
    </p>
  `;

  await createTransporter().sendMail({
    from: `"Lider Network Destek" <${DESTEK_FROM}>`,
    to: opts.email,
    subject: "Destek Portalı Hesabınız Onaylandı — Lider Network",
    html: shell("badge-approved " + body),
  });
}

// ─── Müşteriye: Kayıt alındı, onay bekleniyor ────────────────────────────────
export async function sendRegistrationReceivedEmail(opts: {
  fullName: string;
  email: string;
}): Promise<void> {
  if (!process.env.SMTP_USER && !process.env.SMTP_DESTEK_USER) return;

  const body = `
    <p style="font-size:16px;color:#1e293b;margin:0 0 6px">Sayın <strong>${esc(opts.fullName)}</strong>,</p>
    <p style="font-size:14px;color:#64748b;margin:0 0 28px;line-height:1.6">
      Lider Network Destek Portalı'na kayıt talebiniz başarıyla alındı. Ekibimiz hesabınızı en kısa sürede inceleyecek ve onaylandığında e-posta ile bilgilendirileceksiniz.
    </p>

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin-bottom:24px">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:24px;padding-right:14px;vertical-align:top">⏳</td>
          <td>
            <div style="font-size:14px;font-weight:700;color:#92400e;margin-bottom:4px">Onay Sürecinde</div>
            <div style="font-size:13px;color:#b45309;line-height:1.5">Genellikle 1 iş günü içinde onay işlemi tamamlanmaktadır. Onaylandığınızda e-posta bildirimi alacaksınız.</div>
          </td>
        </tr>
      </table>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px">
      <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:10px">Acil Destek İçin</div>
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right:24px">
            <a href="tel:+903122320288" style="color:#0052ff;text-decoration:none;font-size:14px;font-weight:600">📞 +90 312 232 02 88</a>
          </td>
          <td>
            <a href="mailto:destek@lidernetwork.com.tr" style="color:#0052ff;text-decoration:none;font-size:14px;font-weight:600">✉️ destek@lidernetwork.com.tr</a>
          </td>
        </tr>
      </table>
    </div>
  `;

  await createTransporter().sendMail({
    from: `"Lider Network Destek" <${DESTEK_FROM}>`,
    to: opts.email,
    subject: "Kayıt Talebiniz Alındı — Lider Network Destek Portalı",
    html: shell("badge-blue " + body),
  });
}
