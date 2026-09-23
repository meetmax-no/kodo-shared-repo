"use client";

// Delt bekreftelsesvindu («Vil du slette?»). Samme overlay/flate som
// SettingsShell (kun --kodo-*). i18n-fritt: all tekst som props. ESC og klikk på
// bakteppet = avbryt. Fokus starter på «Avbryt», så et uhell-Enter ikke sletter.
// Mobil: 44 px knapper under sm (kodoButton*).
import { useEffect, useRef } from "react";
import { cn } from "./cn";
import { kodoButtonSecondary } from "./styles";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Rød bekreft-knapp (sletting o.l.). */
  danger?: boolean;
  /** Viser confirmLabel som opptatt og låser knappene. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const h = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[var(--kodo-overlay)] p-4 backdrop-blur-sm"
      onClick={() => !busy && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="kodo-confirm-title"
        aria-describedby={message ? "kodo-confirm-message" : undefined}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-[var(--kodo-border-strong)] bg-[var(--kodo-surface-modal)] p-6 text-[var(--kodo-text)] shadow-2xl"
      >
        <h2 id="kodo-confirm-title" className="text-lg font-semibold">
          {title}
        </h2>
        {message && (
          <p id="kodo-confirm-message" className="mt-2 text-sm text-[var(--kodo-muted)]">
            {message}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className={cn(kodoButtonSecondary, "w-full sm:w-auto")}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            style={
              danger
                ? { background: "var(--kodo-danger-bg)", borderColor: "var(--kodo-danger-border)", color: "var(--kodo-tint-red-fg)" }
                : { backgroundColor: "var(--kodo-blue)", color: "#fff" }
            }
            className={cn(kodoButtonSecondary, "w-full font-semibold sm:w-auto")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
