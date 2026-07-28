"use client";

// i18n React-lag — port av bankboks lib/i18n-context.tsx. <LocaleProvider>
// tar ordbøkene som PROP (dict-injisert), så hver app leverer sine egne locales.
// useLocale() gir { locale, setLocale, t, available }.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  isValidLocale,
  readStoredLocale,
  resolveInitialLocale,
  translate,
  writeStoredLocale,
  type Dicts,
  type Locale,
} from "./i18n";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string) => string;
  /** Språk appen faktisk tilbyr (til LanguagePicker). */
  available: Locale[];
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  dicts,
  available,
  tenantDefaultLocale,
}: {
  children: ReactNode;
  /** App-injiserte ordbøker. */
  dicts: Dicts;
  /** Hvilke språk som vises i picker (default: nøklene i dicts). */
  available?: Locale[];
  tenantDefaultLocale?: Locale | null;
}) {
  // SSR-trygt: alltid DEFAULT_LOCALE først; klient korrigerer i useEffect.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = readStoredLocale();
    const navLang =
      typeof navigator !== "undefined" ? navigator.language : null;
    const resolved = resolveInitialLocale({
      stored,
      tenantDefault: tenantDefaultLocale ?? null,
      navLanguage: navLang,
    });
    setLocaleState(resolved);
    if (typeof document !== "undefined")
      document.documentElement.lang = resolved;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((next: Locale) => {
    if (!isValidLocale(next)) return;
    setLocaleState(next);
    writeStoredLocale(next);
    if (typeof document !== "undefined") document.documentElement.lang = next;
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: string) => translate(key, locale, dicts),
      available: available ?? (Object.keys(dicts) as Locale[]),
    }),
    [locale, setLocale, dicts, available],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale() må brukes innenfor <LocaleProvider>.");
  }
  return ctx;
}
