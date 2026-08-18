/**
 * Delt rate-limiter (portet fra bankboks lib/platform/rate-limit.ts). Per-IP
 * teller i Upstash (INCR + EXPIRE NX). Bremser brute-force på f.eks. login.
 *
 * SHARED har ingen Upstash-avhengighet — funksjonen tar imot en Redis-klient
 * (dependency injection). Hver app sender sin egen `redis` (Upstash-instansen
 * fra sin lib/redis.ts tilfredsstiller `KodoRedis` strukturelt; cast ved behov).
 *
 * Fail-open ved Redis-feil: slipper heller requesten gjennom enn å DOS-e seg
 * selv. Node runtime (Redis).
 */

/** Minimums-grensesnittet mot Redis som de delte security-modulene trenger.
 *  Upstash `Redis` oppfyller dette (cast `redis as unknown as KodoRedis` på
 *  kall-siden om overloadede signaturer gir TS-friksjon). */
export interface KodoRedis {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number, opt?: "NX" | "XX" | "GT" | "LT"): Promise<number>;
  ttl(key: string): Promise<number>;
  zadd(key: string, members: { score: number; member: string }): Promise<number | null>;
  zremrangebyrank(key: string, start: number, stop: number): Promise<number>;
  zrange(
    key: string,
    min: number | string,
    max: number | string,
    opts?: { byScore?: boolean; rev?: boolean },
  ): Promise<unknown[]>;
  del(key: string): Promise<number>;
}

export interface RateLimitConfig {
  bucket: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

const KEY_PREFIX = "kodo:ratelimit:";

/**
 * Sjekk + inkrementer teller for IP+bucket. Første kall i vinduet setter key=1
 * og TTL=windowSeconds (EXPIRE NX); påfølgende bare INCR-er. TTL utløper →
 * telleren resettes automatisk.
 */
export async function checkRateLimit(
  redis: KodoRedis,
  ip: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const key = `${KEY_PREFIX}${config.bucket}:${ip}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, config.windowSeconds, "NX");
    const ttl = await redis.ttl(key);
    const resetSeconds = ttl > 0 ? ttl : config.windowSeconds;
    return {
      allowed: count <= config.limit,
      remaining: Math.max(0, config.limit - count),
      resetSeconds,
    };
  } catch (err) {
    // Fail-open — heller noen ekstra requests enn å blokkere all trafikk.
    console.error("[rate-limit] Redis error — failing open:", err);
    return { allowed: true, remaining: config.limit, resetSeconds: config.windowSeconds };
  }
}

/** Klient-IP fra `x-forwarded-for` (første ledd) → `x-real-ip` → "unknown". */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/** Login: 10 forsøk per IP per 15 min — bremser brute-force uten å plage folk
 *  som skriver feil et par ganger. Juster per app ved behov. */
export const LOGIN_RATE_LIMIT: RateLimitConfig = {
  bucket: "login",
  limit: 10,
  windowSeconds: 15 * 60,
};
