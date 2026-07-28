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
