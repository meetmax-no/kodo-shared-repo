"use client";

// Delt, dumt fane-modal-skall (port av bankboks SettingsPanel-mønster).
// Eier KUN rammen: overlay, header, fane-bar, aktiv-indikator, ESC, bytting.
// Appen leverer sine egne faner (label + innhold) og styrer synlighet via
// `visible`. Skallet vet ingenting om roller/hosts. Styles via --kodo-*-tokens,
// så det arver appens tema.
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "./cn";

export interface TabDef {
  key: string;
  label: string;
  /** Skjul fanen når false (default-vis: undefined/true → synlig). */
  visible?: boolean;
  render: () => ReactNode;
}

export function SettingsShell({
  open,
  title,
  tabs,
  onClose,
}: {
  open: boolean;
  title: ReactNode;
  tabs: TabDef[];
  onClose: () => void;
}) {
  const shown = tabs.filter((t) => t.visible !== false);
  const [active, setActive] = useState<string>(shown[0]?.key ?? "");

  // Reset til første fane hver gang vinduet åpnes.
  useEffect(() => {
    if (open) setActive(shown[0]?.key ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ESC lukker.
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  const current = shown.find((t) => t.key === active) ?? shown[0];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="my-8 w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--kodo-border-strong)] bg-[rgba(18,24,36,0.98)] text-[var(--kodo-text)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--kodo-border)] px-5 py-4">
          <div className="text-[15px] font-semibold">{title}</div>
          <button
            onClick={onClose}
            aria-label="Lukk"
            className="cursor-pointer rounded-md border-0 bg-transparent px-2 py-1 text-[var(--kodo-muted)] transition hover:bg-white/10 hover:text-[var(--kodo-text)]"
          >
            ✕
          </button>
        </div>

        {/* Fane-bar */}
        <div className="flex gap-1 overflow-x-auto border-b border-[var(--kodo-border)] px-4">
          {shown.map((t) => {
            const isActive = t.key === current?.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(t.key)}
                className={cn(
                  // Selv-innholdt: eksplisitt border-0/bg så host-appens
                  // globale button-stil ikke blør inn (preflight kan være av).
                  "relative cursor-pointer whitespace-nowrap rounded-md border-0 px-3 py-2 text-[13px] font-medium transition",
                  isActive
                    ? "bg-[var(--kodo-accent-soft)] text-[var(--kodo-accent)]"
                    : "bg-transparent text-[var(--kodo-muted)] hover:bg-white/[0.04] hover:text-[var(--kodo-text)]",
                )}
              >
                {t.label}
                {isActive && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-t bg-[var(--kodo-accent)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Innhold */}
        <div className="p-5">{current?.render()}</div>
      </div>
    </div>
  );
}
