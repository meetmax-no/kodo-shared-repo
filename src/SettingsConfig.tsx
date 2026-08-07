"use client";

// Generisk, datadrevet innstillings-renderer. Leser et config-objekt (Master UI)
// → SettingsShell + blokker via `type`. Ingen hardkodet JSX: appen leverer
// ikon-kart + handler-kart, teksten kommer fra i18n (titleKey/descKey → t()).
// «Hønen» — blokkene (egg) defineres som data, ikke kode.
import { type ReactNode } from "react";
import { SettingsShell, type TabDef } from "./SettingsShell";
import { SettingRow, SectionHeader, DangerCard, type Tint } from "./SettingRow";
import { LanguagePicker } from "./LanguagePicker";
import { useLocale } from "./i18n-context";

export type UiBlockType =
  | "row"
  | "section"
  | "danger"
  | "language"
  | "toggle";

export interface UiBlock {
  type: UiBlockType;
  key?: string;
  /** Navn inn i appens ikon-kart. */
  icon?: string;
  tint?: Tint;
  /** i18n-nøkler (aldri literal tekst). */
  titleKey?: string;
  descKey?: string;
  /** Navn inn i appens handler-kart (klikk). */
  action?: string;
  /** Navn inn i appens kontroll-kart (høyre-slot, f.eks. en Switch for `toggle`). */
  control?: string;
  /** i18n-nøkkel for en «Kommer»-badge på høyre side. */
  badgeKey?: string;
  visible?: boolean;
  /** Underrader (for danger). */
  rows?: UiBlock[];
}

export interface UiTab {
  key: string;
  labelKey: string;
  visible?: boolean;
  blocks: UiBlock[];
}

export interface UiSettingsConfig {
  /** Hvilke språk språkvelgeren tilbyr (brukes også av LocaleProvider). */
  languages?: string[];
  tabs: UiTab[];
}

export function SettingsConfig({
  open,
  config,
  icons,
  actions,
  controls,
  title,
  onClose,
}: {
  open: boolean;
  config: UiSettingsConfig;
  /** Navn → ikon-element (app-levert, f.eks. lucide). */
  icons: Record<string, ReactNode>;
  /** Navn → klikk-handler (app-levert). */
  actions: Record<string, () => void>;
  /** Navn → høyre-slot-kontroll (app-levert, f.eks. en Switch for `toggle`). */
  controls?: Record<string, ReactNode>;
  title: ReactNode;
  onClose: () => void;
}) {
  const { t } = useLocale();

  const badge = (key: string) => (
    <span className="rounded-full border border-[var(--kodo-border-strong)] px-2 py-0.5 text-[11px] text-[var(--kodo-muted)]">
      {t(key)}
    </span>
  );

  const renderBlock = (b: UiBlock, i: number): ReactNode => {
    if (b.visible === false) return null;
    const icon = b.icon ? icons[b.icon] : undefined;
    const title = b.titleKey ? t(b.titleKey) : "";
    const description = b.descKey ? t(b.descKey) : undefined;

    if (b.type === "section")
      return <SectionHeader key={i}>{title}</SectionHeader>;

    if (b.type === "language")
      return (
        <SettingRow
          key={i}
          icon={icon}
          tint={b.tint}
          title={title}
          description={description}
          action={<LanguagePicker size="md" />}
        />
      );

    if (b.type === "toggle")
      return (
        <SettingRow
          key={i}
          icon={icon}
          tint={b.tint}
          title={title}
          description={description}
          action={b.control ? controls?.[b.control] : undefined}
        />
      );

    if (b.type === "danger")
      return (
        <div key={i} className="mt-2">
          <DangerCard icon={icon} title={title} description={description}>
            {(b.rows ?? [])
              .filter((r) => r.visible !== false)
              .map((r, j) => (
                <SettingRow
                  key={j}
                  title={r.titleKey ? t(r.titleKey) : ""}
                  description={r.descKey ? t(r.descKey) : undefined}
                  onClick={r.action ? actions[r.action] : undefined}
                />
              ))}
          </DangerCard>
        </div>
      );

    // row
    return (
      <SettingRow
        key={i}
        icon={icon}
        tint={b.tint}
        title={title}
        description={description}
        onClick={b.action ? actions[b.action] : undefined}
        action={b.badgeKey ? badge(b.badgeKey) : undefined}
      />
    );
  };

  const tabs: TabDef[] = config.tabs
    .filter((tb) => tb.visible !== false)
    .map((tb) => ({
      key: tb.key,
      label: tb.labelKey ? t(tb.labelKey) : tb.key,
      render: () => (
        <div className="flex flex-col gap-2.5">
          {tb.blocks.map((b, i) => renderBlock(b, i))}
        </div>
      ),
    }));

  return (
    <SettingsShell open={open} title={title} tabs={tabs} onClose={onClose} />
  );
}
