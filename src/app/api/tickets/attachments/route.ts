import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`attachment:${ip}`, 20, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Çok fazla yükleme denemesi." }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Geçersiz form verisi." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: "Desteklenmeyen dosya türü. JPG, PNG, GIF, WebP veya PDF yükleyebilirsiniz." }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "Dosya 10 MB'dan büyük olamaz." }, { status: 400 });

  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `pending/${randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("ticket-attachments")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return NextResponse.json({ error: "Dosya yüklenemedi." }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from("ticket-attachments")
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrl, path, name: file.name, size: file.size });
}
