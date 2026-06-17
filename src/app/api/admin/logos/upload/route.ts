import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export const maxDuration = 30;
const BUCKET = "company-logos";

// POST — şirket logosu yükle (multipart form-data) → { url }
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Logo dosyası gerekli" }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Dosya 2MB'tan büyük olamaz" }, { status: 400 });

  const mimeOk = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"].includes(file.type);
  if (!mimeOk) return NextResponse.json({ error: "Sadece PNG, JPG, SVG veya WebP yüklenebilir" }, { status: 400 });

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
  return NextResponse.json({ url: pub.publicUrl });
}
