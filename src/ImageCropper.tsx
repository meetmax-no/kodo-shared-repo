"use client";

// Delt bildebeskjærer: fast format (`aspect`), flytt med én finger/mus, zoom med
// to fingre eller glidebryter. Leverer utsnittet som JPEG (`onCrop(blob)`).
// i18n-fritt (tekst som props), kun --kodo-*. Mobil først: 44 px knapper,
// `touch-action: none` på rammen så siden ikke ruller mens man drar.
// `src` må være samme opprinnelse (eller blob:-URL), ellers kan ikke canvas lese
// pikslene.
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { cn } from "./cn";
import { kodoButtonPrimary, kodoButtonSecondary, kodoLabel } from "./styles";

export interface ImageCropperProps {
  src: string;
  /** Bredde/høyde, f.eks. 4 / 3. */
  aspect: number;
  /** Maks bredde på resultatet i piksler (mindre utsnitt skaleres ikke opp). */
  outputWidth: number;
  zoomLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Vises på bekreft-knappen mens `busy`. */
  busyLabel?: string;
  busy?: boolean;
  /** JPEG-kvalitet 0–1 (standard 0,85). */
  quality?: number;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

const MAX_ZOOM = 4;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type View = { z: number; x: number; y: number };

export function ImageCropper({
  src,
  aspect,
  outputWidth,
  zoomLabel,
  confirmLabel,
  cancelLabel,
  busyLabel,
  busy = false,
  quality = 0.85,
  onCrop,
  onCancel,
}: ImageCropperProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [frameW, setFrameW] = useState(0);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [view, setView] = useState<View>({ z: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  const frameH = frameW / aspect;
  const base = natural && frameW ? Math.max(frameW / natural.w, frameH / natural.h) : 1;

  // Holder bildet innenfor rammen (ingen tomme kanter).
  const fit = useCallback(
    (v: View): View => {
      if (!natural) return v;
      const s = base * v.z;
      return {
        z: v.z,
        x: clamp(v.x, frameW - natural.w * s, 0),
        y: clamp(v.y, frameH - natural.h * s, 0),
      };
    },
    [natural, base, frameW, frameH],
  );

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFrameW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Nytt bilde eller ny rammebredde → sentrer på zoom 1.
  useEffect(() => {
    if (!natural || !frameW) return;
    const s = Math.max(frameW / natural.w, frameW / aspect / natural.h);
    setView({ z: 1, x: (frameW - natural.w * s) / 2, y: (frameW / aspect - natural.h * s) / 2 });
  }, [natural, frameW, aspect]);

  /** Zoom til `z` rundt punktet (cx, cy) i rammen, flyttet med (dx, dy). */
  const zoomAt = (v: View, z: number, cx: number, cy: number, dx = 0, dy = 0): View => {
    const nz = clamp(z, 1, MAX_ZOOM);
    const k = nz / v.z;
    return fit({ z: nz, x: cx + dx - (cx - v.x) * k, y: cy + dy - (cy - v.y) * k });
  };

  const local = (e: PointerEvent) => {
    const r = frameRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (busy) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, local(e));
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const p = local(e);
    const others = [...pointers.current.entries()].filter(([id]) => id !== e.pointerId);
    if (others.length === 0) {
      setView((v) => fit({ ...v, x: v.x + p.x - prev.x, y: v.y + p.y - prev.y }));
    } else {
      const o = others[0][1];
      const d0 = Math.hypot(prev.x - o.x, prev.y - o.y);
      const d1 = Math.hypot(p.x - o.x, p.y - o.y);
      const m0 = { x: (prev.x + o.x) / 2, y: (prev.y + o.y) / 2 };
      const m1 = { x: (p.x + o.x) / 2, y: (p.y + o.y) / 2 };
      if (d0 > 0) setView((v) => zoomAt(v, v.z * (d1 / d0), m0.x, m0.y, m1.x - m0.x, m1.y - m0.y));
    }
    pointers.current.set(e.pointerId, p);
  };

  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
  };

  const confirm = () => {
    const img = imgRef.current;
    if (!img || !natural || !frameW || busy) return;
    const s = base * view.z;
    const sw = frameW / s;
    const sh = frameH / s;
    const w = Math.round(Math.min(outputWidth, sw));
    const h = Math.round(w / aspect);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, -view.x / s, -view.y / s, sw, sh, 0, 0, w, h);
    canvas.toBlob((blob) => blob && onCrop(blob), "image/jpeg", quality);
  };

  const s = base * view.z;

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={frameRef}
        className="relative w-full cursor-grab touch-none select-none overflow-hidden rounded-lg border border-[var(--kodo-border-strong)] bg-black active:cursor-grabbing"
        style={{ aspectRatio: String(aspect) }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt=""
          draggable={false}
          onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          className="pointer-events-none absolute left-0 top-0 max-w-none origin-top-left"
          style={
            natural
              ? { width: natural.w, height: natural.h, transform: `translate(${view.x}px, ${view.y}px) scale(${s})` }
              : { opacity: 0 }
          }
        />
      </div>

      <div>
        <label className={kodoLabel} htmlFor="kodo-cropper-zoom">
          {zoomLabel}
        </label>
        <input
          id="kodo-cropper-zoom"
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={view.z}
          disabled={busy || !natural}
          onChange={(e) => setView((v) => zoomAt(v, Number(e.target.value), frameW / 2, frameH / 2))}
          className="h-11 w-full accent-[var(--kodo-blue)]"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={busy} className={cn(kodoButtonSecondary, "w-full sm:w-auto")}>
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={busy || !natural}
          style={{ backgroundColor: "var(--kodo-blue)" }}
          className={cn(kodoButtonPrimary, "w-full sm:w-auto")}
        >
          {busy ? (busyLabel ?? confirmLabel) : confirmLabel}
        </button>
      </div>
    </div>
  );
}
