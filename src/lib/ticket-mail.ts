import nodemailer from "nodemailer";
import crypto from "crypto";
import type { Ticket } from "./supabase";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

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

const shell = (body: string) => `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:Arial,sans-serif;background:#f1f3f6;margin:0;padding:24px}
  .wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.1)}
  .hd{background:#101415;padding:28px 32px}
  .hd h1{color:#b7c4ff;margin:0;font-size:20px;letter-spacing:-.3px}
  .hd p{color:#8d90a2;margin:6px 0 0;font-size:13px}
  .bd{padding:28px 32px}
  .badge{display:inline-block;padding:3px 12px;border-radius:4px;font-size:11px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;margin-bottom:20px}
  .badge-blue{background:#0052ff;color:#fff}
  .badge-green{background:#16a34a;color:#fff}
  .badge-orange{background:#ea580c;color:#fff}
  .lbl{font-size:11px;font-weight:700;color:#8d90a2;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
  .val{font-size:15px;color:#1e293b;padding:10px 14px;background:#f8fafc;border-radius:5px;border-left:3px solid #0052ff;margin-bottom:16px}
  .msg{background:#f8fafc;border-radius:6px;padding:16px;color:#1e293b;font-size:15px;line-height:1.65;white-space:pre-wrap;margin-bottom:16px}
  .btn{display:inline-block;padding:12px 26px;background:#0052ff;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;margin-top:8px}
  .tno{font-size:32px;font-weight:900;color:#0052ff;letter-spacing:-1.5px;margin-bottom:16px}
  .ft{background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center}
  .ft p{color:#94a3b8;font-size:12px;margin:4px 0}
</style>
</head>
<body>
<div class="wrap">${body}</div>
</body>
</html>`;

/** Confirmation email to customer */
export async function sendTicketCreatedEmail(ticket: Ticket): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  const trackUrl = `${siteUrl}/tr/destek/ticket/${ticket.id}`;
  const html = shell(`
    <div class="hd">
      <h1>LİDER NETWORK</h1>
      <p>Destek Talebi Oluşturuldu</p>
    </div>
    <div class="bd">
      <span class="badge badge-blue">Destek Talebi</span>
      <p style="font-size:15px;color:#334155;margin-bottom:20px">
        Sayın <strong>${esc(ticket.customer_name)}</strong>,<br>
        Talebiniz alındı. Ekibimiz en kısa sürede geri dönüş yapacak.
      </p>
      <div class="lbl">Talep Numarası</div>
      <div class="tno">${formatTicketNo(ticket.ticket_number)}</div>
      <div class="lbl">Konu</div>
      <div class="val">${esc(ticket.subject)}</div>
      <div class="lbl">Açıklama</div>
      <div class="msg">${esc(ticket.description)}</div>
      <a href="${trackUrl}" class="btn">Talebinizi Takip Edin &rarr;</a>
      <p style="margin-top:18px;font-size:13px;color:#64748b">
        Bu talep numarasını saklayın: <strong>${formatTicketNo(ticket.ticket_number)}</strong>
      </p>
    </div>
    <div class="ft">
      <p>Lider Network &middot; info@lidernetwork.com.tr &middot; +90 312 232 02 88</p>
      <p>&copy; ${new Date().getFullYear()} Lider Network. Tüm hakları saklıdır.</p>
    </div>
  `);

  await createTransporter().sendMail({
    from: `"Lider Network Destek" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: ticket.customer_email,
    subject: `Destek Talebiniz Oluşturuldu — ${formatTicketNo(ticket.ticket_number)}: ${ticket.subject}`,
    html,
  });
}

/** Alert email to admin */
export async function sendNewTicketAdminEmail(ticket: Ticket): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  const adminUrl = `${siteUrl}/admin/destek/${ticket.id}`;
  const priColors: Record<string, string> = {
    low: "#64748b",
    medium: "#d97706",
    high: "#ea580c",
    urgent: "#dc2626",
  };
  const priLabels: Record<string, string> = {
    low: "Düşük",
    medium: "Orta",
    high: "Yüksek",
    urgent: "ACİL",
  };
  const html = shell(`
    <div class="hd">
      <h1>LİDER NETWORK</h1>
      <p>Yeni Destek Talebi</p>
    </div>
    <div class="bd">
      <span class="badge badge-orange">Yeni Talep</span>
      <div class="lbl">Talep No</div>
      <div class="val"><strong>${formatTicketNo(ticket.ticket_number)}</strong></div>
      <div class="lbl">Müşteri</div>
      <div class="val">${esc(ticket.customer_name)}${ticket.company ? ` · ${esc(ticket.company)}` : ""}<br><a href="mailto:${esc(ticket.customer_email)}" style="color:#0052ff">${esc(ticket.customer_email)}</a></div>
      <div class="lbl">Konu</div>
      <div class="val">${esc(ticket.subject)}</div>
      <div class="lbl">Öncelik</div>
      <div class="val" style="border-left-color:${priColors[ticket.priority]}"><strong style="color:${priColors[ticket.priority]}">${priLabels[ticket.priority]}</strong></div>
      <div class="lbl">Açıklama</div>
      <div class="msg">${esc(ticket.description)}</div>
      <a href="${adminUrl}" class="btn">Admin Panelinde Aç &rarr;</a>
    </div>
    <div class="ft"><p>Lider Network Admin Paneli</p></div>
  `);

  await createTransporter().sendMail({
    from: `"Lider Network Destek" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: process.env.SMTP_TO || process.env.SMTP_USER,
    subject: `[Yeni Talep] ${formatTicketNo(ticket.ticket_number)} — ${ticket.subject}`,
    html,
  });
}

