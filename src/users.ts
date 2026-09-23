/**
 * Delt brukerlagring (fler-bruker) — løftet fra kodo-rapport lib/users.ts.
 * Navngitte brukere med scrypt-hashet passord i Redis. «admin» er RESERVERT:
 * admin logger inn med et passord fra ENV (`checkAdminPassword`), ikke herfra.
 *
 * Format er byte-kompatibelt med Rapport: salt = 16 tilfeldige bytes som hex,
 * hash = scrypt(passord, salt-hex-strengen, 64) som hex. Nøkler:
 *   `${prefix}:user:${brukernavn}`  (JSON StoredUser)
 *   `${prefix}:users`               (set med alle brukernavn)
 * Rapport = prefix "rapport", Food = prefix "food".
 *
 * DI som resten av security: tar imot en Redis-klient (Upstash oppfyller
 * `KodoUserRedis` strukturelt; cast ved behov). Node runtime (node:crypto).
 * Brukernavn er case-INsensitivt (trim + lowercase); passord case-sensitivt.
 */
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/** Minimums-grensesnittet brukerlagringen trenger fra Redis. */
export interface KodoUserRedis {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<unknown>;
  del(key: string): Promise<number>;
  sadd(key: string, member: string): Promise<number>;
  srem(key: string, member: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
}

export interface StoredUser {
  username: string;
  /** hex */
  salt: string;
  /** hex (scrypt, 64 bytes) */
  hash: string;
  createdAt: string;
}

export const RESERVED_USERNAMES: readonly string[] = ["admin"];

/** Case-insensitivt, uten omkringliggende mellomrom. */
export function normalizeUsername(u: string): string {
  return u.trim().toLowerCase();
}

/** 3–32 tegn: små bokstaver, tall, punktum, understrek, bindestrek. */
export function isValidUsername(u: string): boolean {
  return /^[a-z0-9._-]{3,32}$/.test(u);
}

function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key.toString("hex"))));
  });
}

function equalHex(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

/** Constant-time sjekk av admin-passordet mot ENV-verdien. Tom ENV → false.
 *  Sammenligner SHA-256-digester, så lengden på passordet ikke lekker. */
export function checkAdminPassword(password: string, adminPassword: string | undefined): boolean {
  if (!adminPassword || !password) return false;
  const a = createHash("sha256").update(password).digest();
  const b = createHash("sha256").update(adminPassword).digest();
  return timingSafeEqual(a, b);
}

export interface UserStore {
  list(): Promise<string[]>;
  get(username: string): Promise<StoredUser | null>;
  /** Oppretter/overskriver. Kalleren validerer format/reservert/eksisterer. */
  create(username: string, password: string): Promise<void>;
  remove(username: string): Promise<void>;
  /** Constant-time. Ukjent bruker → false. */
  verifyPassword(username: string, password: string): Promise<boolean>;
}

export function createUserStore(redis: KodoUserRedis, opts: { prefix: string }): UserStore {
  const index = `${opts.prefix}:users`;
  const userKey = (u: string) => `${opts.prefix}:user:${u}`;

  return {
    async list() {
      const ids = await redis.smembers(index);
      return [...ids].sort((a, b) => a.localeCompare(b, "nb"));
    },
    get(username) {
      return redis.get<StoredUser>(userKey(normalizeUsername(username)));
    },
    async create(username, password) {
      const u = normalizeUsername(username);
      const salt = randomBytes(16).toString("hex");
      const user: StoredUser = {
        username: u,
        salt,
        hash: await hashPassword(password, salt),
        createdAt: new Date().toISOString(),
      };
      await redis.set(userKey(u), user);
      await redis.sadd(index, u);
    },
    async remove(username) {
      const u = normalizeUsername(username);
      await redis.del(userKey(u));
      await redis.srem(index, u);
    },
    async verifyPassword(username, password) {
      const user = await redis.get<StoredUser>(userKey(normalizeUsername(username)));
      if (!user) return false;
      return equalHex(await hashPassword(password, user.salt), user.hash);
    },
  };
}
