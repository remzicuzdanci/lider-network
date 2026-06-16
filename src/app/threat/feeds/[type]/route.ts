import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const BASE_TYPES = new Set(["domain", "ipv4", "ipv6", "url"]);
const LITE_WINDOWS = new Set(["90d", "180d", "365d"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type: raw } = await params;
  const slug = raw.replace(/\.txt$/i, "").toLowerCase();

  // "domain-90d" → base="domain", window="90d"
  const dashIdx = slug.lastIndexOf("-");
  const maybeSuffix = dashIdx >= 0 ? slug.slice(dashIdx + 1) : "";
  const isLite = LITE_WINDOWS.has(maybeSuffix);
  const base = isLite ? slug.slice(0, dashIdx) : slug;

  if (!BASE_TYPES.has(base)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // DB'deki feed_type: tam → "domain", lite → "domain_90d"
  const feedType = isLite ? `${base}_${maybeSuffix}` : base;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await sb
    .from("threat_feeds")
    .select("content, updated_at, record_count")
    .eq("feed_type", feedType)
    .single();

  if (error || !data?.content) {
    // Lite feed henüz yazılmamışsa tam feed'i dön
    if (isLite) {
      const { data: full } = await sb
        .from("threat_feeds")
        .select("content, updated_at")
        .eq("feed_type", base)
        .single();
      if (full?.content) {
        return txtResponse(full.content, base, full.updated_at, maybeSuffix);
      }
    }
    return new NextResponse(`# ${feedType} feed henüz oluşturulmadı\n`, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    });
  }

  return txtResponse(data.content, feedType, data.updated_at, isLite ? maybeSuffix : undefined);
}

function txtResponse(content: string, feedType: string, updatedAt: string | null, window?: string) {
  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type":  "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Last-Modified": updatedAt ? new Date(updatedAt).toUTCString() : new Date().toUTCString(),
      "X-Feed-Type":   feedType,
      ...(window ? { "X-Feed-Window": window } : {}),
    },
  });
}
