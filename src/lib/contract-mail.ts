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

// Yenileme hatırlatma maillerinin gideceği adres (lisans/sözleşme takibi)
export const RENEWAL_NOTIFY_TO =
  process.env.RENEWAL_NOTIFY_EMAIL || "fortigate@lidernetwork.com.tr";

function esc(s: string): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

const SYM: Record<string, string> = { TL: "₺", TRY: "₺", USD: "$", EUR: "€" };

export interface RenewalItem {
  title: string;
  company_name: string | null;
  type: string;
  serial_no: string | null;
  end_date: string;
  amount: number;
  currency: string;
  daysLeft: number;
}

const TYPE_LABEL: Record<string, string> = {
  fortinet: "Fortinet Lisans/Bundle", destek: "Destek Sözleşmesi", bakim: "Bakım",
  lisans: "Yazılım Lisansı", donanim: "Donanım Garanti", diger: "Diğer",
};

function fmtDate(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

/** Yaklaşan/geçmiş sözleşmeleri tek bir özet mail olarak gönderir. */
export async function sendRenewalReminderEmail(items: RenewalItem[]): Promise<void> {
  if (!items.length) return;
  const transporter = createTransporter();

  const expired = items.filter(i => i.daysLeft < 0);
  const urgent  = items.filter(i => i.daysLeft >= 0 && i.daysLeft <= 7);
  const soon    = items.filter(i => i.daysLeft > 7);

  const rows = (arr: RenewalItem[], accent: string) => arr.map(i => {
    const sym = SYM[i.currency] || "";
    const amount = i.amount > 0 ? `${sym}${i.amount.toLocaleString("tr-TR")}` : "—";
    const durum = i.daysLeft < 0 ? `${Math.abs(i.daysLeft)} gün geçti` : `${i.daysLeft} gün kaldı`;
    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;font-size:13px;color:#1a1d2e;font-weight:600">${esc(i.title)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;font-size:13px;color:#475569">${esc(i.company_name || "—")}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;font-size:12px;color:#6b7280">${esc(TYPE_LABEL[i.type] || i.type)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;font-size:13px;color:#1a1d2e">${fmtDate(i.end_date)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;font-size:12px;font-weight:700;color:${accent}">${durum}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;font-size:13px;color:#15803d;font-weight:700;text-align:right">${amount}</td>
    </tr>`;
  }).join("");

  const section = (title: string, arr: RenewalItem[], accent: string) => arr.length ? `
    <h3 style="font-size:14px;color:${accent};margin:22px 0 8px">${title} (${arr.length})</h3>
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #eef2f7;border-radius:8px;overflow:hidden">
      <thead><tr style="background:#f8fafc">
        <th style="padding:9px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase">Sözleşme</th>
        <th style="padding:9px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase">Firma</th>
        <th style="padding:9px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase">Tür</th>
        <th style="padding:9px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase">Bitiş</th>
        <th style="padding:9px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase">Durum</th>
        <th style="padding:9px 12px;text-align:right;font-size:11px;color:#94a3b8;text-transform:uppercase">Tutar</th>
      </tr></thead>
      <tbody>${rows(arr, accent)}</tbody>
    </table>` : "";

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"></head>
  <body style="font-family:Arial,sans-serif;background:#f4f6fb;margin:0;padding:24px">
    <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.07)">
      <div style="background:linear-gradient(135deg,#0052ff,#3730a3);padding:26px 30px">
        <h1 style="color:#fff;margin:0;font-size:20px">🔔 Sözleşme Yenileme Hatırlatması</h1>
        <p style="color:#c7d2fe;margin:6px 0 0;font-size:13px">Lider Network — Lisans & Sözleşme Takibi · ${new Date().toLocaleDateString("tr-TR")}</p>
      </div>
      <div style="padding:24px 30px">
        <p style="font-size:14px;color:#475569;margin:0 0 6px">Aşağıdaki sözleşmelerin bitiş tarihi yaklaşıyor. Yenileme tekliflerini hazırlamak için panele giriş yapın.</p>
        ${section("⛔ Süresi Geçmiş", expired, "#dc2626")}
        ${section("🔴 7 Gün İçinde Bitecek", urgent, "#ea580c")}
        ${section("🟡 30 Gün İçinde Bitecek", soon, "#d97706")}
      </div>
      <div style="background:#f8fafc;padding:16px 30px;border-top:1px solid #eef2f7;text-align:center">
        <p style="color:#94a3b8;font-size:12px;margin:0">Bu otomatik bir hatırlatmadır · Lider Network Destek Paneli</p>
      </div>
    </div>
  </body></html>`;

  await transporter.sendMail({
    from: `"Lider Network" <${FROM}>`,
    to: RENEWAL_NOTIFY_TO,
    subject: `🔔 ${items.length} sözleşme yenileme zamanı yaklaşıyor`,
    html,
    replyTo: FROM,
  });
}
