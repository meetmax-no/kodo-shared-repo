// Generisk HMAC-signert session-cookie (port av bankboks admin-auth.ts, gjort
// app-agnostisk: ingen fast cookie-navn/host — TTL er parameter, appen eier
// resten). Web Crypto → fungerer i BÅDE Edge runtime (middleware) og Node.
//
// Cookie-format: `payload.signature`
//   payload   = base64url(JSON({ iat, exp }))
//   signature = base64url(HMAC-SHA256(secret, payload))

function base64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const normalised = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(normalised);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Constant-time compare — unngår timing-orakel ved signatur-sjekk.
function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return base64urlEncode(new Uint8Array(sig));
}

export interface SessionPayload {
  iat: number; // issued-at (unix sec)
  exp: number; // expiry (unix sec)
}

/** Lag en signert session-cookie-verdi. `ttlSeconds` styrer levetid. */
export async function signSession(
  secret: string,
  ttlSeconds: number,
): Promise<string> {
  if (!secret) throw new Error("Session-secret mangler.");
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { iat: now, exp: now + ttlSeconds };
  const payloadB64 = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const signature = await hmacSign(secret, payloadB64);
  return `${payloadB64}.${signature}`;
}

/** Verifiser en session-cookie-verdi. Payload hvis gyldig, ellers null.
 *  Edge-trygg (kun Web Crypto). */
export async function verifySession(
  cookieValue: string | undefined | null,
  secret: string,
): Promise<SessionPayload | null> {
  if (!cookieValue || !secret) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;

  let expectedSig: string;
  try {
    expectedSig = await hmacSign(secret, payloadB64);
  } catch {
    return null;
  }
  if (!timingSafeEqualString(signature, expectedSig)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(
      new TextDecoder().decode(base64urlDecode(payloadB64)),
    ) as SessionPayload;
  } catch {
    return null;
  }
  if (typeof payload.iat !== "number" || typeof payload.exp !== "number") {
    return null;
  }
  if (Math.floor(Date.now() / 1000) >= payload.exp) return null;
  return payload;
}
