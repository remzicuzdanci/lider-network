import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import {
  sendNewRegistrationEmail,
  sendRegistrationReceivedEmail,
} from "@/lib/ticket-mail";

const schema = z.object({
  fullName:   z.string().min(2, "Yetkili adı soyadı gerekli"),
  company:    z.string().min(1, "Firma adı gerekli"),
  email:      z.string().email("Geçerli e-posta girin"),
  password:   z.string().min(8, "Şifre en az 8 karakter olmalı"),
  // optional extras
  phone:      z.string().optional(),
  phone2:     z.string().optional(),
  address:    z.string().optional(),
  city:       z.string().optional(),
  district:   z.string().optional(),
  taxNumber:  z.string().optional(),
  kvkk:       z.boolean().refine((v) => v === true, "KVKK onayı zorunludur"),
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
        email_confirm: true,
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
        id:          userId,
        full_name:   data.fullName,
        company:     data.company,
        phone:       data.phone    || null,
        phone2:      data.phone2   || null,
        address:     data.address  || null,
        city:        data.city     || null,
        district:    data.district || null,
        tax_number:  data.taxNumber || null,
        kvkk_accepted: true,
        approved:    false,
      });

    if (profileErr) {
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
