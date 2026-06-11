import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin-auth";
import { sendRenewalReminderEmail, RENEWAL_NOTIFY_TO, type RenewalItem } from "@/lib/contract-mail";

/* ── GET /api/admin/contracts/check-renewals ───────────────────────
   Her sabah çalışır (Vercel Cron). 30 gün içinde bitecek veya süresi
   geçmiş aktif sözleşmeleri tek bir özet mail olarak fortigate@... adresine yollar.

   Yetki:
   - Vercel Cron: Authorization: Bearer ${CRON_SECRET}
   - Manuel test:  ?key=${CRON_SECRET}  veya admin oturumu
─────────────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  const secret = process.env.CRON_SECRET;

  const viaCron = !!secret && authHeader === `Bearer ${secret}`;
  const viaKey = !!secret && key === secret;
  const viaAdmin = await getAdminSession();
  if (!viaCron && !viaKey && !viaAdmin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("status", "active");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const items: RenewalItem[] = [];
  for (const c of data || []) {
    if (!c.end_date) continue;
    if (c.auto_remind === false) continue;
    const d = Math.ceil((new Date(c.end_date + "T00:00:00").getTime() - today.getTime()) / 86400000);
    // 30 gün içinde bitecek VEYA son 30 gün içinde süresi geçmiş
    if (d <= 30 && d >= -30) {
      items.push({
        title: c.title, company_name: c.company_name, type: c.type,
        serial_no: c.serial_no, end_date: c.end_date, amount: Number(c.amount) || 0,
        currency: c.currency || "TL", daysLeft: d,
      });
    }
  }

  if (!items.length) {
    return NextResponse.json({ success: true, sent: false, message: "Hatırlatılacak sözleşme yok." });
  }

  // En yakın bitenden uzağa sırala
  items.sort((a, b) => a.daysLeft - b.daysLeft);

  try {
    await sendRenewalReminderEmail(items);
  } catch (e) {
    return NextResponse.json({ error: "Mail gönderilemedi: " + (e instanceof Error ? e.message : "hata") }, { status: 500 });
  }

  return NextResponse.json({ success: true, sent: true, count: items.length, to: RENEWAL_NOTIFY_TO });
}
