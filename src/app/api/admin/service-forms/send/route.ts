import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { sendServiceFormEmail } from "@/lib/service-form-mail";

/* ── POST /api/admin/service-forms/send ────────────────────────────
   Sends the service form to the customer e-mail from the destek@
   account, then marks the form as "sent".
─────────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const isAdmin = await getAdminSession();
  const user = await getSessionUser();
  if (!isAdmin && !user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  // Load the form + company name
  const { data: form, error } = await supabase
    .from("service_forms")
    .select("*, companies(name)")
    .eq("id", id)
    .single();

  if (error || !form) {
    return NextResponse.json({ error: "Form bulunamadı" }, { status: 404 });
  }

  if (!form.customer_email) {
    return NextResponse.json({ error: "Müşteri e-postası boş" }, { status: 400 });
  }

  try {
    await sendServiceFormEmail({
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_email: form.customer_email,
      customer_address: form.customer_address,
      service_description: form.service_description,
      items_delivered: form.items_delivered,
      notes: form.notes,
      signed_by: form.signed_by,
      signed_at: form.signed_at,
      company_name: form.companies?.name,
      form_type: form.form_type === "delivery" ? "delivery" : "service",
    });
  } catch (e) {
    console.error("Servis formu e-postası gönderilemedi:", e);
    return NextResponse.json(
      { error: "E-posta gönderilemedi: " + (e instanceof Error ? e.message : "Bilinmeyen hata") },
      { status: 500 }
    );
  }

  // Mark as sent
  const { data: updated, error: upErr } = await supabase
    .from("service_forms")
    .update({
      status: "sent",
      sent_to_email: form.customer_email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
