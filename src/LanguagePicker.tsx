"use client";

// Delt språkvelger — port av bankboks LanguagePicker, OPPGRADERT: mapper over
// `available` (hvilke språk appen tilbyr, styrt av config/LocaleProvider) i
// stedet for hardkodet LOCALES. Nøytral UI-chrome (hvite tinter, ingen brand).
// Self-contained (p-0/cursor eksplisitt — Flow har ikke Tailwind-preflight).
// Trykkflaten er 44×44 px via et usynlig ::before (utseendet er uendret).
import { LOCALE_META, type Locale } from "./i18n";
import { useLocale } from "./i18n-context";
import { cn } from "./cn";

export function LanguagePicker({
  size = "md",
  ariaLabel,
}: {
  size?: "sm" | "md";
  ariaLabel?: string;
}) {
  const { locale, setLocale, available, t } = useLocale();
  const label = ariaLabel ?? t("language_picker.aria_label");
  const dim = size === "md" ? "h-9 w-9 text-lg" : "h-8 w-8 text-base";
  // Usynlig utvidelse av trykkflaten til 44×44 px (mobilkrav), uten å endre
  // utseende eller layout. ::before regnes fra innsiden av 1 px-kanten:
  // md 34 + 2×5 = 44, sm 30 + 2×7 = 44.
  const hit =
    size === "md"
      ? "relative before:absolute before:-inset-[5px] before:content-['']"
      : "relative before:absolute before:-inset-[7px] before:content-['']";
  const gap = size === "md" ? "gap-1.5" : "gap-1";

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex items-center", gap)}
    >
      {available.map((code) => {
        const meta = LOCALE_META[code];
        if (!meta) return null;
        const isActive = locale === code;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={meta.nativeLabel}
            title={meta.nativeLabel}
            onClick={() => setLocale(code)}
            className={cn(
              dim,
              hit,
              "flex cursor-pointer items-center justify-center rounded-full border p-0 transition-all duration-150",
              isActive
                ? "border-white/40 bg-white/25 shadow-[0_0_12px_rgba(255,255,255,0.15)] ring-2 ring-white/50"
                : "border-white/15 bg-white/10 opacity-60 hover:border-white/25 hover:bg-white/15 hover:opacity-100",
            )}
          >
            <span aria-hidden="true" className="leading-none">
              {meta.flag}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export type { Locale };
