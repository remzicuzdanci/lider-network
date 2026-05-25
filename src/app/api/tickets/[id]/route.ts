import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin-auth";

const updateSchema = z.object({
  status: z
    .enum(["open", "in_progress", "resolved", "closed"])
    .optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigned_to: z.string().max(100).nullable().optional(),
});

// GET — ticket detail + messages (admin sees all, customer sees non-internal)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isAdmin = await getAdminSession();

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !ticket)
    return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });

  let msgQuery = supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  if (!isAdmin) msgQuery = msgQuery.eq("is_internal_note", false);

  const { data: messages } = await msgQuery;

  return NextResponse.json({ ticket, messages: messages || [] });
}

// PATCH — update status / priority / assigned_to (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await getAdminSession();
  if (!isAdmin)
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const updates = updateSchema.parse(body);

    const updateData: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    if (updates.status === "resolved")
      updateData.resolved_at = new Date().toISOString();
    if (updates.status && updates.status !== "resolved")
      updateData.resolved_at = null;

    const { data: ticket, error } = await supabase
      .from("tickets")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Güncelleme hatası" }, { status: 500 });
    return NextResponse.json({ ticket });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: "Doğrulama hatası" }, { status: 400 });
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
