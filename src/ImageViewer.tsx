"use client";

// Delt bildevindu: viser en liste bilder i full bredde over et bakteppe, rullbart.
// Samme overlay/flate som SettingsShell/ConfirmDialog (kun --kodo-*). i18n-fritt.
// ESC, «Lukk» og klikk på bakteppet lukker. Mobil: fyller skjermen, 44 px lukk.
import { useEffect, useRef } from "react";
import { cn } from "./cn";
import { kodoButtonSecondary } from "./styles";

export interface ImageViewerProps {
  open: boolean;
  title: string;
  images: { src: string; alt?: string }[];
  closeLabel: string;
  onClose: () => void;
}

export function ImageViewer({ open, title, images, closeLabel, onClose }: ImageViewerProps) {
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
      className="fixed inset-0 z-[110] flex justify-center bg-[var(--kodo-overlay)] backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kodo-imageviewer-title"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-[var(--kodo-surface-modal)] text-[var(--kodo-text)] shadow-2xl sm:rounded-2xl sm:border sm:border-[var(--kodo-border-strong)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--kodo-border)] px-4 py-3">
          <h2 id="kodo-imageviewer-title" className="truncate text-base font-semibold">
            {title}
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} className={cn(kodoButtonSecondary, "shrink-0")}>
            {closeLabel}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-3">
            {images.map((img, i) => (
              <li key={img.src + i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.alt ?? ""}
                  loading="lazy"
                  className="h-auto w-full rounded-lg border border-[var(--kodo-border)] bg-white"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
