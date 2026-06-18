import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

/* ── POST /api/admin/tickets/bulk
   Body: { ids: string[], action: "close" | "resolve" | "assign", assigned_to?: string }
────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
  const action: string = body.action || "";

  if (ids.length === 0) return NextResponse.json({ error: "ID listesi boş" }, { status: 400 });
  if (ids.length > 100) return NextResponse.json({ error: "En fazla 100 talep seçilebilir" }, { status: 400 });

  let patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (action === "close")   patch.status = "closed";
  else if (action === "resolve") patch.status = "resolved";
  else if (action === "assign") {
    const assigned_to = (body.assigned_to || "").trim();
    if (!assigned_to) return NextResponse.json({ error: "Personel seçilmedi" }, { status: 400 });
    patch.assigned_to = assigned_to;
    patch.status = "in_progress";
  } else {
    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  }

  const { error, count } = await supabase
    .from("tickets")
    .update(patch)
    .in("id", ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: count ?? ids.length });
}
