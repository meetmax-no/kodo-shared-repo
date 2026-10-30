"use client";

// Delt nedtrekksliste (erstatter <select>): samme utseende på iPhone, Android og
// desktop — telefonens egen velger (hjul/dialog) kan ikke styles. Lista åpner seg
// under feltet, eller over hvis det er for lite plass under (f.eks. over bunnlinjen).
// Klikk utenfor, ESC, Tab eller et valg lukker. Tastatur: ↑/↓, Home/End, Enter/mellomrom.
// i18n-fritt (tekster som props), kun --kodo-*, 44 px valg og 16 px tekst på mobil.
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "./cn";
import { kodoField } from "./styles";

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string | number> {
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T | null) => void;
  /** «Ingen»-valg øverst som gir null (f.eks. «Ikke valgt»); vises også når value er null. */
  emptyLabel?: string;
  /** id på knappen — for <label htmlFor>. */
  id?: string;
  disabled?: boolean;
  className?: string;
}

const LIST_MAX = 264; // px — ca. 6 rader à 44 px

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  emptyLabel,
  id,
  disabled,
  className,
}: SelectProps<T>) {
  const listId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const [active, setActive] = useState(0);

  const rows: { value: T | null; label: string }[] =
    emptyLabel != null ? [{ value: null, label: emptyLabel }, ...options] : options;
  const selected = rows.findIndex((r) => r.value === value);
  const current = rows[selected]?.label ?? emptyLabel ?? "";

  function openList() {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setUp(below < LIST_MAX + 16 && rect.top > below);
    }
    setActive(Math.max(selected, 0));
    setOpen(true);
  }

  function choose(i: number) {
    const row = rows[i];
    if (!row) return;
    setOpen(false);
    if (row.value !== value) onChange(row.value);
  }

  // Lukk ved klikk utenfor (som ActionMenu).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Hold aktiv rad synlig inne i lista (uten å rulle selve siden).
  useEffect(() => {
    const list = listRef.current;
    const el = list?.children[active] as HTMLElement | undefined;
    if (!open || !list || !el) return;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
  }, [open, active]);

  // Ved åpning: valgt rad midt i lista.
  useEffect(() => {
    const list = listRef.current;
    const el = list?.children[Math.max(selected, 0)] as HTMLElement | undefined;
    if (open && list && el) list.scrollTop = el.offsetTop - (list.clientHeight - el.offsetHeight) / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onKeyDown(e: KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openList();
      }
      return;
    }
    const last = rows.length - 1;
    const keys: Record<string, () => void> = {
      ArrowDown: () => setActive((i) => Math.min(i + 1, last)),
      ArrowUp: () => setActive((i) => Math.max(i - 1, 0)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(active),
      " ": () => choose(active),
      Escape: () => setOpen(false),
    };
    if (e.key === "Tab") return setOpen(false);
    if (keys[e.key]) {
      e.preventDefault();
      keys[e.key]();
    }
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          kodoField,
          "flex cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        <span className={cn("truncate", value == null && "text-[var(--kodo-muted)]")}>{current}</span>
        <ChevronDown
          aria-hidden
          className={cn("h-4 w-4 shrink-0 text-[var(--kodo-muted)] transition", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          // Modal-flaten over heldekkende bakgrunn: samme tone, men innholdet bak skinner ikke gjennom.
          style={{
            maxHeight: LIST_MAX,
            background: "linear-gradient(var(--kodo-surface-modal), var(--kodo-surface-modal)), var(--kodo-bg)",
          }}
          className={cn(
            "absolute left-0 right-0 z-40 overflow-y-auto rounded-lg border border-[var(--kodo-border-strong)] py-1 shadow-2xl",
            up ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          {rows.map((r, i) => {
            const isSelected = r.value === value;
            return (
              <li
                key={i}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-between gap-2 px-3 text-base sm:min-h-9 sm:text-sm",
                  i === active && "bg-[var(--kodo-hover-strong)]",
                  isSelected
                    ? "font-semibold text-[var(--kodo-accent)]"
                    : r.value == null
                      ? "text-[var(--kodo-muted)]"
                      : "text-[var(--kodo-text)]",
                )}
              >
                <span className="truncate">{r.label}</span>
                {isSelected && <Check aria-hidden className="h-4 w-4 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
