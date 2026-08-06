/**
 * One-time setup: seeds staff_users + companies tables.
 * Requires ?key=<ADMIN_PASSWORD> query param for security.
 * Run: POST /api/admin/setup?key=YOUR_ADMIN_PASSWORD
 *
 * Returns a list of created users + their initial passwords.
 * After running, store the passwords and share with each person.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/admin-auth";

function randomPass(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => chars[b % chars.length]).join("");
}

const INITIAL_STAFF = [
  { email: "remzi.cuzdanci@lidernetwork.com.tr",  name: "Remzi CUZDANCI",  role: "super_admin" },
  { email: "yunus.oztekin@lidernetwork.com.tr",   name: "Yunus Öztekin",   role: "super_admin" },
  { email: "enes.yildiz@lidernetwork.com.tr",     name: "Enes Yıldız",     role: "staff" },
  { email: "murat.aykac@lidernetwork.com.tr",     name: "Murat Aykaç",     role: "staff" },
  { email: "halil.oztekin@lidernetwork.com.tr",   name: "Halil Öztekin",   role: "staff" },
  { email: "omer.oztekin@lidernetwork.com.tr",    name: "Ömer Öztekin",    role: "staff" },
];

async function runSetup(key: string | null) {
  if (!key || !process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  const keyBuf = Buffer.from(key.padEnd(128));
  const pwBuf  = Buffer.from(process.env.ADMIN_PASSWORD.padEnd(128));
  const match  = keyBuf.length === pwBuf.length && crypto.timingSafeEqual(keyBuf, pwBuf) && key === process.env.ADMIN_PASSWORD;
  if (!match) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  // Check if already set up
  const { count } = await supabase.from("staff_users").select("*", { count: "exact", head: true });
  if (count && count > 0) {
    return NextResponse.json({ error: "Personel zaten mevcut. Tekrar çalıştırılamaz." }, { status: 409 });
  }

  const results: { email: string; name: string; role: string; initialPassword: string }[] = [];

  for (const staff of INITIAL_STAFF) {
    const pass = randomPass();
    const password_hash = hashPassword(pass);
    const { error } = await supabase.from("staff_users").insert({
      email: staff.email,
      name:  staff.name,
      role:  staff.role,
      password_hash,
      active: true,
    });
    if (error) {
      console.error(`Failed to create ${staff.email}:`, error);
    } else {
      results.push({ email: staff.email, name: staff.name, role: staff.role, initialPassword: pass });
    }
  }

  return NextResponse.json({
    success: true,
    message: "Personel hesapları oluşturuldu. İlk şifreleri paylaşın ve değiştirtmeyi unutmayın.",
    users: results,
  });
}

// POST only — key request body'de gelir, URL loglarına düşmez
// curl -X POST https://.../api/admin/setup -H "Content-Type: application/json" -d '{"key":"<ADMIN_PASSWORD>"}'
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return runSetup(body?.key ?? null);
}
