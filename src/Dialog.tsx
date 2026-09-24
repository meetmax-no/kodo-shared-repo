"use client";

// Delt enkelt vindu (samme overlay/flate som ImageViewer/ConfirmDialog, kun
// --kodo-*): tittel, «Lukk» og fritt innhold, rullbart. ESC, «Lukk» og klikk på
// bakteppet lukker. Mobil: fyller skjermen, 44 px lukk. i18n-fritt.
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "./cn";
import { kodoButtonSecondary } from "./styles";

export interface DialogProps {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}

export function Dialog({ open, title, closeLabel, onClose, children }: DialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex justify-center bg-[var(--kodo-overlay)] backdrop-blur-sm sm:items-start sm:p-4 sm:pt-16"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kodo-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-[var(--kodo-surface-modal)] text-[var(--kodo-text)] shadow-2xl sm:h-auto sm:max-h-[80vh] sm:rounded-2xl sm:border sm:border-[var(--kodo-border-strong)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--kodo-border)] px-4 py-3">
          <h2 id="kodo-dialog-title" className="truncate text-base font-semibold">
            {title}
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} className={cn(kodoButtonSecondary, "shrink-0")}>
            {closeLabel}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
