/**
 * Simple in-memory rate limiter.
 * Vercel serverless'ta instance başına çalışır — büyük trafikli siteler
 * için Redis/Upstash kullanılır, ama bu ölçekte fazlasıyla yeterli.
 */

interface Bucket {
  count: number;
  resetAt: number; // Unix ms
}

const store = new Map<string, Bucket>();

// Eski kayıtları temizle (bellek sızıntısını önler)
function purge() {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (bucket.resetAt < now) store.delete(key);
  }
}

/**
 * @param key      Genellikle "prefix:ip"
 * @param limit    İzin verilen maksimum istek sayısı
 * @param windowMs Zaman penceresi (ms)
 * @returns { allowed, remaining, retryAfterMs }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  // Her 1000 çağrıda bir temizlik yap
  if (Math.random() < 0.001) purge();

  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: bucket.resetAt - now,
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfterMs: 0 };
}

/** IP'yi request header'larından güvenli şekilde al */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
