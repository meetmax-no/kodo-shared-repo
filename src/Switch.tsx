"use client";

// Delt på/av-bryter (token-drevet, self-contained). Tilgjengelig: role="switch"
// + aria-checked. Ingen host-avhengighet, ingen hardkodede farger — kun --kodo-*.
// PÅ = grønn (--kodo-ok), AV = --kodo-border-strong; knott = --kodo-text.
import { cn } from "./cn";

export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** aria-label for tilgjengelighet når bryteren står uten synlig ledetekst. */
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border border-[var(--kodo-border)] transition-colors",
        checked ? "bg-[var(--kodo-ok)]" : "bg-[var(--kodo-border-strong)]",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-[var(--kodo-text)] shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
