// WebAuthn-helpers for Touch ID / Face ID / Windows Hello (port av bankboks).
// Bruker PRF-utvidelsen → deterministisk 32-byte hemmelighet bundet til
// credentialet, brukt som AES-GCM-nøkkel til å wrappe et passord lokalt.
// Server ser ingenting. Klient-side (window/navigator) — IKKE for Edge/Node-kall.
//
// Dekoblet fra bankboks-i18n: kaster WebAuthnError med en stabil `code` —
// konsumenten (appen) mapper koden til sin egen t(). Shared forblir i18n-fri.

/** Feil med stabil kode som appen kan oversette (f.eks. via t(err.code)). */
export class WebAuthnError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.name = "WebAuthnError";
    this.code = code;
  }
}

function randomBytes(n: number): Uint8Array {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

export function isWebAuthnSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    window.PublicKeyCredential &&
    navigator.credentials &&
    typeof navigator.credentials.create === "function"
  );
}

/**
 * Sjekk om nettleseren trolig støtter PRF-extension (kreves for biometric-wrap).
 * Safari 18+ / Chrome-Edge 132+ = ja; Firefox = nei. UA-sniff er bevisst her —
 * eneste pålitelige måte å unngå orphan-passkeys på enheter der PRF vil feile.
 */
export function isPrfLikelySupported(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;

  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  const isChromium = !!chromeMatch && !/OPR|Opera/.test(ua);
  if (isChromium) return parseInt(chromeMatch[1], 10) >= 132;

  const isWebKitSafari =
    /^((?!chrome|android|crios|fxios|edg|opr|opera).)*safari/i.test(ua) ||
    /CriOS|FxiOS/i.test(ua);
  if (isWebKitSafari) {
    const versionMatch = ua.match(/Version\/(\d+)/);
    if (!versionMatch) return false;
    return parseInt(versionMatch[1], 10) >= 18;
  }
  return false;
}

/** Har plattformen en innebygd authenticator (Touch/Face ID, Windows Hello)? */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// ---------- Base64URL (WebAuthn-formatert) ----------

export function bufferToBase64Url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlToBuffer(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? 0 : 4 - (b64.length % 4);
  const bin = atob(b64 + "=".repeat(pad));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export interface RegisteredCredential {
  credentialId: Uint8Array;
  prfSalt: Uint8Array;
  prfSecret: Uint8Array;
}

export interface RegisterOptions {
  rpName: string;
  userName: string;
  userDisplayName: string;
}

/** Registrer en platform-authenticator + evaluer PRF → 32-byte hemmelighet. */
export async function registerBiometricCredential(
  opts: RegisterOptions,
): Promise<RegisteredCredential> {
  if (!isWebAuthnSupported()) {
    throw new WebAuthnError("webauthn.error_not_supported");
  }
  const userId = randomBytes(16);
  const createChallenge = randomBytes(32);
  const prfSalt = randomBytes(32);

  try {
    window.focus();
  } catch {
    /* best effort — Safari-fokus-defensiv */
  }

  let cred: PublicKeyCredential | null;
  try {
    cred = (await navigator.credentials.create({
      publicKey: {
        challenge: createChallenge as BufferSource,
        rp: { id: window.location.hostname, name: opts.rpName },
        user: {
          id: userId as BufferSource,
          name: opts.userName,
          displayName: opts.userDisplayName,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" },
        ],
        authenticatorSelection: {
          userVerification: "required",
          authenticatorAttachment: "platform",
          residentKey: "preferred",
          requireResidentKey: false,
        },
        timeout: 60_000,
        extensions: {
          prf: { eval: { first: prfSalt as BufferSource } },
        } as AuthenticationExtensionsClientInputs,
      },
    })) as PublicKeyCredential | null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/document is not focused/i.test(msg)) {
      throw new WebAuthnError("webauthn.error_safari_focus_register");
    }
    throw err;
  }

  if (!cred) throw new WebAuthnError("webauthn.error_register_aborted");

  const ext = cred.getClientExtensionResults() as AuthenticationExtensionsClientOutputs & {
    prf?: { enabled?: boolean; results?: { first?: ArrayBuffer } };
  };
  if (ext.prf?.enabled === false) {
    throw new WebAuthnError("webauthn.error_prf_unsupported");
  }

  const credentialId = new Uint8Array(cred.rawId);
  let prfSecret: Uint8Array;
  const firstFromCreate = ext.prf?.results?.first;
  if (firstFromCreate) {
    prfSecret = new Uint8Array(firstFromCreate);
  } else {
    prfSecret = await evaluatePrf(credentialId, prfSalt);
  }
  return { credentialId, prfSalt, prfSecret };
}

/** Trigger biometrisk verifisering + evaluer PRF → samme 32-byte hemmelighet. */
export async function evaluatePrf(
  credentialId: Uint8Array,
  prfSalt: Uint8Array,
): Promise<Uint8Array> {
  if (!isWebAuthnSupported()) {
    throw new WebAuthnError("webauthn.error_not_supported");
  }
  const challenge = randomBytes(32);

  try {
    window.focus();
  } catch {
    /* best effort */
  }

  let auth: PublicKeyCredential | null;
  try {
    auth = (await navigator.credentials.get({
      publicKey: {
        challenge: challenge as BufferSource,
        allowCredentials: [
          { id: credentialId as BufferSource, type: "public-key" },
        ],
        userVerification: "required",
        timeout: 60_000,
        extensions: {
          prf: { eval: { first: prfSalt as BufferSource } },
        } as AuthenticationExtensionsClientInputs,
      },
    })) as PublicKeyCredential | null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/document is not focused/i.test(msg)) {
      throw new WebAuthnError("webauthn.error_safari_focus_eval");
    }
    throw err;
  }

  if (!auth) throw new WebAuthnError("webauthn.error_verify_aborted");

  const ext = auth.getClientExtensionResults() as AuthenticationExtensionsClientOutputs & {
    prf?: { results?: { first?: ArrayBuffer } };
  };
  const first = ext.prf?.results?.first;
  if (!first) throw new WebAuthnError("webauthn.error_prf_eval_failed");
  return new Uint8Array(first);
}

// ---------- AES-GCM-wrap av et passord med PRF-secret ----------

const enc = new TextEncoder();
const dec = new TextDecoder();

export async function wrapPassword(
  password: string,
  prfSecret: Uint8Array,
): Promise<{ iv: Uint8Array; cipher: Uint8Array }> {
  const key = await crypto.subtle.importKey(
    "raw",
    prfSecret as BufferSource,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const iv = randomBytes(12);
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    enc.encode(password),
  );
  return { iv, cipher: new Uint8Array(cipherBuf) };
}

export async function unwrapPassword(
  iv: Uint8Array,
  cipher: Uint8Array,
  prfSecret: Uint8Array,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    prfSecret as BufferSource,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      cipher as BufferSource,
    );
  } catch {
    throw new WebAuthnError("webauthn.error_decrypt_failed");
  }
  return dec.decode(plain);
}
