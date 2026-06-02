import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import {
  sendNewRegistrationEmail,
  sendRegistrationReceivedEmail,
} from "@/lib/ticket-mail";

const schema = z.object({
  fullName: z.string().min(2, "Ad soyad gerekli"),
  company:  z.string().min(1, "Şirket adı gerekli"),
  phone:    z.string().optional(),
  email:    z.string().email("Geçerli e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    // Use admin API — bypasses email confirmation & RLS
    const { data: userData, error: createErr } =
      await supabase.auth.admin.createUser({
        email:         data.email,
        password:      data.password,
        email_confirm: true, // skip Supabase confirmation; we have admin approval
      });

    if (createErr) {
      const msg = createErr.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("unique")) {
        return NextResponse.json(
          { error: "Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin." },
          { status: 409 }
        );
      }
      console.error("createUser error:", createErr);
      return NextResponse.json({ error: createErr.message }, { status: 400 });
    }

    const userId = userData.user.id;

    // Insert profile (approved: false — awaits admin approval)
    const { error: profileErr } = await supabase
      .from("customer_profiles")
      .insert({
        id:        userId,
        full_name: data.fullName,
        company:   data.company,
        phone:     data.phone || null,
        approved:  false,
      });

    if (profileErr) {
      // Roll back auth user to keep DB consistent
      await supabase.auth.admin.deleteUser(userId);
      console.error("Profile insert error:", profileErr);
      return NextResponse.json(
        { error: "Profil oluşturulamadı. Lütfen tekrar deneyin." },
        { status: 500 }
      );
    }

    // Fire-and-forget emails
    Promise.all([
      sendNewRegistrationEmail({
        userId, fullName: data.fullName,
        company: data.company, phone: data.phone || "",
        email: data.email,
      }).catch(console.error),
      sendRegistrationReceivedEmail({
        fullName: data.fullName, email: data.email,
      }).catch(console.error),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || "Geçersiz form verisi." },
        { status: 400 }
      );
    }
    console.error("Register error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