/** Reply notification to customer */
export async function sendReplyEmail(
  ticket: Ticket,
  replyContent: string
): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  const trackUrl = `${siteUrl}/tr/destek/ticket/${ticket.id}`;
  const html = shell(`
    <div class="hd">
      <h1>LİDER NETWORK</h1>
      <p>Destek Talebinize Yanıt</p>
    </div>
    <div class="bd">
      <span class="badge badge-green">Yanıt Geldi</span>
      <p style="font-size:15px;color:#334155;margin-bottom:20px">
        Sayın <strong>${esc(ticket.customer_name)}</strong>,<br>
        <strong>${formatTicketNo(ticket.ticket_number)}</strong> numaralı talebinize yanıt verildi.
      </p>
      <div class="lbl">Konu</div>
      <div class="val">${esc(ticket.subject)}</div>
      <div class="lbl">Yanıt</div>
      <div class="msg">${esc(replyContent)}</div>
      <a href="${trackUrl}" class="btn">Talebinizi Görüntüleyin &rarr;</a>
      <p style="margin-top:16px;font-size:13px;color:#64748b">
        Yanıtlamak için bu e-postayı yanıtlayabilir veya destek portalını kullanabilirsiniz.
      </p>
    </div>
    <div class="ft">
      <p>Lider Network &middot; info@lidernetwork.com.tr &middot; +90 312 232 02 88</p>
      <p>&copy; ${new Date().getFullYear()} Lider Network. Tüm hakları saklıdır.</p>
    </div>
  `);

  await createTransporter().sendMail({
    from: `"Lider Network Destek" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: ticket.customer_email,
    replyTo: process.env.SMTP_TO || process.env.SMTP_USER,
    subject: `Re: ${formatTicketNo(ticket.ticket_number)} — ${ticket.subject}`,
    html,
  });
}

// ── Approval emails ───────────────────────────────────────────────────────────

export function generateApproveToken(userId: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "secret";
  return crypto.createHmac("sha256", secret).update(userId).digest("hex");
}

export function validateApproveToken(userId: string, token: string): boolean {
  return token === generateApproveToken(userId);
}

/** Email to admin: new registration awaiting approval */
export async function sendNewRegistrationEmail(opts: {
  userId: string;
  fullName: string;
  company?: string | null;
  email: string;
  phone?: string | null;
}): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const token = generateApproveToken(opts.userId);
  const approveUrl = `${siteUrl}/api/destek/approve?uid=${opts.userId}&token=${token}`;
  const rejectUrl  = `${siteUrl}/api/destek/approve?uid=${opts.userId}&token=${token}&action=reject`;

  const html = shell(`
    <div class="hd">
      <h1>LİDER NETWORK</h1>
      <p>Yeni Müşteri Kayıt Talebi</p>
    </div>
    <div class="bd">
      <span class="badge badge-orange">Onay Bekliyor</span>
      <p style="font-size:15px;color:#334155;margin-bottom:20px">
        Yeni bir müşteri destek portalına kayıt olmak istiyor. Lütfen onaylayın veya reddedin.
      </p>
      <div class="lbl">Ad Soyad</div>
      <div class="val"><strong>${esc(opts.fullName)}</strong></div>
      <div class="lbl">E-posta</div>
      <div class="val"><a href="mailto:${esc(opts.email)}" style="color:#0052ff">${esc(opts.email)}</a></div>
      ${opts.company ? `<div class="lbl">Şirket</div><div class="val">${esc(opts.company)}</div>` : ""}
      ${opts.phone   ? `<div class="lbl">Telefon</div><div class="val">${esc(opts.phone)}</div>` : ""}
      <div style="display:flex;gap:12px;margin-top:24px;flex-wrap:wrap">
        <a href="${approveUrl}" class="btn" style="background:#16a34a">✓ Onayla</a>
        <a href="${rejectUrl}"  class="btn" style="background:#dc2626">✕ Reddet</a>
      </div>
      <p style="margin-top:16px;font-size:12px;color:#94a3b8">
        Bu linkler bir kez kullanılabilir ve güvenli şekilde imzalanmıştır.
      </p>
    </div>
    <div class="ft"><p>Lider Network Admin Paneli</p></div>
  `);

  await createTransporter().sendMail({
    from: `"Lider Network Destek" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: process.env.SMTP_TO || process.env.SMTP_USER,
    subject: `[Kayıt Talebi] ${opts.fullName} — ${opts.email}`,
    html,
  });
}

