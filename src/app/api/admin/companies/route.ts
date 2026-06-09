import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin-auth";

const schema = z.object({
  name:          z.string().min(2).max(120),
  contact_name:  z.string().min(2).max(100),
  contact_email: z.string().email(),
  phone:         z.string().max(30).optional().nullable(),
  sector:        z.string().max(80).optional().nullable(),
  notes:         z.string().max(500).optional().nullable(),
  address:       z.string().max(300).optional().nullable(),
  tax_office:    z.string().max(120).optional().nullable(),
  tax_no:        z.string().max(40).optional().nullable(),
  customer_type: z.string().max(20).optional().nullable(),
});

// GET — list all companies
export async function GET() {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("name");

  if (error) return NextResponse.json({ error: "DB hatası" }, { status: 500 });
  return NextResponse.json({ companies: data });
}

// POST — create company
export async function POST(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());
    const { data, error } = await supabase.from("companies").insert(body).select().single();
    if (error) return NextResponse.json({ error: "DB hatası" }, { status: 500 });
    return NextResponse.json({ company: data }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Doğrulama hatası", details: err.errors }, { status: 400 });
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PATCH — update company
export async function PATCH(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    const parsed = schema.partial().parse(updates);
    const { data, error } = await supabase.from("companies").update(parsed).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: "DB hatası" }, { status: 500 });
    return NextResponse.json({ company: data });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Doğrulama hatası" }, { status: 400 });
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE — deactivate company (soft delete)
export async function DELETE(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const { error } = await supabase.from("companies").update({ active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: "DB hatası" }, { status: 500 });
  return NextResponse.json({ success: true });
}
