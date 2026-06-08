import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

/* ── Personel Notları ───────────────────────────────────────────────
   Her personel YALNIZCA kendi notlarını görür/düzenler. Tüm sorgular
   oturum açan kullanıcının e-postasına göre filtrelenir; başka birinin
   notuna erişim mümkün değildir.
─────────────────────────────────────────────────────────────────── */

// GET — kendi notlarım
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("staff_notes")
    .select("id, title, content, color, pinned, created_at, updated_at")
    .eq("owner_email", user.email)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data || [] });
}

// POST — yeni not
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  if (!body.content?.trim() && !body.title?.trim()) {
    return NextResponse.json({ error: "Boş not kaydedilemez" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("staff_notes")
    .insert({
      owner_email: user.email,
      title:   body.title?.trim() || null,
      content: body.content || "",
      color:   body.color || "#fffbeb",
      pinned:  !!body.pinned,
    })
    .select("id, title, content, color, pinned, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH — kendi notumu güncelle
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("title" in body)   fields.title = body.title?.trim() || null;
  if ("content" in body) fields.content = body.content || "";
  if ("color" in body)   fields.color = body.color;
  if ("pinned" in body)  fields.pinned = !!body.pinned;

  const { data, error } = await supabase
    .from("staff_notes")
    .update(fields)
    .eq("id", body.id)
    .eq("owner_email", user.email) // sadece kendi notu
    .select("id, title, content, color, pinned, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
  return NextResponse.json(data);
}

// DELETE — kendi notumu sil
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const { error } = await supabase
    .from("staff_notes")
    .delete()
    .eq("id", id)
    .eq("owner_email", user.email); // sadece kendi notu

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
