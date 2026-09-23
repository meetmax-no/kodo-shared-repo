# @kodo/shared

> **Shared er master.** Gjenbrukbar kode i Ko|Do-appene hentes herfra. Mangler
> noe, oppdateres shared (bakoverkompatibelt, testet) — appene skal ikke ha
> lokale kopier eller varianter. Lokalt i appen ligger bare det app-spesifikke
> (cookie-navn, stier, Redis-prefiks, tekster).

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

## Brukere (`@kodo/shared/security`, Node)
Navngitte brukere med scrypt-hashet passord i Redis, og admin-passord fra ENV.
Format byte-kompatibelt med kodo-rapport sin tidligere `lib/users.ts`.
```ts
import { createUserStore, checkAdminPassword, isValidUsername } from "@kodo/shared/security";

const users = createUserStore(redis as unknown as KodoUserRedis, { prefix: "food" });
await users.verifyPassword("anne", pw);   // constant-time, ukjent bruker → false
await users.create("anne", pw);            // kalleren validerer format/reservert
checkAdminPassword(pw, process.env.ADMIN_PASSWORD); // constant-time, tom ENV → false
```
Nøkler: `${prefix}:user:${brukernavn}` og `${prefix}:users`.

## `LoginCard` med brukernavn (`@kodo/shared/ui`)
Sett `usernameLabel` for fler-bruker; uten den er kortet passord-only som før.
`onSubmit(password, username)` — `username` er trimmet, eller `""`.

## Mobil
`LoginCard`: 16 px skrift i feltene og 44 px trykkflater under `sm`; fra `sm`
og oppover uendret. `LanguagePicker`: 44×44 px trykkflate via usynlig `::before`,
utseendet uendret.

## Skjema-stiler (`@kodo/shared/ui`)
Felles klassenavn, så apper ikke kopierer klassestrenger:
`kodoLabel`, `kodoField` (input/select/textarea), `kodoButtonPrimary`,
`kodoButtonSecondary`. Mobil: 16 px i feltene og 44 px knapper under `sm`.
Primærknappens farge settes inline: `style={{ backgroundColor: "var(--kodo-blue)" }}`.
`LoginCard` og `Biometric` bruker dem selv.

## `ConfirmDialog` (`@kodo/shared/ui`)
Bekreftelsesvindu («Vil du slette?»). i18n-fritt (tekst som props), `danger`
for rød bekreft-knapp, `busy` låser knappene. ESC/klikk utenfor = avbryt, fokus
starter på «Avbryt». 44 px knapper på mobil.
```tsx
<ConfirmDialog open={open} title={t("…delete_title")} message={recipe.title}
  confirmLabel={t("…delete")} cancelLabel={t("…cancel")} danger
  onConfirm={remove} onCancel={() => setOpen(false)} />
```
