"use client";

// Delte biometri-UI-komponenter (port av bankboks Biometric.tsx). Presentasjonelle
// + token-drevet (kun --kodo-*), i18n-frie (all tekst som props). Logikken (PRF-
// kall, wrap/unwrap, blob) eier appen via onEnable/onUnlock. Buttons setter bg
// inline så host-appens globale button/button:hover ikke kaprer dem.
import { useState, type FormEvent } from "react";
import {
  Eye,
  EyeOff,
  Fingerprint,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// BiometricEnableCard — vises inne i appen etter innlogging når biometri ikke er
// aktivert. Krever passord-bekreftelse før nøkkelen bindes.
// ─────────────────────────────────────────────────────────────────────────────

export interface BiometricEnableLabels {
  title: string;
  description: string;
  cta: string;
  confirmTitle: string;
  confirmDescription: string;
  passwordPlaceholder: string;
  submit: string;
  loading: string;
  showPassword: string;
  hidePassword: string;
  close: string;
}

export function BiometricEnableCard({
  onEnable,
  onDismiss,
  labels,
  errorFallback,
}: {
  onEnable: (password: string) => Promise<void>;
  onDismiss: () => void;
  labels: BiometricEnableLabels;
  errorFallback?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || pwd.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await onEnable(pwd);
      // Kortet forsvinner av seg selv når appen ser at biometri er aktivert.
    } catch (err) {
      setError(err instanceof Error ? err.message : (errorFallback ?? ""));
      setBusy(false);
    }
  };

  const card =
    "w-full rounded-xl border border-[var(--kodo-border)] bg-[var(--kodo-surface)] p-4";
  const iconTile =
    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--kodo-border)] bg-[var(--kodo-tint-blue-bg)] text-[var(--kodo-tint-blue-fg)]";

  if (!expanded) {
    return (
      <div className={card}>
        <div className="flex items-center gap-3">
          <div className={iconTile}>
            <Fingerprint className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[var(--kodo-text)]">
              {labels.title}
            </div>
            <div className="mt-0.5 text-[11px] leading-relaxed text-[var(--kodo-muted)]">
              {labels.description}
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              style={{ backgroundColor: "var(--kodo-blue)" }}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition"
            >
              {labels.cta}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label={labels.close}
              style={{ background: "transparent" }}
              className="rounded-md p-1.5 text-[var(--kodo-muted)] transition hover:text-[var(--kodo-text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={card}>
      <div className="mb-4 flex items-start gap-3">
        <div className={iconTile}>
          <Fingerprint className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[var(--kodo-text)]">
            {labels.confirmTitle}
          </div>
          <div className="mt-0.5 text-[11px] leading-relaxed text-[var(--kodo-muted)]">
            {labels.confirmDescription}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          disabled={busy}
          aria-label={labels.close}
          style={{ background: "transparent" }}
          className="rounded-md p-1 text-[var(--kodo-muted)] transition hover:text-[var(--kodo-text)] disabled:opacity-30"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            value={pwd}
            onChange={(e) => {
              setPwd(e.target.value);
              if (error) setError(null);
            }}
            placeholder={labels.passwordPlaceholder}
            className="w-full rounded-lg border border-[var(--kodo-border-strong)] bg-[var(--kodo-surface)] py-2.5 pl-3 pr-10 text-sm text-[var(--kodo-text)] outline-none transition focus:border-[var(--kodo-blue)]"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? labels.hidePassword : labels.showPassword}
            tabIndex={-1}
            style={{ background: "transparent" }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-[var(--kodo-muted)] transition hover:text-[var(--kodo-text)]"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-[var(--kodo-danger-border)] bg-[var(--kodo-danger-bg)] p-2 text-[11px] text-[var(--kodo-tint-red-fg)]">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={busy || pwd.length === 0}
          style={{ backgroundColor: "var(--kodo-blue)" }}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          {busy ? labels.loading : labels.submit}
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BiometricLoginButton — på login-skjermen (via LoginCard biometricSlot) når
// biometri er aktivert. Trigger unlock; appen kobler til /api/login.
// ─────────────────────────────────────────────────────────────────────────────

export function BiometricLoginButton({
  onUnlock,
  label,
  loadingLabel,
  errorFallback,
  disabled,
}: {
  onUnlock: () => Promise<void>;
  label: string;
  loadingLabel: string;
  errorFallback?: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (busy || disabled) return;
    setBusy(true);
    setError(null);
    try {
      await onUnlock();
    } catch (err) {
      setError(err instanceof Error ? err.message : (errorFallback ?? ""));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || disabled}
        style={{ backgroundColor: "var(--kodo-tint-blue-bg)" }}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--kodo-border-strong)] px-4 py-3 text-sm font-semibold text-[var(--kodo-tint-blue-fg)] transition disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Fingerprint className="h-5 w-5" />
        )}
        {busy ? loadingLabel : label}
      </button>
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-[var(--kodo-danger-border)] bg-[var(--kodo-danger-bg)] p-2 text-[11px] text-[var(--kodo-tint-red-fg)]">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
