import crypto from "crypto";
import { cookies } from "next/headers";

export const COOKIE_NAME = "ln_admin_session";
const SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_PASSWORD ||
  "please-set-ADMIN_SESSION_SECRET-in-env";

function dayToken(dayOffset = 0): string {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) + dayOffset;
  return crypto
    .createHmac("sha256", SECRET)
    .update(String(day))
    .digest("hex");
}

/** Generate today's session token */
export function generateSessionToken(): string {
  return dayToken(0);
}

/** Accept tokens from today OR yesterday → 24-48h sessions without a DB */
export function validateSessionToken(token: string): boolean {
  return token === dayToken(0) || token === dayToken(-1);
}

/** Server-component helper — reads the cookie and validates it */
export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return validateSessionToken(token);
}
