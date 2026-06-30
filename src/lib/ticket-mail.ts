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
type BadgeType = "new-ticket" | "reply" | "approval" | "approved" | "info";

const BADGES: Record<BadgeType, string> = {
  "new-ticket": `<span style="background:#fff7ed;color:#ea580c;border:1px solid #fed7aa;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase">Yeni Talep</span>`,
  "reply":      `<span style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase">Yanıt Geldi</span>`,
  "approval":   `<span style="background:#fff7ed;color:#ea580c;border:1px solid #fed7aa;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase">Onay Bekliyor</span>`,
  "approved":   `<span style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase">Onaylandı</span>`,
  "info":       `<span style="background:#eff6ff;color:#0052ff;border:1px solid #bfdbfe;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase">Bildirim</span>`,
};

function shell(badge: BadgeType, body: string) {
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
      <tr><td style="background:#0052ff;height:5px;border-radius:10px 10px 0 0"></td></tr>

      <!-- HEADER -->
      <tr>
        <td style="background:#ffffff;padding:28px 36px 24px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" width="158" height="83" style="display:block;width:158px;height:auto;border:0;outline:none;text-decoration:none" />
                <div style="margin-top:8px;color:#64748b;font-size:12px;letter-spacing:1px;text-transform:uppercase">Destek Portalı</div>
              </td>
              <td align="right" style="vertical-align:top">
                ${BADGES[badge]}
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
          ${body}
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;padding:20px 36px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#94a3b8;font-size:12px;line-height:1.6">
                <strong style="color:#64748b">Lider Network Bilişim Hizmetleri</strong><br>
                <a href="tel:+903122320288" style="color:#0052ff;text-decoration:none">+90 312 232 02 88</a> &nbsp;|&nbsp;
                <a href="mailto:destek@lidernetwork.com.tr" style="color:#0052ff;text-decoration:none">destek@lidernetwork.com.tr</a><br>
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
    <p style="font-size:16px;color:#1e293b;margin:0 0 6px">Sayın <strong>${esc(ticket.customer_name)}</strong>,</p>
    <p style="font-size:14px;color:#64748b;margin:0 0 28px;line-height:1.6">
      Destek talebiniz tarafımıza ulaşmıştır. Teknik ekibimiz en kısa sürede sizinle iletişime geçecektir.
    </p>

    <!-- Talep Numarası -->
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px;margin-bottom:28px;text-align:center">
      <div style="font-size:11px;color:#3b82f6;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:6px">Talep Numaranız</div>
      ${bigTicketNo(ticket.ticket_number)}
      <div style="font-size:12px;color:#64748b;margin-top:4px">Bu numarayı saklayın — talebinizi takip etmek için kullanacaksınız.</div>
    </div>

    <!-- Özet -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:28px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:13px 18px;border-bottom:1px solid #e2e8f0">
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:3px">Konu</div>
            <div style="font-size:14px;font-weight:700;color:#1e293b">${esc(ticket.subject)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:13px 18px;border-bottom:1px solid #e2e8f0">
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:3px">Öncelik</div>
            <span style="font-size:13px;font-weight:700;color:${priColors[ticket.priority] || "#64748b"}">${priLabels[ticket.priority] || ticket.priority}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:13px 18px">
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:3px">Tarih</div>
            <div style="font-size:13px;color:#475569">${formatDate(ticket.created_at)}</div>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin-bottom:24px">
      ${btn("Talebinizi Takip Edin →", trackUrl)}
    </div>

    <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0">
      Acil durumlarda: <a href="tel:+903122320288" style="color:#0052ff;text-decoration:none;font-weight:600">+90 312 232 02 88</a>
    </p>
  `;

  await createTransporter().sendMail({
    from: `"Lider Network Destek" <${DESTEK_FROM}>`,
    to: ticket.customer_email,
    subject: `[Destek ${formatTicketNo(ticket.ticket_number)}] Talebiniz Alındı — ${ticket.subject}`,
    html: shell("info", body),
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
    html: shell("new-ticket", body),
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
    html: shell("reply", body),
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
    html: shell("approval", body),
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
    html: shell("approved", body),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Şirket müdürüne / müşteriye: Talep çözüldü
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendTicketResolvedEmail(
  ticket: Ticket,
  contactEmail?: string,
  contactName?: string
): Promise<void> {
  if (!process.env.SMTP_USER && !process.env.SMTP_DESTEK_USER) return;
  const to   = contactEmail || ticket.customer_email;
  const name = contactName  || ticket.customer_name;
  const ratingSecret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "please-set-ADMIN_SESSION_SECRET-in-env";
  function makeRatingToken(score: number): string {
    return crypto.createHmac("sha256", ratingSecret).update(`${ticket.id}:${score}`).digest("hex");
  }

  // Çözüm süresi hesapla
  let duration = "";
  if (ticket.resolved_at && ticket.created_at) {
    const diffMs  = new Date(ticket.resolved_at).getTime() - new Date(ticket.created_at).getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 60) duration = `${diffMin} dakika`;
    else if (diffMin < 1440) duration = `${Math.round(diffMin / 60)} saat`;
    else duration = `${Math.round(diffMin / 1440)} gün`;
  }

  const body = `
    <!-- Selamlama -->
    <p style="font-size:16px;color:#1e293b;margin:0 0 6px">Sayın <strong>${esc(name)}</strong>,</p>
    <p style="font-size:14px;color:#64748b;margin:0 0 24px;line-height:1.7">
      Lider Network teknik ekibi olarak bildirmek isteriz ki
      <strong style="color:#1e293b">${formatTicketNo(ticket.ticket_number)}</strong> numaralı,
      <strong style="color:#1e293b">&ldquo;${esc(ticket.subject)}&rdquo;</strong> konulu destek talebiniz
      teknik uzmanlarımız tarafından incelenmiş ve başarıyla çözüme kavuşturulmuştur.
      Yaşanan sorununun giderilmesi için gerekli teknik müdahaleler tamamlanmıştır.
    </p>

    <!-- Çözüldü Bandı -->
    <div style="background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);border:1px solid #86efac;border-radius:14px;padding:24px 28px;margin-bottom:28px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:10px">✅</div>
      <div style="font-size:22px;font-weight:900;color:#15803d;letter-spacing:-0.5px;margin-bottom:6px">Destek Talebiniz Tamamlandı</div>
      <div style="font-size:13px;color:#16a34a;font-weight:600">${formatTicketNo(ticket.ticket_number)}</div>
      ${duration ? `<div style="margin-top:8px;display:inline-block;background:#bbf7d0;color:#15803d;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700">⏱ Çözüm süresi: ${duration}</div>` : ""}
    </div>

    ${sectionTitle("Talep Bilgileri")}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
      <tr>
        <td width="50%" style="padding-right:6px;vertical-align:top">
          ${field("Talep Numarası", `<strong>${formatTicketNo(ticket.ticket_number)}</strong>`)}
        </td>
        <td width="50%" style="padding-left:6px;vertical-align:top">
          ${fieldAccent("Öncelik Seviyesi", priLabels[ticket.priority] || ticket.priority, priColors[ticket.priority] || "#64748b")}
        </td>
      </tr>
    </table>

    ${field("Konu", `<strong>${esc(ticket.subject)}</strong>`)}

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="50%" style="padding-right:6px;vertical-align:top">
          ${field("Talep Tarihi", formatDate(ticket.created_at))}
        </td>
        <td width="50%" style="padding-left:6px;vertical-align:top">
          ${ticket.resolved_at ? field("Çözüm Tarihi", formatDate(ticket.resolved_at)) : ""}
        </td>
      </tr>
    </table>

    ${(() => {
      // Yapılandırılmış description satırlarını parse et
      if (!ticket.description) return "";
      const rows = ticket.description.split("\n")
        .filter((l: string) => l.startsWith("📋") || l.startsWith("👤") || l.startsWith("👥") || l.startsWith("🔧") || l.startsWith("🕐"))
        .map((l: string) => {
          const [label, ...rest] = l.split(": ");
          return `<tr>
            <td style="padding:7px 12px;font-size:12px;color:#6b7280;border-bottom:1px solid #f0f2f8;width:40%">${esc(label)}</td>
            <td style="padding:7px 12px;font-size:13px;color:#1e293b;font-weight:600;border-bottom:1px solid #f0f2f8">${esc(rest.join(": "))}</td>
          </tr>`;
        });
      if (!rows.length) return "";
      return `${sectionTitle("Destek Detayları")}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:16px">
        ${rows.join("")}
      </table>`;
    })()}

    <!-- Bilgi Notu -->
    <div style="background:#f8faff;border:1px solid #c7d7ff;border-left:4px solid #0052ff;border-radius:0 10px 10px 0;padding:16px 20px;margin-top:20px;margin-bottom:8px">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0038c7">Sonraki Adımlar</p>
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.7">
        Bu konuyla ilgili bir soru veya sorunun devam ettiğini düşünüyorsanız lütfen bizimle iletişime geçmekten çekinmeyiniz.
        Yeni bir destek talebi oluşturmak için aşağıdaki iletişim kanallarımızı kullanabilirsiniz.
      </p>
    </div>

    <!-- İletişim -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-top:16px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right:16px;vertical-align:top">
            <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:6px">Telefon</div>
            <a href="tel:+903122320288" style="color:#0052ff;text-decoration:none;font-size:14px;font-weight:700">+90 312 232 02 88</a>
          </td>
          <td style="padding-left:16px;border-left:1px solid #e2e8f0;vertical-align:top">
            <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:6px">E-posta</div>
            <a href="mailto:destek@lidernetwork.com.tr" style="color:#0052ff;text-decoration:none;font-size:14px;font-weight:700">destek@lidernetwork.com.tr</a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Memnuniyet Anketi -->
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin-top:16px;text-align:center">
      <div style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:12px">Hizmetimizi değerlendirin</div>
      <table align="center" cellpadding="0" cellspacing="0">
        <tr>
          ${[
            { score: 1, emoji: "😞", label: "Çok Kötü",  color: "#dc2626", bg: "#fef2f2" },
            { score: 2, emoji: "😐", label: "Kötü",      color: "#ea580c", bg: "#fff7ed" },
            { score: 3, emoji: "🙂", label: "Orta",      color: "#d97706", bg: "#fffbeb" },
            { score: 4, emoji: "😊", label: "İyi",       color: "#16a34a", bg: "#f0fdf4" },
            { score: 5, emoji: "😄", label: "Mükemmel",  color: "#0052ff", bg: "#eff6ff" },
          ].map(s => `
            <td style="padding:0 4px">
              <a href="${siteUrl}/api/tickets/${ticket.id}/rate?score=${s.score}&token=${makeRatingToken(s.score)}" style="display:block;text-decoration:none">
                <div style="background:${s.bg};border:1px solid ${s.color}30;border-radius:10px;padding:10px 12px;text-align:center;min-width:52px">
                  <div style="font-size:22px;line-height:1;margin-bottom:4px">${s.emoji}</div>
                  <div style="font-size:10px;font-weight:700;color:${s.color}">${s.label}</div>
                </div>
              </a>
            </td>
          `).join("")}
        </tr>
      </table>
    </div>

    <p style="margin-top:24px;font-size:13px;color:#94a3b8;line-height:1.6;text-align:center">
      Lider Network olarak kesintisiz bilişim desteği sunmak önceliğimizdir.<br>
      Güveniniz için teşekkür ederiz.
    </p>
  `;

  await createTransporter().sendMail({
    from: `"Lider Network Destek" <${DESTEK_FROM}>`,
    to,
    subject: `Destek Talebiniz Tamamlandı — ${formatTicketNo(ticket.ticket_number)}`,
    html: shell("approved", body),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. SLA Uyarısı — Personele / Admine
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendSLAWarningEmail(
  ticket: Ticket,
  toEmail: string,
  remainingMinutes: number
): Promise<void> {
  if (!process.env.SMTP_USER && !process.env.SMTP_DESTEK_USER) return;

  const adminUrl = `${siteUrl}/admin/destek/${ticket.id}`;

  const body = `
    <!-- Red Warning Banner -->
    <div style="background:#fef2f2;border:2px solid #fecaca;border-radius:12px;padding:20px 24px;margin-bottom:24px;text-align:center">
      <div style="font-size:40px;margin-bottom:8px">⚠️</div>
      <div style="font-size:20px;font-weight:900;color:#dc2626;margin-bottom:6px">SLA SÜRESİ DOLMAK ÜZERE</div>
      <div style="font-size:28px;font-weight:900;color:#dc2626;font-family:monospace">${remainingMinutes} dakika kaldı</div>
    </div>

    <p style="font-size:15px;color:#1e293b;margin:0 0 20px;line-height:1.6">
      Aşağıdaki destek talebinin SLA süresi <strong style="color:#dc2626">${remainingMinutes} dakika</strong> içinde dolacak. Lütfen acil olarak ilgilenin.
    </p>

    ${sectionTitle("Talep Bilgileri")}

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 20px;margin-bottom:20px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size:10px;color:#9a3412;text-transform:uppercase;letter-spacing:1px;font-weight:700">Talep No</div>
            <div style="font-size:28px;font-weight:900;color:#dc2626;letter-spacing:-1px">${formatTicketNo(ticket.ticket_number)}</div>
          </td>
          <td align="right">
            <div style="font-size:10px;color:#9a3412;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px">Öncelik</div>
            <span style="background:${priColors[ticket.priority]};color:#fff;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:800">${priLabels[ticket.priority] || ticket.priority}</span>
          </td>
        </tr>
      </table>
    </div>

    ${field("Konu", `<strong>${esc(ticket.subject)}</strong>`)}
    ${field("Müşteri", `${esc(ticket.customer_name)}${ticket.company ? ` — ${esc(ticket.company)}` : ""}`)}
    ${field("Oluşturulma", formatDate(ticket.created_at))}
    ${ticket.assigned_to ? field("Atanan Personel", esc(ticket.assigned_to)) : ""}

    <div style="margin-top:24px">
      ${btn("Talebi Hemen Görüntüle →", adminUrl, "#dc2626")}
    </div>
  `;

  await createTransporter().sendMail({
    from: `"Lider Network Destek" <${DESTEK_FROM}>`,
    to: toEmail,
    subject: `[SLA Uyarısı] ${formatTicketNo(ticket.ticket_number)} — ${remainingMinutes} dakika kaldı`,
    html: shell("info", body),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Şirkete: Aylık Özet Rapor
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendMonthlySummaryEmail(opts: {
  companyName: string;
  contactName: string;
  contactEmail: string;
  tickets: Ticket[];
  stats: { total: number; resolved: number; open: number; avgMinutes: number | null };
}): Promise<void> {
  if (!process.env.SMTP_USER && !process.env.SMTP_DESTEK_USER) return;

  const now = new Date();
  const monthYear = now.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  const { total, resolved, open, avgMinutes } = opts.stats;
  const resolvePct = total ? Math.round((resolved / total) * 100) : 0;

  let avgTimeStr = "—";
  if (avgMinutes !== null) {
    if (avgMinutes < 60) avgTimeStr = `${avgMinutes} dakika`;
    else if (avgMinutes < 1440) avgTimeStr = `${Math.round(avgMinutes / 60)} saat`;
    else avgTimeStr = `${Math.round(avgMinutes / 1440)} gün`;
  }

  const ticketRows = opts.tickets
    .slice(0, 20)
    .map((t, i) => {
      const statusColors: Record<string, string> = {
        open: "#1d4ed8", in_progress: "#7c3aed", resolved: "#15803d", closed: "#475569"
      };
      const statusLabels: Record<string, string> = {
        open: "Açık", in_progress: "İşlemde", resolved: "Çözüldü", closed: "Kapalı"
      };
      return `<tr style="background:${i % 2 === 0 ? "#f8fafc" : "#fff"}">
        <td style="padding:8px 12px;font-size:12px;font-weight:800;color:#0052ff">${formatTicketNo(t.ticket_number)}</td>
        <td style="padding:8px 12px;font-size:12px;color:#1e293b;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.subject)}</td>
        <td style="padding:8px 12px;font-size:12px;color:#64748b">${formatDate(t.created_at).split(",")[0]}</td>
        <td style="padding:8px 12px">
          <span style="font-size:11px;font-weight:700;color:${statusColors[t.status] || "#64748b"}">${statusLabels[t.status] || t.status}</span>
        </td>
      </tr>`;
    })
    .join("");

  const body = `
    <p style="font-size:16px;color:#1e293b;margin:0 0 6px">Sayın <strong>${esc(opts.contactName)}</strong>,</p>
    <p style="font-size:14px;color:#64748b;margin:0 0 24px;line-height:1.7">
      <strong>${esc(opts.companyName)}</strong> hesabınıza ait <strong>${monthYear}</strong> dönemi destek hizmet raporunuzu aşağıda bulabilirsiniz.
    </p>

    ${sectionTitle("Dönem Özeti")}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tr>
        <td width="25%" style="padding:4px">
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;text-align:center">
            <div style="font-size:32px;font-weight:900;color:#0052ff;font-family:monospace">${total}</div>
            <div style="font-size:11px;color:#64748b;margin-top:4px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Toplam</div>
          </div>
        </td>
        <td width="25%" style="padding:4px">
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center">
            <div style="font-size:32px;font-weight:900;color:#15803d;font-family:monospace">${resolved}</div>
            <div style="font-size:11px;color:#64748b;margin-top:4px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Çözülen</div>
          </div>
        </td>
        <td width="25%" style="padding:4px">
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;text-align:center">
            <div style="font-size:32px;font-weight:900;color:#d97706;font-family:monospace">${open}</div>
            <div style="font-size:11px;color:#64748b;margin-top:4px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Açık</div>
          </div>
        </td>
        <td width="25%" style="padding:4px">
          <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:16px;text-align:center">
            <div style="font-size:22px;font-weight:900;color:#7c3aed;font-family:monospace">%${resolvePct}</div>
            <div style="font-size:11px;color:#64748b;margin-top:4px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Çözüm Oranı</div>
          </div>
        </td>
      </tr>
    </table>

    ${field("Ortalama Çözüm Süresi", avgTimeStr)}

    ${opts.tickets.length > 0 ? `
    ${sectionTitle(`Bu Dönemin Talepleri (${Math.min(opts.tickets.length, 20)}/${opts.tickets.length})`)}
    <div style="overflow-x:auto;margin-bottom:20px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">No</th>
            <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Konu</th>
            <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Tarih</th>
            <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Durum</th>
          </tr>
        </thead>
        <tbody>
          ${ticketRows}
        </tbody>
      </table>
    </div>` : `<p style="color:#64748b;font-size:14px;text-align:center;padding:20px">Bu dönemde kayıt bulunamadı.</p>`}

    <div style="background:#f8faff;border:1px solid #c7d7ff;border-left:4px solid #0052ff;border-radius:0 10px 10px 0;padding:16px 20px;margin-top:16px;margin-bottom:8px">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0038c7">Lider Network Desteği</p>
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.7">
        Teknik destek ekibimiz iş günleri 08:00–18:00 saatleri arasında hizmetinizdedir.
        Acil durumlarda <a href="tel:+903122320288" style="color:#0052ff">+90 312 232 02 88</a> numaralı hattımızı arayabilirsiniz.
      </p>
    </div>

    <p style="margin-top:24px;font-size:13px;color:#94a3b8;line-height:1.6;text-align:center">
      Güvenilir ve kesintisiz bilişim desteği için Lider Network'ü tercih ettiğiniz için teşekkür ederiz.
    </p>
  `;

  await createTransporter().sendMail({
    from: `"Lider Network Destek" <${DESTEK_FROM}>`,
    to: opts.contactEmail,
    subject: `Lider Network — ${opts.companyName} Aylık Destek Raporu — ${monthYear}`,
    html: shell("info", body),
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
    html: shell("info", body),
  });
}
