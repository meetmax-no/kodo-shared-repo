// i18n-kjerne — port av bankboks lib/i18n.ts, men DICT-INJISERT: appen sender
// inn sine egne ordbøker, så shared ikke bundler noen locale-filer. Ren TS.
// Fallback-kjede: dict[locale][key] ?? dict.no[key] ?? key. Norsk er kanonisk.

export type Locale = "no" | "sv" | "da" | "en";
export const LOCALES: readonly Locale[] = ["no", "sv", "da", "en"] as const;
export const DEFAULT_LOCALE: Locale = "no";
export const STORAGE_KEY = "kodo-locale";

/** Flagg + navn pr. språk (til LanguagePicker). */
export const LOCALE_META: Record<
  Locale,
  { flag: string; label: string; nativeLabel: string }
> = {
  no: { flag: "🇳🇴", label: "Norsk", nativeLabel: "Norsk" },
  sv: { flag: "🇸🇪", label: "Svensk", nativeLabel: "Svenska" },
  da: { flag: "🇩🇰", label: "Dansk", nativeLabel: "Dansk" },
  en: { flag: "🇬🇧", label: "Engelsk", nativeLabel: "English" },
};

export type Dict = Record<string, string>;
export type Dicts = Partial<Record<Locale, Dict>>;

/** Flat ut en rå ordbok: dropp `_`-prefiks-nøkler, behold ikke-tomme strenger. */
export function flattenDict(raw: Record<string, unknown>): Dict {
  const out: Dict = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith("_")) continue;
    if (typeof v === "string" && v.length > 0) out[k] = v;
  }
  return out;
}

/** dict[locale][key] ?? dict.no[key] ?? key (nøkkelen selv = synlig «mangler»). */
export function translate(key: string, locale: Locale, dicts: Dicts): string {
  const exact = dicts[locale]?.[key];
  if (exact !== undefined) return exact;
  const fb = dicts[DEFAULT_LOCALE]?.[key];
  if (fb !== undefined) return fb;
  return key;
}

export function isValidLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALES as readonly string[]).includes(x);
}

/** navigator.language ("nb-NO"/"sv-SE"…) → vår Locale, ellers null. */
export function matchNavigatorLocale(
  navLang: string | undefined | null,
): Locale | null {
  if (!navLang) return null;
  const l = navLang.toLowerCase();
  if (l.startsWith("nb") || l.startsWith("nn") || l.startsWith("no")) return "no";
  if (l.startsWith("sv")) return "sv";
  if (l.startsWith("da")) return "da";
  if (l.startsWith("en")) return "en";
  return null;
}

export function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isValidLocale(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* localStorage avslått — ignorer */
  }
}

/** Initial locale: lagret → tenant-default → navigator → DEFAULT_LOCALE. */
export function resolveInitialLocale(opts: {
  stored?: Locale | null;
  tenantDefault?: Locale | null;
  navLanguage?: string | null;
}): Locale {
  if (opts.stored && isValidLocale(opts.stored)) return opts.stored;
  if (opts.tenantDefault && isValidLocale(opts.tenantDefault))
    return opts.tenantDefault;
  const nav = matchNavigatorLocale(opts.navLanguage);
  if (nav) return nav;
  return DEFAULT_LOCALE;
}
