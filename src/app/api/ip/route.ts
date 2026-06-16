import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";

export const runtime = "nodejs";
export const maxDuration = 15;

const CORS = { "Access-Control-Allow-Origin": "*" };

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    ""
  );
}

function isPrivate(ip: string): boolean {
  return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|::1$|fc|fd)/.test(ip);
}

function isIpv4(ip: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
}
function isIpv6(ip: string): boolean {
  return /^[0-9a-f:]+$/i.test(ip) && ip.includes(":");
}
function isValidIp(ip: string): boolean {
  return isIpv4(ip) || isIpv6(ip);
}
function isDomain(s: string): boolean {
  return /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(s);
}

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("ip") || "").trim();

  let ip = raw || clientIp(req) || "8.8.8.8";
  const isSelf = !raw;

  // Domain → IP çözümle
  if (raw && !isValidIp(raw) && isDomain(raw)) {
    try {
      const addrs = await dns.resolve4(raw);
      if (addrs[0]) ip = addrs[0];
    } catch {
      return NextResponse.json({ error: `"${raw}" için A kaydı bulunamadı` }, { status: 404, headers: CORS });
    }
  } else if (raw && !isValidIp(raw)) {
    return NextResponse.json({ error: "Geçersiz IP adresi veya domain" }, { status: 400, headers: CORS });
  }

  const version = isIpv6(ip) ? "IPv6" : "IPv4";
  const _private = isPrivate(ip);

  // PTR kaydı
  let ptr: string | null = null;
  try {
    const ptrs = await dns.reverse(ip);
    ptr = ptrs[0] || null;
  } catch { /* opsiyonel */ }

  // Geo + ISP + güvenlik — ip-api.com (server-side HTTP tamam)
  const fields = [
    "status", "message", "country", "countryCode",
    "regionName", "city", "zip", "lat", "lon",
    "timezone", "offset", "isp", "org", "as", "asname",
    "mobile", "proxy", "hosting", "query",
  ].join(",");

  let geo: Record<string, unknown> = {};
  if (!_private) {
    try {
      const r = await fetch(
        `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=${fields}&lang=tr`,
        { cache: "no-store", headers: { "User-Agent": "LiderNetwork-IpTool/1.0" } }
      );
      if (r.ok) {
        const d = await r.json();
        if (d.status === "success") geo = d;
      }
    } catch { /* geo opsiyonel */ }
  }

  const normalizedIp = (geo.query as string) || ip;

  return NextResponse.json({
    ip: normalizedIp,
    original_query: raw || null,
    is_self: isSelf,
    version,
    is_private: _private,
    ptr: ptr || (geo.hostname as string) || null,
    country: geo.country || null,
    country_code: ((geo.countryCode as string) || "").toLowerCase() || null,
    region: geo.regionName || null,
    city: geo.city || null,
    zip: geo.zip || null,
    lat: typeof geo.lat === "number" ? geo.lat : null,
    lon: typeof geo.lon === "number" ? geo.lon : null,
    timezone: geo.timezone || null,
    timezone_offset: typeof geo.offset === "number" ? geo.offset : null,
    isp: geo.isp || null,
    org: geo.org || null,
    asn: geo.as || null,
    as_name: geo.asname || null,
    is_mobile: geo.mobile === true,
    is_proxy: geo.proxy === true,
    is_hosting: geo.hosting === true,
  }, { headers: CORS });
}
