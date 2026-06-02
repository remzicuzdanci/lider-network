import nodemailer from "nodemailer";

export interface DigestTask {
  title: string;
  category?: string;
  priority?: string;
  status?: string;
  due_date?: string;
  company_name?: string;
  overdue?: boolean;
  dueToday?: boolean;
}

export interface TaskDigestData {
  staffName: string;
  staffEmail: string;
  tasks: DigestTask[];
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

function esc(s: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const PRI_LABEL: Record<string, { label: string; color: string }> = {
  urgent: { label: "ACİL", color: "#dc2626" },
  high:   { label: "Yüksek", color: "#ea580c" },
  medium: { label: "Orta", color: "#d97706" },
  low:    { label: "Düşük", color: "#64748b" },
};

function fmtDate(d?: string): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "long" });
}

function taskRow(t: DigestTask): string {
  const pri = PRI_LABEL[t.priority || "medium"] || PRI_LABEL.medium;
  const accent = t.overdue ? "#dc2626" : t.dueToday ? "#0052ff" : "#cbd5e1";
  const flag = t.overdue
    ? `<span style="display:inline-block;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:700;padding:2px 8px;border-radius:5px;">⚠ GECİKMİŞ</span>`
    : t.dueToday
    ? `<span style="display:inline-block;background:#eff6ff;color:#0052ff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:5px;">📅 BUGÜN</span>`
    : "";
  return `
    <tr>
      <td style="padding:0 0 10px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:14px 16px;background:#f8fafc;border-left:3px solid ${accent};border-radius:8px;">
            <div style="font-size:15px;font-weight:600;color:#1a1d2e;margin-bottom:6px;">${esc(t.title)}</div>
            <div style="font-size:12px;color:#64748b;">
              <span style="color:${pri.color};font-weight:700;">${pri.label}</span>
              ${t.company_name ? ` &nbsp;•&nbsp; 🏢 ${esc(t.company_name)}` : ""}
              ${t.due_date ? ` &nbsp;•&nbsp; 📆 ${fmtDate(t.due_date)}` : ""}
              ${flag ? ` &nbsp; ${flag}` : ""}
            </div>
          </td></tr>
        </table>
      </td>
    </tr>`;
}

export async function sendTaskDigestEmail(data: TaskDigestData): Promise<void> {
  if (!data.staffEmail || data.tasks.length === 0) return;

  const transporter = createTransporter();
  const today = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const overdueCount = data.tasks.filter(t => t.overdue).length;
  const todayCount = data.tasks.filter(t => t.dueToday).length;
  const subject = `Günaydın ${data.staffName} — Bugünkü görevleriniz (${data.tasks.length})`;

  const firstName = data.staffName.split(" ")[0] || data.staffName;

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Segoe UI',Roboto,Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:28px 14px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 30px rgba(15,23,42,.10);">

        <tr>
          <td bgcolor="#0052ff" style="background:#0052ff;padding:32px;">
            <div style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:1.5px;">☀️ Günaydın, ${esc(firstName)}!</div>
            <div style="color:#cdd9ff;font-size:13px;margin-top:8px;">${esc(today)}</div>
          </td>
        </tr>

        <tr>
          <td style="padding:26px 32px 10px;">
            <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0 0 18px;">
              Üzerinize atanmış <strong style="color:#1a1d2e;">${data.tasks.length} aktif göreviniz</strong> bulunuyor${overdueCount ? `, bunların <strong style="color:#dc2626;">${overdueCount} tanesi gecikmiş</strong>` : ""}${todayCount ? ` ve <strong style="color:#0052ff;">${todayCount} tanesi bugün</strong> teslim` : ""}.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${data.tasks.map(taskRow).join("")}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:6px 32px 28px;" align="center">
            <a href="https://www.lidernetwork.com.tr/admin/destek" style="display:inline-block;background:#0052ff;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:10px;">
              Panele Git →
            </a>
          </td>
        </tr>

        <tr>
          <td bgcolor="#0f172a" style="background:#0f172a;padding:22px 32px;text-align:center;">
            <p style="color:#ffffff;font-size:13px;font-weight:700;margin:0 0 4px;letter-spacing:.5px;">LİDER NETWORK</p>
            <p style="color:#64748b;font-size:11px;margin:0;">Bu otomatik bir hatırlatma e-postasıdır.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const text = [
    `Günaydın ${firstName}!`,
    today,
    "",
    `${data.tasks.length} aktif göreviniz var.`,
    "",
    ...data.tasks.map(t => `- ${t.title}${t.due_date ? ` (${fmtDate(t.due_date)})` : ""}${t.overdue ? " [GECİKMİŞ]" : t.dueToday ? " [BUGÜN]" : ""}`),
    "",
    "Panel: https://www.lidernetwork.com.tr/admin/destek",
  ].join("\n");

  await transporter.sendMail({
    from: `"Lider Network" <${DESTEK_FROM}>`,
    to: data.staffEmail,
    subject,
    html,
    text,
  });
}
