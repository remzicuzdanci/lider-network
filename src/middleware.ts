import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Skip intl handling for admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)",
  ],
};
