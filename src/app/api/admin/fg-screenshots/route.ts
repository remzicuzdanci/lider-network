import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export const maxDuration = 30;
const BUCKET = "fortigate-screenshots";

// GET — kütüphanedeki tüm ekran görüntüleri
export async function GET() {
  const isAdmin = await getAdminSession();
  const user = await getSessionUser();
  if (!isAdmin && !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("fg_screenshots")
    .select("id, title, tags, menu_path, image_url, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ screenshots: data || [] });
}

// POST — yeni ekran görüntüsü yükle (multipart form-data)
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const title = (form.get("title") as string || "").trim();
  const tags = (form.get("tags") as string || "").trim();
  const menu_path = (form.get("menu_path") as string || "").trim();

  if (!file) return NextResponse.json({ error: "Görsel dosyası gerekli" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "Başlık gerekli" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Dosya 5MB'tan büyük olamaz" }, { status: 400 });

  // Bucket yoksa oluştur (varsa hatayı yut)
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type || "image/png",
    upsert: false,
  });
  if (upErr) return NextResponse.json({ error: "Yükleme hatası: " + upErr.message }, { status: 500 });

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from("fg_screenshots")
    .insert({ title, tags: tags || null, menu_path: menu_path || null, image_url: pub.publicUrl, storage_path: path })
    .select("id, title, tags, menu_path, image_url, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE — ekran görüntüsü sil
export async function DELETE(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const { data: row } = await supabase.from("fg_screenshots").select("storage_path").eq("id", id).maybeSingle();
  if (row?.storage_path) await supabase.storage.from(BUCKET).remove([row.storage_path]).catch(() => {});

  const { error } = await supabase.from("fg_screenshots").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
