"use client";

// Delt login-kort (port av bankboks MasterPasswordLogin). Presentasjonelt +
// token-drevet (kun --kodo-*), i18n-fritt (all tekst som props), med slots for
// biometri (over «eller»-skille) og footer (destroy/reset o.l.). Submit-logikken
// eier appen: `onSubmit(password)` kaster ved feil → kortet viser feilteksten.
// Self-contained: øye-knappens bakgrunn settes inline så host-appens globale
// button/button:hover ikke kaprer den.
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, KeyRound, Loader2, ShieldAlert } from "lucide-react";

export interface LoginCardProps {
  /** Tittel (f.eks. ordmerke). */
  title: ReactNode;
  subtitle?: string;
  passwordLabel: string;
  passwordPlaceholder?: string;
  submitLabel: string;
  loadingLabel?: string;
  showPasswordLabel: string;
  hidePasswordLabel: string;
  /** Fallback-feiltekst hvis onSubmit kaster uten melding. */
  errorFallback?: string;
  onSubmit: (password: string) => Promise<void>;
  /** Vises over et «eller»-skille (f.eks. biometri-knapp). */
  biometricSlot?: ReactNode;
  dividerLabel?: string;
  /** Vises under et skille nederst (app-spesifikt, f.eks. reset). */
  footer?: ReactNode;
  autoFocus?: boolean;
}

export function LoginCard({
  title,
  subtitle,
  passwordLabel,
  passwordPlaceholder,
  submitLabel,
  loadingLabel,
  showPasswordLabel,
  hidePasswordLabel,
  errorFallback,
  onSubmit,
  biometricSlot,
  dividerLabel,
  footer,
  autoFocus = true,
}: LoginCardProps) {
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tøm feil når brukeren skriver.
  useEffect(() => {
    setError(null);
  }, [pwd]);

  // bfcache-felle: navigerer vi vekk mens busy=true, fryser nettleseren siden.
  // Tilbake-knappen gjenoppretter «Saving …»-tilstanden. Nullstill ved restore.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setBusy(false);
        setError(null);
      }
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || pwd.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(pwd);
    } catch (err) {
      setError(err instanceof Error ? err.message : (errorFallback ?? ""));
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-[var(--kodo-border-strong)] bg-[var(--kodo-glass)] p-7 shadow-2xl backdrop-blur-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--kodo-border)] bg-[var(--kodo-tint-blue-bg)] text-[var(--kodo-tint-blue-fg)]">
          <KeyRound className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-lg font-semibold tracking-tight text-[var(--kodo-text)]">
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 text-xs text-[var(--kodo-muted)]">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {biometricSlot && (
        <div className="mb-5">
          {biometricSlot}
          {dividerLabel && (
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--kodo-border-strong)]" />
              <span className="text-[10px] uppercase tracking-wider text-[var(--kodo-muted)]">
                {dividerLabel}
              </span>
              <div className="h-px flex-1 bg-[var(--kodo-border-strong)]" />
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--kodo-muted)]">
            {passwordLabel}
          </label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              autoFocus={autoFocus}
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder={passwordPlaceholder}
              className="w-full rounded-lg border border-[var(--kodo-border-strong)] bg-[var(--kodo-surface)] py-2.5 pl-3 pr-10 text-sm text-[var(--kodo-text)] outline-none transition focus:border-[var(--kodo-blue)]"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? hidePasswordLabel : showPasswordLabel}
              tabIndex={-1}
              style={{ background: "transparent" }}
              className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded p-1.5 text-[var(--kodo-muted)] transition hover:text-[var(--kodo-text)]"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-[var(--kodo-danger-border)] bg-[var(--kodo-danger-bg)] p-2.5 text-[11px] text-[var(--kodo-tint-red-fg)]">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={busy || pwd.length === 0}
          style={{ backgroundColor: "var(--kodo-blue)" }}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          {busy ? (loadingLabel ?? submitLabel) : submitLabel}
        </button>
      </form>

      {footer && (
        <div className="mt-6 border-t border-[var(--kodo-border-strong)] pt-4">
          {footer}
        </div>
      )}
    </div>
  );
}
