import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

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

  const feedType = isLite ? `${base}_${maybeSuffix}` : base;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await sb
    .from("threat_feeds")
    .select("content, updated_at, record_count")
    .eq("feed_type", feedType)
    .single();

  if (error || !data?.content) {
    // Lite feed yoksa tam feed'e dön
    if (isLite) {
      const { data: full } = await sb
        .from("threat_feeds")
        .select("content, updated_at")
        .eq("feed_type", base)
        .single();
      if (full?.content) {
        return resolveAndServe(full.content, base, full.updated_at, maybeSuffix, sb);
      }
    }
    return new NextResponse(`# ${feedType} feed henüz oluşturulmadı\n`, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    });
  }

  return resolveAndServe(data.content, base, data.updated_at, isLite ? maybeSuffix : undefined, sb);
}

async function resolveAndServe(
  raw: string,
  base: string,
  updatedAt: string | null,
  window: string | undefined,
  sb: SupabaseClient
): Promise<NextResponse> {
  const feedType = window ? `${base}_${window}` : base;
  let content = raw;

  // Chunk'lara bölünmüş büyük feed (domain__0, domain__1, …)
  if (raw.startsWith("chunked:")) {
    const N = parseInt(raw.slice("chunked:".length), 10);
    if (!isNaN(N) && N > 0) {
      const keys = Array.from({ length: N }, (_, i) => `${base}__${i}`);
      const { data: rows } = await sb
        .from("threat_feeds")
        .select("feed_type, content")
        .in("feed_type", keys);

      if (rows && rows.length > 0) {
        rows.sort((a, b) => {
          const ai = parseInt(a.feed_type.split("__")[1] ?? "0", 10);
          const bi = parseInt(b.feed_type.split("__")[1] ?? "0", 10);
          return ai - bi;
        });
        content = rows.map(r => r.content ?? "").join("\n");
      } else {
        return new NextResponse("# Feed yükleniyor, lütfen bekleyin\n", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "60" },
        });
      }
    }
  }

  return txtResponse(content, feedType, updatedAt, window);
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
