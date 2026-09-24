"use client";

// Delt bildebeskjærer (modell: bankboks' CardCropper): hele bildet vises i
// fullskjerm, og brukeren drar i en utsnittsramme med håndtak. Låst til
// `aspect` som standard; lås-knappen gir fritt format. Tredjedelslinjer.
// `react-image-crop` velger bare koordinatene — pikslene klippes i vår egen
// canvas. Leverer utsnittet som JPEG (`onCrop(blob)`), maks `outputWidth` bredt
// (mindre utsnitt skaleres ikke opp). i18n-fritt (tekst som props). Mobil først:
// fyller skjermen, 44 px knapper. `src` må være samme opprinnelse eller en
// blob:-URL, ellers kan ikke canvas lese pikslene.
import { useEffect, useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Check, Loader2, Lock, LockOpen, X } from "lucide-react";
import { cn } from "./cn";
import { kodoButtonPrimary, kodoButtonSecondary } from "./styles";

export interface ImageCropperProps {
  src: string;
  /** Bredde/høyde for låst format, f.eks. 4 / 3. */
  aspect: number;
  /** Maks bredde på resultatet i piksler (mindre utsnitt skaleres ikke opp). */
  outputWidth: number;
  title: string;
  /** Tekst på lås-knappen når formatet er låst, f.eks. «4:3». */
  lockedLabel: string;
  /** Tekst på lås-knappen når formatet er fritt, f.eks. «Fritt». */
  freeLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Vises på bekreft-knappen mens `busy`. */
  busyLabel?: string;
  /** Hjelpetekst under knappene. */
  hint?: string;
  busy?: boolean;
  /** JPEG-kvalitet 0–1 (standard 0,85). */
  quality?: number;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

function startCrop(width: number, height: number, aspect: number): Crop {
  return centerCrop(makeAspectCrop({ unit: "%", width: 88 }, aspect, width, height), width, height);
}

export function ImageCropper({
  src,
  aspect,
  outputWidth,
  title,
  lockedLabel,
  freeLabel,
  confirmLabel,
  cancelLabel,
  busyLabel,
  hint,
  busy = false,
  quality = 0.85,
  onCrop,
  onCancel,
}: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [done, setDone] = useState<PixelCrop | null>(null);
  const [locked, setLocked] = useState(true);

  // ESC avbryter; siden bak ruller ikke.
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = prev;
    };
  }, [busy, onCancel]);

  const toggleLock = () => {
    const next = !locked;
    setLocked(next);
    // Fra fritt til låst: snapp rammen til formatet.
    const img = imgRef.current;
    if (next && img) setCrop(startCrop(img.width, img.height, aspect));
  };

  const confirm = () => {
    const img = imgRef.current;
    if (!img || !done?.width || !done?.height || busy) return;
    // react-image-crop gir skjerm-piksler; skaler til bildets egne piksler.
    const sx = img.naturalWidth / img.width;
    const sy = img.naturalHeight / img.height;
    const cw = done.width * sx;
    const ch = done.height * sy;
    const w = Math.round(Math.min(outputWidth, cw));
    const h = Math.round((w * ch) / cw);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, done.x * sx, done.y * sy, cw, ch, 0, 0, w, h);
    canvas.toBlob((blob) => blob && onCrop(blob), "image/jpeg", quality);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[110] flex flex-col bg-black text-white"
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <span className="truncate text-sm font-semibold">{title}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLock}
            disabled={busy}
            aria-pressed={locked}
            className="flex min-h-11 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white disabled:opacity-50 sm:min-h-0 sm:py-2"
          >
            {locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
            {locked ? lockedLabel : freeLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label={cancelLabel}
            title={cancelLabel}
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-white disabled:opacity-50 sm:h-9 sm:w-9"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        <ReactCrop
          crop={crop}
          onChange={(_, percent) => setCrop(percent)}
          onComplete={(c) => setDone(c)}
          aspect={locked ? aspect : undefined}
          keepSelection
          ruleOfThirds
          minWidth={40}
          minHeight={30}
          disabled={busy}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            onLoad={(e) => {
              const { width, height } = e.currentTarget;
              const c = startCrop(width, height, aspect);
              setCrop(c);
              // Startrammen i piksler, så «bekreft» virker uten at rammen røres.
              setDone({
                unit: "px",
                x: ((c.x ?? 0) / 100) * width,
                y: ((c.y ?? 0) / 100) * height,
                width: ((c.width ?? 0) / 100) * width,
                height: ((c.height ?? 0) / 100) * height,
              });
            }}
            style={{ maxHeight: "70vh", maxWidth: "100%" }}
          />
        </ReactCrop>
      </div>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className={cn(kodoButtonSecondary, "w-full border-white/20 text-white sm:w-auto")}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy || !done?.width || !done?.height}
            style={{ backgroundColor: "var(--kodo-blue)" }}
            className={cn(kodoButtonPrimary, "w-full sm:w-auto")}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {busy ? (busyLabel ?? confirmLabel) : confirmLabel}
          </button>
        </div>
        {hint && <p className="mt-3 text-center text-[11px] text-white/50">{hint}</p>}
      </div>
    </div>
  );
}
