// Felles skjema-stiler (klassenavn) for Ko|Do-apper — én kilde, så apper ikke
// kopierer klassestrenger. Kun --kodo-*-tokens. Mobil først: 16 px i feltene
// (iOS zoomer ellers inn ved fokus) og 44 px knapper under `sm`; fra `sm` og
// oppover 14 px / 40 px. Knappefarge settes inline i komponentene
// (style={{ backgroundColor: "var(--kodo-blue)" }}), så en apps globale
// button-stil ikke kaprer den.

/** Etikett over et felt. */
export const kodoLabel =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--kodo-muted)]";

/** Tekstfelt, select og textarea. */
export const kodoField =
  "w-full rounded-lg border border-[var(--kodo-border-strong)] bg-[var(--kodo-surface)] py-2.5 pl-3 pr-3 text-base text-[var(--kodo-text)] outline-none transition focus:border-[var(--kodo-blue)] sm:text-sm";

/** Hovedknapp (fyll med inline bakgrunnsfarge). */
export const kodoButtonPrimary =
  "flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow transition disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0";

/** Sekundærknapp med kant. */
export const kodoButtonSecondary =
  "flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--kodo-border-strong)] px-4 py-2.5 text-sm font-medium text-[var(--kodo-text)] transition hover:bg-[var(--kodo-hover-strong)] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0";

/** Rund ikonknapp i toppraden (40×40, som bankboks). Sett aria-label og title. */
export const kodoIconButton =
  "flex h-10 w-10 items-center justify-center rounded-full border border-[var(--kodo-border-strong)] text-[var(--kodo-text)] transition hover:bg-[var(--kodo-hover-strong)] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4";

/** Rad som rulles sidelengs (f.eks. filterknapper): tynt, mørkt rullefelt i
 *  Ko|Do-farger under innholdet (ikke nettleserens lyse standard), med plass
 *  under så det ikke dekker knappene. Standard (Chrome/Firefox) + WebKit. */
export const kodoScrollX =
  "overflow-x-auto pb-3 [scrollbar-width:thin] [scrollbar-color:var(--kodo-border-strong)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--kodo-border-strong)]";
