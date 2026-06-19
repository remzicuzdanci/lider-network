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
  { email: "remzi.cuzdanci@lidernetwork.com.tr",  name: "Remzi Cuzdancı",  role: "super_admin" },
  { email: "yunus.oztekin@lidernetwork.com.tr",   name: "Yunus Öztekin",   role: "super_admin" },
  { email: "enes.yildiz@lidernetwork.com.tr",     name: "Enes Yıldız",     role: "staff" },
  { email: "murat.aykac@lidernetwork.com.tr",     name: "Murat Aykaç",     role: "staff" },
  { email: "halil.oztekin@lidernetwork.com.tr",   name: "Halil Öztekin",   role: "staff" },
  { email: "omer.oztekin@lidernetwork.com.tr",    name: "Ömer Öztekin",    role: "staff" },
];

async function runSetup(key: string | null) {
  // Authorization
  if (!process.env.ADMIN_PASSWORD || key !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Yetkisiz — key parametresi yanlış veya eksik" }, { status: 401 });
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

// GET — tarayıcıdan direkt açılabilir
export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("key");
  return runSetup(key);
}

// POST — curl / fetch ile de çalışır
export async function POST(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("key");
  return runSetup(key);
}
