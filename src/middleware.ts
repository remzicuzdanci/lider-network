import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const intl = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.nextUrl.hostname || request.headers.get("host")?.split(":")[0] || "";

  // ── dns.lidernetwork.com.tr subdomain → DNS aracı ─────────────
  if (hostname.startsWith("dns.")) {
    return NextResponse.rewrite(new URL("/dns", request.url));
  }
  if (pathname === "/dns" || pathname.startsWith("/dns/")) {
    return NextResponse.next();
  }

  // ── ip.lidernetwork.com.tr subdomain → IP aracı ─────────────
  if (hostname.startsWith("ip.")) {
    return NextResponse.rewrite(new URL("/ip", request.url));
  }
  if (pathname === "/ip" || pathname.startsWith("/ip/")) {
    return NextResponse.next();
  }

  // ── blacklist.lidernetwork.com.tr subdomain → Kara liste aracı ──
  if (hostname.startsWith("blacklist.")) {
    return NextResponse.rewrite(new URL("/blacklist", request.url));
  }
  if (pathname === "/blacklist" || pathname.startsWith("/blacklist/")) {
    return NextResponse.next();
  }

  // ── password.lidernetwork.com.tr subdomain → Şifre oluşturucu ──
  if (hostname.startsWith("password.")) {
    return NextResponse.rewrite(new URL("/password", request.url));
  }
  if (pathname === "/password" || pathname.startsWith("/password/")) {
    return NextResponse.next();
  }

  // ── uptime.lidernetwork.com.tr subdomain → Uptime izleme ──
  if (hostname.startsWith("uptime.")) {
    return NextResponse.rewrite(new URL("/uptime", request.url));
  }
  if (pathname === "/uptime" || pathname.startsWith("/uptime/")) {
    return NextResponse.next();
  }

  // ── threat.lidernetwork.com.tr subdomain → Tehdit feed servisi ──
  if (hostname.startsWith("threat.")) {
    // /feeds/* yolları doğrudan /threat/feeds/* rotasına ilet (FortiGate TXT dosyaları)
    if (pathname.startsWith("/feeds/")) {
      return NextResponse.rewrite(new URL(`/threat${pathname}`, request.url));
    }
    return NextResponse.rewrite(new URL("/threat", request.url));
  }
  if (pathname === "/threat" || pathname.startsWith("/threat/")) {
    return NextResponse.next();
  }
  // Teklif onay sayfası locale'siz; intl /tr/teklif'e yönlendirip 404 yapmasın
  if (pathname === "/teklif" || pathname.startsWith("/teklif/")) {
    return NextResponse.next();
  }

  // ── destek.lidernetwork.com.tr subdomain ──────────────────────
  if (hostname.startsWith("destek.")) {
    const isPanelRoute = pathname.startsWith("/panel");
    const isAuthRoute  = pathname === "/giris" || pathname === "/kayit";

    // Auth guard for panel + auth pages on subdomain
    if (isPanelRoute || isAuthRoute) {
      const sb = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
      );
      const { data: { session } } = await sb.auth.getSession();

      if (isPanelRoute && !session)
        return NextResponse.redirect(new URL("/giris", request.url));
      if (isAuthRoute && session)
        return NextResponse.redirect(new URL("/panel", request.url));
    }

    // Rewrite short path → /tr/destek/...
    const destekPath =
      pathname === "/" ? "/tr/destek" : `/tr/destek${pathname}`;
    return NextResponse.rewrite(new URL(destekPath, request.url));
  }

  // ── Admin routes: IP kısıtlaması + gizli URL ──────────────────
  if (pathname.startsWith("/admin")) {
    // İzin verilen IP'ler — Vercel'de ALLOWED_ADMIN_IPS env değişkenine
    // virgülle ayrılmış IP listesi yaz: "1.2.3.4,5.6.7.8"
    // Boş bırakılırsa kısıtlama uygulanmaz (geliştirme ortamı için)
    const allowedIPs = process.env.ALLOWED_ADMIN_IPS;
    if (allowedIPs && allowedIPs.trim()) {
      const allowed = allowedIPs.split(",").map(ip => ip.trim()).filter(Boolean);
      const clientIP =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "";
      if (!allowed.includes(clientIP)) {
        // IP listede yok → 404 döndür (admin paneli varmış gibi görünmesin)
        return new NextResponse(null, { status: 404 });
      }
    }
    return NextResponse.next();
  }

  // ── Customer panel: auth guard (main domain) ───────────────────
  const isPanelRoute = /\/(tr|en)\/destek\/panel/.test(pathname);
  const isAuthRoute  = /\/(tr|en)\/destek\/(giris|kayit)$/.test(pathname);

  if (isPanelRoute || isAuthRoute) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    const locale = pathname.split("/")[1] || "tr";

    if (isPanelRoute && !session)
      return NextResponse.redirect(new URL(`/${locale}/destek/giris`, request.url));
    if (isAuthRoute && session)
      return NextResponse.redirect(new URL(`/${locale}/destek/panel`, request.url));
  }

  // ── Intl routing for all other routes ─────────────────────────
  return intl(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)",
  ],
};
