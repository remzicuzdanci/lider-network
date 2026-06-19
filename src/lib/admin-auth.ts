import crypto from "crypto";
import { cookies } from "next/headers";
import { supabase } from "./supabase";

export const COOKIE_NAME = "ln_admin_session";

const SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_PASSWORD ||
  "please-set-ADMIN_SESSION_SECRET-in-env";

// ── Password utils ─────────────────────────────────────────────────────────────
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const computed = crypto.scryptSync(password, salt, 32);
    return crypto.timingSafeEqual(computed, Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

// ── Named session (email-based) ────────────────────────────────────────────────
export interface SessionUser {
  email: string;
  role: "super_admin" | "staff";
  name: string;
}

export function generateNamedToken(email: string, role: string, name: string): string {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const payload = `${email}|${role}|${encodeURIComponent(name)}|${day}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64url") + "." + sig;
}

export function validateNamedToken(token: string): SessionUser | null {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return null;
    const payload = Buffer.from(payloadB64, "base64url").toString();
    const parts = payload.split("|");
    if (parts.length < 4) return null;
    const [email, role, nameEncoded, dayStr] = parts;
    const day = Number(dayStr);
    const curDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    if (curDay - day > 2) return null; // expired after 2 days
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    if (sig !== expected) return null;
    return { email, role: role as SessionUser["role"], name: decodeURIComponent(nameEncoded) };
  } catch {
    return null;
  }
}

// ── Legacy single-password token (backward compat) ─────────────────────────────
function dayToken(dayOffset = 0): string {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) + dayOffset;
  return crypto.createHmac("sha256", SECRET).update(String(day)).digest("hex");
}
export function generateSessionToken(): string { return dayToken(0); }
export function validateSessionToken(token: string): boolean {
  return token === dayToken(0) || token === dayToken(-1);
}

// ── Server helpers ─────────────────────────────────────────────────────────────

/** Returns true if ANY valid session (named or legacy) */
export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  if (validateSessionToken(token)) return true;
  return validateNamedToken(token) !== null;
}

/** Returns the full session user, or null */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  // Named token first
  const named = validateNamedToken(token);
  if (named) return named;
  // Legacy single-password fallback → super_admin
  if (validateSessionToken(token)) {
    return { email: "remzi.cuzdanci@lidernetwork.com.tr", role: "super_admin", name: "Admin" };
  }
  return null;
}

// ── OTP (SMS doğrulama) ────────────────────────────────────────────────────────
// Stateless: OTP, HMAC ile imzalanmış bir challenge token'a bağlı.
// DB değişikliği gerektirmez; 5 dakikalık zaman penceresiyle geçerli.

function otpBucket(offsetBuckets = 0): number {
  return Math.floor(Date.now() / (5 * 60 * 1000)) + offsetBuckets;
}

export function generateOtp(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 1_000_000).padStart(6, "0");
}

export function signOtpChallenge(email: string, otp: string): string {
  const bucket = otpBucket();
  return crypto.createHmac("sha256", SECRET).update(`${email}:${otp}:${bucket}`).digest("hex");
}

export function verifyOtpChallenge(email: string, otp: string, challenge: string): boolean {
  if (!otp || !challenge || challenge.length !== 64) return false;
  try {
    for (const offset of [0, -1]) {
      const bucket = otpBucket(offset);
      const expected = crypto.createHmac("sha256", SECRET).update(`${email}:${otp}:${bucket}`).digest("hex");
      if (crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(challenge, "hex"))) return true;
    }
  } catch { return false; }
  return false;
}

// ── Staff user DB lookup ───────────────────────────────────────────────────────
export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "staff";
  active: boolean;
  password_hash: string;
  phone?: string | null;
}

export async function findStaffByEmail(email: string): Promise<StaffUser | null> {
  const { data } = await supabase
    .from("staff_users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .eq("active", true)
    .single();
  return data as StaffUser | null;
}

export async function listStaff(): Promise<StaffUser[]> {
  const { data } = await supabase
    .from("staff_users")
    .select("id, email, name, role, active, created_at")
    .order("created_at");
  return (data || []) as unknown as StaffUser[];
}
