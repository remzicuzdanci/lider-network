import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import nodemailer from "nodemailer";

export const runtime   = "nodejs";
export const maxDuration = 60;

// Kaç gün sonra otomatik takip gönderilsin (default: 3)
const FOLLOWUP_DAYS = parseInt(process.env.QUOTE_FOLLOWUP_DAYS || "3");

const FROM      = process.env.SMTP_TEKLIF_FROM || process.env.SMTP_TEKLIF_USER || "teklif@lidernetwork.com.tr";
const FROM_NAME = process.env.SMTP_TEKLIF_FROM_NAME || "Lider Network Teklif Servisi";
const QUOTE_CC  = (process.env.QUOTE_CC || "remzi.cuzdanci@lidernetwork.com.tr,yunus.oztekin@lidernetwork.com.tr")
  .split(",").map(s => s.trim()).filter(Boolean);
const SITE_BASE = process.env.PDF_ASSET_BASE || "https://www.lidernetwork.com.tr";

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

function esc(s: string | null | undefined): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function fmtDate(d?: string | null): string {
  return d ? new Date(d).toLocaleDateString("tr-TR") : "—";
}
const SYM: Record<string, string> = { TL: "₺", TRY: "₺", USD: "$", EUR: "€" };
function money(n: number, cur: string): string {
  return `${SYM[cur] || cur + " "}${Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;
}

async function sendFollowupMail(q: {
  id: string; quote_no: string; customer_name?: string; quote_date?: string;
  valid_until?: string; currency: string; grand_total: number;
}, toEmail: string): Promise<void> {
  const cur         = q.currency || "TL";
  const approvalUrl = `${SITE_BASE}/teklif/onay/${q.id}`;

  const html = `
<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:28px 14px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 30px rgba(15,23,42,.10);">
        <tr><td bgcolor="#0052ff" style="background:#0052ff;padding:26px 32px;">
          <div style="display:inline-block;background:#ffffff;border-radius:9px;padding:8px 14px;margin-bottom:14px;">
            <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" width="140" height="auto" style="display:block;width:140px;border:0;" />
          </div>
          <div style="color:#ffffff;font-size:18px;font-weight:800;">Teklifiniz Hakkında</div>
          <div style="color:#cdd9ff;font-size:13px;margin-top:4px;">Teklif No: <strong style="color:#fff;">${esc(q.quote_no)}</strong> &middot; ${FOLLOWUP_DAYS} gün önce gönderildi</div>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <p style="margin:0 0 18px;font-size:15px;color:#1e293b;line-height:1.7;">
            Sayın <strong>${esc(q.customer_name || "Yetkili")}</strong>,
          </p>
          <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.8;">
            <strong>${fmtDate(q.quote_date)}</strong> tarihinde <strong>${esc(q.quote_no)}</strong> numaralı teklifimizi iletmiştik. Bu konuda bir gelişme var mı, merak ederek ulaşmak istedik.
          </p>
          <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.8;">
            Teklifimizi inceleme fırsatı bulabildiyseniz herhangi bir sorunuz ya da üzerinde konuşmak istediğiniz bir nokta var mı? Fiyat, kapsam veya teslimat koşulları konusunda müzakereye her zaman açığız.
          </p>
          <p style="margin:0 0 28px;font-size:14px;color:#475569;line-height:1.8;">
            Sizin için farklı bir çözüm önerebilir ya da teklifin güncellenmiş bir versiyonunu hazırlayabiliriz — sadece bildirin.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:28px;">
            <tr><td style="padding:14px 18px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;">
              <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#64748b;">Teklif Özeti</span>
            </td></tr>
            <tr><td style="padding:14px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Teklif No</td><td align="right" style="font-size:13px;font-weight:700;color:#1e293b;padding:4px 0;">${esc(q.quote_no)}</td></tr>
                <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Teklif Tarihi</td><td align="right" style="font-size:13px;color:#1e293b;padding:4px 0;">${fmtDate(q.quote_date)}</td></tr>
                ${q.valid_until ? `<tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Geçerlilik</td><td align="right" style="font-size:13px;color:#1e293b;padding:4px 0;">${fmtDate(q.valid_until)}</td></tr>` : ""}
                <tr><td style="font-size:14px;font-weight:800;color:#0052ff;padding:10px 0 4px;border-top:1px solid #e2e8f0;">Genel Toplam</td><td align="right" style="font-size:16px;font-weight:900;color:#0052ff;padding:10px 0 4px;border-top:1px solid #e2e8f0;white-space:nowrap;">${money(q.grand_total, cur)}</td></tr>
              </table>
            </td></tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <a href="${approvalUrl}" style="display:inline-block;background:linear-gradient(135deg,#0038c7,#0052ff);color:#ffffff;font-size:14px;font-weight:700;padding:13px 28px;border-radius:10px;text-decoration:none;box-shadow:0 4px 14px rgba(0,82,255,.30);">
                Teklifi İncele ve Yanıtla →
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;">
            Bu e-postayı yanıtlayarak veya doğrudan arayarak ulaşabilirsiniz.
          </p>
          <p style="margin:18px 0 0;font-size:14px;color:#1e293b;font-weight:700;">
            Saygılarımla,<br><span style="font-weight:400;color:#64748b;">Lider Network Satış Ekibi</span>
          </p>
        </td></tr>
        <tr><td bgcolor="#0f172a" style="background:#0f172a;padding:20px 32px;text-align:center;">
          <p style="color:#fff;font-size:13px;font-weight:700;margin:0 0 4px;">LİDER NETWORK</p>
          <p style="color:#94a3b8;font-size:12px;margin:0;"><a href="https://www.lidernetwork.com.tr" style="color:#7dd3fc;text-decoration:none;">www.lidernetwork.com.tr</a> &middot; +90 312 232 02 88</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`.trim();

  await createTransporter().sendMail({
    from:    `"${FROM_NAME}" <${FROM}>`,
    to:      toEmail,
    cc:      QUOTE_CC.length ? QUOTE_CC : undefined,
    replyTo: FROM,
    subject: `Takip: Teklif ${q.quote_no} — Lider Network`,
    html,
  });
}

export async function GET(req: NextRequest) {
  // Vercel cron doğrulaması
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();

  // FOLLOWUP_DAYS gün önce "sent" durumuna geçmiş, henüz takip gönderilmemiş teklifler
  const cutoff     = new Date(Date.now() - FOLLOWUP_DAYS * 86_400_000).toISOString();
  const maxCutoff  = new Date(Date.now() - 30 * 86_400_000).toISOString(); // 30 günden eskiye gitme

  const { data: quotes, error } = await supabase
    .from("quotes")
    .select("id, quote_no, customer_name, quote_date, valid_until, currency, grand_total, company_id, updated_at")
    .eq("status", "sent")
    .is("followup_sent_at", null)
    .lte("updated_at", cutoff)       // en az FOLLOWUP_DAYS gün önce gönderilmiş
    .gte("updated_at", maxCutoff);   // ama 30 günden eski değil

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { quote_no: string; email: string; ok: boolean; error?: string }[] = [];

  for (const q of quotes ?? []) {
    // Müşteri e-postasını şirket tablosundan al
    let toEmail: string | null = null;
    if (q.company_id) {
      const { data: c } = await supabase
        .from("companies")
        .select("contact_email")
        .eq("id", q.company_id)
        .maybeSingle();
      toEmail = c?.contact_email ?? null;
    }

    if (!toEmail) {
      results.push({ quote_no: q.quote_no, email: "—", ok: false, error: "E-posta bulunamadı" });
      continue;
    }

    try {
      await sendFollowupMail(q, toEmail);
      // followup_sent_at güncelle
      await supabase
        .from("quotes")
        .update({ followup_sent_at: new Date().toISOString() })
        .eq("id", q.id);
      results.push({ quote_no: q.quote_no, email: toEmail, ok: true });
    } catch (e) {
      results.push({ quote_no: q.quote_no, email: toEmail, ok: false, error: String(e) });
    }
  }

  return NextResponse.json({
    success: true,
    elapsed_ms:    Date.now() - started,
    followup_days: FOLLOWUP_DAYS,
    processed:     results.length,
    sent:          results.filter(r => r.ok).length,
    failed:        results.filter(r => !r.ok).length,
    results,
  });
}
