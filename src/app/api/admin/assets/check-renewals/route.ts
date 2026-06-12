import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin-auth";
import { sendRenewalReminderEmail, RENEWAL_NOTIFY_TO, type RenewalItem } from "@/lib/contract-mail";

/* ── GET /api/admin/assets/check-renewals ──────────────────────────
   Her sabah çalışır (Vercel Cron). Lisanslı cihazlardan, lisans/garanti
   bitişi 30 gün içinde olan veya yeni süresi geçenleri tek özet mail
   olarak fortigate@... adresine yollar.

   Yetki: Vercel Cron (Bearer ${CRON_SECRET}) · ?key=${CRON_SECRET} · admin oturumu
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
    .from("assets")
    .select("*")
    .eq("status", "active");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const items: RenewalItem[] = [];
  for (const a of data || []) {
    if (a.licensed === false) continue;       // lisanssız cihazlar hatırlatılmaz
    if (!a.warranty_end) continue;
    const d = Math.ceil((new Date(a.warranty_end + "T00:00:00").getTime() - today.getTime()) / 86400000);
    // 30 gün içinde bitecek VEYA son 30 gün içinde bitmiş
    if (d <= 30 && d >= -30) {
      const title = `${a.brand ? a.brand + " " : ""}${a.model || a.type}`.trim();
      items.push({
        title, company_name: a.company_name, type: a.type || "lisans",
        serial_no: a.serial_no, end_date: a.warranty_end, amount: 0,
        currency: "TL", daysLeft: d,
      });
    }
  }

  if (!items.length) {
    return NextResponse.json({ success: true, sent: false, message: "Hatırlatılacak lisans yok." });
  }

  items.sort((x, y) => x.daysLeft - y.daysLeft);

  try {
    await sendRenewalReminderEmail(items);
  } catch (e) {
    return NextResponse.json({ error: "Mail gönderilemedi: " + (e instanceof Error ? e.message : "hata") }, { status: 500 });
  }

  return NextResponse.json({ success: true, sent: true, count: items.length, to: RENEWAL_NOTIFY_TO });
}
