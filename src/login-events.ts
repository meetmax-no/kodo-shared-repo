/**
 * Delt login-trace (portet fra bankboks lib/platform/org-admin-login-events.ts).
 * Logger hver VELLYKKEDE innlogging i et Upstash sorted-set per bruker for en
 * sikkerhets-oversikt (Sikkerhet-fanen). 90-dagers historikk, maks 50 events.
 *
 * Datastruktur: sorted-set keyed by userId, score = timestamp, member = JSON.
 * Krypteres ikke — kun IP (synlig i nettverkslaget), user-agent (offentlig) og
 * timestamp; ingen sensitive felt.
 *
 * SHARED-agnostisk: tar imot en `KodoRedis` (dependency injection). Best-effort
 * — login skal aldri blokkeres av audit-svikt. Node runtime.
 */
import type { KodoRedis } from "./rate-limit";

const KEY_PREFIX = "kodo:login-events:";
const MAX_EVENTS = 50;

export interface LoginEvent {
  /** Unix-ms — også score i sorted-set. */
  ts: number;
  /** Klient-IP (fra x-forwarded-for), eller "unknown". */
  ip: string;
  /** User-agent (kortet til ~200 tegn). */
  ua: string;
  /** Host brukeren logget inn på. */
  host: string;
}

const key = (userId: string) => `${KEY_PREFIX}${userId}`;

/** Logg en vellykket innlogging. Best-effort — feiler stille. */
export async function recordLoginEvent(
  redis: KodoRedis,
  userId: string,
  event: LoginEvent,
): Promise<void> {
  try {
    await redis.zadd(key(userId), { score: event.ts, member: JSON.stringify(event) });
    // Behold kun de siste MAX_EVENTS (fjern alt utenom de nyeste).
    await redis.zremrangebyrank(key(userId), 0, -(MAX_EVENTS + 1));
  } catch (err) {
    console.warn("[recordLoginEvent] failed (best-effort):", err instanceof Error ? err.message : String(err));
  }
}

/** Login-historikk, nyest først. Default 90 dager, maks MAX_EVENTS. */
export async function listLoginEvents(
  redis: KodoRedis,
  userId: string,
  days = 90,
): Promise<LoginEvent[]> {
  try {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const members = await redis.zrange(key(userId), cutoff, "+inf", { byScore: true });
    const events: LoginEvent[] = [];
    for (const raw of members) {
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (parsed && typeof parsed === "object" && typeof (parsed as LoginEvent).ts === "number") {
          events.push(parsed as LoginEvent);
        }
      } catch {
        /* ignorer korrupt/gammelt format */
      }
    }
    events.sort((a, b) => b.ts - a.ts); // nyest først
    return events;
  } catch (err) {
    console.warn("[listLoginEvents] failed:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/** Slett all login-historikk for en bruker (GDPR-purge ved konto-sletting). */
export async function deleteLoginEvents(redis: KodoRedis, userId: string): Promise<void> {
  try {
    await redis.del(key(userId));
  } catch (err) {
    console.warn("[deleteLoginEvents] failed:", err instanceof Error ? err.message : String(err));
  }
}
