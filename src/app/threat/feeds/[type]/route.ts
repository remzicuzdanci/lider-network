import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const VALID_TYPES = new Set(["domain", "ipv4", "ipv6", "url"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type: raw } = await params;
  // FortiGate'den domain.txt gibi uzantılı gelebilir
  const feedType = raw.replace(/\.txt$/i, "").toLowerCase();

  if (!VALID_TYPES.has(feedType)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await sb
    .from("threat_feeds")
    .select("content, updated_at")
    .eq("feed_type", feedType)
    .single();

  if (error || !data) {
    return new NextResponse("# Feed henüz oluşturulmadı\n", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return new NextResponse(data.content ?? "", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Last-Modified": data.updated_at
        ? new Date(data.updated_at).toUTCString()
        : new Date().toUTCString(),
      "X-Feed-Type": feedType,
    },
  });
}
