// Norske beløps-hjelpere — delt mellom Flow (UI + PDF) og bankboks.

/** Parse en norsk beløps-streng ("1.234,56" / "1 234,56") til tall. */
export function parseAmount(s: string | undefined | null): number {
  if (!s) return 0;
  let t = s.replace(/\s/g, "");
  const lc = t.lastIndexOf(",");
  const ld = t.lastIndexOf(".");
  const dec = lc > ld ? "," : ld > -1 ? "." : "";
  if (dec) {
    const thou = dec === "," ? "." : ",";
    t = t.split(thou).join("").replace(dec, ".");
  }
  const n = parseFloat(t);
  return isNaN(n) ? 0 : n;
}

/** Tall → "1 234,56" (norsk: mellomrom som tusenskille, komma-desimal).
 *  ASCII-minus «-» → trygt i både WinAnsi-PDF og UI. */
export function formatKr(n: number): string {
  const neg = n < 0;
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${neg ? "-" : ""}${grouped},${dec}`;
}

/** Tall → norsk visning uten unødvendige desimaler: 1.5 → "1,5", 227 → "227",
 *  1234.5 → "1 234,5". `maxDecimals` (standard 2) avrunder. */
export function formatNumber(n: number, maxDecimals = 2): string {
  const neg = n < 0;
  // Fjern bare nuller etter desimalpunktet (ikke i heltall: 1560 → "1 560").
  const fixed = Math.abs(n).toFixed(maxDecimals).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  const [int, dec] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${neg ? "-" : ""}${grouped}${dec ? `,${dec}` : ""}`;
}
