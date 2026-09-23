"use client";

// Delt bunnlinje for mobil (port av bankboks' MobileBottomBar): fast nederst,
// vises kun under `sm`. Rendrer også en usynlig avstandsblokk med `order-last`,
// så innholdet ikke havner bak linjen — legg derfor linjen direkte i sidens
// ytterste flex-kolonne (flex flex-col), hvor som helst i rekkefølgen. Tar hensyn til gestfeltet
// (safe-area-inset-bottom). Skjules ved utskrift. Kun --kodo-*-tokens.
// Hver knapp: ikon + liten tekst under (som bankboks). Lag dem med
// `MobileBarButton`, eller `kodoBarItem` + `<BarLabel>` på en lenke
// (f.eks. Next <Link className={kodoBarItem}><Icon /><BarLabel>…</BarLabel></Link>).
import type { ReactNode } from "react";
import { cn } from "./cn";

/** Klassenavn for én knapp/lenke i bunnlinjen: ikon i sirkel (40 px, som
 *  kodoIconButton) over liten tekst. */
export const kodoBarItem =
  "flex w-full flex-col items-center justify-center gap-1 rounded-xl py-1 text-[var(--kodo-text)] transition disabled:opacity-50 [&_svg]:box-content [&_svg]:h-5 [&_svg]:w-5 [&_svg]:rounded-full [&_svg]:border [&_svg]:border-[var(--kodo-border-strong)] [&_svg]:p-[9px] [&_svg]:transition hover:[&_svg]:bg-[var(--kodo-hover-strong)] active:[&_svg]:bg-[var(--kodo-hover-strong)]";

/** Den lille teksten under ikonet i bunnlinjen. */
export function BarLabel({ children }: { children: ReactNode }) {
  return (
    <span className="max-w-full truncate px-0.5 text-[9px] font-semibold uppercase tracking-wider">{children}</span>
  );
}

export function MobileBottomBar({
  children,
  label,
  columns,
  start,
}: {
  children: ReactNode;
  label?: string;
  /** Faste, like brede plasser. `start` (f.eks. «Tilbake») står alltid på plass
   *  1 til venstre; resten fylles fra høyre. Uten: like brede kolonner for
   *  knappene som finnes. */
  columns?: number;
  start?: ReactNode;
}) {
  return (
    <>
      <div aria-hidden className="order-last h-[calc(5rem+env(safe-area-inset-bottom))] shrink-0 sm:hidden print:hidden" />
      <nav
        aria-label={label}
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--kodo-border-strong)] bg-[var(--kodo-glass)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden print:hidden"
      >
        {columns ? (
          // Faste plasser: start i plass 1, resten høyrejustert i plass 2..n,
          // hver like bred som én plass (også knapper i fragmenter).
          <div
            className="grid px-2 py-2"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            <div className="flex">{start}</div>
            <div
              className="flex justify-end [&>*]:shrink-0 [&>*]:grow-0 [&>*]:basis-[var(--kodo-bar-slot)]"
              style={{ gridColumn: "2 / -1", ["--kodo-bar-slot" as string]: `calc(100% / ${columns - 1})` }}
            >
              {children}
            </div>
          </div>
        ) : (
          // Like brede kolonner uansett antall (også knapper i fragmenter).
          <div className="grid auto-cols-fr grid-flow-col gap-1 px-2 py-2">
            {start}
            {children}
          </div>
        )}
      </nav>
    </>
  );
}

export function MobileBarButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  /** Vises som liten tekst under ikonet. */
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  /** Ikonet. */
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(kodoBarItem, className)}
      style={{ background: "transparent" }}
    >
      {children}
      <BarLabel>{label}</BarLabel>
    </button>
  );
}
