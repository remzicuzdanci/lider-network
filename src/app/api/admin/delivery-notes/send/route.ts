import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { sendDeliveryNoteEmail } from "@/lib/delivery-mail";

export async function POST(req: NextRequest) {
  const isAdmin = await getAdminSession();
  const user = await getSessionUser();
  if (!isAdmin && !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id, email } = await req.json();
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "Alıcı e-postası gerekli" }, { status: 400 });

  const { data: n, error } = await supabase.from("delivery_notes").select("*").eq("id", id).single();
  if (error || !n) return NextResponse.json({ error: "Tutanak bulunamadı" }, { status: 404 });

  try {
    await sendDeliveryNoteEmail({
      note_no: n.note_no,
      customer_name: n.customer_name,
      customer_address: n.customer_address,
      delivery_date: n.delivery_date,
      delivered_by: n.delivered_by,
      received_by: n.received_by,
      items: Array.isArray(n.items) ? n.items : [],
      notes: n.notes,
      to: email,
    });
  } catch (e) {
    return NextResponse.json({ error: "E-posta gönderilemedi: " + (e instanceof Error ? e.message : "hata") }, { status: 500 });
  }

  const { data: updated } = await supabase
    .from("delivery_notes")
    .update({ status: "sent", sent_to_email: email, updated_at: new Date().toISOString() })
    .eq("id", id).select("*").single();

  return NextResponse.json(updated || { success: true });
}
