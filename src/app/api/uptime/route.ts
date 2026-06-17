import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 20;

const CORS = { "Access-Control-Allow-Origin": "*" };

function normalizeUrl(raw: string): string {
  raw = raw.trim();
  if (!raw) return "";
  if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
  try { new URL(raw); return raw; } catch { return ""; }
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url") || "";
  const url = normalizeUrl(raw);

  if (!url) {
    return NextResponse.json({ error: "Geçersiz URL" }, { status: 400, headers: CORS });
  }

  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch(url, {
      method: "HEAD",
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LiderNetwork-UptimeChecker/1.0)" },
    });
    clearTimeout(t);
    const ms = Date.now() - start;
    const status = r.status;
    const up = status >= 200 && status < 400;
    return NextResponse.json({
      url, status, ms,
      up,
      label: up ? (ms > 2000 ? "Yavaş" : "Çalışıyor") : "Erişilemiyor",
    }, { headers: { ...CORS, "Cache-Control": "no-store" } });
  } catch (e: unknown) {
    const ms = Date.now() - start;
    const msg = e instanceof Error ? e.message : "";
    const timedOut = msg.includes("abort") || msg.includes("timeout") || ms >= 9000;
    return NextResponse.json({
      url, status: null, ms,
      up: false,
      label: timedOut ? "Zaman Aşımı" : "Erişilemiyor",
    }, { headers: { ...CORS, "Cache-Control": "no-store" } });
  }
}
