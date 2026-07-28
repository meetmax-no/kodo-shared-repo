"use client";

// Delte innstillings-primitiver (port av bankboks' rad/kort-mønster).
// Presentasjonelle: appen sender innhold + handlere; config styrer `visible`.
// Self-contained + token-drevet (ingen host-avhengighet, ingen hardkodede farger).
import { type ReactNode } from "react";
import { cn } from "./cn";

export type Tint = "blue" | "amber" | "green" | "red" | "purple";

const TINT: Record<Tint, string> = {
  blue: "bg-[var(--kodo-tint-blue-bg)] text-[var(--kodo-tint-blue-fg)]",
  amber: "bg-[var(--kodo-tint-amber-bg)] text-[var(--kodo-tint-amber-fg)]",
  green: "bg-[var(--kodo-tint-green-bg)] text-[var(--kodo-tint-green-fg)]",
  red: "bg-[var(--kodo-tint-red-bg)] text-[var(--kodo-tint-red-fg)]",
  purple: "bg-[var(--kodo-tint-purple-bg)] text-[var(--kodo-tint-purple-fg)]",
};

/** Farget avrundet ikon-flis. */
export function IconTile({
  icon,
  tint = "blue",
}: {
  icon: ReactNode;
  tint?: Tint;
}) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--kodo-border)] text-[17px]",
        TINT[tint],
      )}
    >
      {icon}
    </div>
  );
}

/** Liten caps-etikett som grupperer rader. */
export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 mt-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--kodo-muted)]">
      {children}
    </div>
  );
}

/** Innstillings-rad: ikon-flis + tittel + beskrivelse + valgfri høyre-slot.
 *  onClick gjør hele raden klikkbar; action er et eget høyre-element (knapp o.l.). */
export function SettingRow({
  icon,
  tint,
  title,
  description,
  action,
  onClick,
  visible,
}: {
  icon?: ReactNode;
  tint?: Tint;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  onClick?: () => void;
  /** false skjuler raden (config-styrt). */
  visible?: boolean;
}) {
  if (visible === false) return null;
  const clickable = !!onClick;
  return (
    <div
      onClick={onClick}
      role={clickable ? "button" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-[var(--kodo-border)] bg-[var(--kodo-surface)] px-4 py-3 transition",
        clickable && "cursor-pointer hover:bg-[var(--kodo-hover)]",
      )}
    >
      {icon != null && <IconTile icon={icon} tint={tint} />}
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold text-[var(--kodo-text)]">
          {title}
        </div>
        {description != null && (
          <div className="mt-0.5 text-[12.5px] leading-snug text-[var(--kodo-muted)]">
            {description}
          </div>
        )}
      </div>
      {action != null && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/** Rød-kantet «Farlig sone»-kort som samler destruktive handlinger. */
export function DangerCard({
  icon,
  title,
  description,
  children,
  visible,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  visible?: boolean;
}) {
  if (visible === false) return null;
  return (
    <div className="rounded-xl border border-[var(--kodo-danger-border)] bg-[var(--kodo-danger-bg)] p-4">
      <div className="flex items-center gap-3">
        {icon != null && <IconTile icon={icon} tint="red" />}
        <div className="text-[14.5px] font-semibold text-[var(--kodo-text)]">
          {title}
        </div>
      </div>
      {description != null && (
        <div className="mt-2 text-[12.5px] text-[var(--kodo-muted)]">
          {description}
        </div>
      )}
      {children != null && (
        <div className="mt-3 flex flex-col gap-2">{children}</div>
      )}
    </div>
  );
}