/** Email to customer: account approved */
export async function sendAccountApprovedEmail(opts: {
  fullName: string;
  email: string;
}): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const loginUrl = "https://destek.lidernetwork.com.tr/giris";

  const html = shell(`
    <div class="hd">
      <h1>LİDER NETWORK</h1>
      <p>Hesabınız Onaylandı</p>
    </div>
    <div class="bd">
      <span class="badge badge-green">Onaylandı</span>
      <p style="font-size:15px;color:#334155;margin-bottom:24px">
        Sayın <strong>${esc(opts.fullName)}</strong>,<br>
        Destek portalı hesabınız onaylandı. Artık giriş yapabilirsiniz.
      </p>
      <a href="${loginUrl}" class="btn">Destek Paneline Giriş Yap →</a>
      <p style="margin-top:20px;font-size:13px;color:#64748b">
        Sorularınız için: <a href="mailto:info@lidernetwork.com.tr" style="color:#0052ff">info@lidernetwork.com.tr</a>
      </p>
    </div>
    <div class="ft">
      <p>Lider Network · info@lidernetwork.com.tr · +90 312 232 02 88</p>
      <p>&copy; ${new Date().getFullYear()} Lider Network. Tüm hakları saklıdır.</p>
    </div>
  `);

  await createTransporter().sendMail({
    from: `"Lider Network Destek" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: opts.email,
    subject: "Destek Portalı Hesabınız Onaylandı — Lider Network",
    html,
  });
}

/** Email to customer: registration received, awaiting approval */
export async function sendRegistrationReceivedEmail(opts: {
  fullName: string;
  email: string;
}): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const html = shell(`
    <div class="hd">
      <h1>LİDER NETWORK</h1>
      <p>Kayıt Talebiniz Alındı</p>
    </div>
    <div class="bd">
      <span class="badge badge-blue">İşlemde</span>
      <p style="font-size:15px;color:#334155;margin-bottom:20px">
        Sayın <strong>${esc(opts.fullName)}</strong>,<br>
        Destek portalı kayıt talebiniz alındı. Ekibimiz hesabınızı inceleyip en kısa sürede onaylayacak.
        Onaylandığında e-posta ile bilgilendirileceksiniz.
      </p>
      <p style="font-size:13px;color:#64748b">
        Acil destek için:<br>
        📞 <a href="tel:+903122320288" style="color:#0052ff">+90 312 232 02 88</a><br>
        ✉️ <a href="mailto:info@lidernetwork.com.tr" style="color:#0052ff">info@lidernetwork.com.tr</a>
      </p>
    </div>
    <div class="ft">
      <p>Lider Network · info@lidernetwork.com.tr · +90 312 232 02 88</p>
      <p>&copy; ${new Date().getFullYear()} Lider Network. Tüm hakları saklıdır.</p>
    </div>
  `);

  await createTransporter().sendMail({
    from: `"Lider Network Destek" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: opts.email,
    subject: "Kayıt Talebiniz Alındı — Lider Network Destek",
    html,
  });
}
