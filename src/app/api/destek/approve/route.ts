import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  validateApproveToken,
  sendAccountApprovedEmail,
} from "@/lib/ticket-mail";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  // Rate limit: max 10 istek / 15 dakika / IP (kaba kuvvet + mass deletion koruması)
  const ip = getClientIp(request);
  const rl = rateLimit(`approve:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return new NextResponse("Çok fazla istek. Lütfen bekleyin.", {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
    });
  }

  const { searchParams } = new URL(request.url);
  const uid    = searchParams.get("uid");
  const token  = searchParams.get("token");
  const action = searchParams.get("action") || "approve";

  if (!uid || !token) {
    return new NextResponse("Geçersiz link.", { status: 400 });
  }

  if (!validateApproveToken(uid, token)) {
    return new NextResponse("Geçersiz veya süresi dolmuş link.", { status: 403 });
  }

  if (action === "reject") {
    // Delete user and profile
    await supabase.auth.admin.deleteUser(uid);
    return new NextResponse(html("Reddedildi", "Kullanıcı hesabı silindi.", "#dc2626"), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Fetch profile for welcome email
  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("full_name, phone")
    .eq("id", uid)
    .single();

  // Fetch user email
  const { data: { user } } = await supabase.auth.admin.getUserById(uid);

  if (!user) {
    return new NextResponse("Kullanıcı bulunamadı.", { status: 404 });
  }

  // Approve: set approved = true
  const { error } = await supabase
    .from("customer_profiles")
    .update({ approved: true })
    .eq("id", uid);

  if (error) {
    return new NextResponse("Güncelleme hatası: " + error.message, { status: 500 });
  }

  // Send welcome email to customer
  sendAccountApprovedEmail({
    fullName: profile?.full_name || user.email || "Müşteri",
    email: user.email!,
  }).catch(console.error);

  return new NextResponse(
    html(
      "Onaylandı ✓",
      `<strong>${profile?.full_name || user.email}</strong> hesabı başarıyla onaylandı.<br>Müşteriye bilgilendirme e-postası gönderildi.`,
      "#16a34a"
    ),
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function html(title: string, body: string, color: string) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Lider Network</title>
<style>
  body{font-family:Arial,sans-serif;background:#101415;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .card{background:#1d2022;border:1px solid #434656;border-radius:16px;padding:40px;max-width:440px;width:100%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.4)}
  .icon{width:56px;height:56px;border-radius:50%;background:${color}22;border:2px solid ${color};display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:24px}
  h1{color:#e0e3e5;font-size:22px;margin:0 0 12px}
  p{color:#8d90a2;font-size:15px;line-height:1.6;margin:0 0 24px}
  a{display:inline-block;padding:12px 24px;background:#0052ff;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px}
  .brand{color:#b7c4ff;font-size:13px;margin-top:24px;opacity:.7}
</style>
</head>
<body>
<div class="card">
  <div class="icon" style="color:${color}">✓</div>
  <h1>${title}</h1>
  <p>${body}</p>
  <a href="/admin/destek">Admin Paneline Dön</a>
  <p class="brand">Lider Network Destek Merkezi</p>
</div>
</body>
</html>`;
}
