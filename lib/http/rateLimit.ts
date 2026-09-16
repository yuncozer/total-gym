import { NextRequest, NextResponse } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10000;

export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(k);
      }
      if (buckets.size >= MAX_BUCKETS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  existing.count++;
  if (existing.count > limit) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Inténtalo más tarde." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  return null;
}
