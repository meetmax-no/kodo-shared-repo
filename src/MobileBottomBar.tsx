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

/** Klassenavn for én knapp/lenke i bunnlinjen: ikon over liten tekst, 56 px høy. */
export const kodoBarItem =
  "flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-xl text-[var(--kodo-text)] transition hover:bg-[var(--kodo-hover-strong)] active:bg-[var(--kodo-hover-strong)] disabled:opacity-50 [&_svg]:h-6 [&_svg]:w-6";

/** Den lille teksten under ikonet i bunnlinjen. */
export function BarLabel({ children }: { children: ReactNode }) {
  return (
    <span className="max-w-full truncate px-0.5 text-[9px] font-semibold uppercase tracking-wider">{children}</span>
  );
}

export function MobileBottomBar({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <>
      <div aria-hidden className="order-last h-[calc(5rem+env(safe-area-inset-bottom))] shrink-0 sm:hidden print:hidden" />
      <nav
        aria-label={label}
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--kodo-border-strong)] bg-[var(--kodo-glass)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden print:hidden"
      >
        {/* Like brede kolonner uansett antall (også knapper i fragmenter). */}
        <div className="grid auto-cols-fr grid-flow-col gap-1 px-2 py-2">
          {children}
        </div>
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
