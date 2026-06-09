/**
 * Cloudflare Turnstile sunucu tarafı doğrulaması.
 * TURNSTILE_SECRET_KEY tanımlı değilse doğrulama atlanır (graceful) —
 * böylece anahtarlar eklenmeden önce girişler bozulmaz.
 */
export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // yapılandırılmamış → doğrulamayı atla
  if (!token) return false;

  try {
    const form = new URLSearchParams();
    form.append("secret", secret);
    form.append("response", token);
    if (ip) form.append("remoteip", ip);

    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const d = await r.json();
    return !!d.success;
  } catch {
    return false;
  }
}
