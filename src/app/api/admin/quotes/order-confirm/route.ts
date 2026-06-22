import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import nodemailer from "nodemailer";

export const maxDuration = 20;

const SITE_BASE = process.env.PDF_ASSET_BASE || "https://www.lidernetwork.com.tr";
const FROM      = process.env.SMTP_TEKLIF_FROM || process.env.SMTP_TEKLIF_USER || "teklif@lidernetwork.com.tr";
const FROM_NAME = process.env.SMTP_TEKLIF_FROM_NAME || "Lider Network - Teklif Servisi";
const QUOTE_CC  = (process.env.QUOTE_CC || "remzi.cuzdanci@lidernetwork.com.tr,yunus.oztekin@lidernetwork.com.tr")
  .split(",").map(s => s.trim()).filter(Boolean);

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_TEKLIF_USER || process.env.SMTP_USER,
      pass: process.env.SMTP_TEKLIF_PASS || process.env.SMTP_PASS,
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

interface OrderItem { description: string; quantity: number; unit: string; unit_price: number; discount?: number; kdv_rate?: number; }

// POST /api/admin/quotes/order-confirm  { id, email, selectedItems, note, currency }
export async function POST(req: NextRequest) {
  const isAdmin = await getAdminSession();
  const user    = await getSessionUser();
  if (!isAdmin && !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id, email, selectedItems, note, currency } = await req.json() as {
    id: string; email: string; selectedItems: OrderItem[]; note?: string; currency: string;
  };
  if (!id)    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });

  const { data: q, error } = await supabase.from("quotes").select("*").eq("id", id).single();
  if (error || !q) return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });

  const cur         = currency || q.currency || "TL";
  const senderName  = user?.name || FROM_NAME;
  const approvalUrl = `${SITE_BASE}/teklif/onay/${id}`;
  const items       = (selectedItems || q.items || []) as OrderItem[];
  const grandTotal  = items.reduce((s, it) => {
    const gross = it.quantity * it.unit_price;
    const net   = gross - gross * (it.discount || 0) / 100;
    return s + net;
  }, 0);

  const itemRows = items.map((it, i) => {
    const gross = it.quantity * it.unit_price;
    const net   = gross - gross * (it.discount || 0) / 100;
    return `<tr style="background:${i % 2 ? "#f5f8ff" : "#fff"}">
      <td style="padding:9px 14px;font-size:12.5px;color:#1e293b"><span style="color:#7c3aed;font-weight:700">${i + 1}.</span> ${esc(it.description)}</td>
      <td style="padding:9px 12px;font-size:12.5px;text-align:center;color:#475569;white-space:nowrap">${it.quantity} ${esc(it.unit || "Adet")}</td>
      <td style="padding:9px 14px;font-size:12.5px;text-align:right;font-weight:700;color:#1e293b;white-space:nowrap">${money(net, cur)}</td>
    </tr>`;
  }).join("");

  const html = `
<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:28px 14px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 30px rgba(15,23,42,.10);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6d28d9,#7c3aed);padding:28px 32px;">
          <div style="display:inline-block;background:#ffffff;border-radius:9px;padding:8px 14px;margin-bottom:16px;">
            <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" width="140" height="auto" style="display:block;width:140px;border:0;" />
          </div>
          <div style="color:#ffffff;font-size:20px;font-weight:800;">Siparişiniz Alındı</div>
          <div style="color:#ddd6fe;font-size:13px;margin-top:6px;">Teklif No: <strong style="color:#fff;">${esc(q.quote_no)}</strong> &middot; ${fmtDate(new Date().toISOString())}</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 32px 24px;">
          <p style="margin:0 0 18px;font-size:15px;color:#1e293b;line-height:1.7;">
            Sayın <strong>${esc(q.customer_name || "Yetkili")}</strong>,
          </p>
          <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.8;">
            <strong>${esc(q.quote_no)}</strong> numaralı teklifimize ilişkin siparişinizi aldık. Teşekkür ederiz.
          </p>
          <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.8;">
            Ürün tedariki ve gerekli işlemler tamamlandığında sizi bilgilendireceğiz. Süreç boyunca herhangi bir sorunuz olursa bizimle iletişime geçebilirsiniz.
          </p>

          <!-- Sipariş özeti -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            <tr><td style="padding:12px 18px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;">
              <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#64748b;">Sipariş Özeti</span>
            </td></tr>
            <tr><td style="padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr style="background:#0f172a;">
                    <th style="padding:9px 14px;font-size:10.5px;font-weight:700;color:#fff;text-align:left;letter-spacing:.4px;">ÜRÜN / HİZMET</th>
                    <th style="padding:9px 12px;font-size:10.5px;font-weight:700;color:#fff;text-align:center;letter-spacing:.4px;">MİKTAR</th>
                    <th style="padding:9px 14px;font-size:10.5px;font-weight:700;color:#fff;text-align:right;letter-spacing:.4px;">TUTAR</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                  <tr style="background:#f0f4ff;">
                    <td colspan="2" style="padding:11px 14px;font-size:13px;font-weight:800;color:#7c3aed;">TOPLAM</td>
                    <td style="padding:11px 14px;font-size:15px;font-weight:900;color:#7c3aed;text-align:right;white-space:nowrap;">${money(grandTotal, cur)}</td>
                  </tr>
                </tbody>
              </table>
            </td></tr>
          </table>

          ${note ? `
          <div style="margin-bottom:24px;padding:14px 16px;background:#faf5ff;border:1px solid #e9d5ff;border-left:3px solid #7c3aed;border-radius:9px;">
            <div style="font-size:11px;font-weight:800;color:#6d28d9;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;">Not</div>
            <div style="font-size:13px;color:#4c1d95;line-height:1.7;">${esc(note)}</div>
          </div>` : ""}

          <!-- CTA -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <a href="${approvalUrl}" style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#7c3aed);color:#ffffff;font-size:14px;font-weight:700;padding:13px 28px;border-radius:10px;text-decoration:none;box-shadow:0 4px 14px rgba(124,58,237,.30);">
                Siparişi Görüntüle →
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;">
            Bu e-postayı yanıtlayarak veya doğrudan arayarak bize ulaşabilirsiniz.
          </p>
          <p style="margin:18px 0 0;font-size:14px;color:#1e293b;font-weight:700;">
            Saygılarımla,<br>
            <span style="font-weight:400;color:#64748b;">${esc(senderName)}<br>Lider Network</span>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0f172a;padding:20px 32px;text-align:center;">
          <p style="color:#fff;font-size:13px;font-weight:700;margin:0 0 4px;">LİDER NETWORK</p>
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            <a href="https://www.lidernetwork.com.tr" style="color:#7dd3fc;text-decoration:none;">www.lidernetwork.com.tr</a> &middot; +90 312 232 02 88
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`.trim();

  try {
    await createTransporter().sendMail({
      from:    `"${FROM_NAME}" <${FROM}>`,
      to:      email,
      cc:      QUOTE_CC.length ? QUOTE_CC : undefined,
      replyTo: FROM,
      subject: `Siparişiniz Alındı — ${q.quote_no} · Lider Network`,
      html,
    });
  } catch (e) {
    console.error("Sipariş onay maili gönderilemedi:", e);
    return NextResponse.json({ error: "E-posta gönderilemedi: " + (e instanceof Error ? e.message : "hata") }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
