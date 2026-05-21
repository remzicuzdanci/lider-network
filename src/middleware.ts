import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - _next/static (Next.js static files)
  // - _next/image (Next.js image optimization)
  // - favicon.ico, manifest.json, robots.txt, sitemap.xml
  // - image files
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)",
  ],
};
