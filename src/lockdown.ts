/**
 * Delt nød-lockdown (kill-switch). Ett flagg i KV som lar en app stenge alle
 * data-utganger UMIDDELBART ved mistanke om brudd — uten redeploy. SHARED eier
 * flagget + `assertNotLockedDown`; HVER app bestemmer selv hvilke dører den
 * gater (kaller assert der klientdata forlater systemet: API-lesing, arkiv …).
 *
 * DI som resten av security: tar imot en `KodoRedis`. `scope` skiller flagg
 * (f.eks. per app/instans). Node runtime.
 *
 * Fail-OPEN ved KV-svikt (som rate-limit/login-events): en KV-hikke skal ikke
 * ta ned all datatilgang. Lockdown er en sjelden, bevisst nødtilstand; det
 * vanlige tilfellet er «ikke låst». Vil en app ha fail-CLOSED for et strengere
 * regime, kan den lese `getLockdown` direkte og velge selv.
 */
import type { KodoRedis } from "./rate-limit";

export interface LockdownState {
  locked: boolean;
  /** Unix-ms da den ble satt. */
  at: number;
  /** Hvem som satte den (brukernavn fra sesjonen). */
  by: string;
  /** Fritekst-grunn (valgfri). */
  reason?: string;
}

/** Kastes av `assertNotLockedDown` når systemet er låst. Kall-stedet mapper den
 *  til et 403-svar. */
export class LockdownError extends Error {
  constructor(message = "locked_down") {
    super(message);
    this.name = "LockdownError";
  }
}

const UNLOCKED: LockdownState = { locked: false, at: 0, by: "" };

const key = (scope: string) => `kodo:lockdown:${scope}`;

/** Les lockdown-tilstanden. Ulåst (fail-open) hvis KV svikter eller er tom. */
export async function getLockdown(redis: KodoRedis, scope: string): Promise<LockdownState> {
  try {
    const raw = await redis.get<LockdownState>(key(scope));
    if (raw && typeof raw === "object" && raw.locked === true) return raw;
  } catch (err) {
    console.warn("[getLockdown] failed (fail-open):", err instanceof Error ? err.message : String(err));
  }
  return UNLOCKED;
}

/** Slå lockdown PÅ. Returnerer den lagrede tilstanden. */
export async function setLockdown(
  redis: KodoRedis,
  scope: string,
  by: string,
  reason?: string,
): Promise<LockdownState> {
  const state: LockdownState = { locked: true, at: Date.now(), by, ...(reason ? { reason } : {}) };
  await redis.set(key(scope), state);
  return state;
}

/** Slå lockdown AV (break-glass: samme effekt som å slette KV-nøkkelen manuelt). */
export async function clearLockdown(redis: KodoRedis, scope: string): Promise<void> {
  await redis.del(key(scope));
}

/** Kaster `LockdownError` hvis låst. Kalles der klientdata forlater systemet.
 *  Fail-open: KV-svikt slipper gjennom (ikke selv-DoS). */
export async function assertNotLockedDown(redis: KodoRedis, scope: string): Promise<void> {
  const state = await getLockdown(redis, scope);
  if (state.locked) throw new LockdownError();
}
