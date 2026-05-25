import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin-auth";
import {
  sendAccountApprovedEmail,
} from "@/lib/ticket-mail";

// GET — list all customers
export async function GET(request: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all"; // all | pending | approved

  let query = supabase
    .from("customer_profiles")
    .select("id, full_name, company, phone, approved, created_at")
    .order("created_at", { ascending: false });

  if (filter === "pending")  query = query.eq("approved", false);
  if (filter === "approved") query = query.eq("approved", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Veritabanı hatası" }, { status: 500 });

  // Fetch emails from auth.users via admin API
  const ids = (data || []).map((c) => c.id);
  const emailMap: Record<string, string> = {};
  for (const id of ids) {
    const { data: u } = await supabase.auth.admin.getUserById(id);
    if (u?.user?.email) emailMap[id] = u.user.email;
  }

  const customers = (data || []).map((c) => ({
    ...c,
    email: emailMap[c.id] || "",
  }));

  return NextResponse.json({ customers });
}

// PATCH — approve or reject a customer
export async function PATCH(request: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id, action } = await request.json();
  if (!id || !action)
    return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });

  if (action === "approve") {
    const { error } = await supabase
      .from("customer_profiles")
      .update({ approved: true })
      .eq("id", id);

    if (error) return NextResponse.json({ error: "Güncelleme hatası" }, { status: 500 });

    // Get user email and send welcome email
    const { data: u } = await supabase.auth.admin.getUserById(id);
    const { data: profile } = await supabase
      .from("customer_profiles")
      .select("full_name")
      .eq("id", id)
      .single();

    if (u?.user?.email && profile) {
      sendAccountApprovedEmail({
        fullName: profile.full_name,
        email: u.user.email,
      }).catch(console.error);
    }

    return NextResponse.json({ success: true });
  }

  if (action === "reject") {
    // Delete profile first, then auth user (cascade handles profile but let's be safe)
    await supabase.from("customer_profiles").delete().eq("id", id);
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: "Silme hatası" }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
}
