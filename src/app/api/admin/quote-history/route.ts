import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

/* ── GET /api/admin/quote-history?product_id=...&name=... ────────────
   Bir ürünün geçmiş tekliflerdeki fiyatlarını ve kime/hangi tarihte
   verildiğini döndürür. (items JSONB içinde aranır.)
─────────────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const isAdmin = await getAdminSession();
  const user = await getSessionUser();
  if (!isAdmin && !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const u = new URL(req.url);
  const productId = u.searchParams.get("product_id");
  const name = (u.searchParams.get("name") || "").trim().toLowerCase();
  if (!productId && !name) return NextResponse.json({ history: [] });

  const { data: quotes } = await supabase
    .from("quotes")
    .select("quote_no, customer_name, quote_date, currency, items, created_at")
    .order("created_at", { ascending: false })
    .limit(400);

  const history: { quote_no: string; customer_name: string; quote_date: string; unit_price: number; quantity: number; currency: string; discount: number }[] = [];

  for (const q of quotes || []) {
    const items = Array.isArray(q.items) ? q.items : [];
    for (const it of items as Array<{ product_id?: string; description?: string; unit_price?: number; quantity?: number; discount?: number }>) {
      const match = productId ? it.product_id === productId : (it.description || "").trim().toLowerCase() === name;
      if (match) {
        history.push({
          quote_no: q.quote_no,
          customer_name: q.customer_name || "—",
          quote_date: q.quote_date || q.created_at,
          unit_price: Number(it.unit_price) || 0,
          quantity: Number(it.quantity) || 0,
          discount: Number(it.discount) || 0,
          currency: q.currency || "TL",
        });
      }
    }
  }

  return NextResponse.json({ history: history.slice(0, 25) });
}
