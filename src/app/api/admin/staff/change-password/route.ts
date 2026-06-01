import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSessionUser, verifyPassword, hashPassword } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Mevcut ve yeni şifre gereklidir" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Yeni şifre en az 8 karakter olmalıdır" }, { status: 400 });
  }

  // Fetch staff record with password_hash
  const { data: staffRecord, error: fetchError } = await supabase
    .from("staff_users")
    .select("id, email, password_hash, active")
    .eq("email", sessionUser.email.toLowerCase().trim())
    .eq("active", true)
    .single();

  if (fetchError || !staffRecord) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  // Verify current password
  if (!verifyPassword(currentPassword, staffRecord.password_hash)) {
    return NextResponse.json({ error: "Mevcut şifre hatalı" }, { status: 401 });
  }

  // Hash new password and update
  const newHash = hashPassword(newPassword);
  const { error: updateError } = await supabase
    .from("staff_users")
    .update({ password_hash: newHash })
    .eq("id", staffRecord.id);

  if (updateError) {
    console.error("Password update error:", updateError);
    return NextResponse.json({ error: "Şifre güncellenemedi" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Şifre başarıyla güncellendi" });
}
