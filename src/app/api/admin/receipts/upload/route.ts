import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { randomUUID } from "crypto";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

export async function POST(req: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Geçersiz form" }, { status: 400 });

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  if (!ALLOWED.includes(file.type))
    return NextResponse.json({ error: "Sadece JPG/PNG/WebP yükleyebilirsiniz." }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "Dosya 15 MB'dan büyük olamaz." }, { status: 400 });

  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const path = `checks/${randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from("ticket-attachments")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: "Yükleme başarısız." }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from("ticket-attachments")
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
