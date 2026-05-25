import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import {
  sendTicketCreatedEmail,
  sendNewTicketAdminEmail,
} from "@/lib/ticket-mail";
import { getAdminSession } from "@/lib/admin-auth";

const createSchema = z.object({
  subject: z.string().min(5, "Konu en az 5 karakter olmalıdır").max(200),
  description: z
    .string()
    .min(20, "Açıklama en az 20 karakter olmalıdır")
    .max(5000),
  customer_name: z.string().min(2).max(100),
  customer_email: z.string().email("Geçerli bir e-posta girin"),
  company: z.string().max(100).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  category: z
    .enum(["technical", "billing", "general", "feature_request"])
    .default("technical"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

// POST — create new ticket (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        ...data,
        company: data.company || null,
        phone: data.phone || null,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Veritabanı hatası" },
        { status: 500 }
      );
    }

    // Fire-and-forget emails
    Promise.all([
      sendTicketCreatedEmail(ticket).catch(console.error),
      sendNewTicketAdminEmail(ticket).catch(console.error),
    ]);

    return NextResponse.json(
      { success: true, ticket_id: ticket.id, ticket_number: ticket.ticket_number },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Doğrulama hatası", details: err.errors },
        { status: 400 }
      );
    }
    console.error("Create ticket error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// GET — list tickets (admin only)
export async function GET(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin)
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const search = searchParams.get("q");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "25"));

  let query = supabase
    .from("tickets")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status && status !== "all") query = query.eq("status", status);
  if (priority && priority !== "all") query = query.eq("priority", priority);
  if (search) {
    query = query.or(
      `subject.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,company.ilike.%${search}%`
    );
  }

  const { data: tickets, error, count } = await query;
  if (error) return NextResponse.json({ error: "Veritabanı hatası" }, { status: 500 });

  return NextResponse.json({ tickets, total: count, page, limit });
}
