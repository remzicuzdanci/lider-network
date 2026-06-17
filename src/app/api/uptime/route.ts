import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 25;

const SERVICES = [
  { id: "web",       name: "Lider Network Web",     url: "https://www.lidernetwork.com.tr",         category: "Web" },
  { id: "destek",    name: "Destek Portalı",         url: "https://destek.lidernetwork.com.tr",      category: "Portal" },
  { id: "threat",    name: "Tehdit Feed Servisi",    url: "https://threat.lidernetwork.com.tr",      category: "Güvenlik" },
  { id: "blacklist", name: "Kara Liste Sorgu",       url: "https://blacklist.lidernetwork.com.tr",   category: "Güvenlik" },
  { id: "ip",        name: "IP Analiz",              url: "https://ip.lidernetwork.com.tr",          category: "Araçlar" },
  { id: "dns",       name: "DNS Checker",            url: "https://dns.lidernetwork.com.tr",         category: "Araçlar" },
  { id: "password",  name: "Şifre Oluşturucu",       url: "https://password.lidernetwork.com.tr",    category: "Araçlar" },
];

async function checkService(url: string): Promise<{ status: "up" | "down" | "degraded"; ms: number }> {
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, { method: "HEAD", signal: ctrl.signal, redirect: "follow" });
    clearTimeout(t);
    const ms = Date.now() - start;
    if (r.status >= 200 && r.status < 400) {
      return { status: ms > 3000 ? "degraded" : "up", ms };
    }
    return { status: "down", ms };
  } catch {
    return { status: "down", ms: Date.now() - start };
  }
}

export async function GET() {
  const results = await Promise.all(
    SERVICES.map(async (svc) => {
      const check = await checkService(svc.url);
      return { ...svc, ...check, checkedAt: new Date().toISOString() };
    })
  );

  const up       = results.filter(r => r.status === "up").length;
  const degraded = results.filter(r => r.status === "degraded").length;
  const down     = results.filter(r => r.status === "down").length;

  const overall =
    down > 0 ? "major_outage" :
    degraded > 0 ? "partial_outage" :
    "operational";

  return NextResponse.json({ overall, up, degraded, down, total: results.length, services: results }, {
    headers: { "Cache-Control": "no-store" },
  });
}
