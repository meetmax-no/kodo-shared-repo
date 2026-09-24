"use client";

// Delt knapp med liten meny (f.eks. «Del» → Del lenken / Kopier / Slutt å dele).
// Menyen åpner seg over knappen (knapper nederst på siden ligger over
// bunnlinjen på mobil). Klikk utenfor, ESC eller et valg lukker. i18n-fritt,
// kun --kodo-*, 44 px valg på mobil.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "./cn";
import { kodoButtonSecondary } from "./styles";

export interface ActionMenuItem {
  key: string;
  label: string;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface ActionMenuProps {
  label: ReactNode;
  items: ActionMenuItem[];
  /** Hvilken kant menyen følger (standard venstre). */
  align?: "start" | "end";
  disabled?: boolean;
  className?: string;
}

export function ActionMenu({ label, items, align = "start", disabled, className }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={kodoButtonSecondary}
      >
        {label}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute bottom-full z-40 mb-2 min-w-48 overflow-hidden rounded-lg border border-[var(--kodo-border-strong)] bg-[var(--kodo-surface-modal)] py-1 shadow-2xl",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              onClick={() => {
                setOpen(false);
                it.onSelect();
              }}
              className={cn(
                "flex min-h-11 w-full items-center px-4 text-left text-sm transition hover:bg-[var(--kodo-hover-strong)] disabled:opacity-50 sm:min-h-9",
                it.danger ? "text-[var(--kodo-tint-red-fg)]" : "text-[var(--kodo-text)]",
              )}
              style={{ background: "transparent" }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
