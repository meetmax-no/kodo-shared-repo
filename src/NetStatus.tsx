"use client";

// Delt tilkoblingsstatus for toppraden (port av bankboks' netBadge via Rapport):
// «offline» = ingen internett (navigator.onLine); «server-error» = nett OK men
// appens helsesjekk (`endpoint`, svarer { ok: true }) svarer ikke; ellers
// «online». Sjekker ved oppstart, online/offline-hendelser, fokus og hvert
// 30. sek. i18n-fritt (tekster som props), kun --kodo-*-tokens.
import { useCallback, useEffect, useState } from "react";
import { CloudOff, ServerCrash, Wifi } from "lucide-react";
import { cn } from "./cn";

export type NetState = "online" | "offline" | "server-error";

export interface NetStatusProps {
  /** Helsesjekk som svarer { ok: true } (standard /api/health). */
  endpoint?: string;
  labels: Record<NetState, string>;
  /** Forklaring ved hover (title). */
  tips?: Record<NetState, string>;
  className?: string;
}

const STYLE: Record<NetState, string> = {
  online: "bg-[var(--kodo-tint-green-bg)] text-[var(--kodo-tint-green-fg)]",
  offline: "bg-[var(--kodo-tint-red-bg)] text-[var(--kodo-tint-red-fg)]",
  "server-error": "bg-[var(--kodo-tint-amber-bg)] text-[var(--kodo-tint-amber-fg)]",
};

export function NetStatus({ endpoint = "/api/health", labels, tips, className }: NetStatusProps) {
  const [net, setNet] = useState<NetState>("online");

  const check = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setNet("offline");
      return;
    }
    try {
      const d = (await fetch(endpoint, { cache: "no-store" }).then((r) => r.json())) as { ok?: boolean };
      setNet(d?.ok ? "online" : "server-error");
    } catch {
      setNet("server-error");
    }
  }, [endpoint]);

  useEffect(() => {
    void check();
    const onOnline = () => void check();
    const onOffline = () => setNet("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("focus", onOnline);
    const id = setInterval(() => void check(), 30_000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("focus", onOnline);
      clearInterval(id);
    };
  }, [check]);

  const Icon = net === "offline" ? CloudOff : net === "server-error" ? ServerCrash : Wifi;

  return (
    <span
      role="status"
      title={tips?.[net]}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[var(--kodo-border-strong)] px-2 py-0.5",
        "text-[10px] font-bold uppercase tracking-wider",
        STYLE[net],
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {labels[net]}
    </span>
  );
}
