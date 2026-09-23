# @kodo/shared

Delt kode for Ko|Do-apper (Flow først, bankboks på sikt).

Rå TypeScript – konsumeres via Next.js `transpilePackages`, så ingen byggesteg
her. Legg gjenbrukbar **logikk** her (formatterere, auth, webauthn, backup);
UI-komponenter kommer etter Tailwind-adopsjon i konsumentene.

## Bruk (konsument)
```jsonc
// package.json
"@kodo/shared": "github:meetmax-no/kodo-shared-repo#main"
```
```js
// next.config.mjs
transpilePackages: ["@kodo/shared"]
```
```ts
import { cn, parseAmount, formatKr } from "@kodo/shared";
```

## Auth: sesjon med identitet (`@kodo/shared/auth`)
Shared er master for sesjonsformatet. Apper skal ikke ha egne kopier.
```ts
import { signSession, verifySession, verifyIdentitySession } from "@kodo/shared/auth";

// Én bruker (som før): payload { iat, exp }
await signSession(secret, ttlSeconds);

// Fler-bruker: payload { iat, exp, sub, admin? }
await signSession(secret, ttlSeconds, { sub: "brukernavn", admin: true });

await verifySession(cookie, secret);          // gyldig signatur + ikke utløpt
await verifyIdentitySession(cookie, secret);  // som over + krever sub
```
Formatet er byte-likt med kodo-rapport sin lokale `lib/auth.ts`, så tokens
verifiseres begge veier.
