import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const IP_RE = /^(\d{1,3}\.){3}\d{1,3}$/;

async function checkOwnFeeds(ip: string): Promise<{ found: boolean; feeds: string[] }> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await sb
    .from("threat_feeds")
    .select("feed_type, content")
    .in("feed_type", ["ipv4"]);

  const found: string[] = [];
  for (const row of data ?? []) {
    const hay = "\n" + (row.content ?? "").toLowerCase() + "\n";
    if (hay.includes("\n" + ip.toLowerCase() + "\n")) found.push(row.feed_type);
  }
  return { found: found.length > 0, feeds: found };
}

async function checkGreyNoise(ip: string): Promise<{ available: boolean; noise?: boolean; riot?: boolean; classification?: string; name?: string; message?: string } | null> {
  const key = process.env.GREYNOISE_API_KEY;
  if (!key) return null;

  try {
    const r = await fetch(`https://api.greynoise.io/v3/community/${ip}`, {
      headers: { key, "Accept": "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (r.status === 404) return { available: true, noise: false, riot: false, message: "Listede yok" };
    if (!r.ok) return null;
    const d = await r.json();
    return {
      available: true,
      noise:          d.noise ?? false,
      riot:           d.riot ?? false,
      classification: d.classification ?? null,
      name:           d.name ?? null,
      message:        d.message ?? null,
    };
  } catch { return null; }
}

async function checkAbuseIPDB(ip: string): Promise<{ available: boolean; score?: number; totalReports?: number; lastReported?: string } | null> {
  const key = process.env.ABUSEIPDB_API_KEY;
  if (!key) return null;

  try {
    const url = `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`;
    const r = await fetch(url, {
      headers: { Key: key, Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return {
      available: true,
      score:        d.data?.abuseConfidenceScore ?? 0,
      totalReports: d.data?.totalReports ?? 0,
      lastReported: d.data?.lastReportedAt ?? null,
    };
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ip: string = (body.ip ?? "").trim();

  if (!IP_RE.test(ip)) {
    return NextResponse.json({ error: "Geçerli bir IPv4 adresi girin" }, { status: 400 });
  }

  const [ownFeeds, greyNoise, abuseIPDB] = await Promise.all([
    checkOwnFeeds(ip),
    checkGreyNoise(ip),
    checkAbuseIPDB(ip),
  ]);

  const risk =
    ownFeeds.found ? "high" :
    (greyNoise?.noise && greyNoise.classification === "malicious") ? "high" :
    (abuseIPDB && (abuseIPDB.score ?? 0) >= 50) ? "high" :
    (greyNoise?.noise) ? "medium" :
    (abuseIPDB && (abuseIPDB.score ?? 0) > 0) ? "medium" :
    "low";

  return NextResponse.json({ ip, risk, ownFeeds, greyNoise, abuseIPDB });
}
